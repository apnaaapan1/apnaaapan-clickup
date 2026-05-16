import { useEffect, useRef, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const roles = [
  { value: 'member', label: 'Member', description: 'Can access all public items in your Workspace.' },
  { value: 'admin', label: 'Admin', description: 'Can manage members and workspace-level settings.' },
  { value: 'viewer', label: 'Viewer', description: 'Can view shared items with limited permissions.' },
];

function UserIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4.418 0-8 2.015-8 4.5V20a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1.5C20 16.015 16.418 14 12 14Z"
        fill="currentColor"
      />
    </svg>
  );
}

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
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-gray-100 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="invite-modal-title"
        aria-modal="true"
      >
        <div className="flex items-start justify-between px-6 pt-5 pb-1">
          <h2 id="invite-modal-title" className="text-lg font-semibold text-gray-900">
            Invite people
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="px-6 pb-4">
          <label className="mt-4 block text-sm font-medium text-gray-700" htmlFor="invite-emails">
            Invite by email
          </label>
          <input
            id="invite-emails"
            type="text"
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            placeholder="Email, comma or space separated"
            className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-[15px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          />

          <div className="mt-5">
            <span className="block text-sm font-medium text-gray-700">Invite as</span>
            <div className="mt-1.5 flex items-start gap-2.5 rounded-lg border border-gray-200 p-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-violet-50 text-violet-600">
                <UserIcon />
              </div>
              <div className="relative min-w-0 flex-1" ref={roleRef}>
                <button
                  type="button"
                  onClick={() => setRoleOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between gap-2 rounded-md bg-transparent text-left outline-none"
                >
                  <span className="text-sm font-semibold text-gray-900">{selectedRole.label}</span>
                  <span
                    className={`shrink-0 text-xs text-gray-400 transition-transform ${roleOpen ? 'rotate-180' : ''}`}
                    aria-hidden
                  >
                    ▾
                  </span>
                </button>
                {roleOpen && (
                  <div className="absolute left-0 right-0 z-10 mt-1.5 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                    {roles.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => {
                          setRole(r.value);
                          setRoleOpen(false);
                        }}
                        className={`w-full border-b border-gray-100 px-3 py-2.5 text-left last:border-b-0 hover:bg-gray-50 ${
                          role === r.value ? 'bg-violet-50' : ''
                        }`}
                      >
                        <span
                          className={`block text-sm font-medium ${
                            role === r.value ? 'text-violet-700' : 'text-gray-900'
                          }`}
                        >
                          {r.label}
                        </span>
                        <span className="mt-0.5 block text-xs leading-snug text-gray-500">{r.description}</span>
                      </button>
                    ))}
                  </div>
                )}
                <p className="mt-0.5 text-xs leading-snug text-gray-500">{selectedRole.description}</p>
              </div>
            </div>
          </div>

          {!canInvite && (
            <p className="mt-3 text-sm text-amber-700">
              You do not have permission to invite people. Only owner/admin can invite.
            </p>
          )}
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          {message && <p className="mt-3 text-sm text-green-600">{message}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !canInvite}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send invite'}
          </button>
        </div>
      </div>
    </div>
  );
}
