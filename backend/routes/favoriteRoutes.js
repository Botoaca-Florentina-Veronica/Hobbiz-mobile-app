const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Announcement = require('../models/Announcement');

// GET /api/favorites - lista completă a anunțurilor favorite (cu populate opțional)
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('favorites');
    if (!user) return res.status(404).json({ error: 'Utilizator negăsit' });
    res.json({ favoriteIds: user.favorites.map(a => a._id), favorites: user.favorites });
  } catch (e) {
    console.error('Eroare GET /favorites:', e);
    res.status(500).json({ error: 'Eroare server la preluarea listei de favorite' });
  }
});

// POST /api/favorites/:announcementId - adaugă anunț la favorite
router.post('/:announcementId', auth, async (req, res) => {
  try {
    const { announcementId } = req.params;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'Utilizator negăsit' });

    // Evită duplicate
    if (user.favorites.some(f => f.toString() === announcementId)) {
      return res.status(200).json({ message: 'Deja în favorite', favoriteIds: user.favorites });
    }

    const ann = await Announcement.findById(announcementId);
    if (!ann) return res.status(404).json({ error: 'Anunț negăsit' });

    user.favorites.push(announcementId);
    ann.favoritesCount = (ann.favoritesCount || 0) + 1; // sincronizează counter existent

    await Promise.all([user.save(), ann.save()]);

    // Emit realtime update doar către utilizatorul curent
    try {
      const io = req.app.get('io');
      const activeUsers = req.app.get('activeUsers');
      if (io && activeUsers) {
        const sid = activeUsers.get(String(req.userId));
        if (sid) io.to(sid).emit('favoritesUpdated', { favoriteIds: user.favorites });
      }
    } catch (_) {}

    res.status(201).json({
      message: 'Adăugat la favorite',
      favoriteIds: user.favorites,
      favoritesCount: ann.favoritesCount
    });
  } catch (e) {
    console.error('Eroare POST /favorites:', e);
    res.status(500).json({ error: 'Eroare server la adăugarea la favorite' });
  }
});

// DELETE /api/favorites/:announcementId - elimină anunț din favorite
router.delete('/:announcementId', auth, async (req, res) => {
  try {
    const { announcementId } = req.params;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'Utilizator negăsit' });

    const before = user.favorites.length;
    user.favorites = user.favorites.filter(f => f.toString() !== announcementId);
    const removed = before !== user.favorites.length;

    const ann = await Announcement.findById(announcementId);
    if (ann && removed) {
      ann.favoritesCount = Math.max(0, (ann.favoritesCount || 0) - 1);
      await ann.save();
    }

    await user.save();

    // Emit realtime update doar către utilizatorul curent
    try {
      const io = req.app.get('io');
      const activeUsers = req.app.get('activeUsers');
      if (io && activeUsers) {
        const sid = activeUsers.get(String(req.userId));
        if (sid) io.to(sid).emit('favoritesUpdated', { favoriteIds: user.favorites });
      }
    } catch (_) {}

    res.json({
      message: removed ? 'Eliminat din favorite' : 'Nu era în favorite',
      favoriteIds: user.favorites,
      favoritesCount: ann ? ann.favoritesCount : undefined
    });
  } catch (e) {
    console.error('Eroare DELETE /favorites:', e);
    res.status(500).json({ error: 'Eroare server la eliminarea din favorite' });
  }
});

module.exports = router;
