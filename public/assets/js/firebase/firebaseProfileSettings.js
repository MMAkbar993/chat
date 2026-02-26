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

            fetchUsers();
            fetchUserDetails(currentUser.uid);
        } else {
            window.location.href = "/admin";
            document.getElementById('uid').innerText = 'No user logged in';
        }
    });



    function fetchUsers() {
        const usersRef = ref(database, 'data/app_settings'); // Path to your users data

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


    function displayUserDetails(user) {
        // Example function to display user details
        document.getElementById('profile-info-first-name').innerText = user.firstName || "No Name";
        document.getElementById('profile-info-last-name').innerText = user.lastName || "No Name";
        document.getElementById('profile-info-email').innerText = user.email || "No Email";
        document.getElementById('profile-info-phone').innerText = user.mobile_number || "No Phone";
        document.getElementById('profileImageProfile').innerText = user.image || "No Profile image";
        if (user.image) {
            document.getElementById('profileImageProfile').src = user.image; // Set the profile image URL
        } else {
            document.getElementById('profileImageProfile').src = 'assets/img/profiles/avatar-03.jpg'; // Optional: set a default image
        }
        // Add other fields as needed
    }

    function fetchUserDetails(userId) {
        const userRef = ref(database, 'data/users/' + userId);
        get(userRef)
            .then((snapshot) => {
                if (snapshot.exists()) {
                    const user = snapshot.val();
                    // Populate the input fields with existing user data
                    document.getElementById('profile-info-first-name').value = user.firstName || '';
                    document.getElementById('profile-info-last-name').value = user.lastName || '';
                    document.getElementById('profile-info-phone').value = user.mobile_number || '';
                    document.getElementById('profile-info-email').value = user.email || '';
                    document.getElementById('profileImageProfile').innerText = user.image || "No Profile image";
                    if (user.image) {
                        document.getElementById('profileImageProfile').src = user.image; // Set the profile image URL
                    } else {
                        document.getElementById('profileImageProfile').src = defaultAvatar; // Optional: set a default image
                    }
                    document.getElementById('user-id').value = user.uid || '';
                } 
            })
            .catch((error) => {
               
            });
    }


    // Save User Details
    document.getElementById('saveProfileBtn').addEventListener('click', function (event) {
        event.preventDefault(); // Prevent the default action of the button

        // Get the button element
        const saveButton = document.getElementById('saveProfileBtn');

        // Disable the button and change its text
        saveButton.disabled = true;
        saveButton.innerText = 'Saving...';

        // Clear existing error messages
        clearErrorMessages();

        // Get user input values
        const firstName = document.getElementById('profile-info-first-name').value;
        const lastName = document.getElementById('profile-info-last-name').value;
        const email = document.getElementById('profile-info-email').value;
        const mobile_number = document.getElementById('profile-info-phone').value;
        const uid = document.getElementById('user-id').value;

        // Validation flag
        let isValid = true;

        // Validate inputs
        if (!validateName(firstName)) {
            showError('profile-info-first-name', 'First name must contain only letters');
            isValid = false;
        }

        if (!validateName(lastName)) {
            showError('profile-info-last-name', 'Last name must contain only letters');
            isValid = false;
        }

        if (!validateEmail(email)) {
            showError('profile-info-email', 'Please enter a valid email address');
            isValid = false;
        }

        if (!validatePhoneNumber(mobile_number)) {
            showError('profile-info-phone', 'The phone number must be unique');
            isValid = false;
        }

        // If validation fails, reset the button and exit
        if (!isValid) {
            saveButton.disabled = false;
            saveButton.innerText = 'Save';
            return;
        }

        // Get the current user's ID
        const userId = currentUser.uid; // Ensure currentUser is defined and has the uid property

        // Create a user object with only the fields you want to update
        const userData = {
            firstName: firstName,
            lastName: lastName,
            mobile_number: mobile_number,
            email: email,
            uid: uid,
        };

        // Reference to the user data in Firebase
        const userRef = ref(database, 'data/users/' + userId);

        // Update user data in Firebase without removing existing fields
        update(userRef, userData)
            .then(() => {
                showToast(`User data updated successfully!`);

                // Check if an image is selected
                if (selectedImage) {
                    // Upload the profile image
                    uploadProfileImage(selectedImage, userId).then(() => {
                        // Once the image upload is successful, reload the page
                        window.location.reload();
                    }).catch((error) => {
                        // Reset the button if image upload fails
                        saveButton.disabled = false;
                        saveButton.innerText = 'Save';
                    });
                } else {
                    // If no image is selected, just reload the page
                    window.location.reload();
                }
            })
            .catch((error) => {
              
                // Reset the button
                saveButton.disabled = false;
                saveButton.innerText = 'Save';
            });
    });


    // Function to show error messages
    function showError(inputId, message) {
        const inputElement = document.getElementById(inputId);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message text-danger mt-1';
        errorDiv.innerText = message;
        inputElement.parentNode.appendChild(errorDiv);
    }

    // Function to clear all error messages
    function clearErrorMessages() {
        const errorMessages = document.querySelectorAll('.error-message');
        errorMessages.forEach((error) => error.remove());
    }

    // Validation functions
    function validateName(name) {
        return /^[A-Za-z\s]+$/.test(name.trim()); // Allows letters and spaces
    }

    function validateEmail(email) {
        // Regular expression for basic email validation
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    }

    function validatePhoneNumber(phoneNumber) {
        const re = /^\d{10}$/;
        return re.test(phoneNumber);
    }



    let selectedImage;


    // Function to upload the profile image to Firebase Storage
    function uploadProfileImage(file, userId) {
        return new Promise((resolve, reject) => {
            const imageRef = storageRef(storage, 'profile_images/' + userId + '/' + file.name);
            const uploadTask = uploadBytesResumable(imageRef, file);

            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    // Monitor the upload progress (optional)
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;

                },
                (error) => {
                    reject(error); // Reject the Promise on error
                },
                () => {
                    // Upload completed successfully
                    getDownloadURL(uploadTask.snapshot.ref)
                        .then((downloadURL) => {

                            // Update the user's profile with the image URL in the database
                            const userImageRef = ref(database, 'data/users/' + userId + '/image');
                            set(userImageRef, downloadURL)
                                .then(() => {
                                    resolve(); // Resolve the Promise when done
                                })
                                .catch((error) => {
                                    reject(error); // Reject the Promise if updating the database fails
                                });
                        })
                        .catch((error) => {
                            reject(error); // Reject the Promise if getting the URL fails
                        });
                }
            );
        });
    }

    // Event listener for file input change
    document.getElementById('imageUpload').addEventListener('change', function (event) {
        const file = event.target.files[0];
        const validTypes = ['image/jpeg', 'image/png', 'image/svg+xml'];
        if (file && validTypes.includes(file.type)) {
            const reader = new FileReader();
            reader.onload = function (e) {
                document.getElementById('profileImageProfile').src = e.target.result; // Preview the selected image
                selectedImage = file; // Store the selected file for uploading later
            };
            reader.readAsDataURL(file); // Read the file as a data URL
        } else {
            // Show toast error if file type is not valid
            showToastImage("Invalid file type! Only JPG, PNG, and SVG are allowed.", true);
        }
    });
    // Remove image event listener
    document.getElementById('removeImageBtn').addEventListener('click', function () {
        // Reset the image preview to the default
        document.getElementById('profileImageProfile').src = defaultAvatar;

        // Clear the selected image
        selectedImage = null;
    });
    function showToastImage(message, isError = false) {
        Toastify({
            text: message,
            duration: 3000, // Duration in milliseconds
            close: true,
            gravity: "top", // Top or bottom
            position: "right", // Left or right
            backgroundColor: isError ? "linear-gradient(to right, #ff5f6d, #ffc3a0)" : "linear-gradient(to right, #00b09b, #96c93d)", // Red for error, green for success
            stopOnFocus: true
        }).showToastImage();
    }
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
