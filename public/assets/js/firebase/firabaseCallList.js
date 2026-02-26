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
            fetchUsersAndCalls();
        } else {
            window.location.href = "/admin";
            document.getElementById('uid').innerText = 'No user logged in';
        }
    });

    let users = {};
    let calls = {};

    // Fetch users and calls from Firebase
    function fetchUsersAndCalls() {
        const usersRef = ref(database, 'data/users'); // Reference to the users node
        const callsRef = ref(database, 'data/calls'); // Reference to the calls node

        // Fetch users
        get(usersRef).then((snapshot) => {
            if (snapshot.exists()) {
                users = snapshot.val();
                // Create a map of users for quick lookup
                Object.keys(users).forEach(userId => {
                    usersMap[userId] = users[userId];
                });
                updateTable();
            }
        });

        // Fetch calls once
        get(callsRef).then((snapshot) => {
            if (snapshot.exists()) {
                calls = snapshot.val();
                updateTable();
            }
        });
    }

    // Function to update the table with user and call data
    function updateTable() {
        if (Object.keys(users).length === 0 || Object.keys(calls).length === 0) {
            return; // Don't run if either users or calls haven't been fetched yet
        }

        const userTableBody = document.getElementById('userTableBody');
        userTableBody.innerHTML = '';

        if ($.fn.dataTable.isDataTable('#callusersTable')) {
            $('#callusersTable').DataTable().destroy();
        }

        const sortedUserIds = Object.keys(users).sort((a, b) => {
            const nameA = `${users[a].firstName} ${users[a].lastName}`.toLowerCase();
            const nameB = `${users[b].firstName} ${users[b].lastName}`.toLowerCase();
            return nameA.localeCompare(nameB);
        });

        let rowIndex = 1;
        sortedUserIds.forEach(userId => {
            const user = users[userId];
            const userCalls = calls[userId] || {};

            let incomingCalls = 0;
            let outgoingCalls = 0;
            let missedCalls = 0;

            Object.values(userCalls).forEach(call => {
                if (call.inOrOut === 'IN') {
                    if (call.duration && (call.duration.toLowerCase() === 'ringing' || call.duration.toLowerCase() === 'declined')) {
                        missedCalls++;
                    } else {
                        incomingCalls++;
                    }
                } else if (call.inOrOut === 'OUT') {
                    outgoingCalls++;
                }
            });

            if (incomingCalls === 0 && outgoingCalls === 0 && missedCalls === 0) {
                return;
            }

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${rowIndex++}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <a href="#" class="avatar avatar-md">
                            <img src="${user.image || defaultAvatar}" class="img-fluid rounded-circle" alt="img">
                        </a>
                        <div class="ms-2 profile-name">
                            <p class="text-dark mb-0">${user.firstName} ${user.lastName}</p>
                        </div>
                    </div>
                </td>
                <td>${incomingCalls}</td>
                <td>${outgoingCalls}</td>
                <td>${missedCalls}</td>
                <td>
                    <a href="#" class="view-calls" data-user-id="${userId}" title="View Calls">
                        <span class="file-icon"><i class="ti ti-eye"></i></span>
                    </a>
                    <a href="#" class="delete-chat" data-user-id="${userId}" title="Delete Calls">
                        <span class="file-icon"><i class="ti ti-trash"></i></span>
                    </a>
                </td>
            `;
            userTableBody.appendChild(row);

            row.querySelector('.delete-chat').addEventListener('click', (e) => {
                e.preventDefault();
                deleteUserCalls(userId);
            });

            row.querySelector('.view-calls').addEventListener('click', (e) => {
                e.preventDefault();
                renderCallLog(userId);
            });
        });

        $('#callusersTable').DataTable({
            pageLength: 10,
            lengthMenu: [5, 10, 20, 50],
            searching: true,
            ordering: true,
            columnDefs: [{ orderable: false, targets: 0 }]
        });
    }

    // Function to render the call log for a specific user
    function renderCallLog(userId) {
        const userCalls = calls[userId] || {};
        const callLogContainer = document.getElementById('callLogContainer'); // Assuming you have a container for the call log
        callLogContainer.innerHTML = ''; // Clear previous log

        const sortedCalls = Object.values(userCalls).sort((a, b) => b.currentMills - a.currentMills);

        let callLogHtml = `<h5>Call Log for ${users[userId].firstName} ${users[userId].lastName}</h5><ul>`;

        sortedCalls.forEach(call => {
            const callTime = new Date(call.currentMills).toLocaleString();
            const callType = call.video ? 'Video Call' : 'Audio Call';
            const callNature = call.type === 'group' ? 'Group' : 'One-to-One';
            let callDetails = '';

            if (call.inOrOut === 'IN') {
                callDetails = `<li>Incoming ${callType} (${callNature}) from ${call.callerName} at ${callTime}. Duration: ${call.duration}</li>`;
            } else { // OUT
                let receiverName = 'Unknown';
                if (call.type === 'single' && call.callerId && call.callerId[0]) {
                     const receiver = usersMap[call.callerId[0]];
                     if(receiver) {
                        receiverName = `${receiver.firstName} ${receiver.lastName}`;
                     }
                } else if (call.type === 'group') {
                    receiverName = call.callerName; // Group name
                }
                callDetails = `<li>Outgoing ${callType} (${callNature}) to ${receiverName} at ${callTime}. Duration: ${call.duration}</li>`;
            }
            callLogHtml += callDetails;
        });

        callLogHtml += '</ul>';
        callLogContainer.innerHTML = callLogHtml;

        // You might want to display this in a modal
        const callLogModal = new bootstrap.Modal(document.getElementById('callLogModal')); // Assuming a modal with this ID
        callLogModal.show();
    }


    // Function to delete all calls for a user
    function deleteUserCalls(userId) {
        const userCallsRef = ref(database, `data/calls/${userId}`);

        get(userCallsRef).then((snapshot) => {
            if (!snapshot.exists()) {
                Swal.fire({
                    icon: 'info',
                    title: 'No Calls Found',
                    text: `No calls found for this user.`,
                    confirmButtonText: 'OK'
                });
                return;
            }

            const deleteModal = new bootstrap.Modal(document.getElementById('delete-call'));
            deleteModal.show();

            const deleteCallForm = document.getElementById('deleteCallForm');
            const loadingIndicator = document.getElementById('loadingIndicator');
            const deleteButton = document.getElementById('deleteAllCallBtn');

            deleteCallForm.onsubmit = async function (e) {
                e.preventDefault();
                loadingIndicator.style.display = 'block';
                deleteButton.disabled = true;

                try {
                    await remove(userCallsRef);
                    showToast(`All calls for the user have been deleted successfully!`);
                    // Remove the user row from the table
                    document.querySelector(`a.delete-chat[data-user-id="${userId}"]`).closest('tr').remove();
                } catch (error) {
                    showToast('Error deleting calls. Please try again.');
                } finally {
                    loadingIndicator.style.display = 'none';
                    deleteButton.disabled = false;
                    deleteModal.hide();
                    window.location.reload();
                }
            };
        });
    }

    function showToast(message) {
        Toastify({
            text: message,
            duration: 3000,
            gravity: "top",
            position: "right",
            style: {
                background: "#ff3d00"
            },
            stopOnFocus: true,
        }).showToast();
    }
});