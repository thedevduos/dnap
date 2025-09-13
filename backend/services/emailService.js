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
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        <div style="display: flex; align-items: center;">
          <div style="margin-right: 12px;">
            <img src="${item.imageUrl || '/placeholder-book.jpg'}" 
                 alt="${item.title}" 
                 style="width: 60px; height: 80px; object-fit: cover; border-radius: 4px;">
          </div>
          <div>
            <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">${item.title}</div>
            <div style="color: #6b7280; font-size: 14px;">by ${item.author}</div>
            <div style="color: #6b7280; font-size: 14px;">Qty: ${item.quantity}</div>
          </div>
        </div>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">
        ₹${(item.price * item.quantity).toFixed(2)}
      </td>
    </tr>
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
                background: linear-gradient(135deg, #10b981, #059669);
                color: white;
                padding: 16px 28px;
                border-radius: 10px;
                display: inline-block;
                font-size: 26px;
                font-weight: 700;
                margin-bottom: 20px;
                letter-spacing: -0.5px;
            }
            .order-number {
                background-color: #f0fdf4;
                border: 2px solid #10b981;
                border-radius: 8px;
                padding: 16px;
                text-align: center;
                margin: 20px 0;
            }
            .order-number h2 {
                color: #059669;
                margin: 0;
                font-size: 24px;
                font-weight: 700;
            }
            .items-table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }
            .items-table th {
                background-color: #f8fafc;
                padding: 12px;
                text-align: left;
                font-weight: 600;
                color: #374151;
                border-bottom: 2px solid #e5e7eb;
            }
            .total-section {
                background-color: #f8fafc;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
                border-left: 4px solid #10b981;
            }
            .total-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
                padding: 4px 0;
            }
            .total-row.final {
                border-top: 2px solid #e5e7eb;
                padding-top: 12px;
                margin-top: 12px;
                font-weight: 700;
                font-size: 18px;
                color: #059669;
            }
            .shipping-info {
                background-color: #f0fdf4;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
                border-left: 4px solid #10b981;
            }
            .shipping-info h3 {
                color: #059669;
                margin-top: 0;
                margin-bottom: 12px;
                font-size: 16px;
                font-weight: 600;
            }
            .footer {
                text-align: center;
                margin-top: 40px;
                padding-top: 30px;
                border-top: 1px solid #e5e7eb;
                color: #6b7280;
                font-size: 14px;
            }
            .next-steps {
                background-color: #fef3c7;
                border: 1px solid #f59e0b;
                border-radius: 8px;
                padding: 20px;
                margin: 25px 0;
            }
            .next-steps h4 {
                color: #92400e;
                margin-top: 0;
                margin-bottom: 15px;
                font-size: 16px;
                font-weight: 600;
            }
            .next-steps ul {
                margin: 0;
                padding-left: 20px;
                color: #92400e;
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
                <h1 style="color: #1f2937; margin: 0; font-size: 28px; font-weight: 700;">Order Confirmed!</h1>
            </div>
            
            <p style="font-size: 18px; color: #4b5563; margin-bottom: 30px; line-height: 1.7;">
                Hello <strong>${customerName}</strong>,<br><br>
                Thank you for your order! We're excited to get your books ready for you.
            </p>
            
            <div class="order-number">
                <h2>${orderNumber}</h2>
                <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">Your Order Number</p>
            </div>
            
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Items Ordered</th>
                        <th style="text-align: right;">Price</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsList}
                </tbody>
            </table>
            
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
                <p style="margin: 0; line-height: 1.6;">
                    ${shippingAddress.firstName} ${shippingAddress.lastName}<br>
                    ${shippingAddress.address1}<br>
                    ${shippingAddress.address2 ? shippingAddress.address2 + '<br>' : ''}
                    ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postalCode}<br>
                    ${shippingAddress.country}
                </p>
            </div>
            
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #374151; margin-top: 0; margin-bottom: 12px; font-size: 16px; font-weight: 600;">💳 Payment Information</h3>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span>Payment Method:</span>
                    <span style="font-weight: 600;">${paymentMethodDisplay}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>Transaction ID:</span>
                    <span style="font-family: monospace; font-size: 12px; color: #6b7280;">${transactionId}</span>
                </div>
            </div>
            
            ${trackingInfo && trackingInfo.awbCode ? `
            <div style="background-color: #f0fdf4; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #059669; margin-top: 0; margin-bottom: 15px; font-size: 18px; font-weight: 700;">🚚 Tracking Information</h3>
                <div style="background-color: #ffffff; border-radius: 6px; padding: 15px; margin-bottom: 15px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="font-weight: 600;">AWB Number:</span>
                        <span style="font-family: monospace; font-weight: 700; color: #059669; font-size: 16px;">${trackingInfo.awbCode}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="font-weight: 600;">Courier:</span>
                        <span style="font-weight: 600;">${trackingInfo.courierName}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="font-weight: 600;">Status:</span>
                        <span style="color: #059669; font-weight: 600;">✅ Shipped & Pickup Generated</span>
                    </div>
                </div>
                ${trackingInfo.trackingUrl ? `
                <div style="text-align: center;">
                    <a href="${trackingInfo.trackingUrl}" 
                       style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                        📦 Track Your Package
                    </a>
                </div>
                ` : ''}
                <p style="color: #059669; font-size: 14px; margin: 15px 0 0 0; text-align: center;">
                    Your order has been shipped and is on its way! Use the AWB number above to track your package.
                </p>
            </div>
            ` : ''}
            
            <div class="next-steps">
                <h4>📋 What's Next?</h4>
                <ul>
                    ${trackingInfo && trackingInfo.awbCode ? `
                    <li>✅ Your order has been shipped and pickup has been generated</li>
                    <li>📦 Track your package using the AWB number above</li>
                    <li>🚚 Your books will be delivered within 3-7 business days</li>
                    <li>📞 Contact us if you have any delivery concerns</li>
                    ` : `
                    <li>We'll process your order within 1-2 business days</li>
                    <li>You'll receive a shipping notification with tracking details</li>
                    <li>Your books will be delivered within 3-7 business days</li>
                    <li>You can track your order status in your account</li>
                    `}
                </ul>
            </div>
            
            <p style="color: #4b5563; line-height: 1.7;">
                If you have any questions about your order, please don't hesitate to contact our support team. 
                We're here to help!
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

module.exports = {
  sendWelcomeEmail,
  sendTestEmail,
  testSMTPConnection,
  sendOrderConfirmationEmail,
  transporter
}; 