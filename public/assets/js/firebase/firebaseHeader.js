import { initializeFirebase } from './firebase.js';

import {
    initializeApp
} from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
import {
    getAuth,
    onAuthStateChanged,
    signOut,
    signInWithEmailAndPassword
} from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';
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
} from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js';
import {
    getStorage,
    ref as storageRef,
    uploadBytesResumable,
    getDownloadURL
} from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-storage.js'; // Storage (file upload)

import {
    getFirestore,
    collection,
    setDoc,
    doc
} from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';

initializeFirebase(function (app, auth, database) {

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
                
                // Update the full logo
                document.getElementById('full-logo').innerText = user.company_logo || "No Profile image";
                if (user.company_logo) {
                    document.getElementById('full-logo').src = user.company_logo; // Set the profile image URL
                } else {
                    document.getElementById('full-logo').src = fullLogo; // Optional: set a default image
                }

                // Update the small logo
                document.getElementById('small-logo').innerText = user.company_logo || "No Profile image";
                if (user.company_logo) {
                    document.getElementById('small-logo').src = user.company_logo; // Set the profile image URL
                } else {
                    document.getElementById('small-logo').src = smallLogo; // Optional: set a default image
                }

                // Update the favicon (fav-logo)
                document.getElementById('fav-logo').innerText = user.favi_icon || "No Profile image";
                if (user.favi_icon) {
                    document.getElementById('fav-logo').src = user.favi_icon; // Set the profile image URL
                    document.querySelector("link[rel='shortcut icon']").href = user.favi_icon; // Update favicon dynamically
                } else {
                    document.getElementById('fav-logo').src = faviLogo; // Optional: set a default image
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

const logoutButton = document.getElementById("admin-logout-btn");

logoutButton.addEventListener("click", function (event) {
    event.preventDefault(); // Prevent default action (if any)
    logoutUser(); // Call the logoutUser function
});
function logoutUser() {
      if (auth.currentUser) {
        const userId = auth.currentUser.uid; // Get the current user's ID
        const userStatusRef = ref(database, `data/users/${userId}/online`); // Reference to user status
        const lastSeenRef = ref(database, `data/users/${userId}/lastSeen`); // Reference to last seen
        // const deviceInfoRef = ref(database, `users/${userId}/device_info`); // Reference to device_info

        // Set the status to offline before logging out
        set(userStatusRef, 'false').then(() => {
            // Once the status is set to offline, update the lastSeen timestamp
            return set(lastSeenRef, Date.now());
        // }).then(() => {
        //     // Remove the device_info node
        //     return remove(deviceInfoRef);
        }).then(() => {
            // After lastSeen is updated, log the user out from Firebase
            return auth.signOut(); // Sign out from Firebase
        }).then(() => {
            // Redirect to the login page after successful logout
            window.location.href = "/admin/login";
        }).catch((error) => {
            // Optionally, redirect to the login page in case of an error
            window.location.href = "/admin/login";
        });
    } else {
        // No user logged in, redirect directly to the login page
        window.location.href = "/admin/login";
    }
}
});
