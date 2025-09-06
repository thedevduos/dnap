// User management utilities

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL;

// Delete user from Firebase Authentication
export const deleteFirebaseAuthUser = async (uid: string): Promise<{ success: boolean; message: string; userExisted?: boolean }> => {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/users/delete-auth-user/${uid}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to delete user from Firebase Authentication');
    }

    return result;
  } catch (error) {
    console.error('Error deleting Firebase Auth user:', error);
    throw error;
  }
};

// Get user info from Firebase Authentication
export const getFirebaseAuthUser = async (uid: string): Promise<any> => {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/users/auth-user/${uid}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to get user from Firebase Authentication');
    }

    return result.user;
  } catch (error) {
    console.error('Error getting Firebase Auth user:', error);
    throw error;
  }
};

// Disable user in Firebase Authentication
export const disableFirebaseAuthUser = async (uid: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/users/disable-auth-user/${uid}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to disable user in Firebase Authentication');
    }

    return result;
  } catch (error) {
    console.error('Error disabling Firebase Auth user:', error);
    throw error;
  }
};

// Enable user in Firebase Authentication
export const enableFirebaseAuthUser = async (uid: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/users/enable-auth-user/${uid}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to enable user in Firebase Authentication');
    }

    return result;
  } catch (error) {
    console.error('Error enabling Firebase Auth user:', error);
    throw error;
  }
};
