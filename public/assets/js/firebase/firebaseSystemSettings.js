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
            // document.getElementById('user-id').innerText = `Logged in as: ${currentUser.uid}`;

            fetchUsers();

        } else {
            window.location.href = "/admin";
            document.getElementById('uid').innerText = 'No user logged in';
        }
    });



    function fetchUsers() {
        const userId = currentUser.uid; // Ensure currentUser is defined and has the uid property
        const userRef = ref(database, 'data/email_settings' ); // Path to the user's specific data

        get(userRef)
            .then((snapshot) => {
                if (snapshot.exists()) {
                    const userDetails = snapshot.val();

                    // Optionally display the logged-in user's details in the UI
                    displayUserDetails(userDetails);
                } 
            })
            .catch((error) => {
               
            });
    }

    function displayUserDetails(userDetails) {
        // Check if DOM elements exist before updating
        if (document.getElementById('application_key')) {
            document.getElementById('application_key').value = userDetails.application_key || '';
        }
        if (document.getElementById('authnticate_domain')) {
            document.getElementById('authnticate_domain').value = userDetails.authnticate_domain || '';
        }
        if (document.getElementById('database_url')) {
            document.getElementById('database_url').value = userDetails.database_url || '';
        }
        if (document.getElementById('from_email_address')) {
            document.getElementById('from_email_address').value = userDetails.from_email_address || '';
        }
        if (document.getElementById('email_password')) {
            document.getElementById('email_password').value = userDetails.email_password || ''; // Corrected
        }
        if (document.getElementById('from_name')) {
            document.getElementById('from_name').value = userDetails.from_name || ''; // Corrected
        }
        if (document.getElementById('host')) {
            document.getElementById('host').value = userDetails.host || ''; // Corrected
        }
        if (document.getElementById('port')) {
            document.getElementById('port').value = userDetails.port || ''; // Corrected
        }
        if (document.getElementById('project_id')) {
            document.getElementById('project_id').value = userDetails.project_id || ''; // Corrected
        }
        if (document.getElementById('storage_bucket')) {
            document.getElementById('storage_bucket').value = userDetails.storage_bucket || ''; // Corrected
        }
        if (document.getElementById('message_id')) {
            document.getElementById('message_id').value = userDetails.message_id || ''; // Corrected
        }
        if (document.getElementById('application_id')) {
            document.getElementById('application_id').value = userDetails.application_id || ''; // Corrected
        }
        if (document.getElementById('agora_application_id')) {
            document.getElementById('agora_application_id').value = userDetails.agora_application_id || ''; // Corrected
        }
        if (document.getElementById('agora_app_certification')) {
            document.getElementById('agora_app_certification').value = userDetails.agora_app_certification || ''; // Corrected
        }
    }



    document.getElementById('saveFirebaseButton').addEventListener('click', function (event) {
        event.preventDefault(); // Prevent the default action of the link

        // Get user input values
        const ApplicationKey = document.getElementById('application_key').value;
        const Domain = document.getElementById('authnticate_domain').value;
        const DatabaseUrl = document.getElementById('database_url').value;
        const ProjectId = document.getElementById('project_id').value;
        const StorageBucket = document.getElementById('storage_bucket').value;
        const MessageId = document.getElementById('message_id').value;
        const ApplicationId = document.getElementById('application_id').value;
        // const uid = document.getElementById('uid').value;

        // Get the current user's ID
        const userId = currentUser.uid; // Ensure currentUser is defined and has the uid property

        // Create a user object with only the fields you want to update
        const userData = {
            application_key: ApplicationKey,
            authnticate_domain: Domain,
            database_url: DatabaseUrl,
            project_id: ProjectId,
            storage_bucket: StorageBucket,
            message_id: MessageId,
            application_id: ApplicationId,

        };

        // Reference to the user data in Firebase
        const userRef = ref(database, 'data/email_settings');

        // Update user data in Firebase without removing existing fields
        update(userRef, userData)
            .then(() => {
                showToast(`System settings updated successfully!`);
                // Close the modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('fire-cap'));
            modal.hide();
            })
            .catch((error) => {
              
            });
    });

    document.getElementById('saveAgoraButton').addEventListener('click', function (event) {
        event.preventDefault(); // Prevent the default action of the link

        // Get user input values
        const AgoraApplicationKey = document.getElementById('agora_application_id').value;
        const AgoraAppCertification = document.getElementById('agora_app_certification').value;
        // const uid = document.getElementById('uid').value;

        // Get the current user's ID
        const userId = currentUser.uid; // Ensure currentUser is defined and has the uid property

        // Create a user object with only the fields you want to update
        const userData = {
            agora_application_id: AgoraApplicationKey,
            agora_app_certification:AgoraAppCertification,

        };

        // Reference to the user data in Firebase
        const userRef = ref(database, 'data/email_settings' );

        // Update user data in Firebase without removing existing fields
        update(userRef, userData)
            .then(() => {
                showToast(`System settings updated successfully!`);
                // Close the modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('agora-cap'));
            modal.hide();
            })
            .catch((error) => {
               
            });
    });

    document.getElementById('savePhpMailButton').addEventListener('click', function (event) {
        event.preventDefault(); // Prevent the default action of the link

        // Get user input values
        const FromEmailAddress = document.getElementById('from_email_address').value;
        const email = document.getElementById('email_password').value;
        const FromName = document.getElementById('from_name').value;
        const Host = document.getElementById('host').value;
        const Port = document.getElementById('port').value;
        // const uid = document.getElementById('uid').value;

        // Get the current user's ID
        const userId = currentUser.uid; // Ensure currentUser is defined and has the uid property

        // Create a user object with only the fields you want to update
        const userData = {
            from_email_address: FromEmailAddress,
            email_password: email,
            from_name: FromName,
            host: Host,
            port: Port,

        };

        // Reference to the user data in Firebase
        const userRef = ref(database, 'data/email_settings');

        // Update user data in Firebase without removing existing fields
        update(userRef, userData)
            .then(() => {
                showToast(`User data updated successfully!`);
            })
            .catch((error) => {
              
            });
    });
    function showToast(message) {
        Toastify({
            text: message,
            duration: 3000, // Duration in milliseconds
            gravity: "top", // `top` or `bottom`
            position: "right", // `left`, `center` or `right`
            style: {
                background: "#28a745" // Custom background color using style.background
            },
            stopOnFocus: true, // Prevents dismissing of toast on hover
        }).showToast();
    }
});
