import { initializeFirebase } from './firebase-user.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';
import { getDatabase, ref, push, onChildAdded, get, onValue  } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js';

initializeFirebase(function (app, auth, database,storage) {

let currentUser = null; // Define the current user here
let selectedUserId = null; // Store the selected user ID

// Monitor the user's authentication state
onAuthStateChanged(auth, (user) => {
   
    if (user) {
        currentUser = user; // Set currentUser to the signed-in user
       
        document.getElementById('user-id').innerText = `Logged in as: ${currentUser.uid}`;

        // Load user list and set initial chat listener
        loadUserList();
    } else {
       
        document.getElementById('user-id').innerText = 'No user logged in';
    }
});

let usersMap = {};

// Function to fetch users from Firebase
function fetchUsers() {
const usersRef = ref(database, 'users'); // Path to your users data


get(usersRef)
.then((snapshot) => {
   
    if (snapshot.exists()) {
        const users = snapshot.val();
       

         // Create a mapping of user IDs to user names
        for (const userId in users) {
            usersMap[userId] = users[userId].first_name + users[userId].last_name; // Store user names in usersMap
        }
        displayUsers(users); // Call function to display users
    } 
})
.catch((error) => {
   
});
}


// Function to display user names in both chat-users-wrap and swiper-slide divs
function displayUsers(users) {
const usersList = document.getElementById("chat-users-wrap"); // Target the chat-users-wrap div
const swiperList = document.querySelector(".swiper-wrapper"); // Target the swiper-wrapper div for swiper slides
usersList.innerHTML = ''; // Clear existing users
swiperList.innerHTML = ''; // Clear existing swiper slides

// Loop through each user object
for (const userId in users) {
const user = users[userId];
if (userId === currentUser.uid) {
    continue; // Skip this user
}

// Create the structure for each user in the chat list
const userDiv = document.createElement("div");
userDiv.classList.add("chat-list");

const userLink = document.createElement("a");
userLink.href = "#"; // Prevent default action
userLink.classList.add("chat-user-list");
userLink.onclick = () => selectUser(userId); // Call selectUser with the userId

const avatarDiv = document.createElement("div");
avatarDiv.classList.add("avatar", "avatar-lg", "online", "me-2");

// Placeholder for avatar image; replace with actual user image if available
const userImage = document.createElement("img");
userImage.src = "assets/img/profiles/avatar-03.jpg"; // Placeholder image
userImage.classList.add("rounded-circle");
userImage.alt = "image";
avatarDiv.appendChild(userImage);

const chatUserInfoDiv = document.createElement("div");
chatUserInfoDiv.classList.add("chat-user-info");

const chatUserMsgDiv = document.createElement("div");
chatUserMsgDiv.classList.add("chat-user-msg");

const userName = document.createElement("h6");
userName.textContent = user.first_name; // Display user_name
chatUserMsgDiv.appendChild(userName);

// Optional message placeholder; can be customized
const userMessage = document.createElement("p");
userMessage.textContent = "Recent message..."; // Placeholder message
chatUserMsgDiv.appendChild(userMessage);

const chatUserTimeDiv = document.createElement("div");
chatUserTimeDiv.classList.add("chat-user-time");

const timeSpan = document.createElement("span");
timeSpan.classList.add("time");
timeSpan.textContent = "03:15 AM"; // Placeholder time

const chatPinDiv = document.createElement("div");
chatPinDiv.classList.add("chat-pin");

const pinIcon = document.createElement("i");
pinIcon.classList.add("ti", "ti-pin", "me-2");

const messageCountSpan = document.createElement("span");
messageCountSpan.classList.add("count-message", "fs-12", "fw-semibold");
messageCountSpan.textContent = "55"; // Placeholder count

// Append elements
chatPinDiv.appendChild(pinIcon);
chatPinDiv.appendChild(messageCountSpan);
chatUserTimeDiv.appendChild(timeSpan);
chatUserTimeDiv.appendChild(chatPinDiv);
chatUserInfoDiv.appendChild(chatUserMsgDiv);
chatUserInfoDiv.appendChild(chatUserTimeDiv);
userLink.appendChild(avatarDiv);
userLink.appendChild(chatUserInfoDiv);
userDiv.appendChild(userLink);

// Append the userDiv to the main users list
usersList.appendChild(userDiv);

// Now, create the swiper-slide structure for the same user
const swiperSlideDiv = document.createElement("div");
swiperSlideDiv.classList.add("swiper-slide");

const swiperUserLink = document.createElement("a");
swiperUserLink.href = "/chat"; // Set route for chat page
swiperUserLink.classList.add("chat-status", "text-center");

const swiperAvatarDiv = document.createElement("div");
swiperAvatarDiv.classList.add("avatar", "avatar-lg", "online", "d-block");

const swiperUserImage = document.createElement("img");
swiperUserImage.src = "assets/img/profiles/avatar-11.jpg"; // Placeholder image
swiperUserImage.classList.add("rounded-circle");
swiperUserImage.alt = "Image";

const userNameP = document.createElement("p");
userNameP.textContent = user.first_name; // Display only the first name

swiperAvatarDiv.appendChild(swiperUserImage);
swiperUserLink.appendChild(swiperAvatarDiv);
swiperUserLink.appendChild(userNameP);
swiperSlideDiv.appendChild(swiperUserLink);

// Append swiperSlideDiv to swiperList
swiperList.appendChild(swiperSlideDiv);
}
}



// Call the fetchUsers function when the page loads
window.onload = fetchUsers;


// Load user list (this is just a dummy function; replace it with actual user loading logic)
function loadUserList() {
    const userList = document.getElementById('user-list');
    // Example user IDs (replace this with actual user IDs from your database)
    const users = ['LgiFT1vjulPNVm362448cl0lPRK2', '0sjGsWBJBBXgSPrEThaWAkZtvEB2', 'oGSAVrc0r4aKsXyhGpFG7dP0Z4C2','OlS3n2rKcnXIF6VOfOrSgxjiPZm2', 'f5qG5kdEcbQf0RVgspqmXrQJx7s2', 'IHswBXCKYUYRBwJq8Mp4DMQdzFp1']; 

    users.forEach(userId => {
        const userElement = document.createElement('div');
        userElement.innerText = userId; // Display user ID (replace with actual user name if available)
        userElement.classList.add('chat-user');
        userElement.onclick = () => selectUser(userId); // Set click event to select user
        userList.appendChild(userElement);
    });
}

// Function to handle user selection
function selectUser(userId) {
selectedUserId = userId; // Set the selected user ID
document.getElementById('chat-box').innerHTML = ''; // Clear the chat box
listenForMessages(currentUser.uid, selectedUserId); // Start listening for messages with the selected user

// Update the chat header with the selected user's name
const userName = usersMap[userId] || 'Unknown User'; // Fetch the user name from the usersMap
document.querySelector('.chat-header h6').textContent = userName; // Set user name in the header

// Optionally, update the online status
document.querySelector('.chat-header .last-seen').textContent = 'Online'; // You can customize this part based on actual status
}

document.getElementById('message-form').addEventListener('submit', function(event) {
event.preventDefault(); // Prevent form submission and page reload
const messageText = document.getElementById('message-input').value;

if (messageText.trim() !== '') {
sendMessage(selectedUserId, messageText); // Call the sendMessage function with the message input
}
});

function sendMessage(toUserId, messageText) {
if (!currentUser) {

return;
}

const message = {
from: currentUser.uid,
to: toUserId,
text: messageText,
timestamp: Date.now()
};



const messageRef = ref(database, 'chats');
push(messageRef, message)
.then(() => {
   
    document.getElementById('message-input').value = ''; // Clear the message input
    // Don't call displayMessage here
})
.catch((error) => {
   
});
}

// Function to listen for new messages
function listenForMessages(fromUserId, toUserId) {

    const messageRef = ref(database, 'chats');

    onChildAdded(messageRef, (snapshot) => {
        const message = snapshot.val();
        // Check if the message is between the two users
        if ((message.from === fromUserId && message.to === toUserId) || 
            (message.from === toUserId && message.to === fromUserId)) {
            displayMessage(message); // Display the message in the UI
        }
    });
}

function formatTimestamp(timestamp) {
const messageDate = new Date(timestamp);
const today = new Date();

// Check if the message is from today
if (messageDate.toDateString() === today.toDateString()) {
// If today, return time only
return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
} else {
// If not today, return date and time
return messageDate.toLocaleDateString() + ' ' + messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
}


function displayMessage(message) {
const chatBox = document.getElementById("chat-box");
const messageElement = document.createElement("div");
const senderName = usersMap[message.from] || message.from;
const formattedTime = formatTimestamp(message.timestamp);

if (message.from === currentUser.uid) {
// Design for "You"
messageElement.innerHTML = `
    <div class="chats chats-right">
        <div class="chat-content">
            <div class="chat-profile-name text-end">
                <h6>You <span class="chat-time">${formattedTime}</span></h6> 
            </div>
            <div class="message-content">
                ${message.text}
            </div>
        </div>
        <div class="chat-avatar">
            <img src="assets/img/profiles/avatar-17.jpg" class="rounded-circle" alt="image">
        </div>
    </div>
`;
} else {
// Design for "Other"
messageElement.innerHTML = `
    <div class="chats">
        <div class="chat-avatar">
            <img src="assets/img/profiles/avatar-06.jpg" class="rounded-circle" alt="image">
        </div>
        <div class="chat-content">
            <div class="chat-profile-name">
                <h6>${senderName} <span class="chat-time">${formattedTime}</span></h6>
            </div>
            <div class="message-content">
                ${message.text}
            </div>
        </div>
    </div>
`;
}

// Append the message directly to chatBox
chatBox.insertAdjacentHTML('beforeend', messageElement.innerHTML);
chatBox.scrollTop = chatBox.scrollHeight;
}

// Function to get current time
function getCurrentTime() {
const now = new Date();
return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}



// Setting up the button click event
document.getElementById("send-button").onclick = function() {
    const messageText = document.getElementById('message-input').value;
    if (messageText && selectedUserId) {
        sendMessage(selectedUserId, messageText); // Send message to the selected user
        document.getElementById('message-input').value = ''; // Clear input field after sending
    }
};
});