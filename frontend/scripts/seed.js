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
            .login-details {
                background-color: #f8f9fa;
                border-radius: 8px;
                padding: 20px;
                margin: 25px 0;
                border-left: 4px solid #ff6b35;
            }
            .detail-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                padding: 8px 0;
                border-bottom: 1px solid #e9ecef;
            }
            .label {
                font-weight: 600;
                color: #495057;
            }
            .value {
                color: #6c757d;
                font-family: 'Courier New', monospace;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">DNA Publications</div>
                <h1 style="color: #333; margin: 0;">Welcome to the Admin Panel!</h1>
            </div>
            
            <p style="font-size: 18px; color: #666; margin-bottom: 25px;">
                Hello <strong>${userData.name}</strong>,<br>
                Welcome to DNA Publications! You have been successfully added as a <strong>${userData.role}</strong> to our admin panel. 
                You can now access the platform to manage books, users, testimonials, and more.
            </p>
            
            <div class="login-details">
                <h3 style="color: #ff6b35; margin-top: 0; margin-bottom: 15px;">🔐 Your Login Credentials</h3>
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
                <a href="${loginLink}" style="display: inline-block; background: linear-gradient(135deg, #ff6b35, #f7931e); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0;">
                    🚀 Access Admin Panel
                </a>
            </div>
            
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0; color: #856404;">
                <strong>🔒 Security Note:</strong><br>
                For security reasons, we recommend changing your password after your first login. 
                Your current password is your mobile number, which should be changed to a strong, unique password.
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px;">
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
      throw new Error('A user with this email already exists');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password is too weak (mobile number should be at least 6 characters)');
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