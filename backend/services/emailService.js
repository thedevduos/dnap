const nodemailer = require('nodemailer');

// Create transporter with SMTP configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Professional author welcome email template
const createAuthorWelcomeEmailTemplate = (userData) => {
  const loginLink = 'https://stage.dnap.in/auth/login';
  
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
  `;
};

// Default email template for welcome emails
const createWelcomeEmailTemplate = (userData) => {
  const loginLink = 'https://stage.dnap.in/auth/login';
  
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
  `;
};

// Send welcome email to new user
const sendWelcomeEmail = async (userData) => {
  try {
    // Use custom template if provided, otherwise use role-specific template
    let emailHtml;
    let subject;
    
    if (userData.emailTemplate) {
      emailHtml = userData.emailTemplate;
      subject = `Welcome to DNA Publications - ${userData.name}`;
    } else if (userData.role === 'author') {
      emailHtml = createAuthorWelcomeEmailTemplate(userData);
      subject = `Welcome to DNA Publications Author Dashboard - ${userData.name}`;
    } else if (userData.role === 'customer') {
      // Use customer template from frontend
      emailHtml = createWelcomeEmailTemplate(userData);
      subject = `Welcome to DNA Publications - ${userData.name}`;
    } else {
      emailHtml = createWelcomeEmailTemplate(userData);
      subject = `Welcome to DNA Publications Admin Panel - ${userData.name}`;
    }
    
    const mailOptions = {
      from: `"DNA Publications" <${process.env.SMTP_USER || 'dnapublicationscbe@gmail.com'}>`,
      to: userData.email,
      subject: subject,
      html: emailHtml,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent successfully:', info.messageId);
    
    return { 
      success: true, 
      messageId: info.messageId,
      to: userData.email,
      subject: mailOptions.subject
    };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw new Error(`Failed to send welcome email: ${error.message}`);
  }
};

// Send test email
const sendTestEmail = async (testEmail) => {
  try {
    const mailOptions = {
      from: `"DNA Publications" <${process.env.SMTP_USER || 'dnapublicationscbe@gmail.com'}>`,
      to: testEmail,
      subject: 'DNA Publications - Email Service Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #ff6b35;">DNA Publications Email Service Test</h2>
          <p>This is a test email to verify that the email service is working correctly.</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p><strong>SMTP Host:</strong> ${process.env.SMTP_HOST}</p>
          <p><strong>SMTP User:</strong> ${process.env.SMTP_USER}</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            If you received this email, the DNA Publications email service is working properly.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Test email sent successfully:', info.messageId);
    
    return { 
      success: true, 
      messageId: info.messageId,
      to: testEmail,
      subject: mailOptions.subject
    };
  } catch (error) {
    console.error('Error sending test email:', error);
    throw new Error(`Failed to send test email: ${error.message}`);
  }
};


// Test SMTP connection
const testSMTPConnection = async () => {
  try {
    await transporter.verify();
    console.log('SMTP connection verified successfully');
    return true;
  } catch (error) {
    console.error('SMTP connection failed:', error);
    return false;
  }
};

module.exports = {
  sendWelcomeEmail,
  sendTestEmail,
  testSMTPConnection,
  transporter
}; 