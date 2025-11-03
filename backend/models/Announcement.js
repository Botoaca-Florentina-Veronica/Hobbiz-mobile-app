const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  contactPerson: { type: String, required: true },
  contactEmail: { type: String },
  contactPhone: { type: String },
  images: [String],
  favoritesCount: { type: Number, default: 0 },
  // Track number of views for displaying in announcement footer
  views: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Announcement', announcementSchema);
