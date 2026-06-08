import { useEffect, useRef, useState } from 'react';
import TaskFieldFlyout from '../listview/TaskFieldFlyout';
import { getStatusConfig, getStatusGroups, statusOptions } from '../../utils/statusConfig';
import StatusOptionIcon from './StatusOptionIcon';

export default function StatusSelect({ value, onChange, disabled = false, className = '' }) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const selected = getStatusConfig(value || 'todo');
  const statusGroups = getStatusGroups(statusOptions);

  useEffect(() => {
    if (!open) return undefined;

    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };

    const onMouseDown = (e) => {
      if (anchorRef.current?.contains(e.target)) return;
      if (e.target.closest('[data-status-select-flyout]')) return;
      setOpen(false);
    };

    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onMouseDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onMouseDown);
    };
  }, [open]);

  const handleSelect = (status) => {
    setOpen(false);
    if (status !== value) onChange(status);
  };

  return (
    <>
      <button
        type="button"
        ref={anchorRef}
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-left hover:bg-gray-50 disabled:opacity-60 disabled:pointer-events-none ${className}`}
        aria-label="Change status"
        aria-expanded={open}
      >
        <StatusOptionIcon status={selected.value} color={selected.color} />
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
        dataAttr="data-status-select-flyout"
        width={260}
      >
        <div className="max-h-[300px] overflow-y-auto py-1">
          {statusGroups.map(([group, items]) => (
            <div key={group} className="py-1">
              <div className="px-3 py-1.5">
                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                  {group}
                </span>
              </div>
              {items.map((status) => {
                const isSelected = (value || 'todo') === status.value;

                return (
                  <button
                    key={status.value}
                    type="button"
                    onClick={() => handleSelect(status.value)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors cursor-pointer ${
                      isSelected ? 'bg-gray-100' : 'hover:bg-gray-50'
                    }`}
                  >
                    <StatusOptionIcon status={status.value} color={status.color} />
                    <span className="flex-1 text-[13px] font-medium text-gray-800">{status.label}</span>
                    {isSelected ? (
                      <svg
                        className="w-4 h-4 text-gray-600 shrink-0"
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
          ))}
        </div>
      </TaskFieldFlyout>
    </>
  );
}
