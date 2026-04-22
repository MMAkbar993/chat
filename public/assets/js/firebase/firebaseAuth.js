// firebaseAuth.js
import {
    initializeApp
} from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
import {
    getAuth,
    onAuthStateChanged,
    signOut,
    signInWithEmailAndPassword
} from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';

// Fetch the Firebase configuration from the public folder
async function initializeFirebase() {
    try {
        const response = await fetch('/firebase-config.json');
        
        if (!response.ok) {
            throw new Error(`Failed to load Firebase configuration: ${response.statusText}`);
        }

        const firebaseConfig = await response.json();
		
        // Initialize Firebase
        const app = initializeApp(firebaseConfig);

        // Get Auth instance
        const auth = getAuth(app);

        // Return the Auth instance
        return auth;
    } catch (error) {
        console.error("Error initializing Firebase:", error);
    }
}

// Initialize Firebase and export the Auth instance
const auth = await initializeFirebase();
export { auth };

export const signIn = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const logout = () => signOut(auth);

// Define and export observeAuthState function
export function observeAuthState(callback) {
    onAuthStateChanged(auth, (user) => {
        callback(user); // Pass the user object to the callback
    });
}


// Firebase configuration (use environment variables for sensitive data)
/*const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
const auth = getAuth(app);

// Export common auth functions
export const signIn = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const logout = () => signOut(auth);
export const observeAuthState = (callback) => onAuthStateChanged(auth, callback);*/

// Export the auth object for advanced use cases
//export { auth };
