import { useEffect, useMemo, useRef, useState } from 'react';
import { addDays, format, isPast, isToday, isTomorrow } from 'date-fns';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import useWorkspaceMembers from '../../hooks/useWorkspaceMembers';
import TaskFieldFlyout from './TaskFieldFlyout';

const priorityConfig = {
  urgent: { color: '#ef4444', label: 'Urgent' },
  high: { color: '#f59e0b', label: 'High' },
  medium: { color: '#facc15', label: 'Medium' },
  low: { color: '#9ca3af', label: 'Low' },
  none: { color: '#d1d5db', label: 'None' },
};

const priorityOptions = ['urgent', 'high', 'medium', 'low', 'none'];
const statusOptions = [
  { value: 'todo', label: 'To do', group: 'Statuses', color: '#9ca3af' },
  { value: 'in_progress', label: 'In progress', group: 'Statuses', color: '#8b5cf6' },
  { value: 'in_review', label: 'In review', group: 'Statuses', color: '#3b82f6' },
  { value: 'done', label: 'Complete', group: 'Closed', color: '#22c55e' },
  { value: 'cancelled', label: 'Cancelled', group: 'Closed', color: '#6b7280' },
];

function StatusOptionIcon({ status, color }) {
  if (status === 'done') {
    return (
      <span
        className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: color }}
      >
        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 16 16">
          <path d="M3 8l3.5 3.5L13 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  if (status === 'in_progress' || status === 'in_review') {
    return (
      <span
        className="w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0"
        style={{ borderColor: color }}
      >
        <span className="w-[7px] h-[7px] rounded-full" style={{ backgroundColor: color }} />
      </span>
    );
  }
  if (status === 'cancelled') {
    return (
      <span
        className="w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0"
        style={{ borderColor: color }}
      >
        <svg className="w-2.5 h-2.5" style={{ color }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 16 16">
          <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
        </svg>
      </span>
    );
  }
  return (
    <span
      className="w-[18px] h-[18px] rounded-full border-2 border-dashed shrink-0"
      style={{ borderColor: color }}
    />
  );
}

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

