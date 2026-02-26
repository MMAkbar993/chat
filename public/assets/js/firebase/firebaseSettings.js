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
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js';

initializeFirebase(function (app, auth, database,storage) {

let currentUser = null; // Define the current user here
let selectedUserId = null; // Store the selected user ID
let usersMap = {}; // Define usersMap here
let currentUserId = null;

// Monitor the user's authentication state
onAuthStateChanged(auth, (user) => {
  
    if (user) {
        currentUser = user; // Set currentUser to the signed-in user  
        document.getElementById('user-id').innerText = `Logged in as: ${currentUser.uid}`;
        currentUserId = user.uid;
        fetchUsers();
        fetchUserDetails(currentUser.uid);
        fetchUserDevices();
        fetchBlockedUsers();
        if (currentUserId === "qvs0EBUDnRPIQFlWnki62Rrh2w32" || currentUserId === "TKVRtzXcTCZOS9ZtDctJoEjAftp2") {

            // Disable the <a> tag with ID delete-demo
            const deleteDemoLink = document.getElementById('delete-demo');
            if (deleteDemoLink) {
                deleteDemoLink.style.pointerEvents = 'none'; // Disable clicks
                deleteDemoLink.style.opacity = '0.5'; // Make it appear disabled
            }

            const deactivateDemoLink = document.getElementById('deactivate-account-demo');
            if (deactivateDemoLink) {
                deactivateDemoLink.style.pointerEvents = 'none'; // Disable clicks
                deactivateDemoLink.style.opacity = '0.5'; // Make it appear disabled
            }
        }        

    } else {
        window.location.href = "/login";
       
        document.getElementById('user-id').innerText = 'No user logged in';
    }
});

// Delete Account
document.getElementById('deleteAccountForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent the default form submission
    const confirmDeleteCheckbox = document.getElementById('confirmDeleteCheckbox');
    const checkboxError = document.getElementById('checkboxError');

     // Check if the checkbox is selected
     if (!confirmDeleteCheckbox.checked) {
        checkboxError.style.display = 'block'; // Show error message
        return; // Stop execution if the checkbox is not checked
    } else {
        checkboxError.style.display = 'none'; // Hide error message if checked
    }
    deleteUserAccount(); // Call the function to delete the account
});

// Delete Account
function deleteUserAccount() {
    const currentUser = auth.currentUser; // Get the current user

    if (!currentUser) {
        alert("No user is currently logged in.");
        return;
    }

    // Ask for email and password to re-authenticate
    const email = prompt('Please enter your email address to confirm deletion:');
    
    // Handle Cancel case for the email prompt
    if (email === null) {
        return; // Exit the function if the user cancels
    }
    
    // Check if the entered email matches the logged-in user's email
    if (email !== currentUser.email) {
        Toastify({
            text: "Entered email does not match the logged-in user's email.",
            duration: 3000,
            gravity: "top",
            position: "right",
            backgroundColor: "#dc3545",
        }).showToast();
        return;
    }

    const password = prompt('Please enter your password to confirm deletion:');
    
    // Handle Cancel case for the password prompt
    if (password === null) {
        return; // Exit the function if the user cancels
    }

    // Re-authenticate the user
    signInWithEmailAndPassword(auth, email, password)
        .then(() => {
            Toastify({
                text: "User re-authenticated successfully!",
                duration: 3000,
                gravity: "top",
                position: "right",
                backgroundColor: "#28a745",
            }).showToast();

            // Reference to the user in your Firebase Realtime Database
            const userRef = ref(database, `data/users/${currentUser.uid}`);

            // Delete the user's data from the database
            return remove(userRef);
        })
        .then(() => {
            Toastify({
                text: "User data deleted successfully!",
                duration: 3000,
                gravity: "top",
                position: "right",
                backgroundColor: "#28a745",
            }).showToast();

            // Now delete the user from Firebase Authentication
            return currentUser.delete();
        })
        .then(() => {
            Toastify({
                text: "User account deleted successfully!",
                duration: 3000,
                gravity: "top",
                position: "right",
                backgroundColor: "#28a745",
            }).showToast();

            // Redirect to the login page
            window.location.href = "/login"; // Change this to your actual login page URL
        })
        .catch((error) => {
            alert('There was an error deleting your account. Please try again.');
            console.error("Error:", error);
        });
}



// Deactivate Account
document.getElementById('deactivate-account').addEventListener('change', function (e) {
    const isChecked = e.target.checked;

    // Show the deactivation confirmation popup when the checkbox is checked
    if (isChecked) {
        const deactivateModal = new bootstrap.Modal(document.getElementById('deactivate-account-modal'));
        deactivateModal.show();
    }
});

// Handle the deactivation button click in the popup
document.getElementById('confirm-deactivate').addEventListener('click', function () {
    // Call the handleAccountDeactivation function with 'true' for deactivation
    handleAccountDeactivation(true);

    // Close the modal after deactivation
    const deactivateModal = bootstrap.Modal.getInstance(document.getElementById('deactivate-account-modal'));
    deactivateModal.hide();

    // Optionally, uncheck the switch after confirmation if needed
    document.getElementById('deactivate-account').checked = false;
});

// Handle the Cancel button click in the popup
document.querySelector('#cancel-deactivate').addEventListener('click', function () {
    // Uncheck the deactivate switch when the Cancel button is clicked
    document.getElementById('deactivate-account').checked = false;
});

document.querySelector('#close-deactivate').addEventListener('click', function () {
    // Uncheck the deactivate switch when the Cancel button is clicked
    document.getElementById('deactivate-account').checked = false;
});

// Deactivate Account logic
function handleAccountDeactivation(isDeactivated) {
    if (!currentUser) {
        return;
    }

    const userRef = ref(database, `data/users/${currentUser.uid}`);
    const currentTimestamp = Date.now();

    // Add a deactivation timestamp when deactivating the account
    const updateData = {
        isDeactivated: isDeactivated,
        deactivationTimestamp: isDeactivated ? currentTimestamp : null // Set timestamp when deactivated, null when reactivated
    };

    update(userRef, updateData)
        .then(() => {
            const message = `Your account has been ${isDeactivated ? 'deactivated' : 'reactivated'}.`;

            Toastify({
                text: message,
                duration: 3000, // Duration in milliseconds
                gravity: "top", // Positioning: top or bottom
                position: "right", // Positioning: left, center, or right
                backgroundColor: isDeactivated ? "#FF5733" : "#28a745", // Different colors for deactivation/reactivation
                className: "toast-message", // Optional: add a class for custom styling
            }).showToast();

            if (isDeactivated) {
                // Sign out and redirect to login page after deactivation
                signOut(auth).then(() => {
                    window.location.href = "/login";
                }).catch((error) => {
                    console.error("Error during sign-out:", error);
                });
            }
        })
        .catch((error) => {
            console.error("Error updating account:", error);
        });
}

const logoutButton = document.getElementById("logout-button");
   
logoutButton.addEventListener("click", function(event) {
    event.preventDefault(); // Prevent default action (if any)
    logoutUser(); // Call the logoutUser function
});

const profilelogoutButton = document.getElementById("profile-logout-button");

profilelogoutButton.addEventListener("click", function(event) {
    event.preventDefault(); // Prevent default action (if any)
    logoutUser(); // Call the logoutUser function
});

const SettinglogoutButton = document.getElementById("setting-logout-button");

SettinglogoutButton.addEventListener("click", function(event) {
    event.preventDefault(); // Prevent default action (if any)
    logoutUser(); // Call the logoutUser function
});


function logoutUser() {
if (auth.currentUser) {
    const userId = auth.currentUser.uid;
    const userStatusRef = ref(database, `data/users/${userId}/online`);
    const lastSeenRef = ref(database, `data/users/${userId}/lastSeen`); // Reference to last seen
    // const deviceInfoRef = ref(database, `data/users/${userId}/device_info`); // Reference to device_info

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
        window.location.href = "/login";
    }).catch((error) => {
       
        // Optionally, redirect to the login page in case of an error
        window.location.href = "/login";
    });
} else {
    // No user logged in, redirect directly to logout
    window.location.href = "/login";;
}
}

