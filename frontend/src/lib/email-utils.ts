// Email utility functions for sending welcome emails
// Frontend utility that calls the backend API

// Professional author welcome email template
const createAuthorWelcomeEmailTemplate = (userData: {
  name: string
  email: string
  mobile: string
  role: string
}) => {
  const loginLink = 'https://stage.dnap.in/auth/login'
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to DNA Publications - Author Dashboard</title>
        <style>
            body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #1f2937;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f9fafb;
            }
            .container {
                background-color: #ffffff;
                border-radius: 12px;
                padding: 40px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
                border: 1px solid #e5e7eb;
            }
            .header {
                text-align: center;
                margin-bottom: 40px;
                padding-bottom: 30px;
                border-bottom: 2px solid #f3f4f6;
            }
            .logo {
                background: linear-gradient(135deg, #1e40af, #3b82f6);
                color: white;
                padding: 16px 28px;
                border-radius: 10px;
                display: inline-block;
                font-size: 26px;
                font-weight: 700;
                margin-bottom: 20px;
                letter-spacing: -0.5px;
            }
            .welcome-text {
                font-size: 18px;
                color: #4b5563;
                margin-bottom: 30px;
                line-height: 1.7;
            }
            .login-details {
                background-color: #f8fafc;
                border-radius: 10px;
                padding: 24px;
                margin: 30px 0;
                border-left: 4px solid #3b82f6;
            }
            .login-details h3 {
                color: #1e40af;
                margin-top: 0;
                margin-bottom: 20px;
                font-size: 18px;
                font-weight: 600;
            }
            .detail-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 12px;
                padding: 10px 0;
                border-bottom: 1px solid #e2e8f0;
            }
            .detail-row:last-child {
                border-bottom: none;
            }
            .label {
                font-weight: 600;
                color: #374151;
            }
            .value {
                color: #6b7280;
                font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
                font-size: 14px;
            }
            .login-button {
                display: inline-block;
                background: linear-gradient(135deg, #1e40af, #3b82f6);
                color: white;
                padding: 14px 32px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                margin: 25px 0;
                text-align: center;
                transition: all 0.2s ease;
                font-size: 16px;
            }
            .login-button:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
            }
            .footer {
                text-align: center;
                margin-top: 40px;
                padding-top: 30px;
                border-top: 1px solid #e5e7eb;
                color: #6b7280;
                font-size: 14px;
            }
            .security-note {
                background-color: #fef3c7;
                border: 1px solid #f59e0b;
                border-radius: 8px;
                padding: 18px;
                margin: 25px 0;
                color: #92400e;
            }
            .security-note strong {
                color: #92400e;
            }
            .next-steps {
                background-color: #ecfdf5;
                border: 1px solid #10b981;
                border-radius: 8px;
                padding: 20px;
                margin: 25px 0;
            }
            .next-steps h4 {
                color: #065f46;
                margin-top: 0;
                margin-bottom: 15px;
                font-size: 16px;
                font-weight: 600;
            }
            .next-steps ul {
                margin: 0;
                padding-left: 20px;
                color: #047857;
            }
            .next-steps li {
                margin-bottom: 8px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">DNA Publications</div>
                <h1 style="color: #1f2937; margin: 0; font-size: 28px; font-weight: 700;">Welcome to the Author Dashboard!</h1>
            </div>
            
            <p class="welcome-text">
                Hello <strong>${userData.name}</strong>,<br><br>
                Congratulations! You have been successfully registered as an <strong>Author</strong> with DNA Publications. 
                We're excited to have you join our community of writers and help bring your stories to life.
            </p>
            
            <div class="login-details">
                <h3>🔐 Your Login Credentials</h3>
                <div class="detail-row">
                    <span class="label">Login URL:</span>
                    <span class="value">${loginLink}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Username:</span>
                    <span class="value">${userData.email}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Password:</span>
                    <span class="value">${userData.mobile}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Role:</span>
                    <span class="value">Author</span>
                </div>
            </div>
            
            <div style="text-align: center;">
                <a href="${loginLink}" class="login-button">
                    🚀 Access Author Dashboard
                </a>
            </div>
            
            <div class="next-steps">
                <h4>📋 What's Next?</h4>
                <ul>
                    <li>Login to your author dashboard using the credentials above</li>
                    <li>Complete your author profile and upload your book manuscript</li>
                    <li>Track your book's publishing progress</li>
                    <li>Access sales reports and royalty information</li>
                    <li>Connect with our editorial team for support</li>
                </ul>
            </div>
            
            <div class="security-note">
                <strong>🔒 Security Note:</strong><br>
                For security reasons, we recommend changing your password after your first login. 
                Your current password is your mobile number, which should be changed to a strong, unique password.
            </div>
            
            <p style="color: #4b5563; line-height: 1.7;">
                If you have any questions or need assistance with your author journey, please don't hesitate to contact our support team. 
                We're here to help you succeed in your publishing journey.
            </p>
            
            <div class="footer">
                <p>
                    <strong>DNA Publications</strong><br>
                    The Home of Ambitious Writers<br>
                    📧 support@dnapublications.com<br>
                    🌐 dnap.in
                </p>
                <p style="font-size: 12px; color: #9ca3af;">
                    This is an automated message. Please do not reply to this email.
                </p>
            </div>
        </div>
    </body>
    </html>
  `
}

// Email template for new user welcome (can be sent to backend)
const createWelcomeEmailTemplate = (userData: {
  name: string
  email: string
  mobile: string
  role: string
}) => {
  const loginLink = 'https://stage.dnap.in/auth/login'
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to DNA Publications Admin Panel</title>
        <style>
            body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #1f2937;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f9fafb;
            }
            .container {
                background-color: #ffffff;
                border-radius: 12px;
                padding: 40px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
                border: 1px solid #e5e7eb;
            }
            .header {
                text-align: center;
                margin-bottom: 40px;
                padding-bottom: 30px;
                border-bottom: 2px solid #f3f4f6;
            }
            .logo {
                background: linear-gradient(135deg, #dc2626, #ef4444);
                color: white;
                padding: 16px 28px;
                border-radius: 10px;
                display: inline-block;
                font-size: 26px;
                font-weight: 700;
                margin-bottom: 20px;
                letter-spacing: -0.5px;
            }
            .welcome-text {
                font-size: 18px;
                color: #4b5563;
                margin-bottom: 30px;
                line-height: 1.7;
            }
            .login-details {
                background-color: #f8fafc;
                border-radius: 10px;
                padding: 24px;
                margin: 30px 0;
                border-left: 4px solid #dc2626;
            }
            .login-details h3 {
                color: #dc2626;
                margin-top: 0;
                margin-bottom: 20px;
                font-size: 18px;
                font-weight: 600;
            }
            .detail-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 12px;
                padding: 10px 0;
                border-bottom: 1px solid #e2e8f0;
            }
            .detail-row:last-child {
                border-bottom: none;
            }
            .label {
                font-weight: 600;
                color: #374151;
            }
            .value {
                color: #6b7280;
                font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
                font-size: 14px;
            }
            .login-button {
                display: inline-block;
                background: linear-gradient(135deg, #dc2626, #ef4444);
                color: white;
                padding: 14px 32px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                margin: 25px 0;
                text-align: center;
                transition: all 0.2s ease;
                font-size: 16px;
            }
            .login-button:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
            }
            .footer {
                text-align: center;
                margin-top: 40px;
                padding-top: 30px;
                border-top: 1px solid #e5e7eb;
                color: #6b7280;
                font-size: 14px;
            }
            .security-note {
                background-color: #fef3c7;
                border: 1px solid #f59e0b;
                border-radius: 8px;
                padding: 18px;
                margin: 25px 0;
                color: #92400e;
            }
            .security-note strong {
                color: #92400e;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">DNA Publications</div>
                <h1 style="color: #1f2937; margin: 0; font-size: 28px; font-weight: 700;">Welcome to the Admin Panel!</h1>
            </div>
            
            <p class="welcome-text">
                Hello <strong>${userData.name}</strong>,<br><br>
                Welcome to DNA Publications! You have been successfully added as a <strong>${userData.role}</strong> to our admin panel. 
                You can now access the platform to manage books, users, testimonials, and more.
            </p>
            
            <div class="login-details">
                <h3>🔐 Your Login Credentials</h3>
                <div class="detail-row">
                    <span class="label">Login URL:</span>
                    <span class="value">${loginLink}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Username:</span>
                    <span class="value">${userData.email}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Password:</span>
                    <span class="value">${userData.mobile}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Role:</span>
                    <span class="value">${userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}</span>
                </div>
            </div>
            
            <div style="text-align: center;">
                <a href="${loginLink}" class="login-button">
                    🚀 Access Admin Panel
                </a>
            </div>
            
            <div class="security-note">
                <strong>🔒 Security Note:</strong><br>
                For security reasons, we recommend changing your password after your first login. 
                Your current password is your mobile number, which should be changed to a strong, unique password.
            </div>
            
            <p style="color: #4b5563; line-height: 1.7;">
                If you have any questions or need assistance, please don't hesitate to contact our support team. 
                We're here to help you make the most of our publishing platform.
            </p>
            
            <div class="footer">
                <p>
                    <strong>DNA Publications</strong><br>
                    The Home of Ambitious Writers<br>
                    📧 support@dnapublications.com<br>
                    🌐 dnap.in
                </p>
                <p style="font-size: 12px; color: #9ca3af;">
                    This is an automated message. Please do not reply to this email.
                </p>
            </div>
        </div>
    </body>
    </html>
  `
}

