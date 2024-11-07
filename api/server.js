const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require('../routes/auth');
const profileRoutes = require('../routes/profile');
const { auth } = require('../middleware/auth');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);

module.exports = app; 