function getInitials(name) {
  if (!name) return '';
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((v) => v[0]?.toUpperCase())
    .join('');
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
  const { members } = useWorkspaceMembers();
  const [popover, setPopover] = useState(null);
  const [statusQuery, setStatusQuery] = useState('');
  const [assigneeQuery, setAssigneeQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const statusAnchorRef = useRef(null);
  const assigneeAnchorRef = useRef(null);
  const dueDateAnchorRef = useRef(null);
  const priorityAnchorRef = useRef(null);

  const updateTaskField = async (payload) => {
    if (saving) return;
    setSaving(true);
    try {
      await api.patch(
        `/workspaces/${workspaceId}/projects/${projectId}/lists/${task.list_id}/tasks/${task.id}`,
        payload
      );
      window.dispatchEvent(new Event('tasks:changed'));
      onRefetch();
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!popover) return undefined;
    const onDown = (e) => {
      if (
        e.target.closest('[data-task-status-flyout]') ||
        e.target.closest('[data-task-assignee-flyout]') ||
        e.target.closest('[data-task-due-date-flyout]') ||
        e.target.closest('[data-task-priority-flyout]') ||
        statusAnchorRef.current?.contains(e.target) ||
        assigneeAnchorRef.current?.contains(e.target) ||
        dueDateAnchorRef.current?.contains(e.target) ||
        priorityAnchorRef.current?.contains(e.target)
      ) {
        return;
      }
      setPopover(null);
      setStatusQuery('');
      setAssigneeQuery('');
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [popover]);

  useEffect(() => {
    if (!popover) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setPopover(null);
        setStatusQuery('');
        setAssigneeQuery('');
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [popover]);

  const initials = useMemo(() => getInitials(task.assignee_name), [task.assignee_name]);

  const filteredMembers = useMemo(() => {
    const q = assigneeQuery.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        (m.name || '').toLowerCase().includes(q) ||
        (m.email || '').toLowerCase().includes(q)
    );
  }, [members, assigneeQuery]);

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

  const openStatusPopover = (e) => {
    e.stopPropagation();
    setStatusQuery('');
    setPopover((prev) => (prev === 'status' ? null : 'status'));
  };

  const openAssigneePopover = (e) => {
    e.stopPropagation();
    setAssigneeQuery('');
    setPopover((prev) => (prev === 'assignee' ? null : 'assignee'));
  };

  const openDueDatePopover = (e) => {
    e.stopPropagation();
    setPopover((prev) => (prev === 'dueDate' ? null : 'dueDate'));
  };

  const openPriorityPopover = (e) => {
    e.stopPropagation();
    setPopover((prev) => (prev === 'priority' ? null : 'priority'));
  };

  const handleStatusSelect = async (status) => {
    setPopover(null);
    setStatusQuery('');
    await updateTaskField({ status });
  };

  const handleDueDateSelect = async (dueDate) => {
    setPopover(null);
    await updateTaskField({ due_date: dueDate });
  };

  const handleAssigneeSelect = async (assigneeId) => {
    setPopover(null);
    setAssigneeQuery('');
    await updateTaskField({ assignee_id: assigneeId });
  };

  const handlePrioritySelect = async (priorityValue) => {
    setPopover(null);
    await updateTaskField({ priority: priorityValue });
  };

  const filteredStatuses = useMemo(() => {
    const q = statusQuery.trim().toLowerCase();
    if (!q) return statusOptions;
    return statusOptions.filter((s) => s.label.toLowerCase().includes(q));
  }, [statusQuery]);

  const statusesByGroup = useMemo(() => {
    const groups = new Map();
    filteredStatuses.forEach((s) => {
      if (!groups.has(s.group)) groups.set(s.group, []);
      groups.get(s.group).push(s);
    });
    return Array.from(groups.entries());
  }, [filteredStatuses]);

  return (
    <>
      <div
        className="flex items-center px-4 py-2.5 border-b border-gray-200 bg-white hover:bg-gray-50/70 cursor-pointer transition-colors"
        onClick={() => onOpenTask(task)}
      >
        {/* Status circle + Task name */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <button
            type="button"
            ref={statusAnchorRef}
            onClick={openStatusPopover}
            className="w-[18px] h-[18px] shrink-0 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer hover:opacity-80"
            style={{
              borderColor: sectionColor,
              backgroundColor: sectionKey === 'completed' ? sectionColor : 'transparent',
            }}
            aria-label="Change status"
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
        <button
          type="button"
          ref={assigneeAnchorRef}
          onClick={openAssigneePopover}
          className="w-[130px] flex justify-center items-center hover:bg-gray-100 rounded-md py-1 transition-colors cursor-pointer"
          aria-label="Change assignee"
        >
          {initials ? (
            <div
              className={`w-7 h-7 rounded-full text-white text-[11px] font-semibold flex items-center justify-center ${colorClass}`}
            >
              {initials}
            </div>
          ) : (
            <div className="w-7 h-7 rounded-full border border-dashed border-gray-300 hover:border-gray-400" />
          )}
        </button>

        {/* Due date */}
        <button
          type="button"
          ref={dueDateAnchorRef}
          onClick={openDueDatePopover}
          className="w-[130px] flex items-center hover:bg-gray-100 rounded-md px-2 py-1 transition-colors text-left cursor-pointer"
          aria-label="Change due date"
        >
          {dueLabel ? (
            <span className={`text-[13px] font-medium ${dueLabel.color}`}>
              {dueLabel.text}
            </span>
          ) : (
            <span className="text-[13px] text-gray-300">&mdash;</span>
          )}
        </button>

        {/* Priority */}
        <button
          type="button"
          ref={priorityAnchorRef}
          onClick={openPriorityPopover}
          className="w-[130px] flex items-center gap-1.5 hover:bg-gray-100 rounded-md px-2 py-1 transition-colors cursor-pointer"
          aria-label="Change priority"
        >
          <span
            className="w-3 h-3 rounded-sm shrink-0"
            style={{ backgroundColor: priority.color }}
          />
          <span className="text-[13px] font-medium text-gray-600">{priority.label}</span>
        </button>
      </div>

      <TaskFieldFlyout
        anchorRef={statusAnchorRef}
        open={popover === 'status'}
        dataAttr="data-task-status-flyout"
        width={300}
      >
        <div className="px-3 pt-3 pb-2 border-b border-gray-100 bg-gray-50/60">
          <div className="inline-flex items-center px-3 py-1.5 rounded-md bg-white border border-gray-200 shadow-sm">
            <span className="text-[13px] font-medium text-gray-800">Status</span>
          </div>
        </div>
        <div className="p-3 border-b border-gray-100">
          <input
            type="search"
            value={statusQuery}
            onChange={(e) => setStatusQuery(e.target.value)}
            placeholder="Search..."
            className="w-full px-3 py-2 text-[13px] text-gray-800 placeholder:text-gray-400 border border-purple-300 rounded-lg outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
            autoFocus
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto py-1">
          {statusesByGroup.map(([group, items]) => (
            <div key={group} className="py-1">
              <div className="px-3 py-1.5 flex items-center justify-between">
                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{group}</span>
              </div>
              {items.map((s) => {
                const isSelected = (task.status || 'todo') === s.value;
                return (
                  <button
                    key={s.value}
                    type="button"
                    disabled={saving}
                    onClick={() => handleStatusSelect(s.value)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors cursor-pointer ${
                      isSelected ? 'bg-gray-100' : 'hover:bg-gray-50'
                    }`}
                  >
                    <StatusOptionIcon status={s.value} color={s.color} />
                    <span className="flex-1 text-[13px] font-medium text-gray-800">{s.label}</span>
                    {isSelected ? (
                      <svg className="w-4 h-4 text-gray-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ))}
          {filteredStatuses.length === 0 && (
            <p className="px-3 py-6 text-[13px] text-gray-400 text-center">No statuses found</p>
          )}
        </div>
      </TaskFieldFlyout>

      <TaskFieldFlyout
        anchorRef={assigneeAnchorRef}
        open={popover === 'assignee'}
        dataAttr="data-task-assignee-flyout"
        width={280}
      >
        <div className="p-2 border-b border-gray-100">
          <input
            type="search"
            value={assigneeQuery}
            onChange={(e) => setAssigneeQuery(e.target.value)}
            placeholder="Search members..."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
            autoFocus
          />
        </div>
        <div className="max-h-[240px] overflow-y-auto py-1">
          <button
            type="button"
            disabled={saving}
            onClick={() => handleAssigneeSelect(null)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-[13px] hover:bg-gray-50 cursor-pointer ${
              !task.assignee_id ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
            }`}
          >
            <div className="w-7 h-7 rounded-full border border-dashed border-gray-300 shrink-0" />
            <span>Unassigned</span>
          </button>
          {filteredMembers.map((member) => {
            const memberId = member.user_id || member.id;
            const memberInitials = getInitials(member.name);
            const memberColor = getAvatarColor(member.name);
            const isSelected = String(task.assignee_id) === String(memberId);
            return (
              <button
                key={memberId}
                type="button"
                disabled={saving}
                onClick={() => handleAssigneeSelect(memberId)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-[13px] hover:bg-gray-50 cursor-pointer ${
                  isSelected ? 'bg-purple-50' : ''
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full text-white text-[11px] font-semibold flex items-center justify-center shrink-0 ${memberColor}`}
                >
                  {memberInitials || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-800 truncate">{member.name}</p>
                  {member.email ? (
                    <p className="text-xs text-gray-400 truncate">{member.email}</p>
                  ) : null}
                </div>
                {isSelected ? (
                  <svg className="w-4 h-4 text-purple-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : null}
              </button>
            );
          })}
          {filteredMembers.length === 0 && (
            <p className="px-3 py-4 text-sm text-gray-400 text-center">No members found</p>
          )}
        </div>
      </TaskFieldFlyout>

      <TaskFieldFlyout
        anchorRef={dueDateAnchorRef}
        open={popover === 'dueDate'}
        dataAttr="data-task-due-date-flyout"
        width={240}
      >
        <div className="p-3 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Due date</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleDueDateSelect(format(new Date(), 'yyyy-MM-dd'))}
              className="px-3 py-2 text-[13px] font-medium text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleDueDateSelect(format(addDays(new Date(), 1), 'yyyy-MM-dd'))}
              className="px-3 py-2 text-[13px] font-medium text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
            >
              Tomorrow
            </button>
          </div>
          <label className="block">
            <span className="text-xs text-gray-500 mb-1 block">Pick a date</span>
            <input
              type="date"
              value={task.due_date ? format(new Date(task.due_date), 'yyyy-MM-dd') : ''}
              onChange={(e) => handleDueDateSelect(e.target.value || null)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
            />
          </label>
          {task.due_date ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => handleDueDateSelect(null)}
              className="w-full px-3 py-2 text-[13px] font-medium text-red-600 hover:bg-red-50 rounded-md cursor-pointer"
            >
              Clear due date
            </button>
          ) : null}
        </div>
      </TaskFieldFlyout>

      <TaskFieldFlyout
        anchorRef={priorityAnchorRef}
        open={popover === 'priority'}
        dataAttr="data-task-priority-flyout"
        width={200}
      >
        <div className="py-1">
          {priorityOptions.map((level) => {
            const cfg = priorityConfig[level];
            const isSelected = (task.priority || 'medium') === level;
            return (
              <button
                key={level}
                type="button"
                disabled={saving}
                onClick={() => handlePrioritySelect(level)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-[13px] hover:bg-gray-50 cursor-pointer ${
                  isSelected ? 'bg-purple-50' : ''
                }`}
              >
                <span
                  className="w-3 h-3 rounded-sm shrink-0"
                  style={{ backgroundColor: cfg.color }}
                />
                <span className="font-medium text-gray-700 flex-1">{cfg.label}</span>
                {isSelected ? (
                  <svg className="w-4 h-4 text-purple-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : null}
              </button>
            );
          })}
        </div>
      </TaskFieldFlyout>
    </>
  );
}