// Device Management
function removeDevice(deviceId, element) {
    const userId = auth.currentUser.uid; // Get the current user's ID
    const deviceRef = ref(database, `data/users/${userId}/device_info/${deviceId}`);

   
    // Remove the device from Firebase Realtime Database
    remove(deviceRef)
        .then(() => {
            Toastify({
                text: "Device removed successfully!",
                duration: 3000,
                gravity: "top",
                position: "right",
                style: { background: "#28a745" }, // Use style instead of backgroundColor
            }).showToast();
        
            window.location.href = '/';
            // Ensure the element is valid before removing
            if (element && element.parentNode) {
              
                element.parentNode.removeChild(element); // Remove the exact element passed
            } else {
              
                return; // Exit the function if the element is null
            }

            // Optionally check if the removed device belongs to another user
            checkOtherUsersLoggedIn(deviceId);
        })
        .catch((error) => {
          
        });
}

// Function to check if the removed device ID belongs to another user
function checkOtherUsersLoggedIn(deviceId) {
    const usersRef = ref(database, 'data/users'); // Reference to all users

    onValue(usersRef, (snapshot) => {
        const users = snapshot.val();
        for (let user in users) {
            const userDevices = users[user].device_info;
            if (userDevices && userDevices[deviceId]) {
                // This user has the device that's being removed
                signOutUser(user);
            }
        }
    });
}

// Function to sign out a specific user
function signOutUser(userId) {
    const userAuth = getAuth(); // Get the Auth instance

    // Assuming you have a method to find the user by userId
    // Sign out the user from Firebase Authentication
    userAuth.signOut().then(() => {
        // Redirect to login page after signing out
        window.location.href = "/login"; // Redirect to login page
    }).catch((error) => {
    });
}

// Device Management
function formatTimestamp(timestamp) {
    const date = new Date(timestamp); // Create a Date object from the timestamp
    return date.toLocaleString(); // Converts to a string based on user's locale
}

function fetchUserDevices() {
    const userId = auth.currentUser.uid;
    const userRef = ref(database, 'data/users/' + userId + '/device_info');

    // Listening to value changes in the devices reference
    onValue(userRef, (snapshot) => {
        const devices = snapshot.val();
        const deviceList = document.getElementById('deviceList');
        deviceList.innerHTML = ''; // Clear existing device list

        // If devices exist in the database, render each unique device
        if (devices) {
            const uniqueDeviceNames = new Set(); // Track unique device names

            for (let key in devices) {
                const device = devices[key];

                // Skip the device if the name is already processed
                if (uniqueDeviceNames.has(device.device_name)) {
                    continue;
                }

                // Add the device name to the Set
                uniqueDeviceNames.add(device.device_name);

                const deviceItem = document.createElement('div');
                deviceItem.className = 'd-flex justify-content-between align-items-center mb-3';
                deviceItem.innerHTML = `
                    <div class="d-flex align-items-center">
                        <span class="device-icon d-flex justify-content-center align-items-center bg-transparent-dark rounded-circle me-2">
                            <i class="ti ti-device-laptop"></i>
                        </span>
                        <div>
                            <h6 class="fs-16">${device.device_name}</h6>
                            <span class="fs-16">${formatTimestamp(device.last_used)}</span>
                        </div>
                    </div>
                `;


                // Append the device item to the deviceList container
                deviceList.appendChild(deviceItem);
            }
        }
    });
}

// Device Management
function logoutFromAllDevices() {
    const userId = auth.currentUser.uid;// Get the current user's ID
    const devicesRef = ref(database, `data/users/${userId}/device_info`);

    remove(devicesRef)
        .then(() => {
            Toastify({
                text: "Logged out from all devices successfully!",
                duration: 3000,
                gravity: "top",
                position: "right",
                backgroundColor: "#28a745",
            }).showToast();
            const auth = getAuth(); // Get the Auth instance
            return signOut(auth); // Sign out from Firebase Auth
        })
        .then(() => {
            Toastify({
                text: "User signed out from current device!",
                duration: 3000,
                gravity: "top",
                position: "right",
                backgroundColor: "#28a745",
            }).showToast();
            // Redirect to the login page using the APP_URL variable
            window.location.href = "/login"; // Redirect
        })
        .catch((error) => {
          
        });
}

