const express = require('express');
const router = express.Router();
const zohoService = require('../services/zohoService');

// Test Zoho connection
router.get('/test-connection', async (req, res) => {
  try {
    const result = await zohoService.testZohoConnection();
    res.status(200).json(result);
  } catch (error) {
    console.error('Zoho connection test error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test Zoho connection',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Refresh Zoho access token
router.post('/refresh-token', async (req, res) => {
  try {
    const newToken = await zohoService.refreshZohoToken();
    res.status(200).json({
      success: true,
      message: 'Zoho access token refreshed successfully',
      token: newToken
    });
  } catch (error) {
    console.error('Zoho token refresh error:', error);
    
    // Provide more detailed error information in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Failed to refresh Zoho access token';
    
    res.status(500).json({
      success: false,
      message: 'Failed to refresh Zoho access token',
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        name: error.name
      } : undefined
    });
  }
});

// Create Zoho Pay payment
router.post('/create-payment', async (req, res) => {
  try {
    const {
      orderId,
      amount,
      customerName,
      customerEmail,
      customerPhone,
      productInfo,
      paymentMethod
    } = req.body;

    // Validate required fields
    if (!orderId || !amount || !customerName || !customerEmail || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment parameters'
      });
    }

    // Validate payment method
    if (paymentMethod !== 'zoho') {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method. Only Zoho Pay is supported.'
      });
    }

    const paymentRequest = await zohoService.createZohoPayment({
      orderId,
      amount,
      customerName,
      customerEmail,
      customerPhone,
      productInfo
    });

    res.status(200).json({
      success: true,
      paymentMethod: 'zoho',
      data: paymentRequest
    });

  } catch (error) {
    console.error('Zoho payment creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create Zoho Pay payment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Verify Zoho Pay payment
router.post('/verify-payment', async (req, res) => {
  try {
    const { paymentId } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required for verification'
      });
    }

    const verificationResult = await zohoService.verifyZohoPayment(paymentId);

    res.status(200).json({
      success: true,
      data: verificationResult
    });

  } catch (error) {
    console.error('Zoho payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Zoho Pay payment verification failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Process Zoho Pay refund
router.post('/process-refund', async (req, res) => {
  try {
    const {
      paymentId,
      amount,
      reason
    } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required for refund processing'
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid refund amount is required'
      });
    }

    const refundResult = await zohoService.processZohoRefund(paymentId, amount, reason);

    res.status(200).json({
      success: true,
      data: refundResult
    });

  } catch (error) {
    console.error('Zoho refund processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process Zoho Pay refund',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router; 