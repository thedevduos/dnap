// No import needed - using browser-based Razorpay checkout script

declare global {
  interface Window {
    Razorpay: any;
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

export const getOrderData = (): any => {
  try {
    const data = sessionStorage.getItem('pendingOrderData');
    if (data) {
      const parsed = JSON.parse(data);
      console.log('Order data retrieved successfully:', parsed);
      return parsed;
    }
    return null;
  } catch (error) {
    console.error('Failed to retrieve order data:', error);
    return null;
  }
};

export const clearOrderData = (): void => {
  try {
    sessionStorage.removeItem('pendingOrderData');
    console.log('Order data cleared successfully');
  } catch (error) {
    console.error('Failed to clear order data:', error);
  }
};

export const isOrderDataStored = (): boolean => {
  return sessionStorage.getItem('pendingOrderData') !== null;
};

// Get Payment Method Description
export const getPaymentMethodDescription = (method: string): string => {
  switch (method) {
    case 'payu':
      return 'Pay securely with credit card, debit card, net banking, or UPI';
    case 'razorpay':
      return 'Pay securely with credit card, debit card, net banking, UPI, or digital wallets';
    default:
      return 'Secure payment gateway';
  }
}; 