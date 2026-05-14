import { useMemo } from 'react';
import { isToday, isTomorrow, isPast, format } from 'date-fns';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const priorityConfig = {
  urgent: { color: '#ef4444', label: 'Urgent' },
  high: { color: '#f59e0b', label: 'High' },
  medium: { color: '#facc15', label: 'Medium' },
  low: { color: '#9ca3af', label: 'Low' },
  none: { color: '#d1d5db', label: 'None' },
};

const avatarColors = [
  'bg-green-600', 'bg-blue-600', 'bg-purple-600', 'bg-orange-500',
  'bg-teal-600', 'bg-pink-600', 'bg-indigo-600', 'bg-rose-500',
];

function getAvatarColor(name) {
  if (!name) return avatarColors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export default function ListViewRow({
  task,
  projectId,
  sectionColor,
  sectionKey,
  onRefetch,
  onOpenTask,
  subtitle,
}) {
  const { workspaceId } = useAuth();

  const handleStatusToggle = async (e) => {
    e.stopPropagation();
    const nextStatus = task.status === 'done' ? 'todo' : 'done';
    await api.patch(
      `/workspaces/${workspaceId}/projects/${projectId}/lists/${task.list_id}/tasks/${task.id}`,
      { status: nextStatus }
    );
    onRefetch();
  };

  const initials = useMemo(() => {
    if (!task.assignee_name) return '';
    return task.assignee_name
      .split(/\s+/)
      .slice(0, 2)
      .map((v) => v[0]?.toUpperCase())
      .join('');
  }, [task.assignee_name]);

  const dueLabel = useMemo(() => {
    if (!task.due_date) return null;
    const d = new Date(task.due_date);
    if (isToday(d)) return { text: 'Today', color: 'text-orange-500' };
    if (isTomorrow(d)) return { text: 'Tomorrow', color: 'text-gray-600' };
    if (isPast(d)) return { text: format(d, 'MMM d'), color: 'text-red-500' };
    return { text: format(d, 'MMM d'), color: 'text-gray-500' };
  }, [task.due_date]);

  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const colorClass = getAvatarColor(task.assignee_name);

  return (
    <div
      className="flex items-center px-4 py-2.5 border-b border-gray-200 bg-white hover:bg-gray-50/70 cursor-pointer transition-colors"
      onClick={() => onOpenTask(task)}
    >
      {/* Status circle + Task name */}
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <button
          type="button"
          onClick={handleStatusToggle}
          className="w-[18px] h-[18px] shrink-0 rounded-full border-2 flex items-center justify-center transition-colors"
          style={{
            borderColor: sectionColor,
            backgroundColor: sectionKey === 'completed' ? sectionColor : 'transparent',
          }}
        >
          {sectionKey === 'completed' && (
            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 16 16">
              <path d="M3 8l3.5 3.5L13 4" />
            </svg>
          )}
          {sectionKey === 'inProgress' && (
            <span
              className="w-[8px] h-[8px] rounded-full"
              style={{ backgroundColor: sectionColor }}
            />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <span
            className={`text-[14px] font-medium truncate block ${
              task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-800'
            }`}
          >
            {task.title}
          </span>
          {subtitle ? (
            <span className="text-[12px] text-gray-400 truncate block mt-0.5">{subtitle}</span>
          ) : null}
        </div>

        {task.description && (
          <svg className="w-4 h-4 shrink-0 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 5h14M3 8h14M3 11h10" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </svg>
        )}
      </div>

      {/* Assignee */}
      <div className="w-[130px] flex justify-center">
        {initials ? (
          <div
            className={`w-7 h-7 rounded-full text-white text-[11px] font-semibold flex items-center justify-center ${colorClass}`}
          >
            {initials}
          </div>
        ) : (
          <div className="w-7 h-7 rounded-full border border-dashed border-gray-300" />
        )}
      </div>

      {/* Due date */}
      <div className="w-[130px]">
        {dueLabel ? (
          <span className={`text-[13px] font-medium ${dueLabel.color}`}>
            {dueLabel.text}
          </span>
        ) : (
          <span className="text-[13px] text-gray-300">&mdash;</span>
        )}
      </div>

      {/* Priority */}
      <div className="w-[130px] flex items-center gap-1.5">
        <span
          className="w-3 h-3 rounded-sm shrink-0"
          style={{ backgroundColor: priority.color }}
        />
        <span className="text-[13px] font-medium text-gray-600">{priority.label}</span>
      </div>

    </div>
  );
}