// Email template for regular customer welcome
const createCustomerWelcomeEmailTemplate = (userData: {
  name: string
  email: string
  mobile: string
}) => {
  const websiteLink = 'https://dnap.in'
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to DNA Publications</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8f9fa;
            }
            .container {
                background-color: #ffffff;
                border-radius: 10px;
                padding: 30px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #f0f0f0;
            }
            .logo {
                background: linear-gradient(135deg, #ff6b35, #f7931e);
                color: white;
                padding: 15px 25px;
                border-radius: 8px;
                display: inline-block;
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 15px;
            }
            .welcome-text {
                font-size: 18px;
                color: #666;
                margin-bottom: 25px;
            }
            .features {
                background-color: #f8f9fa;
                border-radius: 8px;
                padding: 20px;
                margin: 25px 0;
                border-left: 4px solid #ff6b35;
            }
            .features h3 {
                color: #ff6b35;
                margin-top: 0;
                margin-bottom: 15px;
            }
            .feature-item {
                margin-bottom: 10px;
                padding: 8px 0;
                border-bottom: 1px solid #e9ecef;
            }
            .feature-item:last-child {
                border-bottom: none;
            }
            .feature-icon {
                color: #ff6b35;
                margin-right: 10px;
            }
            .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #ff6b35, #f7931e);
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                margin: 20px 0;
                text-align: center;
                transition: transform 0.2s ease;
            }
            .cta-button:hover {
                transform: translateY(-2px);
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e9ecef;
                color: #6c757d;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">DNA Publications</div>
                <h1 style="color: #333; margin: 0;">Welcome to DNA Publications!</h1>
            </div>
            
            <p class="welcome-text">
                Hello <strong>${userData.name}</strong>!<br>
                Welcome to DNA Publications! Your account has been successfully created. 
                We're excited to have you join our community of book lovers and readers.
            </p>
            
            <div class="features">
                <h3>🎉 What You Can Do Now</h3>
                <div class="feature-item">
                    <span class="feature-icon">📚</span>
                    <strong>Browse Our Collection:</strong> Explore our wide range of books across various categories
                </div>
                <div class="feature-item">
                    <span class="feature-icon">❤️</span>
                    <strong>Create Wishlists:</strong> Save your favorite books for later purchase
                </div>
                <div class="feature-item">
                    <span class="feature-icon">📖</span>
                    <strong>Access E-books:</strong> Read digital versions of our publications
                </div>
                <div class="feature-item">
                    <span class="feature-icon">📧</span>
                    <strong>Stay Updated:</strong> Receive notifications about new releases and offers
                </div>
            </div>
            
            <div style="text-align: center;">
                <a href="${websiteLink}" class="cta-button">
                    🚀 Start Exploring
                </a>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
                Thank you for choosing DNA Publications. We're committed to bringing you the best reading experience 
                with quality books from ambitious writers. If you have any questions or need assistance, 
                please don't hesitate to contact our support team.
            </p>
            
            <div class="footer">
                <p>
                    <strong>DNA Publications</strong><br>
                    The Home of Ambitious Writers<br>
                    📧 support@dnapublications.com<br>
                    🌐 dnap.in
                </p>
                <p style="font-size: 12px; color: #999;">
                    This is an automated message. Please do not reply to this email.
                </p>
            </div>
        </div>
    </body>
    </html>
  `
}

// Backend API URL - change this to your deployed backend URL
const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL

// Function to send welcome email to new user via backend API
export const sendWelcomeEmail = async (userData: {
  name: string
  email: string
  mobile: string
  role: string
}) => {
  try {
    // Create email template based on role
    let emailTemplate;
    if (userData.role === 'author') {
      emailTemplate = createAuthorWelcomeEmailTemplate(userData);
    } else {
      emailTemplate = createWelcomeEmailTemplate(userData);
    }
    
    // Call backend API
    const response = await fetch(`${BACKEND_API_URL}/api/send-welcome-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: userData.name,
        email: userData.email,
        mobile: userData.mobile,
        role: userData.role,
        emailTemplate: emailTemplate
      }),
    })

    const result = await response.json()
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to send email')
    }

    console.log('Welcome email sent successfully:', result.messageId)
    return result
    
  } catch (error) {
    console.error('Error sending welcome email:', error)
    
    // Fallback: log email details if backend is not available
    console.log('=== FALLBACK: EMAIL DETAILS (Backend unavailable) ===')
    console.log('To:', userData.email)
    console.log('Subject:', userData.role === 'author' 
      ? `Welcome to DNA Publications Author Dashboard - ${userData.name}`
      : `Welcome to DNA Publications Admin Panel - ${userData.name}`)
    console.log('Login URL:', 'https://stage.dnap.in/auth/login')
    console.log('Username:', userData.email)
    console.log('Password:', userData.mobile)
    console.log('Role:', userData.role)
    console.log('================================================')
    
    throw new Error('Failed to send welcome email. Please check backend connection.')
  }
}

