const express = require('express');
const { getCart, addItem, updateItem, removeItem } = require('../controllers/cartController');
const optionalAuth = require('../middleware/optionalAuth');

const router = express.Router();

// All cart routes use optional auth: JWT if present, guest session cookie otherwise
router.get('/', optionalAuth, getCart);
router.post('/items', optionalAuth, addItem);
router.put('/items/:itemId', optionalAuth, updateItem);
router.delete('/items/:itemId', optionalAuth, removeItem);

module.exports = router;
