import { initializeFirebase } from './firebase-user.js';
import {
    initializeApp
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import {
    getAuth,
    onAuthStateChanged,
    signOut,
    signInWithEmailAndPassword
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import {
    getDatabase,
    ref,
    get,
    set,
    update,
    remove,
    onValue,
    onChildAdded,
    child
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js';
import {
    getStorage,
    ref as storageRef,
    uploadBytesResumable,
    getDownloadURL
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js'; // Storage (file upload)

import {
    getFirestore,
    collection,
    setDoc,
    doc
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

initializeFirebase(function (app, auth, database,storage) {
let currentUser = null; // Define the current user here
let selectedUserId = null; // Store the selected user ID
let usersMap = {}; // Define usersMap here

// Monitor the user's authentication state
onAuthStateChanged(auth, (user) => {

    if (user) {
        currentUser = user; // Set currentUser to the signed-in user
        document.getElementById('user-id').innerText = `Logged in as: ${currentUser.uid}`;

        // fetchUsers();
        fetchUserDetails(currentUser.uid);
        fetchSystemDetails(currentUser.uid);
    } else {
        document.getElementById('uid').innerText = 'No user logged in';
    }
});

function fetchUserDetails(userId) {
    const userRef = ref(database, 'data/users/' + userId);
    get(userRef)
        .then((snapshot) => {
            if (snapshot.exists()) {
                const user = snapshot.val();
                const fullName = (user.firstName || '') + ' ' + (user.lastName || '');
                // Populate the input fields with existing user data
                document.getElementById('profile-first-name').innerText = fullName.trim();
                document.getElementById('profile-info-role').innerText = user.role || '';
                document.getElementById('profileImageAdmin').innerText = user.image ||
                    "No Profile image";
                if (user.image) {
                    document.getElementById('profileImageAdmin').src = user
                        .image; // Set the profile image URL
                } else {
                    document.getElementById('profileImageAdmin').src =
                        defaultAvatar; // Optional: set a default image
                }
                document.getElementById('user-id').innerText = user.uid || '';
            } 
        })
        .catch((error) => {
          
        });
}

function fetchSystemDetails(userId) {
    const userRef = ref(database, 'data/app_settings/' );
    get(userRef)
        .then((snapshot) => {
            if (snapshot.exists()) {
                const user = snapshot.val();

                document.getElementById('logo').innerText = user.favi_icon || "No Profile image";
                if (user.favi_icon) {
                    document.getElementById('logo').src = user.favi_icon; // Set the profile image URL
                } else {
                    document.getElementById('logo').src = favi_icon; // Optional: set a default image
                }

                document.getElementById('logo-fav').innerText = user.favi_icon || "No Profile image";
                if (user.favi_icon) {
                    document.getElementById('logo-fav').src = user.favi_icon; // Set the profile image URL
                    document.querySelector("link[rel='shortcut icon']").href = user.favi_icon; // Update favicon dynamically
                } else {
                    document.getElementById('logo-fav').src = faviLogo; // Optional: set a default image
                    document.querySelector("link[rel='shortcut icon']").href = faviLogo; // Update favicon to default if no logo
                }

                // Update the title of the page
                document.title = user.site_name || "Loading..."; // Set the title dynamically based on the site_name
                
                // Update user ID
                document.getElementById('user-id').innerText = user.uid || '';
            } 
        })
        .catch((error) => {
           
        });
}
});