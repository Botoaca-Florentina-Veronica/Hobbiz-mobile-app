const Review = require('../models/Review');
const User = require('../models/User');

// Create a review for a user
const createReview = async (req, res) => {
  try {
    const authorId = req.userId; // may be undefined if route not protected
    const { user: reviewedUserId, score, comment } = req.body || {};
    console.log('[ReviewController] createReview called', { userIdHeader: req.header('Authorization'), userAgent: req.header('User-Agent') });
    console.log('[ReviewController] payload:', req.body, 'req.userId=', authorId);

    if (!reviewedUserId || typeof score === 'undefined') {
      return res.status(400).json({ error: 'Lipsește user sau rating' });
    }

    const parsedScore = Number(score);
    if (isNaN(parsedScore) || parsedScore < 0 || parsedScore > 5) {
      return res.status(400).json({ error: 'Scor invalid' });
    }

    // Verify reviewed user exists
    const reviewed = await User.findById(reviewedUserId);
    if (!reviewed) return res.status(404).json({ error: 'Utilizatorul revizuit nu există' });

    const review = new Review({
      user: reviewedUserId,
      author: authorId,
      score: parsedScore,
      comment: comment || ''
    });

    await review.save();
    console.log('[ReviewController] review saved with id=', review._id);

    // Attach review reference to the reviewed user's document for quick lookup
    try {
      await User.findByIdAndUpdate(reviewedUserId, { $push: { reviews: review._id } });
    } catch (pushErr) {
      console.warn('Nu am putut actualiza câmpul reviews al user-ului:', pushErr.message);
    }

    // Return populated review (author basic info) for frontend convenience
    try {
      const populated = await Review.findById(review._id).populate('author', 'firstName lastName avatar').lean();
      // Normalize response shape: include authorName and authorAvatar for older frontend code
      const enriched = {
        ...populated,
        authorName: populated.author ? `${populated.author.firstName || ''}${populated.author.lastName ? ' ' + populated.author.lastName : ''}`.trim() : undefined,
        authorAvatar: populated.author ? populated.author.avatar : undefined
      };
      return res.status(201).json({ message: 'Recenzie creată', review: enriched });
    } catch (e) {
      // If populate fails, fallback to returning basic review object
      console.warn('Populate failed for review response:', e.message);
      return res.status(201).json({ message: 'Recenzie creată', review: review.toObject() });
    }
  } catch (e) {
    console.error('Eroare createReview:', e);
    res.status(500).json({ error: 'Eroare server la crearea recenziei' });
  }
};

// List reviews for a user (public)
const getReviewsForUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: 'Lipsește userId' });
    // Populate author basic info to make frontend rendering easier
    const reviews = await Review.find({ user: userId }).sort({ createdAt: -1 }).populate('author', 'firstName lastName avatar').lean();
    const mapped = reviews.map(r => ({
      ...r,
      authorName: r.author ? `${r.author.firstName || ''}${r.author.lastName ? ' ' + r.author.lastName : ''}`.trim() : undefined,
      authorAvatar: r.author ? r.author.avatar : undefined,
      score: r.score
    }));
    res.json(mapped);
  } catch (e) {
    console.error('Eroare getReviewsForUser:', e);
    res.status(500).json({ error: 'Eroare server la preluare recenzii' });
  }
};

// Debug/utility: get a single review by id with raw likes/unlikes
const getReviewById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Lipsește id' });
    const review = await Review.findById(id).lean();
    if (!review) return res.status(404).json({ error: 'Recenzie negăsită' });
    return res.json({
      _id: review._id,
      user: review.user,
      author: review.author,
      score: review.score,
      comment: review.comment,
      createdAt: review.createdAt,
      likes: review.likes || [],
      unlikes: review.unlikes || [],
      likesCount: (review.likes || []).length,
      unlikesCount: (review.unlikes || []).length
    });
  } catch (e) {
    console.error('Eroare getReviewById:', e);
    res.status(500).json({ error: 'Eroare server la getReviewById' });
  }
};

