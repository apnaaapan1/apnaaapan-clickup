import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ListViewRow from '../components/listview/ListViewRow';

const statusSections = [
  {
    key: 'inProgress',
    label: 'IN PROGRESS',
    dotColor: '#3b82f6',
    badgeBg: 'bg-blue-600',
    badgeText: 'text-white',
  },
  {
    key: 'todo',
    label: 'TO DO',
    dotColor: '#9ca3af',
    badgeBg: 'bg-gray-100',
    badgeText: 'text-gray-600',
  },
  {
    key: 'completed',
    label: 'COMPLETE',
    dotColor: '#22c55e',
    badgeBg: 'bg-emerald-600',
    badgeText: 'text-white',
  },
];

function splitTasksByDefaultOrder(tasks) {
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
}

export default function MyTasksPage() {
  const { workspaceId } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [collapsedSections, setCollapsedSections] = useState({});

  const fetchMyTasks = useCallback(async ({ withLoader = true } = {}) => {
    if (!workspaceId) {
      setTasks([]);
      setLoading(false);
      return;
    }
    if (withLoader) {
      setLoading(true);
      setError('');
    }
    try {
      const res = await api.get(`/workspaces/${workspaceId}/my-tasks`);
      setTasks(res.data?.tasks || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your tasks.');
    } finally {
      if (withLoader) setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchMyTasks({ withLoader: true });
  }, [fetchMyTasks]);

  useEffect(() => {
    const onTasksChanged = () => fetchMyTasks({ withLoader: false });
    window.addEventListener('tasks:changed', onTasksChanged);
    return () => window.removeEventListener('tasks:changed', onTasksChanged);
  }, [fetchMyTasks]);

  const groupedTasks = useMemo(() => splitTasksByDefaultOrder(tasks), [tasks]);

  const toggleSection = (sectionId) => {
    setCollapsedSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const openTask = (task) => {
    const pid = task.project_id;
    const lid = task.list_id;
    const tid = task.id;
    if (!pid || !lid || !tid) return;
    navigate(`/projects/${pid}?list=${lid}&openTask=${tid}&openTaskList=${lid}`);
  };

  return (
    <div className="px-6 py-4 bg-white min-h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
        <p className="text-sm text-gray-500 mt-1">Tasks assigned to you across spaces.</p>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && tasks.length === 0 && (
        <p className="text-[15px] text-gray-500">No tasks assigned to you yet.</p>
      )}

      {!loading && !error && tasks.length > 0 &&
        statusSections.map((section) => {
          const items = groupedTasks[section.key] || [];
          const sectionId = section.key;
          const isCollapsed = collapsedSections[sectionId];

          return (
            <div key={sectionId} className="mb-6">
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
                  <span className="w-[14px] h-[14px] rounded-full border-2 border-current flex items-center justify-center">
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
                  <div className="flex items-center px-4 py-2 text-[13px] font-medium text-gray-400 border-b border-gray-100">
                    <div className="flex-1 pl-7">Name</div>
                    <div className="w-[130px] text-center">Assignee</div>
                    <div className="w-[130px]">Due date</div>
                    <div className="w-[130px]">Priority</div>
                  </div>

                  {items.map((task) => (
                    <ListViewRow
                      key={task.id}
                      task={task}
                      projectId={task.project_id}
                      sectionColor={section.dotColor}
                      sectionKey={section.key}
                      subtitle={[task.project_name, task.list_name].filter(Boolean).join(' · ')}
                      onRefetch={() => fetchMyTasks({ withLoader: false })}
                      onOpenTask={openTask}
                    />
                  ))}
                </>
              )}
            </div>
          );
        })}
    </div>
  );
}
