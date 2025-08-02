// Seed script to add Zoho credentials to Firebase Firestore
// Run with: node scripts/seed-zoho-credentials.js

import 'dotenv/config';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

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

// Zoho credentials from environment variables
const zohoCredentials = {
  ZOHO_CLIENT_ID: process.env.ZOHO_CLIENT_ID,
  ZOHO_CLIENT_SECRET: process.env.ZOHO_CLIENT_SECRET,
  ZOHO_ACCESS_TOKEN: process.env.ZOHO_ACCESS_TOKEN,
  ZOHO_REFRESH_TOKEN: process.env.ZOHO_REFRESH_TOKEN,
  ZOHO_ORGANIZATION_ID: process.env.ZOHO_ORGANIZATION_ID,
  ZOHO_PAYMENTS_ACCOUNT_ID: process.env.ZOHO_PAYMENTS_ACCOUNT_ID,
  token_expires_at: Date.now() + (3200 * 1000), // 1 hour from now
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

async function seedZohoCredentials() {
  try {
    console.log('🔍 Validating Zoho credentials...');
    
    // Check if all required credentials are provided
    const requiredFields = ['ZOHO_CLIENT_ID', 'ZOHO_CLIENT_SECRET', 'ZOHO_REFRESH_TOKEN', 'ZOHO_ORGANIZATION_ID'];
    const missingFields = requiredFields.filter(field => !zohoCredentials[field]);
    
    // Check for optional but recommended fields
    const optionalFields = ['ZOHO_PAYMENTS_ACCOUNT_ID'];
    const missingOptionalFields = optionalFields.filter(field => !zohoCredentials[field]);
    
    if (missingFields.length > 0) {
      console.error('❌ Missing required Zoho credentials:');
      missingFields.forEach(field => console.error(`   - ${field}`));
      console.error('\n📋 Please set the following environment variables:');
      console.error('   ZOHO_CLIENT_ID=your_client_id');
      console.error('   ZOHO_CLIENT_SECRET=your_client_secret');
      console.error('   ZOHO_REFRESH_TOKEN=your_refresh_token');
      console.error('   ZOHO_ORGANIZATION_ID=your_organization_id');
      console.error('\n💡 You can get these from your Zoho Developer Console:');
      console.error('   https://api-console.zoho.com/');
      process.exit(1);
    }
    
    console.log('✅ All required credentials are present');
    console.log('📤 Seeding Zoho credentials to Firebase...');
    
    // Add Zoho credentials to Firestore
    await setDoc(doc(db, 'zohoapi', 'ZOHO_CRED'), zohoCredentials, { merge: true });
    
    console.log('✅ Zoho credentials seeded successfully!');
    console.log('📁 Location: zohoapi/ZOHO_CRED');
    console.log('🔑 Client ID:', zohoCredentials.ZOHO_CLIENT_ID);
    console.log('🏢 Organization ID:', zohoCredentials.ZOHO_ORGANIZATION_ID);
    if (zohoCredentials.ZOHO_PAYMENTS_ACCOUNT_ID) {
      console.log('💳 Payments Account ID:', zohoCredentials.ZOHO_PAYMENTS_ACCOUNT_ID);
    } else {
      console.log('⚠️  Payments Account ID: Not provided (Zoho Pay will not work)');
    }
    console.log('⏰ Token expires at:', new Date(zohoCredentials.token_expires_at).toLocaleString());
    
    if (missingOptionalFields.length > 0) {
      console.log('\n⚠️  Optional fields missing:');
      missingOptionalFields.forEach(field => console.log(`   - ${field}`));
      console.log('\n💡 For full Zoho Pay integration, set these environment variables:');
      console.log('   ZOHO_PAYMENTS_ACCOUNT_ID=your_payments_account_id');
    }
    
    console.log('\n🎉 You can now test the Zoho integration!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding Zoho credentials:', error);
    process.exit(1);
  }
}

seedZohoCredentials(); 