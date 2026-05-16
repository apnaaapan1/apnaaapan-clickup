import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import RemoveMemberConfirmModal from '../components/workspace/RemoveMemberConfirmModal';
import { useWorkspaceRole } from '../hooks/useWorkspaceRole';
import {
  formatMemberRole,
  getMemberAvatarColor,
  getMemberInitials,
} from '../utils/memberDisplay';

export default function WorkspaceSettings() {
  const { workspaceId } = useAuth();
  const [workspace, setWorkspace] = useState(null);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [loading, setLoading] = useState(true);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  const members = workspace?.members || [];
  const { canManageMembers, canRemoveMember } = useWorkspaceRole(members);

  const loadWorkspace = async () => {
    if (!workspaceId) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/workspaces/${workspaceId}`);
      setWorkspace(res.data?.workspace || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load workspace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  const handleConfirmRemove = async () => {
    if (!workspaceId || !removeTarget) return;
    setRemoveLoading(true);
    setActionError('');
    try {
      await api.delete(`/workspaces/${workspaceId}/members/${removeTarget.id}`);
      setRemoveTarget(null);
      await loadWorkspace();
      window.dispatchEvent(new Event('workspace:members-changed'));
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to remove member');
    } finally {
      setRemoveLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="bg-white border-b border-gray-200 -mx-6 -mt-6 px-6 py-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {workspace?.name || 'Workspace Settings'}
        </h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-3">Members</h2>
        <p className="text-sm text-gray-500 mb-4">
          Invites are managed from the Invite popup in the sidebar.
          {canManageMembers ? ' As an owner or admin, you can remove members below.' : ''}
        </p>
        {loading && <p className="text-sm text-gray-500">Loading members...</p>}
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        {actionError && <p className="text-sm text-red-600 mb-3">{actionError}</p>}
        <div className="space-y-3">
          {members.map((member) => {
            const initials = getMemberInitials(member.name, member.email);
            const colorClass = getMemberAvatarColor(member.email || member.name);
            const showRemove = canRemoveMember(member);

            return (
              <div
                key={member.id}
                className="flex items-center justify-between gap-3 border border-gray-100 rounded-lg p-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 shrink-0 rounded-full text-sm font-semibold flex items-center justify-center ${colorClass}`}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {member.name || 'Invited User'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{member.email || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                    {formatMemberRole(member.role)}
                  </span>
                  {showRemove ? (
                    <button
                      type="button"
                      onClick={() => setRemoveTarget(member)}
                      className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <RemoveMemberConfirmModal
        isOpen={Boolean(removeTarget)}
        member={removeTarget}
        loading={removeLoading}
        onClose={() => !removeLoading && setRemoveTarget(null)}
        onConfirm={handleConfirmRemove}
      />
    </div>
  );
}
