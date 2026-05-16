export default function RemoveMemberConfirmModal({
  isOpen,
  member,
  loading,
  onClose,
  onConfirm,
}) {
  if (!isOpen || !member) return null;

  const displayName = member.name || member.email || 'this member';

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4"
      onClick={() => !loading && onClose()}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-gray-100 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="remove-member-title"
        aria-modal="true"
      >
        <div className="px-6 pt-6 pb-4">
          <h2 id="remove-member-title" className="text-lg font-semibold text-gray-900">
            Remove from workspace?
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            <span className="font-medium text-gray-900">{displayName}</span> will lose access to this
            workspace and its spaces. This cannot be undone.
          </p>
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Removing…' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  );
}
