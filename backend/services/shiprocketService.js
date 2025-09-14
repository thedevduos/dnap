const axios = require('axios');

// Shiprocket Configuration
const SHIPROCKET_CONFIG = {
  email: process.env.SHIPROCKET_EMAIL,
  password: process.env.SHIPROCKET_PASSWORD,
  baseUrl: process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in/v1/external'
};

// Pickup Address (Permanent)
const PICKUP_ADDRESS = {
  pickup_location: "work", // Use the correct pickup location name from Shiprocket
  name: "Nitin A",
  email: "info@dnap.in",
  phone: "7598691689",
  address: "No.5, Sastik House, Sivasakthi Amman Nagar, opposite to Keeranatham Panchayat Office",
  address_2: "Keeranatham",
  city: "Coimbatore",
  state: "Tamil Nadu",
  country: "India",
  pin_code: "641035"
};

let authToken = null;
let tokenExpiry = null;

// Get authentication token
const getAuthToken = async () => {
  try {
    // Check if we have a valid token
    if (authToken && tokenExpiry && new Date() < tokenExpiry) {
      return authToken;
    }

    console.log('Getting new Shiprocket auth token...');
    
    const response = await axios.post(`${SHIPROCKET_CONFIG.baseUrl}/auth/login`, {
      email: SHIPROCKET_CONFIG.email,
      password: SHIPROCKET_CONFIG.password
    });

    if (response.data && response.data.token) {
      authToken = response.data.token;
      // Set token expiry to 24 hours from now (tokens typically last 24-48 hours)
      tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      console.log('Shiprocket auth token obtained successfully');
      return authToken;
    } else {
      throw new Error('Invalid response from Shiprocket auth API');
    }
  } catch (error) {
    console.error('Error getting Shiprocket auth token:', error.response?.data || error.message);
    throw new Error(`Failed to authenticate with Shiprocket: ${error.response?.data?.message || error.message}`);
  }
};

