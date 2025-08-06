// Import Firebase utilities for Zoho credentials
import { getZohoCredentials } from './firebase-utils'

declare global {
  interface Window {
  Razorpay: any;
  ZPayments: any;
}
}

// Load Razorpay script
const loadRazorpayScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay script'));
    document.head.appendChild(script);
  });
};

// Initialize Razorpay
export const initializeRazorpay = async (): Promise<any> => {
  await loadRazorpayScript();
  return window.Razorpay;
};

// PayU Payment Handler
export const handlePayUPayment = async (paymentData: any): Promise<void> => {
  const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/api/payment/create-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...paymentData,
      paymentMethod: 'payu'
    }),
  });

  const result = await response.json();
  
  if (result.success) {
    // Create form and submit to PayU
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = result.paymentUrl;
    
    Object.keys(result.params).forEach(key => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = result.params[key];
      form.appendChild(input);
    });
    
    document.body.appendChild(form);
    form.submit();
  } else {
    throw new Error(result.message || 'Failed to create PayU payment');
  }
};

// Razorpay Payment Handler
export const handleRazorpayPayment = async (paymentData: any): Promise<void> => {
  const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/api/payment/create-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...paymentData,
      paymentMethod: 'razorpay'
    }),
  });

  const result = await response.json();
  
  if (result.success) {
    const Razorpay = await initializeRazorpay();
    
    const options = {
      key: result.keyId,
      amount: result.amount,
      currency: result.currency,
      name: 'DNA Publications',
      description: result.productInfo || 'DNA Publications Books',
      order_id: result.razorpayOrderId,
      handler: function (response: any) {
        console.log('Razorpay payment successful:', response);
        // Store the response for verification
        sessionStorage.setItem('razorpayResponse', JSON.stringify(response));
        window.location.href = `${window.location.origin}/payment/success?method=razorpay`;
      },
      prefill: {
        name: result.customerName,
        email: result.customerEmail,
        contact: result.customerPhone
      },
      theme: {
        color: '#3B82F6'
      }
    };

    const rzp = new Razorpay(options);
    rzp.open();
  } else {
    throw new Error(result.message || 'Failed to create Razorpay payment');
  }
};

// Zoho Pay Payment Handler
export const handleZohoPayment = async (paymentData: any): Promise<void> => {
  console.log('🚀 Starting Zoho payment process...', paymentData);
  
  const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/api/payment/create-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...paymentData,
      paymentMethod: 'zoho'
    }),
  });

  const result = await response.json();
  console.log('📡 Backend response:', result);
  
  if (result.success) {
    // Use Zoho Payments Checkout Widget instead of URL redirection
    if (result.session_data && result.session_data.session_id) {
      console.log('✅ Session data received:', result.session_data);
      // Initialize Zoho Payments Checkout Widget
      await initializeZohoPaymentsWidget(result.session_data);
    } else {
      console.error('❌ No session data in response:', result);
      throw new Error('Zoho Pay session data not received');
    }
  } else {
    console.error('❌ Backend error:', result.message);
    throw new Error(result.message || 'Failed to create Zoho Pay payment');
  }
};

