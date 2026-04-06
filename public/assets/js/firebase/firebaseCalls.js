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

function resolveCallsProfileImageUrl(raw) {
    const origin =
        typeof window !== "undefined" && window.location && window.location.origin
            ? window.location.origin
            : "";
    const defaultUrl = origin
        ? origin + "/assets/img/profiles/avatar-03.jpg"
        : "assets/img/profiles/avatar-03.jpg";
    if (raw == null || !String(raw).trim()) return defaultUrl;
    const s = String(raw).trim();
    if (/^https?:\/\//i.test(s) || s.startsWith("data:") || s.startsWith("blob:"))
        return s;
    if (s.startsWith("//"))
        return (window.location && window.location.protocol
            ? window.location.protocol
            : "https:") + s;
    const path = s.replace(/^\.?\/+/, "");
    return origin ? origin + "/" + path : defaultUrl;
}

let currentUser = null; // Define the current user here
let selectedUserId = null; // Store the selected user ID
let usersMap = {}; // Define usersMap here
/** Latest calls payload so we can re-render when `users` loads after calls. */
let lastCallsData = {};
let unsubCallsListener = null;

// Monitor the user's authentication state
onAuthStateChanged(auth, (user) => {
    if (unsubCallsListener) {
        unsubCallsListener();
        unsubCallsListener = null;
    }
    if (user) {
        currentUser = user;
        const uidEl = document.getElementById("uid");
        if (uidEl) uidEl.innerText = `Logged in as: ${currentUser.uid}`;
        attachCallsListener();
    } else {
        currentUser = null;
        lastCallsData = {};
        const uidEl = document.getElementById("uid");
        if (uidEl) uidEl.innerText = "No user logged in";
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



let users = {}; // Global variable to store users (for avatars / status)

function fetchAndDisplayCalls() {
    const usersRef = ref(database, "data/users");
    onValue(
        usersRef,
        (snapshot) => {
            users = snapshot.exists() ? snapshot.val() : {};
            void rerenderCallsTabsFromCache();
        },
        () => {}
    );
}

function attachCallsListener() {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const callsRef = ref(database, `data/calls/${uid}`);
    unsubCallsListener = onValue(
        callsRef,
        (snapshot) => {
            lastCallsData = snapshot.exists() ? snapshot.val() : {};
            void rerenderCallsTabsFromCache();
        },
        () => {}
    );
}

async function rerenderCallsTabsFromCache() {
    const c = lastCallsData && typeof lastCallsData === "object" ? lastCallsData : {};
    try {
        await Promise.all([
            displayAllCalls(c),
            displayAudioCalls(c),
            displayVideoCalls(c),
        ]);
    } catch (e) {
        /* ignore */
    }
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
/** One-to-one call rows store the other party in callerId as [uid] (see firebaseChat callData). */
function getCallOtherPartyUid(call) {
    if (!call || call.type === "group") return null;
    const c = call.callerId;
    if (Array.isArray(c) && c.length) return String(c[0] || "").trim();
    if (c != null && String(c).trim()) return String(c).trim();
    const r = call.receiverId;
    if (Array.isArray(r) && r.length) return String(r[0] || "").trim();
    if (r != null && String(r).trim()) return String(r).trim();
    return null;
}

async function getAvatarRawForCallUser(otherUserId, otherUser) {
    if (!otherUserId || !currentUser) return "";
    const contactRef = ref(
        database,
        `data/contacts/${currentUser.uid}/${otherUserId}`
    );
    const cs = await get(contactRef);
    if (cs.exists()) {
        const c = cs.val();
        const fromC =
            (c.profile_image && String(c.profile_image).trim()) ||
            (c.image && String(c.image).trim());
        if (fromC) return fromC;
    }
    if (otherUser && typeof otherUser === "object") {
        return (
            (otherUser.profile_image &&
                String(otherUser.profile_image).trim()) ||
            (otherUser.image && String(otherUser.image).trim()) ||
            ""
        );
    }
    return "";
}

async function enrichCallRowsFromLaravel(rows) {
    const uids = [
        ...new Set(rows.map((r) => r.otherUserId).filter(Boolean)),
    ];
    const token =
        typeof document !== "undefined" &&
        document.querySelector('meta[name="csrf-token"]')
            ? document
                  .querySelector('meta[name="csrf-token"]')
                  .getAttribute("content")
            : "";
    const origin =
        typeof window !== "undefined" && window.location && window.location.origin
            ? window.location.origin
            : "";
    if (!token || !origin || uids.length === 0) return;

    let contactsByPeer = {};
    const me = auth.currentUser?.uid || currentUser?.uid;
    if (me) {
        try {
            const cs = await get(ref(database, `data/contacts/${me}`));
            contactsByPeer = cs.exists() ? cs.val() : {};
        } catch (e) {
            contactsByPeer = {};
        }
    }

    function applyBatchResponse(data, chunk) {
        const bu = data.by_uid || {};
        const be = data.by_email || {};
        const buser = data.by_username || {};
        rows.forEach((row) => {
            const uid = row.otherUserId;
            if (!uid || chunk.indexOf(uid) === -1) return;
            let url = bu[uid] || "";
            const c = contactsByPeer[uid];
            if (!url && c && c.email) {
                const k = String(c.email).trim().toLowerCase();
                if (k && be[k]) url = be[k];
            }
            if (!url && c && c.user_name) {
                const k = String(c.user_name).trim().toLowerCase();
                if (k && buser[k]) url = buser[k];
            }
            if (url && String(url).trim()) {
                row.profileImage = resolveCallsProfileImageUrl(
                    String(url).trim()
                );
            }
        });
    }

    for (let i = 0; i < uids.length; i += 60) {
        const chunk = uids.slice(i, i + 60);
        const emails = [];
        const usernames = [];
        chunk.forEach((uid) => {
            const c = contactsByPeer[uid];
            if (c && c.email && String(c.email).trim()) {
                emails.push(String(c.email).trim().toLowerCase());
            }
            if (c && c.user_name && String(c.user_name).trim()) {
                usernames.push(String(c.user_name).trim());
            }
        });
        try {
            const r = await fetch(origin + "/api/users/contact-avatars", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "X-CSRF-TOKEN": token,
                    "X-Requested-With": "XMLHttpRequest",
                },
                body: JSON.stringify({
                    firebase_uids: chunk,
                    emails: [...new Set(emails)].slice(0, 60),
                    usernames: [...new Set(usernames)].slice(0, 60),
                }),
            });
            if (!r.ok) continue;
            const data = await r.json();
            applyBatchResponse(data, chunk);
        } catch (e) {
            /* ignore */
        }
    }
}

function escapeAttr(s) {
    return String(s == null ? "" : s).replace(/"/g, "&quot;");
}

async function getUserDisplayName(userId) {
    if (!userId) return "Unknown User";

    // 0. If this is the logged-in user, prefer their chosen display name
    if (currentUser && userId === currentUser.uid && window.LARAVEL_USER && window.LARAVEL_USER.public_display_name) {
        return window.LARAVEL_USER.public_display_name;
    }

    // 1. Try Laravel batch API for the display name preference
    try {
        const baseUrl = (typeof APP_URL !== "undefined" && APP_URL ? String(APP_URL).replace(/\/$/, "") : window.location.origin) || "";
        const csrfMeta = document.querySelector('meta[name="csrf-token"]');
        const csrf = csrfMeta ? csrfMeta.getAttribute("content") : "";
        const res = await fetch(baseUrl + "/api/users/contact-avatars", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json", "X-Requested-With": "XMLHttpRequest", ...(csrf ? { "X-CSRF-TOKEN": csrf } : {}) },
            credentials: "same-origin",
            body: JSON.stringify({ firebase_uids: [userId] }),
        });
        if (res.ok) {
            const data = await res.json();
            const name = (data.name_by_uid || {})[userId];
            if (name) return name;
        }
    } catch (e) { /* fall through */ }

    // 2. Try current user's contacts
    const contactRef = ref(database, `data/contacts/${currentUser.uid}/${userId}`);
    const contactSnapshot = await get(contactRef);
    if (contactSnapshot.exists()) {
        const data = contactSnapshot.val();
        const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
        if (fullName) return fullName;
        if (data.user_name) return data.user_name;
        if (data.email) return data.email;
        if (data.mobile_number) return data.mobile_number;
    }

    // 3. Fallback to the main users collection
    const userRef = ref(database, `data/users/${userId}`);
    const userSnapshot = await get(userRef);
    if (userSnapshot.exists()) {
        const data = userSnapshot.val();
        const fullName = `${data.firstName || data.first_name || ''} ${data.lastName || data.last_name || ''}`.trim();
        return fullName || data.userName || data.username || data.profileName || data.user_name || "Unknown User";
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
    let profileImage = resolveCallsProfileImageUrl("");
    let userOnlineClass = "";
    let otherUserId = null;

    // Handle Group vs. Single calls
    if (call.type === 'group') {
        // --- LOGIC FOR GROUP CALLS ---
        displayName = call.groupName || "Group Call"; // Assuming group name is stored in the call
        profileImage = resolveCallsProfileImageUrl(call.groupImage || "");
    
    } else {
        // --- LOGIC FOR SINGLE (ONE-TO-ONE) CALLS ---
        otherUserId = getCallOtherPartyUid(call);
        if (!otherUserId) return null;

        let otherUser = users[otherUserId];
        if (!otherUser || typeof otherUser !== "object") {
            try {
                const us = await get(
                    ref(database, `data/users/${otherUserId}`)
                );
                otherUser = us.exists() ? us.val() : {};
            } catch (e) {
                otherUser = {};
            }
        }

        displayName = await getUserDisplayName(otherUserId);
        const raw = await getAvatarRawForCallUser(otherUserId, otherUser);
        profileImage = resolveCallsProfileImageUrl(raw || "");
        userOnlineClass =
            otherUser && otherUser.status === "online" ? "online" : "";
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
        otherUserId,
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
    const container = document.querySelector("#all-calls");
    if (!container) return;
    container.innerHTML = ""; // Clear existing calls

    const sortedCalls = Object.values(calls).sort((a, b) => b.currentMills - a.currentMills);

    if (sortedCalls.length === 0) {
        container.innerHTML = '<p>No calls found.</p>';
        return;
    }

    // 1. Process all calls in parallel and wait for the data to be ready
    const promises = sortedCalls.map(call => processCallData(call));
    const renderedData = (await Promise.all(promises)).filter(Boolean); // filter(Boolean) removes any null entries

    await enrichCallRowsFromLaravel(renderedData);

    const allCallsWrap = document.createElement('div');
    allCallsWrap.classList.add('chat-users-wrap');

    // 2. Now that all data is fetched, build the HTML in the correct order
    renderedData.forEach(data => {
        const callItem = document.createElement('div');
        callItem.classList.add('chat-list');
        const imgSrc = escapeAttr(data.profileImage);
        callItem.innerHTML = `
            <a href="#" class="chat-user-list">
                <div class="avatar avatar-lg ${data.userOnlineClass} me-2">
                    <img src="${imgSrc}" class="rounded-circle" alt="image">
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
    const container = document.querySelector("#audio-calls");
    if (!container) return;
    container.innerHTML = "";

    const audioCalls = Object.values(calls)
        .filter(call => !call.video) // Filter for audio calls (video is false or undefined)
        .sort((a, b) => b.currentMills - a.currentMills);

    if (audioCalls.length === 0) {
        container.innerHTML = '<p>No audio calls found.</p>';
        return;
    }

    const promises = audioCalls.map(call => processCallData(call));
    const renderedData = (await Promise.all(promises)).filter(Boolean);

    await enrichCallRowsFromLaravel(renderedData);

    const audioCallsWrap = document.createElement('div');
    audioCallsWrap.classList.add('chat-users-wrap');

    renderedData.forEach(data => {
        const callItem = document.createElement('div');
        callItem.classList.add('chat-list');
        const imgSrc = escapeAttr(data.profileImage);
        callItem.innerHTML = `
            <a href="#" class="chat-user-list">
                <div class="avatar avatar-lg ${data.userOnlineClass} me-2">
                    <img src="${imgSrc}" class="rounded-circle" alt="image">
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
    const container = document.querySelector("#video-calls");
    if (!container) return;
    container.innerHTML = "";

    const videoCalls = Object.values(calls)
        .filter(call => call.video === true) // Filter for video calls
        .sort((a, b) => b.currentMills - a.currentMills);

    if (videoCalls.length === 0) {
        container.innerHTML = '<p>No video calls found.</p>';
        return;
    }

    const promises = videoCalls.map(call => processCallData(call));
    const renderedData = (await Promise.all(promises)).filter(Boolean);

    await enrichCallRowsFromLaravel(renderedData);

    const videoCallsWrap = document.createElement('div');
    videoCallsWrap.classList.add('chat-users-wrap');

    renderedData.forEach(data => {
        const callItem = document.createElement('div');
        callItem.classList.add('chat-list');
        const imgSrc = escapeAttr(data.profileImage);
        callItem.innerHTML = `
            <a href="#" class="chat-user-list">
                <div class="avatar avatar-lg ${data.userOnlineClass} me-2">
                    <img src="${imgSrc}" class="rounded-circle" alt="image">
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

function refreshCallsWelcomeProfileFromLaravel() {
    if (typeof window.syncLaravelUserProfileImages === "function") {
        window.syncLaravelUserProfileImages();
    }
}
if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        refreshCallsWelcomeProfileFromLaravel
    );
} else {
    refreshCallsWelcomeProfileFromLaravel();
}
setTimeout(refreshCallsWelcomeProfileFromLaravel, 300);
setTimeout(refreshCallsWelcomeProfileFromLaravel, 1500);



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
                    <img src="${resolveCallsProfileImageUrl((user.profile_image && String(user.profile_image).trim()) || user.image || '')}" class="rounded-circle" alt="${user.firstName}">
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
const newCallModal = document.getElementById('new-call');
if (newCallModal) {
    newCallModal.addEventListener('show.bs.modal', populateUserList);
}



const searchCallInput = document.getElementById("searchCallInput");
if (searchCallInput) {
    searchCallInput.addEventListener("input", function() {
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
}
});