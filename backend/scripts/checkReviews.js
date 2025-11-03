require('dotenv').config();
const mongoose = require('mongoose');
const Review = require('../models/Review');

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('No MONGODB_URI in env');
    process.exit(1);
  }
  await mongoose.connect(uri);
  const userId = process.argv[2] || '68d162cc1ba024eab9d455e7';
  const reviews = await Review.find({ user: userId }).sort({ createdAt: -1 }).lean();
  console.log(`Found ${reviews.length} reviews for user ${userId}`);
  reviews.forEach(r => {
    console.log('-', r._id.toString(), r.score, r.comment ? r.comment.substring(0,80) : '');
  });
  await mongoose.connection.close();
}

run().catch(e => { console.error(e); process.exit(1); });
