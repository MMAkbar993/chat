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
    child,
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

        // Fetch groups or other data
        fetchGroups(currentUserId);
        fetchGroupUsers(currentUserId);
    } else {
        window.location.href = "/login";
    
    }
});

let usersMap = {};

// Function to fetch users from Firebase
function fetchGroupUsers(currentUserId) {
    const contactsRef = ref(database, `data/contacts/${currentUserId}`); // Path to logged-in user's contacts
    
    get(contactsRef)
        .then((snapshot) => {
            if (snapshot.exists()) {
                const contacts = snapshot.val(); // Get all contacts
                const userIds = Object.keys(contacts); // Extract user IDs of the contacts

                if (userIds.length > 0) {
                    const usersRef = ref(database, "data/users"); // Path to your users data

                    get(usersRef).then((userSnapshot) => {
                        if (userSnapshot.exists()) {
                            const users = userSnapshot.val();
                            const usersMap = {};

                            // Create a mapping of user IDs to user details only for the contacts
                            userIds.forEach((userId) => {
                                if (users[userId]) {
                                    usersMap[userId] = {
                                        firstName : users[userId].firstName ,
                                        lastName : users[userId].lastName, 
                                        image:
                                            users[userId].image ||
                                            "assets/img/profiles/avatar-03.jpg", // Fallback profile image
                                    };
                                }
                            });

                            displayGroupUsers(usersMap); // Call function to display users
                        } 
                    }).catch((error) => {
                        if (error == 'Error: Error: Client is offline.') {
                            window.location.href = "/login";
                        }
                    });
                } 
            } 
        })
        .catch((error) => {
            if (error == 'Error: Error: Client is offline.') {
                window.location.href = "/login";
            }
        });
}

// Function to display users in the HTML list
function displayGroupUsers(users, currentUser) {
    const usersContainer = document.getElementById("users-list"); // The div where you want to list users
    usersContainer.innerHTML = ""; // Clear existing content

    for (const userId in users) {
        const user = users[userId];
        const profileImage = user.image || "assets/img/profiles/avatar-03.jpg"; // Fallback image

        // Reference to the contacts node for the current user
        const contactsRef = ref(database, `data/contacts/${currentUserId}/${userId}`);

        onValue(contactsRef, (contactSnapshot) => {
            let displayName = user.userName; // Default to userName
            const contactData = contactSnapshot.val();

            if (contactData && contactData.firstName) {
                displayName = `${contactData.firstName} ${contactData.lastName}`; // If firstName exists in contacts
            } else {
                const userRef = ref(database, `data/users/${userId}`);
                onValue(userRef, (userSnapshot) => {
                    const userData = userSnapshot.val();
                    // if (userData && (userData.firstName || userData.lastName)) {
                    //     // If firstName or lastName exist in users collection, use them
                    //     displayName = `${userData.firstName || ""} ${userData.lastName || ""}`;
                    // } else {
                    //     // If no name exists in either collection, fallback to mobile_number
                    //     displayName = userData.mobile_number || "No Name Available";
                    // }
                    displayName = userData.mobile_number || "No Name Available";
                    // Append the user card dynamically after fetching
                    appendUserCard(usersContainer, displayName, profileImage, user.role, userId);
                });
                return; // Exit to prevent premature rendering
            }

            // Append the user card dynamically
            appendUserCard(usersContainer, displayName, profileImage, user.role, userId);
        });
    }
}

// Helper function to append user card
function appendUserCard(container, displayName, profileImage, role, userId) {
    const userHtml = `
        <div class="contact-user">
            <div class="d-flex align-items-center justify-content-between">
                <div class="d-flex align-items-center">
                    <div class="avatar avatar-lg">
                        <img src="${profileImage}" class="rounded-circle" alt="image">
                    </div>
                    <div class="ms-2">
                        <h6>${capitalizeFirstLetter(displayName)}</h6>
                        <p>${role ? role : ""}</p>
                    </div>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" name="contact" value="${userId}">
                </div>                                       
            </div>
        </div>
    `;
    container.innerHTML += userHtml; // Append user card to the container
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
const selectedMembers = [];

// Group creation event listener
document.getElementById('start-group').addEventListener('click', function (e) {
    e.preventDefault(); // Prevent default button behavior

    // Disable the button to prevent multiple clicks
    const startGroupButton = document.getElementById('start-group');
    startGroupButton.disabled = true;
    startGroupButton.textContent = "Creating..."; // Optionally update the button text to indicate the process is running

    // Fetching input elements by ID
    const groupNameInput = document.getElementById('group-names'); // Group name input
    const aboutInput = document.getElementById('group-about'); // About input
   // const groupTypeInput = document.querySelector('input[name="group-type"]:checked'); // Group type input

    // Check if the inputs are valid
    if (!groupNameInput || !aboutInput ) {
        Swal.fire({
            title: "",
            width: 400,
            text: "Please fill in all required fields.",
            icon: "error",
        });
        startGroupButton.disabled = false; // Re-enable the button on error
        startGroupButton.textContent = "Start Group"; // Reset the button text
        return;
    }

    // Fetching input values and trimming them
    const groupName = groupNameInput.value.trim(); // Group name
    const about = aboutInput.value.trim(); // About
    //const groupType = groupTypeInput.value; // Group type

    // Check if groupName and about are not empty
    if (!groupName || !about) {
        Swal.fire({
            title: "",
            width: 400,
            text: "Please fill in all required fields.",
            icon: "error",
        });
        startGroupButton.disabled = false; // Re-enable the button on error
        startGroupButton.textContent = "Start Group"; // Reset the button text
        return;
    }

    // Collect selected member IDs
   
    document.querySelectorAll('#users-list input[type="checkbox"]:checked').forEach((checkbox) => {
        selectedMembers.push(checkbox.value); // Push member ID
    });

    // Check if any members are selected
    if (selectedMembers.length === 0) {
        alert('Please select at least one member.');
        startGroupButton.disabled = false; // Re-enable the button on error
        startGroupButton.textContent = "Start Group"; // Reset the button text
        return;
    }

    // Create a new group in the database
    //const newGroupKey = push(ref(database, 'data/groups/')).currentUserId + "_" + Date.now(); // Create a new group key
    const newGroupKey = currentUserId + "_" + Date.now();
    selectedMembers.push(currentUserId);
    const groupData = {
        group_id: newGroupKey,
        id:"group_" + newGroupKey,
        groupName: groupName,
        name:groupName,
        status: about,
        about: about,
        userIds:selectedMembers,
        createdBy: currentUserId,
        admin:currentUserId,
        date: Date.now(),
        createdAt: Date.now() // Add timestamp
    };
    // Handle avatar upload
    const fileInputGroup = document.getElementById('avatar-upload');
    if (fileInputGroup && fileInputGroup.files.length > 0) {
        const file = fileInputGroup.files[0];
        const avatarPath = `avatars/${newGroupKey}/${file.name}`; // Construct avatar file path
        const avatarStorageRef = storageRef(storage, avatarPath);

        // Upload avatar to Firebase Storage
        uploadBytes(avatarStorageRef, file).then((snapshot) => {
            getDownloadURL(avatarStorageRef).then((downloadURL) => {
                groupData.image = downloadURL;
                groupData.image = downloadURL;

                // Save group data including avatar URL to Firebase
                set(ref(database, 'data/groups/' + 'group_' + newGroupKey), groupData)
                    .then(() => {
                        document.getElementById("group-form").reset();
                        document.getElementById("add-members-form").reset(); // Clear the form
                        $("#add-group").modal("hide");
                        $("#new-group").modal("hide");
                        Swal.fire({
                            title: "",
                            width: 400,
                            text: "Group created successfully!",
                            icon: "success",
                        });
                        window.location.href = '/group-chat';
                    })
                    .catch((error) => {
                        startGroupButton.disabled = false; // Re-enable the button on error
                        startGroupButton.textContent = "Start Group"; // Reset the button text
                    });
            }).catch((error) => {
                startGroupButton.disabled = false; // Re-enable the button on error
                startGroupButton.textContent = "Start Group"; // Reset the button text
            });
        }).catch((error) => {
            startGroupButton.disabled = false; // Re-enable the button on error
            startGroupButton.textContent = "Start Group"; // Reset the button text
        });
    } else {
     

        // Save group data without avatar
        set(ref(database, 'data/groups/group_' + newGroupKey), groupData)
            .then(() => {
                Swal.fire({
                    title: "",
                    width: 400,
                    text: "Group created successfully!",
                    icon: "success",
                });
                        window.location.href = '/group-chat';
               
                        closePopup(); // Call a function to close the popup
                        $('#add-group').modal('hide'); // Close the "Add Group" modal
                        $('#new-group').modal('hide');
            })
            .catch((error) => {
                startGroupButton.disabled = false; // Re-enable the button on error
                startGroupButton.textContent = "Start Group"; // Reset the button text
            });
    }
});

document.querySelector('#cancle-btn-group').addEventListener('click', function () {
     document.getElementById("group-names").value = '';
     document.getElementById("group-about").value = '';
     document.getElementById('group-type').checked = false;
     document.getElementById("groupcontactSearchInput").value = '';
     document.querySelectorAll('.contact-user .form-check-input').forEach(checkbox => {
        checkbox.checked = false;
    });

    searchbtn =  document.getElementById("groupcontactSearchInput").value;
    searchbtn.dispatchEvent(new Event("input")); // Trigger the input event to refresh the contact list
    
});
   
document.querySelector('#group-add-cancle-btn').addEventListener('click', function () {
    document.getElementById("group-names").value = '';
    document.getElementById("group-about").value = '';
    document.getElementById('group-type').checked = false;
    document.getElementById("groupcontactSearchInput").value = '';
    document.querySelectorAll('.contact-user .form-check-input').forEach(checkbox => {
        checkbox.checked = false;
    });
    
   
});

document.querySelector('#canlce-btn-search').addEventListener('click', function () {
    document.getElementById("group-names").value = '';
    document.getElementById("group-about").value = '';
    document.getElementById("groupcontactSearchInput").value = '';
    document.getElementById('group-type').checked = false;
    document.querySelectorAll('.contact-user .form-check-input').forEach(checkbox => {
        checkbox.checked = false;
    });
   
});

document.getElementById('avatar-upload').addEventListener('change', function (event) {
    const file = event.target.files[0]; // Get the selected file
    const preview = document.getElementById('avatar-preview'); // Get the image preview element

    // Check if a file is selected
    if (file) {
        const reader = new FileReader(); // Create a FileReader object

        reader.onload = function (e) {
            preview.src = e.target.result; // Set the src of the preview to the file's result
            preview.style.display = 'block'; // Show the preview
        };

        reader.readAsDataURL(file); // Read the file as a Data URL
    } else {
        preview.style.display = 'none'; // Hide the preview if no file is selected
    }
});

// Function to close the popup
function closePopup() {
    // Logic to close the popup/modal
    document.getElementById("group-names").value = "";
    document.getElementById("group-about").value = "";
    document.querySelector('input[name="group-type"]:checked').checked = false;
    document
        .querySelectorAll('#users-list input[type="checkbox"]')
        .forEach((checkbox) => {
            checkbox.checked = false; // Uncheck all checkboxes
        });
}

// Fetch groups from Firebase
const groupsRef = ref(database, "data/groups/");
onValue(groupsRef, (snapshot) => {
    const groups = snapshot.val();
    displayGroups(groups);
});

let selectedGroupId = null; // Declare a variable to hold the selected group ID globally
let previousMessagesRef = null; // Store previous messages reference for detaching listeners

// Function to display groups and set click event listeners
function displayGroups(groups, currentUserId) {
    const chatUsersWrap = document.querySelector("#group-list"); // The container for the groups
    chatUsersWrap.innerHTML = ""; // Clear existing content

    const groupPromises = Object.keys(groups).map(groupId => {
        const group = groups[groupId];

        // Only proceed if the logged-in user is a member of this group
        if (group.userIds && group.userIds.includes(currentUserId)) {
            // Fetch the latest message for the group
            return getLatestMessageForGroup(groupId)
                .then(async latestMessage => {
                    // Decrypt and format the message if available
                    let displayMessage = "";
                    if (latestMessage) {
                        const messageType = latestMessage.attachmentType || "unknown";
                        if (messageType === 6) {
                            try {
                                const originalMessage = await decryptlibsodiumMessage(latestMessage.body);
                                displayMessage = originalMessage || "";
                            } catch (e) {
                            
                                displayMessage = "Encrypted message";
                            }
                        } else if (messageType === 5) {
                            displayMessage = "File sent";
                        } else if (messageType === 2) {
                            displayMessage = "Image sent";
                        } else if (messageType === 6) {
                            displayMessage = "Emoji";
                        } else if (messageType === 1) {
                            displayMessage = "Video sent";
                        } else if (messageType === 3) {
                            displayMessage = "Audio sent";
                        } else {
                            displayMessage = "Unknown message type";
                        }
                    }

                    return {
                        groupId,
                        ...group,
                        latestMessageTimestamp: latestMessage ? latestMessage.timestamp : group.date, // Fallback to group creation time
                        displayMessage
                    };
                })
                .catch(() => ({
                    groupId,
                    ...group,
                    latestMessageTimestamp: group.date, // Fallback in case of error
                    displayMessage: ""
                }));
        } else {
            // Return null if the user is not a member of the group
            return Promise.resolve(null);
        }
    });

    // Wait for all group promises to resolve
    Promise.all(groupPromises).then(groupsWithLatestMessage => {
        // Filter out null values (non-member groups)
        const filteredGroups = groupsWithLatestMessage.filter(group => group !== null);

        // Sort groups by the most recent message or creation date
        filteredGroups.sort((a, b) => {
            return new Date(b.latestMessageTimestamp) - new Date(a.latestMessageTimestamp);
        });

        // Now display the filtered and sorted groups
        filteredGroups.forEach(group => {
            const AvatarURL = group.image || "assets/img/profiles/avatar-03.jpg"; // Fallback image
            const formattedTime = formatedTimestamp(group.latestMessageTimestamp);

            // Create the HTML for each group
            const groupHtml = `
                <div class="chat-list" data-group-id="${group.groupId}">
                    <a href="#" class="chat-user-list">
                        <div class="avatar avatar-lg me-2">
                             <img src="${AvatarURL}" class="rounded-circle" alt="image">
                        </div>
                        <div class="chat-user-info">
                            <div class="chat-user-msg">
                                <h6>${group.name}</h6>
                                <p>${group.displayMessage}</p>
                            </div>
                            <div class="chat-user-time">
                                <span class="time">${formattedTime}</span>
                                <div class="chat-pin">
                                </div>
                            </div>    
                        </div>
                    </a>
                </div>
            `;

            chatUsersWrap.innerHTML += groupHtml; // Append group to the container
        });

        // Add click event to each group to load messages and set selected group ID
        document.querySelectorAll(".chat-list").forEach((group) => {
            group.addEventListener("click", () => {
                selectedGroupId = group.getAttribute("data-group-id"); // Set the global selected group ID
                loadGroupMessages(selectedGroupId); // Call function to load messages for the clicked group
                loadGroupDetails(selectedGroupId); // Pass the selected group ID
            });
        });
    });
}

function formatedTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();

    // Reset time for accurate day comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    // Check if the timestamp is today
    if (date >= today) {
        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, "0");
        const period = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12; // Convert 0 to 12 for midnight
        return `${hours}:${minutes} ${period}`;
    }
    // Check if the timestamp is yesterday
    else if (date >= yesterday) {
        return "Yesterday";
    }
    // Format as MM/DD/YYYY for older dates
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Month is 0-based
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
}

