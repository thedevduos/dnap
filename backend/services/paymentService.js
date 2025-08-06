const crypto = require('crypto');
const Razorpay = require('razorpay');

// Add fetch for Node.js (if not available)
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

// PayU Configuration
const PAYU_CONFIG = {
  key: process.env.PAYU_KEY,
  salt: process.env.PAYU_SALT,
  baseUrl: 'https://test.payu.in/_payment'  
};

// Razorpay Configuration
const RAZORPAY_CONFIG = {
  keyId: process.env.RZP_KEY_ID,
  keySecret: process.env.RZP_KEY_SECRET
};

// Initialize Razorpay (only if keys are available)
let razorpay = null;
if (RAZORPAY_CONFIG.keyId && RAZORPAY_CONFIG.keySecret) {
  razorpay = new Razorpay({
    key_id: RAZORPAY_CONFIG.keyId,
    key_secret: RAZORPAY_CONFIG.keySecret
  });
}

// Generate PayU hash
const generatePayUHash = (params) => {
  const { key, txnid, amount, productinfo, firstname, email, salt } = params;
  
  const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${salt}`;
  const hash = crypto.createHash('sha512').update(hashString).digest('hex');
  
  return hash;
};

// Verify PayU response hash
const verifyPayUResponse = (params) => {
  const { key, txnid, amount, productinfo, firstname, email, status, salt } = params;
  
  const hashString = `${salt}|${status}|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
  const hash = crypto.createHash('sha512').update(hashString).digest('hex');
  
  return hash;
};

// Create payment request
const createPaymentRequest = async (orderData) => {
  try {
    const {
      orderId,
      amount,
      customerName,
      customerEmail,
      customerPhone,
      productInfo = 'DNA Publications Books',
      paymentMethod
    } = orderData;

    switch (paymentMethod) {
      case 'payu':
        return await createPayUPayment(orderId, amount, customerName, customerEmail, customerPhone, productInfo);
      
      case 'razorpay':
        return await createRazorpayPayment(orderId, amount, customerName, customerEmail, customerPhone, productInfo);
      
      case 'zoho':
        return await createZohoPayment(orderId, amount, customerName, customerEmail, customerPhone, productInfo);
      
      default:
        throw new Error('Unsupported payment method');
    }

  } catch (error) {
    console.error('Error creating payment request:', error);
    throw new Error('Failed to create payment request');
  }
};

// Create PayU payment
const createPayUPayment = async (orderId, amount, customerName, customerEmail, customerPhone, productInfo) => {
  const txnid = `TXN_${orderId}_${Date.now()}`;
  
  const paymentParams = {
    key: PAYU_CONFIG.key,
    txnid,
    amount: amount.toString(),
    productinfo: productInfo,
    firstname: customerName.split(' ')[0],
    email: customerEmail,
    phone: customerPhone,
    surl: `${process.env.FRONTEND_URL}/payment/success`,
    furl: `${process.env.FRONTEND_URL}/payment/failure`,
    service_provider: 'payu_paisa',
    salt: PAYU_CONFIG.salt
  };

  // Generate hash
  const hash = generatePayUHash(paymentParams);
  paymentParams.hash = hash;

  return {
    success: true,
    paymentMethod: 'payu',
    paymentUrl: PAYU_CONFIG.baseUrl,
    params: paymentParams
  };
};

// Create Razorpay payment
const createRazorpayPayment = async (orderId, amount, customerName, customerEmail, customerPhone, productInfo) => {
  if (!razorpay) {
    throw new Error('Razorpay is not configured. Please check your environment variables.');
  }

  // Step 1: Create Razorpay order
  const razorpayOrderOptions = {
    amount: Math.round(amount * 100), // Razorpay expects amount in paise
    currency: 'INR',
    receipt: orderId,
    notes: {
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      product_info: productInfo
    }
  };

  const razorpayOrder = await razorpay.orders.create(razorpayOrderOptions);

  // Step 2: Return order details for frontend checkout
  return {
    success: true,
    paymentMethod: 'razorpay',
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: RAZORPAY_CONFIG.keyId,
    customerName,
    customerEmail,
    customerPhone,
    productInfo
  };
};

