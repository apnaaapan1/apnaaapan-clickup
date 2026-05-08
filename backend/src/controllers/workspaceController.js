const pool = require('../config/db');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { consumeInviteToken } = require('../utils/inviteUtils');

const sendInviteEmail = async (email, workspaceName, token) => {
  try {
    const apiBase = process.env.API_URL || `http://localhost:${process.env.PORT || 5000}/api`;
    const acceptLink = `${apiBase}/workspaces/invites/accept/${token}`;

    if (!process.env.SMTP_HOST) {
      console.log(`[INVITE EMAIL] Would send invite to ${email} for workspace: ${workspaceName}`);
      console.log(`[INVITE EMAIL] Accept link: ${acceptLink}`);
      return;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@apnaaapan.com',
      to: email,
      subject: `You've been invited to ${workspaceName}`,
      text: `You have been invited to join the workspace "${workspaceName}" on Apnaaapan ClickUp.\n\nAccept invitation: ${acceptLink}`,
    });
  } catch (err) {
    console.error('Email send error (non-fatal):', err.message);
  }
};

const getWorkspace = async (req, res) => {
  const { workspaceId } = req.params;

  try {
    const workspaceResult = await pool.query(
      'SELECT * FROM workspaces WHERE id = $1',
      [workspaceId]
    );

    if (workspaceResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

    const membersResult = await pool.query(
      `SELECT
         wm.id,
         u.name,
         u.email,
         u.avatar_url,
         wm.role,
         wm.status,
         wm.joined_at
       FROM workspace_members wm
       JOIN users u ON wm.user_id = u.id
       WHERE wm.workspace_id = $1`,
      [workspaceId]
    );

    const workspace = workspaceResult.rows[0];
    workspace.members = membersResult.rows;

    return res.status(200).json({ success: true, workspace });
  } catch (err) {
    console.error('getWorkspace error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateWorkspace = async (req, res) => {
  const { workspaceId } = req.params;
  const { name, logo_url } = req.body;

  try {
    const result = await pool.query(
      `UPDATE workspaces
       SET name = COALESCE($1, name),
           logo_url = COALESCE($2, logo_url),
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [name || null, logo_url || null, workspaceId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

    return res.status(200).json({ success: true, workspace: result.rows[0] });
  } catch (err) {
    console.error('updateWorkspace error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const inviteMember = async (req, res) => {
  const { workspaceId } = req.params;
  const { email, role } = req.body;
  const validRoles = ['admin', 'member', 'viewer'];
  const inviteRole = validRoles.includes(role) ? role : 'member';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Valid email is required' });
  }

  try {
    const workspaceResult = await pool.query(
      'SELECT name FROM workspaces WHERE id = $1',
      [workspaceId]
    );

    if (workspaceResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

    const workspaceName = workspaceResult.rows[0].name;
    const normalizedEmail = email.toLowerCase();
    const existingMember = await pool.query(
      `SELECT wm.id
       FROM workspace_members wm
       JOIN users u ON wm.user_id = u.id
       WHERE wm.workspace_id = $1
         AND LOWER(u.email) = $2`,
      [workspaceId, normalizedEmail]
    );

    if (existingMember.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'User already in workspace' });
    }

    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await pool.query(
      `INSERT INTO workspace_invites (workspace_id, inviter_user_id, invitee_email, role, token, status, expires_at)
       VALUES ($1, $2, $3, $4, $5, 'pending', $6)
       ON CONFLICT (workspace_id, invitee_email)
       DO UPDATE SET
         role = EXCLUDED.role,
         token = EXCLUDED.token,
         status = 'pending',
         expires_at = EXCLUDED.expires_at,
         invited_at = NOW(),
         accepted_at = NULL,
         accepted_by = NULL`,
      [workspaceId, req.user.userId, normalizedEmail, inviteRole, token, expiresAt]
    );

    await sendInviteEmail(normalizedEmail, workspaceName, token);

    return res.status(201).json({ success: true, message: 'Member invited successfully' });
  } catch (err) {
    console.error('inviteMember error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const acceptInviteLink = async (req, res) => {
  const { token } = req.params;

  try {
    const inviteResult = await pool.query(
      `SELECT invitee_email
       FROM workspace_invites
       WHERE token = $1
         AND status = 'pending'
         AND expires_at > NOW()`,
      [token]
    );

    if (inviteResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invite link is invalid or expired' });
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const redirectUrl = `${clientUrl}/login?inviteToken=${token}&email=${encodeURIComponent(inviteResult.rows[0].invitee_email)}`;
    return res.redirect(302, redirectUrl);
  } catch (err) {
    console.error('acceptInviteLink error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const acceptInviteAuthenticated = async (req, res) => {
  const { token } = req.body;
  const userId = req.user.userId;

  if (!token) {
    return res.status(400).json({ success: false, message: 'Invite token is required' });
  }

  try {
    const userResult = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const consumed = await consumeInviteToken({
      token,
      userId,
      email: userResult.rows[0].email,
    });

    if (!consumed) {
      return res.status(400).json({ success: false, message: 'Invite is invalid, expired, or for another email' });
    }

    return res.status(200).json({
      success: true,
      message: 'Invite accepted successfully',
      workspaceId: consumed.workspaceId,
      role: consumed.role,
    });
  } catch (err) {
    console.error('acceptInviteAuthenticated error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateMemberRole = async (req, res) => {
  const { memberId } = req.params;
  const { role } = req.body;

  const validRoles = ['admin', 'member', 'viewer'];
  if (!role || !validRoles.includes(role)) {
    return res.status(400).json({ success: false, message: 'Role must be one of: admin, member, viewer' });
  }

  try {
    const memberResult = await pool.query(
      'SELECT * FROM workspace_members WHERE id = $1',
      [memberId]
    );

    if (memberResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    if (memberResult.rows[0].role === 'owner') {
      return res.status(403).json({ success: false, message: 'Cannot change the owner\'s role' });
    }

    await pool.query(
      'UPDATE workspace_members SET role = $1 WHERE id = $2',
      [role, memberId]
    );

    return res.status(200).json({ success: true, message: 'Role updated' });
  } catch (err) {
    console.error('updateMemberRole error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const removeMember = async (req, res) => {
  const { memberId } = req.params;

  try {
    const memberResult = await pool.query(
      'SELECT * FROM workspace_members WHERE id = $1',
      [memberId]
    );

    if (memberResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    if (memberResult.rows[0].role === 'owner') {
      return res.status(403).json({ success: false, message: 'Cannot remove the workspace owner' });
    }

    await pool.query('DELETE FROM workspace_members WHERE id = $1', [memberId]);

    return res.status(200).json({ success: true, message: 'Member removed' });
  } catch (err) {
    console.error('removeMember error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const leaveWorkspace = async (req, res) => {
  const { workspaceId } = req.params;
  const userId = req.user.userId;

  try {
    const memberResult = await pool.query(
      'SELECT * FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
      [workspaceId, userId]
    );

    if (memberResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'You are not a member of this workspace' });
    }

    if (memberResult.rows[0].role === 'owner') {
      return res.status(403).json({ success: false, message: 'Owner cannot leave. Transfer ownership first.' });
    }

    await pool.query(
      'DELETE FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
      [workspaceId, userId]
    );

    return res.status(200).json({ success: true, message: 'Left workspace successfully' });
  } catch (err) {
    console.error('leaveWorkspace error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getWorkspace,
  updateWorkspace,
  inviteMember,
  acceptInviteLink,
  acceptInviteAuthenticated,
  updateMemberRole,
  removeMember,
  leaveWorkspace,
};
