const axios = require('axios');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, setDoc } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

// Validate Firebase configuration
const validateFirebaseConfig = () => {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const missingFields = requiredFields.filter(field => !firebaseConfig[field]);
  
  if (missingFields.length > 0) {
    console.error('Missing Firebase configuration fields:', missingFields);
    throw new Error(`Missing Firebase configuration: ${missingFields.join(', ')}`);
  }
  
  console.log('Firebase configuration validated successfully');
};

// Initialize Firebase
let app, db;
try {
  validateFirebaseConfig();
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization failed:', error);
  throw error;
}

// Zoho API Configuration
const ZOHO_CONFIG = {
  paymentsUrl: process.env.ZOHO_PAYMENTS_URL || 'https://payments.zoho.in/api/v1',
  organizationId: process.env.ZOHO_ORGANIZATION_ID,
};

// Get Zoho configuration with credentials
const getZohoConfig = async () => {
  try {
    const credentials = await getZohoCredentials();
    
    // Validate required credentials
    const requiredFields = [
      'ZOHO_CLIENT_ID',
      'ZOHO_CLIENT_SECRET', 
      'ZOHO_REFRESH_TOKEN',
      'ZOHO_ORGANIZATION_ID',
      'ZOHO_PAYMENTS_ACCOUNT_ID',
      'ZOHO_PAY_API_KEY',
      'ZOHO_PAY_SIGNING_KEY'
    ];
    
    const missingFields = requiredFields.filter(field => !credentials[field]);
    
    if (missingFields.length > 0) {
      console.error('Missing required Zoho credentials:', missingFields);
      throw new Error(`Missing required Zoho credentials: ${missingFields.join(', ')}`);
    }
    
    console.log('Zoho configuration validated successfully');
    
    return {
      ...ZOHO_CONFIG,
      organizationId: credentials.ZOHO_ORGANIZATION_ID,
      paymentsAccountId: credentials.ZOHO_PAYMENTS_ACCOUNT_ID,
      clientId: credentials.ZOHO_CLIENT_ID,
      clientSecret: credentials.ZOHO_CLIENT_SECRET,
      refreshToken: credentials.ZOHO_REFRESH_TOKEN,
      payApiKey: credentials.ZOHO_PAY_API_KEY,
      paySigningKey: credentials.ZOHO_PAY_SIGNING_KEY
    };
  } catch (error) {
    console.error('Error getting Zoho configuration:', error);
    throw error;
  }
};

// Validate Zoho Payments Account ID format
const validatePaymentsAccountId = (accountId) => {
  if (!accountId) return { valid: false, error: 'Account ID is missing' };
  
  // Zoho account IDs can be numeric and typically 8-12 digits
  // Let's be more flexible with the format validation
  if (!/^\d{8,12}$/.test(accountId)) {
    return { 
      valid: false, 
      error: `Invalid account ID format. Expected 8-12 digits, got: ${accountId}` 
    };
  }
  
  return { valid: true };
};

// Zoho API credentials storage key
const ZOHO_CRED_KEY = 'zohoapi/ZOHO_CRED';

// Get Zoho credentials from Firestore
const getZohoCredentials = async () => {
  try {
    console.log('Fetching Zoho credentials from Firestore...');
    const credDoc = await getDoc(doc(db, 'zohoapi', 'ZOHO_CRED'));
    if (credDoc.exists()) {
      const data = credDoc.data();
      console.log('Zoho credentials found:', {
        hasClientId: !!data.ZOHO_CLIENT_ID,
        hasClientSecret: !!data.ZOHO_CLIENT_SECRET,
        hasRefreshToken: !!data.ZOHO_REFRESH_TOKEN,
        hasAccessToken: !!data.ZOHO_ACCESS_TOKEN,
        hasOrgId: !!data.ZOHO_ORGANIZATION_ID,
        hasPayApiKey: !!data.ZOHO_PAY_API_KEY,
        hasPaySigningKey: !!data.ZOHO_PAY_SIGNING_KEY
      });
      return data;
    }
    throw new Error('Zoho credentials not found in Firestore at zohoapi/ZOHO_CRED');
  } catch (error) {
    console.error('Error fetching Zoho credentials:', error);
    if (error.code === 'permission-denied') {
      throw new Error('Firebase permission denied. Check Firebase configuration and rules.');
    }
    throw new Error(`Failed to fetch Zoho credentials: ${error.message}`);
  }
};

