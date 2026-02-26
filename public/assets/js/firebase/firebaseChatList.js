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
            fetchAllUsers();
        } else {
            window.location.href = "/admin";
            document.getElementById('uid').innerText = 'No user logged in';
        }
    });


    // HTML element where we will display the chat data
    const chatTableBody = document.querySelector("table tbody");

    // Function to fetch users' data
    function fetchUsers() {
        return new Promise((resolve, reject) => {
            const usersRef = ref(database, 'data/users');
            onValue(usersRef, (snapshot) => {
                const users = snapshot.val();
                resolve(users);
            }, (error) => {
                reject(error);
            });
        });
    }

    function fetchChats() {
        fetchUsers().then((users) => {
            const chatsRef = ref(database, 'data/chats');
            const chatCounts = {};
            let rowIndex = 1; // Initialize the counter for sequence numbers
    
            // Clear previous rows
            chatTableBody.innerHTML = '';
    
            onValue(chatsRef, (snapshot) => {
                const chats = snapshot.val();
                if (chats) {
                    Object.keys(chats).forEach((chatRoomId) => {
                        const messages = chats[chatRoomId];
    
                        Object.keys(messages).forEach((messageId) => {
                            const message = messages[messageId];
                            const from = message.senderId;
                            const to = message.recipientId;
                            // Ensure 'from' and 'to' are valid and exist in 'users'
                            if (from && to && users[from] && users[to]) {
                                const fromName = `${users[from]?.firstName || ''} ${users[from]?.lastName || ''}`.trim();
                                const toName = `${users[to]?.firstName || ''} ${users[to]?.lastName || ''}`.trim();
    
                                if (!fromName || !toName) {

                                    return;
                                }
    
                                const key = `${from}_${to}`;
                                const fromImage = users[from]?.image;
                                const toImage = users[to]?.image;
    
    
                                // If this is the first time we've encountered this user pair, initialize the row
                                if (!chatCounts[key]) {
                                    chatCounts[key] = { from, to, count: 0 };
    
                                    // Prepare the HTML row only once for this unique pair of users
                                    const row = `
                                        <tr id="chat_${key}">
                                            <td></td> <!-- Increment the sequence number -->
                                            <td>
                                                <div class="d-flex align-items-center">
                                                    <a href="#" class="avatar avatar-md">
                                                        <img src="${fromImage || defaultAvatar}" class="img-fluid rounded-circle" alt="img">
                                                    </a>
                                                    <div class="ms-2 profile-name">
                                                        <p class="text-dark mb-0">${fromName}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div class="d-flex align-items-center">
                                                    <a href="#" class="avatar avatar-md">
                                                        <img src="${toImage || defaultAvatar}" class="img-fluid rounded-circle" alt="img">
                                                    </a>
                                                    <div class="ms-2 profile-name">
                                                        <p class="text-dark mb-0">${toName}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td id="count_${key}">0</td> <!-- This will display the chat count -->
                                        </tr>
                                    `;
                                    chatTableBody.insertAdjacentHTML('beforeend', row);
                                }
    
                                // Increment the message count for this pair
                                chatCounts[key].count += 1;
    
                                // Update the count in the correct column
                                const countElement = document.getElementById(`count_${key}`);
                                if (countElement) {
                                    countElement.textContent = chatCounts[key].count;
                                }
                            }
                        });
                    });
    
                    // Initialize DataTable after all rows are appended
                    if ($.fn.dataTable.isDataTable("#chatusersTable")) {
                        $("#chatusersTable").DataTable().destroy(); // Destroy the existing DataTable instance
                    }
    
                    // Reinitialize DataTable with ascending order based on "From Name"
                    $("#chatusersTable").DataTable({
                        pageLength: 10, // Number of records per page
                        lengthMenu: [5, 10, 20, 50], // Define page length options
                        searching: true, // Enable search functionality
                        ordering: true, // Enable sorting functionality
                        order: [[1, 'asc']], // Sort by the second column (fromName) in ascending order
                        columnDefs: [
                            { orderable: false, targets: 0 }, // Disable ordering on the sequence number column
                        ],
                    });
                } 
            });
        }).catch((error) => {
           
        });
    }
     



    // Call the function to fetch chats
    fetchChats();


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
                fetchChats(allUsers); // Pass the list of users to fetch their blocked lists
            } else {
                fetchChats([]); // Ensure you call with an empty array if no users are found
            }
        }, (error) => {
          
        });
    }


    function deleteChat(chatId) {
        // Reference to the specific chat message in the database
        const chatRef = ref(database, `data/chats/${chatId}`);

        // Remove the chat from the database
        remove(chatRef)
            .then(() => {

                showToast(`Chat deleted successfully!`);

                // Remove the chat row from the frontend
                const chatRows = document.querySelectorAll('tbody tr'); // Get all chat rows
                chatRows.forEach(row => {
                    if (row.querySelector('.delete-chat').getAttribute('data-id') === chatId) {
                        row.remove(); // Remove the row from the DOM
                    }
                });
            })
            .catch((error) => {
              
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

});
