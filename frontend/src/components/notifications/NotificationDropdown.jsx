import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { formatDistanceToNow, isValid } from 'date-fns';

const DROPDOWN_WIDTH = 340;

const iconSvgs = {
  task_assigned: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><polyline points="17 11 19 13 23 9" />
    </svg>
  ),
  task_completed: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  default: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
};

const typeStyles = {
  task_assigned: {
    icon: 'task_assigned',
    bg: 'bg-purple-100 text-purple-700',
  },
  task_completed: {
    icon: 'task_completed',
    bg: 'bg-green-100 text-green-700',
  },
  default: {
    icon: 'default',
    bg: 'bg-gray-100 text-gray-600',
  },
};

function NotificationItem({ notification, onMarkOne, onDelete }) {
  const style = typeStyles[notification.type] || typeStyles.default;
  const timeLabel = useMemo(() => {
    if (!notification.created_at) return 'Just now';
    const raw = notification.created_at;
    const d = new Date(raw);
    if (!isValid(d)) return 'Just now';
    try {
      return formatDistanceToNow(d, { addSuffix: true });
    } catch {
      return 'Just now';
    }
  }, [notification.created_at]);

  return (
    <div
      className={`group flex items-start gap-3 p-3 border-b border-gray-100 hover:bg-gray-50 ${
        notification.is_read ? 'bg-white' : 'bg-purple-50 border-l-[3px] border-l-purple-600'
      }`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${style.bg}`}>
        {iconSvgs[style.icon] || iconSvgs.default}
      </div>
      <button className="min-w-0 flex-1 text-left" onClick={() => !notification.is_read && onMarkOne(notification.id)}>
        <p className="text-[13px] font-medium text-gray-800 truncate">
          {notification.title != null ? String(notification.title) : 'Notification'}
        </p>
        <p className="text-[12px] text-gray-500 line-clamp-2">
          {notification.message != null ? String(notification.message) : ''}
        </p>
        <p className="text-[11px] text-gray-400 mt-1">{timeLabel}</p>
      </button>
      <div className="flex flex-col items-center gap-2 pt-1">
        {!notification.is_read && (
          <button
            className="w-2.5 h-2.5 rounded-full bg-purple-600"
            onClick={() => onMarkOne(notification.id)}
            title="Mark as read"
            aria-label="Mark as read"
          />
        )}
        <button
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 text-xs transition-opacity"
          onClick={() => onDelete(notification.id)}
          title="Delete"
          aria-label="Delete notification"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function NotificationDropdown({
  containerRef,
  placement = 'header',
  notifications,
  unreadCount,
  loading,
  onMarkOne,
  onMarkAll,
  onDelete,
  onClose,
}) {
  const panelRef = useRef(null);
  const [fixedStyle, setFixedStyle] = useState(null);

  useLayoutEffect(() => {
    if (placement !== 'header' || !containerRef?.current) {
      setFixedStyle(null);
      return undefined;
    }
    const update = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const left = Math.max(8, rect.right - DROPDOWN_WIDTH);
      setFixedStyle({
        position: 'fixed',
        top: rect.bottom + 8,
        left,
        width: DROPDOWN_WIDTH,
        zIndex: 99999,
      });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [containerRef, placement, notifications.length, unreadCount, loading]);

  useEffect(() => {
    let removeListener = () => {};
    const rafId = requestAnimationFrame(() => {
      const handleOutside = (e) => {
        if (containerRef?.current?.contains(e.target)) return;
        if (panelRef.current?.contains(e.target)) return;
        onClose();
      };
      document.addEventListener('mousedown', handleOutside);
      removeListener = () => document.removeEventListener('mousedown', handleOutside);
    });
    return () => {
      cancelAnimationFrame(rafId);
      removeListener();
    };
  }, [onClose, containerRef]);

  const positionClass =
    placement === 'sidebar'
      ? 'absolute left-[58px] bottom-0 z-50 w-[340px] max-h-[480px]'
      : null;

  const shellClass =
    'bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden max-h-[480px] pointer-events-auto';

  const inner = (
    <>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <p className="text-[14px] font-medium text-gray-900">Notifications</p>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button type="button" className="text-[12px] text-purple-600 hover:text-purple-700" onClick={onMarkAll}>
              Mark all as read
            </button>
          )}
          <button type="button" className="text-gray-400 hover:text-gray-600 text-sm" onClick={onClose}>
            ✕
          </button>
        </div>
      </div>

      <div className="max-h-[380px] overflow-y-auto">
        {loading ? (
          <div className="h-28 flex items-center justify-center text-sm text-gray-500">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center gap-1 text-center">
            <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <p className="text-sm text-gray-600">No notifications yet</p>
            <p className="text-xs text-gray-400">You are all caught up!</p>
          </div>
        ) : (
          notifications.map((notification, idx) => (
            <NotificationItem
              key={notification.id != null ? String(notification.id) : `n-${idx}`}
              notification={notification}
              onMarkOne={onMarkOne}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </>
  );

  if (placement === 'header') {
    if (!fixedStyle || typeof document === 'undefined' || !document.body) {
      return null;
    }
    return createPortal(
      <div ref={panelRef} className={shellClass} style={fixedStyle}>
        {inner}
      </div>,
      document.body
    );
  }

  return (
    <div ref={panelRef} className={`${positionClass} ${shellClass} w-[340px]`}>
      {inner}
    </div>
  );
}
