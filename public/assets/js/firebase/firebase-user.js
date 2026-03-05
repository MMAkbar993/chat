import {
    initializeApp
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import {
    getAuth,
    signInWithEmailAndPassword
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import {
    getDatabase,
    ref,
    get
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js';
import {
    getStorage,
    ref as storageRef,
    uploadBytesResumable,
    getDownloadURL
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js';  // Storage (file upload)

// Fetch Firebase config from Laravel backend
export function initializeFirebase(callback) {
    fetch('/firebase-config')
        .then(response => {
            if (!response.ok) {
                throw new Error('Firebase config request failed: ' + response.status + ' ' + response.statusText);
            }
            return response.json();
        })
        .then(config => {
            // Firebase configuration from Laravel backend (omit databaseURL if not set)
            const firebaseConfig = {
                apiKey: config.apiKey,
                authDomain: config.authDomain || (config.projectId ? config.projectId + '.firebaseapp.com' : undefined),
                projectId: config.projectId,
                storageBucket: config.storageBucket || (config.projectId ? config.projectId + '.appspot.com' : undefined),
                messagingSenderId: config.messagingSenderId,
                appId: config.appId,
                measurementId: config.measurementId,
            };
            if (config.databaseURL) firebaseConfig.databaseURL = config.databaseURL;

            // Initialize Firebase
            const app = initializeApp(firebaseConfig);
            const auth = getAuth(app);
            const database = getDatabase(app);
            const storage = getStorage(app);
            
            // Now you can use Firebase auth, database, etc.
            callback(app, auth, database,storage);
        })
        .catch(error => {
            console.error('[Firebase] Failed to load config or initialize. Profile/settings may show "Loading...". Check: APP_URL in .env, FIREBASE_* vars on server, and Firebase Authorized domains.', error);
        });
}
