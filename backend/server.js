require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const { startMonitoringScheduler } = require('./services/monitorScheduler');

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());

// Rate limiting: max 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// --- Routes ---
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/monitors', require('./routes/monitorRoutes'));
app.use('/api/history', require('./routes/historyRoutes'));

// --- Global error handler ---
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// --- Connect to MongoDB and start server ---
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

    // Start the background cron-based monitoring scheduler
    startMonitoringScheduler();
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
