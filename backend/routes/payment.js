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
    const validPaymentMethods = ['razorpay', 'zoho'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method'
      });
    }

    const paymentRequest = await paymentService.createPaymentRequest({
      orderId,
      amount,
      customerName,
      customerEmail,
      customerPhone,
      productInfo,
      paymentMethod
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
    const { paymentMethod, ...responseData } = req.body;

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Payment method is required for verification'
      });
    }

    const verificationResult = await paymentService.verifyPaymentResponse(responseData, paymentMethod);

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
      reason,
      paymentMethod
    } = req.body;

    // Validate required fields
    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID is required for refund processing'
      });
    }
    
    if (!amount && !refundAmount) {
      return res.status(400).json({
        success: false,
        message: 'Refund amount is required'
      });
    }
    
    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Payment method is required for refund processing'
      });
    }
    
    // Use refundAmount if provided, otherwise use full amount
    const finalRefundAmount = refundAmount || amount;
    
    console.log('Processing refund request:', {
      transactionId,
      amount,
      refundAmount: finalRefundAmount,
      paymentMethod,
      reason
    });

    const refundResult = await paymentService.processRefund({
      transactionId,
      amount,
      refundAmount: finalRefundAmount,
      reason: reason || 'Admin initiated refund',
      paymentMethod
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
    const { paymentMethod } = req.query;

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Payment method is required for status check'
      });
    }

    const statusResult = await paymentService.getTransactionStatus(txnid, paymentMethod);

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

// Get all transactions from all payment gateways
router.get('/all-transactions', async (req, res) => {
  try {
    const transactionsResult = await paymentService.getAllTransactions();

    res.status(200).json({
      success: true,
      data: transactionsResult.data
    });

  } catch (error) {
    console.error('All transactions fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions from payment gateways',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Test Zoho Payments configuration
router.get('/test-zoho', async (req, res) => {
  try {
    console.log('Testing Zoho Payments configuration...');
    
    // Import Zoho service
    const zohoService = require('../services/zohoService');
    
    // Test connection
    const testResult = await zohoService.testZohoConnection();
    
    res.status(200).json({
      success: true,
      message: 'Zoho Payments configuration test completed',
      result: testResult
    });
    
  } catch (error) {
    console.error('Zoho test error:', error);
    res.status(500).json({
      success: false,
      message: 'Zoho Payments test failed',
      error: error.message
    });
  }
});

module.exports = router;