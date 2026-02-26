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
            } 
        }, (error) => {
           
        });
    }

    function formatDate(timestamp) {
        if (typeof timestamp !== 'number' || isNaN(timestamp)) {
            return '-'; // Return a default value if the timestamp is invalid
        }

        const date = new Date(timestamp); // Convert timestamp to Date object
        return date.toLocaleString(); // Format date as a local string (you can customize this)
    }

    function fetchUserStatuses() {
        const userTableBody = document.querySelector('tbody'); // Get tbody element
        const usersRef = ref(database, 'data/users'); // Reference to the users node
        const statusRef = ref(database, 'data/status'); // Reference to the status node

        // Set up a real-time listener to fetch user statuses
        onValue(statusRef, (statusSnapshot) => {
            const statuses = statusSnapshot.val() || {}; // Get statuses, default to empty object
            if (Object.keys(statuses).length === 0) {
                return; // Exit if there are no statuses
            }

            // Now fetch the users that match these statuses
            onValue(usersRef, (snapshot) => {
                if (snapshot.exists()) {
                    userTableBody.innerHTML = ''; // Clear existing rows
                    const users = snapshot.val();
                    let rowIndex = 1; 
                    // Iterate over each status and find the matching user
                    Object.keys(statuses).forEach((statusId) => {
                        const statusData = statusId;
                        const userId = statusData; // Extract the userId from status data
                        const user = users[userId]; // Find the corresponding user data
                        if (user && user.firstName && user.email) { // Check if name and email exist
                            const userStatus = statusData.status || 'Unknown'; // Get user status or default to 'Unknown'
                            const timestamp = statuses[statusId].timestamp ;
                            const formattedDate = formatDate(timestamp);

                            // Construct the row for each user
                            const row = document.createElement('tr');
                            row.innerHTML = `
                            <td>
                            ${rowIndex++}
                            </td>
                            <td>
                                <div class="d-flex align-items-center">
                                    <a href="#" class="avatar avatar-md">
                                        <img src="${user.image || defaultAvatar}" class="img-fluid rounded-circle" alt="img">
                                    </a>
                                    <div class="ms-2 profile-name">
                                        <p class="text-dark mb-0"><a href="#">${user.firstName} ${user.lastName || ''}</a></p>
                                    </div>
                                </div>
                            </td>
                            <td>${user.mobile_number || 'N/A'}</td>
                            <td>${user.email}</td>
                            <td>${formattedDate}</td>
                            <td>
                                <a href="#" class="delete-chat" data-id="${statusId}">
                                    <span class="file-icon"><i class="ti ti-trash"></i></span>
                                </a> 
                            </td>
                        `;

                            userTableBody.appendChild(row); // Append the new row to the table body
                            row.querySelector('.delete-chat').addEventListener('click', (e) => {
                                e.preventDefault(); // Prevent default action (if any)
                                deleteChat(statusId); // Call deleteChat function with statusId
                            });
                        }
                    });

                    if ($.fn.dataTable.isDataTable('#storiesusersTable')) {
                        $('#storiesusersTable').DataTable().destroy(); // Destroy the existing DataTable instance
                    }

                    // Reinitialize DataTable after table is populated
                    $('#storiesusersTable').DataTable({
                        pageLength: 10, // Number of records per page
                        lengthMenu: [5, 10, 20, 50], // Define page length options
                        searching: true, // Enable search functionality
                        ordering: true, // Enable sorting functionality
                        columnDefs: [
                            { orderable: false, targets: 0 } // Disable ordering on the checkbox column
                        ]
                    });
                } 
            }, (error) => {
                
            });
        }, (error) => {
           
        });
    }

    // Function to delete a chat/status from Firebase
    function deleteChat(statusId) {
        // Set the statusId in the hidden form field
        const deleteChatForm = document.getElementById('deleteChatForm');
        deleteChatForm.setAttribute('data-status-id', statusId);

        // Show the modal
        const deleteModal = new bootstrap.Modal(document.getElementById('delete-chat'));
        deleteModal.show();

        // Event listener for the delete button inside the modal
        deleteChatForm.addEventListener('submit', function (e) {
            e.preventDefault(); // Prevent the form from submitting normally

            const statusId = deleteChatForm.getAttribute('data-status-id'); // Get the statusId
            const chatRef = ref(database, `data/status/${statusId}`);

            // Remove the chat from the database
            remove(chatRef)
                .then(() => {
                    showToast(`Status deleted successfully!`);

                    // Select the chat row and remove it from the DOM
                    const deleteButton = document.querySelector(`a.delete-chat[data-id="${statusId}"]`);
                    if (deleteButton) {
                        const rowToDelete = deleteButton.closest('tr');
                        if (rowToDelete) {
                            rowToDelete.remove(); // Remove the row from the DOM
                        } 
                    } 

                    // Close the modal after deletion
                    deleteModal.hide();
                    window.location.reload(); // Refresh the page
                })
                .catch((error) => {
                  
                });
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

    // Call the function to fetch user statuses
    fetchUserStatuses();
});