function getLatestMessageForGroup(groupId) {
    highlightActiveGroup(groupId);
    const messagesRef = ref(database, `data/chats/${groupId}`);

    // Query to get the last message
    return get(messagesRef)
        .then(snapshot => {
            if (snapshot.exists()) {
                const messages = snapshot.val();
                const messageArray = Object.values(messages);
                const latestMessage = messageArray.reduce((latest, current) => {
                    return current.timestamp > latest.timestamp ? current : latest;
                });
                return latestMessage;
            } else {
                return null; // No messages found
            }
        })
        .catch(error => {
            return null; // Return null if there's an error
        });
        
}

// Function to format the timestamp into a readable time
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();

    // Check if the timestamp is from today
    const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const period = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12; // Convert 0 to 12 for midnight
    const time = `${hours}:${minutes} ${period}`;

    if (isToday) {
        // Return just the time if it's today
        return time;
    } else {
        // Format the date as MM/DD/YYYY and append the time
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Month is 0-based
        const year = date.getFullYear();
        return `${month}/${day}/${year} ${time}`;
    }
}

// Function to get users data from Firebase Realtime Database
function getUsers() {
    const usersRef = ref(database, "data/users"); // Path to your users data

    return get(usersRef)
        .then((snapshot) => {
            if (snapshot.exists()) {
                return snapshot.val(); // Return the users data
            } else {
                return {};
            }
        })
        .catch((error) => {
            return {};
        });
}

// Function to load group details
function loadGroupDetails(groupId) {
   
    const groupRef = ref(database, `data/groups/${groupId}`); // Path to your group data

    // Get group details
    get(groupRef)
        .then((snapshot) => {
            if (snapshot.exists()) {
                const groupData = snapshot.val();
               
                // Update group name and member count
                document.getElementById("group-name").innerText = groupData.name; // Update group name
                document.getElementById("group_id").innerText = groupData.name; // Update group name
                document.getElementById("group_image").src = groupData.image || 'assets/img/profiles/avatar-03.jpg'; // Update group name
                document.getElementById("group-member-count").innerText = `${groupData.userIds.length} Members`; // Update member count
                document.getElementById("welcome-container").style.setProperty("display", "none", "important"); // Hide welcome content
                document.getElementById("middle").style.display = "block"; // Show chat content

                // Load chat messages or any other group-specific data here if needed
                loadChatMessages(groupId);
            }
        })
        .catch((error) => {
        
        });
}

function loadChatMessages(groupId) {
    // Implement the logic to load and display chat messages for the group
    const messagesRef = ref(database, `data/chats/${groupId}`); // Path to your messages data

    get(messagesRef)
        .then((snapshot) => {
            if (snapshot.exists()) {
                const messages = snapshot.val();
                // Clear existing messages
                const messagesContainer =
                    document.getElementById("chat-messages");
                messagesContainer.innerHTML = ""; // Clear existing messages

                // Loop through messages and append to the chat
                // for (const messageId in messages) {
                //     const message = messages[messageId];
                //     const messageHtml = `
                //         <div class="message">
                //             <p>${message.sender}: ${message.content}</p>
                //         </div>`;
                //     messagesContainer.innerHTML += messageHtml; // Append new message
                // }
            }
             // Scroll to the bottom
             messagesContainer.scrollTop = messagesContainer.scrollHeight;
        })
        .catch((error) => {
       
        });
}

// Call loadGroupDetails when a group is clicked
document.querySelectorAll(".group-item").forEach((item) => {
    item.addEventListener("click", (event) => {
        const groupId = item.getAttribute("data-group-id"); // Assuming you have a data attribute with group ID
        loadGroupDetails(groupId);
    });
});

function loadGroupMessages(groupId) {
    highlightActiveGroup(groupId);
    const messagesRef = ref(database, `data/chats/${groupId}`);
    if (previousMessagesRef) {
        off(previousMessagesRef);
    }
    previousMessagesRef = messagesRef;
    const messagesContainer = document.getElementById("chat-messages");

    if (!messagesContainer) {
        return;
    }

    messagesContainer.innerHTML = "";
    const loggedInUserId = currentUserId;

    getUsers().then((users) => {
        onValue(messagesRef, (snapshot) => {
            messagesContainer.innerHTML = "";
            if (!snapshot.exists()) {
                //console.log("No messages found for this group.");
                return;
            }
           
            snapshot.forEach((childSnapshot) => {
                const messageData = childSnapshot.val();
                const messageKey = childSnapshot.key;  // This is the key you need
                const formattedTime = formatTimestamp(messageData.timestamp);
                const type= messageData.attachmentType;

                // Initialize default sender details
                let senderName = "Unknown";
                let senderImage = "assets/img/profiles/avatar-03.jpg";
    
                // Fetch contact details first
                const contactRef = ref(database, `data/users/${loggedInUserId}/contacts/${messageData.senderId}`);
                get(contactRef).then(async (contactSnapshot) => {
                    if (contactSnapshot.exists()) {
                        const contactData = contactSnapshot.val();
                        senderName = contactData.firstName || contactData.lastName 
                            ? `${contactData.firstName || ""} ${contactData.lastName || ""}`.trim()
                            : senderName;
                        senderImage = contactData.image || senderImage;
                    } else if (users[messageData.senderId]) {
                        // Fallback to users collection if contact data isn't available
                        const userData = users[messageData.senderId];
                        senderName = `${userData.mobile_number}`;
                        senderImage = userData.image || senderImage;
                    }
    
                    const forwardedLabel = messageData.isForward
                    ? `<div class="forwarded-label" style="color: #FFF; font-size: 12px; margin-bottom: 5px;">
                            <i class="ti ti-arrow-forward-up me-2t"></i>
                            Forwarded
                       </div>`
                    : "";

                    // Decrypt message content
                    let messageContent = "";
                    let replyContent = "";
                    let forwardContent = "";

                    if (messageData.attachmentType === 6) {
                        messageContent = await decryptlibsodiumMessage(messageData.body);
                    } else {
                       
                     
                            if (messageData.attachmentType === 3) {
                                messageContent = `<audio controls src="${messageData.attachment.url}"></audio>`;
                            }  else if (messageData.attachmentType === 2) {
                                    messageContent = `<img src="${messageData.attachment.url}" alt="Image Preview" class="message-image-preview video-style"></img>`;
                                } 
                            else if (messageData.attachmentType === 1) {
                                messageContent = `<video width="200" controls src="${messageData.attachment.url}"></video>`;
                            } else if (messageData.attachmentType === 5) {
                                messageContent = `<a href="${messageData.attachment.url}" target="_blank" download>Download ${messageData.fileName || 'File'}</a>`;
                            } else {
                                messageContent = "Unsupported message type.";
                            }
                        
                    }

                      // If the message is a reply, fetch the original message and show its content
                      if (messageData.replyId != "0") {
                        try {
                            const originalMessageRef = ref(database, `data/chats/${groupId}/${messageData.replyId}`);
                            const snapshot = await get(originalMessageRef);

                            if (snapshot.exists()) {
                                const originalMessageData = snapshot.val();
                                const originalMessageType = originalMessageData.attachmentType.toString();

                                switch (originalMessageType) {
                                    case "6": // Text Message
                                        const decryptedReplyContent = await decryptlibsodiumMessage(originalMessageData.body);
                                        const sanitizedReplyContent = decryptedReplyContent.trim();
                                        replyContent = `<div>${sanitizedReplyContent}</div>`;

                                        break;
                                    case "2": // Image
                                        replyContent = `<img src="${originalMessageData.attachment.url}" alt="Image" style="max-height: 70px; border-radius: 5px;">`;
                                        break;
                                    case "3": // Audio
                                        replyContent = `<div><i class="ti ti-microphone"></i> Audio</div>`;
                                        break;
                                    case "1": // Video
                                        replyContent = `<div><i class="ti ti-video"></i> Video</div>`;
                                        break;
                                    case "5": // File/Document
                                        replyContent = `<div><i class="ti ti-file"></i> File</div>`;
                                        break;
                                    default:
                                        replyContent = "<div>Unsupported reply content</div>";
                                }
                            } else {
                                replyContent = "<div>[Original message not found]</div>";
                            }
                        } catch (error) {
                            console.error("Error processing reply:", error);
                            replyContent = "[Decryption Error]";
                        }
                    }
    
                const messageBody = `
                <div>${messageContent}</div>`;
                    // Determine the status icon based on delivered and readMsg status
                    let statusIcon = "";
                    // if (!messageData.delivered && !messageData.readMsg) {
                    //     statusIcon = `<i class="ti ti-check"></i>`; // Single tick
                    // } else if (messageData.delivered && !messageData.readMsg) {
                    //     statusIcon = `<i class="ti ti-checks"></i>`; // Double ticks, not read
                    // } else if (messageData.delivered && messageData.readMsg) {
                    //     statusIcon = `<i class="ti ti-checks text-success"></i>`; // Double ticks, read
                    // }

                    if (messageData.clearedFor && messageData.clearedFor.includes(currentUserId)) {
                        return; // Skip displaying the message
                    }

                    if (messageData.deletedFor && messageData.deletedFor.includes(currentUserId)) {
                        return; // Skip displaying the message
                    }
                    // Construct message HTML
                    let messageHTML = "";
                    if (messageData.senderId === loggedInUserId) {                       
                        if (messageData.deletedForMe) {
                            // Remove the message element from the DOM
                            messageElement.remove();
                            return; // Exit the function early to avoid further processing for this message
                        }
                        messageHTML = `
                            <div class="chats chats-right" data-group-id="${groupId}" data-message-key="${messageKey}" data-type="${type}">
                                <div class="chat-content">
                                    <div class="chat-profile-name text-end">
                                        <h6>You <i class="ti ti-circle-filled fs-7 mx-2"></i><span class="chat-time">${formattedTime}</span>
                                        <span class="msg-read">${statusIcon}</span>
                                        </h6> 
                                    </div>
                                    <div class="chat-info">
                                        <div class="chat-actions">
                                        <a class="#" href="#" data-bs-toggle="dropdown">
                                            <i class="ti ti-dots-vertical"></i>
                                        </a>
                                        <ul class="dropdown-menu dropdown-menu-end p-3">
                                            <li><a class="dropdown-item reply-btn" href="#"><i class="ti ti-corner-up-left me-2"></i>Reply</a></li>
                                            <li><a class="dropdown-item forward-btn" href="#"><i class="ti ti-arrow-forward-up me-2"></i>Forward</a></li>
                                            <li><a class="dropdown-item delete-btn" href="#" data-bs-toggle="modal" data-bs-target="#message-delete"><i class="ti ti-trash me-2"></i>Delete</a></li>
                                        </ul>
                                        </div>   
                                        <div class="message-content">
                                        ${forwardedLabel} <!-- Forwarded Label -->
                                        ${messageData.replyId != "0" ? `<div class="message-reply">${replyContent}</div>` : ""} <!-- Reply Content only if it's a reply -->
                                            ${messageBody} <!-- Default Message -->
                                        </div>   
                                    </div>
                                </div>
                                <div class="chat-avatar">
                                    <img src="${senderImage}" class="rounded-circle" alt="image">
                                </div>
                            </div>
                        `;
                    } else {
                        messageHTML = `
                            <div class="chats" data-group-id="${groupId}" data-message-key="${messageKey}" data-type="${type}">
                                <div class="chat-avatar">
                                    <img src="${senderImage}" class="rounded-circle" alt="image">
                                </div>
                                <div class="chat-content">
                                    <div class="chat-profile-name">
                                        <h6>${senderName} <i class="ti ti-circle-filled fs-7 mx-2"></i><span class="chat-time">${formattedTime}</span>
                                        <span class="msg-read">${statusIcon}</span>
                                        </h6>
                                    </div>
                                    <div class="chat-info">
                                    <div class="message-content">
                                        ${forwardedLabel} <!-- Forwarded Label -->
                                        ${messageData.replyId != "0" ? `<div class="message-reply">${replyContent}</div>` : ""} <!-- Reply Content only if it's a reply -->
                                            ${messageBody} <!-- Default Message -->
                                        </div>  
                                        <div class="chat-actions">
                                            <a class="#" href="#" data-bs-toggle="dropdown">
                                                <i class="ti ti-dots-vertical"></i>
                                            </a>
                                            <ul class="dropdown-menu dropdown-menu-end p-3">
                                                <li><a class="dropdown-item reply-btn" href="#"><i class="ti ti-corner-up-left me-2"></i>Reply</a></li>
                                                <li><a class="dropdown-item forward-btn" href="#"><i class="ti ti-arrow-forward-up me-2"></i>Forward</a></li>
                                                <li><a class="dropdown-item delete-btn" href="#" data-bs-toggle="modal" data-bs-target="#message-delete"><i class="ti ti-trash me-2"></i>Delete</a></li>
                                            </ul>
                                        </div>   
                                         
                                    </div>
                                </div>
                            </div>
                        `;
                    }
    
                    messagesContainer.innerHTML += messageHTML;
                });
            });
    
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        });
    });
    
}


// Group fetching function
function fetchGroups(currentUserId) {
    const groupsRef = ref(database, "data/groups/");
    onValue(
        groupsRef,
        (snapshot) => {
            const groups = snapshot.val();

            if (groups) {
                displayGroups(groups, currentUserId); // Display groups
            } 
        },
        (error) => {
           
        }
    );
}

