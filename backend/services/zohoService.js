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
  booksUrl: process.env.ZOHO_BOOKS_URL || 'https://www.zohoapis.in/books/v3',
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
      booksUrl: config.booksUrl,
      paymentsUrl: config.paymentsUrl,
      organizationId: config.organizationId,
      paymentsAccountId: config.paymentsAccountId,
      hasAccessToken: !!accessToken
    });
    
    let booksStatus = 'unknown';
    let paymentsStatus = 'unknown';
    let errorDetails = {};
    
    // Test Zoho Books API
    try {
      const booksResponse = await axios.get(`${config.booksUrl}/organizations`, {
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      booksStatus = 'connected';
    } catch (booksError) {
      booksStatus = 'failed';
      errorDetails.books = booksError.response?.data || booksError.message;
      console.error('Zoho Books API test failed:', booksError.response?.data || booksError.message);
    }

    // Test Zoho Pay API
    let successfulApproach = null;
    try {
      if (!config.paymentsAccountId) {
        paymentsStatus = 'failed';
        errorDetails.payments = { code: 'invalid_account_id', message: 'ZOHO_PAYMENTS_ACCOUNT_ID is missing from credentials' };
        console.error('Zoho Pay API test failed: Missing payments account ID');
      } else {
        // Validate account ID format
        const validation = validatePaymentsAccountId(config.paymentsAccountId);
        if (!validation.valid) {
          paymentsStatus = 'failed';
          errorDetails.payments = { code: 'invalid_account_id', message: validation.error };
          console.error('Zoho Pay API test failed:', validation.error);
        } else {
          // Try different approaches for Zoho Pay API test
          let paymentsConnected = false;
          let lastError = null;
          let successfulApproach = null;
          
          // Approach 1: Test with account ID in query params (preferred method)
          try {
            console.log(`🔍 Testing Zoho Pay with account ID in query params: ${config.paymentsAccountId}`);
            const paymentsResponse1 = await axios.get(`${config.paymentsUrl}/payments`, {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              params: {
                account_id: config.paymentsAccountId
              }
            });
            console.log('✅ Approach 1 (query params) succeeded');
            paymentsConnected = true;
            successfulApproach = 'query_params';
          } catch (error1) {
            lastError = error1;
            console.log('❌ Approach 1 (query params) failed:', error1.response?.data || error1.message);
            
            // Approach 2: Test with account ID in header
            try {
              console.log(`🔍 Testing Zoho Pay with account ID in header: ${config.paymentsAccountId}`);
              const paymentsResponse2 = await axios.get(`${config.paymentsUrl}/payments`, {
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                  'X-Zoho-Account-Id': config.paymentsAccountId
                }
              });
              console.log('✅ Approach 2 (header) succeeded');
              paymentsConnected = true;
              successfulApproach = 'header';
            } catch (error2) {
              lastError = error2;
              console.log('❌ Approach 2 (header) failed:', error2.response?.data || error2.message);
              
              // Approach 3: Test accounts endpoint to list available accounts
              try {
                console.log('🔍 Testing Zoho Pay accounts endpoint to list available accounts');
                const accountsResponse = await axios.get(`${config.paymentsUrl}/accounts`, {
                  headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                  }
                });
                console.log('✅ Approach 3 (accounts endpoint) succeeded - Found accounts:', accountsResponse.data);
                paymentsConnected = true;
                successfulApproach = 'accounts_endpoint';
              } catch (error3) {
                lastError = error3;
                console.log('❌ Approach 3 (accounts endpoint) failed:', error3.response?.data || error3.message);
                
                // Approach 4: Try without account ID (some endpoints don't require it)
                try {
                  console.log('🔍 Testing Zoho Pay without account ID');
                  const paymentsResponse4 = await axios.get(`${config.paymentsUrl}/payments`, {
                    headers: {
                      'Authorization': `Bearer ${accessToken}`,
                      'Content-Type': 'application/json'
                    }
                  });
                  console.log('✅ Approach 4 (no account ID) succeeded');
                  paymentsConnected = true;
                  successfulApproach = 'no_account_id';
                } catch (error4) {
                  lastError = error4;
                  console.log('❌ Approach 4 (no account ID) failed:', error4.response?.data || error4.message);
                }
              }
            }
          }
          
          if (paymentsConnected) {
            paymentsStatus = 'connected';
            console.log(`✅ Zoho Pay connected successfully using approach: ${successfulApproach}`);
          }
        }
      }
    } catch (paymentsError) {
      paymentsStatus = 'failed';
      errorDetails.payments = paymentsError.response?.data || paymentsError.message;
      console.error('Zoho Pay API test failed:', paymentsError.response?.data || paymentsError.message);
      
      // Add additional diagnostic information
      if (paymentsError.response?.data?.code === 'invalid_account_id') {
        console.error('💡 DIAGNOSTIC INFO:');
        console.error('   - The account ID might be incorrect');
        console.error('   - Check if you have an active Zoho Pay subscription');
        console.error('   - Verify the account ID in your Zoho Pay dashboard');
        console.error('   - Try running the diagnostic script to find the correct account ID');
      }
    }

    // Determine overall success
    const success = booksStatus === 'connected' || paymentsStatus === 'connected';
    const bothConnected = booksStatus === 'connected' && paymentsStatus === 'connected';
    
    let message;
    if (bothConnected) {
      message = 'Zoho connection fully successful - both Books and Pay are connected';
    } else if (booksStatus === 'connected') {
      message = 'Zoho connection partially successful - Books connected, Pay failed';
    } else if (paymentsStatus === 'connected') {
      message = 'Zoho connection partially successful - Pay connected, Books failed';
    } else {
      message = 'Zoho connection failed - check permissions and subscriptions';
    }

    return {
      success,
      message,
      booksStatus,
      paymentsStatus,
      organizationId: config.organizationId,
      clientId: credentials.ZOHO_CLIENT_ID,
      paymentsAccountId: config.paymentsAccountId,
      successfulPaymentsApproach: successfulApproach,
      error: Object.keys(errorDetails).length > 0 ? errorDetails : undefined
    };
  } catch (error) {
    console.error('Zoho connection test failed:', error);
    return {
      success: false,
      message: error.message || 'Zoho connection failed',
      booksStatus: 'failed',
      paymentsStatus: 'failed',
      error: error.response?.data || error.message
    };
  }
};