// Unified reaction endpoint: robust read-modify-save implementation to ensure persistence
const setReaction = async (req, res) => {
  try {
    const userId = req.userId;
    const reviewId = req.params.id;
    const { reaction } = req.body || {};

    if (!userId) return res.status(401).json({ error: 'Trebuie autentificat pentru a reacționa' });
    if (!reviewId) return res.status(400).json({ error: 'Lipsește id review' });
    if (!['like', 'unlike', 'none'].includes(reaction)) {
      return res.status(400).json({ error: 'Reacție invalidă' });
    }

    const mongoose = require('mongoose');
    const actorId = (() => {
      try { return new mongoose.Types.ObjectId(String(userId)); } catch (e) { return String(userId); }
    })();

    // Read-modify-save: load review, modify arrays in JS, then save.
    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ error: 'Recenzie negăsită' });

    // Normalize arrays to strings for comparison
    const likes = Array.isArray(review.likes) ? review.likes.map(x => String(x)) : [];
    const unlikes = Array.isArray(review.unlikes) ? review.unlikes.map(x => String(x)) : [];
    const actorStr = String(userId);

    // Remove actor from both arrays first and build new string lists
    let changed = false;
    let newLikesStr = likes.filter(id => id !== actorStr);
    let newUnlikesStr = unlikes.filter(id => id !== actorStr);

    // Conditionally add to target array
    if (reaction === 'like') {
      if (!newLikesStr.includes(actorStr)) {
        newLikesStr.push(actorStr);
        changed = true;
      }
    } else if (reaction === 'unlike') {
      if (!newUnlikesStr.includes(actorStr)) {
        newUnlikesStr.push(actorStr);
        changed = true;
      }
    }

    // Normalize to unique ObjectId arrays
    const toOid = (s) => {
      try { return new mongoose.Types.ObjectId(String(s)); } catch (_) { return s; }
    };
    const uniq = (arr) => Array.from(new Set(arr.map(String)));
    const normalizedLikes = uniq(newLikesStr).map(toOid);
    const normalizedUnlikes = uniq(newUnlikesStr).map(toOid);

    // Assign back if changed or if normalization differs
    if (
      changed ||
      uniq(likes).length !== normalizedLikes.length ||
      uniq(unlikes).length !== normalizedUnlikes.length
    ) {
      review.likes = normalizedLikes;
      review.unlikes = normalizedUnlikes;
      await review.save();
      changed = true;
    } else {
      console.log('[ReviewController] setReaction - no-op update', { reviewId, userId: actorStr, reaction });
    }

    // Recompute counts and user reaction from the saved review
    const likesCount = Array.isArray(review.likes) ? review.likes.length : 0;
    const unlikesCount = Array.isArray(review.unlikes) ? review.unlikes.length : 0;
    const liked = (review.likes || []).map(x => String(x)).includes(actorStr);
    const unliked = (review.unlikes || []).map(x => String(x)).includes(actorStr);
    const userReaction = liked ? 'like' : (unliked ? 'unlike' : 'none');

    console.log('[ReviewController] setReaction saved', { reviewId, userId: actorStr, reaction, userReaction, likesCount, unlikesCount });

    return res.json({ likesCount, unlikesCount, userReaction });
  } catch (e) {
    console.error('Eroare setReaction:', e);
    console.error('Stack:', e.stack);
    res.status(500).json({ error: 'Eroare server la setare reacție' });
  }
};

// Toggle like for a review - requires authentication
const toggleLike = async (req, res) => {
  try {
    const userId = req.userId;
    const reviewId = req.params.id;
    if (!userId) return res.status(401).json({ error: 'Trebuie autentificat pentru a da like' });
    if (!reviewId) return res.status(400).json({ error: 'Lipsește id review' });

    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ error: 'Recenzie negăsită' });

    // Delegate to setReaction: toggle like
    const already = (review.likes || []).some(id => String(id) === String(userId));
    req.body = { reaction: already ? 'none' : 'like' };
    return setReaction(req, res);
  } catch (e) {
    console.error('Eroare toggleLike:', e);
    res.status(500).json({ error: 'Eroare server la like' });
  }
};

