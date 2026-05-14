import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import useWorkspaceMembers from '../../hooks/useWorkspaceMembers';

export default function TaskModal({ taskId, listId, projectId, onClose, onRefetch }) {
  const { workspaceId } = useAuth();
  const { members } = useWorkspaceMembers();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [newSubtask, setNewSubtask] = useState('');

  const fetchTask = async ({ withLoader = true } = {}) => {
    if (!workspaceId || !projectId || !taskId || !listId) return;
    if (withLoader) setLoading(true);
    try {
      const res = await api.get(
        `/workspaces/${workspaceId}/projects/${projectId}/lists/${listId}/tasks/${taskId}`
      );
      const t = res.data?.task;
      setTask(t);
      setTitle(t?.title || '');
      setDescription(t?.description || '');
    } finally {
      if (withLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, projectId, taskId, listId]);

  const updateTask = async (payload) => {
    setTask((prev) => (prev ? { ...prev, ...payload } : prev));
    await api.patch(
      `/workspaces/${workspaceId}/projects/${projectId}/lists/${listId}/tasks/${taskId}`,
      payload
    );
    await fetchTask({ withLoader: false });
    window.dispatchEvent(new Event('tasks:changed'));
  };

  const createdAt = useMemo(
    () => (task?.created_at ? format(new Date(task.created_at), 'MMM d, yyyy') : '-'),
    [task?.created_at]
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/30">
      <div className="fixed right-0 top-0 h-screen w-[min(100vw,720px)] bg-white shadow-xl translate-x-0 transition-transform duration-300 overflow-y-auto">
        <div className="p-5 border-b border-gray-200 flex justify-end shrink-0">
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1" aria-label="Close">
            ✕
          </button>
        </div>

        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="p-5 space-y-6">
            <section>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => {
                  if (title.trim() && title !== task?.title) updateTask({ title: title.trim() });
                }}
                className="w-full text-[22px] font-semibold text-gray-900 outline-none border-b border-gray-200 pb-1 focus:border-gray-300"
                placeholder="Task name"
              />
            </section>

            <section className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Status</p>
                <select
                  value={task?.status || 'todo'}
                  onChange={(e) => updateTask({ status: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white"
                >
                  <option value="todo">todo</option>
                  <option value="in_progress">in_progress</option>
                  <option value="in_review">in_review</option>
                  <option value="done">done</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Priority</p>
                <select
                  value={task?.priority || 'medium'}
                  onChange={(e) => updateTask({ priority: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white"
                >
                  <option value="urgent">urgent</option>
                  <option value="high">high</option>
                  <option value="medium">medium</option>
                  <option value="low">low</option>
                  <option value="none">none</option>
                </select>
              </div>
            </section>

            <section className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Assignee</p>
                <select
                  value={task?.assignee_id || ''}
                  onChange={(e) => updateTask({ assignee_id: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.user_id || m.id} value={m.user_id || m.id}>
                      {m.name} ({m.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Due date</p>
                <input
                  type="date"
                  value={task?.due_date ? new Date(task.due_date).toISOString().slice(0, 10) : ''}
                  onChange={(e) => updateTask({ due_date: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <p className="text-xs text-gray-500">Created by</p>
                <p className="text-sm text-gray-800 mt-1">
                  {task?.created_by_name || task?.created_by || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Created at</p>
                <p className="text-sm text-gray-800 mt-1">{createdAt}</p>
              </div>
            </section>

            <section>
              <p className="text-sm font-medium text-gray-700 mb-2">Description</p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => {
                  if (description !== (task?.description || '')) {
                    updateTask({ description });
                  }
                }}
                placeholder="Add a description..."
                className="w-full min-h-[120px] px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </section>

            <section>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Subtasks ({task?.subtasks?.length || 0})
              </p>
              <div className="space-y-2">
                {(task?.subtasks || []).map((sub) => (
                  <label key={sub.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={sub.status === 'done'}
                      onChange={() =>
                        api
                          .patch(
                            `/workspaces/${workspaceId}/projects/${projectId}/lists/${listId}/tasks/${sub.id}`,
                            { status: sub.status === 'done' ? 'todo' : 'done' }
                          )
                          .then(() => fetchTask({ withLoader: false }))
                      }
                    />
                    <span className={sub.status === 'done' ? 'line-through text-gray-400' : ''}>
                      {sub.title}
                    </span>
                  </label>
                ))}
                <input
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newSubtask.trim()) {
                      api
                        .post(
                          `/workspaces/${workspaceId}/projects/${projectId}/lists/${listId}/tasks`,
                          { title: newSubtask.trim(), parent_task_id: taskId }
                        )
                        .then(() => {
                          setNewSubtask('');
                          fetchTask({ withLoader: false });
                        });
                    }
                  }}
                  placeholder="+ Add subtask"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
            </section>

            <section className="pt-4 border-t border-gray-100">
              <button
                onClick={async () => {
                  if (!window.confirm('Delete this task?')) return;
                  await api.delete(
                    `/workspaces/${workspaceId}/projects/${projectId}/lists/${listId}/tasks/${taskId}`
                  );
                  onClose();
                  onRefetch();
                }}
                className="px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
              >
                Delete task
              </button>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
