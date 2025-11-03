const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { execFile } = require('child_process');
const Alert = require('../models/Alert');
const Announcement = require('../models/Announcement');
const multer = require('multer');
const path = require('path');
const cloudinaryUpload = require('../config/cloudinaryMulter');
const mongoose = require('mongoose');

// Upload avatar utilizator
const uploadAvatar = async (req, res) => {
  try {
    const userId = req.userId;
    if (!req.file || !req.file.path) {
      return res.status(400).json({ error: 'Nicio imagine încărcată.' });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilizator negăsit.' });
    }
    user.avatar = req.file.path;
    await user.save();
    res.json({ message: 'Avatar actualizat cu succes!', avatar: user.avatar });
  } catch (error) {
    console.error('Eroare la upload avatar:', error);
    res.status(500).json({ error: 'Eroare server la upload avatar.' });
  }
};

// Utilitare pentru email normalization & duplicate merge
const normalizeEmail = (email) => (email || '').trim().toLowerCase();
const escapeRegex = (str='') => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function mergeDuplicateUsersByEmail(normalizedEmail) {
  if (!normalizedEmail) return null;
  try {
    // Căutăm toate conturile care diferă doar prin case
    const regex = new RegExp(`^${escapeRegex(normalizedEmail)}$`, 'i');
    const users = await User.find({ email: regex });
    if (users.length <= 1) return users[0] || null;

    // Alegem "primary" pe baza priorităților: are și googleId și password > are password > are googleId > cel mai vechi
    const score = (u) => (
      (u.googleId ? 2 : 0) + (u.password ? 3 : 0) + Math.max(0, 1 - Math.min(1, (Date.now() - u.createdAt)/86400000))
    );
    let primary = users[0];
    for (const u of users) {
      if (score(u) > score(primary)) primary = u;
    }

    // Construim set de favorite și păstrăm câmpuri lipsă (firstName/lastName/avatar) dacă primary nu le are
    const favSet = new Set();
    users.forEach(u => (u.favorites || []).forEach(f => favSet.add(f.toString())));
    primary.favorites = Array.from(favSet);

    // Completează date lipsă
    for (const u of users) {
      if (!primary.firstName && u.firstName) primary.firstName = u.firstName;
      if (!primary.lastName && u.lastName) primary.lastName = u.lastName;
      if (!primary.avatar && u.avatar) primary.avatar = u.avatar;
      if (!primary.phone && u.phone) primary.phone = u.phone;
      if (!primary.localitate && u.localitate) primary.localitate = u.localitate;
    }

    // Normalizează email-ul principal la lowercase
    primary.email = normalizeEmail(primary.email);
    await primary.save();

    // Șterge duplicatele non-primary
    const toDelete = users.filter(u => String(u._id) !== String(primary._id));
    if (toDelete.length) {
      await User.deleteMany({ _id: { $in: toDelete.map(u => u._id) } });
      console.log(`[MergeFavorites] Eliminat duplicate: ${toDelete.map(u=>u._id).join(', ')} -> primary ${primary._id}`);
    }
    return primary;
  } catch (e) {
    console.warn('[MergeFavorites] Eroare la merge duplicate:', e.message);
    return null;
  }
}

// Șterge utilizatorul și toate anunțurile sale
const deleteAccount = async (req, res) => {
  try {
    const userId = req.userId;
    // Șterge toate anunțurile utilizatorului
    await Announcement.deleteMany({ user: userId });
    // Șterge utilizatorul
    await User.findByIdAndDelete(userId);
    res.json({ message: 'Contul și toate anunțurile au fost șterse cu succes.' });
  } catch (error) {
    console.error('Eroare la ștergerea contului:', error);
    res.status(500).json({ error: 'Eroare server la ștergerea contului' });
  }
};

// Înregistrare utilizator
const register = async (req, res) => {
  try { 
    let { firstName, lastName, email, password, phone } = req.body;
    const normalizedEmail = normalizeEmail(email);

    // Validare date
    if (!firstName || !lastName || !normalizedEmail || !password) {
      return res.status(400).json({ error: 'Toate câmpurile sunt obligatorii' });
    }

    // Verifică dacă emailul există
    const existingUser = await User.findOne({ email: new RegExp(`^${escapeRegex(normalizedEmail)}$`, 'i') });
    if (existingUser) {
      return res.status(400).json({ error: 'Emailul este deja înregistrat' });
    }

    // Creează utilizator nou
    const user = new User({
      firstName,
      lastName,
      email: normalizedEmail,
      password,
      phone
    });

    await user.save();
    
    // Generează token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({ 
      message: 'Cont creat cu succes',
      token,
      userId: user._id
    });

  } catch (error) {
    console.error('Eroare înregistrare:', error);
    res.status(500).json({ error: 'Eroare server la înregistrare' });
  }
};