const sendMessageButton = document.getElementById("send-message");
const fileInputGroup = document.getElementById("files-new");
const messageInputGroup = document.getElementById("message-input");// Make sure to add this div in HTML if not already present
const messagePreview = document.createElement("div");
    messagePreview.id = "message-preview-container"; // A container to preview uploaded files
    messagePreview.style.display = "flex";
    messagePreview.style.alignItems = "center";
    messagePreview.style.marginTop = "10px";
  // Create the Clear button
  const clearButton = document.createElement("button");
  clearButton.id = "image-clear-button";
  clearButton.textContent = "X";
  clearButton.style.marginLeft = "10px";
  clearButton.style.display = "none"; // Initially hidden

document.querySelector('.chat-footer-wrap').appendChild(messagePreview);
messagePreview.appendChild(clearButton);
const secretKey = "89def69f0bdddc995078037539dc6ef4f0bdbdd3fa04ef2d11eea30779d72ac6"; // Replace with your actual secret key

// Function to send message
if (sendMessageButton) {
    sendMessageButton.onclick = async function (e) {
        e.preventDefault(); // Prevent page reload
        
        const messageText = messageInputGroup?.value;
        const selectedFile = fileInputGroup?.files[0];
        sendMessageButton.disabled = true;
        if (messageText || selectedFile) {
            if (messageText) {
                let type = 6;

                // Check if the message contains emojis
                if (containsEmoji(messageText)) {
                    type = 6; // Mark message type as emoji if applicable
                }

                // Encrypt text message
                encryptMessage(messageText).then(ciphertext => {
                    if (ciphertext) {
                        sendGroupMessage(selectedGroupId, ciphertext, type);
                        // Use ciphertext here, e.g., send to server or display
                    } else {
                        console.error('Failed to retrieve encrypted text.');
                    }
                });
              
            }
            if (selectedFile) {
                // Upload file to Firebase Storage (image, document, audio, etc.)
                const fileUrl = await uploadFileToFirebase(selectedFile);
                
                // Encrypt file URL
                //const encryptedFileUrl = await encryptMessage(fileUrl);
                const fileType = selectedFile.type.split('/')[0]; // Get type (e.g., 'image', 'audio', 'video', 'application')

                let attachment = {
                    bytesCount : selectedFile.size,
                    name : selectedFile.name,
                    url : fileUrl
                }

                // Determine the message type based on file type
                let messageType;
                switch (fileType) {
                    case 'image':
                        messageType = 2;
                        break;
                    case 'audio':
                        messageType = 3;
                        break;
                    case 'video':
                        messageType = 1;
                        break;
                    default:
                        messageType = 5; // For documents or other files
                        break;
                }
                
                sendGroupMessage(selectedGroupId, attachment, messageType);
            }

            // Clear input fields after sending
            messageInputGroup.value = "";
            fileInputGroup.value = "";
            messagePreview.innerHTML = ""; // Clear file preview
            clearButton.style.display = "none";
        } 
        sendMessageButton.disabled = false;
    };
}

// Show a file preview when a file is selected
fileInputGroup.onchange = function () {
    const selectedFile = fileInputGroup.files[0];

    if (selectedFile) {
        const fileType = selectedFile.type.split('/')[0]; // Get type (e.g., 'image', 'audio', 'video', 'application')
        let filePreview;

        // Display different previews based on file type
        if (fileType === 2) {
            filePreview = `<img src="${URL.createObjectURL(selectedFile)}" alt="Image Preview" class="preview-image">`;
        } else if (fileType === 3) {
            filePreview = `<audio controls>
                               <source src="${URL.createObjectURL(selectedFile)}" type="${selectedFile.type}">
                             
                           </audio>`;
        } else if (fileType === 1) {
            filePreview = `<video width="200" controls>
                               <source src="${URL.createObjectURL(selectedFile)}" type="${selectedFile.type}">
                              
                           </video>`;
        } else {
            filePreview = `<p>File Selected: ${selectedFile.name}</p>`; // For other file types like documents
        }

        messagePreview.innerHTML = filePreview;
        messagePreview.appendChild(clearButton); // Add Clear button to the preview
        clearButton.style.display = "inline-block";
        messageInputGroup.focus();
    }
};
    // Clear the file selection and preview when Clear button is clicked
    clearButton.onclick = function () {
        fileInputGroup.value = ""; // Reset the file input
        messagePreview.innerHTML = ""; // Clear the preview content
        clearButton.style.display = "none"; // Hide Clear button
    };
// Emoji insertion into message input
document.querySelectorAll('.emoj-group-list-foot a').forEach(function (emojiBtn) {
    emojiBtn.onclick = function () {
        const emoji = emojiBtn.querySelector('img').alt; // Get emoji alt text
        messageInputGroup.value += emoji; // Insert emoji into the text input
        messageInputGroup.focus(); // Focus the input field
        messageInputGroup.selectionStart = messageInputGroup.selectionEnd = messageInput.value.length; // Move cursor to the end
    };
});

// Function to upload file to Firebase Storage and get URL
async function uploadFileToFirebase(file) {
    const fileStorageRef = storageRef(storage, `chats/${currentUserId}/${file.name}`);
    await uploadBytes(fileStorageRef, file); // Upload file to Firebase Storage
    const fileUrl = await getDownloadURL(fileStorageRef); // Get the file's URL
    return fileUrl; // Return the uploaded file URL
}

// Helper function to check if text contains emojis
function containsEmoji(text) {
    if(text == 6){
        let text_new = "emoji";
        const emojiRegex = /[\u{1F600}-\u{1F64F}]/u; // Regex to detect emojis
        return emojiRegex.test(text_new);
    } 
    
}

//Audio call
// =========================================================================
//         COMPLETE GROUP AUDIO CALL SCRIPT FOR FIREBASE & AGORA
// =========================================================================
// HTML Requirements:
// 1. An incoming call modal with ID: "audio-call-new-group"
// 2. An active call modal with ID: "audio_group_new"
// 3. Buttons with the IDs used in the 'DOM element references' section below.
// =========================================================================

// Agora and Firebase SDK functions (ensure these are imported in your main script/HTML)
// import { ref, onValue, get, set, update, child, push } from "firebase/database";
// import { auth, database } from "./firebase-config.js";

// -------------------
// CONFIG & INITIALIZATION
// -------------------
// =========================================================================
//         COMPLETE GROUP AUDIO CALL SCRIPT FOR FIREBASE & AGORA
// =========================================================================
// HTML Requirements:
// 1. An incoming call modal with ID: "audio-call-new-group"
// 2. An active call modal with ID: "audio_group_new"
// 3. Buttons with the IDs used in the 'DOM element references' section below.
// =========================================================================

// Agora and Firebase SDK functions (ensure these are imported in your main script/HTML)
// import { ref, onValue, get, set, update, child, push } from "firebase/database";
// import { auth, database } from "./firebase-config.js";

// -------------------
// CONFIG & INITIALIZATION
// -------------------
// =========================================================================
//         COMPLETE GROUP AUDIO CALL SCRIPT FOR FIREBASE & AGORA
// =========================================================================

// -------------------
// CONFIG & INITIALIZATION
// -------------------
// =========================================================================
//         COMPLETE GROUP AUDIO CALL SCRIPT FOR FIREBASE & AGORA
// =========================================================================

// -------------------
// CONFIG & INITIALIZATION
// -------------------
// =================================================================================
//         COMPLETE SCRIPT FOR GROUP AUDIO & VIDEO CALLS (FIREBASE & AGORA)
// =================================================================================

// -------------------
// CONFIG & INITIALIZATION
// -------------------
const APP_ID = "e368b7a2b5d84c34a1b31da838758a32";
let audioClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

// Global state variables
let localAudioTrack = null;
let localVideoTrack = null; // For Video Calls
let callTimerInterval = null;
let currentCallId = null;

// Firebase references
const callRef = ref(database, 'data/calls');
const usersRef = ref(database, 'data/users');

// DOM element references
// Audio Buttons
const audioCallButton = document.getElementById("audio-new-btn-group");
const joinAudioCallButton = document.getElementById('join-audio-group');
const endAudioCallButton = document.getElementById("leave-group-audio");
const muteAudioButton = document.getElementById("mute-audio-group-btn");
const declineAudioCallButton = document.getElementById("decline-audio-group");

// Video Buttons
const videoCallButton = document.getElementById("video-call-new-btn-group"); // ASSUMING this is the ID for the video call button
const joinVideoCallButton = document.getElementById('join-group');
const endVideoCallButton = document.getElementById("leave-group-video1");
const muteVideoButton = document.getElementById("mute-group-btn"); // Audio mute in video call
const disableVideoButton = document.getElementById("video-group-btn"); // Video on/off
const declineVideoCallButton = document.getElementById("decline-group");

// -------------------
// 1. GENERIC CALL INITIATION
// -------------------

/**
 * A generic function to initiate a group call (audio or video).
 * @param {boolean} isVideoCall - True if initiating a video call, false for audio.
 */
async function initiateGroupCall(isVideoCall) {
    if (!selectedGroupId) { console.error("No group selected for the call."); return; }
    const currentUser = auth.currentUser;
    if (!currentUser) { console.error("User not authenticated."); return; }

    try {
        const callerId = currentUser.uid;
        const groupsRef = ref(database, 'data/groups');
        const groupRef = child(groupsRef, selectedGroupId);
        const groupSnapshot = await get(groupRef);
        if (!groupSnapshot.exists()) { console.error("Group does not exist."); return; }
        
        const groupData = groupSnapshot.val();
        const memberIds = groupData.userIds || [];
        if (memberIds.length <= 1) { console.error("Group must have more than one member."); return; }
        const receiverIds = memberIds.filter(id => id !== callerId);
        
        const userDetailPromises = memberIds.map(id => get(child(usersRef, id)));
        const userSnapshots = await Promise.all(userDetailPromises);
        const userDataMap = new Map();
        userSnapshots.forEach(snap => { if (snap.exists()) { userDataMap.set(snap.key, snap.val()); } });
        
        const callerData = userDataMap.get(callerId);
        if (!callerData) { console.error("Could not fetch caller's details."); return; }
        
        const callerMobile = callerData.mobile_number || callerId;
        const newCallId = push(ref(database, 'data/calls')).key;
        const channelName = newCallId;
        const groupNameForCall = groupData.groupName || "Group Call";
        const groupImageForCall = groupData.image || 'assets/img/profiles/avatar-19.jpg';

        const baseCallData = {
            callerImg: groupImageForCall, callerName: groupNameForCall, currentMills: Date.now(),
            duration: "Ringing", id: newCallId, type: "group", 
            video: isVideoCall, // The key difference!
            channelName: channelName,
        };
        console.log(isVideoCall);
        const callTypeForNotif = isVideoCall ? "Video" : "Audio";
        const promises = [];
        const callerCallData = { ...baseCallData, inOrOut: "OUT", userId: callerId, callerId: receiverIds };
        promises.push(set(ref(database, `data/calls/${callerId}/${newCallId}`), callerCallData));
        const callerIncomingCallString = `user_type=group&call_type=${isVideoCall ? 'video' : 'audio'}&channelname=${channelName}&caller=${callerMobile}&group=${selectedGroupId}&currentuser=${callerMobile}`;
        promises.push(update(child(usersRef, callerId), { incomingcall: callerIncomingCallString, call_status: false }));

        receiverIds.forEach(receiverId => {
            const participantsForReceiver = memberIds.filter(id => id !== receiverId);
            const receiverCallData = { ...baseCallData, inOrOut: "IN", userId: receiverId, callerId: participantsForReceiver };
            promises.push(set(ref(database, `data/calls/${receiverId}/${newCallId}`), receiverCallData));
            const receiverData = userDataMap.get(receiverId);
            const receiverMobile = receiverData ? (receiverData.mobile_number || receiverId) : receiverId;
            const receiverIncomingCallString = `user_type=group&call_type=${isVideoCall ? 'video' : 'audio'}&channelname=${channelName}&caller=${callerMobile}&group=${selectedGroupId}&currentuser=${receiverMobile}`;
            promises.push(update(child(usersRef, receiverId), { incomingcall: receiverIncomingCallString, call_status: false }));
            sendCallNotification(receiverId, groupNameForCall, `Group ${callTypeForNotif} call`, channelName, groupNameForCall, callerId);
        });

        await Promise.all(promises);
        await update(ref(database, `data/calls/${callerId}/${newCallId}`), { duration: "00:00:00" });
        
        currentCallId = newCallId;
        const activeCallDataForCaller = { ...callerCallData, duration: "00:00:00" };
        enterActiveCall(activeCallDataForCaller, currentUser);
        console.log(`Group ${callTypeForNotif} call initiated. Caller (${callerId}) joined instantly.`);

    } catch (error) {
        console.error(`Failed to initiate group ${isVideoCall ? 'video' : 'audio'} call:`, error);
    }
}

// Attach the generic function to the specific buttons
if (audioCallButton) { audioCallButton.onclick = (e) => { e.preventDefault(); initiateGroupCall(false); }; }
if (videoCallButton) { videoCallButton.onclick = (e) => { e.preventDefault(); initiateGroupCall(true); }; }

// -------------------
// 2. RESPOND TO A CALL (JOIN, DECLINE, LEAVE)
// -------------------

// Generic Join Function
const joinCall = async () => {
    if (!currentCallId) { console.error("No current call to join."); return; }
    const currentUser = auth.currentUser;
    if (!currentUser) return;
  
const callRefNew = ref(database, `data/calls/${currentUser.uid}/${currentCallId}`);

// 1. Update the data in the database
await update(callRefNew, { duration: "00:00:00" });
console.log("Data updated successfully in the DB.");

// 2. Now, FETCH the data from that reference
const snapshot = await get(callRefNew); // <-- Use get() to perform the read

// 3. Check if data exists and then get its value
if (snapshot.exists()) {
  const activeCallData = snapshot.val();
   enterActiveCall(activeCallData, currentUser);
  updateCallUI(myCall, allCalls, currentUser);
  
} else {
  console.log("No data available at this location.");
}
    
};
if (joinAudioCallButton) { joinAudioCallButton.onclick = joinCall; }
if (joinVideoCallButton) { joinVideoCallButton.onclick = joinCall; }

// Generic Decline Function
const declineCall = async () => {
    if (!currentCallId) return;
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    await update(ref(database, `data/calls/${currentUser.uid}/${currentCallId}`), { duration: "Declined" });
    await update(ref(database, `data/users/${currentUser.uid}`), { incomingcall: "", call_status: true });
    cleanUpLocalState();
};
if (declineAudioCallButton) { declineAudioCallButton.onclick = declineCall; }
if (declineVideoCallButton) { declineVideoCallButton.onclick = declineCall; }

