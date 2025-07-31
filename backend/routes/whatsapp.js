const express = require('express');
const router = express.Router();
const whatsappService = require('../services/whatsappService');

// Send order confirmation
router.post('/send-order-confirmation', async (req, res) => {
  try {
    const orderData = req.body;

    const result = await whatsappService.sendOrderConfirmation(orderData);

    res.status(200).json({
      success: true,
      message: 'Order confirmation sent via WhatsApp',
      data: result
    });

  } catch (error) {
    console.error('WhatsApp order confirmation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send WhatsApp message',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Send cart abandonment reminder
router.post('/send-cart-reminder', async (req, res) => {
  try {
    const { userData, cartItems } = req.body;

    const result = await whatsappService.sendCartAbandonmentReminder(userData, cartItems);

    res.status(200).json({
      success: true,
      message: 'Cart reminder sent via WhatsApp',
      data: result
    });

  } catch (error) {
    console.error('WhatsApp cart reminder error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send WhatsApp reminder',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Send shipping notification
router.post('/send-shipping-notification', async (req, res) => {
  try {
    const orderData = req.body;

    const result = await whatsappService.sendShippingNotification(orderData);

    res.status(200).json({
      success: true,
      message: 'Shipping notification sent via WhatsApp',
      data: result
    });

  } catch (error) {
    console.error('WhatsApp shipping notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send WhatsApp notification',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Send delivery confirmation
router.post('/send-delivery-confirmation', async (req, res) => {
  try {
    const orderData = req.body;

    const result = await whatsappService.sendDeliveryConfirmation(orderData);

    res.status(200).json({
      success: true,
      message: 'Delivery confirmation sent via WhatsApp',
      data: result
    });

  } catch (error) {
    console.error('WhatsApp delivery confirmation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send WhatsApp confirmation',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;