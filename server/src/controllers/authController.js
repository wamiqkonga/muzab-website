const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const TokenBlacklist = require('../models/TokenBlacklist');
const notificationService = require('../services/notificationService');

// Regex helpers
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Min 8 chars, at least 1 uppercase, 1 lowercase, 1 digit
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

/**
 * POST /api/auth/register
 * Requirements: 3.1, 3.7, 10.4
 */
async function register(req, res, next) {
  try {
    const { name, email, password, phone } = req.body;

    // --- Validation ---
    const details = [];

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      details.push({ field: 'name', message: 'Name is required.' });
    }

    if (!email || !EMAIL_RE.test(email)) {
      details.push({ field: 'email', message: 'A valid email address is required.' });
    }

    if (!password || !PASSWORD_RE.test(password)) {
      details.push({
        field: 'password',
        message:
          'Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one digit.',
      });
    }

    // phone is optional — validate format only when provided
    if (phone !== undefined && phone !== null && phone !== '') {
      if (typeof phone !== 'string' || phone.trim().length === 0) {
        details.push({ field: 'phone', message: 'Phone must be a non-empty string when provided.' });
      }
    }

    if (details.length > 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Validation failed.', details },
      });
    }

    // --- Duplicate email check ---
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: 'CONFLICT', message: 'An account with this email already exists.', details: [] },
      });
    }

    // --- Create user ---
    // Set passwordHash to the plain password; the pre-save hook will bcrypt it.
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash: password,
      phone: phone ? phone.trim() : undefined,
      emailVerificationToken,
    });

    await user.save();

    // --- Fire-and-forget welcome email (Req 10.4) ---
    notificationService.sendWelcomeEmail(user.email, user.name).catch((err) => {
      console.error('[register] sendWelcomeEmail failed:', err);
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 * Requirements: 3.2, 3.3
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // 1. Validate email and password present
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Email and password are required.', details: [] },
      });
    }

    // Generic 401 used for both "email not found" and "wrong password" (Req 3.3)
    const INVALID_CREDENTIALS = {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid email or password', details: [] },
    };

    // 2. Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // 3. If not found OR password doesn't match → same 401 (don't reveal which)
    if (!user) {
      return res.status(401).json(INVALID_CREDENTIALS);
    }

    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch) {
      return res.status(401).json(INVALID_CREDENTIALS);
    }

    // 4. Issue JWT: jti = crypto.randomUUID(), sub = user._id, exp = iat + 7 days (Req 3.2)
    const jti = crypto.randomUUID();
    const secret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

    const token = jwt.sign(
      {
        sub: user._id.toString(),
        email: user.email,
        role: user.role,
        jti,
      },
      secret,
      { expiresIn }
    );

    // 5. Return success with token and safe user fields
    return res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout
 * Requirements: 3.8
 */
async function logout(req, res, next) {
  try {
    // req.user and the raw token are available after authMiddleware
    const authHeader = req.headers.authorization;
    const token = authHeader.slice(7);

    // Decode without re-verifying (authMiddleware already verified it)
    const payload = jwt.decode(token);

    if (payload && payload.jti) {
      await TokenBlacklist.create({
        jti: payload.jti,
        expiresAt: new Date(payload.exp * 1000),
      });
    }

    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/verify-email/:token
 * Requirements: 3.1
 */
async function verifyEmail(req, res, next) {
  try {
    const { token } = req.params;

    const user = await User.findOne({ emailVerificationToken: token });
    if (!user) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired verification token',
          details: [],
        },
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    await user.save();

    return res.status(200).json({ success: true, message: 'Email verified successfully' });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/forgot-password
 * Requirements: 3.4
 */
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;

    // Validate email present and valid format
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'A valid email address is required.', details: [] },
      });
    }

    // Generic success response regardless of whether email exists (Req 3.4 — don't reveal)
    const GENERIC_OK = {
      success: true,
      message: 'If an account with that email exists, a reset link has been sent.',
    };

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(200).json(GENERIC_OK);
    }

    // Generate token and set expiry (1 hour)
    const token = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = token;
    user.passwordResetExpiry = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    // Fire-and-forget reset email
    notificationService.sendPasswordResetEmail(user.email, token).catch((err) => {
      console.error('[forgotPassword] sendPasswordResetEmail failed:', err);
    });

    return res.status(200).json(GENERIC_OK);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/reset-password/:token
 * Requirements: 3.5, 3.6, 3.7
 */
async function resetPassword(req, res, next) {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Find user with matching token that hasn't expired
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Password reset link is invalid or has expired.',
          details: [],
        },
      });
    }

    // Enforce password policy (Req 3.7)
    if (!password || !PASSWORD_RE.test(password)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message:
            'Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one digit.',
          details: [],
        },
      });
    }

    // Update password (pre-save hook will hash it), clear reset token
    user.passwordHash = password;
    user.passwordResetToken = null;
    user.passwordResetExpiry = null;
    await user.save();

    return res.status(200).json({ success: true, message: 'Password reset successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, logout, verifyEmail, forgotPassword, resetPassword };