// Create customer in Zoho Books
const createZohoCustomer = async (customerData) => {
  try {
    const accessToken = await getValidZohoToken();
    
    console.log('📋 Customer data received:', customerData);
    
    // Handle different data structures
    let customerName, customerEmail, customerPhone, address, city, state, zip, country;
    
    if (customerData.firstName && customerData.lastName) {
      // New structure with firstName/lastName
      customerName = `${customerData.firstName} ${customerData.lastName}`;
      customerEmail = customerData.email;
      customerPhone = customerData.phone;
      address = customerData.address1;
      city = customerData.city;
      state = customerData.state;
      zip = customerData.postalCode;
      country = customerData.country;
    } else if (customerData.name) {
      // Structure with name field
      customerName = customerData.name;
      customerEmail = customerData.email;
      customerPhone = customerData.phone;
      address = customerData.address;
      city = customerData.city;
      state = customerData.state;
      zip = customerData.zip || customerData.postalCode;
      country = customerData.country;
    } else {
      // Fallback - try to construct from available fields
      customerName = customerData.customerName || customerData.name || 'Customer';
      customerEmail = customerData.email || customerData.customerEmail || 'customer@example.com';
      customerPhone = customerData.phone || customerData.customerPhone || '';
      address = customerData.address || customerData.address1 || '';
      city = customerData.city || '';
      state = customerData.state || '';
      zip = customerData.zip || customerData.postalCode || '';
      country = customerData.country || 'India';
    }
    
    // Validate required fields
    if (!customerName || customerName.trim() === '') {
      throw new Error('Customer name is required and cannot be empty');
    }
    
    if (!customerEmail || customerEmail.trim() === '') {
      throw new Error('Customer email is required and cannot be empty');
    }
    
    console.log('🔧 Processed customer data:', {
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
      address: address,
      city: city,
      state: state,
      zip: zip,
      country: country
    });
    
    const customerPayload = {
      name: customerName.trim(),
      email: customerEmail.trim(),
      contact_persons: [
        {
          name: customerName.trim(),
          email: customerEmail.trim(),
          phone: customerPhone || ''
        }
      ],
      billing_address: {
        address: address || '',
        city: city || '',
        state: state || '',
        zip: zip || '',
        country: country || 'India'
      },
      shipping_address: {
        address: address || '',
        city: city || '',
        state: state || '',
        zip: zip || '',
        country: country || 'India'
      }
    };

    console.log('📤 Sending customer payload to Zoho:', JSON.stringify(customerPayload, null, 2));
    
    const response = await axios.post(`${ZOHO_CONFIG.booksUrl}/contacts`, customerPayload, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json'
      },
      params: {
        organization_id: ZOHO_CONFIG.organizationId
      }
    });

    console.log('✅ Customer created successfully:', response.data);
    return response.data.contact;
  } catch (error) {
    console.error('❌ Error creating Zoho customer:', error);
    
    if (error.response) {
      console.error('📡 Zoho API Error Response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
      
      if (error.response.data && error.response.data.message) {
        throw new Error(`Zoho Books API Error: ${error.response.data.message}`);
      }
    }
    
    throw new Error(`Failed to create customer in Zoho Books: ${error.message}`);
  }
};

