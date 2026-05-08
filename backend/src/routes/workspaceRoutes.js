const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { isWorkspaceMember, isWorkspaceAdmin } = require('../middleware/workspaceMiddleware');
const {
  getWorkspace,
  updateWorkspace,
  inviteMember,
  acceptInviteLink,
  acceptInviteAuthenticated,
  updateMemberRole,
  removeMember,
  leaveWorkspace,
} = require('../controllers/workspaceController');

const router = express.Router();

router.get('/invites/accept/:token', acceptInviteLink);
router.post('/invites/accept', authMiddleware, acceptInviteAuthenticated);

router.get('/:workspaceId', authMiddleware, isWorkspaceMember, getWorkspace);

router.patch('/:workspaceId', authMiddleware, isWorkspaceMember, isWorkspaceAdmin, updateWorkspace);

router.post('/:workspaceId/invite', authMiddleware, isWorkspaceMember, isWorkspaceAdmin, inviteMember);

router.patch('/:workspaceId/members/:memberId', authMiddleware, isWorkspaceMember, isWorkspaceAdmin, updateMemberRole);

router.delete('/:workspaceId/members/:memberId', authMiddleware, isWorkspaceMember, isWorkspaceAdmin, removeMember);

router.delete('/:workspaceId/leave', authMiddleware, isWorkspaceMember, leaveWorkspace);

module.exports = router;
