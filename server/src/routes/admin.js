const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { getDashboard, listAdminOrders, updateOrderStatus, refundOrder, listCustomers, exportCustomers } = require('../controllers/adminController');

// All admin routes require authentication + admin role
router.use(authMiddleware, adminMiddleware);

// Dashboard metrics
router.get('/dashboard', getDashboard);

// Order management
router.get('/orders', listAdminOrders);
router.put('/orders/:id/status', updateOrderStatus);
router.post('/orders/:id/refund', refundOrder);

// Customer management
router.get('/customers/export', exportCustomers);
router.get('/customers', listCustomers);

module.exports = router;