// Device Management
document.getElementById('logoutAllDevicesBtn').addEventListener('click', logoutFromAllDevices);

// List BLock Users

    document.getElementById('block-list-user').addEventListener('click', function() {
      
        fetchBlockedUsers(); // Fetch blocked users when the modal is opened
    });


// List BLock Users
function fetchBlockedUsers() {
    const currentUser = auth.currentUser;

    if (!currentUser) {
        return;
    }

    const currentUserId = currentUser.uid;

    // Reference to the current user's blocked users list in Firebase
    const blockedUsersRef = ref(database, `data/blocked_users/${currentUserId}`);

    // Fetch the blocked users
    get(blockedUsersRef)
        .then((snapshot) => {
            const blockedUserList = document.getElementById('blockedUserList');
            blockedUserList.innerHTML = ''; // Clear previous entries

            if (snapshot.exists()) {
                const blockedUsers = snapshot.val();

                // Check if there are any blocked users
                if (Object.keys(blockedUsers).length === 0) {
                    // Display message if no contacts are blocked
                    const noContactsMessage = document.createElement("p");
                    noContactsMessage.textContent = "No contacts blocked.";
                    noContactsMessage.classList.add("text-muted", "text-center");
                    blockedUserList.appendChild(noContactsMessage);
                    return;
                }

                // Iterate through each blocked user and log the details
                Object.keys(blockedUsers).forEach(userId => {
                    const blockedDate = blockedUsers[userId].blocked_date;

                    // Fetch the firstName of the blocked user from the users node
                    const userRef = ref(database, `data/users/${userId}`); // Reference to user details
                    get(userRef).then(userSnapshot => {
                        if (userSnapshot.exists()) {
                            const userData = userSnapshot.val();
                            const firstName = userData.firstName || ''; // Assuming firstName exists
                            const profileImage = userData.image || 'assets/img/profiles/avatar-03.jpg';

                            // Create a list item to display the blocked user
                            const userListDiv = document.createElement("div");
                            userListDiv.classList.add(
                                "contact-user",
                                "d-flex",
                                "align-items-center",
                                "justify-content-between"
                            );

                            // Create link for user
                            const userLinks = document.createElement("a");
                            userLinks.href = "#"; // Prevent default action
                            userLinks.classList.add("contact-user-link");

                            const userInnerDiv = document.createElement("div");
                            userInnerDiv.classList.add("d-flex", "align-items-center");

                            // Create avatar div
                            const userAvatarDiv = document.createElement("div");
                            userAvatarDiv.classList.add("avatar", "avatar-lg");

                            // Create avatar image element
                            const userAvatarImage = document.createElement("img");
                            userAvatarImage.src = profileImage; // User profile image
                            userAvatarImage.classList.add("rounded-circle");
                            userAvatarImage.alt = `${firstName}'s image`;
                            userAvatarDiv.appendChild(userAvatarImage);

                            const userInfoDiv = document.createElement("div");
                            userInfoDiv.classList.add("ms-2");

                            const userInfoName = document.createElement("h6");
                            userInfoName.textContent = firstName; // Display full name

                            const userInfoBlockedDate = document.createElement("p");
                            userInfoBlockedDate.textContent = `Blocked on: ${new Date(blockedDate).toLocaleString()}`;
                            userListDiv.setAttribute("data-user-id", userId); // Assign user ID as a data attribute

                            // Append elements to the user info div
                            userInfoDiv.appendChild(userInfoName);
                            userInfoDiv.appendChild(userInfoBlockedDate);
                            userInnerDiv.appendChild(userAvatarDiv);
                            userInnerDiv.appendChild(userInfoDiv);
                            userLinks.appendChild(userInnerDiv);
                            userListDiv.appendChild(userLinks);

                            // Create the Unblock button
                            const unblockButton = document.createElement("button");
                            unblockButton.classList.add("btn", "btn-danger", "ms-2");
                            unblockButton.textContent = "Unblock";
                            unblockButton.onclick = () => unblockUser(currentUserId, userId); // Call the unblockUser function

                            // Append the unblock button to the user list item
                            userListDiv.appendChild(unblockButton);

                            blockedUserList.appendChild(userListDiv);
                        }
                    });
                });
            } else {
                // Display message if no contacts are blocked
                const noContactsMessage = document.createElement("p");
                noContactsMessage.textContent = "No contacts blocked.";
                noContactsMessage.classList.add("text-muted", "text-center");
                blockedUserList.appendChild(noContactsMessage);
            }
        })
        .catch((error) => {
            console.error("Error fetching blocked users:", error);
        });
}

// UnBlock Users
function unblockUser(currentUserId, blockedUserId) {
    const blockedUserRef = ref(database, `data/blocked_users/${currentUserId}/${blockedUserId}`);

    remove(blockedUserRef)
        .then(() => {
            Toastify({
                text: "user has been unblocked successfully!",
                duration: 3000,
                gravity: "top",
                position: "right",
                backgroundColor: "#28a745",
            }).showToast();
           
            // Optionally remove the user from the DOM immediately
            const userListDiv = document.querySelector(`[data-user-id="${blockedUserId}"]`);
            if (userListDiv) {
                userListDiv.remove();  // Remove the user element from the list
            }
           
            // Refresh the list after unblocking
            fetchBlockedUsers();
        })
        .catch((error) => {
           
        });
}

// Get Users
function fetchUsers() {
    const usersRef = ref(database, 'data/users'); // Path to your users data
  

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
                        displayUserDetails(loggedInUserDetails);
                    } 
                } 
            } 
        })
        .catch((error) => {
           
        });
}

async function fetchBasicSettings() {
    try {
        const settingsRef = ref(database, 'data/basic_settings'); // Replace 'adminId' with the actual admin user ID
        const snapshot = await get(settingsRef);

        if (snapshot.exists()) {
            const data = snapshot.val();
            document.getElementById('TermsText').value = data.terms_conditions || ''; // Populate Terms & Conditions
            document.getElementById('privacyPolicyText').value = data.privacy_policy || ''; // Populate Privacy Policy
        } 
    } catch (error) {
     
    }
}

