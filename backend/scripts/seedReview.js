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
  console.log('Connected to MongoDB for seeding');

  const userId = process.argv[2] || '68d162cc1ba024eab9d455e7';
  const sample = new Review({
    user: userId,
    score: 4,
    comment: 'Foarte comunicativ și corect. Recomand cu încredere!',
    createdAt: new Date()
  });
  await sample.save();
  console.log('Inserted review:', sample._id);
  await mongoose.connection.close();
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
