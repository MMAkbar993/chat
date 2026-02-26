// Import Firebase libraries for app and authentication
import { initializeFirebase } from './firebase-user.js';
import {
    initializeApp
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signInWithCustomToken,
    FacebookAuthProvider,
    GoogleAuthProvider,
    signInWithPopup,
    setPersistence,
    browserSessionPersistence,
    browserLocalPersistence,
    signOut
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import {
    getDatabase,
    ref,
    set,
    push,
    get,
    update, child
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// Firebase configuration (replace with your actual Firebase configuration)
initializeFirebase(function (app, auth, database,storage) {
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

function getDeviceInfo() {
    const userAgent = navigator.userAgent;
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;

    // Extract browser name
    let browser = "Unknown Browser";
    if (userAgent.includes("Chrome")) {
        if (userAgent.includes("Edg")) {
            browser = "Edge";
        }else{
            browser = "Chrome";
        }
    } else if (userAgent.includes("Firefox")) {
        browser = "Firefox";
    } else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
        browser = "Safari";
    } else if (userAgent.includes("Edge")) {
        browser = "Edge";
    } else if (userAgent.includes("Trident") || userAgent.includes("MSIE")) {
        browser = "Internet Explorer";
    }

    // Extract OS
    let os = "Unknown OS";
    if (userAgent.includes("Windows")) {
        os = "Windows";
    } else if (userAgent.includes("Mac OS")) {
        os = "Mac OS";
    } else if (userAgent.includes("Linux")) {
        os = "Linux";
    } else if (userAgent.includes("Android")) {
        os = "Android";
    } else if (userAgent.includes("iOS")) {
        os = "iOS";
    }
    const name = browser + '(' + os + ')';


    return {
        userAgent: name,
        screenResolution: `${screenWidth}x${screenHeight}`,
        timestamp: Date.now() // Optional: Add the timestamp of the login
    };
}



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

    async function getDeviceToken() {
    console.log("Attempting to get device token...");
    const messaging = getMessaging();

    try {
        // We will manually register the service worker to ensure it's running
        // before we ask for a token.
        const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log("Service Worker registration successful.");

        console.log("Requesting notification permission...");
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            console.log('Notification permission granted.');

            console.log("Attempting to get FCM token from Firebase...");
            const currentToken = await getToken(messaging, {
                vapidKey: 'BGIFjD5YCDPAQ34X5Kpt0hEITuu6LmQda6RrLmGgqesZWprVHZu52jmBim4on3Z-JiKpwY5RQjYvDHIwKWZDJ3k',
                serviceWorkerRegistration: swRegistration // Use our own registration
            });

            if (currentToken) {
                console.log('Token successfully received:', currentToken);
                return currentToken;
            } else {
                console.log('getToken() completed but returned no token. This is the final error point if it fails.');
                return '';
            }
        } else {
            console.log('Notification permission was not granted.');
            return '';
        }
    } catch (error) {
        console.error('An error occurred in getDeviceToken:', error);
        return '';
    }
}

    document.getElementById('login-form').addEventListener('submit', function (event) {
        event.preventDefault();

        const submitButton = document.getElementById('submit_login');
        submitButton.textContent = "Processing...";
        submitButton.disabled = true;

        clearMessages();

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        const rememberMe = rememberMeCheckbox.checked;

        let valid = true;

        if (!email) {
            document.getElementById('email-error').textContent = 'Email is required.';
            emailInput.classList.add('is-invalid');
            valid = false;
        } else {
            emailInput.classList.add('is-valid');
        }
        if (!password) {
            document.getElementById('password-error').textContent = 'Password is required.';
            passwordInput.classList.add('is-invalid');
            valid = false;
        } else {
            passwordInput.classList.add('is-valid');
        }

        if (!valid) {
            submitButton.textContent = "Sign In";
            submitButton.disabled = false;
            return;
        }

        // If the user checks "Remember Me", save the email and password to local storage
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
                return signInWithEmailAndPassword(auth, email, password);
            })
            .then((userCredential) => {
                const user = userCredential.user;
             

                // Check if the user is blocked or has the "admin" role
                const userRef = ref(getDatabase(), `data/users/${user.uid}`);
                get(userRef).then(async (snapshot) => {
                    if (snapshot.exists()) {
                        const userData = snapshot.val();
                        
                        // If user is blocked, prevent login
                        if (userData.adminblock === true) {
                            Toastify({
                                text: "Your account has been blocked. Please contact support.",
                                duration: 3000,
                                gravity: "top",
                                position: "center",
                                backgroundColor: "#f44336",
                            }).showToast();

                            // Log the user out immediately
                            signOut(auth)
                                .then(() => {
                                   
                                })
                                .catch((error) => {
                                   
                                });

                            submitButton.textContent = "Sign In";
                            submitButton.disabled = false;
                            return; // Exit the login process
                        }

                        // If user role is "admin", prevent login
                        if (userData.role === "admin") {
                            Toastify({
                                text: "Login credentials are wrong.",
                                duration: 3000,
                                gravity: "top",
                                position: "center",
                                backgroundColor: "#f44336",
                            }).showToast();

                            // Log the user out immediately
                            signOut(auth)
                                .then(() => {
                                  
                                })
                                .catch((error) => {
                                  
                                });

                            submitButton.textContent = "Sign In";
                            submitButton.disabled = false;
                            return; // Exit the login process
                        }

                    // const deviceToken = await getDeviceToken();    

                    var userref = ref(database, `data/users/${user.uid}`);
                    update(userref, { "online":true,
                                      "osType": "web" }) // Persist the 'seen' status in Firebase
                            .then(() => {
                               
                            })
                            .catch((error) => {
                               
                            });
                            try {
                                var language = "English";
                                setfiresession(user.uid, userData.username, userData.firstName, language);
                            } catch (e) {
                            }
                        }       
                    Toastify({
                        text: "Logged in successfully!",
                        duration: 3000,
                        gravity: "top",
                        position: "center",
                        backgroundColor: "#4caf50",
                    }).showToast();

                    const deviceInfo = getDeviceInfo(); 
                    const userRef = ref(getDatabase(), `data/users/${user.uid}/device_info`);
                    const newDeviceRef = push(userRef);
                    const deviceData = {
                        device_name: deviceInfo.userAgent,
                        last_used: deviceInfo.timestamp
                    };

                    set(newDeviceRef, deviceData)
                        .then(() => {
                           
                             window.location.href = '/chat';
                        })
                        .catch((error) => {
                           
                        });
                }).catch((error) => {
                  
                    submitButton.textContent = "Sign In";
                    submitButton.disabled = false;
                });
            })
            .catch(async (error) => {
                // If Firebase has no user (e.g. registered via Laravel only), try Laravel login and sign in with custom token
                const isInvalidCreds = error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-login-credentials' || error.code === 'auth/user-not-found' || (error.httpStatusCode === 400);
                if (isInvalidCreds && email && password) {
                    try {
                        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
                        const baseUrl = (typeof window !== 'undefined' && window.location.origin) ? window.location.origin : '';
                        const r = await fetch(baseUrl + '/login/laravel', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': csrfToken || '' },
                            body: JSON.stringify({ email: email, password: password }),
                        });
                        const data = await r.json().catch(() => ({}));
                        if (r.status === 503 && data.message) {
                            Toastify({ text: data.message, duration: 6000, gravity: "top", position: "center", style: { background: "#f44336" } }).showToast();
                            submitButton.textContent = "Sign In"; submitButton.disabled = false;
                            return;
                        }
                        if (r.ok && data.firebase_custom_token) {
                            try {
                                await signInWithCustomToken(auth, data.firebase_custom_token);
                            } catch (customTokenError) {
                                if (customTokenError.code === 'auth/invalid-custom-token' || customTokenError.httpStatusCode === 400) {
                                    Toastify({ text: data.message || "Sign-in failed. Your Firebase project in .env may not match the backend. See docs/FIREBASE_PROJECT_MISMATCH.md", duration: 5000, gravity: "top", position: "center", style: { background: "#f44336" } }).showToast();
                                    submitButton.textContent = "Sign In"; submitButton.disabled = false;
                                    return;
                                }
                                throw customTokenError;
                            }
                            const userCredential = { user: auth.currentUser };
                            const user = userCredential.user;
                            const userRef = ref(getDatabase(), `data/users/${user.uid}`);
                            const snapshot = await get(userRef);
                            if (snapshot.exists()) {
                                const userData = snapshot.val();
                                if (userData.adminblock === true) {
                                    await signOut(auth);
                                    Toastify({ text: "Your account has been blocked.", duration: 3000, gravity: "top", position: "center", style: { background: "#f44336" } }).showToast();
                                    submitButton.textContent = "Sign In"; submitButton.disabled = false;
                                    return;
                                }
                                if (userData.role === "admin") {
                                    await signOut(auth);
                                    Toastify({ text: "Login credentials are wrong.", duration: 3000, gravity: "top", position: "center", style: { background: "#f44336" } }).showToast();
                                    submitButton.textContent = "Sign In"; submitButton.disabled = false;
                                    return;
                                }
                                await update(ref(database, `data/users/${user.uid}`), { online: true, osType: "web" });
                                try { setfiresession(user.uid, userData.username, userData.firstName, "English"); } catch (e) {}
                            }
                            Toastify({ text: "Logged in successfully!", duration: 3000, gravity: "top", position: "center", style: { background: "#4caf50" } }).showToast();
                            submitButton.textContent = "Sign In"; submitButton.disabled = false;
                            window.location.href = '/chat';
                            return;
                        }
                    } catch (e) { /* fall through to normal error */ }
                }
                Toastify({
                    text: "Login credentials are wrong.",
                    duration: 3000,
                    gravity: "top",
                    position: "center",
                    style: { background: "#f44336" },
                }).showToast();
                handleLoginError(error);
            })
            .finally(() => {
                submitButton.textContent = "Sign In";
                submitButton.disabled = false;
            });
    });


    function handleLoginError(error) {
        const errorCode = error.code;
        const errorMessage = error.message;

        if (errorCode === 'auth/invalid-email') {
            document.getElementById('email-error').textContent = 'Please enter a valid email.';
            document.getElementById('email').classList.add('is-invalid');
        } else if (errorCode === 'auth/user-not-found') {
            document.getElementById('email-error').textContent = 'No user found with this email.';
            document.getElementById('email').classList.add('is-invalid');
        } else if (errorCode === 'auth/wrong-password') {
            document.getElementById('password-error').textContent = 'Incorrect password.';
            document.getElementById('password').classList.add('is-invalid');
        } else if (errorMessage === 'Firebase: Error (auth/invalid-login-credentials).') {
            document.getElementById('password-error').textContent = 'Invalid Credentials';
            document.getElementById('password').classList.add('is-invalid');

            document.getElementById('email-error').textContent = 'Invalid Credentials';
            document.getElementById('email').classList.add('is-invalid');
        } else {
            document.getElementById('email-error').textContent = errorMessage;
            document.getElementById('email').classList.add('is-invalid');
        }
       
    }


    function setfiresession(user, name, username, language) {
        const languageRef = ref(database, "data/languageKeywords/" + language);

        // Retrieve language data from Firebase
        get(languageRef)
            .then((snapshot) => {
                if (snapshot.exists()) {
                    const languagedata = snapshot.val();
                    $.ajaxSetup({
                        headers: {
                            'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                        }
                    });
    
                    $.ajax({
                        url: '/fire-session', // Laravel endpoint
                        type: 'POST',
                        data: {
                            user: user,
                            username: name,
                            firstName: username,
                            state: 'no',
                            language: language,
                            languagedata: languagedata
                        },
                        success: function(response) {
                        },
                        error: function(xhr) {
                        }
                    });
                } else {
                    console.error("No data available for the selected language.");
                }
            })
            .catch((error) => {
                console.error("Firebase error:", error);
            });
    }
    
    
document.getElementById('copy_login_details').addEventListener('click', function () {
    const email = document.getElementById('demo-email').textContent.split(':')[1].trim();
        const password = document.getElementById('demo-password').textContent.split(':')[1].trim();

        // Set these values into the input fields
        document.getElementById('email').value = email;
        document.getElementById('password').value = password;
});

document.getElementById('copy_login_details-one').addEventListener('click', function () {
    const email = document.getElementById('demo-email-one').textContent.split(':')[1].trim();
        const password = document.getElementById('demo-password-one').textContent.split(':')[1].trim();

        // Set these values into the input fields
        document.getElementById('email').value = email;
        document.getElementById('password').value = password;
});

});