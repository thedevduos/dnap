const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
let adminApp;

try {
  // Check if Firebase Admin is already initialized
  if (admin.apps.length === 0) {
    // Use environment variables for service account
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
      universe_domain: "googleapis.com"
    };
    
    // Validate required environment variables
    const requiredVars = [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_PRIVATE_KEY_ID', 
      'FIREBASE_PRIVATE_KEY',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_CLIENT_ID'
    ];
    
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
    
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID
    });
    
    console.log('✅ Firebase Admin SDK initialized with environment variables');
  } else {
    adminApp = admin.app();
    console.log('✅ Firebase Admin SDK already initialized');
  }
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
  console.log('📋 Please ensure you have set the following environment variables:');
  console.log('   - FIREBASE_PROJECT_ID');
  console.log('   - FIREBASE_PRIVATE_KEY_ID');
  console.log('   - FIREBASE_PRIVATE_KEY');
  console.log('   - FIREBASE_CLIENT_EMAIL');
  console.log('   - FIREBASE_CLIENT_ID');
  console.log('   - FIREBASE_CLIENT_X509_CERT_URL (optional)');
}

// Export admin instance
module.exports = admin;