// Initialize Zoho Payments Checkout Widget
const initializeZohoPaymentsWidget = async (sessionData: any): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      console.log('🔄 Initializing Zoho Payments Checkout Widget...');
      console.log('📋 Session data:', sessionData);
      console.log('🆔 Session ID:', sessionData.session_id);
      
      // Clear any existing iframe elements that might be cached
      const existingIframes = document.querySelectorAll('iframe[src*="payments.zoho.in"]');
      existingIframes.forEach(iframe => {
        console.log('🗑️ Removing existing iframe:', iframe);
        iframe.remove();
      });
      
      // Store session data in sessionStorage for payment verification
      const sessionStorageData = {
        session_id: sessionData.session_id,
        amount: sessionData.amount,
        currency: sessionData.currency,
        description: sessionData.description,
        invoice_number: sessionData.invoice_number,
        timestamp: Date.now()
      };
      
      sessionStorage.setItem('zoho_payment_session', JSON.stringify(sessionStorageData));
      console.log('💾 Session data stored:', sessionStorageData);
      
      // Load Zoho Payments Widget script if not already loaded
      if (!window.ZPayments) {
        console.log('📦 Loading Zoho Payments Widget script...');
        
        // Remove any existing Zoho script tags to prevent conflicts
        const existingScripts = document.querySelectorAll('script[src*="zpayments.js"]');
        existingScripts.forEach(script => {
          console.log('🗑️ Removing existing Zoho script:', script);
          script.remove();
        });
        
        const script = document.createElement('script');
        script.src = 'https://static.zohocdn.com/zpay/zpay-js/v1/zpayments.js?v=' + Date.now();
        script.onload = () => {
          console.log('✅ Zoho Payments Widget script loaded');
          initializeWidget(sessionData, resolve, reject);
        };
        script.onerror = () => {
          console.error('❌ Failed to load Zoho Payments Widget script');
          reject(new Error('Failed to load Zoho Payments Widget script'));
        };
        document.head.appendChild(script);
      } else {
        console.log('✅ Zoho Payments Widget script already loaded');
        initializeWidget(sessionData, resolve, reject);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error initializing Zoho Payments widget:', errorMessage);
      reject(new Error(`Failed to initialize Zoho Payments widget: ${errorMessage}`));
    }
  });
};

// Initialize the Zoho Payments Widget
const initializeWidget = async (sessionData: any, resolve: () => void, reject: (error: Error) => void) => {
  let instance: any = null;
  
  try {
    console.log('🔧 Creating Zoho Payments Widget instance...');
    
    // Fetch Zoho credentials from Firebase
    console.log('🔑 Fetching Zoho credentials from Firebase...');
    const zohoCredentials = await getZohoCredentials();
    
    if (!zohoCredentials.ZOHO_PAY_API_KEY) {
      throw new Error('Zoho Payments API key not found in Firebase');
    }
    
    console.log('✅ Zoho credentials fetched successfully');
    
    // Create widget configuration
    const config = {
      account_id: "60043828274", // Your Zoho Payments account ID
      domain: "IN", // India domain
      otherOptions: {
        api_key: zohoCredentials.ZOHO_PAY_API_KEY
      }
    };
    
    console.log('⚙️ Widget config:', config);
    
    // Create widget instance
    instance = new window.ZPayments(config);
    
    // Prepare payment options
    const options = {
      amount: sessionData.amount.toString(),
      currency_code: sessionData.currency || "INR",
      payments_session_id: sessionData.session_id,
      currency_symbol: "₹",
      business: "DNA Publications",
      description: sessionData.description || "DNA Publications Books",
      invoice_number: sessionData.invoice_number,
      reference_number: sessionData.session_id,
      // payment_method: "card" // Default to card payment
    };
    
    console.log('💳 Payment options:', options);
    
    // Initiate payment
    console.log('🚀 Initiating payment...');
    const data = await instance.requestPaymentMethod(options);
    
    console.log('✅ Payment successful:', data);
    
    // Handle successful payment
    if (data.payment_id) {
      console.log('💰 Payment completed with ID:', data.payment_id);
      window.location.href = `/payment/success?method=zoho&payment_id=${data.payment_id}`;
      resolve();
    } else {
      throw new Error('Payment failed - no payment ID received');
    }
    
  } catch (error) {
    console.error('❌ Payment failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'widget_closed') {
      console.log('🔄 Widget was closed by user');
      reject(new Error('Payment cancelled by user'));
    } else {
      console.error('💥 Payment error:', errorMessage);
      window.location.href = `/payment/failure?method=zoho&error=${encodeURIComponent(errorMessage)}`;
      reject(new Error(errorMessage || 'Payment failed'));
    }
  } finally {
    // Close the widget
    try {
      if (window.ZPayments && instance) {
        await instance.close();
        console.log('🔒 Widget closed');
      }
    } catch (closeError) {
      const closeErrorMessage = closeError instanceof Error ? closeError.message : 'Unknown error';
      console.warn('⚠️ Error closing widget:', closeErrorMessage);
    }
  }
};

