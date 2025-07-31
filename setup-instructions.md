# DNA Publications E-commerce Setup Instructions

## 🚀 Complete Setup Guide

### 1. Environment Configuration

#### Backend Environment Variables (.env)
```bash
cd backend
cp .env.example .env
```

**Required Configuration:**
1. **SMTP Settings** - Update with your Gmail app password:
   ```
   SMTP_USER=dnapublicationscbe@gmail.com
   SMTP_PASS=your-actual-gmail-app-password
   ```

2. **PayU Credentials** - Already configured:
   ```
   PAYU_KEY=d3dwST
   PAYU_SALT=4UM3eyk11v0xLxyLvltTcUJvHBTuFrIw
   ```

3. **WhatsApp Cloud API** - Update with your credentials:
   ```
   WHATSAPP_ACCESS_TOKEN=your-whatsapp-access-token
   WHATSAPP_PHONE_NUMBER_ID=your-whatsapp-phone-number-id
   ```

#### Frontend Environment Variables (.env)
```bash
cd frontend
cp .env.example .env
```

**Required Configuration:**
1. **Firebase Settings** - Update with your Firebase project:
   ```
   VITE_FIREBASE_API_KEY=your-firebase-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

### 2. Firebase Setup

1. **Create Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create new project: "dna-publications"
   - Enable Authentication, Firestore, and Storage

2. **Configure Authentication**:
   - Enable Email/Password authentication
   - Enable Google authentication
   - Add authorized domains

3. **Setup Firestore Database**:
   - Create database in production mode
   - Configure security rules for collections

4. **Configure Storage**:
   - Enable Firebase Storage
   - Set up security rules for file uploads

### 3. PayU Payment Gateway Setup

**Credentials Already Configured:**
- Key: `d3dwST`
- Salt: `4UM3eyk11v0xLxyLvltTcUJvHBTuFrIw`
- Client ID: `736719394ca030a73a1a139235b4d816ce1229234d40f74ba03ac8f8bf88c1d0`

**Test Mode URLs:**
- Payment: `https://sandboxsecure.payu.in/_payment`
- For production, update to: `https://secure.payu.in/_payment`

### 4. WhatsApp Cloud API Setup

1. **Create Meta Developer Account**:
   - Go to [Meta for Developers](https://developers.facebook.com/)
   - Create new app for WhatsApp Business

2. **Get Credentials**:
   - Access Token
   - Phone Number ID
   - Verify Token

3. **Update Environment Variables**:
   ```
   WHATSAPP_ACCESS_TOKEN=your-actual-token
   WHATSAPP_PHONE_NUMBER_ID=your-actual-phone-id
   ```

### 5. Gmail SMTP Setup

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. **Update Backend .env**:
   ```
   SMTP_PASS=your-generated-app-password
   ```

### 6. Development Setup

```bash
# Install dependencies
cd frontend && npm install
cd ../backend && npm install

# Start development servers
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend  
cd frontend && npm run dev
```

### 7. Production Deployment

#### Backend (Render/Heroku)
1. **Environment Variables**:
   - Set all backend .env variables
   - Update FRONTEND_URL to production domain
   - Update CORS_ORIGIN to production domain

#### Frontend (Vercel/Netlify)
1. **Environment Variables**:
   - Set all frontend .env variables
   - Update VITE_BACKEND_API_URL to production backend URL

### 8. Testing the Integration

#### Test Payment Flow:
1. Add books to cart
2. Proceed to checkout (requires login)
3. Fill shipping details
4. Complete PayU payment
5. Verify order creation and email notifications

#### Test Admin Features:
1. Login to `/admin/login`
2. Manage products, orders, customers
3. Configure shipping methods and coupons
4. View analytics and reports

### 9. Security Checklist

- ✅ Firebase security rules configured
- ✅ CORS properly set for production domains
- ✅ Environment variables secured
- ✅ PayU hash verification enabled
- ✅ Rate limiting configured
- ✅ Input validation implemented

### 10. Monitoring & Maintenance

1. **Health Check**: `GET /health`
2. **Activity Status**: `GET /api/activity-status`
3. **Keep-Alive**: Automatic for Render deployments
4. **Error Logging**: Check server logs for issues

## 🔧 Troubleshooting

### Common Issues:

1. **Payment Failures**:
   - Check PayU credentials
   - Verify hash generation
   - Check network connectivity

2. **Email Not Sending**:
   - Verify Gmail app password
   - Check SMTP settings
   - Test with `/api/test-email`

3. **WhatsApp Messages Not Sending**:
   - Verify access token
   - Check phone number format
   - Ensure WhatsApp Business API is active

4. **Firebase Connection Issues**:
   - Check Firebase configuration
   - Verify project permissions
   - Check security rules

## 📞 Support

For technical support:
- Email: support@dnapublications.com
- Check logs for detailed error messages
- Refer to individual service documentation