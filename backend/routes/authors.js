const express = require('express');
const router = express.Router();

// Get author sales report
router.get('/sales-report/:authorId', async (req, res) => {
  try {
    const { authorId } = req.params;
    const { bookId, year, month } = req.query;

    // This would integrate with your sales tracking system
    // For now, returning mock data
    const salesData = {
      totalSales: 0,
      totalRevenue: 0,
      affiliateSales: 0,
      affiliateRevenue: 0,
      monthlyData: []
    };

    res.status(200).json({
      success: true,
      data: salesData
    });

  } catch (error) {
    console.error('Author sales report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sales report',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Send author notification email
router.post('/send-notification', async (req, res) => {
  try {
    const { authorEmail, stage, bookTitle, additionalData } = req.body;

    // Validate required fields
    if (!authorEmail || !stage || !bookTitle) {
      return res.status(400).json({
        success: false,
        message: 'Author email, stage, and book title are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(authorEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid author email format'
      });
    }

    // Import email service
    const emailService = require('../services/emailService');

    let subject = '';
    let emailHtml = '';

    switch (stage) {
      case 'review':
        subject = `Book Submission Received - ${bookTitle}`;
        emailHtml = createAuthorNotificationEmail(
          'Book Under Review',
          `Your book "${bookTitle}" has been submitted successfully and is now under review by our editorial team.`,
          'We will notify you once the review is complete (typically 3-5 business days).'
        );
        break;
      case 'payment':
        subject = `Payment Required - ${bookTitle}`;
        emailHtml = createAuthorNotificationEmail(
          'Payment Required',
          `Congratulations! Your book "${bookTitle}" has been approved for publication.`,
          `Please complete the payment of ₹${additionalData?.amount} to proceed with the publication process.`
        );
        break;
      case 'payment_verification':
        subject = `Payment Under Verification - ${bookTitle}`;
        emailHtml = createAuthorNotificationEmail(
          'Payment Under Verification',
          `We have received your payment screenshot for "${bookTitle}".`,
          'Our team is verifying the payment. You will be notified once verification is complete.'
        );
        break;
      case 'editing':
        subject = `Editing Started - ${bookTitle}`;
        emailHtml = createAuthorNotificationEmail(
          'Editing in Progress',
          `Great news! Your book "${bookTitle}" is now in the editing and proofreading stage.`,
          'Our editorial team will work on polishing your manuscript. This process typically takes 2-3 weeks.'
        );
        break;
      case 'completed':
        subject = `Book Published - ${bookTitle}`;
        emailHtml = createAuthorNotificationEmail(
          'Book Published Successfully',
          `Congratulations! Your book "${bookTitle}" has been successfully published.`,
          'Your book is now available for sale on our platform. You can now access your author dashboard to track sales and create affiliate links.'
        );
        break;
      case 'rejected':
        subject = `Book Submission Update - ${bookTitle}`;
        emailHtml = createAuthorNotificationEmail(
          'Book Submission Update',
          `We regret to inform you that your book "${bookTitle}" could not be accepted for publication at this time.`,
          'Thank you for your interest in DNA Publications. We encourage you to continue writing and consider submitting future works.'
        );
        break;
      case 'access_revoked':
        subject = `Author Access Revoked - ${bookTitle}`;
        emailHtml = createAuthorNotificationEmail(
          'Author Access Revoked',
          `We regret to inform you that your author dashboard access has been revoked due to the rejection of your book "${bookTitle}".`,
          'Your account has been converted to a regular customer account. You can still browse and purchase books from our platform. If you have any questions, please contact our support team.'
        );
        break;
      default:
        throw new Error('Invalid notification stage');
    }

    const mailOptions = {
      from: `"DNA Publications" <${process.env.SMTP_USER || 'dnapublicationscbe@gmail.com'}>`,
      to: authorEmail,
      subject: subject,
      html: emailHtml,
    };

    const info = await emailService.transporter.sendMail(mailOptions);
    
    res.status(200).json({
      success: true,
      message: 'Author notification sent successfully',
      messageId: info.messageId
    });

  } catch (error) {
    console.error('Author notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send author notification',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Send thank you email to author when book is completed
router.post('/send-thank-you-email', async (req, res) => {
  try {
    const { authorEmail, authorName, bookTitle } = req.body;

    // Validate required fields
    if (!authorEmail || !authorName || !bookTitle) {
      return res.status(400).json({
        success: false,
        message: 'Author email, name, and book title are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(authorEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid author email format'
      });
    }

    // Import email service
    const emailService = require('../services/emailService');

    const subject = `Thank You - Your Book "${bookTitle}" is Now Published!`;
    const emailHtml = createThankYouEmailTemplate(authorName, bookTitle);

    const mailOptions = {
      from: `"DNA Publications" <${process.env.SMTP_USER || 'dnapublicationscbe@gmail.com'}>`,
      to: authorEmail,
      subject: subject,
      html: emailHtml,
    };

    const info = await emailService.transporter.sendMail(mailOptions);
    
    res.status(200).json({
      success: true,
      message: 'Thank you email sent successfully',
      messageId: info.messageId
    });

  } catch (error) {
    console.error('Thank you email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send thank you email',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Create author notification email template
const createAuthorNotificationEmail = (title, message, additionalInfo) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} - DNA Publications</title>
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
            .content {
                margin: 25px 0;
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
                <h1 style="color: #333; margin: 0;">${title}</h1>
            </div>
            
            <div class="content">
                <p style="font-size: 18px; color: #666; margin-bottom: 25px;">
                    ${message}
                </p>
                
                <p style="color: #666; line-height: 1.6;">
                    ${additionalInfo}
                </p>
            </div>
            
            <div class="footer">
                <p>
                    <strong>DNA Publications</strong><br>
                    The Home of Ambitious Writers<br>
                    📧 support@dnapublications.com<br>
                    🌐 dnap.in
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Create thank you email template
const createThankYouEmailTemplate = (authorName, bookTitle) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thank You - Book Published Successfully</title>
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
                background: linear-gradient(135deg, #28a745, #20c997);
                color: white;
                padding: 15px 25px;
                border-radius: 8px;
                display: inline-block;
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 15px;
            }
            .content {
                margin: 25px 0;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e9ecef;
                color: #6c757d;
                font-size: 14px;
            }
            .success-box {
                background-color: #d4edda;
                border: 1px solid #c3e6cb;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
                color: #155724;
            }
            .next-steps {
                background-color: #e7f3ff;
                border: 1px solid #b3d9ff;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">DNA Publications</div>
                <h1 style="color: #333; margin: 0;">🎉 Congratulations!</h1>
            </div>
            
            <div class="content">
                <p style="font-size: 18px; color: #666; margin-bottom: 25px;">
                    Dear <strong>${authorName}</strong>,
                </p>
                
                <div class="success-box">
                    <h2 style="margin-top: 0; color: #155724;">Your Book is Now Published!</h2>
                    <p style="font-size: 16px; margin-bottom: 0;">
                        We are thrilled to inform you that your book <strong>"${bookTitle}"</strong> has been successfully published and is now available for sale on our platform!
                    </p>
                </div>
                
                <p style="color: #666; line-height: 1.6;">
                    This is a significant milestone in your writing journey, and we're honored to be part of it. Your book is now accessible to readers worldwide through our platform.
                </p>
                
                <div class="next-steps">
                    <h3 style="color: #0056b3; margin-top: 0;">What's Next?</h3>
                    <ul style="color: #0056b3; padding-left: 20px;">
                        <li>Access your author dashboard to track sales and performance</li>
                        <li>Create affiliate links to promote your book</li>
                        <li>Monitor reader reviews and feedback</li>
                        <li>Consider publishing additional books with us</li>
                        <li>Connect with our community of authors</li>
                    </ul>
                </div>
                
                <p style="color: #666; line-height: 1.6;">
                    We wish you great success with your book and look forward to supporting you in your future publishing endeavors. Thank you for choosing DNA Publications as your publishing partner.
                </p>
            </div>
            
            <div class="footer">
                <p>
                    <strong>DNA Publications</strong><br>
                    The Home of Ambitious Writers<br>
                    📧 support@dnapublications.com<br>
                    🌐 dnap.in
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
};

module.exports = router;