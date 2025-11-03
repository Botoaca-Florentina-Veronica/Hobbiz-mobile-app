const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  conversationId: { type: String, required: true },
  senderId: { type: String, required: true },
  senderRole: { type: String, enum: ['cumparator', 'vanzator'], required: true },
  destinatarId: { type: String, required: false },
  text: { type: String, required: false }, // Text nu mai e obligatoriu dacă avem imagine
  image: { type: String, required: false }, // URL sau base64 pentru imagine
  imageFile: { type: String, required: false }, // Numele fișierului original
  // Informații opționale pentru răspuns (reply)
    announcementId: { type: String, required: false }, // Referință la anunțul asociat conversației (opțional)
  replyTo: {
    messageId: { type: String, required: false },
    senderId: { type: String, required: false },
    text: { type: String, required: false },
    image: { type: String, required: false }
  },
  // Reacții la mesaj: un utilizator poate avea cel mult o reacție pe mesaj
  reactions: [
    {
      userId: { type: String, required: true },
      emoji: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  isRead: { type: Boolean, default: false }, // Statusul de citit al mesajului
  readAt: { type: Date, default: null }, // Când a fost citit mesajul
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', MessageSchema);
