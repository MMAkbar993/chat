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
    child, 
    query,
    orderByChild,
    limitToLast
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

initializeFirebase(function (app, auth, database,storage) {

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

function fetchUsersCount() {
    const usersRef = ref(database, 'data/users'); // Adjust the path to your users node

    onValue(usersRef, (snapshot) => {
        if (snapshot.exists()) {
            const usersData = snapshot.val();
            const usersCount = usersData ? Object.keys(usersData).length : 0; // Count users
            document.getElementById('total-users-count').textContent = usersCount; // Update the HTML

        }
    },
        (error) => {
           
        });
}

// Call the function to fetch user count when the script loads
fetchUsersCount();

function fetchGroupsCount() {
    const usersRef = ref(database, 'data/groups'); // Adjust the path to your users node

    onValue(usersRef, (snapshot) => {
        if (snapshot.exists()) {
            const usersData = snapshot.val();
            const groupsCount = usersData ? Object.keys(usersData).length : 0; // Count users
            document.getElementById('total-groups-count').textContent = groupsCount; // Update the HTML

        } 
    },
        (error) => {
           
        });
}

// Call the function to fetch user count when the script loads
fetchGroupsCount();

function fetchChatsCount() {
    const usersRef = ref(database, 'data/chats'); // Adjust the path to your users node

    onValue(usersRef, (snapshot) => {
        if (snapshot.exists()) {
            const usersData = snapshot.val();
            const chatsCount = usersData ? Object.keys(usersData).length : 0; // Count users
            document.getElementById('total-chats-count').textContent = chatsCount; // Update the HTML

        } 
    },
        (error) => {
          
        });
}

// Call the function to fetch user count when the script loads
fetchChatsCount();

function fetchStoriesCount() {
    const usersRef = ref(database, 'data/status'); // Adjust the path to your users node

    onValue(usersRef, (snapshot) => {
        if (snapshot.exists()) {
            const usersData = snapshot.val();
            const statusCount = usersData ? Object.keys(usersData).length : 0; // Count users
            document.getElementById('total-status-count').textContent = statusCount; // Update the HTML

        } 
    },
        (error) => {
           
        });
}

// Call the function to fetch user count when the script loads
fetchStoriesCount();


// Fetch recent users, ordering by timestamp
const recentUsersQuery = query(
    ref(database, 'data/users'), // Replace 'users' with your database reference
    orderByChild('timestamp'),
    limitToLast(5) // Adjust the number to retrieve the most recent users
);

onValue(recentUsersQuery, (snapshot) => {
    const usersTableBody = document.querySelector('.table tbody');
    usersTableBody.innerHTML = ''; // Clear existing content

    // Convert snapshot to an array and reverse for descending order
    const usersArray = [];
    snapshot.forEach((childSnapshot) => {
        usersArray.push(childSnapshot.val());
    });

    // Reverse the array to get the most recent users first
    usersArray.reverse();

    // Iterate through each user
    usersArray.forEach((userData) => {
        // Format registration date and time
        let regDate, loginTime;
        if (userData.timestamp) {
            const timestampDate = new Date(userData.timestamp);
            regDate = timestampDate.toLocaleDateString();
            loginTime = timestampDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            regDate = '-';
            loginTime = '-';
        }

        // Create a new row for each user
        const userRow = `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <a href="#" class="avatar avatar-md">
                            <img src="${userData.image || defaultAvatar}" class="img-fluid rounded-circle" alt="img">
                        </a>
                        <div class="ms-2 profile-name">
                            <p class="text-dark mb-0">${userData.firstName} ${userData.lastName}</p>
                        </div>
                    </div>
                </td>
                <td>${regDate}</td>
                <td>${loginTime}</td>
                <td>${userData.country || 'N/A'}</td>
            </tr>
        `;

        // Append the new row to the table body
        usersTableBody.innerHTML += userRow;
    });

    // Log if there are no users
    if (!snapshot.exists()) {
      
    }
}, (error) => {
   
});



// Fetch recent groups
const recentGroupsQuery = query(
    ref(database, 'data/groups'), // Replace 'groups' with your database reference
    orderByChild('createdAt'),
    limitToLast(5) // Adjust the number as needed to fetch the latest groups
);

onValue(recentGroupsQuery, (snapshot) => {
    const groupsTableBody = document.getElementById('groupsTableBody');
    groupsTableBody.innerHTML = ''; // Clear existing content

    // Convert snapshot to an array and reverse for descending order
    const groupsArray = [];
    snapshot.forEach((childSnapshot) => {
        groupsArray.push(childSnapshot.val());
    });

    // Reverse the array to display recently added groups first
    groupsArray.reverse();

    // Iterate through the reversed array to create rows
    groupsArray.forEach((groupData) => {
        // Format registration date and login time (if applicable)
        let regDate = '-', loginTime = '-'; // Default values if 'createdAt' is missing

        if (groupData.createdAt) {
            const createdDate = new Date(groupData.createdAt);
            regDate = createdDate.toLocaleDateString();
            loginTime = createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        // Handle members count: either an array or a numeric value
        let membersCount = 0;
        if (Array.isArray(groupData.members)) {
            membersCount = groupData.members.length; // If members is an array
        } else if (typeof groupData.members === 'number') {
            membersCount = groupData.members; // If members is a number
        }

        // Create a new row for each group
        const groupRow = `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <a href="#" class="avatar avatar-md">
                            <img src="${groupData.image || defaultAvatar}" class="img-fluid rounded-circle" alt="img">
                        </a>
                        <div class="ms-2 profile-name">
                            <p class="text-dark mb-0">
                                ${groupData.groupName || 'Unnamed Group'}
                            </p>
                        </div>
                    </div>
                </td>
                <td>${regDate}</td>
                <td>${loginTime}</td>
                <td>${membersCount || 0}</td>
            </tr>
        `;

        // Append the new row to the table body
        groupsTableBody.innerHTML += groupRow;
    });

    // Log if there are no groups found
    if (!snapshot.exists()) {
       
    }
}, (error) => {
    
});

});