// Update Zoho credentials in Firestore
const updateZohoCredentials = async (credentials) => {
  try {
    await setDoc(doc(db, 'zohoapi', 'ZOHO_CRED'), credentials, { merge: true });
    console.log('Zoho credentials updated successfully');
  } catch (error) {
    console.error('Error updating Zoho credentials:', error);
    throw new Error('Failed to update Zoho credentials');
  }
};

// Refresh Zoho access token
const refreshZohoToken = async () => {
  try {
    console.log('Starting Zoho token refresh...');
    const credentials = await getZohoCredentials();
    
    // Validate required credentials
    if (!credentials.ZOHO_REFRESH_TOKEN) {
      throw new Error('ZOHO_REFRESH_TOKEN is missing from credentials');
    }
    if (!credentials.ZOHO_CLIENT_ID) {
      throw new Error('ZOHO_CLIENT_ID is missing from credentials');
    }
    if (!credentials.ZOHO_CLIENT_SECRET) {
      throw new Error('ZOHO_CLIENT_SECRET is missing from credentials');
    }
    
    console.log('Making token refresh request to Zoho...');
    
    // Create form data for the request
    const formData = new URLSearchParams();
    formData.append('refresh_token', credentials.ZOHO_REFRESH_TOKEN);
    formData.append('client_id', credentials.ZOHO_CLIENT_ID);
    formData.append('client_secret', credentials.ZOHO_CLIENT_SECRET);
    formData.append('grant_type', 'refresh_token');
    
    const response = await axios.post('https://accounts.zoho.in/oauth/v2/token', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    console.log('Zoho token refresh response received');
    const newCredentials = {
      ...credentials,
      ZOHO_ACCESS_TOKEN: response.data.access_token,
      token_expires_at: Date.now() + (response.data.expires_in * 1000),
      updatedAt: new Date().toISOString()
    };

    await updateZohoCredentials(newCredentials);
    console.log('Zoho access token refreshed successfully');
    
    return newCredentials.ZOHO_ACCESS_TOKEN;
  } catch (error) {
    console.error('Error refreshing Zoho token:', error);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Zoho API Error Response:', {
        status: error.response.status,
        data: error.response.data
      });
      
      if (error.response.status === 400) {
        throw new Error(`Zoho API Error: ${error.response.data.error || 'Invalid request parameters'}`);
      } else if (error.response.status === 401) {
        throw new Error('Zoho API Error: Unauthorized - Check your client credentials and refresh token');
      } else if (error.response.status === 403) {
        throw new Error('Zoho API Error: Forbidden - Check your API permissions');
      } else {
        throw new Error(`Zoho API Error (${error.response.status}): ${error.response.data.error || 'Unknown error'}`);
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from Zoho API');
      throw new Error('No response received from Zoho API. Check your internet connection.');
    } else {
      // Something happened in setting up the request that triggered an Error
      throw new Error(`Request setup error: ${error.message}`);
    }
  }
};

// Get valid Zoho access token (refresh if expired)
const getValidZohoToken = async () => {
  try {
    const credentials = await getZohoCredentials();
    
    // Check if token is expired (with 3 minute buffer)
    const isExpired = credentials.token_expires_at && 
                     (Date.now() + 3 * 60 * 1000) > credentials.token_expires_at;
    
    if (isExpired) {
      console.log('Zoho access token expired, refreshing...');
      return await refreshZohoToken();
    }
    
    return credentials.ZOHO_ACCESS_TOKEN;
  } catch (error) {
    console.error('Error getting valid Zoho token:', error);
    throw error;
  }
};

