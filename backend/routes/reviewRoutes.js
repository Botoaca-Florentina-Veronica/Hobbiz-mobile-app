const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  createReview,
  getReviewsForUser,
  getReviewById,
  setReaction,
  toggleLike,
  toggleUnlike,
  updateReview,
  deleteReview,
} = require("../controllers/ReviewController");

// Debug/utility: get single review by id (public for now, adjust as needed)
router.get("/item/:id", getReviewById);

// Public: list reviews for a given user
router.get("/:userId", getReviewsForUser);

// Create review (auth required) - reviews are allowed only after a confirmed collaboration.
router.post("/", auth, createReview);

// Legacy toggle endpoints (kept for backward compatibility)
router.post("/:id/like", auth, toggleLike);
router.post("/:id/unlike", auth, toggleUnlike);

// Unified reaction endpoint (preferred): POST /:id/reaction { reaction: 'like'|'unlike'|'none' }
router.post("/:id/react", auth, setReaction);
router.post("/:id/reaction", auth, setReaction);

// Edit a review (author only)
router.put("/:id", auth, updateReview);

// Delete a review (author only)
router.delete("/:id", auth, deleteReview);

module.exports = router;
