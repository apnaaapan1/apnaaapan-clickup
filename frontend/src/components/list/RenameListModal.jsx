import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function RenameListModal({ isOpen, onClose, projectId, list, onRenamed }) {
  const { workspaceId } = useAuth();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setError('');
      return;
    }
    setName(list?.name || '');
  }, [isOpen, list?.id, list?.name]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !list || !projectId) return null;

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('List name is required');
      return;
    }
    if (!workspaceId) {
      setError('Workspace not loaded.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.patch(`/workspaces/${workspaceId}/projects/${projectId}/lists/${list.id}`, {
        name: trimmed,
      });
      onRenamed?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to rename list');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[87] flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-100"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="rename-list-title"
        aria-modal="true"
      >
        <div className="px-6 pt-6 pb-4">
          <h2 id="rename-list-title" className="text-lg font-semibold text-gray-900">
            Rename list
          </h2>
          <label className="mt-4 block text-sm font-medium text-gray-700" htmlFor="rename-list-input">
            Name
          </label>
          <input
            id="rename-list-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-[15px] text-gray-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            autoFocus
            maxLength={200}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
            }}
          />
          {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