// Test Zoho connection
const testZohoConnection = async () => {
  try {
    const accessToken = await getValidZohoToken();
    const credentials = await getZohoCredentials();
    const config = await getZohoConfig();
    
    console.log('🔍 Testing Zoho connection with config:', {
      paymentsUrl: config.paymentsUrl,
      organizationId: config.organizationId,
      paymentsAccountId: config.paymentsAccountId,
      hasAccessToken: !!accessToken
    });
    
    let paymentsStatus = 'unknown';
    let errorDetails = {};

    // Test Zoho Pay API
    let successfulApproach = null;
    
    // Approach 1: Test with Bearer token - try without parameters first
    try {
      const paymentsResponse = await axios.get(`${config.paymentsUrl}/payments`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (paymentsResponse.status === 200) {
        paymentsStatus = 'connected';
        successfulApproach = 'Bearer token (no params)';
        console.log('✅ Zoho Pay API test successful with Bearer token (no params)');
      }
    } catch (paymentsError) {
      console.log('Zoho Pay API test with Bearer token (no params) failed, trying with account_id...');
      
      // Approach 2: Test with Bearer token and account_id
      try {
        const paymentsResponse2 = await axios.get(`${config.paymentsUrl}/payments`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          params: {
            account_id: config.paymentsAccountId
          }
        });
        
        if (paymentsResponse2.status === 200) {
          paymentsStatus = 'connected';
          successfulApproach = 'Bearer token (with account_id)';
          console.log('✅ Zoho Pay API test successful with Bearer token (with account_id)');
        }
      } catch (paymentsError2) {
        console.log('Zoho Pay API test with Bearer token (with account_id) failed, trying Zoho-oauthtoken...');
        
        // Approach 3: Test with Zoho-oauthtoken
        try {
          const paymentsResponse3 = await axios.get(`${config.paymentsUrl}/payments`, {
            headers: {
              'Authorization': `Zoho-oauthtoken ${accessToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (paymentsResponse3.status === 200) {
            paymentsStatus = 'connected';
            successfulApproach = 'Zoho-oauthtoken (no params)';
            console.log('✅ Zoho Pay API test successful with Zoho-oauthtoken (no params)');
          }
        } catch (paymentsError3) {
          paymentsStatus = 'failed';
          errorDetails.payments = {
            bearerErrorNoParams: paymentsError.response?.data || paymentsError.message,
            bearerErrorWithParams: paymentsError2.response?.data || paymentsError2.message,
            zohoTokenError: paymentsError3.response?.data || paymentsError3.message
          };
          console.error('Zoho Pay API test failed with all approaches:', {
            bearerErrorNoParams: paymentsError.response?.data || paymentsError.message,
            bearerErrorWithParams: paymentsError2.response?.data || paymentsError2.message,
            zohoTokenError: paymentsError3.response?.data || paymentsError3.message
          });
        }
      }
    }

    // Determine overall success
    const success = paymentsStatus === 'connected';
    let message = '';
    
    if (success) {
      message = 'Zoho Pay connection successful';
    } else {
      message = 'Zoho Pay connection failed';
    }

    return {
      success,
      message,
      paymentsStatus,
      organizationId: config.organizationId,
      clientId: config.clientId,
      error: success ? undefined : errorDetails,
      successfulApproach
    };

  } catch (error) {
    console.error('❌ Error testing Zoho connection:', error);
    
    return {
      success: false,
      message: 'Failed to test Zoho connection',
      paymentsStatus: 'failed',
      error: error.message
    };
  }
};

// Create Zoho Pay payment
const createZohoPayment = async (paymentData) => {
  try {
    const accessToken = await getValidZohoToken();
    const config = await getZohoConfig();
    
    if (!config.paymentsAccountId) {
      throw new Error('ZOHO_PAYMENTS_ACCOUNT_ID is missing from credentials');
    }
    
    // Validate required payment data
    if (!paymentData.amount || paymentData.amount <= 0) {
      throw new Error('Invalid payment amount');
    }
    if (!paymentData.customerEmail) {
      throw new Error('Customer email is required');
    }
    if (!paymentData.customerName) {
      throw new Error('Customer name is required');
    }
    if (!paymentData.orderId) {
      throw new Error('Order ID is required');
    }
    
    // Create payment session using Zoho Payments API
    const paymentSessionData = {
      amount: paymentData.amount,
      currency: 'INR',
      description: paymentData.productInfo || 'DNA Publications Books',
      meta_data: [
        {
          key: 'order_id',
          value: paymentData.orderId
        },
        {
          key: 'customer_name',
          value: paymentData.customerName
        },
        {
          key: 'customer_email',
          value: paymentData.customerEmail
        }
      ]
    };

    if (paymentData.customerPhone) {
      paymentSessionData.meta_data.push({
        key: 'customer_phone',
        value: paymentData.customerPhone
      });
    }

    // Add invoice number if available
    if (paymentData.orderId) {
      paymentSessionData.invoice_number = `INV-${paymentData.orderId}`;
    }

    console.log('Creating Zoho Payment Session with data:', paymentSessionData);

    // Create payment session
    const sessionResponse = await axios.post(`${config.paymentsUrl}/paymentsessions`, paymentSessionData, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      params: {
        account_id: config.paymentsAccountId
      }
    });

    console.log('Zoho Payment Session response:', sessionResponse.data);

    if (sessionResponse.data.code !== 0) {
      throw new Error(`Zoho Payment Session Error: ${sessionResponse.data.message}`);
    }

    const paymentSession = sessionResponse.data.payments_session;
    
    // According to Zoho Payments API documentation, we need to use the Checkout Widget
    // The payment session ID is used to initialize the widget, not as a direct URL
    // We'll return the session ID and let the frontend handle the widget integration
    
    console.log('Payment session created successfully:', {
      session_id: paymentSession.payments_session_id,
      amount: paymentSession.amount,
      currency: paymentSession.currency,
      created_time: paymentSession.created_time
    });

    return {
      success: true,
      payment_id: paymentSession.payments_session_id,
      session_id: paymentSession.payments_session_id,
      amount: paymentData.amount,
      currency: 'INR',
      created_time: paymentSession.created_time,
      // Return session data for frontend widget integration
      session_data: {
        session_id: paymentSession.payments_session_id,
        amount: paymentSession.amount,
        currency: paymentSession.currency,
        description: paymentSession.description,
        invoice_number: paymentSession.invoice_number
      }
    };

  } catch (error) {
    console.error('Error creating Zoho payment:', error);
    
    if (error.response) {
      console.error('Zoho Payments API Error Response:', {
        status: error.response.status,
        data: error.response.data
      });
      
      if (error.response.data && error.response.data.message) {
        throw new Error(`Zoho Payments Error: ${error.response.data.message}`);
      } else if (error.response.status === 400) {
        throw new Error('Zoho Payments Error: Invalid request parameters');
      } else if (error.response.status === 401) {
        throw new Error('Zoho Payments Error: Unauthorized - Check your access token');
      } else if (error.response.status === 403) {
        throw new Error('Zoho Payments Error: Forbidden - Check your account permissions');
      } else {
        throw new Error(`Zoho Payments Error (${error.response.status}): ${error.response.data?.message || 'Unknown error'}`);
      }
    } else if (error.request) {
      throw new Error('No response received from Zoho Payments API. Check your internet connection.');
    } else {
      throw new Error(`Request setup error: ${error.message}`);
    }
  }
};

// Verify Zoho Pay payment
const verifyZohoPayment = async (paymentId) => {
  try {
    const accessToken = await getValidZohoToken();
    const config = await getZohoConfig();
    
    if (!config.paymentsAccountId) {
      throw new Error('ZOHO_PAYMENTS_ACCOUNT_ID is missing from credentials');
    }
    
    // First, try to verify as a payment ID
    try {
      const response = await axios.get(`${config.paymentsUrl}/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          account_id: config.paymentsAccountId
        }
      });

      console.log('Zoho Payment verification response:', response.data);

      if (response.data.code !== 0) {
        throw new Error(`Zoho Payment verification error: ${response.data.message}`);
      }

      const payment = response.data.payment;
      
      return {
        success: payment.status === 'succeeded',
        paymentId: payment.payment_id,
        amount: parseFloat(payment.amount),
        currency: payment.currency,
        status: payment.status,
        paymentMethod: payment.payment_method?.type || 'unknown',
        date: payment.date,
        verified: true
      };
    } catch (paymentError) {
      // If payment ID verification fails, try as session ID
      console.log('Payment ID verification failed, trying as session ID...');
      
      const sessionResponse = await axios.get(`${config.paymentsUrl}/paymentsessions/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          account_id: config.paymentsAccountId
        }
      });

      console.log('Zoho Payment Session verification response:', sessionResponse.data);

      if (sessionResponse.data.code !== 0) {
        throw new Error(`Zoho Payment Session verification error: ${sessionResponse.data.message}`);
      }

      const paymentSession = sessionResponse.data.payments_session;
      
      // Check if there are any payments in the session
      if (paymentSession.payments && paymentSession.payments.length > 0) {
        const payment = paymentSession.payments[0]; // Get the first payment
        return {
          success: payment.status === 'succeeded',
          paymentId: payment.payment_id,
          amount: parseFloat(paymentSession.amount),
          currency: paymentSession.currency,
          status: payment.status,
          paymentMethod: 'card', // Default payment method
          date: payment.created_time,
          verified: true,
          sessionId: paymentSession.payments_session_id
        };
      } else {
        // No payments found in session
        return {
          success: false,
          paymentId: null,
          amount: parseFloat(paymentSession.amount),
          currency: paymentSession.currency,
          status: 'pending',
          paymentMethod: 'unknown',
          date: paymentSession.created_time,
          verified: true,
          sessionId: paymentSession.payments_session_id
        };
      }
    }
  } catch (error) {
    console.error('Error verifying Zoho payment:', error);
    
    if (error.response) {
      console.error('Zoho Payment verification API Error:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    
    throw new Error('Failed to verify Zoho Pay payment');
  }
};

// Get all Zoho Pay payments
const getAllZohoPayments = async () => {
  try {
    const accessToken = await getValidZohoToken();
    const config = await getZohoConfig();
    
    if (!config.paymentsAccountId) {
      throw new Error('ZOHO_PAYMENTS_ACCOUNT_ID is missing from credentials');
    }
    
    // Try without any parameters first
    let response;
    try {
      response = await axios.get(`${config.paymentsUrl}/payments`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      // If that fails, try with account_id
      response = await axios.get(`${config.paymentsUrl}/payments`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          account_id: config.paymentsAccountId
        }
      });
    }

    if (response.data.code !== 0) {
      throw new Error(`Zoho payments fetch error: ${response.data.message}`);
    }

    const payments = response.data.payments || [];
    
    // Transform payments to match the expected format
    const transformedPayments = payments.map(payment => ({
      id: payment.payment_id,
      amount: parseFloat(payment.amount),
      status: payment.status === 'succeeded' ? 'success' : payment.status,
      customerName: payment.customer_name || 'Unknown',
              customerEmail: payment.customer_email || 'No email provided',
      paymentMethod: 'zoho',
      createdAt: payment.date || new Date().toISOString(),
      currency: payment.currency || 'INR',
      method: payment.payment_method?.type || 'online',
      refundStatus: payment.refund_status || null,
      orderId: payment.reference_number || null
    }));

    return {
      success: true,
      transactions: transformedPayments
    };
  } catch (error) {
    console.error('Error fetching Zoho payments:', error);
    
    if (error.response) {
      console.error('Zoho Payments API Error:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    
    return {
      success: false,
      transactions: [],
      error: error.message || 'Failed to fetch Zoho Pay payments'
    };
  }
};

// Process Zoho Pay refund
const processZohoRefund = async (paymentId, amount, reason) => {
  try {
    const accessToken = await getValidZohoToken();
    const config = await getZohoConfig();
    
    if (!config.paymentsAccountId) {
      throw new Error('ZOHO_PAYMENTS_ACCOUNT_ID is missing from credentials');
    }
    
    const refundPayload = {
      amount: amount,
      reason: reason || 'requested_by_customer',
      type: 'initiated_by_merchant'
    };

    console.log('Processing Zoho refund with payload:', refundPayload);

    const response = await axios.post(`${config.paymentsUrl}/payments/${paymentId}/refunds`, refundPayload, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      params: {
        account_id: config.paymentsAccountId
      }
    });

    console.log('Zoho refund response:', response.data);

    if (response.data.code !== 0) {
      throw new Error(`Zoho refund error: ${response.data.message}`);
    }

    return response.data.refund;
  } catch (error) {
    console.error('Error processing Zoho refund:', error);
    
    if (error.response) {
      console.error('Zoho Refund API Error:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    
    throw new Error('Failed to process Zoho Pay refund');
  }
};

module.exports = {
  testZohoConnection,
  createZohoPayment,
  verifyZohoPayment,
  processZohoRefund,
  getAllZohoPayments,
  refreshZohoToken,
  getValidZohoToken,
  getZohoCredentials
}; 