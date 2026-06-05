import { useEffect, useRef, useState } from 'react';
import useWorkspaceMembers from '../../hooks/useWorkspaceMembers';

const priorities = ['urgent', 'high', 'medium', 'low', 'none'];

export default function AddTaskInput({ onSubmit, onCancel, disableOutsideClose = false }) {
  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const { members } = useWorkspaceMembers();
  const [title, setTitle] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [tag, setTag] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (disableOutsideClose) return undefined;
    const onDown = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onCancel();
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [onCancel, disableOutsideClose]);

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || saving) return;
    setSaving(true);
    try {
      await onSubmit({
        title: trimmedTitle,
        assignee_id: assigneeId || null,
        due_date: dueDate || null,
        priority,
        description: tag.trim() ? `Tag: ${tag.trim()}` : null,
      });
      setTitle('');
      setAssigneeId('');
      setDueDate('');
      setPriority('medium');
      setTag('');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = async (e) => {
    if (e.key === 'Escape') {
      onCancel();
      return;
    }
    if (e.key === 'Enter' && e.target === inputRef.current) {
      await handleSave();
    }
  };

  return (
    <div ref={panelRef} className="rounded-xl bg-white p-3 shadow-sm border border-gray-200">
      <div className="flex items-center gap-3">
      image.png        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-0 font-sans text-[20px] leading-snug font-semibold text-gray-900 placeholder:text-gray-400 placeholder:font-normal placeholder:tracking-normal outline-none bg-transparent cursor-text antialiased"
          placeholder="Task name"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={!title.trim() || saving}
          className="shrink-0 px-3 py-1.5 rounded-lg bg-violet-500 text-white text-sm font-semibold hover:bg-violet-600 disabled:opacity-60 disabled:pointer-events-none"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="mt-3 space-y-2 text-sm">
        <label className="flex items-center gap-2 text-gray-600">
          <span aria-hidden>👤</span>
          <span className="w-[90px]">Add assignee</span>
          <select
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            className="flex-1 rounded-md border border-gray-200 px-2 py-1 outline-none focus:border-violet-400"
          >
            <option value="">Unassigned</option>
            {members.map((member) => (
              <option key={member.user_id || member.id} value={member.user_id || member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-gray-600">
          <span aria-hidden>📅</span>
          <span className="w-[90px]">Add dates</span>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="flex-1 rounded-md border border-gray-200 px-2 py-1 outline-none focus:border-violet-400"
          />
        </label>

        <label className="flex items-center gap-2 text-gray-600">
          <span aria-hidden>🚩</span>
          <span className="w-[90px]">Add priority</span>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="flex-1 rounded-md border border-gray-200 px-2 py-1 outline-none focus:border-violet-400"
          >
            {priorities.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-gray-600">
          <span aria-hidden>🏷️</span>
          <span className="w-[90px]">Add tag</span>
          <input
            type="text"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="Optional tag"
            className="flex-1 rounded-md border border-gray-200 px-2 py-1 outline-none focus:border-violet-400"
          />
        </label>
      </div>
    </div>
  );
}
