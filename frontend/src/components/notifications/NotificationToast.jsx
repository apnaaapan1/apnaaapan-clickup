import { useEffect, useMemo, useState } from 'react';

export default function NotificationToast({ notification, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const enterTimer = setTimeout(() => setVisible(true), 20);
    const closeTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 220);
    }, 4000);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(closeTimer);
    };
  }, [onClose, notification?.id]);

  const message = useMemo(
    () => notification?.message || 'You have a new notification.',
    [notification?.message]
  );

  return (
    <div
      className={`fixed bottom-6 right-6 z-[60] w-[300px] rounded-xl bg-white shadow-lg border-l-4 border-purple-600 transition-transform duration-200 ${
        visible ? 'translate-x-0' : 'translate-x-[120%]'
      }`}
    >
      <div className="p-3 flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-gray-900 truncate">
            {notification?.title || 'New notification'}
          </p>
          <p className="text-[12px] text-gray-500">{message}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm" aria-label="Close toast">
          ✕
        </button>
      </div>
    </div>
  );
}
