import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const statusClass = {
  todo: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  in_review: 'bg-amber-100 text-amber-700',
  done: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function MyTasksPage() {
  const { workspaceId } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMyTasks = async () => {
      if (!workspaceId) {
        setTasks([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/workspaces/${workspaceId}/my-tasks`);
        setTasks(res.data?.tasks || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load your tasks.');
      } finally {
        setLoading(false);
      }
    };

    fetchMyTasks();
  }, [workspaceId]);

  const grouped = useMemo(
    () =>
      tasks.reduce((acc, task) => {
        const key = task.status || 'todo';
        if (!acc[key]) acc[key] = [];
        acc[key].push(task);
        return acc;
      }, {}),
    [tasks]
  );

  return (
    <div className="p-6">
      <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 mb-4">
        <h1 className="text-2xl font-bold text-gray-800">My Tasks</h1>
        <p className="text-sm text-gray-500 mt-1">Tasks assigned to you across spaces.</p>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading tasks...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {!loading && !error && tasks.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-sm text-gray-500">
          No tasks assigned to you yet.
        </div>
      )}

      {!loading && !error && tasks.length > 0 && (
        <div className="space-y-4">
          {Object.entries(grouped).map(([status, list]) => (
            <section key={status} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusClass[status] || statusClass.todo}`}>
                  {status}
                </span>
                <span className="text-sm text-gray-500">{list.length}</span>
              </div>
              <div className="divide-y divide-gray-100">
                {list.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => navigate(`/projects/${task.project_id}?list=${task.list_id}`)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50"
                  >
                    <p className="text-sm font-semibold text-gray-900">{task.title}</p>
                    <div className="mt-1 text-xs text-gray-500 flex items-center gap-3">
                      <span>{task.project_name}</span>
                      <span>•</span>
                      <span>{task.list_name}</span>
                      <span>•</span>
                      <span>
                        {task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : 'No due date'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