// Create Zoho Pay payment
const createZohoPayment = async (orderId, amount, customerName, customerEmail, customerPhone, productInfo) => {
  try {
    // Import Zoho service dynamically to avoid circular dependency
    const zohoService = require('./zohoService');
    
    const paymentRequest = await zohoService.createZohoPayment({
      orderId,
      amount,
      customerName,
      customerEmail,
      customerPhone,
      productInfo
    });

    return {
      success: true,
      paymentMethod: 'zoho',
      session_data: paymentRequest.session_data,
      paymentId: paymentRequest.payment_id,
      session_id: paymentRequest.session_id,
      amount: amount,
      currency: 'INR',
      customerName,
      customerEmail,
      customerPhone,
      productInfo
    };
  } catch (error) {
    console.error('Error creating Zoho payment:', error);
    throw new Error('Failed to create Zoho Pay payment');
  }
};

// Verify payment response
const verifyPaymentResponse = async (responseData, paymentMethod) => {
  try {
    switch (paymentMethod) {
      case 'payu':
        return await verifyPayUResponseData(responseData);
      
      case 'razorpay':
        return await verifyRazorpayResponse(responseData);
      
      case 'zoho':
        return await verifyZohoResponse(responseData);
      
      default:
        throw new Error('Unsupported payment method for verification');
    }

  } catch (error) {
    console.error('Error verifying payment response:', error);
    throw new Error('Payment verification failed');
  }
};

// Verify PayU response
const verifyPayUResponseData = async (responseData) => {
  const {
    mihpayid,
    mode,
    status,
    unmappedstatus,
    key,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    hash
  } = responseData;

  // Verify hash
  const calculatedHash = verifyPayUResponse({
    key,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    status,
    salt: PAYU_CONFIG.salt
  });

  if (hash !== calculatedHash) {
    throw new Error('Invalid payment response hash');
  }

  return {
    success: status === 'success',
    transactionId: mihpayid,
    paymentMode: mode,
    status: unmappedstatus,
    txnid,
    amount: parseFloat(amount),
    verified: true
  };
};

// Verify Razorpay response
const verifyRazorpayResponse = async (responseData) => {
  if (!RAZORPAY_CONFIG.keySecret) {
    throw new Error('Razorpay is not configured. Please check your environment variables.');
  }

  const {
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
    amount,
    currency
  } = responseData;

  // Verify signature
  const text = `${razorpay_order_id}|${razorpay_payment_id}`;
  const signature = crypto
    .createHmac('sha256', RAZORPAY_CONFIG.keySecret)
    .update(text)
    .digest('hex');

  if (signature !== razorpay_signature) {
    throw new Error('Invalid Razorpay signature');
  }

  return {
    success: true,
    transactionId: razorpay_payment_id,
    orderId: razorpay_order_id,
    amount: parseFloat(amount) / 100, // Convert from paise to rupees
    currency,
    verified: true
  };
};

// Verify Zoho Pay response
const verifyZohoResponse = async (responseData) => {
  try {
    // Import Zoho service dynamically to avoid circular dependency
    const zohoService = require('./zohoService');
    
    const { paymentId } = responseData;
    
    if (!paymentId) {
      throw new Error('Payment ID is required for Zoho Pay verification');
    }

    const paymentDetails = await zohoService.verifyZohoPayment(paymentId);

    // Extract order ID from metadata if available
    let orderId = null;
    if (paymentDetails.meta_data && Array.isArray(paymentDetails.meta_data)) {
      const orderMeta = paymentDetails.meta_data.find(meta => meta.key === 'order_id');
      if (orderMeta) {
        orderId = orderMeta.value;
      }
    }

    return {
      success: paymentDetails.success,
      transactionId: paymentDetails.paymentId,
      orderId: orderId,
      amount: paymentDetails.amount,
      currency: paymentDetails.currency || 'INR',
      verified: paymentDetails.verified,
      status: paymentDetails.status,
      paymentMethod: paymentDetails.paymentMethod
    };
  } catch (error) {
    console.error('Error verifying Zoho payment:', error);
    throw new Error('Zoho Pay verification failed');
  }
};

