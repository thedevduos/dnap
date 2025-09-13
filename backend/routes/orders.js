const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');

// Send order confirmation email
router.post('/send-order-confirmation-email', async (req, res) => {
  try {
    const {
      orderNumber,
      customerName,
      customerEmail,
      items,
      subtotal,
      shipping,
      total,
      shippingAddress,
      transactionId,
      paymentMethod,
      trackingInfo
    } = req.body;

    // Validate required fields
    if (!orderNumber || !customerName || !customerEmail || !items || !total || !shippingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: orderNumber, customerName, customerEmail, items, total, shippingAddress'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer email format'
      });
    }

    // Prepare order data for email
    const orderData = {
      orderNumber,
      customerName,
      customerEmail,
      items,
      subtotal,
      shipping,
      total,
      shippingAddress,
      transactionId,
      paymentMethod,
      trackingInfo
    };

    // Send the order confirmation email
    const result = await emailService.sendOrderConfirmationEmail(orderData);

    res.status(200).json({
      success: true,
      message: 'Order confirmation email sent successfully',
      data: result
    });

  } catch (error) {
    console.error('Order confirmation email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send order confirmation email',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