// Call the function when the document is loaded

    fetchBasicSettings(); // Fetch basic settings for all users




// Get User Details
function fetchUserDetails(userId) {
    const userRef = ref(database, 'data/users/' + userId);
    get(userRef)
        .then((snapshot) => {
            if (snapshot.exists()) {
                const user = snapshot.val();
                // Populate the input fields with existing user data
                document.getElementById('firstName').value = user.firstName || '';
                document.getElementById('lastName').value = user.lastName || '';
                document.getElementById('gender').value = user.gender || '';
                document.getElementById('dob').value = user.dob || '';
                document.getElementById('country').value = user.country || '';
                document.getElementById('about').value = user.about || '';
                document.getElementById('mobile_number').value = user.mobile_number || '';
                document.getElementById('email').value = user.email || '';
                document.getElementById('user_name').value = user.username || '';
                document.getElementById('uid').value = user.uid || '';


                document.getElementById('facebook_link').value = user.facebook_link || '';
                document.getElementById('google_link').value = user.google_link || '';
                document.getElementById('twitter_link').value = user.twitter_link || '';
                document.getElementById('linkedin_link').value = user.linkedin_link || '';
                document.getElementById('youtube_link').value = user.youtube_link || '';

                var roleSelect = document.getElementById('primary_role');
                if (roleSelect && user.primary_role) {
                    roleSelect.value = user.primary_role;
                }
                var otherRoleWrapper = document.getElementById('other_role_wrapper');
                var otherRoleInput = document.getElementById('other_role_text');
                if (otherRoleWrapper && otherRoleInput) {
                    if (user.primary_role === 'other') {
                        otherRoleWrapper.style.display = 'block';
                        otherRoleInput.value = user.other_role_text || '';
                    } else {
                        otherRoleWrapper.style.display = 'none';
                    }
                }

                const savedBackground = user.background || '';
                if (savedBackground) {
                    // Find the image-wrap with the saved image URL and mark it as selected
                    const selectedImage = document.querySelector(`.img-wrap[data-image="${savedBackground}"]`);
                    if (selectedImage) {
                        selectedImage.classList.add('selected');  // Highlight the saved image
                    }
                }
                
                // Fetch and set the "profile_info" value
                const ProfileInfo = user.profile_info || 'select';  // Default to 'select' if not available
                document.getElementById('profileInfoSelect').value = ProfileInfo;

                // If "profile_info" is "Except", show excluded users list and populate it
                if (ProfileInfo === 'Except') {
                    // Show the user list container for exclusions
                    document.getElementById('profile-user-list').style.display = 'block';

                    // Fetch excluded users for profile info
                    const excludedProfileUsers = user.excluded_profile_info_users || [];

                    if (excludedProfileUsers.length > 0) {
                        loadUserListProfile().then(() => {
                            const profileInfoSelect = document.getElementById('profile-user-list');
                            excludedProfileUsers.forEach(userId => {
                                const option = profileInfoSelect.querySelector(`option[value="${userId}"]`);
                                if (option) {
                                    option.selected = true; // Pre-select the option
                                }
                            });
                        });
                    }
                } else {
                    // Hide the user list container if "profile_info" is not "Except"
                    document.getElementById('profile-user-list').style.display = 'none';
                }

                // Fetch and set the "last_seen" value
                const lastSeen = user.last_seen || 'select';  // Default to 'select' if not available
                document.getElementById('lastSeenSelect').value = lastSeen;

                // If "last_seen" is "Except", show excluded users list and populate it
                if (lastSeen === 'Except') {
                    // Show the user list container for exclusions
                    document.getElementById('last-seen-user-list').style.display = 'block';

                    // Fetch excluded users for Last Seen
                    const excludedUsers = user.excluded_last_seen_users || [];

                    if (excludedUsers.length > 0) {
                        loadUserListLastSeen().then(() => {
                            const lastSeenSelect = document.getElementById('last-seen-user-select');
                            excludedUsers.forEach(userId => {
                                const option = lastSeenSelect.querySelector(`option[value="${userId}"]`);
                                if (option) {
                                    option.selected = true; // Pre-select the option
                                }
                            });
                        });
                    }
                } else {
                    // Hide the user list container if "last_seen" is not "Except"
                    document.getElementById('last-seen-user-list').style.display = 'none';
                }

                // Fetch and set the "status" value
                const Status = user.status_info || 'select';  // Default to 'select' if not available
                document.getElementById('statusSelect').value = Status;

                // If "status" is "Except", show excluded users list and populate it
                if (Status === 'Except') {
                    // Show the user list container for exclusions
                    document.getElementById('status-user-list').style.display = 'block';

                    // Fetch excluded users for status
                    const excludedStatusUsers = user.excluded_status_users || [];

                    if (excludedStatusUsers.length > 0) {
                        loadUserListStatus().then(() => {
                            const statusSelect = document.getElementById('status-user-select');

                           

                            excludedStatusUsers.forEach(userId => {
                                const option = statusSelect.querySelector(`option[value="${userId}"]`);
                                if (option) {
                                    option.selected = true; // Pre-select the option
                                  
                                } 
                            });
                        }).catch(error => {
                           
                        });
                    }
                } else {
                    // Hide the user list container if "status" is not "Except"
                    document.getElementById('status-user-list').style.display = 'none';
                }

            } 
        })
        .catch((error) => {
        
        });
}

