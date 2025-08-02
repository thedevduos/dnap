// Script to add Zoho Payments Account ID to existing credentials
// Run with: node scripts/add-payments-account-id.js

import 'dotenv/config';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

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

async function addPaymentsAccountId() {
  try {
    console.log('🔍 Fetching existing Zoho credentials...');
    
    // Get existing credentials
    const credDoc = await getDoc(doc(db, 'zohoapi', 'ZOHO_CRED'));
    if (!credDoc.exists()) {
      console.error('❌ No Zoho credentials found. Please run the seed script first.');
      process.exit(1);
    }
    
    const existingCreds = credDoc.data();
    console.log('✅ Found existing credentials');
    console.log('🔑 Client ID:', existingCreds.ZOHO_CLIENT_ID);
    console.log('🏢 Organization ID:', existingCreds.ZOHO_ORGANIZATION_ID);
    
    // Check if payments account ID already exists
    if (existingCreds.ZOHO_PAYMENTS_ACCOUNT_ID) {
      console.log('💳 Payments Account ID already exists:', existingCreds.ZOHO_PAYMENTS_ACCOUNT_ID);
      console.log('💡 To update it, set the ZOHO_PAYMENTS_ACCOUNT_ID environment variable and run this script again.');
      process.exit(0);
    }
    
    // Get payments account ID from environment
    const paymentsAccountId = process.env.ZOHO_PAYMENTS_ACCOUNT_ID;
    if (!paymentsAccountId) {
      console.error('❌ ZOHO_PAYMENTS_ACCOUNT_ID environment variable not set');
      console.error('\n📋 Please set the environment variable:');
      console.error('   ZOHO_PAYMENTS_ACCOUNT_ID=your_payments_account_id');
      console.error('\n💡 You can get this from your Zoho Pay dashboard');
      process.exit(1);
    }
    
    console.log('📤 Adding Payments Account ID to credentials...');
    
    // Update credentials with payments account ID
    const updatedCreds = {
      ...existingCreds,
      ZOHO_PAYMENTS_ACCOUNT_ID: paymentsAccountId,
      updatedAt: new Date().toISOString()
    };
    
    await setDoc(doc(db, 'zohoapi', 'ZOHO_CRED'), updatedCreds, { merge: true });
    
    console.log('✅ Payments Account ID added successfully!');
    console.log('💳 Account ID:', paymentsAccountId);
    console.log('📁 Updated in: zohoapi/ZOHO_CRED');
    console.log('\n🎉 Zoho Pay integration should now work properly!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding payments account ID:', error);
    process.exit(1);
  }
}

addPaymentsAccountId(); 