// Autentificare utilizator
const login = async (req, res) => {
  try {
  let { email, password } = req.body;
  const normalizedEmail = normalizeEmail(email);

    // Validare
  if (!normalizedEmail || !password) {
      return res.status(400).json({ error: 'Email și parolă sunt obligatorii' });
    }

    // Găsește utilizator
  // Căutare case-insensitive
  let user = await User.findOne({ email: new RegExp(`^${escapeRegex(normalizedEmail)}$`, 'i') });
    if (!user) {
      return res.status(401).json({ error: 'Date de autentificare invalide' });
    }

    // Verifică parola
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Date de autentificare invalide' });
    }

    // === MITM DETECTION ===
  execFile('../mitm-detector.exe', ['Ethernet'], (error, stdout, stderr) => {
      let alerts = [];
      if (error) {
        console.error('Eroare la rularea detectorului:', error);
        // Nu bloca login-ul dacă detectorul dă eroare, doar loghează
      } else {
        try {
          alerts = JSON.parse(stdout);
        } catch (e) {
          alerts = stdout.split('\n').filter(Boolean);
        }
        if (alerts.length > 0) {
          Alert.create({
            username: email,
            alert: alerts.join('; '),
            timestamp: new Date()
          });
        }
      }
    });
    // === END MITM DETECTION ===

    // Generează token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Normalizează email-ul în document dacă nu e deja (evită viitoare duplicate)
    if (user.email !== normalizedEmail) {
      user.email = normalizedEmail;
      try { await user.save(); } catch (_) {}
    }

    // Merge duplicate accounts (dacă există) -> preferăm contul curent ca primary
    const mergedPrimary = await mergeDuplicateUsersByEmail(normalizedEmail) || user;

    console.log('Token generat pentru user:', mergedPrimary._id);

    res.json({ 
      message: 'Autentificare reușită',
      token,
      userId: mergedPrimary._id,
      firstName: mergedPrimary.firstName
    });

  } catch (error) {
    console.error('Eroare autentificare:', error);
    res.status(500).json({ error: 'Eroare server la autentificare' });
  }
};

// Înregistrează Expo/FCM push token pentru utilizatorul autentificat
const registerPushToken = async (req, res) => {
  try {
    const userId = req.userId;
    const { token } = req.body || {};
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Token invalid' });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'Utilizator negăsit' });
    user.pushToken = token;
    await user.save();
    res.json({ success: true });
  } catch (e) {
    console.error('Eroare registerPushToken:', e);
    res.status(500).json({ error: 'Eroare la salvarea push token' });
  }
};

// Elimină push token (logout/dezinstalare)
const removePushToken = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'Utilizator negăsit' });
    user.pushToken = undefined;
    await user.save();
    res.json({ success: true });
  } catch (e) {
    console.error('Eroare removePushToken:', e);
    res.status(500).json({ error: 'Eroare la eliminarea push token' });
  }
};

// Obține profil utilizator
const getProfile = async (req, res) => {
  try {
    // Verificăm dacă există userId în parametri (profil public) sau folosim userId din auth (profil propriu)
    const targetUserId = req.params.userId || req.userId;
    
    // Găsim utilizatorul fără parola
    const user = await User.findById(targetUserId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'Utilizator negăsit' });
    }

    // Atașăm recenziile asociate acestui utilizator (dacă modelul Review există)
    try {
      const Review = require('../models/Review');
      const reviews = await Review.find({ user: targetUserId }).sort({ createdAt: -1 }).lean();
      // Populate basic author info if possible
      const UserModel = require('../models/User');
      const authorIds = Array.from(new Set(reviews.map(r => String(r.author)).filter(Boolean)));
      let authors = {};
      if (authorIds.length) {
        const authorDocs = await UserModel.find({ _id: { $in: authorIds } }).select('firstName lastName avatar').lean();
        authorDocs.forEach(a => { authors[String(a._id)] = a; });
      }
      // Map reviews to include authorName/authorAvatar for frontend convenience
      const reviewsMapped = reviews.map(r => ({
        _id: r._id,
        score: r.score,
        comment: r.comment,
        createdAt: r.createdAt,
        author: r.author,
        authorName: r.author ? ((authors[String(r.author)]?.firstName || '') + (authors[String(r.author)]?.lastName ? (' ' + authors[String(r.author)].lastName) : '')) : undefined,
        authorAvatar: r.author ? authors[String(r.author)]?.avatar : undefined,
        likes: r.likes || [],
        likesCount: (r.likes || []).length,
        likedByCurrentUser: req.userId ? ((r.likes || []).some(id => String(id) === String(req.userId))) : false
      }));

      const userObj = user.toObject();
      userObj.reviews = reviewsMapped;
      return res.json(userObj);
    } catch (e) {
      // Dacă modelul Review nu există sau există o eroare, returnăm userul fără recenzii
      console.warn('Nu am reușit să încarc recenziile:', e.message);
      return res.json(user);
    }

  } catch (error) {
    console.error('Eroare profil:', error);
    res.status(500).json({ error: 'Eroare server la obținerea profilului' });
  }
};

