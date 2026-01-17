const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  message: { type: String, required: true },
  link: { type: String }, // link către chat, anunț sau pagină relevantă
  createdAt: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },

  // Pentru notificări mai complexe (verificări, documente, etc.)
  type: {
    type: String,
    enum: ["message", "verification", "document", "review", "general"],
    default: "general",
  },
  fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // ID-ul utilizatorului care a declanșat notificarea
  actionDescription: { type: String }, // Descrierea acțiunii (ex: "a încărcat un document de verificare", "a verificat documentul tău")
  relatedDocumentId: { type: String }, // ID-ul documentului relevant
  relatedAnnouncementId: { type: String }, // ID-ul anunțului relevant
});

// Index unic pentru a preveni notificări duplicate
NotificationSchema.index({ userId: 1, message: 1, link: 1 }, { unique: false });

module.exports = mongoose.model("Notification", NotificationSchema);
