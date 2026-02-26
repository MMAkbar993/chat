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
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js';  // Storage (file upload)

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
         const uid = user.uid;
        currentUser = user; // Set currentUser to the signed-in user
        document.getElementById('uid').innerText = `Logged in as: ${currentUser.uid}`;
        fetchUsers();
    } else {
        window.location.href = "/login";
        document.getElementById('uid').innerText = 'No user logged in';
    }
});



async function fetchUsers() {
    const usersRef = ref(database, "data/users");  // or firestore.collection('users') for Firestore
    try {
        const snapshot = await get(usersRef); // Use the get function instead of once
        const users = snapshot.val(); // For Realtime Database
        return users ? Object.values(users) : []; // Convert to an array for Realtime Database
    } catch (error) {
        return [];
    }
}



let users = {}; // Global variable to store users

function fetchAndDisplayCalls() {
    const usersRef = ref(database, 'data/users');
    
    // Fetch users
    onValue(usersRef, (snapshot) => {
        if (snapshot.exists()) {
            users = snapshot.val(); // Store users data
            fetchCalls(); // Fetch calls after loading users
        } 
    }, (error) => {
       
    });
}

function fetchCalls() {
    const callsRef = ref(database, `data/calls/${currentUser.uid}`); // Reference to the calls node

    // Fetch calls data from Firebase
    onValue(callsRef, (snapshot) => {
        if (snapshot.exists()) {
            const calls = snapshot.val(); // Store calls data
            displayAllCalls(calls); // Display all calls when loaded
            displayAudioCalls(calls); // Call to display audio calls
            displayVideoCalls(calls); // Call to display video calls
        } 
    }, (error) => {
      
    });
}

function formatedAgoTimestamp(timestamp) {
    const now = Date.now(); // Current time in milliseconds
    const timeDifference = now - timestamp; // Difference in milliseconds

    // Convert time difference into minutes
    const minutesAgo = Math.floor(timeDifference / 60000);

    if (minutesAgo < 1) return "Just now";
    if (minutesAgo < 60) return `${minutesAgo} minutes ago`;

    // Convert time difference into hours
    const hoursAgo = Math.floor(minutesAgo / 60);
    if (hoursAgo < 24) return `${hoursAgo} hours ago`;

    // Convert time difference into days
    const daysAgo = Math.floor(hoursAgo / 24);
    return `${daysAgo} days ago`;
}


function formatedTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();

    // Reset time for accurate day comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    // Helper to format time
    function formatTime(date) {
        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, "0");
        const period = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12; // Convert 0 to 12 for midnight
        return `${hours}:${minutes} ${period}`;
    }

    // Check if the timestamp is today
    if (date >= today) {
        return formatTime(date); // Display only time for today
    }
    // Check if the timestamp is yesterday
    else if (date >= yesterday) {
        return `Yesterday at ${formatTime(date)}`; // Display "Yesterday" with time
    }
    // Format as MM/DD/YYYY with time for older dates
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Month is 0-based
    const year = date.getFullYear();
    return `${month}/${day}/${year} at ${formatTime(date)}`; // Append time to date
}


/**
 * Capitalizes the first letter of each word in a string.
 */
function capitalizeFirstLetter(str) {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/\b\w/g, char => char.toUpperCase());
}

/**
 * Asynchronously fetches the display name for a single user.
 * It checks contacts first, then falls back to the main users collection.
 * @param {string} userId The UID of the user to fetch.
 * @returns {Promise<string>} The user's display name.
 */
async function getUserDisplayName(userId) {
    if (!userId) return "Unknown User";
    
    // 1. Try to get name from the current user's contacts
    const contactRef = ref(database, `data/users/${currentUser.uid}/contacts/${userId}`);
    const contactSnapshot = await get(contactRef);
    if (contactSnapshot.exists()) {
        const data = contactSnapshot.val();
        if (data.firstName && data.lastName) {
            return `${data.firstName} ${data.lastName}`;
        }
    }

    // 2. Fallback to the main users collection
    const userRef = ref(database, `data/users/${userId}`);
    const userSnapshot = await get(userRef);
    if (userSnapshot.exists()) {
        const data = userSnapshot.val();
        const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
        return fullName || data.userName || "Unknown User";
    }

    return "Unknown User";
}

/**
 * Processes a single call object to get all necessary data for rendering.
 * This is the new central logic hub.
 * @param {object} call The call object from Firebase.
 * @returns {Promise<object|null>} A promise that resolves to an object with all display data.
 */
