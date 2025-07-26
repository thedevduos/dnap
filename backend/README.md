# DNA Publications Backend

Email service backend for DNA Publications admin panel.

## Features

- ✅ SMTP email sending with Nodemailer
- ✅ Welcome email templates
- ✅ RESTful API endpoints
- ✅ CORS enabled for frontend integration
- ✅ Security middleware (Helmet)
- ✅ Request logging (Morgan)
- ✅ Environment configuration
- ✅ Health check endpoint

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
cp config.env.example .env

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

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Security
JWT_SECRET=your-jwt-secret-key-here
```

## API Endpoints

### Health Check
```
GET /health
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

## Troubleshooting

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