// Generic End/Leave Function
const endCall = async () => {
    if (!currentCallId) return;
    const finalDuration = stopCallTimer();
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    await update(ref(database, `data/calls/${currentUser.uid}/${currentCallId}`), { duration: finalDuration });
    await update(ref(database, `data/users/${currentUser.uid}`), { incomingcall: "", call_status: true });
    cleanUpLocalState();
};
if (endAudioCallButton) { endAudioCallButton.onclick = endCall; }
if (endVideoCallButton) { endVideoCallButton.onclick = endCall; }

// Mute Buttons
if (muteAudioButton) {
    let isMuted = false;
    muteAudioButton.onclick = async () => {
        if (localAudioTrack) {
            isMuted = !isMuted;
            await localAudioTrack.setMuted(isMuted);
            muteAudioButton.innerHTML = isMuted ? '<i class="ti ti-microphone-off"></i>' : '<i class="ti ti-microphone"></i>';
        }
    };
}
if (muteVideoButton) {
    let isMuted = false;
    muteVideoButton.onclick = async () => {
        if (localAudioTrack) {
            isMuted = !isMuted;
            await localAudioTrack.setMuted(isMuted);
            muteVideoButton.innerHTML = isMuted ? '<i class="ti ti-microphone-off"></i>' : '<i class="ti ti-microphone"></i>';
        }
    };
}
if (disableVideoButton) {
    let isVideoEnabled = true;
    disableVideoButton.onclick = async () => {
        if (localVideoTrack) {
            isVideoEnabled = !isVideoEnabled;
            await localVideoTrack.setEnabled(isVideoEnabled);
            disableVideoButton.innerHTML = isVideoEnabled ? '<i class="ti ti-video"></i>' : '<i class="ti ti-video-off"></i>';
        }
    };
}


// -------------------
// 3. REAL-TIME LISTENER (THE BRAIN OF THE UI)
// -------------------
onValue(ref(database, 'data/calls'), (snapshot) => {
    const allCalls = snapshot.val();
    const currentUser = auth.currentUser;
    if (!currentUser || !allCalls) {
        if (currentCallId) cleanUpLocalState();
        return;
    }

    let myCall = null;
    let foundCall = false; // Flag to see if we are part of any active call

    if (allCalls[currentUser.uid]) {
        // Find the most relevant call for the current user
        // Priority: Ringing > Active (00:00:00)
        let activeCall = null;
        let ringingCall = null;

        for (const callId in allCalls[currentUser.uid]) {
            const call = allCalls[currentUser.uid][callId];
            if (call.type === "group") {
                // A call is considered 'over' if its duration is a final timestamp, or a specific string
                const isOver = ['Declined', 'Missed'].includes(call.duration) || /^\d{2}:\d{2}:\d{2}$/.test(call.duration) && call.duration !== "00:00:00";
                
                if (!isOver) {
                     if (call.duration === 'Ringing') {
                        ringingCall = call;
                        break; // A ringing call is the highest priority
                    } else {
                        activeCall = call; // It's an ongoing call
                    }
                }
            }
        }
        
        myCall = ringingCall || activeCall;
    }
    

    if (myCall) {
        currentCallId = myCall.id;
        const isRinging = myCall.duration === "Ringing";

        // Update the UI based on the current call state
        updateCallUI(myCall, allCalls, currentUser);
        
        if (isRinging) {
            // Show incoming call modal
            if (myCall.video) {
                $('#audio-call-new-group, #audio_group_new, #video_group_new').modal('hide');
                $('#video-call-new-group').modal('show');
            } else {
                $('#video-call-new-group, #audio_group_new, #video_group_new').modal('hide');
                $('#audio-call-new-group').modal('show');
            }
        } else {
            // The call is active, enter the call screen
            enterActiveCall(myCall, currentUser);
        }

    } else {
        // No active or ringing call found for the user. Clean up.
        if (currentCallId) {
            cleanUpLocalState();
        }
    }
});


// -------------------
// 4. HELPER FUNCTIONS
// -------------------

function enterActiveCall(callData, currentUser) {
    console.log(callData);
    // Join Agora channel only once
    if (!localAudioTrack && !localVideoTrack) {
        joinAgoraChannel(callData.channelName, currentUser.userId, callData.video);
        startCallTimer();
    }
    // Show the correct active call modal
    if (callData.video) {
        $('#audio-call-new-group, #video-call-new-group, #audio_group_new').modal('hide');
        $('#video_group_new').modal('show');
    } else {
        $('#audio-call-new-group, #video-call-new-group, #video_group_new').modal('hide');
        $('#audio_group_new').modal('show');
    }
}

async function updateCallUI(myCallData, allCalls, currentUser) {
    const groupName = myCallData.callerName;
    const groupImage = myCallData.callerImg;

    if (myCallData.video) {
        // Update Incoming VIDEO Call Modal
        $('#video-call-new-group .fs-14').text(groupName);
        $('#video-call-new-group .avatar-new-group img').attr('src', groupImage);
        // Update Active VIDEO Call Modal Title
        $('#video_group_new #videoGroupModalLabel').text(groupName);
        
        // You would also update the remote video users here in a similar way to audio
        // For example, by iterating through 'allCalls' and finding active video participants.

    } else {
        // --- AUDIO CALL UI LOGIC ---

        // Update Incoming AUDIO Call Modal
        $('#audio-call-new-group .audio-name').text(groupName);
        $('#audio-call-new-group .avatar-new-audio-group img').attr('src', groupImage);

        // Update Active AUDIO Call Modal
        const userSnap = await get(child(usersRef, currentUser.uid));
        if (userSnap.exists()) {
            const userData = userSnap.val();
            // This is YOU (the local user)
            $('#local-user-avatar').attr('src', userData.image || 'assets/img/profiles/avatar-03.jpg');
            $('#local-user-name').text(`${userData.firstName} ${userData.lastName}`.trim() || 'You');
        }

        // --- CORE FIX FOR REMOTE USERS ---
        const remoteUsersContainer = $('#remote-users-container');
        remoteUsersContainer.empty(); // Clear previous participants
        
        const remoteParticipantPromises = [];
        
        // Find all users who are part of the current call
        for (const userId in allCalls) {
            // Skip the current user, they are handled as the "local user"
            if (userId === currentUser.uid) continue;

            const userCalls = allCalls[userId];
            // Check if this user has a record for our current call
            if (userCalls && userCalls[currentCallId]) {
                const participantCallData = userCalls[currentCallId];
                
                // A participant is "active" if their duration is NOT Ringing, Declined, or Missed.
                // This correctly includes "00:00:00" and any future running timer values.
                const isActiveParticipant = !['Ringing', 'Declined', 'Missed'].includes(participantCallData.duration);
                
                if (isActiveParticipant) {
                    // If they are active, fetch their user details to display
                    remoteParticipantPromises.push(get(child(usersRef, userId)));
                }
            }
        }

        const remoteSnapshots = await Promise.all(remoteParticipantPromises);
        
        if(remoteSnapshots.length > 0) {
            const remoteUsersRow = $('<div class="row"></div>');
            remoteUsersContainer.append(remoteUsersRow);

            remoteSnapshots.forEach(snap => {
                if (snap.exists()) {
                    const userData = snap.val();
                    const userName = `${userData.firstName} ${userData.lastName}`.trim() || 'Guest';
                    const userImage = userData.image || 'assets/img/profiles/avatar-03.jpg';
                    const userHtml = `
                        <div class="col-12 mb-3">
                            <div class="card audio-crd bg-transparent-dark border h-100 pt-4">
                                <div class="modal-bgimg">
                                    <span class="modal-bg1"><img src="assets/img/bg/bg-02.png" class="img-fluid" alt="bg"></span>
                                    <span class="modal-bg2"><img src="assets/img/bg/bg-03.png" class="img-fluid" alt="bg"></span>
                                </div>
                                <div class="card-body">
                                    <div class="d-flex justify-content-center align-items-center">
                                        <span class="avatar avatar-xxxl bg-soft-primary rounded-circle p-2">
                                            <img src="${userImage}" class="rounded-circle" alt="${userName}">
                                        </span>
                                        <div class="d-flex audio-group-m-name align-items-end justify-content-end">
                                            <span class="badge badge-info">${userName}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>`;
                    remoteUsersRow.append(userHtml);
                }
            });
        }
    }
}

async function joinAgoraChannel(channelName, uid, isVideo) {
    try {
        // Handle publishing
        const tracksToPublish = [];
        localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        tracksToPublish.push(localAudioTrack);

        if (isVideo) {
            localVideoTrack = await AgoraRTC.createCameraVideoTrack();
            tracksToPublish.push(localVideoTrack);
        }

        await audioClient.join(APP_ID, channelName, null, uid);
        await audioClient.publish(tracksToPublish);

        // Play local video if it exists
        if (localVideoTrack) {
            localVideoTrack.play('local-player');
        }
        
        // Alternative approach: Use user-joined event instead of user-published for group calls
        audioClient.on("user-joined", async (user) => {
            console.log(`Group user ${user.uid} joined the channel ${channelName}`);
            
            try {
                // Subscribe to both audio and video immediately when user joins
                await audioClient.subscribe(user, "audio");
                if (isVideo) {
                    await audioClient.subscribe(user, "video");
                }
                console.log(`Successfully subscribed to media for user ${user.uid}`);
                
                // Store user info for better tracking
                if (!window.agoraGroupUsers) window.agoraGroupUsers = {};
                window.agoraGroupUsers[user.uid] = {
                    uid: user.uid,
                    channelName: channelName,
                    appId: APP_ID,
                    joinedAt: Date.now(),
                    isVideo: isVideo
                };
                
                // Handle audio
                if (user.audioTrack) {
                    console.log(`Playing audio for group user ${user.uid}`);
                    user.audioTrack.play().catch(error => {
                        console.error(`Audio playback failed for user ${user.uid}:`, error);
                        
                        // Create play button for user interaction
                        const playButton = document.createElement('button');
                        playButton.textContent = `Click to play audio from user ${user.uid}`;
                        playButton.style.position = 'fixed';
                        playButton.style.top = '100px';
                        playButton.style.right = '10px';
                        playButton.style.zIndex = '9999';
                        playButton.onclick = () => {
                            user.audioTrack.play().catch(e => console.error("Still failed to play:", e));
                            playButton.remove();
                        };
                        document.body.appendChild(playButton);
                    });
                }
                
                // Handle video
                if (isVideo && user.videoTrack) {
                    console.log(`Playing video for group user ${user.uid}`);
                    let remotePlayerContainer = document.getElementById(`player-container-${user.uid}`);
                    if (!remotePlayerContainer) {
                        remotePlayerContainer = document.createElement('div');
                        remotePlayerContainer.id = `player-container-${user.uid}`;
                        remotePlayerContainer.className = 'col-6 player-wrapper mb-3';
                        document.getElementById('remote-playerlist').append(remotePlayerContainer);
                    }
                    user.videoTrack.play(remotePlayerContainer);
                }
                
            } catch (error) {
                console.error(`Failed to subscribe to group user ${user.uid}:`, error);
            }
        });
        
        // Keep original event listeners as fallback
        audioClient.on("user-published", async (user, mediaType) => {
            await audioClient.subscribe(user, mediaType);
            if (mediaType === "audio") {
                user.audioTrack.play();
            }
            if (mediaType === "video") {
                let remotePlayerContainer = document.getElementById(`player-container-${user.uid}`);
                if (!remotePlayerContainer) {
                    remotePlayerContainer = document.createElement('div');
                    remotePlayerContainer.id = `player-container-${user.uid}`;
                    remotePlayerContainer.className = 'col-6 player-wrapper mb-3'; // Bootstrap class for 2-column layout
                    document.getElementById('remote-playerlist').append(remotePlayerContainer);
                }
                user.videoTrack.play(remotePlayerContainer);
            }
        });

        audioClient.on("user-left", (user) => {
            console.log(`Group user ${user.uid} left the channel ${channelName}`);
            const remotePlayerContainer = document.getElementById(`player-container-${user.uid}`);
            if (remotePlayerContainer) {
                remotePlayerContainer.remove();
            }
            
            // Clean up user tracking
            if (window.agoraGroupUsers && window.agoraGroupUsers[user.uid]) {
                delete window.agoraGroupUsers[user.uid];
            }
        });
        
        // Additional event listeners for better user tracking
        audioClient.on("user-unpublished", (user, mediaType) => {
            console.log(`Group user ${user.uid} unpublished ${mediaType} in channel ${channelName}`);
        });
        
        // Log all users in the channel
        audioClient.on("user-list-updated", (users) => {
            console.log(`Group users in channel ${channelName}:`, users.map(u => u.uid));
        });
        
        // Manual subscription check every few seconds for group calls
        const groupManualSubscriptionInterval = setInterval(async () => {
            try {
                const remoteUsers = audioClient.remoteUsers;
                console.log(`Group manual check - Remote users in channel:`, remoteUsers.map(u => u.uid));
                
                for (const remoteUser of remoteUsers) {
                    if ((remoteUser.hasAudio && !remoteUser.audioTrack) || 
                        (isVideo && remoteUser.hasVideo && !remoteUser.videoTrack)) {
                        console.log(`Attempting manual subscription to group user ${remoteUser.uid}`);
                        
                        if (remoteUser.hasAudio && !remoteUser.audioTrack) {
                            await audioClient.subscribe(remoteUser, "audio");
                        }
                        if (isVideo && remoteUser.hasVideo && !remoteUser.videoTrack) {
                            await audioClient.subscribe(remoteUser, "video");
                        }
                        
                        // Handle display after subscription
                        if (remoteUser.audioTrack || remoteUser.videoTrack) {
                            handleGroupUserDisplay(remoteUser, isVideo);
                        }
                    }
                }
            } catch (error) {
                console.error("Group manual subscription check error:", error);
            }
        }, 3000); // Check every 3 seconds
        
        // Store interval ID for cleanup
        if (!window.agoraIntervals) window.agoraIntervals = {};
        window.agoraIntervals[`group_${channelName}`] = groupManualSubscriptionInterval;
        
        // Manual trigger function for group calls
        window.manualSubscribeToGroupUsers = async () => {
            try {
                console.log("Manual group subscription triggered");
                const remoteUsers = audioClient.remoteUsers;
                console.log("Available group remote users:", remoteUsers);
                
                for (const remoteUser of remoteUsers) {
                    console.log(`Processing group user ${remoteUser.uid}:`, {
                        hasAudio: remoteUser.hasAudio,
                        hasVideo: remoteUser.hasVideo,
                        audioTrack: !!remoteUser.audioTrack,
                        videoTrack: !!remoteUser.videoTrack,
                        uid: remoteUser.uid
                    });
                    
                    if (remoteUser.hasAudio && !remoteUser.audioTrack) {
                        console.log(`Subscribing to audio for group user ${remoteUser.uid}`);
                        await audioClient.subscribe(remoteUser, "audio");
                    }
                    
                    if (isVideo && remoteUser.hasVideo && !remoteUser.videoTrack) {
                        console.log(`Subscribing to video for group user ${remoteUser.uid}`);
                        await audioClient.subscribe(remoteUser, "video");
                    }
                    
                    // Handle display after subscription
                    if (remoteUser.audioTrack || remoteUser.videoTrack) {
                        handleGroupUserDisplay(remoteUser, isVideo);
                    }
                }
            } catch (error) {
                console.error("Manual group subscription error:", error);
            }
        };
        
        // Add button to trigger manual group subscription
        const groupManualButton = document.createElement('button');
        groupManualButton.textContent = 'Manual Subscribe to Group Users';
        groupManualButton.style.position = 'fixed';
        groupManualButton.style.top = '150px';
        groupManualButton.style.right = '10px';
        groupManualButton.style.zIndex = '9999';
        groupManualButton.onclick = window.manualSubscribeToGroupUsers;
        document.body.appendChild(groupManualButton);

    } catch (error) { console.error("Agora Join Error:", error); }
}