// Create invoice in Zoho Books
const createZohoInvoice = async (orderData) => {
  try {
    console.log('📄 Creating Zoho invoice for order data:', orderData);
    const accessToken = await getValidZohoToken();
    
    // Create or get customer
    let customer;
    try {
      console.log('👤 Creating customer from shipping address:', orderData.shippingAddress);
      customer = await createZohoCustomer(orderData.shippingAddress);
    } catch (error) {
      console.error('❌ Error creating customer:', error.message);
      
      // Try to create customer with fallback data
      try {
        console.log('🔄 Trying fallback customer creation...');
        const fallbackCustomerData = {
          name: orderData.customerName || orderData.userEmail || 'Customer',
          email: orderData.userEmail || orderData.customerEmail || 'customer@example.com',
          phone: orderData.customerPhone || '',
          address: orderData.shippingAddress?.address1 || '',
          city: orderData.shippingAddress?.city || '',
          state: orderData.shippingAddress?.state || '',
          zip: orderData.shippingAddress?.postalCode || '',
          country: orderData.shippingAddress?.country || 'India'
        };
        
        console.log('📋 Fallback customer data:', fallbackCustomerData);
        customer = await createZohoCustomer(fallbackCustomerData);
      } catch (fallbackError) {
        console.error('❌ Fallback customer creation also failed:', fallbackError.message);
        throw new Error(`Customer creation failed: ${error.message}`);
      }
    }

    // Prepare line items
    const lineItems = orderData.items.map(item => ({
      name: item.title,
      description: `Author: ${item.author}`,
      rate: item.price,
      quantity: item.quantity,
      tax_id: '', // Add tax ID if applicable
      item_total: item.price * item.quantity
    }));

    // Calculate totals
    const subtotal = lineItems.reduce((sum, item) => sum + item.item_total, 0);
    const discount = orderData.discount || 0;
    const shipping = orderData.shippingCost || 0;
    const total = subtotal - discount + shipping;

    const invoicePayload = {
      customer_id: customer.contact_id,
      line_items: lineItems,
      subtotal: subtotal,
      total: total,
      discount: discount,
      shipping_charge: shipping,
      notes: `Order ID: ${orderData.orderId}`,
      reference_number: orderData.orderId,
      custom_fields: [
        {
          label: 'Order ID',
          value: orderData.orderId
        },
        {
          label: 'Payment Method',
          value: orderData.paymentMethod
        }
      ]
    };

    console.log('📤 Sending invoice payload to Zoho:', JSON.stringify(invoicePayload, null, 2));
    
    const response = await axios.post(`${ZOHO_CONFIG.booksUrl}/invoices`, invoicePayload, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json'
      },
      params: {
        organization_id: ZOHO_CONFIG.organizationId
      }
    });

    console.log('✅ Invoice created successfully:', response.data);
    return response.data.invoice;
  } catch (error) {
    console.error('❌ Error creating Zoho invoice:', error);
    
    if (error.response) {
      console.error('📡 Zoho API Error Response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
      
      if (error.response.data && error.response.data.message) {
        throw new Error(`Zoho Books API Error: ${error.response.data.message}`);
      }
    }
    
    throw new Error(`Failed to create invoice in Zoho Books: ${error.message}`);
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
  createZohoCustomer,
  createZohoInvoice,
  createZohoPayment,
  verifyZohoPayment,
  processZohoRefund,
  refreshZohoToken,
  getValidZohoToken,
  getZohoCredentials
}; 