// Display Details
function displayUserDetails(user) {
    document.getElementById('profile-name').innerText = user.username || "No Name";
    document.getElementById('profile-info-name').innerText = user.firstName + ' ' + user.lastName || "No Name";
    document.getElementById('profile-info-chat-name').innerText = user.firstName + ' ' + user.lastName || "No Name";
    document.getElementById('profile-info-email').innerText = user.email || "No Email";
    document.getElementById('profile-info-phone').innerText = user.mobile_number || "No Phone";
    document.getElementById('profile-info-country').innerText = user.country || "No Country";
    document.getElementById('profile-info-about').innerText = user.about || "No Bio";
    document.getElementById('profile-info-bio').innerText = user.about || "No Bio";
    document.getElementById('profile-info-gender').innerText = user.gender || "No Gender";

    var roleEl = document.getElementById('profile-info-role');
    if (roleEl) {
        var roleLabel = '';
        if (user.primary_role && typeof PRIMARY_ROLES !== 'undefined') {
            roleLabel = PRIMARY_ROLES[user.primary_role] || user.primary_role;
            if (user.primary_role === 'other' && user.other_role_text) {
                roleLabel += ' (' + user.other_role_text + ')';
            }
        }
        roleEl.innerText = roleLabel || 'Not set';
    }
    document.getElementById('profile-info-youtube').innerText = user.youtube_link || "No youtube link";
    document.getElementById('profile-info-linkedin').innerText = user.linkedin_link || "No linkedin link";
    document.getElementById('profile-info-twitter').innerText = user.twitter_link || "No twitter link";
    document.getElementById('profile-info-google').innerText = user.google_link || "No google link";
    document.getElementById('profile-info-facebook').innerText = user.facebook_link || "No facebook link";
    document.getElementById('profileImage').innerText = user.image || "No Profile image";
    document.getElementById('profileImageProfile').innerText = user.image || "No Profile image";
    document.getElementById('profileImageChat').innerText = user.image || "No Profile image";
    document.getElementById('ProfileImageSidebar').innerText = user.image || "No Profile image";
    displayJoinDate(user.timestamp);
    if (user.image) {
        document.getElementById('profileImage').src = user.image; // Set the profile image URL
    } else {
        document.getElementById('profileImage').src = 'assets/img/profiles/avatar-03.jpg'; // Optional: set a default image
    }
    if (user.image) {
        document.getElementById('profileImageProfile').src = user.image; // Set the profile image URL
    } else {
        document.getElementById('profileImageProfile').src = 'assets/img/profiles/avatar-03.jpg'; // Optional: set a default image
    }
    if (user.image) {
        document.getElementById('profileImageChat').src = user.image; // Set the profile image URL
    } else {
        document.getElementById('profileImageChat').src = 'assets/img/profiles/avatar-03.jpg'; // Optional: set a default image
    }
    if (user.image) {
        document.getElementById('ProfileImageSidebar').src = user.image; // Set the profile image URL
    } else {
        document.getElementById('ProfileImageSidebar').src = 'assets/img/profiles/avatar-03.jpg'; // Optional: set a default image
    }
    // Add other fields as needed
}

function displayJoinDate(timestamp) {
    if (timestamp) {
        // Convert timestamp (milliseconds) to a Date object
        const date = new Date(timestamp);

        // Format the date to a readable format
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        const formattedDate = date.toLocaleDateString(undefined, options);

        // Display the formatted date
        document.getElementById('profile-info-join-date').innerText = `${formattedDate}`;
    } else {
        document.getElementById('profile-info-join-date').innerText = '-';
    }
}

// Save User Details
document.getElementById('saveProfileBtn').addEventListener('click', function (event) {
    event.preventDefault(); // Prevent the default action of the form submission

if(currentUserId == "qvs0EBUDnRPIQFlWnki62Rrh2w32" || currentUserId == "TKVRtzXcTCZOS9ZtDctJoEjAftp2")
{
    Toastify({
        text: "Can't able to edit in demo user!",
        duration: 3000,
        gravity: 'top',
        position: 'right',
        backgroundColor: '#ffc107',
    }).showToast();
    return;
}

    // Get user input values
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const gender = document.getElementById('gender').value.trim();
    const dob = document.getElementById('dob').value.trim();
    const country = document.getElementById('country').value.trim();
    const about = document.getElementById('about').value.trim();
    const username = document.getElementById('user_name').value.trim();
    const email = document.getElementById('email').value.trim();
    const mobile_number = document.getElementById('mobile_number').value.trim();
    const uid = document.getElementById('uid').value.trim();

    const fields = [
        {
            id: 'firstName',
            value: firstName,
            regex: /^[A-Za-z\s]+$/,
            requiredError: 'First name is required.',
            formatError: 'First name must only contain letters and spaces.',
        },
        {
            id: 'email',
            value: email,
            regex: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/,
            requiredError: 'Email address is required.',
            formatError: 'Enter a valid email address.',
        },
        {
            id: 'mobile_number',
            value: mobile_number,
            regex: /^[0-9]{10,21}$/,
            requiredError: 'Mobile number is required.',
            formatError: 'Mobile number length must be 10 to 21 digits.',
        },
        {
            id: 'lastName',
            value: lastName,
            regex: /^[A-Za-z\s]+$/,
            requiredError: 'Last name is required.',
            formatError: 'Last name must only contain letters and spaces.',
        },
        {
            id: 'country',
            value: country,
            regex: /^[A-Za-z\s]+$/,
            requiredError: 'Country is required.',
            formatError: 'Country must only contain letters and spaces.',
        }
    ];

    // Validation flags
    let isValid = true;

    // Clear previous error messages

    // Validate each field
    fields.forEach(field => {
        const errorElement = document.getElementById(`${field.id}_error`);
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none'; // Hide the error message initially
        }
    
        if (!field.value) {
            if (errorElement) {
                errorElement.textContent = field.requiredError;
                errorElement.classList.add('active');
                errorElement.style.display = 'block';
              
            }
         
            isValid = false;
        } else if (field.regex && !field.regex.test(field.value)) {
          
            if (errorElement) {
                errorElement.textContent = field.formatError;
                errorElement.classList.add('active');

                errorElement.style.display = 'block';
               
            }
           
            isValid = false;
        }
    });
    
    if (!isValid) {
      
        return;
    }
    

    // Get the current user's ID
    const userId = currentUser?.uid;
    if (!userId) {
        return;
    }

    const primaryRole = document.getElementById('primary_role')?.value || '';
    const otherRoleText = document.getElementById('other_role_text')?.value?.trim() || '';

    const userData = {
        gender: gender,
        dob: dob,
        country: country,
        about: about,
        mobile_number: mobile_number,
        username: username,
        uid: uid,
        primary_role: primaryRole,
        other_role_text: primaryRole === 'other' ? otherRoleText : '',
    };

    if (typeof IS_KYC_VERIFIED === 'undefined' || !IS_KYC_VERIFIED) {
        userData.firstName = capitalizeFirstLetter(firstName);
        userData.lastName = capitalizeFirstLetter(lastName);
    }

    if ((typeof IS_KYC_VERIFIED === 'undefined' || !IS_KYC_VERIFIED) &&
        (typeof IS_EMAIL_VERIFIED === 'undefined' || !IS_EMAIL_VERIFIED)) {
        userData.email = email;
    }

    // Reference to the user data in Firebase
    const userRef = ref(database, 'data/users/' + userId);

    // Update user data in Firebase without removing existing fields
    update(userRef, userData)
        .then(() => {
            Toastify({
                text: 'Profile updated successfully!',
                duration: 3000,
                gravity: 'top',
                position: 'right',
                backgroundColor: '#28a745',
            }).showToast();

            // If an image is selected, upload it to storage
            if (selectedImage) {
                uploadProfileImage(selectedImage, userId);
            }
        })
        .catch(error => {
          
        });
});

