import { format, isToday, isPast } from 'date-fns';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const priorityClasses = {
  urgent: 'bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full',
  high: 'bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full',
  medium: 'bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full',
  low: 'bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full',
};

const statusClasses = {
  todo: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-100 text-blue-700',
  in_review: 'bg-amber-100 text-amber-700',
  done: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function ListViewRow({ task, projectId, onRefetch, onOpenTask }) {
  const { workspaceId } = useAuth();

  const dueDate = task.due_date ? new Date(task.due_date) : null;
  const dueText = dueDate ? format(dueDate, 'MMM d') : '-';
  const dueClass = !dueDate
    ? 'text-gray-400'
    : isToday(dueDate)
    ? 'text-orange-500'
    : isPast(dueDate)
    ? 'text-red-500'
    : 'text-gray-400';

  const handleDone = async (e) => {
    e.stopPropagation();
    await api.patch(
      `/workspaces/${workspaceId}/projects/${projectId}/lists/${task.list_id}/tasks/${task.id}`,
      { status: 'done' }
    );
    onRefetch();
  };

  const initials =
    task.assignee_name
      ?.split(/\s+/)
      .slice(0, 2)
      .map((v) => v[0]?.toUpperCase())
      .join('') || '';

  return (
    <div
      className="flex items-center gap-3 py-2 px-4 border-b border-[#f3f4f6] hover:bg-gray-50 cursor-pointer"
      onClick={() => onOpenTask(task)}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <button
          onClick={handleDone}
          className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs ${
            task.status === 'done'
              ? 'border-green-500 bg-green-500 text-white'
              : 'border-gray-300 text-transparent'
          }`}
        >
          ✓
        </button>
        <p
          className={`text-[15px] font-semibold truncate ${
            task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-900'
          }`}
        >
          {task.title}
        </p>
      </div>

      <div className="w-[80px] flex justify-center">
        {initials ? (
          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-semibold flex items-center justify-center">
            {initials}
          </div>
        ) : (
          <div className="w-7 h-7 rounded-full border border-dashed border-gray-300" />
        )}
      </div>

      <div className={`w-[100px] text-xs ${dueClass}`}>
        {dueDate && isPast(dueDate) && !isToday(dueDate) ? '⚠ ' : ''}
        {dueText}
      </div>

      <div className="w-[90px]">
        {task.priority ? (
          <span className={priorityClasses[task.priority] || priorityClasses.medium}>
            {task.priority}
          </span>
        ) : (
          <span className="text-xs text-gray-400">-</span>
        )}
      </div>

      <div className="w-[110px]">
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            statusClasses[task.status] || statusClasses.todo
          }`}
        >
          {task.status || 'todo'}
        </span>
      </div>
    </div>
  );
}
