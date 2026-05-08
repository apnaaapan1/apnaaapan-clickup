import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import ListViewRow from './ListViewRow';

const groupColors = ['#6366f1', '#3b82f6', '#0ea5e9', '#22c55e', '#f59e0b', '#ef4444'];

export default function ListView({ project, lists, onRefetch, onOpenTask }) {
  const { workspaceId } = useAuth();
  const [tasksByList, setTasksByList] = useState({});
  const [collapsed, setCollapsed] = useState({});
  const [addingListId, setAddingListId] = useState(null);
  const [taskTitle, setTaskTitle] = useState('');

  const fetchAllTasks = async () => {
    if (!workspaceId || !project?.id) return;
    const entries = await Promise.all(
      lists.map(async (list) => {
        try {
          const res = await api.get(
            `/workspaces/${workspaceId}/projects/${project.id}/lists/${list.id}/tasks`
          );
          return [list.id, res.data?.tasks || []];
        } catch {
          return [list.id, []];
        }
      })
    );
    setTasksByList(Object.fromEntries(entries));
  };

  useEffect(() => {
    fetchAllTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, project?.id, lists.map((l) => l.id).join(',')]);

  const handleCreateTask = async (listId, value) => {
    const title = value.trim();
    if (!title) return;
    await api.post(`/workspaces/${workspaceId}/projects/${project.id}/lists/${listId}/tasks`, {
      title,
      priority: 'medium',
    });
    setTaskTitle('');
    setAddingListId(null);
    await fetchAllTasks();
    onRefetch();
  };

  return (
    <div className="p-6">
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="sticky top-0 bg-white border-b border-[#e5e7eb] px-4 py-2 z-10">
          <div className="flex items-center text-xs uppercase text-gray-500">
            <div className="flex-1">Task name</div>
            <div className="w-[80px] text-center">Assignee</div>
            <div className="w-[100px]">Due date</div>
            <div className="w-[90px]">Priority</div>
            <div className="w-[110px]">Status</div>
          </div>
        </div>

        {lists.map((list, idx) => {
          const tasks = tasksByList[list.id] || [];
          const isCollapsed = collapsed[list.id];
          return (
            <div key={list.id}>
              <button
                onClick={() =>
                  setCollapsed((prev) => ({ ...prev, [list.id]: !prev[list.id] }))
                }
                className="w-full px-4 py-3 text-left border-b border-gray-100 bg-gray-50/60"
                style={{ borderLeft: `4px solid ${groupColors[idx % groupColors.length]}` }}
              >
                <span className="font-semibold text-sm text-gray-800">{list.name}</span>
              </button>

              {!isCollapsed && (
                <>
                  {tasks.map((task) => (
                    <ListViewRow
                      key={task.id}
                      task={task}
                      projectId={project.id}
                      onRefetch={async () => {
                        await fetchAllTasks();
                        onRefetch();
                      }}
                      onOpenTask={onOpenTask}
                    />
                  ))}

                  <div className="px-4 py-2 border-b border-[#f3f4f6]">
                    {addingListId === list.id ? (
                      <input
                        autoFocus
                        value={taskTitle}
                        onChange={(e) => setTaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setAddingListId(null);
                            setTaskTitle('');
                          }
                          if (e.key === 'Enter') {
                            handleCreateTask(list.id, taskTitle);
                          }
                        }}
                        placeholder="Task name..."
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                      />
                    ) : (
                      <button
                        onClick={() => setAddingListId(list.id)}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        + Add task
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