// Helper function to handle group user display after subscription
function handleGroupUserDisplay(remoteUser, isVideo) {
    // Handle audio
    console.log(`Handling display for group user ${remoteUser.uid}`);
    if (remoteUser.audioTrack) {
        console.log(`Playing audio for group user ${remoteUser.uid}`);
        remoteUser.audioTrack.play().catch(error => {
            console.error(`Audio playback failed for group user ${remoteUser.uid}:`, error);
        });
    }
    
    // Handle video
    if (isVideo && remoteUser.videoTrack) {
        console.log(`Playing video for group user ${remoteUser.uid}`);
        let remotePlayerContainer = document.getElementById(`player-container-${remoteUser.uid}`);
        if (!remotePlayerContainer) {
            remotePlayerContainer = document.createElement('div');
            remotePlayerContainer.id = `player-container-${remoteUser.uid}`;
            remotePlayerContainer.className = 'col-6 player-wrapper mb-3';
            document.getElementById('remote-playerlist').append(remotePlayerContainer);
        }
        remoteUser.videoTrack.play(remotePlayerContainer);
    }
}

function cleanUpLocalState() {
    stopCallTimer();
    if (localAudioTrack) {
        localAudioTrack.stop();
        localAudioTrack.close();
        localAudioTrack = null;
    }
    if (localVideoTrack) {
        localVideoTrack.stop();
        localVideoTrack.close();
        localVideoTrack = null;
    }
    
    // Unsubscribe from events to prevent memory leaks
    audioClient.off("user-published");
    audioClient.off("user-joined");
    audioClient.off("user-left");
    audioClient.off("user-unpublished");
    audioClient.off("user-list-updated");
    
    if (audioClient.connectionState === 'CONNECTED' || audioClient.connectionState === 'CONNECTING') {
        audioClient.leave().catch(e => console.error("Agora leave error:", e));
    }
    
    // Clean up group intervals
    if (window.agoraIntervals) {
        Object.keys(window.agoraIntervals).forEach(key => {
            if (key.startsWith('group_')) {
                clearInterval(window.agoraIntervals[key]);
                delete window.agoraIntervals[key];
            }
        });
    }
    
    // Clean up group users tracking
    if (window.agoraGroupUsers) {
        window.agoraGroupUsers = {};
    }
    
    // Remove manual group subscription button
    const groupManualButton = document.querySelector('button[onclick="window.manualSubscribeToGroupUsers"]');
    if (groupManualButton) {
        groupManualButton.remove();
    }
    
    // Hide all possible call modals
    $('#audio-call-new-group, #audio_group_new, #video-call-new-group, #video_group_new').modal('hide');
    currentCallId = null;
    const currentUser = auth.currentUser;
    if (currentUser) {
        update(ref(database, `data/users/${currentUser.uid}`), {
            incomingcall: "",
            call_status: true
        }).catch(console.error);
    }
}

// (Other helper functions like startCallTimer, stopCallTimer, sendCallNotification are unchanged)
function startCallTimer() {
    let seconds = 0;
    const timerDisplay = document.getElementById('call-timer-display'); // Note: Make sure this ID is present in both active call modals
    if (!timerDisplay) return;
    if (callTimerInterval) clearInterval(callTimerInterval);
    timerDisplay.textContent = "00:00:00";
    callTimerInterval = setInterval(() => {
        seconds++;
        const format = (val) => `0${Math.floor(val)}`.slice(-2);
        const hours = seconds / 3600;
        const minutes = (seconds % 3600) / 60;
        timerDisplay.textContent = `${format(hours)}:${format(minutes)}:${format(seconds % 60)}`;
    }, 1000);
}

function stopCallTimer() {
    clearInterval(callTimerInterval);
    const timerDisplay = document.getElementById('call-timer-display');
    return timerDisplay ? timerDisplay.textContent : "00:00:00";
}

async function sendCallNotification(toId, fromId, title, channelName, callerName, callerId) {
    try {
        const snapshot = await get(ref(database, `data/users/${toId}/deviceToken`));
        if (!snapshot.exists()) { console.error(`Device token not found for user: ${toId}`); return; }
        const deviceToken = snapshot.val();
        await fetch('/api/send-call-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ body: fromId, toId, fromId: callerId, callerName, title, channelName, device_token: deviceToken })
        });
    } catch (error) { console.error('Error sending notification:', error); }
}

/**
 * Sends a message to a group chat, handling both new messages and replies.
 * This corrected version ensures the message ID is always included in the message data
 * and uses the 'set' method for a more efficient database write.
 *
 * @param {string} groupId - The ID of the group to send the message to.
 * @param {string|object} messageText - The message content (text or file object).
 * @param {string|number} messageType - The type of the message (e.g., 6 for text).
 * @param {string|null} fileUrl - The URL if the message is a file (deprecated, part of messageText object).
 */
async function sendGroupMessage(groupId, messageText, messageType = 'text', fileUrl = null) {
    highlightActiveGroup(groupId);

    if (!currentUserId || !groupId) {
        console.error("User or Group ID is missing.");
        return;
    }

    try {
        const groupMembersRef = ref(database, `data/groups/${groupId}/userIds`);
        const snapshot = await get(groupMembersRef);

        if (!snapshot.exists()) {
            console.error("Group members not found for groupId:", groupId);
            return;
        }

        const members = snapshot.val();
        
        // ====================================================================
        // FIX 1: Generate the unique key for the new message FIRST.
        // This creates the ID like "-OWyMi80lk7dqzQuZiu0".
        // ====================================================================
        const messagesCollectionRef = ref(database, `data/chats/${groupId}`);
        const newMessageKey = push(messagesCollectionRef).key;

        // ====================================================================
        // FIX 2: Create the base message object and immediately assign the
        // generated key to the 'id' field.
        // ====================================================================
        let messageData = {
            id: newMessageKey, // <-- THIS IS THE CORRECTION YOU ASKED FOR.
            sender: currentUserId,
            senderId: currentUserId,
            groupId: groupId,
            timestamp: Date.now(),
            date: Date.now(),
            attachmentType: messageType,
            delivered: false,
            readMsg: false,
            blocked: false,
            sent: true,
            userIds: members,
            replyId: "0",
        };

        // Add 'body' for text messages or 'attachment' for files.
        if (messageType == 6) { // Assuming 6 is for text messages
            messageData.body = messageText;
        } else {
            messageData.attachment = messageText;
        }

        let finalMessageData = messageData;

        // Handle replies, ensuring the correct ID is carried over.
        if (replyToMessage) {
            if (!replyToMessage.body) {
                console.error("Invalid reply content.");
                return;
            }

            const replyType = replyToMessage.attachmentType || "unknown";
            let replyContent = "";

            if (replyType == 6) {
                 replyContent = replyToMessage.body || "No content";
            } else if (['2', '3', '1', '5', '8'].includes(replyType.toString())) {
                 replyContent = replyToMessage.attachment?.url || `${replyType} content missing`;
            } else {
                 replyContent = "Unsupported message type";
            }
            
            let encryptedReplyContent;
            if (replyType == 6) {
                encryptedReplyContent = await encryptMessage(replyContent);
            } else {
                encryptedReplyContent = replyContent;
            }

            // Create the final reply message object, spreading the original
            // messageData to include the correct 'id'.
            finalMessageData = {
                ...messageData,
                isReply: true,
                replyId: replyToMessage.key || "0",
                replyContent: encryptedReplyContent,
                replyUser: replyToMessage.from, // 'from' should be senderId of the original message
                replyType: replyType,
                replyTimestamp: replyToMessage.timestamp || Date.now(),
                originalMessage: replyContent,
            };
        }

        // ====================================================================
        // FIX 3: Use `set` with the specific path including the `newMessageKey`.
        // This ensures the object is saved under the key we generated.
        // ====================================================================
        const newMessageRef = ref(database, `data/chats/${groupId}/${newMessageKey}`);
        await set(newMessageRef, finalMessageData);

        // --- UI and State Updates after successful send ---
        if (replyToMessage) {
            closeReplyBox();
            document.getElementById("message-input").value = "";
            replyToMessage = null;
        } else {
            // Assuming these are the input fields for the group chat
            const messageInputGroup = document.getElementById("group-message-input"); // Please verify this ID
            const fileInputGroup = document.getElementById("group-files-input"); // Please verify this ID
            const messagePreview = document.getElementById("group-message-preview"); // Please verify this ID

            if(messageInputGroup) messageInputGroup.value = "";
            if(fileInputGroup) fileInputGroup.value = "";
            if(messagePreview) messagePreview.innerHTML = "";
        }
        
        highlightActiveGroup(groupId);
        fetchGroups(currentUserId); // Refresh group list to show latest message

    } catch (error) {
        console.error("Error sending group message:", error);
    }
}

document.addEventListener("click", (e) => {
    if (e.target.classList.contains("delete-btn")) {
        const messageElement = e.target.closest(".chats");
        const messageKey = messageElement.dataset.messageKey; // Unique message key
        const groupIdkey = messageElement.dataset.groupId; // Get the group ID
        // Populate hidden inputs in the form
        document.getElementById("message-to-delete").value = messageKey;
        document.getElementById("group-id").value = groupIdkey;

        if (!messageKey || !groupIdkey) {
            return;
        }
    
        const messageRef = ref(database, `data/chats/${groupIdkey}/${messageKey}`);
  
        // Fetch the message details from Firebase
        get(messageRef)
            .then((snapshot) => {
                if (snapshot.exists()) {
                    const message = snapshot.val();
                    // Check if senderId matches current user ID
                    if (message.senderId == currentUserId) {
                        // Hide the "Delete For Everyone" option
                        const deleteForEveryoneDiv = document.getElementById('delete-for-everyone-group');
                        if (deleteForEveryoneDiv) {
                            deleteForEveryoneDiv.style.display = 'block';
                        }
                    } else {
                        // Ensure the "Delete For Everyone" option is visible
                        const deleteForEveryoneDiv = document.getElementById('delete-for-everyone-group');
                        if (deleteForEveryoneDiv) {
                            deleteForEveryoneDiv.style.display = 'none';
                        }
                    }
                } else {
                    console.error('Message not found in Firebase');
                }
            })
            .catch((error) => {
                console.error('Error fetching message details:', error);
            });
    }
});

// Function to delete message locally (from the DOM)
function deleteForMe(messageElement, messageKey, groupId) {
    // Update Firebase to mark message as deleted for the current user
    const messageRef = ref(database, `data/chats/${groupId}/${messageKey}`);

    get(messageRef)
    .then((snapshot) => {
     
        if (snapshot.exists()) {
            const messageData = snapshot.val();
            const deletedFor = messageData.deletedFor || []; // Existing array or initialize empty array

            // Only update if the current user is not already in the `deletedFor` array
            if (!deletedFor.includes(currentUserId)) {
                const updates = {};
                updates[`deletedFor`] = [...deletedFor, currentUserId];

                // Update the message with the new `deletedFor` value
                return update(messageRef, updates);
            } else {
                //console.log("Message already marked as deleted for this user.");
                return Promise.resolve(); // No update needed
            }
        } else {
            console.error("Message does not exist at path:", messageRef.toString());
            //console.error("Message does not exist.");
        }
    })
    .then(() => {
        // Remove the message locally after the update
        if (messageElement) {
            messageElement.remove();
        } else {
            console.error("Message element not found.");
        }
    })
    .catch((error) => {
        console.error("Error deleting message for me:", error);
    });
}

// Function to delete message for everyone from Firebase
function deleteForEveryone(messageKey, messageElement, groupId) {
    
    const messageRef = ref(database, `data/chats/${groupId}/${messageKey}`);

    // Remove the message from Firebase
    remove(messageRef);
}


// Event listener for the form submission (delete chat form)
document.getElementById("delete-chat-form").addEventListener("submit", (e) => {
    e.preventDefault(); // Prevent form default behavior

    const messageKey = document.getElementById("message-to-delete").value;
    const groupId = document.getElementById("group-id").value;
    const action = document.querySelector('input[name="delete-chat"]:checked').id;
    
    // Ensure you're selecting the message element using messageKey
    const messageElement = document.querySelector(`[data-message-key="${messageKey}"]`);
    
    if (action === "delete-for-me") {
        deleteForMe(messageElement, messageKey, groupId);
    } else if (action === "delete-for-everyone") {
        deleteForEveryone(messageKey, messageElement, groupId);  // Pass the messageKey directly
    } else {
        console.error("Unknown action.");
    }

    // Close the modal
    const modal = bootstrap.Modal.getInstance(document.getElementById("message-delete"));
    modal.hide();
    document.body.classList.remove("modal-open");
    document.querySelector(".modal-backdrop").remove();
});


let replyToMessage = null; // To store the replied message content

