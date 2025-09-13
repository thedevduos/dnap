// Shiprocket API integration utilities

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface ShippingRate {
  courierId: number;
  courierName: string;
  rate: number;
  estimatedDeliveryTime: string;
  serviceType: string;
  codAvailable: boolean;
}

export interface ShippingCalculationResponse {
  success: boolean;
  rates?: ShippingRate[];
  pickupAddress?: any;
  error?: string;
  fallbackRates?: ShippingRate[];
}

export interface ShiprocketOrderData {
  orderId: string;
  items: Array<{
    bookId: string;
    title: string;
    author: string;
    price: number;
    quantity: number;
    weight?: number;
    length?: number;
    width?: number;
    height?: number;
  }>;
  shippingAddress: {
    firstName: string;
    lastName: string;
    phone: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  userEmail: string;
  subtotal: number;
  paymentMethod: string;
}

export interface ShiprocketOrderResponse {
  success: boolean;
  shiprocketOrderId?: string;
  orderData?: any;
  error?: string;
}

export interface CourierAssignmentResponse {
  success: boolean;
  awbCode?: string;
  courierName?: string;
  trackingUrl?: string;
  error?: string;
}

// Calculate shipping rates using Shiprocket API
export const calculateShippingRates = async (
  deliveryPincode: string,
  weight: number,
  length: number,
  width: number,
  height: number
): Promise<ShippingCalculationResponse> => {
  try {
    console.log('Calculating shipping rates:', {
      deliveryPincode,
      weight,
      length,
      width,
      height
    });

    const response = await fetch(`${API_BASE_URL}/api/shiprocket/calculate-shipping`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deliveryPincode,
        weight,
        length,
        width,
        height
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Shipping rates response:', data);
    return data;

  } catch (error) {
    console.error('Error calculating shipping rates:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate shipping rates'
    };
  }
};

// Create Shiprocket order
export const createShiprocketOrder = async (
  orderData: ShiprocketOrderData
): Promise<ShiprocketOrderResponse> => {
  try {
    console.log('Creating Shiprocket order:', orderData.orderId);

    const response = await fetch(`${API_BASE_URL}/api/shiprocket/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Shiprocket order creation response:', data);
    return data;

  } catch (error) {
    console.error('Error creating Shiprocket order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create Shiprocket order'
    };
  }
};

// Assign courier to order
export const assignCourier = async (
  shiprocketOrderId: string,
  courierId: number
): Promise<CourierAssignmentResponse> => {
  try {
    console.log('Assigning courier:', shiprocketOrderId, courierId);

    const response = await fetch(`${API_BASE_URL}/api/shiprocket/assign-courier`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        shiprocketOrderId,
        courierId
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Courier assignment response:', data);
    return data;

  } catch (error) {
    console.error('Error assigning courier:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to assign courier'
    };
  }
};

// Get order tracking
export const getOrderTracking = async (orderId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/shiprocket/track-order/${orderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error getting order tracking:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get tracking information'
    };
  }
};

// Cancel shipment
export const cancelShipment = async (orderId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/shiprocket/cancel-shipment/${orderId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error cancelling shipment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel shipment'
    };
  }
};

// Get pickup address
export const getPickupAddress = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/shiprocket/pickup-address`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error getting pickup address:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get pickup address'
    };
  }
};

// Helper function to calculate total weight and dimensions for cart items
export const calculateCartShippingData = (items: any[]) => {
  let totalWeight = 0;
  let maxLength = 0;
  let maxWidth = 0;
  let maxHeight = 0;

  items.forEach(item => {
    const weight = item.weight || 0.5; // Default 0.5kg if weight not available
    const length = item.length || 20; // Default 20cm if not available
    const width = item.width || 15; // Default 15cm if not available
    const height = item.height || 2; // Default 2cm if not available

    totalWeight += weight * item.quantity;
    maxLength = Math.max(maxLength, length);
    maxWidth = Math.max(maxWidth, width);
    maxHeight = Math.max(maxHeight, height);
  });

  return {
    totalWeight,
    maxLength,
    maxWidth,
    maxHeight
  };
};

// Process complete Shiprocket workflow: Create Order → Assign Courier → Generate Pickup
export const processCompleteShiprocketOrder = async (orderData: any) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000'}/api/shiprocket/process-complete-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to process complete Shiprocket order');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error processing complete Shiprocket order:', error);
    throw error;
  }
};
