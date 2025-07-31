const express = require('express');
const router = express.Router();
const paymentService = require('../services/paymentService');

// Create payment request
router.post('/create-payment', async (req, res) => {
  try {
    const {
      orderId,
      amount,
      customerName,
      customerEmail,
      customerPhone,
      productInfo
    } = req.body;

    // Validate required fields
    if (!orderId || !amount || !customerName || !customerEmail) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment parameters'
      });
    }

    const paymentRequest = await paymentService.createPaymentRequest({
      orderId,
      amount,
      customerName,
      customerEmail,
      customerPhone,
      productInfo
    });

    res.status(200).json(paymentRequest);

  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment request',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Verify payment response
router.post('/verify-payment', async (req, res) => {
  try {
    const paymentResponse = req.body;

    const verificationResult = await paymentService.verifyPaymentResponse(paymentResponse);

    res.status(200).json({
      success: true,
      data: verificationResult
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Process refund
router.post('/process-refund', async (req, res) => {
  try {
    const {
      transactionId,
      amount,
      refundAmount,
      reason
    } = req.body;

    if (!transactionId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required refund parameters'
      });
    }

    const refundResult = await paymentService.processRefund({
      transactionId,
      amount,
      refundAmount,
      reason
    });

    res.status(200).json({
      success: true,
      data: refundResult
    });

  } catch (error) {
    console.error('Refund processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process refund',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get transaction status
router.get('/transaction-status/:txnid', async (req, res) => {
  try {
    const { txnid } = req.params;

    const statusResult = await paymentService.getTransactionStatus(txnid);

    res.status(200).json({
      success: true,
      data: statusResult
    });

  } catch (error) {
    console.error('Transaction status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transaction status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;