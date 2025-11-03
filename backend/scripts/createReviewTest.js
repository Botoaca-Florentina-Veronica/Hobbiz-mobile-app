require('dotenv').config();
const mongoose = require('mongoose');
const Review = require('../models/Review');
const User = require('../models/User');

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('No MONGODB_URI in env');
    process.exit(1);
  }
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  const reviewedUserId = process.argv[2] || '68d162cc1ba024eab9d455e7';
  let authorId = process.argv[3]; // optional
  // treat explicit 'null' or 'undefined' or empty as no author
  if (!authorId || authorId === 'null' || authorId === 'undefined') authorId = undefined;
  const score = Number(process.argv[4] || 5);
  const comment = process.argv[5] || 'Test review from createReviewTest.js';

  const review = new Review({ user: reviewedUserId, author: authorId, score, comment });
  await review.save();
  console.log('Created review id=', review._id.toString());

  try {
    await User.findByIdAndUpdate(reviewedUserId, { $push: { reviews: review._id } });
    console.log('Pushed review id into User.reviews');
  } catch (e) {
    console.warn('Failed to push into User.reviews:', e.message);
  }

  const found = await Review.find({ user: reviewedUserId }).sort({ createdAt: -1 }).lean();
  console.log(`Now ${found.length} reviews for user ${reviewedUserId}`);
  found.slice(0,5).forEach(r => {
    console.log('-', r._id.toString(), r.score, r.comment);
  });

  await mongoose.connection.close();
}

run().catch(e => { console.error(e); process.exit(1); });
