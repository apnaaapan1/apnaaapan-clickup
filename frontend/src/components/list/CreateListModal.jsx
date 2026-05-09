import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function CreateListModal({
  isOpen,
  onClose,
  projects,
  defaultProjectId,
  onCreated,
}) {
  const { workspaceId } = useAuth();
  const [name, setName] = useState('');
  const [projectId, setProjectId] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setError('');
      setIsPrivate(false);
      return;
    }
    setProjectId(defaultProjectId || projects[0]?.id || '');
  }, [isOpen, defaultProjectId, projects]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  if (!projects?.length) {
    return (
      <div className="fixed inset-0 z-[86] flex items-center justify-center p-4 bg-black/40">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-6">
          <p className="text-gray-800 mb-4">Create a space first, then you can add lists.</p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const selectedProject = projects.find((p) => p.id === projectId);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Name is required');
      return;
    }
    if (!workspaceId || !projectId) {
      setError('Space not selected');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.post(`/workspaces/${workspaceId}/projects/${projectId}/lists`, {
        name: trimmed,
      });
      onCreated?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create list');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[86] flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-100"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="create-list-title"
        aria-modal="true"
      >
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <h2 id="create-list-title" className="text-lg font-semibold text-gray-900">
              Create List
            </h2>
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
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your list or project name"
                className="w-full h-11 px-3 rounded-xl border border-violet-400 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-500"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Space (location)</label>
              <div className="relative">
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full h-11 pl-11 pr-10 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white appearance-none outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded bg-teal-500 text-white text-[11px] font-semibold flex items-center justify-center pointer-events-none"
                  aria-hidden
                >
                  {(selectedProject?.name || 'S').trim().charAt(0).toUpperCase()}
                </span>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  ▾
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 py-1">
              <div>
                <p className="text-sm font-semibold text-gray-900">Make private</p>
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

        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl">
          <div className="flex items-center gap-3">
            {error && <p className="text-sm text-red-600 max-w-[180px] text-right">{error}</p>}
            <button
              type="button"
              onClick={handleCreate}
              disabled={loading}
              className="h-10 px-6 rounded-xl bg-violet-500 hover:bg-violet-600 text-white text-sm font-semibold disabled:opacity-60"
            >
              {loading ? 'Creating…' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