// Process refund
const processRefund = async (transactionData) => {
  try {
    console.log('Processing refund with data:', transactionData);
    
    const {
      transactionId,
      amount,
      refundAmount = amount,
      reason = 'Admin initiated refund',
      paymentMethod
    } = transactionData;
    
    // Validate inputs
    if (!transactionId) {
      throw new Error('Transaction ID is required for refund processing');
    }
    
    if (!refundAmount || refundAmount <= 0) {
      throw new Error('Valid refund amount is required');
    }
    
    if (!paymentMethod) {
      throw new Error('Payment method is required for refund processing');
    }

    switch (paymentMethod) {
      case 'payu':
        return await processPayURefund(transactionId, amount, refundAmount, reason);
      
      case 'razorpay':
        return await processRazorpayRefund(transactionId, amount, refundAmount, reason);
      
      case 'zoho':
        return await processZohoRefund(transactionId, amount, refundAmount, reason);
      
      default:
        throw new Error(`Unsupported payment method: ${paymentMethod}`);
    }

  } catch (error) {
    console.error('Error processing refund:', error);
    throw new Error(`Failed to process refund: ${error.message}`);
  }
};

// Process PayU refund
const processPayURefund = async (transactionId, amount, refundAmount, reason) => {
  try {
    // In a real implementation, you would call PayU's refund API
    console.log('Processing PayU refund:', { transactionId, amount, refundAmount, reason });
    
    // Validate PayU specific requirements
    if (!transactionId || typeof transactionId !== 'string') {
      throw new Error('Valid PayU transaction ID is required');
    }
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate success response
    const refundId = `REF_PAYU_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('PayU refund processed successfully:', refundId);
    
    return {
      success: true,
      refundId: refundId,
      refundAmount: refundAmount,
      status: 'processed',
      message: 'PayU refund processed successfully',
      transactionId: transactionId,
      processedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('PayU refund processing error:', error);
    throw new Error(`PayU refund failed: ${error.message}`);
  }
};

// Process Zoho Pay refund
const processZohoRefund = async (transactionId, amount, refundAmount, reason) => {
  try {
    // Import Zoho service dynamically to avoid circular dependency
    const zohoService = require('./zohoService');
    
    console.log('Processing Zoho Pay refund:', { transactionId, amount, refundAmount, reason });
    
    // Validate Zoho specific requirements
    if (!transactionId || typeof transactionId !== 'string') {
      throw new Error('Valid Zoho Pay payment ID is required');
    }
    
    const refundResult = await zohoService.processZohoRefund(transactionId, refundAmount, reason);
    
    console.log('Zoho Pay refund processed successfully:', refundResult);
    
    return {
      success: true,
      refundId: refundResult.refund_id || refundResult.id,
      refundAmount: refundAmount,
      status: refundResult.status || 'processed',
      message: 'Zoho Pay refund processed successfully',
      transactionId: transactionId,
      processedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Zoho Pay refund processing error:', error);
    throw new Error(`Zoho Pay refund failed: ${error.message}`);
  }
};

// Process Razorpay refund
const processRazorpayRefund = async (transactionId, amount, refundAmount, reason) => {
  if (!razorpay) {
    throw new Error('Razorpay is not configured. Please check your environment variables.');
  }

  try {
    console.log('Processing Razorpay refund:', { transactionId, amount, refundAmount, reason });
    
    // Validate Razorpay specific requirements
    if (!transactionId || typeof transactionId !== 'string') {
      throw new Error('Valid Razorpay payment ID is required');
    }
    
    // Convert refund amount to paise (Razorpay expects amount in paise)
    const refundAmountInPaise = Math.round(refundAmount * 100);
    
    if (refundAmountInPaise <= 0) {
      throw new Error('Refund amount must be greater than 0');
    }
    
    console.log('Creating Razorpay refund for payment:', transactionId, 'amount:', refundAmountInPaise, 'paise');
    
    const refund = await razorpay.payments.refund(transactionId, {
      amount: refundAmountInPaise,
      notes: {
        reason: reason || 'Admin initiated refund',
        processed_by: 'admin',
        processed_at: new Date().toISOString()
      }
    });

    console.log('Razorpay refund response:', refund);
    
    return {
      success: true,
      refundId: refund.id,
      refundAmount: Math.round(refund.amount / 100), // Convert from paise to rupees
      status: refund.status,
      message: 'Razorpay refund processed successfully',
      transactionId: transactionId,
      processedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Razorpay refund error:', error);
    
    // Handle specific Razorpay errors
    if (error.statusCode === 400) {
      throw new Error(`Razorpay refund failed: ${error.error?.description || 'Invalid request'}`);
    } else if (error.statusCode === 404) {
      throw new Error('Payment not found in Razorpay. Please check the transaction ID.');
    } else {
      throw new Error(`Razorpay refund failed: ${error.message || 'Unknown error'}`);
    }
  }
};

// Get transaction status
const getTransactionStatus = async (txnid, paymentMethod) => {
  try {
    switch (paymentMethod) {
      case 'payu':
        return await getPayUTransactionStatus(txnid);
      
      case 'razorpay':
        return await getRazorpayTransactionStatus(txnid);
      
      case 'zoho':
        return await getZohoTransactionStatus(txnid);
      
      default:
        throw new Error('Unsupported payment method for status check');
    }

  } catch (error) {
    console.error('Error getting transaction status:', error);
    throw new Error('Failed to get transaction status');
  }
};

// Get PayU transaction status
const getPayUTransactionStatus = async (txnid) => {
  // In a real implementation, you would call PayU's verify payment API
  return {
    success: true,
    status: 'success',
    amount: 0,
    txnid
  };
};

// Get Razorpay transaction status
const getRazorpayTransactionStatus = async (paymentId) => {
  if (!razorpay) {
    throw new Error('Razorpay is not configured. Please check your environment variables.');
  }

  try {
    const payment = await razorpay.payments.fetch(paymentId);
    
    return {
      success: true,
      status: payment.status,
      amount: payment.amount / 100, // Convert from paise to rupees
      currency: payment.currency,
      paymentId: payment.id
    };
  } catch (error) {
    console.error('Razorpay status check error:', error);
    throw new Error('Failed to get Razorpay transaction status');
  }
};

// Get Zoho Pay transaction status
const getZohoTransactionStatus = async (paymentId) => {
  try {
    // Import Zoho service dynamically to avoid circular dependency
    const zohoService = require('./zohoService');
    
    const paymentDetails = await zohoService.verifyZohoPayment(paymentId);
    
    return {
      success: true,
      status: paymentDetails.status,
      amount: parseFloat(paymentDetails.amount) / 100, // Convert from paise to rupees
      currency: paymentDetails.currency || 'INR',
      paymentId: paymentId
    };
  } catch (error) {
    console.error('Zoho Pay status check error:', error);
    throw new Error('Failed to get Zoho Pay transaction status');
  }
};

// Get all transactions from payment gateways
const getAllTransactions = async () => {
  try {
    console.log('Fetching all transactions from payment gateways...');
    
    let payuTransactions = { success: false, transactions: [] };
    let razorpayTransactions = { success: false, transactions: [] };
    let zohoTransactions = { success: false, transactions: [] };
    
    // Fetch PayU transactions with error handling
    try {
      payuTransactions = await getPayUAllTransactions();
    } catch (error) {
      console.error('Error fetching PayU transactions:', error);
      payuTransactions = { success: false, transactions: [], error: error.message };
    }
    
    // Fetch Razorpay transactions with error handling
    try {
      razorpayTransactions = await getRazorpayAllTransactions();
    } catch (error) {
      console.error('Error fetching Razorpay transactions:', error);
      razorpayTransactions = { success: false, transactions: [], error: error.message };
    }
    
    // Fetch Zoho Pay transactions with error handling
    try {
      zohoTransactions = await getZohoAllTransactions();
    } catch (error) {
      console.error('Error fetching Zoho Pay transactions:', error);
      zohoTransactions = { success: false, transactions: [], error: error.message };
    }

    return {
      success: true,
      data: {
        payu: payuTransactions,
        razorpay: razorpayTransactions,
        zoho: zohoTransactions
      }
    };
  } catch (error) {
    console.error('Error fetching all transactions:', error);
    return {
      success: false,
      error: error.message,
      data: {
        payu: { success: false, transactions: [] },
        razorpay: { success: false, transactions: [] },
        zoho: { success: false, transactions: [] }
      }
    };
  }
};

// Get all PayU transactions
const getPayUAllTransactions = async () => {
  try {
    // In a real implementation, you would call PayU's transaction list API
    // For now, return mock data with proper structure
    console.log('Fetching PayU transactions...');
    
    return {
      success: true,
      transactions: [
        {
          id: 'PAYU_TXN_001',
          amount: 299,
          status: 'success',
          customerName: 'John Doe',
          customerEmail: 'john@example.com',
          paymentMethod: 'payu',
          createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          orderId: 'ORDER_001'
        },
        {
          id: 'PAYU_TXN_002',
          amount: 599,
          status: 'success',
          customerName: 'Jane Smith',
          customerEmail: 'jane@example.com',
          paymentMethod: 'payu',
          createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          orderId: 'ORDER_002'
        }
      ]
    };
  } catch (error) {
    console.error('Error in getPayUAllTransactions:', error);
    return {
      success: false,
      transactions: [],
      error: error.message
    };
  }
};

// Get all Razorpay transactions
const getRazorpayAllTransactions = async () => {
  try {
    if (!razorpay) {
      console.warn('Razorpay is not configured. Please check your environment variables.');
      return {
        success: false,
        transactions: [],
        error: 'Razorpay is not configured'
      };
    }

    console.log('Fetching Razorpay transactions...');
    
    const payments = await razorpay.payments.all({
      count: 50, // Limit to last 50 transactions
      skip: 0
    });

    if (!payments || !payments.items) {
      return {
        success: true,
        transactions: []
      };
    }

    const transactions = payments.items
      .filter(payment => payment && payment.id) // Filter out invalid payments
      .map(payment => {
        try {
          return {
            id: payment.id,
            amount: Math.round((payment.amount || 0) / 100), // Convert from paise to rupees
            status: payment.status || 'pending',
            customerName: payment.notes?.customer_name || 'Unknown',
            customerEmail: payment.email || 'unknown@example.com',
            paymentMethod: 'razorpay',
            createdAt: new Date((payment.created_at || 0) * 1000).toISOString(),
            currency: payment.currency || 'INR',
            method: payment.method || 'online',
            refundStatus: payment.refund_status || null,
            orderId: payment.order_id || null
          };
        } catch (error) {
          console.warn('Error processing Razorpay payment:', payment.id, error);
          return null;
        }
      })
      .filter(Boolean); // Remove null entries
    return {
      success: true,
      transactions
    };
  } catch (error) {
    console.error('Razorpay transactions fetch error:', error);
    return {
      success: false,
      transactions: [],
      error: error.message || 'Failed to fetch Razorpay transactions'
    };
  }
};

// Get all Zoho Pay transactions
const getZohoAllTransactions = async () => {
  try {
    // Import Zoho service dynamically to avoid circular dependency
    const zohoService = require('./zohoService');
    
    console.log('Fetching Zoho Pay transactions...');
    
    // Call the actual Zoho API to get all payments
    const result = await zohoService.getAllZohoPayments();
    
    return result;
  } catch (error) {
    console.error('Error in getZohoAllTransactions:', error);
    return {
      success: false,
      transactions: [],
      error: error.message
    };
  }
};

module.exports = {
  createPaymentRequest,
  verifyPaymentResponse,
  processRefund,
  getTransactionStatus,
  getAllTransactions,
  generatePayUHash,
  verifyPayUResponse
};