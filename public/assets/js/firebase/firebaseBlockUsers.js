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
    setDoc,
    doc
} from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';

initializeFirebase(function (app, auth, database, storage) {

    let currentUser = null; // Define the current user here
    let selectedUserId = null; // Store the selected user ID
    let usersMap = {}; // Define usersMap here

    // Monitor the user's authentication state
    onAuthStateChanged(auth, (user) => {

        if (user) {
            currentUser = user; // Set currentUser to the signed-in user
            document.getElementById('user-id').innerText = `Logged in as: ${currentUser.uid}`;
            fetchAllUsers();

        } else {
            window.location.href = "/admin";
            document.getElementById('uid').innerText = 'No user logged in';
        }
    });

    // Function to fetch all registered users
    function fetchAllUsers() {
        const usersRef = ref(database, 'data/users'); // Reference to the users node

        // Get all users
        onValue(usersRef, (snapshot) => {
            if (snapshot.exists()) {
                const usersData = snapshot.val();
                const allUsers = Object.keys(usersData).map(userId => ({
                    id: userId,
                    ...usersData[userId]
                }));

                fetchBlockedUsersForAll(allUsers); // Pass the list of users to fetch their blocked lists
            } else {
                fetchBlockedUsersForAll([]); // Ensure you call with an empty array if no users are found
            }
        }, (error) => {
           
        });
    }
   
    function fetchBlockedUsersForAll(allUsers) {
        const blockedUsersTableBody = document.querySelector('tbody'); // Get tbody element
        blockedUsersTableBody.innerHTML = ''; // Clear previous entries
    
        if (Array.isArray(allUsers) && allUsers.length > 0) {
            const blockedUsers = []; // Array to store blocked user details
    
            // Fetch users who have adminblock: true from the users table
            const blockedUsersFromUsersTable = allUsers.filter(user => user.adminblock === true);
    
            // Add blocked users from users table to the array
            blockedUsersFromUsersTable.forEach(user => {
                // Skip users without a first name
                if (!user.firstName) {
                    return;
                }
    
                blockedUsers.push({
                    ...user,
                    blockedDate: user.blockedDate || '-', // Assuming blockedDate might exist in user data
                    userId: user.id,
                    userName: user.firstName,
                });
            });
    
            // Create an array of promises for blocked users in the blocked_users table
            const blockedUsersPromises = allUsers.map(user => {
                const blockedUserRef = ref(database, `data/blocked_users/${user.id}`); // Get blocked users of current user
                
                return get(blockedUserRef).then(snapshot => {
                    // Check if there are blocked users for this user
                    if (snapshot.exists()) {
                        const blockedUsersData = snapshot.val();
    
                        // Iterate through blocked users and fetch their details
                        const userPromises = Object.keys(blockedUsersData).map(blockedUserId => {
                            const blockedDate = blockedUsersData[blockedUserId]; // timestamp when blocked
    
                            const blockedUserRef = ref(database, `data/users/${blockedUserId}`);
                            return get(blockedUserRef).then(userSnapshot => {
                                if (userSnapshot.exists()) {
                                    const blockedUserDetails = userSnapshot.val();
    
                                    // Ensure the user has a firstName and the necessary data
                                    if (!blockedUserDetails.firstName) {
                                        return; // Skip if no first name
                                    }
    
                                    // Add the blocked user to the array
                                    blockedUsers.push({
                                        ...blockedUserDetails,
                                        blockedDate: blockedDate,
                                        userId: blockedUserId,
                                        userName: blockedUserDetails.firstName,
                                    });
                                } 
                            }).catch(error => {
                                
                            });
                        });
    
                        // Wait for all user data fetches for this user to complete
                        return Promise.allSettled(userPromises); // Use allSettled to handle both successful and failed fetches
                    }
                }).catch(error => {
                   
                });
            });
    
            // Wait for all blocked users promises to resolve
            Promise.allSettled(blockedUsersPromises).then(() => {
                // Sort blocked users by firstName in ascending order
                blockedUsers.sort((a, b) => {
                    if (a.firstName && b.firstName) {
                        return a.firstName.localeCompare(b.firstName);
                    }
                    return 0; // Handle cases where firstName is undefined
                });
                let rowIndex = 1; 
                // Render sorted users
                blockedUsers.forEach(user => {
                    const formattedBlockedDate = formatDate(user.blockedDate);
    
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>
                        ${rowIndex++}
                        </td>
                        <td>
                            <div class="d-flex align-items-center">
                                <a href="#" class="avatar avatar-md"><img
                                    src="${user.image || defaultAvatar}" class="img-fluid rounded-circle" alt="img"></a>
                                <div class="ms-2 profile-name">
                                    <p class="text-dark mb-0">${user.firstName}</p>
                                </div>
                            </div>
                        </td>
                        <td>${user.email || '-'}</td>
                        <td>${user.mobile_number || '-'}</td>
                        <td>${user.country || '-'}</td>
                        <td>
                            <span class="badge badge-sm badge-danger d-inline-flex align-items-center fs-10"><i
                                    class="ti ti-circle-filled fs-5 me-1"></i>Blocked</span>
                        </td>
                    `;
                    blockedUsersTableBody.appendChild(row);
                });
    
                // Reinitialize DataTable
                if ($.fn.dataTable.isDataTable('#blockusersTable')) {
                    $('#blockusersTable').DataTable().destroy();
                }
                $('#blockusersTable').DataTable({
                    pageLength: 10,
                    lengthMenu: [5, 10, 20, 50],
                    searching: true,
                    ordering: true,
                    columnDefs: [
                        { orderable: false, targets: 0 },
                    ],
                });
            }).catch(error => {
               
            });
        }
    }
    
    
    function openUnblockPopup(blockerId, blockedUserId, blockedUserName) {
        // Populate modal with user-specific details
        document.querySelector('#unblock-user .modal-body p').textContent = `Are you sure you want to unblock ${blockedUserName}?`;
        document.querySelector('#unBlockUserBtn').onclick = () => unblockUser(blockerId, blockedUserId);

        // Open modal
        const unblockModal = new bootstrap.Modal(document.getElementById('unblock-user'));
        unblockModal.show();
    }

    function unblockUser(blockerId, blockedUserId) {
        // Reference to the `users` table entry
        const userRef = ref(database, `data/users/${blockedUserId}`);
        // Reference to the `blocked_users` table entry
        const blockedUserRef = ref(database, `data/blocked_users/${blockerId}/${blockedUserId}`);
    
        // Check if the user exists in the `users` table and is blocked
        get(userRef).then(userSnapshot => {
            if (userSnapshot.exists()) {
                const userData = userSnapshot.val();
                if (userData.adminblock) {
                    // Update `adminblock` to false
                    return update(userRef, { adminblock: false }).then(() => {
                        showToast(`User ${userData.firstName} has been unblocked successfully.`);
                    });
                }
            }
    
            // Check if the user exists in the `blocked_users` table
            return get(blockedUserRef).then(snapshot => {
                if (snapshot.exists()) {
                    // Remove the user from `blocked_users`
                    return remove(blockedUserRef).then(() => {
                        showToast(`User has been unblocked successfully.`);
                    });
                } else {
                    showToast(`User is not blocked.`);
                }
            });
        }).catch(error => {
            showToast(`An error occurred while unblocking the user. Please try again.`);
        }).finally(() => {
            location.reload(); // Reload to update UI
        });
    }
    

    function showToast(message) {
        Toastify({
            text: message,
            duration: 3000, // Duration in milliseconds
            gravity: "top", // `top` or `bottom`
            position: "right", // `left`, `center` or `right`
            style: {
                background: "#ff3d00" // Custom background color using style.background
            },
            stopOnFocus: true, // Prevents dismissing of toast on hover
        }).showToast();
    }

    // Call the function to fetch all users
    fetchAllUsers();

    // Example function to format date
    function formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString(); // Adjust the format as needed
    }

});
