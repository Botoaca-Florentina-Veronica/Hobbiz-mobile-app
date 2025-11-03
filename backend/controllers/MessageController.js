const Message = require('../models/Message');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { Types } = require('mongoose');

// Adaugă sau actualizează o reacție la un mesaj; repetarea aceleiași reacții o elimină (toggle)
const reactToMessage = async (req, res) => {
  try {
    const { id } = req.params; // message id
    const { emoji } = req.body;
    const userId = req.userId;

    if (!emoji || typeof emoji !== 'string') {
      return res.status(400).json({ error: 'Emoji lipsă sau invalid' });
    }

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ error: 'Mesajul nu a fost găsit' });
    }

    // Caută reacția utilizatorului curent
    const existingIndex = (message.reactions || []).findIndex(r => String(r.userId) === String(userId));
    if (existingIndex >= 0) {
      // Dacă e aceeași reacție -> eliminăm (toggle off); altfel actualizăm emoji-ul
      if (message.reactions[existingIndex].emoji === emoji) {
        message.reactions.splice(existingIndex, 1);
      } else {
        message.reactions[existingIndex].emoji = emoji;
        message.reactions[existingIndex].createdAt = new Date();
      }
    } else {
      message.reactions = message.reactions || [];
      message.reactions.push({ userId, emoji, createdAt: new Date() });
    }

    await message.save();
    // Atașăm și senderInfo pentru consistență cu celelalte răspunsuri
    let senderInfo = null;
    try {
      const sender = await User.findById(message.senderId).select('firstName lastName avatar');
      if (sender) {
        senderInfo = { firstName: sender.firstName, lastName: sender.lastName, avatar: sender.avatar };
      }
    } catch (_) {}

    return res.json({ ...message.toObject(), senderInfo });
  } catch (err) {
    console.error('Eroare reactToMessage:', err);
    return res.status(500).json({ error: 'Eroare la setarea reacției' });
  }
};

// Șterge un mesaj după id
const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const authenticatedUserId = req.userId;
    
    console.log('🗑️ DELETE /api/messages/:id - deleteMessage');
    console.log('   • ID mesaj:', id);
    console.log('   • UserId autentificat:', authenticatedUserId);
    
    // Găsim mesajul pentru a verifica proprietatea
    const message = await Message.findById(id);
    if (!message) {
      console.log('❌ Mesaj nu a fost găsit cu ID:', id);
      return res.status(404).json({ error: 'Mesajul nu a fost găsit.' });
    }
    
    console.log('   • Mesaj găsit - senderId:', message.senderId);
    console.log('   • Tip senderId:', typeof message.senderId);
    console.log('   • Tip authenticatedUserId:', typeof authenticatedUserId);
    console.log('   • Sunt egale?:', message.senderId === authenticatedUserId);
    
    // Verificăm că utilizatorul poate șterge mesajul (doar propriile mesaje)
    if (message.senderId !== authenticatedUserId) {
      console.log('❌ Utilizatorul nu poate șterge mesajul altui utilizator');
      return res.status(403).json({ error: 'Nu poți șterge mesajele altui utilizator.' });
    }
    
    const conversationId = message.conversationId;
    const otherParticipantId = String(message.senderId) === String(authenticatedUserId)
      ? message.destinatarId
      : message.senderId;

    await Message.findByIdAndDelete(id);
    console.log('✅ Mesaj șters cu succes:', id);

    // Dacă nu mai există mesaje în conversație, emitem un eveniment realtime pentru ambii participanți
    const remainingCount = await Message.countDocuments({ conversationId });
    if (remainingCount === 0) {
      try {
        const io = req.app.get('io');
        const activeUsers = req.app.get('activeUsers');
        if (io && activeUsers) {
          const notifyUsers = [String(authenticatedUserId), String(otherParticipantId)].filter(Boolean);
          for (const uid of notifyUsers) {
            const sid = activeUsers.get(String(uid));
            if (sid) {
              io.to(sid).emit('conversationEmpty', { conversationId });
            }
          }
        }
      } catch (_) {}
    }

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Eroare la ștergerea mesajului:', err);
    res.status(500).json({ error: 'Eroare la ștergerea mesajului.' });
  }
};

