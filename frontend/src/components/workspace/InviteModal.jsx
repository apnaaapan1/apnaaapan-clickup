import { useEffect, useRef, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const roles = [
  { value: 'member', label: 'Member', description: 'Can access all public items in your Workspace.' },
  { value: 'admin', label: 'Admin', description: 'Can manage members and workspace-level settings.' },
  { value: 'viewer', label: 'Viewer', description: 'Can view shared items with limited permissions.' },
];

export default function InviteModal({ isOpen, onClose, onInvited, canInvite }) {
  const { workspaceId } = useAuth();
  const [emails, setEmails] = useState('');
  const [role, setRole] = useState('member');
  const [roleOpen, setRoleOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const roleRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onOutsideClick = (e) => {
      if (roleRef.current && !roleRef.current.contains(e.target)) {
        setRoleOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutsideClick);
    return () => document.removeEventListener('mousedown', onOutsideClick);
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedRole = roles.find((r) => r.value === role) || roles[0];

  const handleSubmit = async () => {
    const parsedEmails = emails
      .split(/[,\s]+/)
      .map((e) => e.trim())
      .filter(Boolean);

    if (parsedEmails.length === 0) {
      setError('Please enter at least one email.');
      return;
    }
    if (!canInvite) {
      setError('Only workspace owners and admins can invite members.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');
    try {
      await Promise.all(
        parsedEmails.map((email) =>
          api.post(`/workspaces/${workspaceId}/invite`, { email, role })
        )
      );
      setMessage('Invite sent successfully.');
      setEmails('');
      if (onInvited) onInvited();
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send invite.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-[620px] rounded-2xl bg-white shadow-xl">
        <div className="px-6 pt-6 pb-2 flex items-start justify-between">
          <h2 className="text-4xl font-semibold text-gray-900">Invite people</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200">
            ✕
          </button>
        </div>

        <div className="px-6 pb-6">
          <label className="text-xl text-gray-700 font-medium">Invite by email</label>
          <input
            type="text"
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            placeholder="Email, comma or space separated"
            className="mt-2 w-full h-12 px-4 rounded-xl border border-gray-300 text-lg outline-none focus:ring-2 focus:ring-violet-500/30"
          />

          <div className="mt-6">
            <label className="text-xl text-gray-700 font-medium">Invite as</label>
            <div className="mt-2 rounded-xl border border-gray-200 p-3 flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center text-xl">👤</div>
              <div className="flex-1 min-w-0 relative" ref={roleRef}>
                <button
                  type="button"
                  onClick={() => setRoleOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between text-2xl font-medium text-gray-900 bg-transparent outline-none"
                >
                  <span>{selectedRole.label}</span>
                  <span className="text-sm text-gray-500">▾</span>
                </button>
                {roleOpen && (
                  <div className="absolute left-0 right-0 mt-2 rounded-lg border border-gray-200 bg-white shadow-md z-10 overflow-hidden">
                    {roles.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => {
                          setRole(r.value);
                          setRoleOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                          role === r.value ? 'bg-violet-50 text-violet-700' : 'text-gray-700'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-base text-gray-500 mt-1">{selectedRole.description}</p>
              </div>
            </div>
          </div>

          {!canInvite && (
            <p className="text-sm text-amber-700 mt-3">You do not have permission to invite people. Only owner/admin can invite.</p>
          )}
          {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
          {message && <p className="text-sm text-green-600 mt-3">{message}</p>}

          <div className="mt-8 flex items-center justify-end gap-6">
            <button onClick={onClose} className="text-2xl text-gray-600 hover:text-gray-800">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !canInvite}
              className="h-14 px-7 rounded-xl bg-violet-600 text-white text-2xl font-semibold hover:bg-violet-700 disabled:opacity-60"
            >
              {loading ? 'Sending...' : 'Send invite'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
