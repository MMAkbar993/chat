import { initializeFirebase } from './firebase-user.js';
import {
    initializeApp
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import {
    getAuth,
    createUserWithEmailAndPassword,
    FacebookAuthProvider,
    GoogleAuthProvider,
    signInWithPopup
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import {
    getDatabase,
    ref,
    set,
    serverTimestamp,
    get,
    remove
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js';

import { getMessaging, getToken } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging.js";


initializeFirebase(function (app, auth, database,storage) {
// Clear previous error messages
function clearMessages() {
    document.getElementById('firstNameError').textContent = '';
    document.getElementById('lastNameError').textContent = '';
    document.getElementById('emailError').textContent = '';
    document.getElementById('mobileNumberError').textContent = '';
    document.getElementById('userNameError').textContent = '';
    document.getElementById('passwordError').textContent = '';
    document.getElementById('termsError').textContent = '';
    const inputs = document.querySelectorAll('.form-control');
    inputs.forEach(input => {
        input.classList.remove('is-invalid', 'is-valid');
    });
}
// Handle Firebase error messages
function handleFirebaseError(error) {
    const errorCode = error.code;

    switch (errorCode) {
        case 'auth/invalid-email':
            document.getElementById('emailError').textContent = 'Invalid email address.';
            document.getElementById('email').classList.add('is-invalid');
            break;
        case 'auth/email-already-in-use':
            document.getElementById('emailError').textContent = 'Email is already in use.';
            document.getElementById('email').classList.add('is-invalid');
            break;
        case 'auth/weak-password':
            document.getElementById('passwordError').textContent = 'Password should be at least 6 characters.';
            document.getElementById('password').classList.add('is-invalid');
            break;
        case 'auth/terms-not-accepted': // Custom error code for terms
            document.getElementById('termsError').textContent = 'You must accept the terms and conditions.';
            document.getElementById('terms').classList.add(
                'is-invalid'); // Optionally, add a class to highlight the checkbox
            break;
        default:
            document.getElementById('emailError').textContent = 'An error occurred. Please try again.';
            document.getElementById('email').classList.add('is-invalid');
            break;
    }
}

// Check if the mobile number exists in the database
function checkIfMobileNumberExists(mobileNumber) {
    return new Promise((resolve) => {
        const usersRef = ref(database, 'data/users');
        // Query to check if the mobile number exists
        get(usersRef).then((snapshot) => {
            let exists = false;
            snapshot.forEach((childSnapshot) => {
                const userData = childSnapshot.val();
                if (userData.mobile_number === mobileNumber) {
                    exists = true;
                }
            });
            resolve(exists);
        }).catch(error => {
            resolve(false); // If there's an error, resolve as not existing
        });
    });
}

// Check if the username exists in the database
function checkIfUserNameExists(userName) {
    return new Promise((resolve, reject) => {
        const usersRef = ref(database, 'data/users');
        // Query to check if the username exists
        get(usersRef)
            .then((snapshot) => {
                let exists = false;
                snapshot.forEach((childSnapshot) => {
                    const userData = childSnapshot.val();
                    if (userData.user_name === userName) {
                        exists = true;
                    }
                });
                resolve(exists); // Resolves true if username exists, false if not
            })
            .catch(error => {
                reject(error); // Handle any potential errors in the Promise chain
            });
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

// New function with detailed logging
// In firebaseRegister.js

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


// Handle form submission for registration
async function handleRegisterFormSubmit(event) {
    event.preventDefault();

    // Get form input values
    const firstName = document.getElementById("first_name").value;
    const lastName = document.getElementById("last_name").value;
    const email = document.getElementById("email").value;
    const mobileNumber = document.getElementById("mobile_number").value;
    const userName = document.getElementById("user_name").value;
    const password = document.getElementById("password").value;
    const terms = document.getElementById("terms").checked;
    const submitButton = document.getElementById("submit_button");

    clearMessages();

    let valid = true;
    const alphabeticPattern = /^[A-Za-z\s]+$/;

    // Validate input fields (same as in your original function)
    if (!firstName) {
        document.getElementById('firstNameError').textContent = 'First Name is required.';
        document.getElementById('first_name').classList.add('is-invalid');
        valid = false;
    } else if (!alphabeticPattern.test(firstName)) {
        document.getElementById('firstNameError').textContent = 'First Name can only contain letters.';
        document.getElementById('first_name').classList.add('is-invalid');
        valid = false;
    } else {
        document.getElementById('first_name').classList.add('is-valid');
    }

    if (!lastName) {
        document.getElementById('lastNameError').textContent = 'Last Name is required.';
        document.getElementById('last_name').classList.add('is-invalid');
        valid = false;
    } else if (!alphabeticPattern.test(lastName)) {
        document.getElementById('lastNameError').textContent = 'Last Name can only contain letters.';
        document.getElementById('last_name').classList.add('is-invalid');
        valid = false;
    } else {
        document.getElementById('last_name').classList.add('is-valid');
    }

    // Regex pattern for email validation
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    // Email validation
    if (!email) {
        document.getElementById('emailError').textContent = 'Email is required.';
        document.getElementById('email').classList.add('is-invalid');
        valid = false;
    } else if (!emailPattern.test(email)) {
        document.getElementById('emailError').textContent = 'Please enter a valid email address.';
        document.getElementById('email').classList.add('is-invalid');
        valid = false;
    } else {
        document.getElementById('email').classList.add('is-valid');
    }


// Changed the regex to look for 10 to 21 digits.
const mobileNumberPattern = /^\d{10,21}$/;

if (!mobileNumber) {
    document.getElementById('mobileNumberError').textContent = 'Mobile Number is required.';
    document.getElementById('mobile_number').classList.add('is-invalid');
    valid = false;
} else if (!mobileNumberPattern.test(mobileNumber)) {
    // Updated the error message to reflect the new rule.
    document.getElementById('mobileNumberError').textContent = 'Mobile Number length must be between 10 to 21 digits.';
    document.getElementById('mobile_number').classList.add('is-invalid');
    valid = false;
} else {
    // On successful validation, ensure is-invalid is removed and is-valid is added.
    document.getElementById('mobile_number').classList.remove('is-invalid');
    document.getElementById('mobile_number').classList.add('is-valid');
}

    if (!userName) {
        document.getElementById('userNameError').textContent = 'User Name is required.';
        document.getElementById('user_name').classList.add('is-invalid');
        valid = false;
    } else {
        document.getElementById('user_name').classList.add('is-valid');
    }

    // Password validation with regex
    const passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!password) {
        document.getElementById('passwordError').textContent = 'Password is required.';
        document.getElementById('password').classList.add('is-invalid');
        valid = false;
    } else if (!passwordPattern.test(password)) {
        document.getElementById('passwordErrorCharacter').textContent = 'Password must be at least 8 characters long, contain one uppercase letter, one special character, and one number.';
        document.getElementById('passwordErrorCharacter').style.display = 'block';
        document.getElementById('password').classList.add('is-invalid');
        valid = false;
    } else {
        document.getElementById('password').classList.add('is-valid');
        document.getElementById('passwordErrorCharacter').style.display = 'none';
    }

    if (!terms) {
        document.getElementById('termsError').textContent = 'You must agree to the terms and conditions.';
        document.getElementById('termsError').style.display = 'block';
        document.getElementById('terms').classList.add('is-invalid');
        valid = false;
    } else {
        document.getElementById('termsError').style.display = 'none';
        document.getElementById('terms').classList.remove('is-invalid');
    }

    // If the form is valid, proceed
    if (valid) {
        submitButton.textContent = "Processing...";
        submitButton.disabled = true;

        try {
            const [mobileExists, emailExistsInUsers, userNameExists, emailExistsInContacts] = await Promise.all([
                checkIfMobileNumberExists(mobileNumber),
                checkIfEmailExists(email),
                checkIfUserNameExists(userName),
                checkIfEmailExistsInContacts(email) // New function to check email in contacts
            ]);

            let hasErrors = false;

            if (mobileExists) {
                document.getElementById('mobileNumberError').textContent = 'Mobile number is already registered.';
                document.getElementById('mobile_number').classList.add('is-invalid');
                hasErrors = true;
            }

            if (emailExistsInUsers) {
                document.getElementById('emailError').textContent = 'Email is already in use.';
                document.getElementById('email').classList.add('is-invalid');
                hasErrors = true;
            }

            if (userNameExists) {
                document.getElementById('userNameError').textContent = 'Username is already taken.';
                document.getElementById('user_name').classList.add('is-invalid');
                hasErrors = true;
            }

            if (!hasErrors) {
                const deviceToken = await getDeviceToken();
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                const userData = {
                    firstName: capitalizeFirstLetter(firstName),
                    lastName: capitalizeFirstLetter(lastName),
                    email: email,
                    mobile_number: mobileNumber,
                    username: capitalizeFirstLetter(userName),
                    uid: user.uid,
                    id: user.uid,
                    image: '',
                    name: mobileNumber,
                    nameToDisplay: mobileNumber,
                    profileName: mobileNumber,
                    online: true,
                    selected: true,
                    osType: 'web',
                    typing: '',
                    deviceToken: '',
                    status: "Hey I am available",
                    timestamp: serverTimestamp(),
                    deviceToken: deviceToken, 
                };
                

              
                if (emailExistsInContacts) {
                    
                    // Reference for the old contact
                    const oldContactRef = ref(database, `data/contacts/${emailExistsInContacts.userId}/${emailExistsInContacts.contact_id}`);
                
                    // Reference for the new contact
                    const newContactRef = ref(database, `data/contacts/${emailExistsInContacts.userId}/${user.uid}`);
                
                    // Update the new contact and delete the old one
                    try {
                        await set(newContactRef, {
                            contact_id: user.uid,
                            firstName: emailExistsInContacts.firstName,
                            lastName: emailExistsInContacts.lastName,
                            email: email, // Ensure email is valid
                            mobile_number: mobileNumber, // Ensure mobile_number is valid
                        });
                
                        // Delete the old contact
                        await remove(oldContactRef);
                        
                    } catch (error) {
                        console.error("Error occurred:", error);
                    }

                }

                const userRef = ref(database, 'data/users/' + user.uid);
                await set(userRef, userData);

                Toastify({
                    text: "Registered successfully!",
                    duration: 3000,
                    gravity: "top",
                    position: "center",
                    backgroundColor: "#4caf50",
                }).showToast();

                window.location.href = "/chat";
            } else {
                submitButton.textContent = "Sign Up";
                submitButton.disabled = false;
            }
        } catch (error) {
            handleFirebaseError(error);
            submitButton.textContent = "Sign Up";
            submitButton.disabled = false;
        }
    }
}

function checkIfEmailExistsInContacts(email) {
    return new Promise((resolve, reject) => {
        const contactsRef = ref(database, 'data/contacts');
        get(contactsRef)
            .then((snapshot) => {
                if (snapshot.exists()) {
                    const contacts = snapshot.val();
                    for (const [userId, userContacts] of Object.entries(contacts)) {
                        for (const [contactId, contactData] of Object.entries(userContacts)) {
                            if (contactData.email === email) {
                                resolve({
                                    contact_id: contactId,
                                    userId,
                                    firstName: contactData.firstName || null,
                                    lastName: contactData.lastName || null,
                                });
                                return;
                            }
                        }
                    }
                }
                resolve(null); // Email not found in contacts
            })
            .catch((error) => {
                console.error("Error checking email in contacts:", error);
                reject(error);
            });
    });
}




// Implement this function to check if the email exists
function checkIfEmailExists(email) {
    return new Promise((resolve) => {
        const usersRef = ref(database, 'data/users');
        // Query to check if the email exists
        get(usersRef).then((snapshot) => {
            let exists = false;
            snapshot.forEach((childSnapshot) => {
                const userData = childSnapshot.val();
                if (userData.email === email) {
                    exists = true;
                }
            });
            resolve(exists);
        }).catch(error => {
            resolve(false); // If there's an error, resolve as not existing
        });
    });
}

// Attach the event listener to the form once the DOM is loaded

    const form = document.querySelector("form");
    form.addEventListener("submit", handleRegisterFormSubmit);



    // Google Login
    document.getElementById("google-login").addEventListener("click", function (event) {
        event.preventDefault();
        const googleProvider = new GoogleAuthProvider();
        signInWithPopup(auth,googleProvider)
            .then((result) => {
                window.location.href = '/chat'; // Redirect to desired page after login
            })
            .catch((error) => {
                alert("Failed to sign in with Google.");
            });
    });

    // Facebook Login
    document.getElementById("facebook-login").addEventListener("click", function (event) {
        event.preventDefault();
        const facebookProvider = new FacebookAuthProvider();
        signInWithPopup(auth,facebookProvider)
            .then((result) => {
                window.location.href = '/chat'; // Redirect to desired page after login
            })
            .catch((error) => {
                alert("Failed to sign in with Facebook.");
            });
    });


});
