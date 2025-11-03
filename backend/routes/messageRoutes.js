const express = require('express');
const router = express.Router();
const { createMessage, deleteMessage, getConversations, getMessagesBetweenUsers, getMessages, markMessagesAsRead, markMessagesAsReadByConversation, reactToMessage, getUnreadCount } = require('../controllers/MessageController');
const auth = require('../middleware/auth');
const upload = require('../config/cloudinaryMulter');

// Creează un mesaj nou
router.post('/', auth, upload.single('image'), createMessage);

// Șterge un mesaj după id
router.delete('/:id', auth, deleteMessage);

// Reacționează la un mesaj (toggle/update)
router.post('/:id/react', auth, reactToMessage);

// Obține conversațiile pentru un utilizator
router.get('/conversations/:userId', auth, getConversations);

// Obține mesajele între doi utilizatori
router.get('/between/:userId1/:userId2', auth, getMessagesBetweenUsers);

// Obține toate mesajele pentru o conversație (scoped by conversationId)
router.get('/conversation/:conversationId', auth, getMessages);

// Marchează mesajele ca citite
router.put('/mark-read/:userId/:otherUserId', auth, markMessagesAsRead);

// Marchează mesajele ca citite pentru o conversație specifică (scoped)
router.put('/conversation/:conversationId/mark-read', auth, markMessagesAsReadByConversation);

// Obține numărul de mesaje necitite pentru un utilizator
router.get('/unread-count/:userId', auth, getUnreadCount);

module.exports = router;
