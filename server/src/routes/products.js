const express = require('express');
const { listProducts, getProduct, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { uploadSingle } = require('../middleware/uploadMiddleware');
const { uploadImage } = require('../services/cloudinaryService');

const router = express.Router();

// GET /api/products — list active products with filtering, search, and pagination
router.get('/', listProducts);

// POST /api/products/upload-image — admin: upload an image to Cloudinary, return secure URL
router.post(
  '/upload-image',
  authMiddleware,
  adminMiddleware,
  uploadSingle,
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'No image file provided', details: [] },
        });
      }

      const url = await uploadImage(req.file.buffer, {
        original_filename: req.file.originalname,
      });

      return res.status(201).json({ success: true, data: { url } });
    } catch (err) {
      next(err);
    }
  }
);

// Admin routes — require authentication and admin role
router.post('/', authMiddleware, adminMiddleware, createProduct);
router.put('/:id', authMiddleware, adminMiddleware, updateProduct);
router.delete('/:id', authMiddleware, adminMiddleware, deleteProduct);

// GET /api/products/:slug — product detail (must be after admin routes to avoid :id/:slug conflict)
router.get('/:slug', getProduct);

module.exports = router;
