const axios = require('axios');

// WhatsApp Cloud API Configuration
const WHATSAPP_CONFIG = {
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  apiVersion: 'v18.0',
  baseUrl: 'https://graph.facebook.com'
};

// Send WhatsApp message
const sendWhatsAppMessage = async (to, message, type = 'text') => {
  try {
    if (!WHATSAPP_CONFIG.accessToken || !WHATSAPP_CONFIG.phoneNumberId) {
      console.warn('WhatsApp credentials not configured');
      return { success: false, message: 'WhatsApp not configured' };
    }

    const url = `${WHATSAPP_CONFIG.baseUrl}/${WHATSAPP_CONFIG.apiVersion}/${WHATSAPP_CONFIG.phoneNumberId}/messages`;
    
    const payload = {
      messaging_product: 'whatsapp',
      to: to.replace(/\D/g, ''), // Remove non-digits
      type: type,
      text: {
        body: message
      }
    };

    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_CONFIG.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('WhatsApp message sent successfully:', response.data);
    
    return {
      success: true,
      messageId: response.data.messages[0].id,
      to: to
    };

  } catch (error) {
    console.error('Error sending WhatsApp message:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
};

// Send order confirmation via WhatsApp
const sendOrderConfirmation = async (orderData) => {
  try {
    const {
      customerPhone,
      customerName,
      orderNumber,
      items,
      total,
      shippingAddress
    } = orderData;

    const itemsList = items.map(item => 
      `• ${item.title} (Qty: ${item.quantity}) - ₹${item.price * item.quantity}`
    ).join('\n');

    const message = `🎉 *Order Confirmation - DNA Publications*

Hello ${customerName}!

Your order has been confirmed successfully.

📦 *Order Details:*
Order Number: ${orderNumber || 'N/A'}
Total Amount: ₹${total}

📚 *Items Ordered:*
${itemsList}

🚚 *Shipping Address:*
${shippingAddress.firstName} ${shippingAddress.lastName}
${shippingAddress.address1}
${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postalCode}

We'll notify you once your order is shipped. Thank you for choosing DNA Publications!

For any queries, contact us at support@dnapublications.com`;

    return await sendWhatsAppMessage(customerPhone, message);

  } catch (error) {
    console.error('Error sending order confirmation WhatsApp:', error);
    throw error;
  }
};

// Send cart abandonment reminder
const sendCartAbandonmentReminder = async (userData, cartItems) => {
  try {
    const {
      customerPhone,
      customerName
    } = userData;

    const itemsList = cartItems.slice(0, 3).map(item => 
      `• ${item.title} - ₹${item.price}`
    ).join('\n');

    const message = `📚 *Don't forget your books! - DNA Publications*

Hi ${customerName}!

You left some amazing books in your cart:

${itemsList}
${cartItems.length > 3 ? `... and ${cartItems.length - 3} more items` : ''}

Complete your purchase now and get these books delivered to your doorstep!

🎁 Use code COMEBACK10 for 10% off your order.

Shop now: ${process.env.FRONTEND_URL}/cart

Happy Reading! 📖`;

    return await sendWhatsAppMessage(customerPhone, message);

  } catch (error) {
    console.error('Error sending cart abandonment WhatsApp:', error);
    throw error;
  }
};

// Send shipping notification
const sendShippingNotification = async (orderData) => {
  try {
    const {
      customerPhone,
      customerName,
      orderNumber,
      trackingNumber,
      estimatedDelivery
    } = orderData;

    const message = `📦 *Your order is on the way! - DNA Publications*

Hello ${customerName}!

Great news! Your order ${orderNumber || 'N/A'} has been shipped.

🚚 *Tracking Details:*
Tracking Number: ${trackingNumber}
Estimated Delivery: ${estimatedDelivery}

You can track your package using the tracking number above.

Thank you for your patience and happy reading! 📚`;

    return await sendWhatsAppMessage(customerPhone, message);

  } catch (error) {
    console.error('Error sending shipping notification WhatsApp:', error);
    throw error;
  }
};

// Send delivery confirmation
const sendDeliveryConfirmation = async (orderData) => {
  try {
    const {
      customerPhone,
      customerName,
      orderNumber
    } = orderData;

    const message = `✅ *Order Delivered! - DNA Publications*

Hello ${customerName}!

Your order ${orderNumber || 'N/A'} has been successfully delivered!

We hope you enjoy your new books. 📚

📝 *Please take a moment to:*
• Rate your books on our website
• Share your reading experience
• Recommend us to fellow book lovers

Thank you for choosing DNA Publications!

For any issues, contact us at support@dnapublications.com`;

    return await sendWhatsAppMessage(customerPhone, message);

  } catch (error) {
    console.error('Error sending delivery confirmation WhatsApp:', error);
    throw error;
  }
};

module.exports = {
  sendWhatsAppMessage,
  sendOrderConfirmation,
  sendCartAbandonmentReminder,
  sendShippingNotification,
  sendDeliveryConfirmation
};