var primaryRoleSelect = document.getElementById('primary_role');
if (primaryRoleSelect) {
    primaryRoleSelect.addEventListener('change', function () {
        var otherWrapper = document.getElementById('other_role_wrapper');
        if (otherWrapper) {
            otherWrapper.style.display = this.value === 'other' ? 'block' : 'none';
        }
    });
}

let selectedImage;

// Save User Details
document.getElementById('uploadIcon').addEventListener('click', function() {
    document.getElementById('imageUpload').click();
});

// Save User Details
function uploadProfileImage(file, userId) {
    const imageRef = storageRef(storage, 'profile_images/' + userId + '/' + file.name);
    const uploadTask = uploadBytesResumable(imageRef, file);

    uploadTask.on('state_changed',
        (snapshot) => {
            // Optionally, monitor the upload progress here
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
           
        },
        (error) => {
          
        },
        () => {
            // Upload completed successfully, now get the download URL
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
              
                // Update the user's profile with the image URL
                const userImageRef = ref(database, 'data/users/' + userId +
                '/image'); // Use dbRef to refer to the database
                set(userImageRef, downloadURL) // Save the image URL to the user's profile
                    .then(() => {
                       
                        window.location.reload();
                    })
                    .catch((error) => {
                      
                    });
            });
        }
    );
}

// Save User Details
const allowedFileTypes = ['image/svg+xml', 'image/jpeg', 'image/png', 'image/jpg'];
document.getElementById('imageUpload').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        if (!allowedFileTypes.includes(file.type)) {
            // Show error toast for invalid file format
            Toastify({
                text: "Upload only files in SVG, JPG, JPEG, or PNG format.",
                duration: 3000,
                gravity: "top",
                position: "right",
                backgroundColor: "#dc3545", // Error color
            }).showToast();
            return;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('profileImage').src = e.target.result; // Preview the selected image
            selectedImage = file; // Store the selected file for uploading later
        };
        reader.readAsDataURL(file); // Read the file as a data URL
    }
});

// Save Social Links
document.getElementById('saveSocialLinksBtn').addEventListener('click', function(event) {
    event.preventDefault(); // Prevent default form submission

    // Get user input values for social links
    const youtube = document.getElementById('youtube_link').value;
    const linkedin = document.getElementById('linkedin_link').value;
    const twitter = document.getElementById('twitter_link').value;
    const google = document.getElementById('google_link').value;
    const facebook = document.getElementById('facebook_link').value;

    // Get the current user's ID
    const userId = currentUser.uid; // Make sure currentUser is defined

    // Social links data object
    const socialLinksData = {
        youtube_link: youtube,
        linkedin_link: linkedin,
        twitter_link: twitter,
        google_link: google,
        facebook_link: facebook
    };

    // Reference to the user data in Firebase
    const userRef = ref(database, 'data/users/' + userId);

    // Update the user data in Firebase without removing existing fields
    update(userRef, socialLinksData)
        .then(() => {
          
            Toastify({
                text: "Social links updated successfully!",
                duration: 3000,
                gravity: "top",
                position: "right",
                backgroundColor: "#28a745",
            }).showToast();
        })
        .catch((error) => {
           
        });
});


// Profile Info

document.getElementById('profileInfoSelect').addEventListener('change', function(event) {
    const selectedValue = event.target.value;
    const userList = document.getElementById('profile-user-list');

    if (selectedValue === 'Except') {
        loadUserListProfile();
        userList.style.display = 'block';
    } else {
        userList.innerHTML = '';
        userList.style.display = 'none';
    }
});


async function loadUserListProfile() {
    const userList = document.getElementById('profile-user-select');
    if (!userList) {
      
        return;
    }
    const userId = currentUser.uid;
    const contactsRef = ref(database, 'data/contacts/' + userId );

    try {
        const contactsSnapshot = await get(contactsRef);
        const userIdsToDisplay = [];

        if (contactsSnapshot.exists()) {
            const contacts = contactsSnapshot.val();
            for (const contactId in contacts) {
                userIdsToDisplay.push(contacts[contactId].contact_id);
            }
        } else {
           
            return;
        }

        const usersRef = ref(database, 'data/users');
        const snapshot = await get(usersRef);

        if (snapshot.exists()) {
            const users = snapshot.val();
            userList.innerHTML = '';

            for (const userId in users) {
                if (userIdsToDisplay.includes(userId)) {
                    const user = users[userId];
                    const option = document.createElement('option');
                    option.value = userId;
                    option.textContent = user.name || user.firstName || "";
                    userList.appendChild(option);
                }
            }

            userList.style.display = 'block';
        } 
    } catch (error) {
       
    }
}

function getExcludedProfileUsers() {
    const userSelect = document.getElementById('profile-user-select');
    if (userSelect && userSelect.selectedOptions) {
        return Array.from(userSelect.selectedOptions).map(option => option.value);
    }
    return [];
}

