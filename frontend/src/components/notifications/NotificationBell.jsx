import { useRef } from 'react';
import NotificationDropdown from './NotificationDropdown';

export default function NotificationBell({
  notifications,
  unreadCount,
  loading,
  isOpen,
  toggleDropdown,
  markOneAsRead,
  markAllAsRead,
  deleteNotification,
  placement = 'header',
}) {
  const badgeText = unreadCount > 9 ? '9+' : unreadCount;
  const containerRef = useRef(null);

  const buttonClass =
    placement === 'sidebar'
      ? 'relative w-10 h-10 rounded-lg hover:bg-white/10 text-white flex items-center justify-center'
      : 'relative w-10 h-10 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 flex items-center justify-center shadow-sm';

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={toggleDropdown}
        className={buttonClass}
        aria-label="Toggle notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] leading-4 text-center">
            {badgeText}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationDropdown
          containerRef={containerRef}
          placement={placement}
          notifications={notifications}
          unreadCount={unreadCount}
          loading={loading}
          onMarkOne={markOneAsRead}
          onMarkAll={markAllAsRead}
          onDelete={deleteNotification}
          onClose={toggleDropdown}
        />
      )}
    </div>
  );
}
