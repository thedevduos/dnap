// Seed script to create initial Software Admin user
// Requires a .env file with Firebase and backend API variables
// Run with: node scripts/seed.js

import 'dotenv/config';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Email template function
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

// Function to send welcome email via backend API
const sendWelcomeEmail = async (userData) => {
  try {
    const emailTemplate = createWelcomeEmailTemplate(userData);
    const backendUrl = process.env.VITE_BACKEND_API_URL;
    
    if (!backendUrl) {
      console.log('=== FALLBACK: EMAIL DETAILS (Backend URL not configured) ===');
      console.log('To:', userData.email);
      console.log('Subject:', `Welcome to DNA Publications Admin Panel - ${userData.name}`);
      console.log('Login URL:', 'https://stage.dnap.in/auth/login');
      console.log('Username:', userData.email);
      console.log('Password:', userData.mobile);
      console.log('Role:', userData.role);
      console.log('================================================');
      return;
    }
    
    const response = await fetch(`${backendUrl}/api/send-welcome-email`, {
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
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to send email');
    }

    console.log('Welcome email sent successfully:', result.messageId);
    return result;
    
  } catch (error) {
    console.error('Error sending welcome email:', error);
    console.log('=== FALLBACK: EMAIL DETAILS (Backend unavailable) ===');
    console.log('To:', userData.email);
    console.log('Subject:', `Welcome to DNA Publications Admin Panel - ${userData.name}`);
    console.log('Login URL:', 'https://stage.dnap.in/auth/login');
    console.log('Username:', userData.email);
    console.log('Password:', userData.mobile);
    console.log('Role:', userData.role);
    console.log('================================================');
  }
};

// Function to add user
const addUser = async (userData) => {
  try {
    // First, create user in Firebase Authentication
    const authUser = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      userData.mobile // Using mobile number as password
    );

    // Then, add user to Firestore with the auth UID
    const firestoreUser = await addDoc(collection(db, "users"), {
      ...userData,
      uid: authUser.user.uid, // Link to Firebase Auth user
      createdAt: serverTimestamp(),
    });

    // Send welcome email
    try {
      await sendWelcomeEmail(userData);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't throw error here as user was created successfully
    }

    return firestoreUser;
  } catch (error) {
    console.error('Error creating user:', error);
    
    // Handle specific Firebase Auth errors
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('This email address is already registered. Please use a different email or try logging in.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password is too weak (mobile number should be at least 6 characters)');
    } else if (error.code === 'auth/operation-not-allowed') {
      throw new Error('Email/password accounts are not enabled. Please contact support.');
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your internet connection and try again.');
    } else {
      throw new Error('Failed to create user. Please try again.');
    }
  }
};

async function main() {
  try {
    const userData = {
      name: 'Software Admin',
      email: 'dnapublicationscbe@gmail.com',
      mobile: '7598691689', // Used as password
      role: 'admin',
    };
    console.log('Seeding admin user...');
    await addUser(userData);
    console.log('Admin user created and welcome email sent!');
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

main(); 