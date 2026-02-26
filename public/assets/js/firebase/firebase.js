import {
    initializeApp
} from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
import {
    getAuth,
    signInWithEmailAndPassword
} from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';
import {
    getDatabase,
    ref,
    get
} from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js';
import {
    getStorage,
    ref as storageRef,
    uploadBytesResumable,
    getDownloadURL
} from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-storage.js';  // Storage (file upload)

// Fetch Firebase config from Laravel backend
export function initializeFirebase(callback) {
    fetch('/firebase-config')
        .then(response => response.json())
        .then(config => {
            // Firebase configuration from Laravel backend
            const firebaseConfig = {
                apiKey: config.apiKey,
                authDomain: config.authDomain,
                projectId: config.projectId,
                storageBucket: config.storageBucket,
                messagingSenderId: config.messagingSenderId,
                appId: config.appId,
            };

            // Initialize Firebase
            const app = initializeApp(firebaseConfig);
            const auth = getAuth(app);
            const database = getDatabase(app);
            const storage = getStorage(app);
            
            // Now you can use Firebase auth, database, etc.
            callback(app, auth, database,storage);
        })
        .catch(error => {
           
        });
}
