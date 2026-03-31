const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { errorHandler } = require('./middlewares/errorHandler');

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  })
);

// Request logging
app.use(morgan('dev'));

// Body parsing
app.use(express.json());

// Global rate limit
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});
app.use(globalLimiter);

// Auth rate limit (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again later' },
});
app.use('/api/auth', authLimiter);

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'PataPlan API' });
});

// Static files
app.use('/uploads', express.static('uploads'));

// Routes
const { authenticate } = require('./middlewares/auth');
const authRoutes = require('./routes/auth.routes');
const groupRoutes = require('./routes/group.routes');
const animalRoutes = require('./routes/animal.routes');
const weightRoutes = require('./routes/weight.routes');
const eventRoutes = require('./routes/event.routes');
app.use('/api/auth', authRoutes);
app.use('/api/groups', authenticate, groupRoutes);
app.use('/api/animals', authenticate, animalRoutes);
app.use('/api/animals', authenticate, weightRoutes);
app.use('/api/animals', authenticate, eventRoutes);
app.use('/api/events', authenticate, eventRoutes);

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
