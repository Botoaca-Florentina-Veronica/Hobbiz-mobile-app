const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const upload = require('../config/cloudinaryMulter');
const { register, login, getProfile, updateEmail, updatePassword, addAnnouncement, getMyAnnouncements, getMyAnnouncementById, getUserAnnouncementsPublic, deleteAnnouncement, updateAnnouncement, updateProfile, deleteAccount, uploadAvatar, registerPushToken, removePushToken } = require('../controllers/UserController');
// Upload avatar utilizator
router.post('/avatar', auth, upload.single('avatar'), uploadAvatar);
// Șterge contul utilizatorului și toate anunțurile sale
router.delete('/delete-account', auth, deleteAccount);

// Rute
router.post('/register', register);  // User e folosit în controller
router.post('/login', login);       // User e folosit în controller
router.get('/profile', auth, getProfile); // User e folosit în controller
router.get('/profile/:userId', optionalAuth, getProfile); // Profil public pentru orice utilizator
// Anunțuri publice pentru un utilizator (folosite pe pagina publică de profil)
router.get('/announcements/:userId', optionalAuth, getUserAnnouncementsPublic);
router.put('/update-email', auth, updateEmail); // Noua rută pentru actualizarea email-ului
router.put('/update-password', auth, updatePassword); // Rută pentru schimbarea parolei
router.post('/my-announcements', auth, upload.array('images', 10), addAnnouncement);
router.get('/my-announcements', auth, getMyAnnouncements);
router.get('/my-announcements/:id', auth, getMyAnnouncementById);
router.delete('/my-announcements/:id', auth, deleteAnnouncement);
router.put('/my-announcements/:id', auth, upload.array('images', 10), updateAnnouncement);
router.put('/profile', auth, updateProfile); // Rută pentru actualizarea profilului (nume, prenume, localitate, telefon)

// Push notifications tokens
router.post('/push-token', auth, registerPushToken);
router.delete('/push-token', auth, removePushToken);

// Verifică autentificarea utilizatorului
router.get('/auth/check', auth, async (req, res) => {
  try {
    const user = await require('../models/User').findById(req.userId);
    if (!user) return res.json({ isAuthenticated: false });
    res.json({
      isAuthenticated: true,
      avatar: user.avatar || null,
      googleAvatar: user.googleId ? user.avatar : null
    });
  } catch (e) {
    res.json({ isAuthenticated: false });
  }
});

module.exports = router;