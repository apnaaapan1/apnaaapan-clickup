import { useEffect, useRef, useState } from 'react';
import TaskFieldFlyout from '../listview/TaskFieldFlyout';
import { getPriorityConfig, priorityOptions } from '../../utils/priorityConfig';

export default function PrioritySelect({ value, onChange, disabled = false, className = '' }) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const selected = getPriorityConfig(value || 'medium');

  useEffect(() => {
    if (!open) return undefined;

    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };

    const onMouseDown = (e) => {
      if (anchorRef.current?.contains(e.target)) return;
      if (e.target.closest('[data-priority-select-flyout]')) return;
      setOpen(false);
    };

    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onMouseDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onMouseDown);
    };
  }, [open]);

  const handleSelect = (level) => {
    setOpen(false);
    if (level !== value) onChange(level);
  };

  return (
    <>
      <button
        type="button"
        ref={anchorRef}
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-left hover:bg-gray-50 disabled:opacity-60 disabled:pointer-events-none ${className}`}
        aria-label="Change priority"
        aria-expanded={open}
      >
        <span
          className="w-3 h-3 rounded-sm shrink-0"
          style={{ backgroundColor: selected.color }}
        />
        <span className="font-medium text-gray-700 flex-1">{selected.label}</span>
        <svg
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <TaskFieldFlyout
        anchorRef={anchorRef}
        open={open}
        dataAttr="data-priority-select-flyout"
        width={200}
      >
        <div className="py-1">
          {priorityOptions.map((level) => {
            const cfg = getPriorityConfig(level);
            const isSelected = (value || 'medium') === level;

            return (
              <button
                key={level}
                type="button"
                onClick={() => handleSelect(level)}
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
                  <svg
                    className="w-4 h-4 text-purple-600 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
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