async function processCallData(call) {
    let displayName = "Unknown";
    let profileImage = 'assets/img/profiles/avatar-03.jpg';
    let userOnlineClass = "";

    // Handle Group vs. Single calls
    if (call.type === 'group') {
        // --- LOGIC FOR GROUP CALLS ---
        displayName = call.groupName || "Group Call"; // Assuming group name is stored in the call
        profileImage = call.groupImage || 'assets/img/profiles/avatar-03.jpg'; // Assuming a group image
    
    } else {
        // --- LOGIC FOR SINGLE (ONE-TO-ONE) CALLS ---
        const otherUserId = call.callerId === currentUser.uid ? call.receiverId : call.callerId;
        const otherUser = users[otherUserId]; // Get basic user data from the pre-loaded 'users' map

        if (!otherUser) return null; // If the other user doesn't exist, skip this call

        displayName = await getUserDisplayName(otherUserId);
        profileImage = otherUser.image || 'assets/img/profiles/avatar-03.jpg';
        userOnlineClass = otherUser.status === "online" ? "online" : "";
    }

    // Determine Call Status Icon and Text based on 'inOrOut'
    let directionIcon = "";
    let directionText = formatedAgoTimestamp(call.currentMills);
    let directionColor = "";

    switch (call.inOrOut) {
        case 'IN':
            directionIcon = "ti ti-phone-incoming";
            directionColor = "text-success"; // Green for incoming
            break;
        case 'OUT':
            directionIcon = "ti ti-phone-outgoing";
            directionColor = "text-purple"; // Purple for outgoing
            break;
        case 'MISSED':
            directionIcon = "ti ti-phone-off";
            directionColor = "text-danger"; // Red for missed
            directionText = `Missed call at ${formatedTimestamp(call.currentMills)}`;
            break;
        case 'Declined':
            directionIcon = "ti ti-phone-x";
            directionColor = "text-danger"; // Red for declined
            directionText = `Declined call at ${formatedTimestamp(call.currentMills)}`;
            break;
        default:
            directionIcon = "ti ti-phone";
            directionColor = "text-muted";
    }

    // Determine Video vs. Audio call icon based on 'video' boolean
    const callTypeIcon = call.video ? "ti ti-video" : "ti ti-phone-call";

    return {
        fullName: capitalizeFirstLetter(displayName),
        profileImage,
        userOnlineClass,
        directionIcon,
        directionColor,
        directionText,
        callTypeIcon,
    };
}

/**
 * Displays all calls for the current user.
 * MODIFIED: Now uses async/await to render correctly and handles new requirements.
 */
async function displayAllCalls(calls) {
    const container = document.querySelector('#all-calls');
    container.innerHTML = ''; // Clear existing calls

    const sortedCalls = Object.values(calls).sort((a, b) => b.currentMills - a.currentMills);

    if (sortedCalls.length === 0) {
        container.innerHTML = '<p>No calls found.</p>';
        return;
    }

    // 1. Process all calls in parallel and wait for the data to be ready
    const promises = sortedCalls.map(call => processCallData(call));
    const renderedData = (await Promise.all(promises)).filter(Boolean); // filter(Boolean) removes any null entries

    const allCallsWrap = document.createElement('div');
    allCallsWrap.classList.add('chat-users-wrap');

    // 2. Now that all data is fetched, build the HTML in the correct order
    renderedData.forEach(data => {
        const callItem = document.createElement('div');
        callItem.classList.add('chat-list');
        callItem.innerHTML = `
            <a href="#" class="chat-user-list">
                <div class="avatar avatar-lg ${data.userOnlineClass} me-2">
                    <img src="${data.profileImage}" class="rounded-circle" alt="image">
                </div>
                <div class="chat-user-info">
                    <div class="chat-user-msg">
                        <h6>${data.fullName}</h6>
                        <p class="hide-in-between-space ${data.directionColor}">
                            <i class="${data.directionIcon} me-2"></i>${data.directionText}
                        </p>
                    </div>
                    <div class="chat-user-time">
                        <div>
                            <i class="${data.callTypeIcon} text-pink"></i>
                        </div>
                    </div>
                </div>
            </a>`;
        allCallsWrap.appendChild(callItem);
    });

    container.appendChild(allCallsWrap);
}


/**
 * Displays only audio calls for the current user.
 * MODIFIED: Now uses async/await and filters for audio calls.
 */
async function displayAudioCalls(calls) {
    const container = document.querySelector('#audio-calls');
    container.innerHTML = '';

    const audioCalls = Object.values(calls)
        .filter(call => !call.video) // Filter for audio calls (video is false or undefined)
        .sort((a, b) => b.currentMills - a.currentMills);

    if (audioCalls.length === 0) {
        container.innerHTML = '<p>No audio calls found.</p>';
        return;
    }

    const promises = audioCalls.map(call => processCallData(call));
    const renderedData = (await Promise.all(promises)).filter(Boolean);

    const audioCallsWrap = document.createElement('div');
    audioCallsWrap.classList.add('chat-users-wrap');

    renderedData.forEach(data => {
        const callItem = document.createElement('div');
        callItem.classList.add('chat-list');
        callItem.innerHTML = `
            <a href="#" class="chat-user-list">
                <div class="avatar avatar-lg ${data.userOnlineClass} me-2">
                    <img src="${data.profileImage}" class="rounded-circle" alt="image">
                </div>
                <div class="chat-user-info">
                    <div class="chat-user-msg">
                        <h6>${data.fullName}</h6>
                        <p class="hide-in-between-space ${data.directionColor}">
                            <i class="${data.directionIcon} me-2"></i>${data.directionText}
                        </p>
                    </div>
                    <div class="chat-user-time">
                        <div>
                            <i class="${data.callTypeIcon} text-pink"></i>
                        </div>
                    </div>
                </div>
            </a>`;
        audioCallsWrap.appendChild(callItem);
    });

    container.appendChild(audioCallsWrap);
}


