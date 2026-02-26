import { initializeFirebase } from './firebase-user.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
    getDatabase,
    ref,
    push,
    onChildAdded,
    get,
    onValue,
    set,
    off,
    update,
    remove,
    onDisconnect,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import {
    getStorage,
    ref as storageRef,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

initializeFirebase(function (app, auth, database,storage) {

let currentUserId = null; // Define the current user here

// Monitor the user's authentication state
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserId = user.uid; // Set the current user ID
    } 
});


// Ensure the DOM is fully loaded before running the script

    // Select the invite form
    const inviteForm = document.getElementById('inviteForm');

    // Add an event listener for the form submission
    inviteForm.addEventListener('submit', function (event) {
        event.preventDefault(); // Prevent the default form submission

        // Call the sendInvite function
        sendInvite();
    });


// Define the sendInvite function
function sendInvite() {
    // Get the input values
    const emailOrPhone = document.getElementById('inviteEmailOrPhone').value;
    const invitationMessage = document.getElementById('inviteMessage').value;
    
    // Simulate sending the invitation (here you would typically call your email service)
    const dynamicLink = `${BASE_URL}/?invitedBy=${encodeURIComponent(emailOrPhone)}`; // Example dynamic link


    // Optionally, you can reset the form fields
    document.getElementById('inviteForm').reset();
}

});