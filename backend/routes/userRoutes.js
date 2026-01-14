const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");
const optionalAuth = require("../middleware/optionalAuth");
const upload = require("../config/cloudinaryMulter");
const uploadDocuments = require("../config/cloudinaryDocuments");
const {
  register,
  login,
  getProfile,
  updateEmail,
  updatePassword,
  requestPasswordReset,
  confirmPasswordReset,
  addAnnouncement,
  getMyAnnouncements,
  getMyAnnouncementById,
  getUserAnnouncementsPublic,
  deleteAnnouncement,
  updateAnnouncement,
  updateProfile,
  deleteAccount,
  uploadAvatar,
  uploadCover,
  deleteAvatar,
  deleteCover,
  archiveAnnouncement,
  getArchivedAnnouncements,
  unarchiveAnnouncement,
  setPushToken,
  deletePushToken,
  uploadVerificationDocument,
  getUserDocuments,
  deleteUserDocument,
  getPendingVerifications,
  getUserDocumentsAdmin,
  verifyDocument,
  toggleUserVerification,
} = require("../controllers/UserController");
// Upload avatar utilizator
router.post("/avatar", auth, upload.single("avatar"), uploadAvatar);
router.delete("/avatar", auth, deleteAvatar);
// Upload cover (banner) image
router.post("/cover", auth, upload.single("cover"), uploadCover);
router.delete("/cover", auth, deleteCover);
// Șterge contul utilizatorului și toate anunțurile sale
router.delete("/delete-account", auth, deleteAccount);

// Rute
router.post("/register", register); // User e folosit în controller
router.post("/login", login); // User e folosit în controller
// Password reset (email code)
router.post("/password-reset/request", requestPasswordReset);
router.post("/password-reset/confirm", confirmPasswordReset);
router.get("/profile", auth, getProfile); // User e folosit în controller
router.get("/profile/:userId", optionalAuth, getProfile); // Profil public pentru orice utilizator
// Anunțuri publice pentru un utilizator (folosite pe pagina publică de profil)
router.get("/announcements/:userId", optionalAuth, getUserAnnouncementsPublic);
router.put("/update-email", auth, updateEmail); // Noua rută pentru actualizarea email-ului
router.put("/update-password", auth, updatePassword); // Rută pentru schimbarea parolei
router.post(
  "/my-announcements",
  auth,
  upload.array("images", 10),
  addAnnouncement
);
router.get("/my-announcements", auth, getMyAnnouncements);
// IMPORTANT: Rutele cu path-uri specifice trebuie să fie ÎNAINTE de rutele cu parametri dinamici (:id)
router.get("/my-announcements/archived", auth, getArchivedAnnouncements);
router.put("/my-announcements/:id/archive", auth, archiveAnnouncement);
router.put("/my-announcements/:id/unarchive", auth, unarchiveAnnouncement);
// Rutele cu :id dinamice vin la final
router.get("/my-announcements/:id", auth, getMyAnnouncementById);
router.delete("/my-announcements/:id", auth, deleteAnnouncement);
router.put(
  "/my-announcements/:id",
  auth,
  upload.array("images", 10),
  updateAnnouncement
);
router.put("/profile", auth, updateProfile); // Rută pentru actualizarea profilului (nume, prenume, localitate, telefon)

// Verifică autentificarea utilizatorului
router.get("/auth/check", auth, async (req, res) => {
  try {
    const user = await require("../models/User").findById(req.userId);
    if (!user) return res.json({ isAuthenticated: false });
    res.json({
      isAuthenticated: true,
      avatar: user.avatar || null,
      googleAvatar: user.googleId ? user.avatar : null,
    });
  } catch (e) {
    res.json({ isAuthenticated: false });
  }
});

// Push token endpoints - store / remove Expo push token for authenticated user
router.post("/push-token", auth, setPushToken);
router.delete("/push-token", auth, deletePushToken);

// --- VERIFICATION SYSTEM ROUTES ---

// User routes - upload and manage their own documents
router.post(
  "/documents",
  auth,
  uploadDocuments.single("document"),
  uploadVerificationDocument
);
router.get("/documents", auth, getUserDocuments);
router.delete("/documents/:documentId", auth, deleteUserDocument);

// Admin routes - view and verify documents
router.get(
  "/admin/verifications/pending",
  auth,
  adminAuth,
  getPendingVerifications
);
router.get(
  "/admin/users/:userId/documents",
  auth,
  adminAuth,
  getUserDocumentsAdmin
);
router.put(
  "/admin/users/:userId/documents/:documentId/verify",
  auth,
  adminAuth,
  verifyDocument
);
router.put(
  "/admin/users/:userId/verification-badge",
  auth,
  adminAuth,
  toggleUserVerification
);

module.exports = router;
