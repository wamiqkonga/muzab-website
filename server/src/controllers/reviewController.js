const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');

/**
 * POST /api/reviews
 * Submit a product review. Requires authentication.
 * Only verified buyers (users with a Delivered order containing the product) may review.
 */
async function submitReview(req, res, next) {
  try {
    const { productId, orderId, rating, text } = req.body;
    const userId = req.user._id;

    // Validate rating
    const parsedRating = Number(rating);
    if (!parsedRating || parsedRating < 1 || parsedRating > 5 || !Number.isInteger(parsedRating)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Rating must be an integer between 1 and 5',
          details: [],
        },
      });
    }

    if (!productId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'productId is required',
          details: [],
        },
      });
    }

    // Verify the user has a Delivered order containing this product
    const deliveredOrder = await Order.findOne({
      _id: orderId || undefined,
      userId,
      status: 'Delivered',
      'items.productId': productId,
    });

    // If orderId not provided or not matched, try any delivered order with this product
    const verifiedOrder = deliveredOrder || await Order.findOne({
      userId,
      status: 'Delivered',
      'items.productId': productId,
    });

    if (!verifiedOrder) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'NOT_VERIFIED_BUYER',
          message: 'Only verified buyers with a delivered order can review this product',
          details: [],
        },
      });
    }

    // Prevent duplicate reviews (one review per user per product)
    const existingReview = await Review.findOne({ productId, userId });
    if (existingReview) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'You have already submitted a review for this product',
          details: [],
        },
      });
    }

    // Save the review (isApproved defaults to false)
    const review = await Review.create({
      productId,
      userId,
      orderId: verifiedOrder._id,
      rating: parsedRating,
      text,
    });

    // Recalculate averageRating and reviewCount using only approved reviews
    await recalculateProductRating(productId);

    return res.status(201).json({
      success: true,
      data: review,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/reviews?productId=
 * List approved reviews for a product. No auth required.
 */
async function listReviews(req, res, next) {
  try {
    const { productId } = req.query;

    if (!productId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'productId query param is required', details: [] },
      });
    }

    const reviews = await Review.find({ productId, isApproved: true })
      .populate('userId', 'name')
      .select('rating text userId createdAt')
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: reviews });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/reviews/:id/approve
 * Admin only — approve a review and recalculate product averageRating.
 */
async function approveReview(req, res, next) {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Review not found', details: [] },
      });
    }

    await recalculateProductRating(review.productId);

    return res.json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/reviews/:id
 * Admin only — remove a review and recalculate product averageRating.
 */
async function removeReview(req, res, next) {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Review not found', details: [] },
      });
    }

    await recalculateProductRating(review.productId);

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

/**
 * Recalculate and persist averageRating + reviewCount for a product
 * based on all currently approved reviews.
 */
async function recalculateProductRating(productId) {
  const approvedReviews = await Review.find({ productId, isApproved: true });
  const reviewCount = approvedReviews.length;
  const averageRating =
    reviewCount > 0
      ? Math.round((approvedReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10) / 10
      : 0;
  await Product.findByIdAndUpdate(productId, { averageRating, reviewCount });
}

module.exports = { submitReview, listReviews, approveReview, removeReview };
