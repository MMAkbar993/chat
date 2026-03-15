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

// Fetch Firebase config from Laravel backend (or use config injected in page for deployed server)
export function initializeFirebase(callback) {
    function initWithConfig(config) {
        const c_apiKey = config.apiKey || config.api_key;
        if (!config || !c_apiKey) {
            console.error('[Firebase] No config (missing apiKey).');
            return;
        }
        const c_projectId = config.projectId || config.project_id;
        const firebaseConfig = {
            apiKey: c_apiKey,
            authDomain: config.authDomain || config.auth_domain || (c_projectId ? c_projectId + '.firebaseapp.com' : undefined),
            projectId: c_projectId,
            storageBucket: config.storageBucket || config.storage_bucket || (c_projectId ? c_projectId + '.appspot.com' : undefined),
            messagingSenderId: config.messagingSenderId || config.messaging_sender_id,
            appId: config.appId || config.app_id,
            measurementId: config.measurementId || config.measurement_id,
        };
        const c_databaseURL = config.databaseURL || config.database_url;
        if (c_databaseURL) firebaseConfig.databaseURL = c_databaseURL;

        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const database = getDatabase(app);
        const storage = getStorage(app);
        callback(app, auth, database, storage);
    }

    // Prefer config injected by Blade (works on any server path / domain)
    if (typeof window !== 'undefined' && window.__FIREBASE_CONFIG__) {
        initWithConfig(window.__FIREBASE_CONFIG__);
        return;
    }

    // Fallback: fetch from server (use absolute URL so it works on deployed server)
    const configUrl = (typeof window !== 'undefined' && window.location && window.location.origin)
        ? window.location.origin + '/firebase-config'
        : '/firebase-config';
    fetch(configUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Firebase config request failed: ' + response.status + ' ' + response.statusText);
            }
            return response.json();
        })
        .then(config => initWithConfig(config))
        .catch(error => {
            console.error('[Firebase] Failed to load config or initialize. Profile/settings may show "Loading...". Check: APP_URL in .env, FIREBASE_* vars on server, and Firebase Authorized domains.', error);
        });
}
