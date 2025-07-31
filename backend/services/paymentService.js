const crypto = require('crypto');

// PayU Configuration
const PAYU_CONFIG = {
  key: process.env.PAYU_KEY || 'd3dwST',
  salt: process.env.PAYU_SALT || '4UM3eyk11v0xLxyLvltTcUJvHBTuFrIw',
  baseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://secure.payu.in/_payment' 
    : 'https://sandboxsecure.payu.in/_payment'
};

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
      productInfo = 'DNA Publications Books'
    } = orderData;

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
      paymentUrl: PAYU_CONFIG.baseUrl,
      params: paymentParams
    };

  } catch (error) {
    console.error('Error creating payment request:', error);
    throw new Error('Failed to create payment request');
  }
};

// Verify payment response
const verifyPaymentResponse = async (responseData) => {
  try {
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

  } catch (error) {
    console.error('Error verifying payment response:', error);
    throw new Error('Payment verification failed');
  }
};

// Process refund
const processRefund = async (transactionData) => {
  try {
    const {
      transactionId,
      amount,
      refundAmount = amount
    } = transactionData;

    // In a real implementation, you would call PayU's refund API
    // For now, we'll simulate the refund process
    
    console.log('Processing refund:', {
      transactionId,
      amount,
      refundAmount
    });

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      success: true,
      refundId: `REF_${Date.now()}`,
      refundAmount,
      status: 'processed',
      message: 'Refund processed successfully'
    };

  } catch (error) {
    console.error('Error processing refund:', error);
    throw new Error('Failed to process refund');
  }
};

// Get transaction status
const getTransactionStatus = async (txnid) => {
  try {
    // In a real implementation, you would call PayU's verify payment API
    // For now, we'll return a mock response
    
    return {
      success: true,
      status: 'success',
      amount: 0,
      txnid
    };

  } catch (error) {
    console.error('Error getting transaction status:', error);
    throw new Error('Failed to get transaction status');
  }
};

module.exports = {
  createPaymentRequest,
  verifyPaymentResponse,
  processRefund,
  getTransactionStatus,
  generatePayUHash,
  verifyPayUResponse
};