/**
 * Displays only video calls for the current user.
 * MODIFIED: Now uses async/await and filters for video calls.
 */
async function displayVideoCalls(calls) {
    const container = document.querySelector('#video-calls');
    container.innerHTML = '';

    const videoCalls = Object.values(calls)
        .filter(call => call.video === true) // Filter for video calls
        .sort((a, b) => b.currentMills - a.currentMills);

    if (videoCalls.length === 0) {
        container.innerHTML = '<p>No video calls found.</p>';
        return;
    }

    const promises = videoCalls.map(call => processCallData(call));
    const renderedData = (await Promise.all(promises)).filter(Boolean);

    const videoCallsWrap = document.createElement('div');
    videoCallsWrap.classList.add('chat-users-wrap');

    renderedData.forEach(data => {
        const callItem = document.createElement('div');
        callItem.classList.add('chat-list');
        callItem.innerHTML = `
            <a href="#" class="chat-user-list">
                <div class="avatar avatar-lg ${data.userOnlineClass} me-2">
                    <img src="${data.profileImage}" class="rounded-circle" alt="image">
                </div>
                <div class="chat-user-info">
                    <div class="chat-user-msg">
                        <h6>${data.fullName}</h6>
                        <p class="hide-in-between-space ${data.directionColor}">
                            <i class="${data.directionIcon} me-2"></i>${data.directionText}
                        </p>
                    </div>
                    <div class="chat-user-time">
                        <div>
                            <i class="${data.callTypeIcon} text-pink"></i>
                        </div>
                    </div>
                </div>
            </a>`;
        videoCallsWrap.appendChild(callItem);
    });

    container.appendChild(videoCallsWrap);
}




// Helper function to format call duration
function formatCallDuration(timestamp) {
    // Assuming you want to display how long ago the call happened
    const callDuration = Date.now() - timestamp; // Calculate duration in milliseconds
    const minutes = Math.floor((callDuration / 1000 / 60) % 60);
    const seconds = Math.floor((callDuration / 1000) % 60);
    return `${minutes}m ${seconds}s`; // Format as needed
}

// Initial fetch when the page loads
fetchAndDisplayCalls();



async function populateUserList() {
    const userListElement = document.getElementById('user-list');
    userListElement.innerHTML = ''; // Clear existing content

    const users = await fetchUsers(); // Fetch users from Firebase

    users.forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = 'contact-user d-flex align-items-center justify-content-between';
        userItem.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="avatar avatar-lg">
                    <img src="${user.image || 'assets/img/profiles/avatar-03.jpg'}" class="rounded-circle" alt="${user.firstName}">
                </div>
                <div class="ms-2">
                    <h6>${user.firstName}</h6>
                </div>
            </div>
            <div class="d-inline-flex">
                <a href="#" class="model-icon bg-light d-flex justify-content-center align-items-center rounded-circle me-2" data-bs-toggle="modal" data-bs-target="#voice_call"><span><i class="ti ti-phone"></i></span></a>
                <a href="#" class="model-icon bg-light d-flex justify-content-center align-items-center rounded-circle" data-bs-toggle="modal" data-bs-target="#video-call"><span><i class="ti ti-video"></i></span></a>
            </div>
        `;
        userListElement.appendChild(userItem);
    });
}

// Event listener to populate user list when the modal opens
document.getElementById('new-call').addEventListener('show.bs.modal', populateUserList);



document.getElementById("searchCallInput").addEventListener("input", function() {
    const searchValue = this.value.toLowerCase(); // Get the search value in lowercase
    const userDivs = document.querySelectorAll(".chat-users-wrap .chat-list"); // Select all user elements
    let anyVisible = false; // Initialize visibility tracker

    userDivs.forEach(userDiv => {
        const userNameElement = userDiv.querySelector(".chat-user-msg h6"); // Assuming the username is in an <h6> tag
        if (userNameElement) {
            const userName = userNameElement.textContent.toLowerCase(); // Get the username in lowercase

            // Check if the username includes the search value
            if (userName.includes(searchValue)) {
                userDiv.style.display = ""; // Show user
                anyVisible = true; // Update the visibility tracker
            } else {
                userDiv.style.display = "none"; // Hide user
            }
        } else {
            userDiv.style.display = "none"; // Hide the user if no username found
        }
    });

    const noMatchesMessage = document.getElementById('noCallMatchesModalMessage');
    if (noMatchesMessage) {
        // Show the message if no contacts are visible
        noMatchesMessage.style.display = anyVisible ? "none" : "block";
    } 
});
});