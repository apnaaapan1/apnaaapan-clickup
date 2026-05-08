import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabase';

export default function useNotifications(showToast) {
  const { user } = useAuth();
  const userId = user?.id;

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data?.notifications || []);
      setUnreadCount(res.data?.unreadCount || 0);
    } catch (err) {
      console.error('fetchNotifications error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!userId) return undefined;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
          setUnreadCount((prev) => prev + 1);
          if (showToast) {
            showToast(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [showToast, userId]);

  const markOneAsRead = useCallback(
    async (notificationId) => {
      try {
        await api.patch(`/notifications/${notificationId}/read`);
        setNotifications((prev) =>
          prev.map((item) => (item.id === notificationId ? { ...item, is_read: true } : item))
        );
        setUnreadCount((prev) => {
          const target = notifications.find((n) => n.id === notificationId);
          if (target && !target.is_read) {
            return Math.max(0, prev - 1);
          }
          return prev;
        });
      } catch (err) {
        console.error('markOneAsRead error:', err.message);
      }
    },
    [notifications]
  );

  const markAllAsRead = useCallback(async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('markAllAsRead error:', err.message);
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      setNotifications((prev) => prev.filter((item) => item.id !== notificationId));
    } catch (err) {
      console.error('deleteNotification error:', err.message);
    }
  }, []);

  const toggleDropdown = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    isOpen,
    toggleDropdown,
    markOneAsRead,
    markAllAsRead,
    deleteNotification,
    setIsOpen,
  };
}
