const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const {
  getAllNotifications,
  getUnreadCount,
  markOneAsRead,
  markAllAsRead,
  deleteNotification,
} = require('../controllers/notificationController');

const router = express.Router();

router.get('/', authMiddleware, getAllNotifications);
router.get('/unread-count', authMiddleware, getUnreadCount);

router.patch('/read-all', authMiddleware, markAllAsRead);
router.patch('/:notificationId/read', authMiddleware, markOneAsRead);

router.delete('/:notificationId', authMiddleware, deleteNotification);

module.exports = router;
