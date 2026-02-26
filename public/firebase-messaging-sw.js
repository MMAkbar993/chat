// firebase-messaging-sw.js

// Import the Firebase app and messaging libraries using the modern v9+ syntax
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

// Your web app's Firebase configuration
// Ensure this is 100% correct
const firebaseConfig = {
    apiKey: "AIzaSyBGhH6YHAQaxHaM3t7o87eQ6iCc9mNROV4",
    authDomain: "dreams-chat-66883.firebaseapp.com",
    projectId: "dreams-chat-66883",
    storageBucket: "dreams-chat-66883.appspot.com",
    messagingSenderId: "82906646133", // This must be the number
    appId: "1:82906646133:web:3f2d427f16e3d74f2b5a3c"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

console.log("firebase-messaging-sw.js: File loaded and executed.");