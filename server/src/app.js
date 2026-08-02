const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const { authRateLimiter, checkoutRateLimiter, generalRateLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Trust proxy in production (needed for rate limiting behind load balancers)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Security middleware
app.use(helmet());
app.use(helmet.noSniff());
app.use(helmet.frameguard({ action: 'deny' }));
app.use(helmet.xssFilter());
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Webhook routes need raw body for HMAC verification — register before express.json()
app.use('/api/webhooks', express.raw({ type: 'application/json' }));

// Body parsing for all other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parsing (needed for guest session cart)
app.use(cookieParser());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'muzab-api' });
});

// Rate-limit auth routes
app.use('/api/auth', authRateLimiter);

// Rate-limit checkout
app.use('/api/orders/checkout', checkoutRateLimiter);
app.use('/api/orders/verify-payment', checkoutRateLimiter);

// General rate limit on all API routes
app.use('/api', generalRateLimiter);

// Route stubs — loaded conditionally so the app doesn't crash if files don't exist yet
const routes = [
  { path: '/api/auth',     file: './routes/auth' },
  { path: '/api/products', file: './routes/products' },
  { path: '/api/cart',     file: './routes/cart' },
  { path: '/api/orders',   file: './routes/orders' },
  { path: '/api/reviews',  file: './routes/reviews' },
  { path: '/api/admin',    file: './routes/admin' },
  { path: '/api/webhooks', file: './routes/webhooks' },
];

for (const { path, file } of routes) {
  try {
    // eslint-disable-next-line import/no-dynamic-require
    app.use(path, require(file));
  } catch (_) {
    // Route file not yet implemented — skip silently
  }
}

// Centralised error handler (must be last)
app.use(errorHandler);

module.exports = app;