// Event listener for the reply button
document.addEventListener("click", (e) => {
    if (e.target.classList.contains("reply-btn")) {
        const messageElement = e.target.closest(".chats");
      
        // Extract user and type information
        const replyUser = "";
        const replyType = messageElement.dataset.type || 6; // Extract type from a data attribute

        let replyContent = ""; // To hold the reply content
        let mediaUrl = null; // To hold the media URL if applicable
        // Handle different message types
        if (replyType === "6" ) {
            replyContent = messageElement.querySelector(".message-content > div:not(.message-reply)").innerText.trim();
        } else if (replyType === "2") {
            const imgElement = messageElement.querySelector(".message-content img");
            if (imgElement) {
                mediaUrl = imgElement.src;
                replyContent = `<img src="${mediaUrl}" alt="Image Reply" class="reply-image" style="max-width: 100px; max-height: 100px;">`;
            }
        } else if (replyType === "1") {
            const videoElement = messageElement.querySelector(".message-content video");
            if (videoElement) {
                mediaUrl = videoElement.src;
                replyContent = `<video src="${mediaUrl}" controls class="reply-video" style="max-width: 100px; max-height: 100px;"></video>`;
            }
        } else if (replyType === "3") {
            const audioElement = messageElement.querySelector(".message-content audio");
            if (audioElement) {
                mediaUrl = audioElement.src;
                replyContent = `<audio src="${mediaUrl}" controls class="reply-audio"></audio>`;
            }
        } else if (replyType === "5") {
            const fileElement = messageElement.querySelector(".message-content a");
            if (fileElement) {
                mediaUrl = fileElement.href;
                replyContent = `<a href="${mediaUrl}" target="_blank" download class="reply-file">Download File</a>`;
            }
        }

        // Update the reply box content
        const replyDiv = document.getElementById("reply-div");
        const replyContentElement = document.getElementById("replyContent");
        const replyUserElement = document.getElementById("replyUser");

        if (replyDiv && replyContentElement && replyUserElement) {
            replyDiv.style.display = "flex";
            replyUserElement.innerText = replyUser;

            // Use innerHTML for media types, innerText for text
            if (["2", "1", "3", "5"].includes(replyType)) {
                replyContentElement.innerHTML = replyContent;
            } else {
                replyContentElement.innerText = replyContent;
            }
        } else {
            console.error("Reply box or content elements not found in the DOM.");
        }

        let attachment = {
            url : replyContent,
        }

        // Store the replied message with necessary details
        replyToMessage = {
            key: messageElement.dataset.messageKey,
            body: replyContent,
            from: replyUser,
            attachmentType: replyType, // Store the type of the original message
            attachment: attachment,
        };

   
    }
});

document.getElementById("closeReply").onclick = () => {
    closeReplyBox();
};

 
    // Close Reply Box
    function closeReplyBox() {
        document.getElementById("reply-div").style.display = "none";
        replyToMessage = null; // Reset the replied message
    }

    let forwardContent = null;
    document.addEventListener("click", (e) => {
        if (e.target.classList.contains("forward-btn")) {
            const messageElement = e.target.closest(".chats");
            const messageContentElement = messageElement.querySelector(".message-content");
            const messageKey = messageElement.getAttribute("data-message-key");
    
            let forwardContent = {
                key: messageKey,
                body: "",
                media: null,
            };
    
            const forwardedLabel = messageContentElement.querySelector(".forwarded-label");
            if (forwardedLabel) {
                forwardedLabel.remove();
            }
    
            const defaultMessageContent = messageContentElement.querySelector("div:not(.message-reply)");
            if (defaultMessageContent) {
                forwardContent.body = defaultMessageContent.textContent.trim(); // Safely handle emojis and text
            }
    
        
    
            const file = messageContentElement.querySelector("a");
  
            if (file) {
        
                const fileURL = file.getAttribute("href");
                forwardContent.body = {
                    url : fileURL,
                };
                forwardContent.media = { 
                    attachmentType: 5, 
                    src: fileURL 
                };
            } else if (!forwardContent.body) {
           
                const audio = messageContentElement.querySelector("audio");
                const video = messageContentElement.querySelector("video");
                const img = messageContentElement.querySelector("img");
    
                if (audio) {
                    forwardContent.body = {
                        url : audio.getAttribute("src"),
                    };
                    forwardContent.media = { 
                        attachmentType: 3, 
                        src: audio.getAttribute("src") 
                    };
                } else if (video) {
                    forwardContent.body = {
                        url : video.getAttribute("src"),
                    };
                    forwardContent.media = { 
                        attachmentType: 1, 
                        src: video.getAttribute("src") 
                    };
                } else if (img) {
                    forwardContent.body = {
                        url : img.getAttribute("src"),
                    };
                    forwardContent.media = { 
                        attachmentType: 2, 
                        src: img.getAttribute("src") 
                    };
                } else {
                    forwardContent.text = "This is a media message"; // Default for non-media
                }
            }
    
            getUsersFromContacts().then((users) => {
                showForwardModal(users, forwardContent);
            });
        }
    });
        

    function getUsersFromContacts() {
        return new Promise((resolve, reject) => {
            const groupsRef = ref(database, `data/groups/`);
            get(groupsRef)
                .then((snapshot) => {
                    const groups = [];
                    snapshot.forEach((childSnapshot) => {
                        const groupData = childSnapshot.val();
                        // Check if the current user is in the group's members list
                        if (groupData.userIds.includes(currentUserId)) {
                            groups.push({
                                id: childSnapshot.key,
                                groupName: groupData.name,
                                groupType: groupData.groupType,
                                date: groupData.date,
                                createdBy: groupData.createdBy,
                                avatarURL: groupData.image,
                            });
                        }
                    });
                    resolve(groups);
                })
                .catch((error) => reject(error));
        });
    }
    
    function showForwardModal(users, forwardContent) {
        const modalContainer = new bootstrap.Modal(document.getElementById("forward-modal"));
        const userListContainer = document.querySelector("#forward-modal .user-list");
        userListContainer.innerHTML = "";
    
        users.forEach((user) => {

            const userItem = document.createElement("div");
            userItem.classList.add("user-item");
            const avatar = user.image || "assets/img/profiles/avatar-03.jpg"; // Default avatar
            userItem.innerHTML = `
                <input type="checkbox" class="user-checkbox" data-group-id="${user.id}">
                <img src="${avatar}" alt="${user.name}" class="user-avatar" width="30">
                <span>${user.name}</span>
            `;
    
            userListContainer.appendChild(userItem);
        });
    
        modalContainer.show();
    
        document.getElementById("send-forward").onclick = () => {
            const selectedUsers = [];
            const checkboxes = document.querySelectorAll(".user-checkbox:checked");
    
            checkboxes.forEach((checkbox) => {
                selectedUsers.push(checkbox.getAttribute("data-group-id"));
            });

            if (selectedUsers.length > 0 && forwardContent) {
                selectedUsers.forEach((userId) => {

                    sendForwardMessage(userId, forwardContent.body, forwardContent.media ? forwardContent.media.attachmentType : 6, forwardContent.key);
                });
                forwardContent = null; // Reset forward content after sending
            }
    
            modalContainer.hide();
        };
    }

    let otherUserId = "";
    function isUserBlocked(currentUserId, otherUserId) {
        return get(ref(database, `data/blocked_users/${currentUserId}/${otherUserId}`))
            .then((snapshot) => {
                return snapshot.exists(); // Returns true if the user is blocked
            })
            .catch((error) => {
                return false; // Default to not blocked on error
            });
    }

    function sendForwardMessage(toUserId, forwardText, messageType = 'text', originalMessageKey = null) {
        if (!currentUserId) {
            return;
        }
        const activeForwardButton = document.querySelector('.forward-btn'); // Adjust selector as needed
        if (!activeForwardButton) {
            console.error("Active forward button not found.");
            return;
        }
        const chatsElement = activeForwardButton.closest('.chats');
        if (!chatsElement) {
            console.error("Chats element not found.");
            return;
        }    
        const groupId = chatsElement.getAttribute('data-group-id');
        if (!groupId) {
            console.error("Group ID not found.");
            return;
        }
        // Check if the user is blocked
        isUserBlocked(currentUserId, toUserId)
            .then(async (isBlocked) => {
                if (isBlocked) {
                    Toastify({
                        text: "You have blocked this user. Unblock to send a message.",
                        duration: 3000,
                        gravity: "top",
                        position: "right",
                        backgroundColor: "#ff3d00",
                        stopOnFocus: true,
                    }).showToast();
                    return; // Exit the function if the user is blocked
                }

                // Prepare the forward message object
                const message = {
                    sender: currentUserId,
                    senderId: currentUserId,
                    to: toUserId,
                    attachmentType: messageType,
                    body: forwardText,
                    timestamp: Date.now(),
                    delivered: false,
                    readMsg: false,
                    isForward: true,
                    originalMessageKey: originalMessageKey,
                };

                  // If the message is of type 'text', encrypt it
                  if (messageType === 6) {
                     const encryptedForwardText = await encryptMessage(forwardText);
                    message.body = encryptedForwardText; // Use the encrypted message here
                } else {
                    // For video, audio, or file, just pass the original content as is
                    message.attachment = forwardText; // Keep the original content without encryption
                }

                const messageRef = ref(database, `data/chats/${toUserId}`);
                 // Push the message to the chat room
                push(messageRef, message)
                    .then((newMessageRef) => {
                        // console.log(
                        //     "Message forwarded and encrypted successfully."
                        // );
                    })
                    .catch((error) => {
                        // console.error(
                        //     "Error forwarding encrypted message:",
                        //     error
                        // );
                    });
            })
            .catch((error) => {
            });
    }

document.getElementById("message-form").addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent form submission and page reload
    const messageText = document.getElementById("message-input").value;
});

document.getElementById("groupSearchInput").addEventListener("input", function () {
    const searchValue = this.value.toLowerCase(); // Get the search value in lowercase
    const groupDivs = document.querySelectorAll("#group-list .chat-list"); // Select all group elements
    let anyVisible = false; // Track if any group is visible

    groupDivs.forEach((groupDiv) => {
        const groupNameElement =
            groupDiv.querySelector(".chat-user-msg h6"); // Get the group name in an <h6> tag
        const groupName = groupNameElement.textContent.toLowerCase(); // Get the group name in lowercase

        // Check if the group name includes the search value
        if (groupName.includes(searchValue)) {
            groupDiv.style.display = ""; // Show group
            anyVisible = true; // Mark as visible
        } else {
            groupDiv.style.display = "none"; // Hide group
        }
    });

    // Show or hide the no matches message
    const noMatchesMessage = document.getElementById(
        "noGroupMatchesMessage"
    );
    if (searchValue.trim() === "") {
        // If the input field is empty, hide both messages
        if (noMatchesMessage) noMatchesMessage.style.display = "none";
    } else {
        // If the input field is not empty, manage visibility based on matches
        if (noMatchesMessage) noMatchesMessage.style.display = anyVisible ? "none" : "block";
    }

});

document.getElementById("groupcontactSearchInput").addEventListener("input", function () {
    const searchValue = this.value.toLowerCase(); // Get the search value in lowercase
    const groupDivs = document.querySelectorAll("#users-list .contact-user"); // Select all contact elements
    const usersList = document.getElementById("users-list");
    let anyVisible = false; // Track if any contact is visible

    groupDivs.forEach((groupDiv) => {
        const groupNameElement = groupDiv.querySelector("h6"); // Get the contact name in an <h6> tag
        const groupName = groupNameElement.textContent.toLowerCase(); // Get the contact name in lowercase

        // Check if the contact name includes the search value
        if (groupName.includes(searchValue)) {
           
            groupDiv.style.display = ""; // Show the contact
            const groupFlexElements = groupDiv.querySelectorAll('.d-flex.align-items-center');
            groupFlexElements.forEach((groupFlex) => {
                groupFlex.style.display = "";
            });
            anyVisible = true; // Mark as visible
        } else {
            groupDiv.style.display = "none"; // Hide the contact

            // Apply display: none to all .d-flex.align-items-center elements inside the current groupDiv
            const groupFlexElements = groupDiv.querySelectorAll('.d-flex.align-items-center');
            groupFlexElements.forEach((groupFlex) => {
                groupFlex.setAttribute("style", "display: none !important;");
            });
        }
    });

    // Show or hide the no matches message
    const noMatchesMessage = document.getElementById("noGroupMatchesModalMessage");
    if (noMatchesMessage) {
        noMatchesMessage.style.display = anyVisible ? "none" : "block"; // Show if no contacts are visible
    }
    if (usersList) {
        if (!anyVisible) {
            usersList.classList.add("d-none"); // Hide users-list if no matches are found
        } else {
            usersList.classList.remove("d-none"); // Show users-list if matches are found
        }
    }
});



function getUserDetails(userId) {
    const userRef = ref(database, 'data/users/' + userId); // Create a reference to the user node
    return get(userRef)
        .then((snapshot) => {
            if (snapshot.exists()) {
                return snapshot.val(); // Return user data if exists
            } else {
                // Return a default user object
                return { user_name: 'Unknown User', image: 'assets/img/profiles/avatar-03.jpg', status: 'No Status', role: 'Member' };
            }
        })
        .catch((error) => {
            // Return a default user object in case of error
            return { user_name: 'Unknown User', image: 'assets/img/profiles/avatar-03.jpg', status: 'No Status', role: 'Member' };
        });
}

