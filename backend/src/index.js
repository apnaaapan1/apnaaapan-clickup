require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const pool = require('./config/db');
const errorMiddleware = require('./middleware/errorMiddleware');
const authRoutes = require('./routes/authRoutes');
const workspaceRoutes = require('./routes/workspaceRoutes');
const projectRoutes = require('./routes/projectRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5171',
  'http://localhost:5173',
  'http://localhost:5174',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow Postman/curl (no browser origin) and known frontend origins.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json());

/** SPA + sidebar tree can burst many calls; keep prod sane but avoid blocking local dev. */
const rateLimitMax = Number(process.env.RATE_LIMIT_MAX);
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number.isFinite(rateLimitMax) && rateLimitMax > 0 ? rateLimitMax : process.env.NODE_ENV === 'production' ? 600 : 8000,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.get('/', (req, res) => {
  res.json({
    name: 'Apnaaapan Clickup API',
    status: 'running',
    health: '/api/health',
  });
});

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT NOW()');
    res.json({ status: 'ok', db: 'connected', timestamp: new Date() });
  } catch (err) {
    res.status(503).json({ status: 'error', db: 'disconnected', message: err.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api', projectRoutes);
app.use('/api/notifications', notificationRoutes);

app.use(errorMiddleware);

/** Vercel (@vercel/node) runs this file as a serverless handler — export the app, do not listen. */
module.exports = app;

const start = async () => {
  try {
    await pool.query('SELECT NOW()');
    console.log('Database connected');
  } catch (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

if (!process.env.VERCEL) {
  start();
}
