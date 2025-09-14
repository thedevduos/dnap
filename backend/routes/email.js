const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');

// Send admin pickup notification email
router.post('/send-admin-pickup-notification', async (req, res) => {
  try {
    const { orderData, pickupData, courierData } = req.body;
    
    if (!orderData || !pickupData || !courierData) {
      return res.status(400).json({
        success: false,
        message: 'Missing required data: orderData, pickupData, and courierData are required'
      });
    }

    console.log('Sending admin pickup notification email for order:', orderData.orderNumber);
    
    const result = await emailService.sendAdminPickupNotification(orderData, pickupData, courierData);
    
    res.json({
      success: true,
      message: 'Admin pickup notification email sent successfully',
      messageId: result.messageId,
      to: result.to
    });
    
  } catch (error) {
    console.error('Error sending admin pickup notification email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send admin pickup notification email',
      error: error.message
    });
  }
});

// Test email connection
router.post('/test-connection', async (req, res) => {
  try {
    const result = await emailService.testSMTPConnection();
    
    res.json({
      success: result,
      message: result ? 'Email connection test successful' : 'Email connection test failed'
    });
    
  } catch (error) {
    console.error('Error testing email connection:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test email connection',
      error: error.message
    });
  }
});

// Send test email
router.post('/test-email', async (req, res) => {
  try {
    const { testEmail } = req.body;
    
    if (!testEmail) {
      return res.status(400).json({
        success: false,
        message: 'Test email address is required'
      });
    }

    console.log('Sending test email to:', testEmail);
    
    const result = await emailService.sendTestEmail(testEmail);
    
    res.json({
      success: true,
      message: 'Test email sent successfully',
      messageId: result.messageId,
      to: testEmail
    });
    
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
});

module.exports = router;
