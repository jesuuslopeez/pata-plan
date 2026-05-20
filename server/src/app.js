const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerDoc = require('./swagger.json');
const { errorHandler } = require('./middlewares/errorHandler');

const app = express();

// API docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

// Security headers
app.use(helmet());

// CORS — allow any localhost origin in development for flexibility with Vite port fallbacks
const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
  : (origin, cb) => {
      if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) {
        return cb(null, true);
      }
      return cb(new Error('Not allowed by CORS'));
    };
app.use(cors({ origin: corsOrigin }));

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

// Static files (relax CORP so the SPA on a different origin can embed images)
app.use(
  '/uploads',
  express.static('uploads', {
    setHeaders: (res) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  })
);

// Routes
const { authenticate } = require('./middlewares/auth');
const authRoutes = require('./routes/auth.routes');
const groupRoutes = require('./routes/group.routes');
const animalRoutes = require('./routes/animal.routes');
const weightRoutes = require('./routes/weight.routes');
const eventRoutes = require('./routes/event.routes');
const protocolRoutes = require('./routes/protocol.routes');
const assignmentRoutes = require('./routes/assignment.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const visitRoutes = require('./routes/visit.routes');
const expenseRoutes = require('./routes/expense.routes');
const documentRoutes = require('./routes/document.routes');
const reportRoutes = require('./routes/report.routes');
const eventTypeRoutes = require('./routes/eventType.routes');
const collaboratorRoutes = require('./routes/collaborator.routes');
const devRoutes = require('./routes/dev.routes');
app.use('/api/auth', authRoutes);
app.use('/api/groups', authenticate, groupRoutes);
app.use('/api/animals', authenticate, animalRoutes);
app.use('/api/animals', authenticate, weightRoutes);
app.use('/api/animals', authenticate, eventRoutes);
app.use('/api/animals', authenticate, assignmentRoutes);
app.use('/api/animals', authenticate, visitRoutes);
app.use('/api/animals', authenticate, documentRoutes);
app.use('/api/animals', authenticate, reportRoutes);
app.use('/api/assignments', authenticate, assignmentRoutes);
app.use('/api/events', authenticate, eventRoutes);
app.use('/api/event-types', authenticate, eventTypeRoutes);
app.use('/api/protocols', authenticate, protocolRoutes);
app.use('/api/dashboard', authenticate, dashboardRoutes);
app.use('/api/visits', authenticate, visitRoutes);
app.use('/api/weights', authenticate, weightRoutes);
app.use('/api/expenses', authenticate, expenseRoutes);
app.use('/api/documents', authenticate, documentRoutes);
app.use('/api/dev', devRoutes);
app.use('/api', authenticate, collaboratorRoutes);

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
