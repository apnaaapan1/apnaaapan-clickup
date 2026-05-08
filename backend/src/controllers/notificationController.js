const pool = require('../config/db');

const getAllNotifications = async (req, res) => {
  const userId = req.user.userId;

  try {
    const notificationsResult = await pool.query(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM notifications
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      notifications: notificationsResult.rows,
      unreadCount: parseInt(countResult.rows[0].count, 10),
    });
  } catch (err) {
    console.error('getAllNotifications error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getUnreadCount = async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `SELECT COUNT(*) FROM notifications
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      unreadCount: parseInt(result.rows[0].count, 10),
    });
  } catch (err) {
    console.error('getUnreadCount error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const markOneAsRead = async (req, res) => {
  const userId = req.user.userId;
  const { notificationId } = req.params;

  try {
    const check = await pool.query(
      `SELECT id FROM notifications
       WHERE id = $1 AND user_id = $2`,
      [notificationId, userId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    await pool.query(
      `UPDATE notifications SET is_read = true
       WHERE id = $1 AND user_id = $2`,
      [notificationId, userId]
    );

    return res.status(200).json({ success: true, message: 'Marked as read' });
  } catch (err) {
    console.error('markOneAsRead error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const markAllAsRead = async (req, res) => {
  const userId = req.user.userId;

  try {
    await pool.query(
      `UPDATE notifications SET is_read = true
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );

    return res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    console.error('markAllAsRead error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteNotification = async (req, res) => {
  const userId = req.user.userId;
  const { notificationId } = req.params;

  try {
    const check = await pool.query(
      `SELECT id FROM notifications
       WHERE id = $1 AND user_id = $2`,
      [notificationId, userId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    await pool.query(
      `DELETE FROM notifications
       WHERE id = $1 AND user_id = $2`,
      [notificationId, userId]
    );

    return res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (err) {
    console.error('deleteNotification error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getAllNotifications,
  getUnreadCount,
  markOneAsRead,
  markAllAsRead,
  deleteNotification,
};