// Toggle unlike for a review - requires authentication
const toggleUnlike = async (req, res) => {
  try {
    const userId = req.userId;
    const reviewId = req.params.id;
    if (!userId) return res.status(401).json({ error: 'Trebuie autentificat pentru a da unlike' });
    if (!reviewId) return res.status(400).json({ error: 'Lipsește id review' });

    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ error: 'Recenzie negăsită' });

    // Delegate to setReaction: toggle unlike
    const already = (review.unlikes || []).some(id => String(id) === String(userId));
    req.body = { reaction: already ? 'none' : 'unlike' };
    return setReaction(req, res);
  } catch (e) {
    console.error('Eroare toggleUnlike:', e);
    res.status(500).json({ error: 'Eroare server la unlike' });
  }
};

// Update a review (only the author can update)
const updateReview = async (req, res) => {
  try {
    const userId = req.userId;
    const reviewId = req.params.id;
    if (!userId) return res.status(401).json({ error: 'Trebuie autentificat pentru a edita recenzia' });
    if (!reviewId) return res.status(400).json({ error: 'Lipsește id review' });

    const { score, comment } = req.body || {};
    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ error: 'Recenzie negăsită' });

    if (!review.author || String(review.author) !== String(userId)) {
      return res.status(403).json({ error: 'Nu ai permisiunea de a modifica această recenzie' });
    }

    if (typeof score !== 'undefined') {
      const parsed = Number(score);
      if (isNaN(parsed) || parsed < 0 || parsed > 5) return res.status(400).json({ error: 'Scor invalid' });
      review.score = parsed;
    }
    if (typeof comment !== 'undefined') review.comment = comment;

    await review.save();

    // Return populated updated review
    const populated = await Review.findById(review._id).populate('author', 'firstName lastName avatar').lean();
    const enriched = {
      ...populated,
      authorName: populated.author ? `${populated.author.firstName || ''}${populated.author.lastName ? ' ' + populated.author.lastName : ''}`.trim() : undefined,
      authorAvatar: populated.author ? populated.author.avatar : undefined
    };
    res.json({ message: 'Recenzie actualizată', review: enriched });
  } catch (e) {
    console.error('Eroare updateReview:', e);
    res.status(500).json({ error: 'Eroare server la actualizare recenzie' });
  }
};

// Delete a review (only the author can delete)
const deleteReview = async (req, res) => {
  try {
    const userId = req.userId;
    const reviewId = req.params.id;
    if (!userId) return res.status(401).json({ error: 'Trebuie autentificat pentru a șterge recenzia' });
    if (!reviewId) return res.status(400).json({ error: 'Lipsește id review' });

    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ error: 'Recenzie negăsită' });

    if (!review.author || String(review.author) !== String(userId)) {
      return res.status(403).json({ error: 'Nu ai permisiunea de a șterge această recenzie' });
    }

    // Remove review reference from the reviewed user's reviews array
    try {
      await User.findByIdAndUpdate(review.user, { $pull: { reviews: review._id } });
    } catch (pullErr) {
      console.warn('Nu am putut actualiza câmpul reviews la stergere:', pullErr.message);
    }

    await Review.findByIdAndDelete(reviewId);
    res.json({ message: 'Recenzie ștearsă' });
  } catch (e) {
    console.error('Eroare deleteReview:', e);
    res.status(500).json({ error: 'Eroare server la ștergere recenzie' });
  }
};

module.exports = { createReview, getReviewsForUser, getReviewById, setReaction, toggleLike, toggleUnlike, updateReview, deleteReview };


