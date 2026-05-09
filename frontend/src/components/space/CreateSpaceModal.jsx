import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const PERMISSION_OPTIONS = [
  { value: 'full', label: 'Full edit' },
  { value: 'edit', label: 'Can edit' },
  { value: 'view', label: 'Can view' },
];

export default function CreateSpaceModal({ isOpen, onClose, onCreated }) {
  const { workspaceId } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [defaultPermission, setDefaultPermission] = useState('full');
  const [permissionOpen, setPermissionOpen] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setDescription('');
      setDefaultPermission('full');
      setIsPrivate(false);
      setPermissionOpen(false);
      setError('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !permissionOpen) return undefined;
    const onDown = (e) => {
      if (!e.target.closest?.('[data-permission-dropdown]')) {
        setPermissionOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [isOpen, permissionOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const iconLetter = (name.trim().charAt(0) || 'S').toUpperCase();
  const selectedPerm = PERMISSION_OPTIONS.find((o) => o.value === defaultPermission) || PERMISSION_OPTIONS[0];

  const handleContinue = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Space name is required');
      return;
    }
    if (!workspaceId) {
      setError('Workspace not loaded. Please re-login once.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.post(`/workspaces/${workspaceId}/projects`, {
        name: trimmed,
        description: description.trim() || null,
        color: '#6366f1',
      });
      onCreated?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create space');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-100"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="create-space-title"
        aria-modal="true"
      >
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="create-space-title" className="text-lg font-semibold text-gray-900">
                Create a Space
              </h2>
              <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">
                A Space represents teams, departments, or groups, each with its own Lists, workflows, and
                settings.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 w-9 h-9 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center text-sm"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Icon &amp; name</label>
              <div className="flex items-center gap-3">
                <div
                  className="shrink-0 w-10 h-10 rounded-lg bg-emerald-500 text-white text-sm font-semibold flex items-center justify-center select-none"
                  aria-hidden
                >
                  {iconLetter}
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Marketing, Engineering, HR"
                  className="flex-1 min-w-0 h-10 px-3 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-2">Description (optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400"
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0 text-sm text-gray-800">
                <span className="text-base shrink-0" aria-hidden>
                  👤
                </span>
                <span className="font-medium">Default permission</span>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600"
                  title="Default access level for people added to this Space."
                  aria-label="About default permission"
                >
                  ⓘ
                </button>
              </div>
              <div className="relative shrink-0" data-permission-dropdown>
                <button
                  type="button"
                  onClick={() => setPermissionOpen((o) => !o)}
                  className="flex items-center gap-2 h-9 px-3 rounded-lg border border-gray-200 text-sm text-gray-800 bg-white hover:bg-gray-50 min-w-[7rem] justify-between"
                >
                  <span className="truncate">{selectedPerm.label}</span>
                  <svg className="w-4 h-4 text-gray-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                {permissionOpen && (
                  <ul className="absolute right-0 top-full mt-1 z-10 w-full min-w-[10rem] rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                    {PERMISSION_OPTIONS.map((opt) => (
                      <li key={opt.value}>
                        <button
                          type="button"
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                            opt.value === defaultPermission ? 'font-medium text-violet-700' : 'text-gray-800'
                          }`}
                          onClick={() => {
                            setDefaultPermission(opt.value);
                            setPermissionOpen(false);
                          }}
                        >
                          {opt.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 py-1">
              <div>
                <p className="text-sm font-semibold text-gray-900">Make Private</p>
                <p className="text-xs text-gray-500 mt-0.5">Only you and invited members have access</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isPrivate}
                onClick={() => setIsPrivate((v) => !v)}
                className={`relative h-7 w-11 shrink-0 rounded-full transition-colors ${
                  isPrivate ? 'bg-violet-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                    isPrivate ? 'translate-x-4' : ''
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between gap-3 rounded-b-2xl bg-white">
          <button
            type="button"
            className="text-sm text-gray-500 hover:text-gray-800"
            title="Coming soon"
          >
            Use Templates
          </button>
          <div className="flex items-center gap-3">
            {error && <p className="text-sm text-red-600 max-w-[200px] text-right">{error}</p>}
            <button
              type="button"
              onClick={handleContinue}
              disabled={loading}
              className="h-10 px-6 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-60 disabled:pointer-events-none"
            >
              {loading ? 'Creating…' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
