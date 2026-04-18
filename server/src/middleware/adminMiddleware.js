/**
 * Checks that req.user exists and has role === 'admin'.
 * Must be used after authMiddleware.
 */
function adminMiddleware(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Admin access required',
        details: [],
      },
    });
  }
  next();
}

module.exports = adminMiddleware;
