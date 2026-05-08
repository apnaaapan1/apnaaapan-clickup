import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function WorkspaceSettings() {
  const { workspaceId } = useAuth();
  const [workspace, setWorkspace] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="p-6">
      <div className="bg-white border-b border-gray-200 -mx-6 -mt-6 px-6 py-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {workspace?.name || 'Workspace Settings'}
        </h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-3">Members</h2>
        <p className="text-sm text-gray-500 mb-4">Invites are managed from the Invite popup in the sidebar.</p>
        {loading && <p className="text-sm text-gray-500">Loading members...</p>}
        <div className="space-y-3">
          {(workspace?.members || []).map((member) => (
            <div key={member.id} className="flex items-center justify-between border border-gray-100 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold flex items-center justify-center">
                  {(member.name || member.email || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{member.name || 'Invited User'}</p>
                  <p className="text-xs text-gray-500">{member.email || '-'}</p>
                </div>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 capitalize">
                {member.role}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
