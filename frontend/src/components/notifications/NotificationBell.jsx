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
}) {
  const badgeText = unreadCount > 9 ? '9+' : unreadCount;

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="relative w-10 h-10 rounded-lg hover:bg-white/10 text-white flex items-center justify-center"
        aria-label="Toggle notifications"
      >
        <i className="ti ti-bell text-[20px]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] leading-4 text-center">
            {badgeText}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationDropdown
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
