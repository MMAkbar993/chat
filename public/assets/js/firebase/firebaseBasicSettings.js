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
} from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-storage.js';  // Storage (file upload)

import {
    getFirestore,
    collection,
    getDocs,
    doc,
    getDoc
} from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';

initializeFirebase(function (app, auth, database, storage) {

    let currentUser = null; // Define the current user here
    let selectedUserId = null; // Store the selected user ID
    let usersMap = {}; // Define usersMap here

    // Monitor the user's authentication state
    onAuthStateChanged(auth, (user) => {

        if (user) {
            currentUser = user; // Set currentUser to the signed-in user
            // document.getElementById('user-id').innerText = `Logged in as: ${currentUser.uid}`;

            fetchUsers();
            fetchUserDetails(currentUser.uid);
        } else {
            window.location.href = "/admin";
            document.getElementById('user-id').innerText = 'No user logged in';
        }
    });

    function fetchUsers() {
        const usersRef = ref(database, 'basic_settings'); // Path to your users data

        get(usersRef)
            .then((snapshot) => {
                if (snapshot.exists()) {
                    const users = snapshot.val();

                    // Create a mapping of user IDs to user names
                    for (const userId in users) {
                        usersMap[userId] = users[userId].firstName + ' ' + users[userId]
                            .lastName; // Store user names in usersMap
                    }

                    // Check for the logged-in user
                    if (currentUser) { // Make sure currentUser is defined
                        const loggedInUserId = currentUser.uid; // Get the logged-in user's UID

                        // Check if the logged-in user exists in the usersMap
                        if (usersMap[loggedInUserId]) {
                            const loggedInUserDetails = users[loggedInUserId]; // Get logged-in user details

                            // Optionally display the logged-in user's details in the UI
                            fetchUserDetails(userId);
                        } 
                    }
                } 
            })
            .catch((error) => {
               
            });
    }

    function fetchUserDetails(userId) {
        const userRef = ref(database, 'data/basic_settings' );
        get(userRef)
            .then((snapshot) => {
                if (snapshot.exists()) {
                    const user = snapshot.val();
                    // Populate the input fields with existing user data
                    document.getElementById('privacy_policy').value = user.privacy_policy || '';
                    document.getElementById('terms_conditions').value = user.terms_conditions || '';
                    document.getElementById('uid').value = user.uid || '';
                } 
            })
            .catch((error) => {
              
            });
    }


    document.getElementById('SaveButton').addEventListener('click', function (event) {
        event.preventDefault(); // Prevent the default action of the link

        // Get user input values
        const PrivacyPolicy = document.getElementById('privacy_policy').value;
        const TermsConditions = document.getElementById('terms_conditions').value;
        const uid = document.getElementById('uid').value;

        // Get the current user's ID
        const userId = currentUser.uid; // Ensure currentUser is defined and has the uid property

        // Create a user object with only the fields you want to update
        const userData = {
            privacy_policy: PrivacyPolicy,
            terms_conditions: TermsConditions,
            uid: userId,
        };

        // Reference to the user data in Firebase
        const userRef = ref(database, 'data/basic_settings');

        // Update user data in Firebase without removing existing fields
        update(userRef, userData)
            .then(() => {
                showToast(`Basic information updated successfully`);
            })
            .catch((error) => {
               
            });
    });

    function showToast(message) {
        Toastify({
            text: message,
            duration: 3000, // Duration in milliseconds
            gravity: "top", // `top` or `bottom`
            position: "right", // `left`, `center` or `right`
            style: {
                background: "#28a745" // Custom background color using style.background
            },
            stopOnFocus: true, // Prevents dismissing of toast on hover
        }).showToast();
    }
});
