import { initializeFirebase } from './firebase-user.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    sendPasswordResetEmail,
    confirmPasswordReset,
    verifyPasswordResetCode
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
    getDatabase,
    ref,
    push,
    onChildAdded,
    get,
    onValue,
    set,
    off,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import {
    getStorage,
    ref as storageRef,
    uploadBytes,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

initializeFirebase(function (app, auth, database,storage) {

    fetchSystemDetails();
    function fetchSystemDetails() {
        const userRef = ref(database, 'data/app_settings/' );
        get(userRef)
            .then((snapshot) => {
                if (snapshot.exists()) {
                    const user = snapshot.val();
                    console.log("demo");
                    // Update the full logo
                    document.getElementById('company-logo').innerText = user.company_logo || "No Profile image";
                    if (user.company_logo) {
                        document.getElementById('company-logo').src = user.company_logo; // Set the profile image URL
                    } else {
                        document.getElementById('company-logo').src = defaultLogoAvatar; // Optional: set a default image
                    }
                    document.getElementById('logo-fav').innerText = user.favi_icon || "No Profile image";
                    if (user.favi_icon) {
                        document.getElementById('logo-fav').src = user.favi_icon; // Set the profile image URL
                        document.querySelector("link[rel='shortcut icon']").href = user.favi_icon; // Update favicon dynamically
                    } else {
                        document.getElementById('logo-fav').src = faviLogo; // Optional: set a default image
                        document.querySelector("link[rel='shortcut icon']").href = faviLogo; // Update favicon to default if no logo
                    }
                    // Update the title of the page
                    document.title = user.site_name || "Loading..."; // Set the title dynamically based on the site_name
                } 
            })
            .catch((error) => {
              
            });
    }

    document.getElementById('send-otp').addEventListener('click', function () {
    event.preventDefault();
    const email = document.getElementById('email').value;
    let valid = true;
    if (!email) {
        document.getElementById('emailError').textContent = 'Email is required.';
        document.getElementById('email').classList.add('is-invalid');
        valid = false; // Set valid to false
    } else {
        document.getElementById('email').classList.add('is-valid');
    }
    // Send password reset email
    sendPasswordResetEmail(auth, email)
        .then(() => {
            // Email sent
                Toastify({
                    text: 'Mail sent successfully!',
                    duration: 3000,
                    gravity: 'top',
                    position: 'right',
                    backgroundColor: '#28a745',
                }).showToast();
            window.location.href = "/login"
        })
            .catch((error) => {
                // Handle errors here
               
            });
    });

    const resetForm = document.getElementById('reset-password-form-new');
    const newPasswordField = document.getElementById('new-password');
    const confirmPasswordField = document.getElementById('confirm-password');
    const passwordError = document.getElementById('passwordError');
    const newpasswordErrorCharacter = document.getElementById('newpasswordErrorCharacter');
    const confirmpasswordError = document.getElementById('confirmpasswordError');
    const confirmpasswordErrorCharacter = document.getElementById('confirmpasswordErrorCharacter');

    // Add focus event listeners to remove error messages on field focus
    newPasswordField.addEventListener('focus', function () {
        passwordError.style.display = 'none';
        newpasswordErrorCharacter.style.display = 'none';
        newPasswordField.classList.remove('is-invalid', 'is-valid');
    });

    confirmPasswordField.addEventListener('focus', function () {
        confirmpasswordError.style.display = 'none';
        confirmpasswordErrorCharacter.style.display = 'none';
        confirmPasswordField.classList.remove('is-invalid', 'is-valid');
    });

    // Listen for the form's submit event
    resetForm.addEventListener('submit', function (event) {
        event.preventDefault();  // Prevent form from submitting immediately

        const newPassword = newPasswordField.value;
        const confirmPassword = confirmPasswordField.value;

        let valid = true;

        // Clear previous error messages
        passwordError.textContent = '';
        newpasswordErrorCharacter.textContent = '';
        confirmpasswordError.textContent = '';
        confirmpasswordErrorCharacter.textContent = '';
        
        // Hide error messages by default
        passwordError.style.display = 'none';
        newpasswordErrorCharacter.style.display = 'none';
        confirmpasswordError.style.display = 'none';
        confirmpasswordErrorCharacter.style.display = 'none';

        // Password pattern
        const passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        // Validate new password
        if (!newPassword) {
            passwordError.textContent = 'Password is required.';
            passwordError.style.display = 'block';  // Show error message
            newPasswordField.classList.add('is-invalid');
            valid = false;
        } else if (!passwordPattern.test(newPassword)) {
            newpasswordErrorCharacter.textContent = 'Password must be at least 8 characters long, contain one uppercase letter, one special character, and one number.';
            newpasswordErrorCharacter.style.display = 'block';
            newPasswordField.classList.add('is-invalid');
            valid = false;
        } else {
            newPasswordField.classList.add('is-valid');
        }

        // Validate confirm password
        if (!confirmPassword) {
            confirmpasswordError.textContent = 'Confirm Password is required.';
            confirmpasswordError.style.display = 'block';  // Show error message
            confirmPasswordField.classList.add('is-invalid');
            valid = false;
        } else {
            // Check pattern for confirm password
            if (!passwordPattern.test(confirmPassword)) {
                confirmpasswordErrorCharacter.textContent = 'Confirm Password must be at least 8 characters long, contain one uppercase letter, one special character, and one number.';
                confirmpasswordErrorCharacter.style.display = 'block';
                confirmPasswordField.classList.add('is-invalid');
                valid = false;
            }
            
            // Check if new password and confirm password match
            if (newPassword !== confirmPassword) {
                confirmpasswordError.textContent = 'Passwords do not match. Please try again.';
                confirmpasswordError.style.display = 'block';
                confirmPasswordField.classList.add('is-invalid');
                valid = false;
            } 
            
            // If all confirm password validations pass
            if (passwordPattern.test(confirmPassword) && newPassword === confirmPassword) {
                confirmPasswordField.classList.add('is-valid');
            }
        }

        // Stop if validation failed
        if (!valid) return;

        // Proceed with password reset logic if validation passes
        const urlParams = new URLSearchParams(window.location.search);
        const oobCode = urlParams.get('oobCode');

        verifyPasswordResetCode(auth, oobCode)
            .then(() => confirmPasswordReset(auth, oobCode, newPassword))
            .then(() => {
                Toastify({
                    text: 'Password reset successfully!',
                    duration: 3000,
                    gravity: 'top',
                    position: 'right',
                    backgroundColor: '#28a745',
                }).showToast();
                window.location.href = "/login";
            })
            .catch((error) => {
              
            });
    });
});