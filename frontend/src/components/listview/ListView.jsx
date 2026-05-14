import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import ListViewRow from './ListViewRow';

const statusSections = [
  {
    key: 'inProgress',
    label: 'IN PROGRESS',
    createStatus: 'in_progress',
    dotColor: '#3b82f6',
    badgeBg: 'bg-blue-600',
    badgeText: 'text-white',
    iconBg: 'bg-blue-600',
  },
  {
    key: 'todo',
    label: 'TO DO',
    createStatus: 'todo',
    dotColor: '#9ca3af',
    badgeBg: 'bg-gray-100',
    badgeText: 'text-gray-600',
    iconBg: 'bg-gray-400',
  },
  {
    key: 'completed',
    label: 'COMPLETE',
    createStatus: 'done',
    dotColor: '#22c55e',
    badgeBg: 'bg-emerald-600',
    badgeText: 'text-white',
    iconBg: 'bg-emerald-600',
  },
];

export default function ListView({ project, lists, onRefetch, onOpenTask }) {
  const { workspaceId } = useAuth();
  const [tasksByList, setTasksByList] = useState({});
  const [collapsedSections, setCollapsedSections] = useState({});
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

  useEffect(() => {
    const onTasksChanged = () => fetchAllTasks();
    window.addEventListener('tasks:changed', onTasksChanged);
    return () => window.removeEventListener('tasks:changed', onTasksChanged);
  }, []);

  const handleCreateTask = async (listId, value, status = 'todo') => {
    const title = value.trim();
    if (!title || creatingTask) return;
    setCreatingTask(true);
    try {
      const res = await api.post(`/workspaces/${workspaceId}/projects/${project.id}/lists/${listId}/tasks`, {
        title,
        priority: 'medium',
        status,
      });

      const newTask = res.data?.task;
      if (newTask) {
        setTasksByList((prev) => ({
          ...prev,
          [listId]: [...(prev[listId] || []), newTask],
        }));
      }

      setTaskTitle('');
      setAddingTarget(null);

      fetchAllTasks();
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

  const toggleSection = (sectionId) => {
    setCollapsedSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  if (!lists.length) {
    return (
      <div className="p-6">
        <p className="text-[15px] text-gray-500">
          No lists yet — open the sidebar, hover your space, click + Add new list to create one.
        </p>
      </div>
    );
  }

  const allTasks = lists.flatMap((list) => tasksByList[list.id] || []);
  const groupedTasks = splitTasksByDefaultOrder(allTasks);

  return (
    <div className="px-6 py-4 bg-white">
      {statusSections.map((section) => {
        const items = groupedTasks[section.key] || [];
        const sectionId = section.key;
        const isCollapsed = collapsedSections[sectionId];

        return (
          <div key={sectionId} className="mb-6">
            {/* Section header row */}
            <div className="flex items-center gap-2 mb-1 px-1">
              <button
                type="button"
                onClick={() => toggleSection(sectionId)}
                className="p-0.5 text-gray-400 hover:text-gray-600 transition-transform"
              >
                <svg
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </button>

              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[12px] font-bold tracking-wider ${section.badgeBg} ${section.badgeText}`}
              >
                <span
                  className={`w-[14px] h-[14px] rounded-full border-2 border-current flex items-center justify-center`}
                >
                  {section.key === 'inProgress' && (
                    <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 16 16">
                      <circle cx="8" cy="4" r="1.5" />
                      <circle cx="8" cy="8" r="1.5" />
                      <circle cx="8" cy="12" r="1.5" />
                    </svg>
                  )}
                  {section.key === 'completed' && (
                    <svg className="w-2 h-2" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 16 16">
                      <path d="M3 8l3.5 3.5L13 4" />
                    </svg>
                  )}
                </span>
                {section.label}
              </span>

              <span className="text-sm font-medium text-gray-400 ml-1">{items.length}</span>
            </div>

            {!isCollapsed && (
              <>
                {/* Column headers */}
                <div className="flex items-center px-4 py-2 text-[13px] font-medium text-gray-400 border-b border-gray-100">
                  <div className="flex-1 pl-7">Name</div>
                  <div className="w-[130px] text-center">Assignee</div>
                  <div className="w-[130px]">Due date</div>
                  <div className="w-[130px]">Priority</div>
                </div>

                {/* Task rows */}
                {items.map((task) => (
                  <ListViewRow
                    key={task.id}
                    task={task}
                    projectId={project.id}
                    sectionColor={section.dotColor}
                    sectionKey={section.key}
                    onRefetch={fetchAllTasks}
                    onOpenTask={onOpenTask}
                  />
                ))}

                {/* Add task row */}
                <div className="px-4 py-2">
                  {addingTarget === sectionId ? (
                    <div className="flex items-center gap-2 pl-7">
                      <input
                        autoFocus
                        value={taskTitle}
                        onChange={(e) => setTaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') handleCancelCreateTask();
                          if (e.key === 'Enter') {
                            const listId = lists[0]?.id;
                            if (listId) handleCreateTask(listId, taskTitle, section.createStatus);
                          }
                        }}
                        placeholder="Task name..."
                        className="flex-1 px-3 py-1.5 rounded border border-gray-200 text-[14px] outline-none focus:border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={handleCancelCreateTask}
                        className="px-3 py-1.5 rounded text-sm text-gray-500 hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const listId = lists[0]?.id;
                          if (listId) handleCreateTask(listId, taskTitle, section.createStatus);
                        }}
                        disabled={!taskTitle.trim() || creatingTask}
                        className="px-3 py-1.5 rounded bg-violet-600 text-white text-sm hover:bg-violet-700 disabled:opacity-60"
                      >
                        {creatingTask ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setAddingTarget(sectionId);
                        setTaskTitle('');
                      }}
                      className="text-[14px] text-gray-400 hover:text-gray-600 pl-7 flex items-center gap-1.5 py-1"
                    >
                      <span className="text-[16px] leading-none">+</span>
                      <span>Add Task</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
