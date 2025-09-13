const express = require('express');
const router = express.Router();
const shiprocketService = require('../services/shiprocketService');

// Calculate shipping rates
router.post('/calculate-shipping', async (req, res) => {
  try {
    const {
      deliveryPincode,
      weight,
      length,
      width,
      height
    } = req.body;

    // Validate required fields
    if (!deliveryPincode || !weight || !length || !width || !height) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: deliveryPincode, weight, length, width, height'
      });
    }

    // Validate data types
    if (isNaN(weight) || isNaN(length) || isNaN(width) || isNaN(height)) {
      return res.status(400).json({
        success: false,
        message: 'Weight and dimensions must be valid numbers'
      });
    }

    console.log('Calculating shipping rates for:', {
      deliveryPincode,
      weight,
      length,
      width,
      height
    });

    const result = await shiprocketService.calculateShippingRates(
      deliveryPincode,
      parseFloat(weight),
      parseFloat(length),
      parseFloat(width),
      parseFloat(height)
    );

    res.status(200).json(result);

  } catch (error) {
    console.error('Shipping calculation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate shipping rates',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Create shipment order
router.post('/create-order', async (req, res) => {
  try {
    const orderData = req.body;

    // Validate required fields
    const requiredFields = ['orderId', 'items', 'shippingAddress', 'userEmail', 'subtotal', 'paymentMethod'];
    for (const field of requiredFields) {
      if (!orderData[field]) {
        return res.status(400).json({
          success: false,
          message: `Missing required field: ${field}`
        });
      }
    }

    // Validate items array
    if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items array is required and must not be empty'
      });
    }

    console.log('Creating Shiprocket order for:', orderData.orderId);

    const result = await shiprocketService.createShipmentOrder(orderData);

    res.status(200).json(result);

  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create Shiprocket order',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Complete Shiprocket workflow: Create Order → Assign Courier → Generate Pickup
router.post('/process-complete-order', async (req, res) => {
  try {
    const orderData = req.body;

    // Validate required fields
    if (!orderData.orderId || !orderData.items || !orderData.shippingAddress) {
      return res.status(400).json({
        success: false,
        message: 'orderId, items, and shippingAddress are required'
      });
    }

    if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items array is required and must not be empty'
      });
    }

    console.log('Processing complete Shiprocket workflow for:', orderData.orderId);

    const result = await shiprocketService.processCompleteShiprocketOrder(orderData);

    res.status(200).json(result);

  } catch (error) {
    console.error('Complete workflow error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process complete Shiprocket workflow',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Assign courier to order
router.post('/assign-courier', async (req, res) => {
  try {
    const { shiprocketOrderId, courierId } = req.body;

    if (!shiprocketOrderId || !courierId) {
      return res.status(400).json({
        success: false,
        message: 'shiprocketOrderId and courierId are required'
      });
    }

    console.log('Assigning courier to order:', shiprocketOrderId, 'courier:', courierId);

    const result = await shiprocketService.assignCourier(shiprocketOrderId, courierId);

    res.status(200).json(result);

  } catch (error) {
    console.error('Courier assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign courier',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get order tracking
router.get('/track-order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    console.log('Getting tracking for order:', orderId);

    const result = await shiprocketService.getOrderTracking(orderId);

    res.status(200).json(result);

  } catch (error) {
    console.error('Tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tracking information',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Cancel shipment
router.post('/cancel-shipment/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    console.log('Cancelling shipment for order:', orderId);

    const result = await shiprocketService.cancelShipment(orderId);

    res.status(200).json(result);

  } catch (error) {
    console.error('Shipment cancellation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel shipment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get pickup address (for frontend reference)
router.get('/pickup-address', async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      pickupAddress: shiprocketService.PICKUP_ADDRESS
    });
  } catch (error) {
    console.error('Pickup address error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pickup address',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
