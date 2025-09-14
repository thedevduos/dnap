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

// Order confirmation email template
const createOrderConfirmationEmailTemplate = (orderData) => {
  const {
    orderNumber,
    customerName,
    items,
    subtotal,
    shipping,
    total,
    shippingAddress,
    transactionId,
    paymentMethod,
    trackingInfo
  } = orderData;

  const itemsList = items.map(item => `
    <div style="display: flex; align-items: center; padding: 20px; background: #ffffff; border-radius: 12px; margin-bottom: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border: 1px solid #f1f5f9;">
      <div style="margin-right: 16px; flex-shrink: 0;">
        <img src="${item.imageUrl || '/placeholder-book.jpg'}" 
             alt="${item.title}" 
             style="width: 80px; height: 100px; object-fit: cover; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
      </div>
      <div style="flex: 1;">
        <h4 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 700; color: #1e293b; line-height: 1.3;">${item.title}</h4>
        <p style="margin: 0 0 6px 0; color: #64748b; font-size: 14px; font-weight: 500;">by ${item.author}</p>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px;">
          <span style="background: #f1f5f9; color: #475569; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">Qty: ${item.quantity}</span>
          <span style="font-size: 18px; font-weight: 700; color: #059669;">₹${(item.price * item.quantity).toFixed(2)}</span>
        </div>
      </div>
    </div>
  `).join('');

  const paymentMethodDisplay = paymentMethod === 'razorpay' ? 'Razorpay' : 
                              paymentMethod === 'zoho' ? 'Zoho Pay' : 
                              paymentMethod || 'Online Payment';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation - DNA Publications</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
            
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #1e293b;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 20px;
                min-height: 100vh;
            }
            
            .email-container {
                max-width: 600px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 25px 50px rgba(0,0,0,0.15);
            }
            
            .header {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                padding: 40px 30px;
                text-align: center;
                position: relative;
                overflow: hidden;
            }
            
            .header::before {
                content: '';
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
                animation: shimmer 3s ease-in-out infinite;
            }
            
            @keyframes shimmer {
                0%, 100% { transform: translateX(-100%) translateY(-100%) rotate(30deg); }
                50% { transform: translateX(100%) translateY(100%) rotate(30deg); }
            }
            
            .logo {
                position: relative;
                z-index: 2;
                background: rgba(255,255,255,0.2);
                backdrop-filter: blur(10px);
                color: white;
                padding: 20px 35px;
                border-radius: 16px;
                display: inline-block;
                font-size: 28px;
                font-weight: 800;
                margin-bottom: 20px;
                letter-spacing: -0.5px;
                border: 1px solid rgba(255,255,255,0.3);
            }
            
            .header h1 {
                position: relative;
                z-index: 2;
                color: white;
                margin: 0;
                font-size: 32px;
                font-weight: 800;
                text-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .content {
                padding: 40px 30px;
            }
            
            .greeting {
                font-size: 20px;
                color: #475569;
                margin-bottom: 30px;
                line-height: 1.7;
                text-align: center;
            }
            
            .order-number-card {
                background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                border: 2px solid #10b981;
                border-radius: 16px;
                padding: 25px;
                text-align: center;
                margin: 30px 0;
                position: relative;
                overflow: hidden;
            }
            
            .order-number-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: linear-gradient(90deg, #10b981, #059669, #10b981);
                background-size: 200% 100%;
                animation: gradientShift 2s ease-in-out infinite;
            }
            
            @keyframes gradientShift {
                0%, 100% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
            }
            
            .order-number-card h2 {
                color: #059669;
                margin: 0;
                font-size: 28px;
                font-weight: 800;
                letter-spacing: -0.5px;
            }
            
            .order-number-card p {
                margin: 8px 0 0 0;
                color: #047857;
                font-size: 14px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .section-title {
                font-size: 20px;
                font-weight: 700;
                color: #1e293b;
                margin: 40px 0 20px 0;
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .section-title::before {
                content: '';
                width: 4px;
                height: 24px;
                background: linear-gradient(135deg, #10b981, #059669);
                border-radius: 2px;
            }
            
            .total-section {
                background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                border-radius: 16px;
                padding: 25px;
                margin: 30px 0;
                border: 1px solid #e2e8f0;
                position: relative;
            }
            
            .total-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
                padding: 8px 0;
                font-size: 16px;
            }
            
            .total-row.final {
                border-top: 2px solid #e2e8f0;
                padding-top: 16px;
                margin-top: 16px;
                font-weight: 800;
                font-size: 20px;
                color: #059669;
            }
            
            .shipping-info {
                background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                border-radius: 16px;
                padding: 25px;
                margin: 30px 0;
                border: 1px solid #bbf7d0;
            }
            
            .shipping-info h3 {
                color: #059669;
                margin: 0 0 16px 0;
                font-size: 18px;
                font-weight: 700;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .payment-info {
                background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                border-radius: 16px;
                padding: 25px;
                margin: 30px 0;
                border: 1px solid #e2e8f0;
            }
            
            .payment-info h3 {
                color: #374151;
                margin: 0 0 16px 0;
                font-size: 18px;
                font-weight: 700;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .tracking-info {
                background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                border: 2px solid #f59e0b;
                border-radius: 16px;
                padding: 25px;
                margin: 30px 0;
                text-align: center;
            }
            
            .tracking-info h3 {
                color: #92400e;
                margin: 0 0 16px 0;
                font-size: 20px;
                font-weight: 700;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }
            
            .tracking-message {
                background: #ffffff;
                border-radius: 12px;
                padding: 20px;
                margin: 16px 0;
                border: 1px solid #fbbf24;
            }
            
            .tracking-message p {
                color: #92400e;
                font-size: 16px;
                font-weight: 600;
                margin: 0;
                line-height: 1.6;
            }
            
            .next-steps {
                background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                border: 1px solid #f59e0b;
                border-radius: 16px;
                padding: 25px;
                margin: 30px 0;
            }
            
            .next-steps h4 {
                color: #92400e;
                margin: 0 0 20px 0;
                font-size: 18px;
                font-weight: 700;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .next-steps ul {
                margin: 0;
                padding-left: 0;
                list-style: none;
            }
            
            .next-steps li {
                margin-bottom: 12px;
                color: #92400e;
                font-weight: 500;
                padding-left: 24px;
                position: relative;
            }
            
            .next-steps li::before {
                content: '✓';
                position: absolute;
                left: 0;
                color: #059669;
                font-weight: 700;
                font-size: 16px;
            }
            
            .footer {
                background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                color: #cbd5e1;
                padding: 40px 30px;
                text-align: center;
            }
            
            .footer h3 {
                color: #ffffff;
                margin: 0 0 16px 0;
                font-size: 24px;
                font-weight: 800;
            }
            
            .footer p {
                margin: 8px 0;
                font-size: 16px;
                line-height: 1.6;
            }
            
            .footer .tagline {
                color: #10b981;
                font-weight: 600;
                font-size: 18px;
                margin-bottom: 20px;
            }
            
            .footer .contact-info {
                background: rgba(255,255,255,0.1);
                border-radius: 12px;
                padding: 20px;
                margin: 20px 0;
                backdrop-filter: blur(10px);
            }
            
            .footer .disclaimer {
                font-size: 12px;
                color: #94a3b8;
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #475569;
            }
            
            @media (max-width: 600px) {
                body { padding: 10px; }
                .content { padding: 30px 20px; }
                .header { padding: 30px 20px; }
                .footer { padding: 30px 20px; }
                .logo { font-size: 24px; padding: 16px 28px; }
                .header h1 { font-size: 28px; }
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <div class="logo">DNA Publications</div>
                <h1>Order Confirmed! 🎉</h1>
            </div>
            
            <div class="content">
                <div class="greeting">
                    Hello <strong>${customerName}</strong>,<br><br>
                    Thank you for choosing DNA Publications! We're thrilled to be part of your reading journey.
                </div>
                
                <div class="order-number-card">
                    <h2>${orderNumber}</h2>
                    <p>Your Order Number</p>
                </div>
                
                <h2 class="section-title">📚 Your Books</h2>
                ${itemsList}
                
                <div class="total-section">
                    <div class="total-row">
                        <span>Subtotal:</span>
                        <span>₹${(subtotal || 0).toFixed(2)}</span>
                    </div>
                    <div class="total-row">
                        <span>Shipping:</span>
                        <span>₹${(shipping || 0).toFixed(2)}</span>
                    </div>
                    <div class="total-row final">
                        <span>Total Paid:</span>
                        <span>₹${(total || 0).toFixed(2)}</span>
                    </div>
                </div>
                
                <div class="shipping-info">
                    <h3>🚚 Shipping Address</h3>
                    <p style="margin: 0; line-height: 1.8; font-size: 16px; color: #374151;">
                        <strong>${shippingAddress.firstName} ${shippingAddress.lastName}</strong><br>
                        ${shippingAddress.address1}<br>
                        ${shippingAddress.address2 ? shippingAddress.address2 + '<br>' : ''}
                        ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postalCode}<br>
                        ${shippingAddress.country}
                    </p>
                </div>
                
                <div class="payment-info">
                    <h3>💳 Payment Information</h3>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 16px;">
                        <span>Payment Method:</span>
                        <span style="font-weight: 700; color: #059669;">${paymentMethodDisplay}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 16px;">
                        <span>Transaction ID:</span>
                        <span style="font-family: monospace; font-size: 14px; color: #64748b; font-weight: 600;">${transactionId}</span>
                    </div>
                </div>
                
                ${trackingInfo && trackingInfo.awbCode ? `
                <div class="tracking-info">
                    <h3>📦 Your Order is Shipped!</h3>
                    <div class="tracking-message">
                        <p>
                            <strong>Great news!</strong> Your order has been successfully shipped and pickup has been scheduled. 
                            You will receive a separate email from Shiprocket with detailed tracking information and updates about your package delivery.
                        </p>
                    </div>
                    <div style="background: #ffffff; border-radius: 12px; padding: 20px; margin: 16px 0; border: 1px solid #fbbf24;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 16px;">
                            <span style="font-weight: 600; color: #92400e;">AWB Number:</span>
                            <span style="font-family: monospace; font-weight: 800; color: #059669; font-size: 18px;">${trackingInfo.awbCode}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 16px;">
                            <span style="font-weight: 600; color: #92400e;">Courier:</span>
                            <span style="font-weight: 700; color: #374151;">${trackingInfo.courierName}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 16px;">
                            <span style="font-weight: 600; color: #92400e;">Status:</span>
                            <span style="color: #059669; font-weight: 700;">✅ Shipped & Pickup Scheduled</span>
                        </div>
                    </div>
                </div>
                ` : ''}
                
                <div class="next-steps">
                    <h4>📋 What's Next?</h4>
                    <ul>
                        ${trackingInfo && trackingInfo.awbCode ? `
                        <li>Your order has been shipped and pickup has been scheduled</li>
                        <li>You'll receive tracking updates from Shiprocket via email</li>
                        <li>Your books will be delivered within 3-7 business days</li>
                        <li>Contact us if you have any delivery concerns</li>
                        ` : `
                        <li>We'll process your order within 1-2 business days</li>
                        <li>You'll receive a shipping notification with tracking details</li>
                        <li>Your books will be delivered within 3-7 business days</li>
                        <li>You can track your order status in your account</li>
                        `}
                    </ul>
                </div>
                
                <p style="color: #475569; line-height: 1.8; font-size: 16px; text-align: center; margin: 30px 0;">
                    If you have any questions about your order, please don't hesitate to contact our support team. 
                    We're here to help make your reading experience amazing! 📚✨
                </p>
            </div>
            
            <div class="footer">
                <h3>DNA Publications</h3>
                <p class="tagline">The Home of Ambitious Writers</p>
                <div class="contact-info">
                    <p>📧 support@dnapublications.com</p>
                    <p>🌐 dnap.in</p>
                </div>
                <p class="disclaimer">
                    This is an automated message. Please do not reply to this email.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Send order confirmation email
const sendOrderConfirmationEmail = async (orderData) => {
  try {
    const emailHtml = createOrderConfirmationEmailTemplate(orderData);
    const subject = `Order Confirmation - ${orderData.orderNumber} - DNA Publications`;

    const mailOptions = {
      from: `"DNA Publications" <${process.env.SMTP_USER || 'dnapublicationscbe@gmail.com'}>`,
      to: orderData.customerEmail,
      subject: subject,
      html: emailHtml,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Order confirmation email sent successfully:', info.messageId);
    
    return { 
      success: true, 
      messageId: info.messageId,
      to: orderData.customerEmail,
      subject: mailOptions.subject
    };
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    throw new Error(`Failed to send order confirmation email: ${error.message}`);
  }
};

// Admin pickup notification email template
const createAdminPickupNotificationTemplate = (orderData, pickupData, courierData) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Order Pickup Scheduled - DNA Publications</title>
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
                padding: 12px 24px;
                border-radius: 8px;
                font-weight: bold;
                font-size: 18px;
                display: inline-block;
                margin-bottom: 20px;
            }
            .title {
                font-size: 24px;
                font-weight: 700;
                color: #1f2937;
                margin: 0;
            }
            .subtitle {
                font-size: 16px;
                color: #6b7280;
                margin: 8px 0 0 0;
            }
            .section {
                margin-bottom: 30px;
                padding: 20px;
                background-color: #f8fafc;
                border-radius: 8px;
                border-left: 4px solid #3b82f6;
            }
            .section-title {
                font-size: 18px;
                font-weight: 600;
                color: #1e40af;
                margin: 0 0 15px 0;
                display: flex;
                align-items: center;
            }
            .section-title::before {
                content: "📦";
                margin-right: 8px;
            }
            .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin-bottom: 20px;
            }
            .info-item {
                background-color: white;
                padding: 15px;
                border-radius: 6px;
                border: 1px solid #e5e7eb;
            }
            .info-label {
                font-size: 12px;
                font-weight: 600;
                color: #6b7280;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 4px;
            }
            .info-value {
                font-size: 14px;
                font-weight: 500;
                color: #1f2937;
            }
            .highlight {
                background: linear-gradient(135deg, #fef3c7, #fde68a);
                border: 1px solid #f59e0b;
                color: #92400e;
                padding: 12px 16px;
                border-radius: 6px;
                font-weight: 600;
                margin: 10px 0;
            }
            .items-list {
                background-color: white;
                border-radius: 8px;
                overflow: hidden;
                border: 1px solid #e5e7eb;
            }
            .item {
                padding: 15px;
                border-bottom: 1px solid #f3f4f6;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .item:last-child {
                border-bottom: none;
            }
            .item-details {
                flex: 1;
            }
            .item-title {
                font-weight: 600;
                color: #1f2937;
                margin-bottom: 4px;
            }
            .item-meta {
                font-size: 12px;
                color: #6b7280;
            }
            .item-price {
                font-weight: 600;
                color: #059669;
            }
            .footer {
                text-align: center;
                margin-top: 40px;
                padding-top: 30px;
                border-top: 2px solid #f3f4f6;
                color: #6b7280;
                font-size: 14px;
            }
            .urgent {
                background: linear-gradient(135deg, #fef2f2, #fecaca);
                border: 1px solid #ef4444;
                color: #dc2626;
                padding: 15px;
                border-radius: 8px;
                font-weight: 600;
                margin: 20px 0;
                text-align: center;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">DNA PUBLICATIONS</div>
                <h1 class="title">New Order Pickup Scheduled</h1>
                <p class="subtitle">Order #${orderData.orderNumber || orderData.orderId || 'N/A'} - Pickup Details</p>
            </div>

            <div class="urgent">
                🚚 PICKUP SCHEDULED - Action Required
            </div>

            <div class="section">
                <h2 class="section-title">Pickup Information</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Pickup Date</div>
                        <div class="info-value">${pickupData?.response?.pickup_scheduled_date || (pickupData?.already_scheduled ? 'Already Scheduled' : 'Not specified')}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Courier</div>
                        <div class="info-value">${courierData?.response?.data?.courier_name || courierData?.courierName || 'Not assigned'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">AWB Number</div>
                        <div class="info-value">${courierData?.response?.data?.awb_code || courierData?.awbCode || 'Not generated'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Token Number</div>
                        <div class="info-value">${pickupData?.response?.pickup_token_number || 'Not generated'}</div>
                    </div>
                </div>
                <div class="highlight">
                    📋 Pickup Status: ${pickupData?.already_scheduled ? 'Already Scheduled' : (pickupData?.response?.data || pickupData?.data || 'Confirmed by courier')}
                </div>
            </div>

            <div class="section">
                <h2 class="section-title">Order Details</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Order Number</div>
                        <div class="info-value">${orderData.orderNumber || orderData.orderId || 'N/A'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Customer</div>
                        <div class="info-value">${orderData.shippingAddress.firstName} ${orderData.shippingAddress.lastName}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Email</div>
                        <div class="info-value">${orderData.userEmail}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Phone</div>
                        <div class="info-value">${orderData.shippingAddress.phone}</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2 class="section-title">Shipping Address</h2>
                <div class="info-item">
                    <div class="info-value">
                        ${orderData.shippingAddress.firstName} ${orderData.shippingAddress.lastName}<br>
                        ${orderData.shippingAddress.address1}<br>
                        ${orderData.shippingAddress.address2 ? orderData.shippingAddress.address2 + '<br>' : ''}
                        ${orderData.shippingAddress.city}, ${orderData.shippingAddress.state}<br>
                        ${orderData.shippingAddress.postalCode}, ${orderData.shippingAddress.country}
                    </div>
                </div>
            </div>

            <div class="section">
                <h2 class="section-title">Order Items</h2>
                <div class="items-list">
                    ${orderData.items.map(item => `
                        <div class="item">
                            <div class="item-details">
                                <div class="item-title">${item.title}</div>
                                <div class="item-meta">SKU: ${item.sku || 'N/A'} | Qty: ${item.quantity}</div>
                            </div>
                            <div class="item-price">₹${item.price}</div>
                        </div>
                    `).join('')}
                </div>
                <div style="padding: 15px; background-color: #f8fafc; border-top: 1px solid #e5e7eb;">
                    <div style="display: flex; justify-content: space-between; font-weight: 600;">
                        <span>Total Amount:</span>
                        <span style="color: #059669;">₹${orderData.total}</span>
                    </div>
                </div>
            </div>

            <div class="footer">
                <p>This is an automated notification from DNA Publications.</p>
                <p>Please ensure the pickup is ready as scheduled.</p>
                <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
                    DNA Publications | info@dnap.in
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Send admin pickup notification email
const sendAdminPickupNotification = async (orderData, pickupData, courierData) => {
  try {
    // Debug logging to see the actual data structure
    console.log('Admin email - orderData:', JSON.stringify(orderData, null, 2));
    console.log('Admin email - pickupData:', JSON.stringify(pickupData, null, 2));
    console.log('Admin email - courierData:', JSON.stringify(courierData, null, 2));
    
    const mailOptions = {
      from: `"DNA Publications" <${process.env.SMTP_USER}>`,
      to: 'info@dnap.in',
      subject: `🚚 Pickup Scheduled - Order #${orderData.orderNumber || orderData.orderId || 'N/A'} - ${orderData.shippingAddress.firstName} ${orderData.shippingAddress.lastName}`,
      html: createAdminPickupNotificationTemplate(orderData, pickupData, courierData)
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Admin pickup notification email sent successfully:', info.messageId);
    
    return {
      success: true, 
      messageId: info.messageId,
      to: 'info@dnap.in',
      subject: mailOptions.subject
    };
  } catch (error) {
    console.error('Error sending admin pickup notification email:', error);
    throw new Error(`Failed to send admin pickup notification email: ${error.message}`);
  }
};

module.exports = {
  sendWelcomeEmail,
  sendTestEmail,
  testSMTPConnection,
  sendOrderConfirmationEmail,
  sendAdminPickupNotification,
  transporter
}; 