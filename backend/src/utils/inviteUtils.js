const pool = require('../config/db');

const consumeInviteToken = async ({ token, userId, email }) => {
  if (!token || !userId || !email) return null;

  const inviteResult = await pool.query(
    `SELECT id, workspace_id, role, invitee_email
     FROM workspace_invites
     WHERE token = $1
       AND status = 'pending'
       AND expires_at > NOW()`,
    [token]
  ).catch(() => ({ rows: [] }));

  if (inviteResult.rows.length === 0) return null;

  const invite = inviteResult.rows[0];
  if (invite.invitee_email.toLowerCase() !== email.toLowerCase()) {
    return null;
  }

  const existingMember = await pool.query(
    'SELECT id FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
    [invite.workspace_id, userId]
  );

  if (existingMember.rows.length === 0) {
    await pool.query(
      `INSERT INTO workspace_members (workspace_id, user_id, role, status)
       VALUES ($1, $2, $3, 'active')`,
      [invite.workspace_id, userId, invite.role]
    );
  }

  await pool.query(
    `UPDATE workspace_invites
     SET status = 'accepted',
         accepted_at = NOW(),
         accepted_by = $1
     WHERE id = $2`,
    [userId, invite.id]
  );

  return { workspaceId: invite.workspace_id, role: invite.role };
};

module.exports = { consumeInviteToken };
