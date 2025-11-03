const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getNotifications, createNotification, markAsRead, deleteNotification } = require('../controllers/NotificationController');

// GET toate notificările pentru un user (necesită autentificare)
router.get('/:userId', auth, getNotifications);

// POST creează notificare nouă
router.post('/', createNotification);

// PATCH marchează ca citită
router.patch('/:id/read', markAsRead);

// DELETE șterge notificare (cu autentificare)
router.delete('/:id', auth, deleteNotification);

module.exports = router;