// Function to send welcome email to regular customers via backend API
export const sendCustomerWelcomeEmail = async (userData: {
  name: string
  email: string
  mobile: string
}) => {
  try {
    // Create customer email template
    const emailTemplate = createCustomerWelcomeEmailTemplate(userData)
    
    // Call backend API
    const response = await fetch(`${BACKEND_API_URL}/api/send-welcome-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: userData.name,
        email: userData.email,
        mobile: userData.mobile,
        role: 'customer',
        emailTemplate: emailTemplate
      }),
    })

    const result = await response.json()
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to send email')
    }

    console.log('Customer welcome email sent successfully:', result.messageId)
    return result
    
  } catch (error) {
    console.error('Error sending customer welcome email:', error)
    
    // Fallback: log email details if backend is not available
    console.log('=== FALLBACK: CUSTOMER EMAIL DETAILS (Backend unavailable) ===')
    console.log('To:', userData.email)
    console.log('Subject:', `Welcome to DNA Publications - ${userData.name}`)
    console.log('Website URL:', 'https://dnap.in')
    console.log('================================================')
    
    throw new Error('Failed to send customer welcome email. Please check backend connection.')
  }
}

// Test email function
export const testEmailConnection = async () => {
  try {
    const response = await fetch(`${BACKEND_API_URL}/health`)
    const result = await response.json()
    
    if (result.status === 'OK') {
      console.log('Backend email service is ready')
      return true
    } else {
      throw new Error('Backend health check failed')
    }
  } catch (error) {
    console.error('Email service test failed:', error)
    return false
  }
}

// Test email sending function
export const sendTestEmail = async (testEmail: string) => {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/test-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ testEmail }),
    })

    const result = await response.json()
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to send test email')
    }

    console.log('Test email sent successfully:', result.messageId)
    return result
    
  } catch (error) {
    console.error('Error sending test email:', error)
    throw new Error('Failed to send test email')
  }
}

// Send admin pickup notification email
export const sendAdminPickupNotification = async (orderData: any, pickupData: any, courierData: any) => {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/send-admin-pickup-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderData, pickupData, courierData }),
    })

    const result = await response.json()
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to send admin pickup notification email')
    }

    console.log('Admin pickup notification email sent successfully:', result.messageId)
    return result
    
  } catch (error) {
    console.error('Error sending admin pickup notification email:', error)
    throw new Error('Failed to send admin pickup notification email')
  }
} 