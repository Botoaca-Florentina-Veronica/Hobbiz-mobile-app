const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');

// GET /api/announcements?category=CategoryName
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let filter = {};
    if (category) {
      // Caută insensibil la majuscule/minuscule și ignoră spațiile
      filter.category = { $regex: `^${category.trim()}$`, $options: 'i' };
    }
    console.log('Filtru categorie:', filter);
    const announcements = await Announcement.find(filter).sort({ createdAt: -1 });
    console.log('Anunturi gasite:', announcements.length);
    res.json(announcements);
  } catch (error) {
    console.error('Eroare la filtrare anunțuri:', error);
    res.status(500).json({ error: 'Eroare server la filtrare anunțuri' });
  }
});


// GET /api/announcements/:id - detalii anunț
// GET /api/announcements/popular?limit=10 - cele mai populare după favoritesCount
router.get('/popular', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const announcements = await Announcement.find({})
      .sort({ favoritesCount: -1, createdAt: -1 })
      .limit(limit);
    res.json(announcements);
  } catch (error) {
    console.error('Eroare la popular:', error);
    res.status(500).json({ error: 'Eroare server la anunțuri populare' });
  }
});

// GET /api/announcements/:id - detalii anunț
router.get('/:id', async (req, res) => {
  try {
    // Increment views atomically then populate user
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('user', 'firstName lastName email phone avatar createdAt');
    if (!announcement) {
      return res.status(404).json({ error: 'Anunțul nu a fost găsit.' });
    }
    res.json(announcement);
  } catch (error) {
    console.error('Eroare la incrementarea views:', error);
    res.status(500).json({ error: 'Eroare server la preluarea anunțului.' });
  }
});

// POST /api/announcements/:id/favorite - incrementează favoritesCount
router.post('/:id/favorite', async (req, res) => {
  try {
    const updated = await Announcement.findByIdAndUpdate(
      req.params.id,
      { $inc: { favoritesCount: 1 } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Anunțul nu a fost găsit.' });
    res.json({ favoritesCount: updated.favoritesCount });
  } catch (error) {
    console.error('Eroare la favorite +1:', error);
    res.status(500).json({ error: 'Eroare server la actualizarea favorite' });
  }
});

// DELETE /api/announcements/:id/favorite - decrementează favoritesCount (min 0)
router.delete('/:id/favorite', async (req, res) => {
  try {
    const ann = await Announcement.findById(req.params.id);
    if (!ann) return res.status(404).json({ error: 'Anunțul nu a fost găsit.' });
    const newCount = Math.max(0, (ann.favoritesCount || 0) - 1);
    ann.favoritesCount = newCount;
    await ann.save();
    res.json({ favoritesCount: ann.favoritesCount });
  } catch (error) {
    console.error('Eroare la favorite -1:', error);
    res.status(500).json({ error: 'Eroare server la actualizarea favorite' });
  }
});

module.exports = router;