document.getElementById('saveProfileInfoBtn').addEventListener('click', async function(event) {
    event.preventDefault();
    const profileInfoValue = document.getElementById('profileInfoSelect').value;
    const excludedProfileUsers = getExcludedProfileUsers();
    const userId = currentUser.uid;
    if (profileInfoValue === 'Except' && excludedProfileUsers.length === 0) {
        Toastify({
            text: "Please select at least one user to exclude.",
            duration: 3000,
            gravity: "top",
            position: "right",
            backgroundColor: "#dc3545", // Error color
        }).showToast();
        return;
    }
    const usersRef = ref(database, 'data/users/' + userId);

    try {
        const snapshot = await get(usersRef);
        if (snapshot.exists()) {
            const existingData = snapshot.val();
            const profileInfoData = {
                profile_info: profileInfoValue !== existingData.profile_info ? profileInfoValue : existingData.profile_info,
                excluded_profile_info_users: excludedProfileUsers
            };
            await update(usersRef, profileInfoData);
            Toastify({
                text: "Profile Info Selected Successfully!",
                duration: 3000,
                gravity: "top",
                position: "right",
                backgroundColor: "#28a745",
            }).showToast();
        } 
    } catch (error) {
       
    }
});

// Last Seen
document.getElementById('lastSeenSelect').addEventListener('change', function(event) {
    const selectedValue = event.target.value;
    const userList = document.getElementById('last-seen-user-list');

    if (selectedValue === 'Except') {
        loadUserListLastSeen();
        userList.style.display = 'block';
    } else {
        userList.innerHTML = '';
        userList.style.display = 'none';
    }
});

async function loadUserListLastSeen() {
    const userList = document.getElementById('last-seen-user-select');
    const userId = currentUser.uid;
    const contactsRef = ref(database, 'data/contacts/' + userId );

    try {
        const contactsSnapshot = await get(contactsRef);
        const userIdsToDisplay = [];

        if (contactsSnapshot.exists()) {
            const contacts = contactsSnapshot.val();
            for (const contactId in contacts) {
                userIdsToDisplay.push(contacts[contactId].contact_id);
            }
        } else {
            return;
        }

        const usersRef = ref(database, 'data/users');
        const snapshot = await get(usersRef);

        if (snapshot.exists()) {
            const users = snapshot.val();
            userList.innerHTML = '';

            for (const userId in users) {
                if (userIdsToDisplay.includes(userId)) {
                    const user = users[userId];
                    const option = document.createElement('option');
                    option.value = userId;
                    option.textContent = user.name || user.firstName || "";
                    userList.appendChild(option);
                }
            }

            userList.style.display = 'block';
        } 
    } catch (error) {
       
    }
}

function getExcludedLastSeenUsers() {
    const userSelect = document.getElementById('last-seen-user-select');
    if (userSelect && userSelect.selectedOptions) {
        return Array.from(userSelect.selectedOptions).map(option => option.value);
    }
    return [];
}

document.getElementById('saveLastSeenBtn').addEventListener('click', async function(event) {
    event.preventDefault();
    const lastSeenValue = document.getElementById('lastSeenSelect').value;
    const excludedLastSeenUsers = getExcludedLastSeenUsers();
    const userId = currentUser.uid;
    if (lastSeenValue === 'Except' && excludedLastSeenUsers.length === 0) {
        Toastify({
            text: "Please select at least one user to exclude.",
            duration: 3000,
            gravity: "top",
            position: "right",
            backgroundColor: "#dc3545", // Error color
        }).showToast();
        return;
    }
    const usersRef = ref(database, 'data/users/' + userId);

    try {
        const snapshot = await get(usersRef);
        if (snapshot.exists()) {
            const existingData = snapshot.val();
            const lastSeenData = {
                last_seen: lastSeenValue !== existingData.last_seen ? lastSeenValue : existingData.last_seen,
                excluded_last_seen_users: excludedLastSeenUsers
            };
            await update(usersRef, lastSeenData);
            Toastify({
                text: "Last Seen Selected Successfully!",
                duration: 3000,
                gravity: "top",
                position: "right",
                backgroundColor: "#28a745",
            }).showToast();
        } 
    } catch (error) {
       
    }
});


// Status Info

    document.getElementById('statusSelect').addEventListener('change', function(event) {
        const selectedValue = event.target.value; // Get selected value
        const userList = document.getElementById('status-user-list');

        // Check if the selected value is "Except"
        if (selectedValue === 'Except') {
            loadUserListStatus(); // Load user list for status when "Except" is selected
            userList.style.display = 'block'; // Show user list
        } else {
            userList.innerHTML = ''; // Clear user list when not "Except"
            userList.style.display = 'none'; // Hide user list when "Everyone" is selected
        }
    });


// Load user list for Status Info
async function loadUserListStatus() {
    const userList = document.getElementById('status-user-select');
    if (!userList) {
     
        return;
    }
    const userId = currentUser.uid; // Get the current user's ID
    const contactsRef = ref(database, 'data/contacts/' + userId); // Reference to contacts of the current user

    try {
        const contactsSnapshot = await get(contactsRef); // Fetch current user's contacts
        const userIdsToDisplay = []; // Array to hold user IDs for the contacts

        if (contactsSnapshot.exists()) {
            const contacts = contactsSnapshot.val();
            for (const contactId in contacts) {
                userIdsToDisplay.push(contacts[contactId].contact_id); // Push each contact ID into the array
            }
        } else {
            return; // Exit if no contacts are found
        }

        const usersRef = ref(database, 'data/users'); // Reference to users in Firebase
        const snapshot = await get(usersRef); // Fetch all user data

        if (snapshot.exists()) {
            const users = snapshot.val();
            userList.innerHTML = ''; // Clear previous options

            for (const userId in users) {
                if (userIdsToDisplay.includes(userId)) {
                    const user = users[userId];
                    const option = document.createElement('option');
                    option.value = userId;
                    option.textContent = user.name || user.firstName || "";
                    userList.appendChild(option);
                }
            }

            userList.style.display = 'block'; // Ensure the user list is displayed
        } 
    } catch (error) {
       
    }
}

