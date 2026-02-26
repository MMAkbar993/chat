import { initializeFirebase } from './firebase.js';
import {
    initializeApp
} from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signInWithPopup,
    setPersistence,
    browserSessionPersistence,
    browserLocalPersistence
} from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';
import {
    getDatabase,
    ref,
    get,
    set,
    push,
} from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js';

initializeFirebase(function (app, auth, database,storage) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in, redirect to the chat page
          //  window.location.href = '/admin/index';
        }
    });
    // Form submission handler
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const rememberMeCheckbox = document.getElementById('rememberMe');

    // Load email and password from local storage if they exist
    if (localStorage.getItem('rememberedEmail')) {
        emailInput.value = localStorage.getItem('rememberedEmail');
        rememberMeCheckbox.checked = true; // Automatically check the box if there's an email
    }

    if (localStorage.getItem('rememberedPassword') && rememberMeCheckbox.checked) {
        passwordInput.value = localStorage.getItem('rememberedPassword');
    }
    document.getElementById('loginForm').addEventListener('submit', function (e) {
        e.preventDefault(); // Prevent default form submission
        const submitButton = document.getElementById('submit_login');
        submitButton.textContent = "Processing...";
        submitButton.disabled = true;
        clearMessages();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        const rememberMe = rememberMeCheckbox.checked;
        let valid = true; // Flag to track errors

        if (!email) {
            document.getElementById('email-error').textContent = 'Email is required.';
            document.getElementById('email').classList.add('is-invalid');
            valid = false; // Set valid to false
        } else {
            document.getElementById('email').classList.add('is-valid');
        }
        if (!password) {
            document.getElementById('password-error').textContent = 'Password is required.';
            document.getElementById('password').classList.add('is-invalid');
            valid = false; // Set valid to false
        } else {
            document.getElementById('password').classList.add('is-valid');
        }
        if (!valid) {
            submitButton.textContent = "Sign In";
            submitButton.disabled = false;
            return;
        }
        if (rememberMe) {
            localStorage.setItem('rememberedEmail', email);
            localStorage.setItem('rememberedPassword', password);
        } else {
            localStorage.removeItem('rememberedEmail');
            localStorage.removeItem('rememberedPassword');
        }

        const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
        setPersistence(auth, persistence)
            .then(() => {
            // Sign in with Firebase Authentication
            return signInWithEmailAndPassword(auth, email, password);
            })
                .then((userCredential) => {
                    const user = userCredential.user;

                    // Fetch the user's role from the Realtime Database
                    const userRef = ref(database, `data/users/${user.uid}`);
                    get(userRef)
                        .then((snapshot) => {
                            if (snapshot.exists()) {
                                const userData = snapshot.val();
                                if (userData.role === 'admin') {
                                    Toastify({
                                        text: "Logged in successfully!",
                                        duration: 3000,
                                        gravity: "top",
                                        position: "center",
                                        backgroundColor: "#4caf50",
                                    }).showToast();
                                    window.location.href = '/admin/index';
                                } else {
                                    // Handle non-admin users
                                    document.getElementById('errorMessage').innerText =
                                        'You do not have permission to access this page.';
                                }
                            } 
                        })
                        .catch((error) => {
                           
                        });
                })
                .catch((error) => {
                    Toastify({
                        text: "Login failed. Please check your credentials.",
                        duration: 3000,
                        gravity: "top",
                        position: "center",
                        backgroundColor: "#f44336",
                    }).showToast();
    
                    handleLoginError(error);
                })
                .finally(() => {
                    submitButton.textContent = "Sign In";
                    submitButton.disabled = false;
                });
        });

    function clearMessages() {
        document.getElementById('email-error').textContent = '';
        document.getElementById('password-error').textContent = '';
        const inputs = document.querySelectorAll('.form-control');
        inputs.forEach(input => {
            input.classList.remove('is-invalid', 'is-valid');
        });
    }
    fetchSystemDetails();
    function fetchSystemDetails() {
        const userRef = ref(database, 'data/app_settings/' );
        get(userRef)
            .then((snapshot) => {
                if (snapshot.exists()) {
                    const user = snapshot.val();
                    
                    // Update the full logo
                    document.getElementById('company-logo').innerText = user.company_logo || "No Profile image";
                    if (user.company_logo) {
                        document.getElementById('company-logo').src = user.company_logo; // Set the profile image URL
                    } else {
                        document.getElementById('company-logo').src = defaultLogoAvatar; // Optional: set a default image
                    }
    
                    // Update the title of the page
                    document.title = user.site_name || "Loading..."; // Set the title dynamically based on the site_name
                } 
            })
            .catch((error) => {
               
            });
    }

});
document.getElementById('copy_login_details').addEventListener('click', function () {
    const email = document.getElementById('demo-admin-email').textContent.split(':')[1].trim();
        const password = document.getElementById('demo-admin-password').textContent.split(':')[1].trim();

        // Set these values into the input fields
        document.getElementById('email').value = email;
        document.getElementById('password').value = password;
});

