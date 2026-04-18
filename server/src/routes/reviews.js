const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { submitReview, listReviews, approveReview, removeReview } = require('../controllers/reviewController');

// POST / — submit a review (authenticated, verified buyer only)
router.post('/', authMiddleware, submitReview);

// GET / — list approved reviews for a product (no auth required)
router.get('/', listReviews);

// PUT /:id/approve — admin approve a review
router.put('/:id/approve', authMiddleware, adminMiddleware, approveReview);

// DELETE /:id — admin remove a review
router.delete('/:id', authMiddleware, adminMiddleware, removeReview);

module.exports = router;
