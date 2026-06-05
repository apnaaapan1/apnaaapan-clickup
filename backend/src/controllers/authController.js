const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const pool = require('../config/db');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateTokens');
const jwt = require('jsonwebtoken');
const { consumeInviteToken } = require('../utils/inviteUtils');
const { verifyFirebaseToken } = require('../config/firebaseAdmin');

const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, email, password, inviteToken } = req.body;

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userResult = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, hashedPassword]
    );
    const user = userResult.rows[0];

    let workspaceId = null;
    const consumedInvite = await consumeInviteToken({
      token: inviteToken,
      userId: user.id,
      email: user.email,
    });

    if (consumedInvite?.workspaceId) {
      workspaceId = consumedInvite.workspaceId;
    } else {
      const slug = `${name.toLowerCase().replace(/\s+/g, '-')}-${Math.random().toString(36).slice(2, 8)}`;
      const workspaceResult = await pool.query(
        "INSERT INTO workspaces (name, slug, owner_id) VALUES ($1, $2, $3) RETURNING id",
        [`${name}'s Workspace`, slug, user.id]
      );
      workspaceId = workspaceResult.rows[0].id;

      await pool.query(
        "INSERT INTO workspace_members (workspace_id, user_id, role, status) VALUES ($1, $2, 'owner', 'active')",
        [workspaceId, user.id]
      );
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, expiresAt]
    );

    return res.status(201).json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email },
      accessToken,
      refreshToken,
      workspaceId,
    });
  } catch (err) {
    console.error('Register error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password, inviteToken } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    const consumedInvite = await consumeInviteToken({
      token: inviteToken,
      userId: user.id,
      email: user.email,
    });

    const workspaceMembership = await pool.query(
      `SELECT workspace_id
       FROM workspace_members
       WHERE user_id = $1 AND status = 'active'
       ORDER BY
         CASE role
           WHEN 'owner' THEN 1
           WHEN 'admin' THEN 2
           WHEN 'member' THEN 3
           ELSE 4
         END,
         joined_at ASC
       LIMIT 1`,
      [user.id]
    );
    const workspaceId = consumedInvite?.workspaceId || workspaceMembership.rows[0]?.workspace_id || null;

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, expiresAt]
    );

    return res.status(200).json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email },
      accessToken,
      refreshToken,
      workspaceId,
    });
  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const refreshToken = async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    return res.status(400).json({ success: false, message: 'Refresh token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const result = await pool.query(
      'SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const accessToken = generateAccessToken(decoded.userId);

    return res.status(200).json({ success: true, accessToken });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
};

const logout = async (req, res) => {
  const { refreshToken: token } = req.body;

  if (token) {
    await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
  }

  return res.status(200).json({ success: true, message: 'Logged out successfully' });
};

const me = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error('Me error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const googleAuth = async (req, res) => {
  const { idToken, inviteToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ success: false, message: 'Google ID token is required' });
  }

  try {
    const decoded = await verifyFirebaseToken(idToken);
    const email = decoded.email;

    if (!email || !decoded.email_verified) {
      return res.status(401).json({ success: false, message: 'Google account email is not verified' });
    }

    let userResult = await pool.query('SELECT id, name, email FROM users WHERE email = $1', [email]);
    let user = userResult.rows[0];

    if (!user) {
      const defaultPasswordHash = await bcrypt.hash(`${decoded.uid}-${Date.now()}`, 10);
      const displayName = decoded.name || email.split('@')[0];

      const createdUserResult = await pool.query(
        'INSERT INTO users (name, email, password_hash, is_verified) VALUES ($1, $2, $3, true) RETURNING id, name, email',
        [displayName, email, defaultPasswordHash]
      );
      user = createdUserResult.rows[0];
    }

    const consumedInvite = await consumeInviteToken({
      token: inviteToken,
      userId: user.id,
      email: user.email,
    });

    const workspaceMembership = await pool.query(
      `SELECT workspace_id
       FROM workspace_members
       WHERE user_id = $1 AND status = 'active'
       ORDER BY
         CASE role
           WHEN 'owner' THEN 1
           WHEN 'admin' THEN 2
           WHEN 'member' THEN 3
           ELSE 4
         END,
         joined_at ASC
       LIMIT 1`,
      [user.id]
    );

    let workspaceId = consumedInvite?.workspaceId || workspaceMembership.rows[0]?.workspace_id || null;

    if (!workspaceId) {
      const slug = `${user.name.toLowerCase().replace(/\s+/g, '-')}-${Math.random().toString(36).slice(2, 8)}`;
      const workspaceResult = await pool.query(
        "INSERT INTO workspaces (name, slug, owner_id) VALUES ($1, $2, $3) RETURNING id",
        [`${user.name}'s Workspace`, slug, user.id]
      );
      workspaceId = workspaceResult.rows[0].id;

      await pool.query(
        "INSERT INTO workspace_members (workspace_id, user_id, role, status) VALUES ($1, $2, 'owner', 'active')",
        [workspaceId, user.id]
      );
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, expiresAt]
    );

    return res.status(200).json({
      success: true,
      user,
      accessToken,
      refreshToken,
      workspaceId,
    });
  } catch (err) {
    console.error('Google auth error:', err.message);
    const isDbError =
      err.code === 'ENOTFOUND' ||
      err.code === 'ECONNREFUSED' ||
      /tenant\/user|getaddrinfo|connection terminated/i.test(err.message);
    const message = isDbError
      ? 'Database unavailable. Check Supabase project status and DATABASE_URL on Vercel.'
      : 'Google login failed';
    return res.status(isDbError ? 503 : 500).json({ success: false, message });
  }
};

module.exports = { register, login, googleAuth, refreshToken, logout, me };
