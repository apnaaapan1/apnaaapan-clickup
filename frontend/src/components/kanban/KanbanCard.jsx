import { useMemo } from 'react';
import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';

const priorityClasses = {
  urgent: 'bg-red-100 text-red-700 text-[13px] font-medium px-2.5 py-0.5 rounded-full',
  high: 'bg-orange-100 text-orange-700 text-[13px] font-medium px-2.5 py-0.5 rounded-full',
  medium: 'bg-yellow-100 text-yellow-700 text-[13px] font-medium px-2.5 py-0.5 rounded-full',
  low: 'bg-gray-100 text-gray-600 text-[13px] font-medium px-2.5 py-0.5 rounded-full',
};

export default function KanbanCard({ task, columnKey, onOpenTask }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: 'task', listId: task.list_id, columnKey, task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dateMeta = useMemo(() => {
    if (!task.due_date) return null;
    const due = new Date(task.due_date);
    const today = new Date();
    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
    const todayDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    ).getTime();
    const isOverdue = dueDay < todayDay;
    const isToday = dueDay === todayDay;
    const color = isOverdue ? 'text-red-500' : isToday ? 'text-orange-500' : 'text-gray-400';
    return {
      label: due.toLocaleDateString(),
      color,
    };
  }, [task.due_date]);

  const assigneeInitials = useMemo(() => {
    if (!task.assignee_name) return '';
    return task.assignee_name
      .split(/\s+/)
      .slice(0, 2)
      .map((v) => v[0]?.toUpperCase())
      .join('');
  }, [task.assignee_name]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onOpenTask?.(task)}
      className={`bg-white border border-[#e5e7eb] rounded-lg px-3 py-2.5 mb-1.5 cursor-pointer select-none ${
        isDragging ? 'opacity-50 shadow-md cursor-grabbing' : ''
      }`}
    >
      <p className="text-[15px] font-semibold text-gray-900">{task.title}</p>

      <div className="mt-2 flex items-center justify-between gap-2">
        {task.priority && priorityClasses[task.priority] && (
          <span className={priorityClasses[task.priority]}>{task.priority}</span>
        )}
        {dateMeta && (
          <span className={`text-[13px] font-medium ${dateMeta.color}`}>📅 {dateMeta.label}</span>
        )}
      </div>

      {assigneeInitials && (
        <div className="mt-2 flex justify-end">
          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-semibold flex items-center justify-center">
            {assigneeInitials}
          </div>
        </div>
      )}
    </div>
  );
}
