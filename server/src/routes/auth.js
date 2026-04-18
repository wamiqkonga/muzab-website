const { Router } = require('express');
const { register, login, logout, verifyEmail, forgotPassword, resetPassword } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = Router();

// POST /api/auth/register — task 4.1
router.post('/register', register);

// POST /api/auth/login — task 4.2
router.post('/login', login);

// POST /api/auth/logout — task 4.3 (protected)
router.post('/logout', authMiddleware, logout);

// GET /api/auth/verify-email/:token — task 4.3
router.get('/verify-email/:token', verifyEmail);

// POST /api/auth/forgot-password — task 5.1
router.post('/forgot-password', forgotPassword);

// POST /api/auth/reset-password/:token — task 5.1
router.post('/reset-password/:token', resetPassword);

module.exports = router;