// Verify Payment Response
export const verifyPaymentResponse = async (responseData: any, paymentMethod: string): Promise<any> => {
  const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/api/payment/verify-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...responseData,
      paymentMethod
    }),
  });

  const result = await response.json();
  
  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.message || 'Payment verification failed');
  }
};

// Get Payment Method Display Name
export const getPaymentMethodDisplayName = (method: string): string => {
  switch (method) {
    case 'payu':
      return 'PayU Payment Gateway';
    case 'razorpay':
      return 'Razorpay';
    case 'zoho':
      return 'Zoho Pay';
    default:
      return method;
  }
};

// Order Data Management Utilities
export const storeOrderData = (orderData: any): void => {
  try {
    sessionStorage.setItem('pendingOrderData', JSON.stringify(orderData));
    console.log('Order data stored successfully:', orderData);
  } catch (error) {
    console.error('Failed to store order data:', error);
  }
};

export const storeCartData = (cartItems: any[], formData: any, appliedCoupon?: any, discount?: number): void => {
  try {
    const orderData = {
      items: cartItems.map(item => ({
        bookId: item.id,
        title: item.title,
        author: item.author,
        price: item.price,
        quantity: item.quantity,
        imageUrl: item.imageUrl,
        category: item.category || 'book'
      })),
      shippingAddress: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        address1: formData.address1,
        address2: formData.address2,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        country: formData.country
      },
      paymentMethod: formData.paymentMethod,
      shippingMethod: formData.shippingMethod,
      userEmail: formData.email,
      appliedCoupon: appliedCoupon ? {
        code: appliedCoupon.code,
        discountAmount: discount
      } : null,
      discount: discount || 0
    };
    
    sessionStorage.setItem('pendingOrderData', JSON.stringify(orderData));
    console.log('Cart data stored successfully:', orderData);
  } catch (error) {
    console.error('Failed to store cart data:', error);
  }
};

export const getOrderData = (): any => {
  try {
    const data = sessionStorage.getItem('pendingOrderData');
    if (data) {
      const parsed = JSON.parse(data);
      console.log('Order data retrieved successfully:', parsed);
      return parsed;
    }
    console.log('No order data found in sessionStorage');
    return null;
  } catch (error) {
    console.error('Failed to retrieve order data:', error);
    return null;
  }
};

export const clearOrderData = (): void => {
  try {
    sessionStorage.removeItem('pendingOrderData');
    sessionStorage.removeItem('paymentProcessing');
    sessionStorage.removeItem('successPageEffectRun');
    console.log('Order data cleared successfully');
  } catch (error) {
    console.error('Failed to clear order data:', error);
  }
};

export const isOrderDataStored = (): boolean => {
  try {
    return sessionStorage.getItem('pendingOrderData') !== null;
  } catch (error) {
    console.error('Failed to check order data:', error);
    return false;
  }
};

export const hasStoredOrderData = (): boolean => {
  try {
    const data = sessionStorage.getItem('pendingOrderData');
    if (!data) return false;
    
    const orderData = JSON.parse(data);
    return orderData && orderData.items && orderData.items.length > 0;
  } catch (error) {
    console.error('Failed to check stored order data:', error);
    return false;
  }
};

// Get Payment Method Description
export const getPaymentMethodDescription = (method: string): string => {
  switch (method) {
    case 'payu':
      return 'Pay securely with credit/debit cards, net banking, UPI, and digital wallets';
    case 'razorpay':
      return 'Pay securely with credit/debit cards, net banking, UPI, popular digital wallets, and international cards';
    case 'zoho':
      return 'Pay securely with credit/debit cards, net banking, UPI, and digital payment methods';
    default:
      return 'Secure payment gateway';
  }
}; 