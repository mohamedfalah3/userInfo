// Firebase Configuration
// ✅ CONFIGURED: Real Firebase project credentials loaded
const firebaseConfig = {
    apiKey: "AIzaSyCDzpdv0oK0jFdcEtYPncDh8FI6jmfx7zg",
    authDomain: "user-info-4ac55.firebaseapp.com",
    projectId: "user-info-4ac55",
    storageBucket: "user-info-4ac55.firebasestorage.app",
    messagingSenderId: "457577916654",
    appId: "1:457577916654:web:610bdbaabd73f4bb632bff"
};

// Configuration is now set up correctly
const isPlaceholderConfig = false;

// Initialize Firebase
let db;
let isFirebaseEnabled = false;

try {
    // Initialize Firebase with the real configuration
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    isFirebaseEnabled = true;
    console.log('🔥 Firebase initialized successfully');
    console.log('📱 Project ID:', firebaseConfig.projectId);
    console.log('🌐 Firestore database connected');
    
    // Test connection with a simple ping
    db.collection('_ping').doc('test').set({
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        message: 'Connection test'
    }).then(() => {
        console.log('✅ Firestore connection verified');
        // Clean up test document
        return db.collection('_ping').doc('test').delete();
    }).catch((error) => {
        console.warn('⚠️  Firestore connection test failed:', error.message);
        if (error.code === 'permission-denied') {
            console.log('💡 Make sure Firestore is in test mode or check security rules');
            console.log('🔗 Firebase Console: https://console.firebase.google.com/project/' + firebaseConfig.projectId + '/firestore');
        }
    });
    
} catch (error) {
    console.warn('❌ Firebase initialization failed:', error.message);
    console.log('📱 Falling back to localStorage');
    isFirebaseEnabled = false;
}

// Firestore helper functions
const FirebaseHelper = {
    // Add a new user to Firestore
    async addUser(userData) {
        if (!isFirebaseEnabled) {
            throw new Error('Firebase not available');
        }
        
        try {
            const docRef = await db.collection('users').add({
                ...userData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('User added to Firestore with ID:', docRef.id);
            return { ...userData, id: docRef.id };
        } catch (error) {
            console.error('Error adding user to Firestore:', error);
            throw error;
        }
    },

    // Get all users from Firestore
    async getAllUsers() {
        if (!isFirebaseEnabled) {
            throw new Error('Firebase not available');
        }
        
        try {
            const snapshot = await db.collection('users').orderBy('createdAt', 'desc').get();
            const users = [];
            
            snapshot.forEach(doc => {
                const userData = doc.data();
                users.push({
                    id: doc.id,
                    ...userData,
                    // Convert Firestore timestamp to ISO string if it exists
                    createdAt: userData.createdAt ? userData.createdAt.toDate().toISOString() : new Date().toISOString(),
                    updatedAt: userData.updatedAt ? userData.updatedAt.toDate().toISOString() : new Date().toISOString()
                });
            });
            
            console.log('Retrieved', users.length, 'users from Firestore');
            return users;
        } catch (error) {
            console.error('Error getting users from Firestore:', error);
            throw error;
        }
    },

    // Update a user in Firestore
    async updateUser(userId, userData) {
        if (!isFirebaseEnabled) {
            throw new Error('Firebase not available');
        }
        
        try {
            await db.collection('users').doc(userId).update({
                ...userData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('User updated in Firestore:', userId);
            return { ...userData, id: userId };
        } catch (error) {
            console.error('Error updating user in Firestore:', error);
            throw error;
        }
    },

    // Delete a user from Firestore
    async deleteUser(userId) {
        if (!isFirebaseEnabled) {
            throw new Error('Firebase not available');
        }
        
        try {
            await db.collection('users').doc(userId).delete();
            console.log('User deleted from Firestore:', userId);
        } catch (error) {
            console.error('Error deleting user from Firestore:', error);
            throw error;
        }
    },

    // Get a single user from Firestore
    async getUser(userId) {
        if (!isFirebaseEnabled) {
            throw new Error('Firebase not available');
        }
        
        try {
            const doc = await db.collection('users').doc(userId).get();
            
            if (doc.exists) {
                const userData = doc.data();
                return {
                    id: doc.id,
                    ...userData,
                    createdAt: userData.createdAt ? userData.createdAt.toDate().toISOString() : new Date().toISOString(),
                    updatedAt: userData.updatedAt ? userData.updatedAt.toDate().toISOString() : new Date().toISOString()
                };
            } else {
                throw new Error('User not found');
            }
        } catch (error) {
            console.error('Error getting user from Firestore:', error);
            throw error;
        }
    },

    // Check if Firebase is available
    isAvailable() {
        return isFirebaseEnabled;
    }
};

// Make FirebaseHelper available globally
window.FirebaseHelper = FirebaseHelper;
