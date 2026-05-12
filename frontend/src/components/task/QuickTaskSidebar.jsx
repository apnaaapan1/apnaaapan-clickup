import api from '../../api/axios';
import AddTaskInput from '../kanban/AddTaskInput';

export default function QuickTaskSidebar({
  isOpen,
  onClose,
  workspaceId,
  projectId,
  list,
  spaceName,
  onCreated,
}) {
  if (!isOpen || !list || !workspaceId || !projectId) return null;

  const handleSubmit = async (payload) => {
    await api.post(
      `/workspaces/${workspaceId}/projects/${projectId}/lists/${list.id}/tasks`,
      {
        title: payload.title,
        description: payload.description || null,
        assignee_id: payload.assignee_id || null,
        due_date: payload.due_date || null,
        priority: payload.priority || 'medium',
      }
    );
    onCreated?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[88] flex justify-end" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/35"
        aria-label="Close panel"
        onClick={onClose}
      />
      <aside
        className="relative flex h-full w-full max-w-md flex-col border-l border-gray-200 bg-white shadow-2xl"
        role="dialog"
        aria-labelledby="quick-task-sidebar-title"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div className="min-w-0">
            <h2 id="quick-task-sidebar-title" className="text-lg font-semibold text-gray-900">
              New task
            </h2>
            <p className="mt-1 text-sm text-gray-500 truncate">
              {spaceName ? `${spaceName} · ` : ''}
              {list.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <AddTaskInput
            disableOutsideClose
            onSubmit={handleSubmit}
            onCancel={onClose}
          />
        </div>
      </aside>
    </div>
  );
}
