const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config({ path: './.env' });
const http = require('http');
const axios = require('axios');

// Enhanced activity tracking
let lastActivity = Date.now();
const INACTIVITY_THRESHOLD = 5 * 60 * 1000; // 5 minutes in milliseconds
const KEEP_ALIVE_INTERVAL = 10 * 60 * 1000; // 10 minutes in milliseconds
const KEEP_ALIVE_URL = process.env.KEEP_ALIVE_URL || 'https://dnap-backend.onrender.com';
let keepAliveInterval = null;

const app = express();
const PORT = process.env.PORT || 5000;

// Import email service
const emailService = require('./services/emailService');

// Function to update last activity
const updateActivity = () => {
  lastActivity = Date.now();
};

// Enhanced keep-alive function with better logging and error handling
const sendKeepAlive = async () => {
  try {
    const timeSinceLastActivity = Date.now() - lastActivity;
    const secondsSinceLastActivity = Math.round(timeSinceLastActivity / 1000);
    
    console.log(`[Keep-Alive] Checking activity: ${secondsSinceLastActivity}s since last activity`);
    
    if (timeSinceLastActivity > INACTIVITY_THRESHOLD) {
      console.log('[Keep-Alive] Sending keep-alive request to prevent spin-down');
      
      const url = `${KEEP_ALIVE_URL}/health`;
      const response = await axios.get(url, {
        timeout: 10000, // 10 second timeout
        headers: {
          'User-Agent': 'Keep-Alive-Bot',
          'X-Keep-Alive': 'true'
        }
      });
      
      if (response.status === 200) {
        console.log(`[Keep-Alive] Successfully pinged /health at ${new Date().toISOString()}`);
      } else {
        console.warn(`[Keep-Alive] Request failed with status: ${response.status}`);
      }
    } else {
      console.log('[Keep-Alive] Recent activity detected, skipping keep-alive request');
    }
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.error('[Keep-Alive] Request timed out');
    } else {
      console.error('[Keep-Alive] Request failed:', error.message);
    }
  }
};

// Start keep-alive monitoring if URL is set and includes onrender.com
if (KEEP_ALIVE_URL && KEEP_ALIVE_URL.includes('onrender.com')) {
  keepAliveInterval = setInterval(sendKeepAlive, KEEP_ALIVE_INTERVAL);
  console.log(`[Keep-Alive] Monitoring started (checking every ${KEEP_ALIVE_INTERVAL / 60000} minutes)`);
}

// Middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enhanced activity tracking middleware
app.use((req, res, next) => {
  // Don't count keep-alive requests as activity
  if (req.get('X-Keep-Alive') !== 'true') {
    updateActivity();
  }
  next();
});

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN,
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Enhanced health check endpoint with activity info
app.get('/health', (req, res) => {
  const isKeepAlive = req.get('X-Keep-Alive') === 'true';
  const timeSinceLastActivity = Date.now() - lastActivity;
  
  res.status(200).json({
    status: 'OK',
    message: 'DNA Publications Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    lastActivity: new Date(lastActivity).toISOString(),
    timeSinceLastActivity: Math.round(timeSinceLastActivity / 1000),
    isKeepAliveRequest: isKeepAlive
  });
});

// Activity status endpoint
app.get('/api/activity-status', (req, res) => {
  const timeSinceLastActivity = Date.now() - lastActivity;
  res.json({
    lastActivity: new Date(lastActivity).toISOString(),
    timeSinceLastActivity: Math.round(timeSinceLastActivity / 1000),
    thresholdSeconds: INACTIVITY_THRESHOLD / 1000,
    isInactive: timeSinceLastActivity > INACTIVITY_THRESHOLD,
    keepAliveEnabled: !!(KEEP_ALIVE_URL && KEEP_ALIVE_URL.includes('onrender.com'))
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
  console.log(`🔗 Health check: ${KEEP_ALIVE_URL}/health`);
  console.log(`⏰ Keep-alive monitoring: ${(KEEP_ALIVE_URL && KEEP_ALIVE_URL.includes('onrender.com')) ? 'ENABLED' : 'DISABLED'}`);
});

// Ignore shutdown signals (SIGTERM, SIGINT, etc.)
const ignoreSignal = (signal) => {
  console.log(`Received ${signal}, ignoring shutdown as per Render keep-alive policy.`);
};
process.on('SIGTERM', () => ignoreSignal('SIGTERM'));
process.on('SIGINT', () => ignoreSignal('SIGINT'));
process.on('SIGQUIT', () => ignoreSignal('SIGQUIT'));

module.exports = app;