// Actualizează email utilizator
const updateEmail = async (req, res) => {
  try {
    const userId = req.userId; // Obținut din middleware-ul de autentificare
    const { newEmail, password } = req.body;

    // Validare email
    if (!newEmail) {
      return res.status(400).json({ error: 'Noul email este obligatoriu' });
    }

    // Validare parolă
    if (!password) {
      return res.status(400).json({ error: 'Parola este obligatorie pentru confirmare' });
    }

    // Basic email format validation (can be more robust)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
        return res.status(400).json({ error: 'Format email invalid' });
    }

    // Verifică dacă noul email există deja pentru un alt utilizator
    const existingUserWithNewEmail = await User.findOne({ email: newEmail, _id: { $ne: userId } });
    if (existingUserWithNewEmail) {
      return res.status(400).json({ error: 'Acest email este deja utilizat' });
    }

    // Găsește utilizatorul și verifică parola
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilizator negăsit' });
    }

    // Verifică parola
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Parola este incorectă' });
    }

    user.email = newEmail;
    await user.save();

    res.json({ message: 'Email actualizat cu succes!' });

  } catch (error) {
    console.error('Eroare la actualizarea email-ului:', error);
    res.status(500).json({ error: 'Eroare server la actualizarea email-ului' });
  }
};

// Actualizează parola utilizator
const updatePassword = async (req, res) => {
  try {
    const userId = req.userId; // Obținut din middleware-ul de autentificare
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Toate câmpurile sunt obligatorii' });
    }

    // Găsește utilizatorul
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilizator negăsit' });
    }

    // Verifică parola curentă
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Parola curentă este incorectă' });
    }

    // Setează noua parolă (va fi hash-uită automat de pre-save hook)
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Parola a fost schimbată cu succes!' });
  } catch (error) {
    console.error('Eroare la schimbarea parolei:', error);
    res.status(500).json({ error: 'Eroare server la schimbarea parolei' });
  }
};

// Adaugă un anunț nou pentru utilizatorul autentificat
const addAnnouncement = async (req, res) => {
  try {
    console.log('--- [addAnnouncement] req.body:', req.body);
    console.log('--- [addAnnouncement] req.file:', req.file);
    console.log('--- [addAnnouncement] req.userId:', req.userId);
    const userId = req.userId;
    const { title, category, description, location, contactPerson, contactEmail, contactPhone } = req.body;
    if (!title || !category || !description || !location || !contactPerson) {
      return res.status(400).json({ error: 'Toate câmpurile obligatorii trebuie completate.' });
    }
    // Salvează toate imaginile încărcate (upload multiplu)
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(f => f.path);
    }
    const announcement = new Announcement({
      user: userId,
      title,
      category,
      description,
      location,
      contactPerson,
      contactEmail,
      contactPhone,
      images
    });
    await announcement.save();

    // Emit realtime event doar utilizatorului (lista lui) – în viitor se poate extinde
    try {
      const io = req.app.get('io');
      const activeUsers = req.app.get('activeUsers');
      if (io && activeUsers) {
        const sid = activeUsers.get(String(userId));
        if (sid) io.to(sid).emit('announcementCreated', { id: announcement._id });
      }
    } catch (_) {}

    res.status(201).json({ message: 'Anunț adăugat cu succes!' });
  } catch (error) {
    console.error('Eroare la adăugare anunț:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
};

// Returnează toate anunțurile utilizatorului autentificat
const getMyAnnouncements = async (req, res) => {
  try {
    const userId = req.userId;
    const announcements = await Announcement.find({ user: userId }).sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    console.error('Eroare la listare anunțuri:', error);
    res.status(500).json({ error: 'Eroare server la listare anunțuri' });
  }
};

// Obține un singur anunț după ID (doar al utilizatorului autentificat)
const getMyAnnouncementById = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const announcement = await Announcement.findOne({ _id: id, user: userId });
    if (!announcement) {
      return res.status(404).json({ error: 'Anunțul nu a fost găsit' });
    }
    res.json(announcement);
  } catch (error) {
    console.error('Eroare la obținere anunț:', error);
    res.status(500).json({ error: 'Eroare server la obținere anunț' });
  }
};

