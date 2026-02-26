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
            currentUser = user; 
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
                fetchGroups(allUsers); // Pass the list of users to fetch their blocked lists
            } else {
                fetchGroups([]); // Ensure you call with an empty array if no users are found
            }
        }, (error) => {
           
        });
    }

    function fetchGroups(allUsers) {
        const groupsTableBody = document.querySelector('tbody'); // Get tbody element
        const groupsRef = ref(database, 'data/groups'); // Create a reference to the groups node

        // Set up a real-time listener
        onValue(groupsRef, (snapshot) => {
            if (snapshot.exists()) {
                groupsTableBody.innerHTML = ''; // Clear existing rows

                // Extract groups and sort by `groupName` in ascending order
                const groups = [];
                snapshot.forEach((childSnapshot) => {
                    const group = childSnapshot.val();
                    group.id = childSnapshot.key; // Add group ID for later use
                    groups.push(group);
                });

                // Sort the groups array (change key to sort by `createdAt` if needed)
                groups.sort((a, b) => {
                    if (a.groupName && b.groupName) {
                        return a.groupName.localeCompare(b.groupName); // Alphabetical order
                    }
                    return 0; // Handle cases where groupName is undefined
                });
                let rowIndex = 1; 
                // Render sorted groups
                groups.forEach((group) => {
                    const groupId = group.id;
                    const formattedCreatedDate = formatDate(group.createdAt); // Format the createdAt timestamp
                    const members = group.userIds || [];
                    const totalMembers = members.length;

                    // Construct the row for each group
                    const row = document.createElement('tr');
                    row.innerHTML = `
                    <td>
                    ${rowIndex++}
                    </td>
                    <td>
                        <div class="d-flex align-items-center">
                         <a href="#" class="avatar avatar-md">
                                        <img src="${group.avatarURL|| defaultAvatar}" class="img-fluid rounded-circle" alt="img">
                                    </a>
                            <div class="ms-2 profile-name">
                                <p class="text-dark mb-0">${group.groupName || '-'}</p>
                            </div>
                        </div>
                    </td>
                    <td>${group.about || 'No description'}</td>
                    <td>${totalMembers}</td>
                    <td>${formattedCreatedDate || '-'}</td>
                    <td>
                        <a href="#" class="delete-group-btn" data-id="${groupId}" data-bs-toggle="modal" data-bs-target="#delete-group">
                            <span class="file-icon"><i class="ti ti-trash"></i></span>
                        </a>
                    </td>
                `;

                    groupsTableBody.appendChild(row);

                    // Attach click listener to trigger the modal
                    row.querySelector('.delete-group-btn').addEventListener('click', () => {
                        document.getElementById('deleteAllGroupBtn').setAttribute('data-id', groupId); // Pass groupId to the modal button
                    });
                });

                // Reinitialize the DataTable
                if ($.fn.dataTable.isDataTable('#groupusersTable')) {
                    $('#groupusersTable').DataTable().destroy(); // Destroy the existing DataTable instance
                }

                $('#groupusersTable').DataTable({
                    pageLength: 10,
                    lengthMenu: [5, 10, 20, 50],
                    searching: true,
                    ordering: true,
                    columnDefs: [
                        { orderable: false, targets: 0 }
                    ]
                });
            } 
        }, (error) => {
           
        });
    }

    // Trigger deletion when modal delete button is clicked
    document.getElementById('deleteAllGroupBtn').addEventListener('click', (e) => {
        e.preventDefault();
        const groupId = e.target.getAttribute('data-id'); // Get the groupId from the modal button

        if (groupId) {
            deletegroup(groupId); // Call delete function
        }
    });

    function deletegroup(groupId) {
        const chatRef = ref(database, `data/groups/${groupId}`);

        remove(chatRef)
            .then(() => {
                showToast(`Group deleted successfully!`);

                const chatRows = document.querySelectorAll('tbody tr');
                chatRows.forEach(row => {
                    if (row.querySelector('.delete-group-btn').getAttribute('data-id') === groupId) {
                        row.remove();
                    }
                });
                // Close the modal
                const deleteGroupModal = bootstrap.Modal.getInstance(document.getElementById('delete-group'));
                if (deleteGroupModal) {
                    deleteGroupModal.hide();
                }
                setTimeout(() => {
                    location.reload();
                }, 1000);
            })
            .catch((error) => {
              
            });
    }


    function formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString(); // Adjust the format as needed
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

    function fetchAllUsersForExport() {
        const usersRef = ref(database, "data/groups");
        const allUsers = [];
    
        // Fetch all groups from Firebase
        onValue(
            usersRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    snapshot.forEach((childSnapshot) => {
                        const group = childSnapshot.val();
                        const groupId = childSnapshot.key;
                        const members = group.userIds || [];
                        const totalMembers = members.length;
                        const messages = group.messages || {};
                        const chatCount = Object.keys(messages).length;
    
                        // Collect group data
                        allUsers.push({
                            groupName: group.groupName || '-',
                            about: group.about || '-',
                            totalMembers: totalMembers,
                            createdAt: group.createdAt,
                            image: group.image || defaultAvatar,
                            groupId: groupId
                        });
                    });
    
                    // Sort groups by group name in ascending order
                    allUsers.sort((a, b) => a.groupName.localeCompare(b.groupName));
    
                    // Once sorted, trigger PDF generation
                    generatePdf(allUsers);
                } 
            },
            (error) => {
              
            }
        );
    }
    
    // Function to generate PDF with the sorted list of groups
    function generatePdf(allUsers) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
    
        // Add title to the PDF
        doc.text("Group List", 14, 16);
    
        // Prepare the data for the table (mapping groups to the table columns)
        const userData = allUsers.map(group => [
            group.groupName,
            group.about,
            group.totalMembers,
            formatDate(group.createdAt) || '-',
        ]);
    
        // Generate table in PDF using jsPDF's autoTable plugin
        doc.autoTable({
            head: [['Group Name', 'Group Description', 'Members', 'Created Date']],
            body: userData,
            startY: 20,  // Starting position for the table
            theme: 'grid',
            headStyles: {
                fillColor: [22, 160, 133] // Customize header color
            },
        });
    
        // Save the PDF
        doc.save('group-list.pdf');
    }
    
    // Event listener for the Export PDF button
    document.querySelector('#exportPdfBtn').addEventListener('click', function () {
        fetchAllUsersForExport();  // Fetch all groups and export to PDF
    });    
});