// Function to fetch and display group info
async function fetchGroupInfo(selectedGroupId) {
    const groupRef = ref(database, `data/groups/${selectedGroupId}`);

    try {
        // Use 'onValue' to fetch the group data from the database
        onValue(groupRef, async (snapshot) => { // Make this callback async
            if (snapshot.exists()) {
                const groupData = snapshot.val();

                // Update the DOM with the fetched data
                document.getElementById("group-name").textContent =
                    groupData.name || "No Name";
                document.getElementById(
                    "group-participants"
                ).innerText = `Group - ${
                    groupData.userIds.length || 0
                } Participants`;
                document.getElementById("group-info-about").innerText =
                    groupData.status || "No Description";
                const groupDateElement = document.getElementById("group-date");
                const timestamp = groupData.date;

                // Check if the timestamp is valid
                if (timestamp) {
                    const date = new Date(Number(timestamp)); // Convert the timestamp to a Date object
                    const formattedDate = date.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    }); // Format the date

                    groupDateElement.innerText = `Group created on ${formattedDate}`;
                } else {
                    groupDateElement.innerText = "No data available";
                }

                // document.getElementById("group-date").innerText = `Group created on ${groupData.date}` || 'No data available';

                const avatarElement = document.getElementById("group-avatar");
                avatarElement.src =
                    groupData.image || "assets/img/profiles/avatar-03.jpg";

                const membersContainer =
                    document.getElementById("members-container");
                membersContainer.innerHTML = ""; // Clear previous members

                // Create an array of promises for fetching user details
                const memberPromises = groupData.userIds.map(
                    async (memberId) => {
                        const contactsRef = ref(
                            database,
                            `data/contacts/${currentUserId}/${memberId}`
                        );

                        return new Promise((resolve) => {
                            onValue(contactsRef, (contactSnapshot) => {
                                const contactData = contactSnapshot.val();
                                if (contactData) {
                                    resolve({
                                        ...contactData,
                                        displayName: contactData?.firstName
                                            ? `${contactData.firstName} ${contactData.lastName}`.trim()
                                            : contactData?.mobile_number,
                                        memberId,
                                    });
                                } else {
                                    const userRef = ref(
                                        database,
                                        `data/users/${memberId}`
                                    );
                                    onValue(userRef, (userSnapshot) => {
                                        const userData = userSnapshot.val();
                                        resolve({
                                            ...userData,
                                            displayName: userData?.firstName
                                                ? `${userData.firstName} ${userData.lastName}`.trim()
                                                : userData?.userName ||
                                                  "Unknown User",
                                            memberId,
                                        });
                                    });
                                }
                            });
                        });
                    }
                );

                // Await for all user details to be fetched
                const membersDetails = await Promise.all(memberPromises);

                // Process the user details
                membersDetails.forEach((user) => {
                    if (user) {
                        const memberElement = document.createElement("div");
                        memberElement.className = "card mb-3";

                        const isAdmin = groupData.createdBy === user.memberId; // Check if the user is the creator (admin)

                        const avatarClass =
                            user.status === "online"
                                ? "avatar avatar-lg online flex-shrink-0"
                                : "avatar avatar-lg flex-shrink-0";
                        const roleClass = isAdmin
                            ? "badge badge-danger"
                            : "badge badge-primary-transparent";
                        const roleText = isAdmin ? "Admin" : "Member";

                        memberElement.innerHTML = `
                            <div class="card-body">
                                <div class="d-flex align-items-center justify-content-between">
                                    <div class="d-flex align-items-center overflow-hidden">
                                        <span class="${avatarClass}">
                                            <img src="${
                                                user.image ||
                                                "assets/img/profiles/avatar-03.jpg"
                                            }" alt="img" class="rounded-circle">
                                        </span>
                                        <div class="ms-2 overflow-hidden">
                                            <h6 class="text-truncate mb-1">${
                                                user.displayName
                                            }</h6>
                                        </div>
                                        <div class="d-flex align-items-center ms-2">
                                            <span class="${roleClass} me-2">${roleText}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;

                        membersContainer.appendChild(memberElement);
                    }
                });
            }
        }, (error) => {
           
        });
    } catch (error) {
       
    }
}

document.getElementById("groupcontactInfoButton").addEventListener("click", function () {
    // Set this to the selected group's ID
    fetchGroupInfo(selectedGroupId);
    // Assuming you already have the groupId and currentUserId
const groupId = selectedGroupId;  // Replace with actual groupId
checkAdminAccess(groupId, currentUserId);
});

document.getElementById("group-logout").addEventListener("click", async function () {
    //await exitGroup(selectedGroupId, currentUserId);
});

// Function to handle exiting the group
async function exitGroup(groupId, userId) {
    const groupRef = ref(database, `data/groups/${groupId}`);

    try {
        const groupSnapshot = await get(groupRef);
        if (groupSnapshot.exists()) {
            const groupData = groupSnapshot.val();
            const members = groupData.userIds || [];
            const exitedUsers = groupData.grpExitUserIds || []; // Initialize as an empty array if not present

            // Check if the user is a member of the group
            if (members.includes(userId)) {
                // Remove the user from the members array
                const updatedMembers = members.filter(memberId => memberId !== userId);

                // Append the userId to grpExitUserIds array
                const updatedExitedUsers = [...exitedUsers, userId];

                // Update the group in the database
                await set(groupRef, {
                    ...groupData,
                    userIds: updatedMembers,
                    grpExitUserIds: updatedExitedUsers,
                });

                Toastify({
                    text: "You have successfully exited the group.",
                    duration: 3000, // Duration in milliseconds
                    gravity: "top", // `top` or `bottom`
                    position: "right", // `left`, `center` or `right`
                    backgroundColor: "#4caf50", // Green color for success
                    stopOnFocus: true, // Prevents dismissing of toast on hover
                }).showToast();

                // Optionally, refresh the group info
                fetchGroupInfo(groupId);
            } 
        } 
    } catch (error) {
        alert("An error occurred while trying to exit the group. Please try again.");
    }
}


// Add event listener to the document for the modal open event

    // Add an event listener for the exit group link
    document.querySelectorAll('.list-group-item[data-bs-target="#group-logout"]').forEach(item => {
        item.addEventListener('click', function () {
            // Get the data attributes for groupId and userId
            const groupId = this.getAttribute('data-group-id');
            const userId = this.getAttribute('data-user-id');

            // Store them in the modal for later use
            const confirmExitButton = document.getElementById('confirm-exit');
            confirmExitButton.setAttribute('data-group-id', groupId);
            confirmExitButton.setAttribute('data-user-id', userId);
        });
    });

    // Add event listener to confirm exit button
    document.getElementById('confirm-exit').addEventListener('click', function () {
        // Retrieve groupId and userId from the button's data attributes
        const groupId = this.getAttribute('data-group-id');
        const userId = this.getAttribute('data-user-id');
        exitGroup(selectedGroupId, currentUserId);
        // Optionally close the modal after confirming
        $('#group-logout').modal('hide');
    });


// Add event listener to the delete chat button
document.getElementById('deleteGroupBtn').addEventListener('click', function (event) {
    event.preventDefault(); // Prevent the default form submission
    deleteGroupChat(); // Call the deleteGroupChat function
});

// Function to delete a group chat
function deleteGroupChat() {
    const currentUser = auth.currentUser; // Get the currently logged-in user

    if (!currentUser) {
        return;
    }

    const currentUserId = currentUserId; // Get the current user's UID

    // Ensure selectedGroupId is set from the previous context
    if (!selectedGroupId) {
        return;
    }

    // Reference to the group in Firebase
    const groupRef = ref(database, `data/groups/${selectedGroupId}`);

    // Remove the group from the database
    remove(groupRef)
        .then(() => {
            closeGroupModal(); // Close modal after deletion

            // Hide the chat section
            const chatSection = document.getElementById('middle');
            if (chatSection) {
                chatSection.style.display = 'none'; // Hide the chat section
            }

            // Show the welcome container
            const welcomeContainer = document.getElementById('welcome-container');
            if (welcomeContainer) {
                welcomeContainer.style.display = 'block'; // Show the welcome container
            }

            // Optionally refresh the UI or redirect
        })
        .catch((error) => {
            alert("An error occurred while trying to delete the group.");
        });
}


function closeGroupModal() {
    const blockModal = bootstrap.Modal.getInstance(document.getElementById("delete-group")); // Get existing modal instance
    if (blockModal) {
        blockModal.hide(); // Hide the modal
    }
}

document.getElementById('close-group-btn').addEventListener('click', function (event) {
    event.preventDefault(); // Prevent default link behavior

    // Get the chat section by its ID
    const chatSection = document.getElementById('middle');
    const welcomeContainer = document.getElementById('welcome-container');

    if (chatSection) {
        chatSection.style.display = 'none'; // Hide the chat section
        welcomeContainer.style.display = 'block';
    } 
});

document.getElementById('clear-group-btn').addEventListener('click', function (event) {
    event.preventDefault(); // Prevent the default form submission
    clearGroupMessages(selectedGroupId);
});


function clearGroupMessages(selectedGroupId) {
    const messagesRef = ref(database, `data/chats/${selectedGroupId}`);

    get(messagesRef)
        .then((snapshot) => {
            if (snapshot.exists()) {
                const messages = snapshot.val();
                const updates = {};

                // Iterate over each message in the group
                Object.keys(messages).forEach((messageId) => {
                    const message = messages[messageId];
                    const clearedFor = message.clearedFor || [];

                    // If the current user has not cleared this message, add them to clearedFor
                    if (!clearedFor.includes(currentUserId)) {
                        updates[`chats/${selectedGroupId}/${messageId}/clearedFor`] = [...clearedFor, currentUserId];
                    }
                });

                // Apply updates to the database
                return update(ref(database), updates);
            }
        })
        .then(() => {
            // Clear UI
            const chatBox = document.getElementById("chat-messages");
            if (chatBox) {
                chatBox.innerHTML = ""; // Clear the chat box
            }

            // Close modal if applicable
            const modal = document.getElementById('clear-group-chat');
            if (modal) {
                const modalInstance = bootstrap.Modal.getInstance(modal);
                modalInstance?.hide();
            }
        })
        .catch((error) => {
            console.error("Error clearing chat:", error);
        });
}

function highlightActiveGroup(userId) {
    const userElements = document.querySelectorAll('[data-group-id]');

    userElements.forEach(userElement => {
        const id = userElement.getAttribute('data-group-id');
        
        // Remove active class from all users
        userElement.classList.remove('active'); 
        
        // Add active class to the selected user
        if (id === userId) {
            userElement.classList.add('active');
        }
    });
}

const emojiButton = document.getElementById('emoji-button');
const emojiPicker = document.getElementById('emoji-picker');
const emojiList = document.getElementById('emoji-list');
const inputField = document.getElementById('message-input');


const emojis = [
    // Smilies and Expressions
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😙', '😚', '😉', '😌', '😜', '😝', '😛', '😋', '😎', '😏', '😒', '😔', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😡', '😠', '🤬', '😷', '🤒', '🤕', '🥴', '😵', '🤯', '😳', '🥵', '🥶', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '😬', '😔', '🤪', '🤩', '🤪', '🥳', '😈', '👿',
    
    // Kiss & Hug
    '💋', '🤲', '💞', '💕', '💌', '💖', '💘',
    
    // People & Professions
    '👩‍💻', '👨‍💻', '👩‍⚖️', '👨‍⚖️', '👩‍🔬', '👨‍🔬', '👩‍🎨', '👨‍🎨', '👩‍🍳', '👨‍🍳', '🧑‍🎓', '👩‍🎓', '👨‍🎓', '👩‍🚀', '👨‍🚀', '👩‍⚕️', '👨‍⚕️', '👩‍🦳', '👨‍🦳', '👩‍🦰', '👨‍🦰',
    
    // Dress & Fashion
    '👗', '👚', '👕', '👖', '👔', '👙', '👒', '🎩', '👢', '👠', '👡', '👟', '🥾', '🥿', '👑', '👒',
    
    // Gift & Celebration
    '🎁', '🎉', '🎊', '🎀', '🎈', '🥳', '🎂', '🍰', '🧁', '🎆', '🎇', '🧨',
    
    // Clouds & Weather
    '☁️', '🌥️', '🌦️', '🌤️', '🌧️', '⛈️', '🌩️', '🌨️', '🌪️', '🌈', '🌬️',
    
    // Animals
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🦝', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐗', '🐴', '🐮', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐸', '🐍', '🐢', '🦎', '🦋', '🐛', '🐜', '🦀', '🦑', '🦐', '🦞', '🦓', '🦒',
    
    // Nature & Plants
    '🌹', '🌻', '🌺', '🌼', '🌷', '🌸', '💐', '🌵', '🌴', '🌳', '🌲', '🌱', '🍃', '🌾', '🌿', '🍂', '🍁',
    
    // Insects & Bugs
    '🐝', '🦋', '🐜', '🐞', '🐜', '🐛', '🦗', '🦟', 
    
    // Sun & Moon
    '🌞', '🌝', '🌚', '🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘',
    
    // Thunder & Storms
    '⚡', '🌩️', '⛈️', '🌧️',
    
    // Food & Drink
    '🍎', '🍏', '🍊', '🍋', '🍒', '🍉', '🍇', '🍓', '🍍', '🍑', '🍈', '🥥', '🥝', '🍅', '🥭', '🍆', '🥔', '🥕', '🌽', '🌶️', '🥒', '🍄', '🥯', '🍞', '🥖', '🧀', '🥩', '🍗', '🍖', '🥓', '🥚', '🍳', '🍔', '🍟', '🍕', '🌮', '🌯', '🥙', '🥗', '🍝', '🍜', '🍲', '🥘', '🍛', '🍣', '🍤', '🍥', '🥟', '🍡', '🍧', '🍨', '🍦', '🥧', '🍪', '🍩', '🍫', '🍬', '🍭', '🍮', '🍪',
    
    // Drinks & Cups
    '🍻', '🍺', '🍷', '🍸', '🍹', '🥤', '☕', '🥂', '🥃', '🍾', '🥄', '🍽️',
    
    // Snacks & Treats
    '🍪', '🍩', '🍫', '🍬', '🍭', '🍮', '🍧', '🍨', '🍦',
    
    // Activity & Sports
    '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🥏', '🏓', '🏸', '🥅', '🎱', '🥊', '🥋', '🥇', '🥈', '🥉', '🏅', '🏆', '🎗️', '🎟️', '🎫', '🛹',  '🎳', '🎮', '🕹️', '🎯', '🎮', '🥌', '🏒', '🥍',
    
    // Transportation & Vehicles
    '🚗', '🚙', '🚌', '🚎', '🚑', '🚒', '🚓', '🚕', '🚐', '🚚', '🚛', '🚜', '🚲', '🛵', '🏍️', '🚨', '🛴', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚆', '🚄', '🚅', '🚈', '🚞', '🚂', '🚢', '⛴️', '🚤', '🛳️', '⛵', '🚀', '🛸',
    
    // Places & Landmarks
    '🏰', '🏯', '🗼', '🗽', '🏝️', '🏞️', '🏜️', '🏖️', '🏕️', '🛤️', '⛰️', '🌋', '🏠', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦', '🏨', '🏩',
    
    // Objects & Things
    '🧳', '💼', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '📷', '📸', '📹', '📺', '📞', '☎️', '📠', '📡', '💡', '🔦', '🕯️', '🔌', '🔋', '🔋', '📦', '📑', '📎', '🖊️', '🖋️', '✏️', '📝', '📍', '📅', '🗓️', '📌', '📖', '📚', '📜',
    
    // Symbols
    '❤️', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💥', '💫', '✨', '💢', '💣', '💬', '🗨️', '🗯️', '❗', '❕', '❓', '❔', '💡', '🔅', '🔆', '🔎', '🔍', '🔓', '🔒', '🔑', '🗝️', '🛠️', '🧰', '🧲', '🖇️', '📶',
];


// Populate the emoji list dynamically
emojis.forEach(emoji => {
    const li = document.createElement('li');
    const emojiElement = document.createElement('a');
    emojiElement.href = 'javascript:void(0);';
    emojiElement.classList.add('emoji');
    emojiElement.textContent = emoji;
    li.appendChild(emojiElement);
    emojiList.appendChild(li);
});

// Toggle emoji picker visibility when the emoji button is clicked
emojiButton.addEventListener('click', () => {
    emojiPicker.style.display = (emojiPicker.style.display === 'none' || emojiPicker.style.display === '') ? 'block' : 'none';
});

// Add emoji to input field when an emoji is selected
const emojisInPicker = emojiPicker.querySelectorAll('.emoji');
emojisInPicker.forEach(emoji => {
    emoji.addEventListener('click', () => {
        inputField.value += emoji.textContent; // Add emoji to message input
        inputField.focus(); // Focus the input field
        inputField.selectionStart = inputField.selectionEnd = inputField.value.length; // Move cursor to the end
        emojiPicker.style.display = 'none'; // Hide the picker after selection
    });
});

 //Recorder

 let recorder;
 let context;
 let audio = document.querySelector("group_audio");
 let startBtn = document.getElementById("startRecordingGroup");
 let stopBtn = document.getElementById("stopRecordingGroup");
 let send_voice = document.getElementById("send_voice_group");
 window.URL = window.URL || window.webkitURL;

 /**
  * Detecte the correct AudioContext for the browser
  * */
 window.AudioContext = window.AudioContext || window.webkitAudioContext;
 navigator.getUserMedia =
     navigator.getUserMedia ||
     navigator.webkitGetUserMedia ||
     navigator.mozGetUserMedia ||
     navigator.msGetUserMedia;

 let onFail = function (e) {
     alert("Error " + e);
     console.log("Rejected!", e);
 };

 let onSuccess = function (s) {
     let tracks = s.getTracks();
     startBtn.setAttribute("disabled", true);
     send_voice.setAttribute("disabled", true);
     stopBtn.removeAttribute("disabled");
     context = new AudioContext();
     let mediaStreamSource = context.createMediaStreamSource(s);
     recorder = new Recorder(mediaStreamSource);
     recorder.record();

     stopBtn.addEventListener("click", () => {
         stopBtn.setAttribute("disabled", true);
         startBtn.removeAttribute("disabled");
         send_voice.removeAttribute("disabled");
         recorder.stop();
         tracks.forEach((track) => track.stop());
         recorder.exportWAV(function (s) {
             audio.src = window.URL.createObjectURL(s);
             const blobFile = new File([s], "file" + Date.now() + ".wav", {
                 type: "audio/wav",
             });
         });
     });

     send_voice.addEventListener("click", () => {
         stopBtn.setAttribute("disabled", true);
         startBtn.setAttribute("disabled", true);
         tracks.forEach((track) => track.stop());

         recorder.exportWAV(function (s) {
             const blobFile = new File([s], "file" + Date.now() + ".wav", {
                 type: "audio/wav",
             });
             voiceupload(blobFile, "");
             $("#record_audio_group").modal("hide");
             audio.removeAttribute("src");
         });
     });
 };

 startBtn.addEventListener("click", () => {
     navigator.mediaDevices
         .getUserMedia({ audio: true })
         .then(onSuccess)
         .catch(onFail);
 });

 async function voiceupload(files) {
     var fd = new FormData();
     fd.append("file", files);
     var atttype = 3;
     const fileUrl = await uploadFileToFirebase(files);
   //  const encryptedFileUrl = await encryptMessage(fileUrl);
     let attachment = {
        bytesCount : files.size,
        name : files.name,
        url : fileUrl
    }
     sendGroupMessage(selectedGroupId, attachment, atttype);
 }
 async function fetchContactsNotInGroup(groupId, currentUserId) {
    const contactsContainer = document.getElementById('contact-list-container');
    contactsContainer.innerHTML = `<div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
    </div>`;

    try {
        // Reference the paths in the database
        const contactsRef = ref(database, `data/contacts/${currentUserId}`);
        const groupMembersRef = ref(database, `data/groups/${groupId}/userIds`);

        // Get data snapshots
        const [contactsSnapshot, groupMembersSnapshot] = await Promise.all([
            get(contactsRef),
            get(groupMembersRef),
        ]);

        const contacts = contactsSnapshot.val() || {};
        const groupMemberIds = groupMembersSnapshot.val() || []; // Assume userIds is an array

        if (!Array.isArray(groupMemberIds)) {
            throw new Error("userIds is not an array in the database");
        }

        // Filter contacts not in the group's userIds list
        const nonMemberContacts = Object.entries(contacts).filter(
            ([contactId]) => !groupMemberIds.includes(contactId)
        );

        // Show a message if no contacts are available to add
        if (nonMemberContacts.length === 0) {
            contactsContainer.innerHTML = `<p class="text-center">No contacts available to add.</p>`;
            return;
        }

        // Render the contacts as checkboxes
        contactsContainer.innerHTML = nonMemberContacts
            .map(
                ([contactId, contactInfo]) => `
                <div class="list-group-item d-flex align-items-center">
                    <input type="checkbox" id="contact-${contactId}" class="form-check-input me-3"
                        onchange="toggleMemberSelection('${contactId}')">
                    <label for="contact-${contactId}" class="d-flex align-items-center">
                        <img src="${contactInfo.image || 'assets/img/profiles/avatar-03.jpg'}" alt="${contactInfo.firstName || contactInfo.mobile_number || contactInfo.email}" class="rounded-circle me-3" width="40">
                        <div>
                            <h6 class="mb-0">${contactInfo.firstName || contactInfo.mobile_number || contactInfo.email}</h6>
                            <small>${contactInfo.email || 'No email'}</small>
                        </div>
                    </label>
                </div>
            `
            )
            .join('');
    } catch (error) {
        console.error('Error fetching contacts:', error);
        contactsContainer.innerHTML = `<p class="text-center text-danger">Failed to load contacts. Please try again.</p>`;
    }
}

// Attach toggleMemberSelection to the global scope
window.toggleMemberSelection = toggleMemberSelection;

function toggleMemberSelection(contactId) {
    if (selectedMembers.includes(contactId)) {
        // Remove if already selected
        selectedMembers = selectedMembers.filter((id) => id !== contactId);
    } else {
        // Add if not already selected
        selectedMembers.push(contactId);
    }

    //console.log('Selected Members:', selectedMembers); // Debugging output
}

async function addSelectedMembersToGroup(groupId) {
    if (selectedMembers.length === 0) {
        alert('Please select at least one member to add.');
        return;
    }

    try {
        const groupMembersRef = ref(database, `data/groups/${groupId}/userIds`);

        // Fetch the existing userIds array
        const snapshot = await get(groupMembersRef);
        let existingUserIds = snapshot.val() || []; // Default to an empty array if no members exist

        if (!Array.isArray(existingUserIds)) {
            // Ensure userIds is an array
            existingUserIds = [];
        }

        // Add new members without duplicates
        const updatedUserIds = [...new Set([...existingUserIds, ...selectedMembers])];

        // Update the userIds array in the database
        await set(groupMembersRef, updatedUserIds);

        alert('Members added successfully!');
        const modal = bootstrap.Modal.getInstance(document.getElementById('group-add-new'));
        if (modal) modal.hide();

        // Clear the selection and refresh the modal
        selectedMembers = [];
        fetchContactsNotInGroup(groupId, currentUserId);
    } catch (error) {
        console.error('Error adding members to group:', error);
        //alert('Failed to add members. Please try again.');
    }
}


// Open the modal and fetch contacts not in the group
document.querySelector('[data-bs-target="#group-add-new"]').addEventListener('click', () => {
    const groupId = selectedGroupId; // Replace with your logic to get the current group ID
    fetchContactsNotInGroup(groupId, currentUserId); // Make sure currentUserId is defined globally
});

// Add selected members to the group when clicking "Add" button
document.getElementById('select-add-group').addEventListener('click', function (e) {
    e.preventDefault(); // Prevent default button behavior
    const groupId = selectedGroupId;
    addSelectedMembersToGroup(groupId);
});

document.getElementById('remove-group-memeber').addEventListener('click', function (e) {
    e.preventDefault(); // Prevent default button behavior
    const groupId = selectedGroupId;
    removeSelectedMembersFromGroup(groupId);
});

window.toggleRemoveSelection = toggleRemoveSelection;


async function fetchGroupMembers(groupId) {
    const membersContainer = document.getElementById('member-list-container');
    membersContainer.innerHTML = `<div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
    </div>`;

    try {
        // Reference the group members in Firebase
        const groupMembersRef = ref(database, `data/groups/${groupId}/userIds`);

        // Fetch the group members
        const snapshot = await get(groupMembersRef);
        const memberIds = snapshot.val() || [];

        if (!Array.isArray(memberIds)) {
            throw new Error("userIds is not an array in the database");
        }

        // Show a message if no members are in the group
        if (memberIds.length === 0) {
            membersContainer.innerHTML = `<p class="text-center">No members found in the group.</p>`;
            return;
        }

        // Fetch name, mobile_number, or email for each member and render the group members with checkboxes
        const memberDetails = await Promise.all(
            memberIds.map(async (memberId) => {
                const memberDetailsRef = ref(database, `data/contacts/${currentUserId}/${memberId}`);
                const detailsSnapshot = await get(memberDetailsRef);
                let memberData = detailsSnapshot.val();
                let displayName = '';

                if (memberData) {
                 
                    displayName = `${memberData.firstName || memberData.mobile_number || memberData.email}`; 
                } else {
                    if (currentUserId === memberId) {
                        const userRef = ref(database, `data/users/${currentUserId}`);
                        const userSnapshot = await get(userRef);
                        memberData = userSnapshot.val();
                        
                        displayName = `${memberData.firstName} ${memberData.lastName}`;  // Fallback to memberId if no data is found

                    }
                }

                return { memberId, displayName };
            })
        );

        // Render the group members with checkboxes
        membersContainer.innerHTML = memberDetails
            .map(
                ({ memberId, displayName }) => `
                <div class="list-group-item d-flex align-items-center">
                    <input type="checkbox" id="member-${memberId}" class="form-check-input me-3"
                        onchange="toggleRemoveSelection('${memberId}')">
                    <label for="member-${memberId}" class="d-flex align-items-center">
                        <div>
                            <h6 class="mb-0">${displayName}</h6>
                        </div>
                    </label>
                </div>
            `
            )
            .join('');
    } catch (error) {
        console.error('Error fetching group members:', error);
        membersContainer.innerHTML = `<p class="text-center text-danger">Failed to load members. Please try again.</p>`;
    }
}

let selectedRemoveMembers = []; // Array to hold selected members for removal

function toggleRemoveSelection(memberId) {
    if (selectedRemoveMembers.includes(memberId)) {
        // Remove if already selected
        selectedRemoveMembers = selectedRemoveMembers.filter((id) => id !== memberId);
    } else {
        // Add if not already selected
        selectedRemoveMembers.push(memberId);
    }

   // console.log('Selected Members for Removal:', selectedRemoveMembers); // Debugging output
}

async function removeSelectedMembersFromGroup(groupId) {
    if (selectedRemoveMembers.length === 0) {
        alert('Please select at least one member to remove.');
        return;
    }

    try {
        const groupMembersRef = ref(database, `data/groups/${groupId}/userIds`);

        // Fetch existing members
        const snapshot = await get(groupMembersRef);
        let existingMembers = snapshot.val() || [];

        if (!Array.isArray(existingMembers)) {
            throw new Error("userIds is not an array in the database");
        }

        // Remove selected members
        const updatedMembers = existingMembers.filter(
            (memberId) => !selectedRemoveMembers.includes(memberId)
        );

        // Update the database
        await set(groupMembersRef, updatedMembers);

        alert('Selected members removed successfully!');

        // Clear the selection and refresh the modal
        selectedRemoveMembers = [];
        fetchGroupMembers(groupId);

        // Hide the modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('group-remove'));
        if (modal) modal.hide();
    } catch (error) {
        console.error('Error removing members from group:', error);
        alert('Failed to remove members. Please try again.');
    }
}

document.querySelector('[data-bs-target="#group-remove"]').addEventListener('click', () => {
    fetchGroupMembers(selectedGroupId); // Ensure `selectedGroupId` is set correctly
});

async function checkAdminAccess(groupId, currentUserId) {
    try {
        // Reference the admin status in Firebase for the group
        const adminRef = ref(database, `data/groups/${groupId}/admin`);

        // Fetch the admin status
        const snapshot = await get(adminRef);
        const isAdmin = snapshot.val() === currentUserId;
        const addGroupBtn = document.getElementById("add-group-new");
        const removeGroupBtn = document.getElementById("remove-group-new");

        if (addGroupBtn) {
            addGroupBtn.style.display = isAdmin ? "block" : "none";
        }

        if (removeGroupBtn) {
            removeGroupBtn.style.display = isAdmin ? "block" : "none";
        }
       
    } catch (error) {
        console.error("Error checking admin status:", error);
    }
}



async function encryptMessage(messageText) {
    // Get CSRF token from meta tag
    const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute("content");

    try {
        // Send POST request to Laravel endpoint
        const response = await fetch('/process-encryption-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
            },
            body: JSON.stringify({ data: messageText }),
        });

        if (!response.ok) {
            throw new Error(`Failed to encrypt data. Status: ${response.status}`);
        }

        // Parse and return encrypted data
        const result = await response.json();
        return result.encryptedData;
    } catch (error) {
        console.error('Encryption error:', error);
        return null; // Return null in case of an error
    }
}

async function decryptlibsodiumMessage(encryptedMessage) {
    const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute("content");

    try {
        const response = await fetch('/decrypt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
            },
            body: JSON.stringify({ encryptedData: encryptedMessage }),
        });
        if (!response.ok) {
            throw new Error(`Decryption failed: ${response.status}`);
        }

        const result = await response.json();
        if (result.error) {
            throw new Error(result.error);
        }

        return result.decryptedData; // Decrypted message from Laravel
    } catch (error) {
        console.error('Decryption error:', error);
        return null; // Handle error appropriately
    }
}


});