// Returnează anunțurile publice pentru un utilizator specific (vizualizare publică)
const getUserAnnouncementsPublic = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: 'Lipsește userId' });
    const announcements = await Announcement.find({ user: userId }).sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    console.error('Eroare la listare anunțuri publice:', error);
    res.status(500).json({ error: 'Eroare server la listare anunțuri publice' });
  }
};

// Șterge un anunț după id
const deleteAnnouncement = async (req, res) => {
  try {
    const userId = req.userId;
    const announcementId = req.params.id;
    const Announcement = require('../models/Announcement');
    const announcement = await Announcement.findOne({ _id: announcementId, user: userId });
    if (!announcement) {
      return res.status(404).json({ error: 'Anunțul nu a fost găsit sau nu îți aparține.' });
    }
    await Announcement.deleteOne({ _id: announcementId });
    // Emit realtime
    try {
      const io = req.app.get('io');
      const activeUsers = req.app.get('activeUsers');
      if (io && activeUsers) {
        const sid = activeUsers.get(String(userId));
        if (sid) io.to(sid).emit('announcementDeleted', { id: announcementId });
      }
    } catch (_) {}

    res.json({ message: 'Anunț șters cu succes!' });
  } catch (error) {
    console.error('Eroare la ștergerea anunțului:', error);
    res.status(500).json({ error: 'Eroare server la ștergerea anunțului' });
  }
};

// Actualizează un anunț existent
const updateAnnouncement = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { title, category, description, location, contactPerson, contactEmail, contactPhone, existingImages } = req.body;
    let announcement = await Announcement.findOne({ _id: id, user: userId });
    if (!announcement) {
      return res.status(404).json({ error: 'Anunțul nu a fost găsit' });
    }
    // Actualizează câmpurile text
    announcement.title = title;
    announcement.category = category;
    announcement.description = description;
    announcement.location = location;
    announcement.contactPerson = contactPerson;
    announcement.contactEmail = contactEmail;
    announcement.contactPhone = contactPhone;
    
    // Gestionează imaginile
    let finalImages = [];
    
    // Adaugă imaginile existente care nu au fost șterse
    if (existingImages) {
      try {
        const parsedExisting = typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages;
        if (Array.isArray(parsedExisting)) {
          finalImages = parsedExisting;
        }
      } catch (e) {
        console.error('Error parsing existingImages:', e);
      }
    }
    
    // Adaugă imaginile noi uploadate
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(f => f.path);
      finalImages = [...finalImages, ...newImages];
    }
    
    // Limitează la maxim 10 imagini
    announcement.images = finalImages.slice(0, 10);
    
    await announcement.save();
    // Emit realtime update (could be treated similar to created for list refresh)
    try {
      const io = req.app.get('io');
      const activeUsers = req.app.get('activeUsers');
      if (io && activeUsers) {
        const sid = activeUsers.get(String(userId));
        if (sid) io.to(sid).emit('announcementCreated', { id: announcement._id, updated: true });
      }
    } catch (_) {}
    res.json({ message: 'Anunț actualizat cu succes!' });
  } catch (error) {
    console.error('Eroare la actualizare anunț:', error);
    res.status(500).json({ error: 'Eroare server la actualizare anunț' });
  }
};

// Actualizează profilul utilizatorului (nume, prenume, localitate, telefon)
const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { firstName, lastName, localitate, phone } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilizator negăsit' });
    }
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (localitate !== undefined) user.localitate = localitate;
    if (phone !== undefined) user.phone = phone;
    await user.save();
    res.json({ message: 'Profil actualizat cu succes!' });
  } catch (error) {
    console.error('Eroare la actualizarea profilului:', error);
    res.status(500).json({ error: 'Eroare server la actualizarea profilului' });
  }
};

module.exports = {
  deleteAccount,
  register,
  login,
  getProfile,
  updateEmail,
  updatePassword,
  addAnnouncement,
  getMyAnnouncements,
  getMyAnnouncementById,
  getUserAnnouncementsPublic,
  deleteAnnouncement,
  updateAnnouncement,
  updateProfile,
  uploadAvatar,
  registerPushToken,
  removePushToken
};