// Calculate shipping rates
const calculateShippingRates = async (deliveryPincode, weight, length, width, height) => {
  try {
    const token = await getAuthToken();
    
    console.log('Calculating shipping rates for:', {
      deliveryPincode,
      weight,
      dimensions: { length, width, height }
    });

    // Correct Shiprocket API endpoint and payload format
    const payload = {
      pickup_postcode: PICKUP_ADDRESS.pin_code,
      delivery_postcode: deliveryPincode,
      cod: 0, // COD disabled - prepaid only
      weight: weight,
      length: length,
      breadth: width, // Shiprocket expects 'breadth' instead of 'width'
      height: height
    };

    console.log('Shiprocket payload:', payload);
    
    // Build query parameters for GET request
    const queryParams = new URLSearchParams({
      pickup_postcode: payload.pickup_postcode,
      delivery_postcode: payload.delivery_postcode,
      cod: payload.cod,
      weight: payload.weight,
      length: payload.length,
      breadth: payload.breadth,
      height: payload.height
    });
    
    const apiUrl = `${SHIPROCKET_CONFIG.baseUrl}/courier/serviceability?${queryParams}`;
    console.log('Shiprocket API URL:', apiUrl);

    const response = await axios.get(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Shiprocket response status:', response.status);
    console.log('Shiprocket response data:', response.data);

    if (response.data && response.data.data && response.data.data.available_courier_companies) {
      const couriers = response.data.data.available_courier_companies;
      
      // Format the response for our frontend
      const formattedRates = couriers.map(courier => ({
        courierId: courier.courier_company_id,
        courierName: courier.courier_name,
        rate: parseFloat(courier.rate),
        estimatedDeliveryTime: courier.estimated_delivery_days ? 
          `${courier.estimated_delivery_days} days` : '3-7 days',
        serviceType: courier.service_type || 'Standard',
        codAvailable: courier.cod_available || false
      }));

      console.log('Shipping rates calculated:', formattedRates);
      return {
        success: true,
        rates: formattedRates,
        pickupAddress: PICKUP_ADDRESS
      };
    } else {
      throw new Error('No courier companies available for this pincode');
    }
  } catch (error) {
    console.error('Error calculating shipping rates:', error.response?.data || error.message);
    
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

// Create shipment order
const createShipmentOrder = async (orderData) => {
  try {
    const token = await getAuthToken();
    
    console.log('Creating Shiprocket order for:', orderData.orderId);
    console.log('Order data received:', {
      subtotal: orderData.subtotal,
      shipping: orderData.shipping,
      total: orderData.total,
      discount: orderData.discount
    });

    // Prepare order items
    const orderItems = orderData.items.map(item => ({
      name: item.title,
      sku: item.bookId,
      units: item.quantity,
      selling_price: item.price,
      discount: 0,
      tax: 0,
      hsn: 4901 // HSN code for books
    }));

    // Calculate total weight and dimensions
    const totalWeight = orderData.items.reduce((sum, item) => {
      return sum + (item.weight || 0.5) * item.quantity; // Default 0.5kg if weight not available
    }, 0);

    // For multiple items, we'll use the largest dimensions
    const maxLength = Math.max(...orderData.items.map(item => item.length || 20));
    const maxWidth = Math.max(...orderData.items.map(item => item.width || 15));
    const maxHeight = Math.max(...orderData.items.map(item => item.height || 2));

    // Calculate total if not provided
    const calculatedTotal = orderData.total || (orderData.subtotal + (orderData.shipping || 0) - (orderData.discount || 0));
    console.log('Calculated total:', calculatedTotal);

    const shipmentData = {
        order_id: orderData.orderId,
        order_date: new Date().toISOString().split('T')[0],
        pickup_location: PICKUP_ADDRESS.pickup_location,
        billing_customer_name: orderData.shippingAddress.firstName,
        billing_last_name: orderData.shippingAddress.lastName,
        billing_address: orderData.shippingAddress.address1,
        billing_address_2: orderData.shippingAddress.address2 || '',
        billing_city: orderData.shippingAddress.city,
        billing_pincode: orderData.shippingAddress.postalCode,
        billing_state: orderData.shippingAddress.state,
        billing_country: orderData.shippingAddress.country,
        billing_email: orderData.userEmail,
        billing_phone: orderData.shippingAddress.phone,
        shipping_is_billing: true,
        order_items: orderItems,
        payment_method: 'Prepaid',
        sub_total: orderData.subtotal,
        total_discount: orderData.discount || 0,
        total: calculatedTotal,
        length: Number(maxLength),
        breadth: Number(maxWidth),
        height: Number(maxHeight),
        weight: Number(totalWeight),
        // Additional required fields
        channel_id: '0', // Default channel
        company_name: 'DNA Publications'
      };
      

    console.log('Shiprocket order creation payload:', shipmentData);
    console.log('Shiprocket order creation URL:', `${SHIPROCKET_CONFIG.baseUrl}/orders/create/adhoc`);

    const response = await axios.post(`${SHIPROCKET_CONFIG.baseUrl}/orders/create/adhoc`, shipmentData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Shiprocket order creation response status:', response.status);
    console.log('Shiprocket order creation response data:', response.data);

    if (response.data && response.data.order_id) {
      console.log('Shiprocket order created successfully:', response.data.order_id);
      return {
        success: true,
        shiprocketOrderId: response.data.order_id,
        orderData: response.data
      };
    } else {
      console.error('Invalid response from Shiprocket order creation:', response.data);
      throw new Error(`Invalid response from Shiprocket order creation: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.error('Error creating Shiprocket order:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.errors || 
                        error.response?.data || 
                        error.message;
    
    throw new Error(`Failed to create Shiprocket order: ${JSON.stringify(errorMessage)}`);
  }
};

// Assign courier to order
const assignCourier = async (shiprocketOrderId, courierId) => {
  try {
    const token = await getAuthToken();
    
    console.log('Assigning courier to order:', shiprocketOrderId, 'courier:', courierId);

    const response = await axios.post(`${SHIPROCKET_CONFIG.baseUrl}/courier/assign/awb`, {
      shipment_id: shiprocketOrderId,
      courier_id: courierId
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Courier assignment response status:', response.status);
    console.log('Courier assignment response data:', response.data);

    if (response.data && response.data.awb_code) {
      console.log('Courier assigned successfully, AWB:', response.data.awb_code);
      return {
        success: true,
        awbCode: response.data.awb_code,
        courierName: response.data.courier_name,
        trackingUrl: response.data.tracking_url
      };
    } else {
      console.error('Invalid response from courier assignment:', response.data);
      throw new Error(`Invalid response from courier assignment: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.error('Error assigning courier:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.errors || 
                        error.response?.data || 
                        error.message;
    
    throw new Error(`Failed to assign courier: ${JSON.stringify(errorMessage)}`);
  }
};

// Generate pickup for shipment
const generatePickup = async (shipmentId) => {
  try {
    const token = await getAuthToken();
    
    console.log('Generating pickup for shipment:', shipmentId);

    const response = await axios.post(`${SHIPROCKET_CONFIG.baseUrl}/courier/generate/pickup`, {
      shipment_id: [shipmentId]
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Pickup generation response status:', response.status);
    console.log('Pickup generation response data:', response.data);

    if (response.data && response.data.status === 1) {
      console.log('Pickup generated successfully for shipment:', shipmentId);
      return {
        success: true,
        pickupData: response.data
      };
    } else {
      console.error('Invalid response from pickup generation:', response.data);
      throw new Error(`Invalid response from pickup generation: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.error('Error generating pickup:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.errors || 
                        error.response?.data || 
                        error.message;
    
    throw new Error(`Failed to generate pickup: ${JSON.stringify(errorMessage)}`);
  }
};

// Complete Shiprocket workflow: Create Order → Assign Courier → Generate Pickup
const processCompleteShiprocketOrder = async (orderData) => {
  try {
    console.log('Starting complete Shiprocket workflow for order:', orderData.orderId);
    
    // Step 1: Create Shiprocket order
    console.log('Step 1: Creating Shiprocket order...');
    const orderResult = await createShipmentOrder(orderData);
    
    if (!orderResult.success) {
      throw new Error('Failed to create Shiprocket order');
    }
    
    const { shiprocketOrderId, orderData: shiprocketOrderData } = orderResult;
    const shipmentId = shiprocketOrderData.shipment_id;
    
    console.log('✅ Step 1 Complete: Order created with ID:', shiprocketOrderId, 'Shipment ID:', shipmentId);
    
    // Step 2: Assign courier (if courierId is provided)
    let courierResult = null;
    if (orderData.courierId) {
      console.log('Step 2: Assigning courier...');
      courierResult = await assignCourier(shipmentId, orderData.courierId);
      
      if (!courierResult.success) {
        console.warn('⚠️ Step 2 Warning: Courier assignment failed, but continuing with pickup generation');
      } else {
        console.log('✅ Step 2 Complete: Courier assigned with AWB:', courierResult.awbCode);
      }
    } else {
      console.log('⚠️ Step 2 Skipped: No courier ID provided');
    }
    
    // Step 3: Generate pickup
    console.log('Step 3: Generating pickup...');
    const pickupResult = await generatePickup(shipmentId);
    
    if (!pickupResult.success) {
      console.warn('⚠️ Step 3 Warning: Pickup generation failed');
    } else {
      console.log('✅ Step 3 Complete: Pickup generated successfully');
    }
    
    // Return comprehensive result
    return {
      success: true,
      shiprocketOrderId: shiprocketOrderId,
      shipmentId: shipmentId,
      orderData: shiprocketOrderData,
      courierResult: courierResult,
      pickupResult: pickupResult,
      workflow: {
        orderCreated: true,
        courierAssigned: courierResult?.success || false,
        pickupGenerated: pickupResult?.success || false
      }
    };
    
  } catch (error) {
    console.error('Error in complete Shiprocket workflow:', error.message);
    throw new Error(`Complete Shiprocket workflow failed: ${error.message}`);
  }
};

// Get order tracking details
const getOrderTracking = async (shiprocketOrderId) => {
  try {
    const token = await getAuthToken();
    
    const response = await axios.get(`${SHIPROCKET_CONFIG.baseUrl}/orders/show/${shiprocketOrderId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data && response.data.data) {
      return {
        success: true,
        trackingData: response.data.data
      };
    } else {
      throw new Error('No tracking data found');
    }
  } catch (error) {
    console.error('Error getting order tracking:', error.response?.data || error.message);
    throw new Error(`Failed to get tracking data: ${error.response?.data?.message || error.message}`);
  }
};

// Cancel shipment
const cancelShipment = async (shiprocketOrderId) => {
  try {
    const token = await getAuthToken();
    
    const response = await axios.post(`${SHIPROCKET_CONFIG.baseUrl}/orders/cancel/shipment/${shiprocketOrderId}`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data && response.data.status) {
      return {
        success: true,
        message: 'Shipment cancelled successfully'
      };
    } else {
      throw new Error('Failed to cancel shipment');
    }
  } catch (error) {
    console.error('Error cancelling shipment:', error.response?.data || error.message);
    throw new Error(`Failed to cancel shipment: ${error.response?.data?.message || error.message}`);
  }
};

module.exports = {
  calculateShippingRates,
  createShipmentOrder,
  assignCourier,
  generatePickup,
  processCompleteShiprocketOrder,
  getOrderTracking,
  cancelShipment,
  PICKUP_ADDRESS
};
