const express = require('express');
const admin = require('../firebase-admin');
const router = express.Router();

// Check if email already exists in userProfiles
router.get('/check-email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    console.log(`🔍 Checking if email exists: ${email}`);
    
    const db = admin.firestore();
    const userProfilesRef = db.collection('userProfiles');
    const query = userProfilesRef.where('email', '==', email);
    const snapshot = await query.get();
    
    const exists = !snapshot.empty;
    const count = snapshot.size;
    
    console.log(`📧 Email ${email} exists: ${exists} (${count} profiles)`);
    
    res.json({
      success: true,
      email: email,
      exists: exists,
      count: count,
      message: exists ? 'Email already exists in user profiles' : 'Email is available'
    });
    
  } catch (error) {
    console.error('❌ Error checking email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check email',
      error: error.message
    });
  }
});

// Health check endpoint for Firebase Admin SDK
router.get('/health', async (req, res) => {
  try {
    // Check if Firebase Admin is initialized
    if (!admin.apps.length) {
      return res.status(500).json({
        success: false,
        message: 'Firebase Admin SDK not initialized',
        appsCount: admin.apps.length
      });
    }

    // Try to get a user (this will fail if not properly initialized)
    // We'll just check if the auth service is available
    const auth = admin.auth();
    
    res.json({
      success: true,
      message: 'Firebase Admin SDK is working',
      appsCount: admin.apps.length,
      projectId: admin.app().options.projectId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Firebase Admin SDK error',
      error: error.message
    });
  }
});

// List all users (for debugging)
router.get('/list-users', async (req, res) => {
  try {
    console.log('🔍 Attempting to list Firebase Auth users...');
    
    // Check if Firebase Admin is initialized
    if (!admin.apps.length) {
      throw new Error('Firebase Admin SDK not initialized');
    }

    // List users (limit to 10 for debugging)
    const listUsersResult = await admin.auth().listUsers(10);
    
    const users = listUsersResult.users.map(user => ({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified,
      disabled: user.disabled,
      createdAt: user.metadata.creationTime,
      lastSignIn: user.metadata.lastSignInTime
    }));
    
    console.log(`✅ Successfully listed ${users.length} Firebase Auth users`);
    
    res.json({
      success: true,
      users: users,
      totalUsers: users.length
    });
    
  } catch (error) {
    console.error('❌ Error listing Firebase Auth users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list users from Firebase Authentication',
      error: error.message
    });
  }
});

// Test delete endpoint (for debugging)
router.delete('/test-delete/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    
    console.log(`🧪 TEST: Attempting to delete Firebase Auth user: ${uid}`);
    console.log(`📋 TEST: UID length: ${uid.length}, UID type: ${typeof uid}`);
    
    // Check if Firebase Admin is initialized
    if (!admin.apps.length) {
      throw new Error('Firebase Admin SDK not initialized');
    }

    // First, try to get the user to verify it exists
    try {
      const userRecord = await admin.auth().getUser(uid);
      console.log(`✅ TEST: User found in Firebase Auth: ${userRecord.email}`);
      
      res.json({
        success: true,
        message: 'User found and ready for deletion',
        user: {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName
        }
      });
    } catch (getUserError) {
      console.error(`❌ TEST: User not found in Firebase Auth: ${getUserError.message}`);
      res.status(404).json({
        success: false,
        message: 'User not found in Firebase Authentication',
        error: getUserError.message,
        uid: uid
      });
    }
    
  } catch (error) {
    console.error('❌ TEST: Error in test delete:', error);
    res.status(500).json({
      success: false,
      message: 'Test delete failed',
      error: error.message
    });
  }
});

