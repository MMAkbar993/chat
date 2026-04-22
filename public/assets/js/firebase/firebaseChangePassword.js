import { initializeFirebase } from './firebase.js';
import {
    initializeApp
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import {
    getAuth,
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword,
    signOut
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
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js';  // Storage (file upload)

import {
    getFirestore,
    collection,
    setDoc,
    doc
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

initializeFirebase(function (app, auth, database, storage) {

    function clearMessages() {
        document.getElementById('new_password-error').textContent = '';
        document.getElementById('confirm_password-error').textContent = '';
        document.getElementById('password-error').textContent = '';
        const inputs = document.querySelectorAll('.form-control');
        inputs.forEach(input => {
            input.classList.remove('is-invalid', 'is-valid');
        });
    }

    // Handle password change
    const passwordForm = document.getElementById('changePasswordForm');

    passwordForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevent default form submission
        clearMessages();

        // Get values from input fields
        const currentPassword = passwordForm.querySelector('#password').value;
        const newPassword = passwordForm.querySelector('#new_password').value;
        const confirmPassword = passwordForm.querySelector('#confirm_password').value;
        let valid = true; // Flag to track errors

        // Validate current password
        if (!currentPassword) {
            document.getElementById('password-error').textContent = 'Current password is required.';
            document.getElementById('password').classList.add('is-invalid');
            valid = false; // Set valid to false
        } else {
            document.getElementById('password').classList.add('is-valid');
        }

        // Validate new password
        const passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!newPassword) {
            document.getElementById('new_password-error').textContent = 'New password is required.';
            document.getElementById('new_password').classList.add('is-invalid');
            valid = false; // Set valid to false
        } else if (!passwordPattern.test(newPassword)) {
            document.getElementById('newpasswordErrorCharacter').textContent = 'New Password must be at least 8 characters long, contain one uppercase letter, one special character, and one number.';
            document.getElementById('newpasswordErrorCharacter').style.display = 'block';
            document.getElementById('new_password').classList.add('is-invalid');
            valid = false;
        } else if (newPassword === currentPassword) {  // Check if current password and new password are the same
            document.getElementById('new_password-error').textContent = 'New password must be different from the current password.';
            document.getElementById('new_password').classList.add('is-invalid');
            valid = false;
        }else {
            document.getElementById('new_password').classList.add('is-valid');
            document.getElementById('newpasswordErrorCharacter').classList.add('is-valid');
            document.getElementById('newpasswordErrorCharacter').style.display = 'none';
        }

        // Validate confirm password
        if (!confirmPassword) {
            document.getElementById('confirm_password-error').textContent = 'Confirm password is required.';
            document.getElementById('confirm_password').classList.add('is-invalid');
            valid = false; // Set valid to false
        } else if (!passwordPattern.test(confirmPassword)) {
            document.getElementById('confirmpasswordErrorCharacter').textContent = 'Confirm Password must be at least 8 characters long, contain one uppercase letter, one special character, and one number.';
            document.getElementById('confirmpasswordErrorCharacter').style.display = 'block';
            document.getElementById('confirm_password').classList.add('is-invalid');
            valid = false;
        } else {
            document.getElementById('confirm_password').classList.add('is-valid');
            document.getElementById('confirmpasswordErrorCharacter').classList.add('is-valid');
            document.getElementById('confirmpasswordErrorCharacter').style.display = 'none';
        }

        // Check if valid
        if (!valid) {
            return; // Stop execution if there are validation errors
        }

        // Basic validation for matching passwords
        if (newPassword !== confirmPassword) {
            document.getElementById('new_password-error').textContent = 'Passwords do not match.';
            document.getElementById('new_password').classList.add('is-invalid');
            document.getElementById('confirm_password-error').textContent = 'Passwords do not match.';
            document.getElementById('confirm_password').classList.add('is-invalid');
            return; // Stop execution if passwords do not match
        }

        // Get the current user
        const user = auth.currentUser;

        if (user) {
            // Re-authenticate the user
            const credential = EmailAuthProvider.credential(user.email, currentPassword);

            reauthenticateWithCredential(user, credential).then(() => {
                // User re-authenticated, now update the password
                updatePassword(user, newPassword).then(() => {
                    Toastify({
                        text: "Password changed successfully!",
                        duration: 3000,
                        gravity: "top",
                        position: "right",
                        backgroundColor: "#28a745",
                    }).showToast();
                      // Log out the user after the password is changed
                signOut(auth).then(() => {
                    // Redirect the user to the login page after logging out
                    window.location.href = '/login'; // Adjust this URL to match your login page URL
                }).catch((error) => {
                    alert("Error logging out: " + error.message);
                });
                    passwordForm.reset(); // Reset form fields
                    clearMessages(); // Clear messages after reset
                }).catch((error) => {
                    alert("Error updating password: " + error.message);
                });
            }).catch((error) => {
                document.getElementById('password-error').textContent = 'Incorrect current password.';
                document.getElementById('password').classList.add('is-invalid');
            });
        } else {
            alert("No user is currently logged in.");
        }
    });

    // Add input event listeners to change input state on valid input
    const inputs = passwordForm.querySelectorAll('.form-control.validate-input');

    inputs.forEach(input => {
        input.addEventListener('input', () => {
            if (input.value) {
                input.classList.remove('is-invalid');
                input.classList.add('is-valid');
            } else {
                input.classList.remove('is-valid');
                input.classList.add('is-invalid');
            }
        });
    });
});
