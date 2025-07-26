const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config({ path: './.env' });
const http = require('http');
const axios = require('axios');

// Track last activity timestamp
let lastActivity = Date.now();

const app = express();
const PORT = process.env.PORT || 5000;

// Import email service
const emailService = require('./services/emailService');

// Middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware to update last activity on every request
app.use((req, res, next) => {
  lastActivity = Date.now();
  next();
});

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN,
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'DNA Publications Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Email API endpoints
app.post('/api/send-welcome-email', async (req, res) => {
  try {
    const { name, email, mobile, role, emailTemplate } = req.body;

    // Validate required fields
    if (!name || !email || !mobile || !role) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, email, mobile, role'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Send welcome email
    const result = await emailService.sendWelcomeEmail({
      name,
      email,
      mobile,
      role,
      emailTemplate
    });

    res.status(200).json({
      success: true,
      message: 'Welcome email sent successfully',
      messageId: result.messageId
    });

  } catch (error) {
    console.error('Error sending welcome email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send welcome email',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Test email endpoint
app.post('/api/test-email', async (req, res) => {
  try {
    const { testEmail } = req.body;
    
    if (!testEmail) {
      return res.status(400).json({
        success: false,
        message: 'Test email address is required'
      });
    }

    const result = await emailService.sendTestEmail(testEmail);
    
    res.status(200).json({
      success: true,
      message: 'Test email sent successfully',
      messageId: result.messageId
    });

  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 DNA Publications Backend running on port ${PORT}`);
  console.log(`📧 Email service ready`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: https://dnap-backend.onrender.com/health`);
});

// Keep-alive logic for Render.com
const KEEP_ALIVE_INTERVAL = 10 * 60 * 1000; // 10 minutes
setInterval(async () => {
  const now = Date.now();
  const secondsSinceLastActivity = Math.floor((now - lastActivity) / 1000);
  if (now - lastActivity >= KEEP_ALIVE_INTERVAL) {
    try {
      const url = `https://dnap-backend.onrender.com/health`;
      console.log(`[Keep-Alive] No activity for ${secondsSinceLastActivity} seconds. Calling keep-alive URL: ${url}`);
      await axios.get(url);
      console.log(`[Keep-Alive] Successfully pinged /health at ${new Date().toISOString()}`);
    } catch (err) {
      console.error('[Keep-Alive] Failed to ping /health:', err.message);
    }
  }
}, KEEP_ALIVE_INTERVAL);

// Ignore shutdown signals (SIGTERM, SIGINT, etc.)
const ignoreSignal = (signal) => {
  console.log(`Received ${signal}, ignoring shutdown as per Render keep-alive policy.`);
};
process.on('SIGTERM', () => ignoreSignal('SIGTERM'));
process.on('SIGINT', () => ignoreSignal('SIGINT'));
process.on('SIGQUIT', () => ignoreSignal('SIGQUIT'));

module.exports = app; 