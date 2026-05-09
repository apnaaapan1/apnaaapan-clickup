import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import ListViewRow from './ListViewRow';

const groupColors = ['#6366f1', '#3b82f6', '#0ea5e9', '#22c55e', '#f59e0b', '#ef4444'];

export default function ListView({ project, lists, onRefetch, onOpenTask }) {
  const { workspaceId } = useAuth();
  const [tasksByList, setTasksByList] = useState({});
  const [collapsed, setCollapsed] = useState({});
  const [addingTarget, setAddingTarget] = useState(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);
 
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

  const handleCreateTask = async (listId, value, status = 'todo') => {
    const title = value.trim();
    if (!title || creatingTask) return;
    setCreatingTask(true);
    try {
      await api.post(`/workspaces/${workspaceId}/projects/${project.id}/lists/${listId}/tasks`, {
        title,
        priority: 'medium',
        status,
      });
      setTaskTitle('');
      setAddingTarget(null);
      await fetchAllTasks();
      onRefetch();
    } finally {
      setCreatingTask(false);
    }
  };

  const handleCancelCreateTask = () => {
    setAddingTarget(null);
    setTaskTitle('');
  };

  const splitTasksByDefaultOrder = (tasks) => {
    const inProgress = [];
    const todo = [];
    const completed = [];

    tasks.forEach((task) => {
      const status = task.status || 'todo';
      if (status === 'done' || status === 'cancelled') {
        completed.push(task);
      } else if (status === 'in_progress' || status === 'in_review') {
        inProgress.push(task);
      } else {
        todo.push(task);
      }
    });

    return { inProgress, todo, completed };
  };

  if (!lists.length) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">
          No lists yet — open the sidebar, hover your space, click + Add new list to create one.
        </p>
      </div>
    );
  }

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
          const groupedTasks = splitTasksByDefaultOrder(tasks);
          const isCollapsed = collapsed[list.id];
          return (
            <div key={list.id} className={idx > 0 ? 'mt-3 border-t border-gray-200/80' : ''}>
              <button
                onClick={() =>
                  setCollapsed((prev) => ({ ...prev, [list.id]: !prev[list.id] }))
                }
                className="w-full px-4 py-3 text-left border-b border-gray-100 bg-gray-50/60"
                style={{ borderLeft: `4px solid ${groupColors[idx % groupColors.length]}` }}
              >
                <span className="font-bold text-base text-gray-900">{list.name}</span>
              </button>

              {!isCollapsed && (
                <>
                  {[
                    {
                      key: 'inProgress',
                      label: 'In Progress',
                      items: groupedTasks.inProgress,
                      createStatus: 'in_progress',
                      badgeClass: 'text-blue-700 bg-blue-50 border-blue-200',
                    },
                    {
                      key: 'todo',
                      label: 'To Do',
                      items: groupedTasks.todo,
                      createStatus: 'todo',
                      badgeClass: 'text-amber-700 bg-amber-50 border-amber-200',
                    },
                    {
                      key: 'completed',
                      label: 'Completed',
                      items: groupedTasks.completed,
                      createStatus: 'done',
                      badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
                    },
                  ].map((section) => (
                    <div key={`${list.id}-${section.key}`}>
                      <div className="px-4 py-2 border-b border-[#f3f4f6] bg-gray-50/50">
                        <p
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-semibold uppercase tracking-wide ${section.badgeClass}`}
                        >
                          <span>{section.label}</span>
                          <span>{section.items.length}</span>
                        </p>
                      </div>
                      {section.items.map((task) => (
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
                        {addingTarget?.listId === list.id && addingTarget?.sectionKey === section.key ? (
                          <div className="space-y-2">
                            <input
                              autoFocus
                              value={taskTitle}
                              onChange={(e) => setTaskTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                  handleCancelCreateTask();
                                }
                                if (e.key === 'Enter') {
                                  handleCreateTask(list.id, taskTitle, section.createStatus);
                                }
                              }}
                              placeholder="Task name..."
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                            />
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={handleCancelCreateTask}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCreateTask(list.id, taskTitle, section.createStatus)}
                                disabled={!taskTitle.trim() || creatingTask}
                                className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-medium hover:bg-violet-700 disabled:opacity-60 disabled:pointer-events-none"
                              >
                                {creatingTask ? 'Saving...' : 'Save'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setAddingTarget({ listId: list.id, sectionKey: section.key });
                              setTaskTitle('');
                            }}
                            className="text-sm text-gray-500 hover:text-gray-700"
                          >
                            + Add task
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
