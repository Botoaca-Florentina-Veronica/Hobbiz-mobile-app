// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: { type: String },
  lastName: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  phone: { type: String },
  googleId: { type: String, unique: true, sparse: true },
  avatar: { type: String },
  // Optional profile cover (banner) image
  coverImage: { type: String },
  // Expo/FCM push token for mobile notifications - changed to array to support multiple devices
  pushToken: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  localitate: { type: String }, // Adăugat câmpul localitate
  lastSeen: { type: Date, default: Date.now }, // Adăugat câmpul pentru ultima activitate
  // Token version for invalidating all sessions when user logs out from all devices
  tokenVersion: { type: Number, default: 0 },
  // Persistență pentru anunțurile favorite ale utilizatorului (cross-device)
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Announcement' }]
  ,
  // Reviews left for this user - stored as references to Review documents for clarity and fast lookup
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
  notificationSettings: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    messages: { type: Boolean, default: true },
    reviews: { type: Boolean, default: true },
    favorites: { type: Boolean, default: true },
    promotions: { type: Boolean, default: false }
  },

  // Password reset (email code)
  passwordResetCodeHash: { type: String },
  passwordResetExpires: { type: Date }
});

// Hash-uim parola înainte de salvare (only if password is provided)
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model('User', userSchema);