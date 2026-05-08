const pool = require('../config/db');

const isUuid = (value) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || '')
  );
};

const isWorkspaceMember = async (req, res, next) => {
  const { workspaceId } = req.params;
  const userId = req.user.userId;

  if (!isUuid(workspaceId)) {
    return res.status(400).json({ success: false, message: 'Invalid workspaceId' });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM workspace_members
       WHERE workspace_id = $1 AND user_id = $2 AND status = 'active'`,
      [workspaceId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    req.member = result.rows[0];
    next();
  } catch (err) {
    console.error('isWorkspaceMember error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const isWorkspaceAdmin = async (req, res, next) => {
  const { workspaceId } = req.params;
  const userId = req.user.userId;

  if (!isUuid(workspaceId)) {
    return res.status(400).json({ success: false, message: 'Invalid workspaceId' });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM workspace_members
       WHERE workspace_id = $1 AND user_id = $2 AND status = 'active'`,
      [workspaceId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const member = result.rows[0];

    if (!['owner', 'admin'].includes(member.role)) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    req.member = member;
    next();
  } catch (err) {
    console.error('isWorkspaceAdmin error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { isWorkspaceMember, isWorkspaceAdmin };