// Get excluded users for Status Info
function getExcludedGroupUsers() {
    const userSelect = document.getElementById('status-user-select');
    if (userSelect && userSelect.selectedOptions) {
        return Array.from(userSelect.selectedOptions).map(option => option.value);
    }
    return [];
}

// Save Status Info
document.getElementById('saveStatusBtn').addEventListener('click', async function(event) {
    event.preventDefault(); // Prevent default form submission

    const groupsValue = document.getElementById('statusSelect').value;
    const excludedGroupUsers = getExcludedGroupUsers();
    const userId = currentUser.uid; // Get the current user's ID
    if (groupsValue === 'Except' && excludedGroupUsers.length === 0) {
        Toastify({
            text: "Please select at least one user to exclude.",
            duration: 3000,
            gravity: "top",
            position: "right",
            backgroundColor: "#dc3545", // Error color
        }).showToast();
        return;
    }
    // Reference to the user data in Firebase
    const usersRef = ref(database, 'data/users/' + userId);

    try {
        const snapshot = await get(usersRef); // Fetch current user data
        if (snapshot.exists()) {
            const existingData = snapshot.val();

            // Only update if there are changes to be made
            const groupInfoData = {
                status_info: groupsValue !== existingData.status_info ? groupsValue : existingData.status_info,
                excluded_status_users: excludedGroupUsers // Save excluded users
            };

            // Update the user data in Firebase
            await update(usersRef, groupInfoData);
            Toastify({
                text: "Status Info Selected Successfully!",
                duration: 3000,
                gravity: "top",
                position: "right",
                backgroundColor: "#28a745",
            }).showToast();
           
        } 
    } catch (error) {
       
    }
});

async function getUserDetails(uid) {
    try {
        const userSnapshot = await get(ref(database, 'data/users/' + uid));
        if (userSnapshot.exists()) {
            const user = userSnapshot.val();
         
            return {
                firstName: user.firstName || '',
                lastName: user.lastName || '',
            };
        } else {
            return { firstName: '', lastName: '' };
        }
    } catch (error) {
   
        return { firstName: '', lastName: '' };
    }
}

// Backup chats
backupChatSwitch.addEventListener('change', function () {
    // Save the checkbox state to local storage
    localStorage.setItem("backupChatSwitchState", this.checked);

    if (this.checked) {
        backupChats(); // Backup chats when the switch is checked
    }
});

// Restore checkbox state on page load

    const backupChatSwitchState = localStorage.getItem("backupChatSwitchState") === 'true';
    backupChatSwitch.checked = backupChatSwitchState;


// Message sent sound
const messagenotificationSound = new Audio('assets/sounds/message-notification-sound.mp3'); // Replace with your sound file path
const messagenotificationSoundSwitch = document.getElementById('messagenotificationSoundSwitch');
let isMessageNotificationSoundEnabled = false;



// Load saved state from localStorage and set the switch accordingly
window.addEventListener('load', function() {
    const savedSetting = localStorage.getItem('messageNotificationSound');
    if (savedSetting === 'enabled') {
        isMessageNotificationSoundEnabled = true;
        messagenotificationSoundSwitch.checked = true; // Set the switch to enabled
    } else {
        isMessageNotificationSoundEnabled = false;
        messagenotificationSoundSwitch.checked = false; // Set the switch to disabled
    }
});

// Event listener for the sound toggle switch
messagenotificationSoundSwitch.addEventListener('change', function() {
    isMessageNotificationSoundEnabled = this.checked;
    
    // Save the current state in localStorage
    if (isMessageNotificationSoundEnabled) {
        localStorage.setItem('messageNotificationSound', 'enabled');
        Toastify({
            text: "Message Notification Sound Enabled!",
            duration: 3000,
            gravity: "top",
            position: "right",
            backgroundColor: "#28a745",
        }).showToast();
    } else {
        Toastify({
            text: "Message Notification Sound Disabled!",
            duration: 3000,
            gravity: "top",
            position: "right",
            backgroundColor: "#dc3545",
        }).showToast();
        localStorage.setItem('messageNotificationSound', 'disabled');
    }
   
});

// Play the message sent sound (to be called from chat.js)
function playMessageSentSound() {
    if (isMessageNotificationSoundEnabled) {
        messagenotificationSound.play().catch((error) => {
           
        });
    }
}

// Play the message received sound (can be called in other scripts too)
function playMessageReceivedSound() {
    if (isMessageNotificationSoundEnabled) {
        messagenotificationSound.play().catch((error) => {
           
        });
    }
}

function decryptMessage(encryptedText, secretKey) {
    const bytes = CryptoJS.AES.decrypt(encryptedText, secretKey);
    return bytes.toString(CryptoJS.enc.Utf8); // Return the decrypted message
}





// Notification Sound
const notificationSound = new Audio('assets/sounds/notification_sound.mp3');
const notificationSoundSwitch = document.getElementById('notificationSoundSwitch');
let isNotificationSoundEnabled = false;

window.addEventListener('load', function() {
    const savedSetting = localStorage.getItem('NotificationSound');
    if (savedSetting === 'enabled') {
        isNotificationSoundEnabled = true;
        notificationSoundSwitch.checked = true; // Set the switch to enabled
    } else {
        isNotificationSoundEnabled = false;
        notificationSoundSwitch.checked = false; // Set the switch to disabled
    }
});

// Notification Sound
notificationSoundSwitch.addEventListener('change', function() {
    isNotificationSoundEnabled = this.checked;
    if (isNotificationSoundEnabled) {
        localStorage.setItem('NotificationSound', 'enabled');
        Toastify({
            text: "Notification Sound Enabled!",
            duration: 3000,
            gravity: "top",
            position: "right",
            backgroundColor: "#28a745",
        }).showToast();
    } else {
        Toastify({
            text: "Notification Sound Disabled!",
            duration: 3000,
            gravity: "top",
            position: "right",
            backgroundColor: "#dc3545",
        }).showToast();
        localStorage.setItem('NotificationSound', 'disabled');
    }
});

// Notification Sound
function playNotificationSound() {
    if (isNotificationSoundEnabled) {
        notificationSound.play().catch(error => {
           
        });
    }
}



});
