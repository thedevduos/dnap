// Email utility functions for sending welcome emails
// Frontend utility that calls the backend API

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
            .login-details {
                background-color: #f8f9fa;
                border-radius: 8px;
                padding: 20px;
                margin: 25px 0;
                border-left: 4px solid #ff6b35;
            }
            .login-details h3 {
                color: #ff6b35;
                margin-top: 0;
                margin-bottom: 15px;
            }
            .detail-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                padding: 8px 0;
                border-bottom: 1px solid #e9ecef;
            }
            .detail-row:last-child {
                border-bottom: none;
            }
            .label {
                font-weight: 600;
                color: #495057;
            }
            .value {
                color: #6c757d;
                font-family: 'Courier New', monospace;
            }
            .login-button {
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
            .login-button:hover {
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
            .security-note {
                background-color: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 6px;
                padding: 15px;
                margin: 20px 0;
                color: #856404;
            }
            .security-note strong {
                color: #856404;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">DNA Publications</div>
                <h1 style="color: #333; margin: 0;">Welcome to the Admin Panel!</h1>
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
            
            <p style="color: #666; line-height: 1.6;">
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
    // Create email template
    const emailTemplate = createWelcomeEmailTemplate(userData)
    
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
    console.log('Subject:', `Welcome to DNA Publications Admin Panel - ${userData.name}`)
    console.log('Login URL:', 'https://stage.dnap.in/auth/login')
    console.log('Username:', userData.email)
    console.log('Password:', userData.mobile)
    console.log('Role:', userData.role)
    console.log('================================================')
    
    throw new Error('Failed to send welcome email. Please check backend connection.')
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