# DNA Publications - E-commerce Platform

A complete e-commerce platform for DNA Publications built with React, TypeScript, and Firebase.

## Features

### 🛒 **E-commerce Features**
- ✅ User registration and authentication
- ✅ Product catalog with advanced search and filtering
- ✅ Shopping cart and wishlist
- ✅ Secure checkout process
- ✅ PayU payment gateway integration
- ✅ Order management and tracking
- ✅ Customer reviews and ratings
- ✅ Coupon and discount system

### 👤 **User Features**
- ✅ User profiles with address management
- ✅ Order history and tracking
- ✅ Wishlist functionality
- ✅ Multiple shipping addresses
- ✅ Account preferences

### 🔧 **Admin Features**
- ✅ Comprehensive admin dashboard
- ✅ Product management (CRUD operations)
- ✅ Order management and status updates
- ✅ Customer management
- ✅ Shipping method configuration
- ✅ Coupon management
- ✅ Payment and transaction tracking
- ✅ Analytics and reporting
- ✅ Team and content management

### 📱 **Communication**
- ✅ Email notifications (order confirmations)
- ✅ WhatsApp messaging integration
- ✅ Abandoned cart recovery
- ✅ Newsletter subscriptions

## Quick Start

### Prerequisites

- Node.js >= 16.0.0
- npm or yarn
- Firebase project setup
- PayU merchant account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd dna-publications
```

2. Install dependencies:
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

3. Configure environment variables:
```bash
# Frontend
cd frontend
cp .env.example .env
# Edit .env with your Firebase and API configuration

# Backend
cd ../backend
cp .env.example .env
# Edit .env with your SMTP, PayU, and WhatsApp configuration
```

4. Start the development servers:
```bash
# Backend (Terminal 1)
cd backend
npm run dev

# Frontend (Terminal 2)
cd frontend
npm run dev
```

## Environment Configuration

### Frontend (.env)
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Backend API
VITE_BACKEND_API_URL=http://localhost:5000

# PayU Configuration
VITE_PAYU_KEY=d3dwST
```

### Backend (.env)
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# PayU Configuration
PAYU_KEY=d3dwST
PAYU_SALT=4UM3eyk11v0xLxyLvltTcUJvHBTuFrIw
PAYU_CLIENT_ID=736719394ca030a73a1a139235b4d816ce1229234d40f74ba03ac8f8bf88c1d0
PAYU_CLIENT_SECRET=a76c54f662d4c239dd58d3573d9e0b241ca8854046960310d2aefdac0f2e761e

# WhatsApp Cloud API
WHATSAPP_ACCESS_TOKEN=your-whatsapp-access-token
WHATSAPP_PHONE_NUMBER_ID=your-whatsapp-phone-number-id

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

## Project Structure

```
dna-publications/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts (Auth, Cart, User)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions and Firebase config
│   │   └── globals.css     # Global styles
│   ├── public/             # Static assets
│   └── package.json
├── backend/                 # Express.js backend API
│   ├── services/           # Business logic services
│   ├── routes/             # API route handlers
│   ├── package.json
│   └── server.js          # Main server file
└── README.md
```

## Key Pages and Features

### Public Pages
- `/` - Homepage with hero, featured books, testimonials
- `/shop` - Product catalog with search and filters
- `/book/:id` - Individual product pages with reviews
- `/cart` - Shopping cart management
- `/checkout` - Secure checkout process (requires login)
- `/auth/login` - User login
- `/auth/register` - User registration
- `/profile` - User profile and order history

### Admin Pages
- `/admin/dashboard` - Overview and analytics
- `/admin/books` - Product management
- `/admin/orders` - Order management
- `/admin/customers` - Customer management
- `/admin/shipping` - Shipping method configuration
- `/admin/coupons` - Discount code management
- `/admin/payments` - Transaction and refund management
- `/admin/analytics` - Sales reports and insights

## Payment Integration

The platform uses PayU payment gateway for secure transactions:

1. **Order Creation** - Order is created in Firebase
2. **Payment Request** - PayU payment form is generated
3. **Payment Processing** - User completes payment on PayU
4. **Verification** - Payment response is verified
5. **Order Update** - Order status is updated based on payment result

## WhatsApp Integration

Automated messaging for:
- Order confirmations
- Shipping notifications
- Delivery confirmations
- Cart abandonment reminders

## Database Schema

### Collections in Firebase Firestore:
- `books` - Product catalog
- `users` - Admin users
- `userProfiles` - Customer profiles
- `orders` - Customer orders
- `transactions` - Payment transactions
- `reviews` - Product reviews
- `coupons` - Discount codes
- `shippingMethods` - Delivery options
- `subscribers` - Newsletter subscriptions
- `messages` - Contact form submissions

## Deployment

### Frontend (Vercel/Netlify)
```bash
npm run build
# Deploy dist folder
```

### Backend (Heroku/Railway/Render)
```bash
# Set environment variables in deployment platform
# Deploy from backend folder
```

## Security Features

- ✅ Firebase Authentication
- ✅ Protected routes and API endpoints
- ✅ Input validation and sanitization
- ✅ CORS configuration
- ✅ Helmet.js security headers
- ✅ PayU hash verification
- ✅ Rate limiting support

## Support

For technical support or questions:
- Email: support@dnapublications.com
- Documentation: Check individual component files for detailed implementation

## License

ISC License - DNA Publications