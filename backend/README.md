# DNA Publications Backend

Complete e-commerce backend for DNA Publications platform with email service, payment processing, and WhatsApp integration.

## Features

- ✅ SMTP email sending with Nodemailer
- ✅ Welcome email templates
- ✅ RESTful API endpoints
- ✅ CORS enabled for frontend integration
- ✅ Security middleware (Helmet)
- ✅ Request logging (Morgan)
- ✅ Environment configuration
- ✅ Health check endpoint
- ✅ PayU payment gateway integration
- ✅ WhatsApp Cloud API messaging
- ✅ Order confirmation emails
- ✅ Cart abandonment recovery
- ✅ Transaction management
- ✅ Refund processing
- ✅ Keep-alive monitoring for deployment

## Quick Start

### Prerequisites

- Node.js >= 16.0.0
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
# Copy the config file
cp .env.example .env

# Edit the .env file with your SMTP settings
```

3. Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:5000`

## Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# PayU Payment Gateway
PAYU_KEY=d3dwST
PAYU_SALT=4UM3eyk11v0xLxyLvltTcUJvHBTuFrIw
PAYU_CLIENT_ID=736719394ca030a73a1a139235b4d816ce1229234d40f74ba03ac8f8bf88c1d0
PAYU_CLIENT_SECRET=a76c54f662d4c239dd58d3573d9e0b241ca8854046960310d2aefdac0f2e761e

# WhatsApp Cloud API
WHATSAPP_ACCESS_TOKEN=your-whatsapp-access-token
WHATSAPP_PHONE_NUMBER_ID=your-whatsapp-phone-number-id

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Security
JWT_SECRET=your-jwt-secret-key-here
```

## API Endpoints

### Health Check
```
GET /health
```

### Payment Endpoints
```
POST /api/payment/create-payment
POST /api/payment/verify-payment
POST /api/payment/process-refund
GET /api/payment/transaction-status/:txnid
```

### WhatsApp Endpoints
```
POST /api/whatsapp/send-order-confirmation
POST /api/whatsapp/send-cart-reminder
POST /api/whatsapp/send-shipping-notification
POST /api/whatsapp/send-delivery-confirmation
```

### Send Welcome Email
```
POST /api/send-welcome-email
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "mobile": "1234567890",
  "role": "admin",
  "emailTemplate": "<html>...</html>" // optional
}
```

### Create Payment Request
```
POST /api/payment/create-payment
Content-Type: application/json

{
  "orderId": "order_123",
  "amount": 1299,
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "9876543210",
  "productInfo": "DNA Publications Books"
}
```

### Send Test Email
```
POST /api/test-email
Content-Type: application/json

{
  "testEmail": "test@example.com"
}
```

## Deployment

### Heroku

1. Create a new Heroku app:
```bash
heroku create your-app-name
```

2. Set environment variables:
```bash
heroku config:set SMTP_HOST=smtp.gmail.com
heroku config:set SMTP_PORT=587
heroku config:set SMTP_SECURE=false
heroku config:set SMTP_USER=your-email@gmail.com
heroku config:set SMTP_PASS=your-app-password
heroku config:set CORS_ORIGIN=https://your-frontend-domain.com
```

3. Set PayU and WhatsApp variables:
```bash
heroku config:set PAYU_KEY=d3dwST
heroku config:set PAYU_SALT=4UM3eyk11v0xLxyLvltTcUJvHBTuFrIw
```

3. Deploy:
```bash
git push heroku main
```

### Railway

1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically

### Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

## Frontend Integration

### Payment Integration
```javascript
// Create payment request
const response = await fetch('/api/payment/create-payment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orderId, amount, customerName, customerEmail, customerPhone
  })
});
```

Update your frontend email utility to call the backend API:

```javascript
// src/lib/email-utils.ts
export const sendWelcomeEmail = async (userData) => {
  try {
    const response = await fetch('http://localhost:5000/api/send-welcome-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message);
    }

    return result;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
};
```

## Security Notes

- ✅ CORS configured for specific origins
- ✅ Helmet.js for security headers
- ✅ Input validation and sanitization
- ✅ Error handling without exposing sensitive data
- ✅ Environment variable protection
- ✅ PayU hash verification
- ✅ Transaction security
- ✅ Rate limiting support

## Troubleshooting

### PayU Integration Issues

1. **Hash Mismatch**: Ensure PAYU_SALT is correctly set
2. **Payment Failure**: Check PayU credentials and test mode
3. **Redirect Issues**: Verify FRONTEND_URL is correct

### WhatsApp Issues

1. **Message Not Sending**: Verify access token and phone number ID
2. **Invalid Number**: Ensure phone numbers are in international format
3. **Rate Limits**: WhatsApp has message rate limits

### SMTP Issues

1. **Gmail App Password**: Use an app password instead of your regular password
2. **2FA**: Enable 2-factor authentication on your Gmail account
3. **Less Secure Apps**: Allow less secure apps (not recommended)

### CORS Issues

Update the `CORS_ORIGIN` environment variable to match your frontend URL.

### Port Issues

Change the `PORT` environment variable if port 5000 is already in use.

## License

ISC 