const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const studentRoutes = require('./routes/students');
const vendorRoutes = require('./routes/vendors');
const adminRoutes = require('./routes/admin');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'UniPay Backend is running' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'UniPay Backend API',
    version: '1.0.0',
    endpoints: {
      transactions: '/api/transactions',
      students: '/api/students',
      vendors: '/api/vendors',
      admin: '/api/admin'
    }
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`UniPay Backend server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
