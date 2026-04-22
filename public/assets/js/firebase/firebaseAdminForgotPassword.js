import { initializeFirebase } from './firebase.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    sendPasswordResetEmail,
    confirmPasswordReset,
} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import {
    getDatabase,
    ref,
    push,
    onChildAdded,
    get,
    onValue,
    set,
    off,
    query, orderByChild, equalTo
} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";
import {
    getStorage,
    ref as storageRef,
    uploadBytes,
} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-storage.js";

initializeFirebase(function (app, auth, database, storage) {


    // Add an event listener to the Send OTP button
    document.getElementById('send-admin-email').addEventListener('click', async function (event) {
        event.preventDefault();
    
        const email = document.getElementById('email').value;
        const emailError = document.getElementById('emailError');
        
        if (!email) {
            emailError.textContent = 'Email is required.';
            document.getElementById('email').classList.add('is-invalid');
            return;
        } else {
            document.getElementById('email').classList.remove('is-invalid');
            document.getElementById('email').classList.add('is-valid');
        }
    
        const usersRef = ref(database, "data/users");
    
        try {
            // Query the database to find the user with the entered email
            const userQuery = query(usersRef, orderByChild("email"), equalTo(email));
            const snapshot = await get(userQuery);
    
            if (!snapshot.exists()) {
                emailError.textContent = "This email is not associated with an admin account.";
                document.getElementById('email').classList.add('is-invalid');
                return;
            }
    
            let isAdmin = false;
            snapshot.forEach((childSnapshot) => {
                const userData = childSnapshot.val();
                if (userData.role === "admin") {
                    isAdmin = true;
                }
            });
    
            if (!isAdmin) {
                emailError.textContent = "This email does not belong to an admin.";
                document.getElementById('email').classList.add('is-invalid');
                return;
            }
    
            // Email exists and belongs to an admin, proceed with password reset
            sendPasswordResetEmail(auth, email, {
                url: APP_URL + 'admin/login',
                handleCodeInApp: true,
            })
            .then(() => {
                window.location.href = "/admin/login";
            })
            .catch((error) => {
                emailError.textContent = error.message;
                document.getElementById('email').classList.add('is-invalid');
            });
    
        } catch (error) {
            console.error("Error checking admin email:", error);
            emailError.textContent = "An error occurred. Please try again.";
            document.getElementById('email').classList.add('is-invalid');
        }
    });
    
    document.addEventListener('DOMContentLoaded', function () {
        document.getElementById('reset-password-form-new').addEventListener('click', function (event) {
            event.preventDefault();

            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            let valid = true;

            // Clear previous error messages
            document.getElementById('passwordError').textContent = '';
            document.getElementById('newpasswordErrorCharacter').textContent = '';
            document.getElementById('confirmpasswordError').textContent = '';
            document.getElementById('confirmpasswordErrorCharacter').textContent = '';

            // Reset validation classes
            document.getElementById('new-password').classList.remove('is-invalid', 'is-valid');
            document.getElementById('confirm-password').classList.remove('is-invalid', 'is-valid');

            // Password pattern
            const passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

            // Validate new password
            if (!newPassword) {
                document.getElementById('passwordError').textContent = 'Password is required.';
                document.getElementById('passwordError').style.display = 'block';  // Ensure error is visible
                document.getElementById('new-password').classList.add('is-invalid');
                valid = false;
            } else if (!passwordPattern.test(newPassword)) {
                document.getElementById('newpasswordErrorCharacter').textContent = 'Password must be at least 8 characters long, contain one uppercase letter, one special character, and one number.';
                document.getElementById('newpasswordErrorCharacter').style.display = 'block';
                document.getElementById('new-password').classList.add('is-invalid');
                valid = false;
            } else {
                document.getElementById('new-password').classList.add('is-valid');
            }

            // Validate confirm password
            if (!confirmPassword) {
                document.getElementById('confirmpasswordError').textContent = 'Confirm Password is required.';
                document.getElementById('confirmpasswordError').style.display = 'block';  // Ensure error is visible
                document.getElementById('confirm-password').classList.add('is-invalid');
                valid = false;
            } else if (!passwordPattern.test(confirmPassword)) {
                document.getElementById('confirmpasswordErrorCharacter').textContent = 'Confirm Password must be at least 8 characters long, contain one uppercase letter, one special character, and one number.';
                document.getElementById('confirmpasswordErrorCharacter').style.display = 'block';
                document.getElementById('confirm-password').classList.add('is-invalid');
                valid = false;
            } else if (newPassword !== confirmPassword) {
                document.getElementById('confirmpasswordError').textContent = 'Passwords do not match. Please try again.';
                document.getElementById('confirmpasswordError').style.display = 'block';
                document.getElementById('confirm-password').classList.add('is-invalid');
                valid = false;
            } else {
                document.getElementById('confirm-password').classList.add('is-valid');
            }

            // Stop if validation failed
            if (!valid) return;

            // Reset the password
            const urlParams = new URLSearchParams(window.location.search);
            const oobCode = urlParams.get('oobCode');

            verifyPasswordResetCode(auth, oobCode)
                .then(() => confirmPasswordReset(auth, oobCode, newPassword))
                .then(() => {
                    window.location.href = "/admin/login";
                })
                .catch((error) => {
                   
                });
        });

    });
});