// Delete user from Firebase Authentication
router.delete('/delete-auth-user/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    
    if (!uid) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    console.log(`🔥 Attempting to delete Firebase Auth user: ${uid}`);
    console.log(`📋 UID length: ${uid.length}, UID type: ${typeof uid}`);
    
    // Check if Firebase Admin is initialized
    if (!admin.apps.length) {
      throw new Error('Firebase Admin SDK not initialized');
    }

    // First, try to get the user to verify it exists
    let userExists = false;
    try {
      const userRecord = await admin.auth().getUser(uid);
      console.log(`✅ User found in Firebase Auth: ${userRecord.email}`);
      userExists = true;
    } catch (getUserError) {
      if (getUserError.code === 'auth/user-not-found') {
        console.log(`ℹ️ User not found in Firebase Auth (UID: ${uid}) - this is normal if user was created via other means or already deleted`);
        userExists = false;
      } else {
        console.error(`❌ Error checking Firebase Auth user: ${getUserError.message}`);
        throw getUserError;
      }
    }

    // Only delete from Firebase Authentication if user exists
    if (userExists) {
      await admin.auth().deleteUser(uid);
      console.log(`✅ Successfully deleted Firebase Auth user: ${uid}`);
    } else {
      console.log(`ℹ️ Skipping Firebase Auth deletion - user not found (UID: ${uid})`);
    }
    
    res.json({
      success: true,
      message: userExists ? 'User deleted from Firebase Authentication successfully' : 'User not found in Firebase Authentication (already deleted or never existed)',
      uid: uid,
      userExisted: userExists
    });
    
  } catch (error) {
    console.error('❌ Error deleting Firebase Auth user:', error);
    
    // Handle specific Firebase Auth errors
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({
        success: false,
        message: 'User not found in Firebase Authentication'
      });
    } else if (error.code === 'auth/invalid-uid') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete user from Firebase Authentication',
        error: error.message
      });
    }
  }
});

// Get user info from Firebase Authentication
router.get('/auth-user/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    
    if (!uid) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    console.log(`🔍 Attempting to get Firebase Auth user: ${uid}`);
    
    // Check if Firebase Admin is initialized
    if (!admin.apps.length) {
      throw new Error('Firebase Admin SDK not initialized');
    }

    // Get user from Firebase Authentication
    const userRecord = await admin.auth().getUser(uid);
    
    console.log(`✅ Successfully retrieved Firebase Auth user: ${uid}`);
    
    res.json({
      success: true,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        emailVerified: userRecord.emailVerified,
        disabled: userRecord.disabled,
        createdAt: userRecord.metadata.creationTime,
        lastSignIn: userRecord.metadata.lastSignInTime
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting Firebase Auth user:', error);
    
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({
        success: false,
        message: 'User not found in Firebase Authentication',
        uid: req.params.uid
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to get user from Firebase Authentication',
        error: error.message,
        uid: req.params.uid
      });
    }
  }
});

// Disable user in Firebase Authentication
router.patch('/disable-auth-user/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    
    if (!uid) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Disable user in Firebase Authentication
    await admin.auth().updateUser(uid, {
      disabled: true
    });
    
    console.log(`✅ Successfully disabled Firebase Auth user: ${uid}`);
    
    res.json({
      success: true,
      message: 'User disabled in Firebase Authentication successfully',
      uid: uid
    });
    
  } catch (error) {
    console.error('❌ Error disabling Firebase Auth user:', error);
    
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({
        success: false,
        message: 'User not found in Firebase Authentication'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to disable user in Firebase Authentication',
        error: error.message
      });
    }
  }
});

// Enable user in Firebase Authentication
router.patch('/enable-auth-user/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    
    if (!uid) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Enable user in Firebase Authentication
    await admin.auth().updateUser(uid, {
      disabled: false
    });
    
    console.log(`✅ Successfully enabled Firebase Auth user: ${uid}`);
    
    res.json({
      success: true,
      message: 'User enabled in Firebase Authentication successfully',
      uid: uid
    });
    
  } catch (error) {
    console.error('❌ Error enabling Firebase Auth user:', error);
    
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({
        success: false,
        message: 'User not found in Firebase Authentication'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to enable user in Firebase Authentication',
        error: error.message
      });
    }
  }
});

module.exports = router;
