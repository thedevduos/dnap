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

// Import route handlers
const paymentRoutes = require('./routes/payment');
const whatsappRoutes = require('./routes/whatsapp');
const zohoRoutes = require('./routes/zoho');

// Import Zoho service for automated token refresh
const zohoService = require('./services/zohoService');

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

// Automated Zoho token refresh
const ZOHO_REFRESH_INTERVAL = 60 * 60 * 1000; // 60 minutes in milliseconds
let zohoRefreshInterval = null;

// Function to refresh Zoho token automatically
const refreshZohoTokenAutomatically = async () => {
  try {
    console.log('[Zoho Auto-Refresh] Starting automatic token refresh...');
    const newToken = await zohoService.refreshZohoToken();
    console.log(`[Zoho Auto-Refresh] Token refreshed successfully at ${new Date().toISOString()}`);
    console.log(`[Zoho Auto-Refresh] New token: ${newToken.substring(0, 20)}...`);
  } catch (error) {
    console.error('[Zoho Auto-Refresh] Failed to refresh token:', error.message);
    // Don't throw error to prevent the interval from stopping
  }
};

// Check if token needs refresh on startup
const checkTokenOnStartup = async () => {
  try {
    console.log('[Zoho Auto-Refresh] Checking token status on startup...');
    const credentials = await zohoService.getZohoCredentials();
    
    if (!credentials.token_expires_at) {
      console.log('[Zoho Auto-Refresh] No token expiration found, refreshing token...');
      await refreshZohoTokenAutomatically();
      return;
    }
    
    const now = Date.now();
    const timeUntilExpiry = credentials.token_expires_at - now;
    const threeMinutesInMs = 3 * 60 * 1000; // 3 minutes buffer
    
    if (timeUntilExpiry <= threeMinutesInMs) {
      console.log(`[Zoho Auto-Refresh] Token expires in ${Math.round(timeUntilExpiry / 60000)} minutes, refreshing now...`);
      await refreshZohoTokenAutomatically();
    } else {
      console.log(`[Zoho Auto-Refresh] Token is still valid for ${Math.round(timeUntilExpiry / 60000)} minutes, skipping initial refresh`);
    }
  } catch (error) {
    console.error('[Zoho Auto-Refresh] Error checking token on startup:', error.message);
    // If we can't check the token, refresh it to be safe
    console.log('[Zoho Auto-Refresh] Refreshing token as fallback...');
    await refreshZohoTokenAutomatically();
  }
};

// Start automated Zoho token refresh
const startZohoTokenRefresh = async () => {
  try {
    // Check token status on startup (only refresh if needed)
    await checkTokenOnStartup();
    
    // Set up interval for automatic refresh every 60 minutes
    zohoRefreshInterval = setInterval(refreshZohoTokenAutomatically, ZOHO_REFRESH_INTERVAL);
    
    console.log(`[Zoho Auto-Refresh] Automated token refresh started (every ${ZOHO_REFRESH_INTERVAL / 60000} minutes)`);
    console.log(`[Zoho Auto-Refresh] Next refresh scheduled for: ${new Date(Date.now() + ZOHO_REFRESH_INTERVAL).toISOString()}`);
  } catch (error) {
    console.error('[Zoho Auto-Refresh] Failed to start automated refresh:', error.message);
  }
};

// Start the automated refresh
startZohoTokenRefresh().catch(error => {
  console.error('[Zoho Auto-Refresh] Failed to start automated refresh:', error.message);
});

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

// Payment routes
app.use('/api/payment', paymentRoutes);

// WhatsApp routes
app.use('/api/whatsapp', whatsappRoutes);

// Zoho routes
app.use('/api/zoho', zohoRoutes);

// Zoho auto-refresh status endpoint
app.get('/api/zoho/auto-refresh-status', async (req, res) => {
  try {
    const now = Date.now();
    
    // Get the actual token expiration time
    const credentials = await zohoService.getZohoCredentials();
    let nextRefreshTime, timeUntilNextRefresh, lastRefreshTime;
    
    if (credentials.token_expires_at) {
      // Calculate next refresh based on token expiration (with 3-minute buffer)
      const threeMinutesInMs = 3 * 60 * 1000;
      nextRefreshTime = new Date(credentials.token_expires_at - threeMinutesInMs);
      timeUntilNextRefresh = Math.round((credentials.token_expires_at - threeMinutesInMs - now) / 60000);
      lastRefreshTime = credentials.updatedAt || new Date(now - ZOHO_REFRESH_INTERVAL).toISOString();
    } else {
      // Fallback to interval-based calculation
      const nextRefresh = now + ZOHO_REFRESH_INTERVAL;
      nextRefreshTime = new Date(nextRefresh);
      timeUntilNextRefresh = Math.round((nextRefresh - now) / 60000);
      lastRefreshTime = new Date(now - ZOHO_REFRESH_INTERVAL).toISOString();
    }
    
    // Ensure timeUntilNextRefresh is not negative
    if (timeUntilNextRefresh < 0) {
      timeUntilNextRefresh = 0;
    }
    
    res.json({
      success: true,
      autoRefreshEnabled: true,
      refreshInterval: ZOHO_REFRESH_INTERVAL / 60000, // in minutes
      nextRefreshTime: nextRefreshTime.toISOString(),
      timeUntilNextRefresh: timeUntilNextRefresh,
      lastRefreshTime: lastRefreshTime,
      tokenExpiresAt: credentials.token_expires_at ? new Date(credentials.token_expires_at).toISOString() : null
    });
  } catch (error) {
    console.error('Error getting auto-refresh status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get auto-refresh status',
      error: error.message
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

// Ignore shutdown signals to keep server running
const ignoreShutdownSignal = (signal) => {
  console.log(`\n🚫 Received ${signal} signal - IGNORING to keep server alive`);
  console.log(`🔄 Keep-alive monitoring: ${keepAliveInterval ? 'ACTIVE' : 'INACTIVE'}`);
  console.log(`🔄 Zoho token refresh: ${zohoRefreshInterval ? 'ACTIVE' : 'INACTIVE'}`);
  console.log(`⏰ Server will continue running to maintain keep-alive and token refresh`);
};

// Handle shutdown signals - IGNORE THEM
process.on('SIGTERM', () => ignoreShutdownSignal('SIGTERM'));
process.on('SIGINT', () => ignoreShutdownSignal('SIGINT'));
process.on('SIGQUIT', () => ignoreShutdownSignal('SIGQUIT'));

module.exports = app;