// Creează un mesaj nou și (opțional) o notificare pentru destinatar
const createMessage = async (req, res) => {
  try {
    console.log('➡️ POST /api/messages - createMessage');
    
    // Verificăm utilizatorul autentificat din middleware
    const authenticatedUserId = req.userId;
    if (!authenticatedUserId) {
      return res.status(401).json({ error: 'Utilizator neautentificat' });
    }
    
  const body = typeof req.body === 'object' && req.body !== null ? req.body : {};
    let {
      conversationId,
      senderId,
      senderRole,
      text,
      destinatarId,
      announcementId,
      image,
      imageFile,
      replyTo,
    } = body;
    
    console.log('   • Payload primit (chei):', Object.keys(body));
    
    // Validăm că senderId corespunde cu utilizatorul autentificat
    if (senderId && senderId !== authenticatedUserId) {
      return res.status(403).json({ error: 'Nu poți trimite mesaje în numele altui utilizator' });
    }
    
    // Folosim utilizatorul autentificat ca sender
    senderId = authenticatedUserId;
    
    const isValidObjectId = (id) => typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id);
    
    // Acceptăm mesaje cu text SAU imagine (una dintre ele e necesară)
    const hasText = !!(text && String(text).trim());
    const hasUploadedFile = !!req.file; // din multer
    const hasInlineImage = !!image; // fallback (ex: base64) - nu recomandat
    if (!hasText && !hasUploadedFile && !hasInlineImage) {
      return res.status(400).json({ error: 'Mesajul trebuie să conțină text sau imagine' });
    }
    
    // Asigurăm că avem un destinatar
    if (!destinatarId) {
      return res.status(400).json({
        error: 'Destinatarul este obligatoriu',
      });
    }
    
    // Generăm conversationId automat, scoped by announcement dacă este disponibil
    // Format propus (deterministic): `${ownerId}-${otherUserId}-${announcementId}`
    if (announcementId) {
      try {
        const Announcement = require('../models/Announcement');
        const ann = await Announcement.findById(announcementId).select('user');
        if (ann && ann.user) {
          const ownerId = String(ann.user);
          const otherId = String(ownerId) === String(senderId) ? String(destinatarId) : String(senderId);
          conversationId = [ownerId, otherId, announcementId].join('-');
        }
      } catch (_) {
        // dacă nu reușim să citim anunțul, cădem pe varianta clasică în doi
      }
    }
    if (!conversationId) {
      const participants = [senderId, destinatarId].sort();
      conversationId = participants.join('-');
    }
    
    const messageData = {
      conversationId,
      senderId,
      senderRole: senderRole || 'cumparator',
      destinatarId,
      createdAt: new Date(),
    };
    
    if (hasText) messageData.text = String(text).trim();
    // Reply info (safe subset)
    // Acceptă și string (din multipart) și obiect nativ
    if (typeof replyTo === 'string') {
      try {
        replyTo = JSON.parse(replyTo);
      } catch (e) {
        // Ignorăm parsing-ul eșuat
      }
    }
    if (replyTo && typeof replyTo === 'object') {
      messageData.replyTo = {
        messageId: String(replyTo.messageId || ''),
        senderId: String(replyTo.senderId || ''),
        text: replyTo.text ? String(replyTo.text).slice(0, 300) : undefined,
        image: replyTo.image ? String(replyTo.image) : undefined
      };
    }
    // Persistăm announcementId dacă este furnizat (pentru conversii/afișare)
    if (announcementId) {
      messageData.announcementId = String(announcementId);
    }

    // Imagine încărcată prin Cloudinary (multer)
    if (req.file && req.file.path) {
      messageData.image = req.file.path; // URL-ul public Cloudinary
      // req.file.originalname nu e disponibil cu CloudinaryStorage; folosim filename dacă e disponibil
      messageData.imageFile = req.file.originalname || req.file.filename || messageData.imageFile;
    } else if (image) {
      // fallback pentru compatibilitate (ex. base64) – recomandat să migrezi către upload multipart
      messageData.image = image;
      if (imageFile) messageData.imageFile = imageFile;
    }
    
    console.log('   • Salvăm mesajul în MongoDB...');
    const message = await new Message(messageData).save();
    console.log('✅ Mesaj salvat:', message._id);
    
    // Real-time message delivery via Socket.IO
    const io = req.app.get('io');
    const activeUsers = req.app.get('activeUsers');
    
    if (io && activeUsers && isValidObjectId(destinatarId) && String(destinatarId) !== String(senderId)) {
      const recipientSocketId = activeUsers.get(destinatarId);
      if (recipientSocketId) {
        // Get sender info for real-time message
        let senderInfo = null;
        try {
          const sender = await User.findById(senderId).select('firstName lastName avatar');
          if (sender) {
            senderInfo = { 
              firstName: sender.firstName, 
              lastName: sender.lastName, 
              avatar: sender.avatar 
            };
          }
        } catch (e) {
          console.warn('Could not fetch sender info for real-time message:', e.message);
        }
        
        // Emit the new message to the recipient
        io.to(recipientSocketId).emit('newMessage', {
          ...message.toObject(),
          senderInfo
        });
        console.log(`📨 Real-time message sent to user ${destinatarId}`);
      }
    }
    
    // Notificare – doar dacă avem un destinatar valid și diferit de expeditor
    if (isValidObjectId(destinatarId) && String(destinatarId) !== String(senderId)) {
      try {
        // Include message id so clients can deep-link to the exact message
        const link = `/chat/${conversationId}/${message._id}`;
        const existingNotification = await Notification.findOne({
          userId: destinatarId,
          link,
          read: false,
        });
        
        if (!existingNotification) {
          await Notification.create({
            userId: destinatarId,
            message: `Ai primit un mesaj nou${announcementId ? ` la anunțul #${announcementId}` : ''}`,
            link,
          });
        }

        // Trimite push notification dacă destinatarul are pushToken
        try {
          const recipient = await User.findById(destinatarId).select('pushToken');
          let sender = null;
          try { sender = await User.findById(senderId).select('firstName lastName'); } catch (_) {}
          const title = sender ? `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || 'Mesaj nou' : 'Mesaj nou';
          const body = hasText ? String(text).slice(0, 120) : (messageData.image ? 'Imagine nouă' : 'Mesaj nou');
          if (recipient && recipient.pushToken && /^ExponentPushToken\[.+\]$/.test(recipient.pushToken)) {
            // Folosim fetch global (Node 18+) cu fallback la node-fetch dacă e necesar
            const doFetch = (url, opts) => (typeof fetch !== 'undefined' ? fetch(url, opts) : require('node-fetch')(url, opts));
            await doFetch('https://exp.host/--/api/v2/push/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: recipient.pushToken,
                title,
                body,
                data: { link },
                priority: 'high',
                sound: 'default'
              })
            }).catch(() => {});
          }
        } catch (e) {
          console.warn('⚠️ Eroare trimitere push notification:', e.message);
        }
      } catch (notifErr) {
        console.warn('⚠️ Eroare la crearea notificării (non-fatal):', notifErr.message);
      }
    }
    
    return res.status(201).json(message);
  } catch (err) {
    console.error('❌ EROARE createMessage:', err);
    return res.status(500).json({
      error: err.message || 'Eroare internă la crearea mesajului',
      code: err.code,
      name: err.name,
    });
  }
};

// Obține toate conversațiile pentru un utilizator
const getConversations = async (req, res) => {
  try {
    const { userId } = req.params;
    const authenticatedUserId = req.userId;
    
    // Verificăm că utilizatorul solicită propriile conversații
    if (userId !== authenticatedUserId) {
      return res.status(403).json({ error: 'Nu poți accesa conversațiile altui utilizator' });
    }
    
    // Găsim toate mesajele în care utilizatorul este implicat
    const messages = await Message.find({
      $or: [
        { senderId: userId },
        { destinatarId: userId },
        { conversationId: { $regex: userId } } // conversationId conține userId-ul
      ]
    }).sort({ createdAt: -1 });
    
    console.log(`Găsite ${messages.length} mesaje pentru utilizatorul ${userId}`);
    
  // Grupăm mesajele pe (otherParticipantId, announcementId)
  const conversationMap = new Map();

  for (const message of messages) {
    let otherParticipantId = message.senderId === userId ? message.destinatarId : message.senderId;
    if (!otherParticipantId || otherParticipantId === userId) continue;
    // Determină announcementId și pentru mesaje legacy: dacă lipsește pe mesaj, încearcă să-l extragi din conversationId (format cu 3 părți)
    let announcementId = message.announcementId || '';
    if (!announcementId && message.conversationId) {
      const parts = String(message.conversationId).split('-');
      if (parts.length === 3) {
        const candidate = parts[2];
        if (/^[a-fA-F0-9]{24}$/.test(candidate)) {
          announcementId = candidate;
        }
      }
    }
    const key = `${otherParticipantId}_${announcementId}`;

    const contributesUnread = (
      message.senderId === otherParticipantId &&
      message.destinatarId === userId &&
      message.isRead === false
    );

    if (!conversationMap.has(key)) {
      try {
        const otherUser = await User.findById(otherParticipantId).select('firstName lastName avatar lastSeen');
        let announcementImage = null;
        let announcementOwnerId = null;
        let announcementTitle = null;
        let announcementOwnerName = null;
        if (announcementId) {
          try {
            const Announcement = require('../models/Announcement');
            const ann = await Announcement.findById(announcementId).select('images user title');
            if (ann) {
              if (Array.isArray(ann.images) && ann.images.length > 0) {
                announcementImage = ann.images[0];
              }
              if (ann.user) {
                announcementOwnerId = String(ann.user);
                try {
                  const owner = await User.findById(ann.user).select('firstName lastName');
                  if (owner) {
                    announcementOwnerName = `${owner.firstName || ''} ${owner.lastName || ''}`.trim() || 'Utilizator';
                  }
                } catch (_) {}
              }
              if (ann.title) {
                announcementTitle = ann.title;
              }
            }
          } catch (e) {}
        }
        if (otherUser) {
          conversationMap.set(key, {
            conversationId: message.conversationId,
            otherParticipant: {
              id: otherParticipantId,
              firstName: otherUser.firstName || 'Utilizator',
              lastName: otherUser.lastName || 'Necunoscut',
              avatar: otherUser.avatar || null,
              lastSeen: otherUser.lastSeen
            },
            lastMessage: {
              text: message.text,
              senderId: message.senderId,
              createdAt: message.createdAt
            },
            announcementId,
            announcementImage,
            announcementOwnerId,
            announcementTitle,
            announcementOwnerName,
            unread: !!contributesUnread,
            unreadCount: contributesUnread ? 1 : 0
          });
        }
      } catch (error) {
        console.error('Eroare la preluarea datelor utilizatorului:', error);
      }
    } else {
      const existingConversation = conversationMap.get(key);
      if (new Date(message.createdAt) > new Date(existingConversation.lastMessage.createdAt)) {
        existingConversation.lastMessage = {
          text: message.text,
          senderId: message.senderId,
          createdAt: message.createdAt
        };
        existingConversation.conversationId = message.conversationId;
      }
      if (contributesUnread) {
        existingConversation.unread = true;
        existingConversation.unreadCount = (existingConversation.unreadCount || 0) + 1;
      }
    }
  }

  const conversations = Array.from(conversationMap.values()).sort((a, b) =>
    new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt)
  );

  console.log(`Găsite ${conversations.length} conversații unice pentru utilizatorul ${userId}`);

  res.json(conversations);
  } catch (err) {
    console.error('Eroare la preluarea conversațiilor:', err);
    res.status(500).json({ error: err.message });
  }
};

// Obține toate mesajele între doi utilizatori
const getMessagesBetweenUsers = async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;
    const authenticatedUserId = req.userId;
    
    // Verificăm că utilizatorul autentificat este unul dintre participanți
    if (authenticatedUserId !== userId1 && authenticatedUserId !== userId2) {
      return res.status(403).json({ error: 'Nu poți accesa conversațiile altui utilizator' });
    }
    
    console.log(`Căutăm mesaje între ${userId1} și ${userId2}`);
    
    // Căutăm mesajele între cei doi utilizatori
    const messages = await Message.find({
      $or: [
        { senderId: userId1, destinatarId: userId2 },
        { senderId: userId2, destinatarId: userId1 },
        // Căutăm și în conversationId pentru compatibilitate cu mesajele vechi
        {
          $and: [
            { conversationId: { $regex: userId1 } },
            { conversationId: { $regex: userId2 } }
          ]
        }
      ]
    }).sort({ createdAt: 1 });
    
    console.log(`Query găsit: ${messages.length} mesaje`);
    
    // Preluam informațiile utilizatorilor pentru fiecare mesaj
    const messagesWithUserData = await Promise.all(
      messages.map(async (message) => {
        try {
          const sender = await User.findById(message.senderId).select('firstName lastName avatar');
          return {
            ...message.toObject(),
            senderInfo: sender ? {
              firstName: sender.firstName,
              lastName: sender.lastName,
              avatar: sender.avatar
            } : null
          };
        } catch (error) {
          console.error('Eroare la preluarea datelor utilizatorului:', error);
          return {
            ...message.toObject(),
            senderInfo: null
          };
        }
      })
    );
    
    console.log(`Răspuns final: ${messagesWithUserData.length} mesaje cu date utilizatori`);
    res.json(messagesWithUserData);
  } catch (err) {
    console.error('Eroare la preluarea mesajelor între utilizatori:', err);
    res.status(500).json({ error: err.message });
  }
};

// Obține toate mesajele pentru o conversație cu datele utilizatorilor
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const authenticatedUserId = req.userId;
    
    // Verificăm că utilizatorul autentificat face parte din conversație
    const participants = conversationId.split('-');
    if (!participants.includes(authenticatedUserId)) {
      return res.status(403).json({ error: 'Nu poți accesa această conversație' });
    }
    
    let messages = await Message.find({ conversationId }).sort({ createdAt: 1 });
    // Backward-compat: dacă e un id cu 3 părți (userA-userB-annId) și nu găsim nimic,
    // mai încercăm să încărcăm mesajele vechi pe formatul 2-parti participanți sortați
    if ((!messages || messages.length === 0) && participants.length === 3) {
      const legacyTwoPart = [participants[0], participants[1]].sort().join('-');
      const legacy = await Message.find({ conversationId: legacyTwoPart }).sort({ createdAt: 1 });
      if (legacy && legacy.length > 0) {
        messages = legacy;
      }
    }
    
    // Preluam informațiile utilizatorilor pentru fiecare mesaj
    const messagesWithUserData = await Promise.all(
      messages.map(async (message) => {
        try {
          const sender = await User.findById(message.senderId).select('firstName lastName avatar');
          return {
            ...message.toObject(),
            senderInfo: sender ? {
              firstName: sender.firstName,
              lastName: sender.lastName,
              avatar: sender.avatar
            } : null
          };
        } catch (error) {
          console.error('Eroare la preluarea datelor utilizatorului:', error);
          return {
            ...message.toObject(),
            senderInfo: null
          };
        }
      })
    );
    
    res.json(messagesWithUserData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Marchează mesajele ca citite pentru o conversație specifică (scoped by conversationId)
const markMessagesAsReadByConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const authenticatedUserId = req.userId;
    if (!conversationId) {
      return res.status(400).json({ error: 'conversationId este necesar' });
    }
    // Asigură că utilizatorul autentificat este parte a conversației
    const parts = String(conversationId).split('-');
    if (!parts.includes(String(authenticatedUserId))) {
      return res.status(403).json({ error: 'Nu poți marca drept citite o conversație a altora' });
    }
    // Găsește mesajele necitite ce urmează a fi marcate ca citite pentru a extrage ID-urile și expeditorii
    const unreadMessages = await Message.find({
      conversationId,
      senderId: { $ne: authenticatedUserId },
      isRead: false,
    }).select('_id senderId');

    if (!unreadMessages || unreadMessages.length === 0) {
      return res.json({ message: 'Nu sunt mesaje necitite', modifiedCount: 0 });
    }

    const now = new Date();
    const result = await Message.updateMany(
      {
        conversationId,
        senderId: { $ne: authenticatedUserId },
        isRead: false,
      },
      {
        isRead: true,
        readAt: now,
      }
    );

    // Emite eveniment realtime către ceilalți participanți din conversație (expeditorii mesajelor marcate)
    try {
      const io = req.app.get('io');
      const activeUsers = req.app.get('activeUsers');
      if (io && activeUsers) {
        const notifyUserIds = Array.from(new Set(unreadMessages.map(m => String(m.senderId))));
        const messageIds = unreadMessages.map(m => String(m._id));
        for (const uid of notifyUserIds) {
          const sid = activeUsers.get(uid);
          if (sid) {
            io.to(sid).emit('messagesRead', {
              conversationId,
              readerId: String(authenticatedUserId),
              messageIds,
              readAt: now.toISOString(),
            });
          }
        }
      }
    } catch (_) { /* noop */ }

    res.json({ message: 'Mesajele au fost marcate ca citite pentru conversație', modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Marchează mesajele ca citite
const markMessagesAsRead = async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;
    
    if (!userId || !otherUserId) {
      return res.status(400).json({ error: 'userId și otherUserId sunt necesare' });
    }
    
    // Găsește conversația între cei doi utilizatori
    const participants = [userId, otherUserId].sort();
    const conversationId = participants.join('-');
    
    // Marchează toate mesajele necitite din această conversație care NU sunt ale utilizatorului curent ca fiind citite
    // Identificăm mesajele necitite pentru a obține ID-urile
    const unreadMessages = await Message.find({
      conversationId: conversationId,
      senderId: { $ne: userId },
      isRead: false,
    }).select('_id senderId');

    if (!unreadMessages || unreadMessages.length === 0) {
      return res.json({ message: 'Nu sunt mesaje necitite', modifiedCount: 0 });
    }

    const now = new Date();
    const result = await Message.updateMany(
      { 
        conversationId: conversationId,
        senderId: { $ne: userId }, // Mesajele care NU sunt ale utilizatorului curent
        isRead: false // Doar mesajele necitite
      },
      { 
        isRead: true,
        readAt: now
      }
    );

    // Emitere realtime către celălalt participant (otherUserId)
    try {
      const io = req.app.get('io');
      const activeUsers = req.app.get('activeUsers');
      if (io && activeUsers) {
        const sid = activeUsers.get(String(otherUserId));
        if (sid) {
          io.to(sid).emit('messagesRead', {
            conversationId,
            readerId: String(userId),
            messageIds: unreadMessages.map(m => String(m._id)),
            readAt: now.toISOString(),
          });
        }
      }
    } catch (_) { /* noop */ }
    
    res.json({ 
      message: 'Mesajele au fost marcate ca citite',
      modifiedCount: result.modifiedCount 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get unread message count for a user
const getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId este necesar' });
    }

    // Numără toate mesajele necitite unde userId este destinatar
    const unreadCount = await Message.countDocuments({
      destinatarId: userId,
      isRead: false
    });

    res.json({ unreadCount });
  } catch (err) {
    console.error('Error getting unread count:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createMessage,
  deleteMessage,
  getConversations,
  getMessagesBetweenUsers,
  getMessages,
  markMessagesAsRead,
  markMessagesAsReadByConversation,
  reactToMessage,
  getUnreadCount
};
