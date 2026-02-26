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
    getDocs,
    doc,
    getDoc
} from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';

initializeFirebase(function (app, auth, database, storage) {

    let currentUser = null; // Define the current user here
    let selectedUserId = null; // Store the selected user ID
    let usersMap = {}; // Define usersMap here

    // Monitor the user's authentication state
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user; // Set currentUser to the signed-in user
            fetchUsers();
            fetchUserDetails(currentUser.uid);
        } else {
            window.location.href = "/admin";
            document.getElementById('user-id').innerText = 'No user logged in';
        }
    });

    window.onload = async function () {
        try {
            await loadCountries(); // Wait for countries to load

            // Check if user is signed in

        } catch (error) {
            
        }
    };

    // Load countries into the dropdown
    function loadCountries() {
        return new Promise((resolve, reject) => {
            const countrySelect = document.getElementById('site_country');
            countrySelect.innerHTML = ''; // Clear existing options to prevent duplication
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.disabled = true;
            defaultOption.selected = true;
            defaultOption.textContent = 'Select Country';
            countrySelect.appendChild(defaultOption);

            // Reference to countries in the Realtime Database
            const countriesRef = ref(database, 'data/countries');
            get(countriesRef)
                .then((countriesSnapshot) => {
                    if (countriesSnapshot.exists()) {
                        const countries = countriesSnapshot.val();
                        for (const country in countries) {
                            const option = document.createElement('option');
                            option.value = country; // Use country name as value
                            option.text = country; // Display country name
                            countrySelect.appendChild(option);
                        }
                        resolve(); // Resolve the Promise when done
                    } else {
                        resolve(); // Resolve even if no countries found
                    }
                })
                .catch((error) => {
                   
                    reject(error); // Reject the Promise on error
                });
        });
    }

    // Function to load states when a country is selected
    document.getElementById('site_country').addEventListener('change', async function () {
        const selectedCountry = this.value;

        if (selectedCountry !== 'Select') {
            try {
                // Reference to the states of the selected country
                const countryStatesRef = ref(database, `data/countries/${selectedCountry}`);

            } catch (error) {
               
            }
        }
    });

    // Load countries on page load

    function fetchUsers() {
        const usersRef = ref(database, 'data/app_settings'); // Path to your users data
        const userId = currentUser.uid;
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
                            const loggedInUserDetails = users[loggedInUserId];

                            // Optionally display the logged-in user's details in the UI
                            fetchUserDetails(userId);
                        } 
                    } 
                }
            })
            .catch((error) => {
               
            });
    }

    function fetchUserDetails(userId) {
        const userRef = ref(database, 'data/app_settings/');
        get(userRef)
            .then((snapshot) => {
                if (snapshot.exists()) {
                    const user = snapshot.val();
                    // Populate the input fields with existing user data
                    document.getElementById('site_name').value = user.site_name || '';
                    document.getElementById('site_email').value = user.site_email || '';
                    document.getElementById('site_number').value = user.site_phone || '';
                    document.getElementById('site_fax').value = user.site_fax || '';
                    document.getElementById('site_address').value = user.site_address || '';
                    document.getElementById('site_city').value = user.site_city || '';
                    document.getElementById('site_state').value = user.site_state || '';
                    document.getElementById('site_country').value = user.site_country || '';
                    document.getElementById('site_code').value = user.site_code || '';
                    document.getElementById('uid').value = user.uid || '';
                    if (user.company_logo) {
                        document.getElementById('companyLogo').src = user.company_logo; // Set the profile image URL
                    } else {
                        document.getElementById('companyLogo').src = defaultLogoAvatar; // Optional: set a default image
                    }
                    if (user.dark_logo) {
                        document.getElementById('DarkLogo').src = user.dark_logo; // Set the profile image URL
                    } else {
                        document.getElementById('DarkLogo').src = defaultLogoAvatar; // Optional: set a default image
                    }
                    if (user.mini_logo) {
                        document.getElementById('MiniLogo').src = user.mini_logo; // Set the profile image URL
                    } else {
                        document.getElementById('MiniLogo').src = defaultLogoAvatar; // Optional: set a default image
                    }
                    if (user.dark_mini_logo) {
                        document.getElementById('darkminilogo').src = user.dark_mini_logo; // Set the profile image URL
                    } else {
                        document.getElementById('darkminilogo').src = defaultLogoAvatar; // Optional: set a default image
                    }
                    if (user.favi_icon) {
                        document.getElementById('faviIcon').src = user.favi_icon; // Set the profile image URL
                    } else {
                        document.getElementById('faviIcon').src = defaultLogoAvatar; // Optional: set a default image
                    }
                    if (user.apple_icon) {
                        document.getElementById('appleIcon').src = user.apple_icon; // Set the profile image URL
                    } else {
                        document.getElementById('appleIcon').src = defaultLogoAvatar; // Optional: set a default image
                    }
                } 
            })
            .catch((error) => {
              
            });
    }


    document.getElementById('SaveButton').addEventListener('click', async function (event) {
        event.preventDefault(); // Prevent the default action of the link
    
        // Get user input values
        const siteName = document.getElementById('site_name').value;
        const email = document.getElementById('site_email').value;
        const phone = document.getElementById('site_number').value;
        const fax = document.getElementById('site_fax').value;
        const address = document.getElementById('site_address').value;
        const city = document.getElementById('site_city').value;
        const state = document.getElementById('site_state').value;
        const country = document.getElementById('site_country').value;
        const postalCode = document.getElementById('site_code').value;
        const uid = document.getElementById('uid').value;
    
        const fields = [
            { id: 'site_name', regex: /^[A-Za-z\s]+$/, requiredError: 'Site Name is required.', formatError: 'Site Name must only contain letters and spaces.' },
            { id: 'site_email', regex: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/, requiredError: 'Email Address is required.', formatError: 'Enter a valid email address.' },
            { id: 'site_number', regex: /^[0-9]{10,21}$/, requiredError: 'Phone number is required.', formatError: 'Phone number length must be 10 to 21 digits.' },
            { id: 'site_city', regex: /^[A-Za-z\s]+$/, requiredError: 'City is required.', formatError: 'City must only contain letters and spaces.' },
            { id: 'site_state', regex: /^[A-Za-z\s]+$/, requiredError: 'State is required.', formatError: 'State must only contain letters and spaces.' },
            { id: 'site_country', regex: /^[A-Za-z\s]+$/, requiredError: 'Country is required.', formatError: 'Country must only contain letters and spaces.' },
            { id: 'site_code', regex: /^[0-9]{5,6}$/, requiredError: 'Postal Code is required.', formatError: 'Postal Code must be 5 or 6 digits.' },
            { id: 'site_address', requiredError: 'Address is required.' },
           
        ];
    
        let isValid = true;
    
        // Clear previous error messages
        fields.forEach(field => {
            const errorElement = document.querySelector(`#${field.id}_error`);
            if (errorElement) errorElement.textContent = '';
        });
    
        // Validate each field
        fields.forEach(field => {
            const inputElement = document.getElementById(field.id);
            const errorElement = document.querySelector(`#${field.id}_error`);
            const value = inputElement.value.trim();
    
            if (!value) {
                // Show "required" error
                if (errorElement) errorElement.textContent = field.requiredError;
                isValid = false;
            } else if (field.regex && !field.regex.test(value)) {
                // Show "format" error only if not empty
                if (errorElement) errorElement.textContent = field.formatError;
                isValid = false;
            }
        });
    
        if (!isValid) {
            return; // Stop execution if validation fails
        }
    
        // If all validations pass, proceed with the update
    
        // Get the current user's ID
        const userId = currentUser.uid; // Ensure currentUser is defined and has the uid property
    
        // Create a user object with only the fields you want to update
        const userData = {
            site_name: siteName,
            site_email: email,
            site_phone: phone,
            site_fax: fax,
            site_address: address,
            site_city: city,
            site_state: state,
            site_country: country,
            site_code: postalCode,
            uid: userId,
        };
    
        // Reference to the user data in Firebase
        const userRef = ref(database, 'data/app_settings/');
    
        try {
            // Update user data in Firebase without removing existing fields
            await update(userRef, userData);
            // If an image is selected, upload it to storage
            const uploadPromises = [];
    
            if (selectedCompanyImage) {
                uploadPromises.push(uploadProfileImage(selectedCompanyImage, userId));
            }
            if (selectedDarkImage) {
                uploadPromises.push(uploadDarkImage(selectedDarkImage, userId));
            }
            if (selectedMiniImage) {
                uploadPromises.push(uploadMiniImage(selectedMiniImage, userId));
            }
            if (selectedDarkMiniImage) {
                uploadPromises.push(uploadDarkMiniImage(selectedDarkMiniImage, userId));
            }
            if (selectedFaviImage) {
                uploadPromises.push(uploadFaviImage(selectedFaviImage, userId));
            }
            if (selectedAppleImage) {
                uploadPromises.push(uploadAppleImage(selectedAppleImage, userId));
            }
    
            // Wait for all image uploads to complete
            await Promise.all(uploadPromises);
    
            // Show success message
            showToast(`Settings updated successfully`);
    
            // Reload the page after all operations are complete
            window.location.reload(); // Reload the page after saving settings
        } catch (error) {
           
        }
    });   

    let selectedCompanyImage, selectedDarkImage, selectedMiniImage, selectedDarkMiniImage, selectedFaviImage, selectedAppleImage;
    function resetImageAndVariable(trashIcon, imageSelector, selectedImageVar) {
        const imageContainer = trashIcon.closest('.company-img-content');
        const image = imageContainer.querySelector(imageSelector);
        
        // Reset the image to default avatar
        if (image) {
            image.src = defaultAvatar;
        }
    
        // Clear the corresponding selected image variable
        selectedImageVar = null;
    }
    
    // Attach event listeners to each trash icon
    document.querySelectorAll('.company-img-content a').forEach((trashIcon, index) => {
        trashIcon.addEventListener('click', function (e) {
            e.preventDefault();
    
            // Handle different images based on index
            switch (index) {
                case 0: // Profile image
                    resetImageAndVariable(trashIcon, 'img.company-image', selectedCompanyImage);
                    break;
                case 1: // Dark image
                    resetImageAndVariable(trashIcon, 'img.dark-image', selectedDarkImage);
                    break;
                case 2: // Mini image
                    resetImageAndVariable(trashIcon, 'img.mini-image', selectedMiniImage);
                    break;
                case 3: // Dark mini image
                    resetImageAndVariable(trashIcon, 'img.dark-mini-image', selectedDarkMiniImage);
                    break;
                case 4: // Favicon image
                    resetImageAndVariable(trashIcon, 'img.favi-image', selectedFaviImage);
                    break;
                case 5: // Apple image
                    resetImageAndVariable(trashIcon, 'img.apple-image', selectedAppleImage);
                    break;
                default:
                    break;
            }
        });
    });
// Function to show toast notification
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

// Function to upload the profile image to Firebase Storage
function uploadProfileImage(file, userId) {
    return new Promise((resolve, reject) => {
        const imageRef = storageRef(storage, 'app_images/' + userId + '/' + file.name);
        const uploadTask = uploadBytesResumable(imageRef, file);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            },
            (error) => {
                
                reject(error);
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {

                    const userImageRef = ref(database, 'data/app_settings/' + '/company_logo');
                    set(userImageRef, downloadURL)
                        .then(() => {
                            resolve(downloadURL);
                        })
                        .catch((error) => {
                            reject(error);
                        });
                });
            }
        );
    });
}

// Event listener for file input change
document.getElementById('companyLogoUpload').addEventListener('change', function (event) {
    const file = event.target.files[0];

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/svg+xml'];
    if (file && validTypes.includes(file.type)) {
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('companyLogo').src = e.target.result; // Preview the selected image
            selectedCompanyImage = file; // Store the selected file for uploading later
        };
        reader.readAsDataURL(file); // Read the file as a data URL
    } else {
        // Show toast error if file type is not valid
        showToastImage("Invalid file type! Only JPG, PNG, and SVG are allowed.", true);
    }
});



  
    // Function to upload the profile image to Firebase Storage
    function uploadDarkImage(file, userId) {
        return new Promise((resolve, reject) => {
            const imageRef = storageRef(storage, 'app_images/' + userId + '/' + file.name);
            const uploadTask = uploadBytesResumable(imageRef, file);

            uploadTask.on('state_changed',
                (snapshot) => {
                    // Optionally, monitor the upload progress here
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                },
                (error) => {
                    reject(error);
                },
                () => {
                    // Upload completed successfully, now get the download URL
                    getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {

                        // Update the user's profile with the image URL
                        const userImageRef = ref(database, 'data/app_settings/'  +
                            '/dark_logo'); // Use dbRef to refer to the database
                        set(userImageRef, downloadURL) // Save the image URL to the user's profile
                            .then(() => {
                                resolve(downloadURL);
                            })
                            .catch((error) => {
                                reject(error);
                            });
                    });
                }
            );
        });
    }

    // Event listener for file input change
    document.getElementById('darkLogoUpload').addEventListener('change', function (event) {
        const file = event.target.files[0];
        const validTypes = ['image/jpeg', 'image/png', 'image/svg+xml'];
        if (file && validTypes.includes(file.type)) {
            const reader = new FileReader();
            reader.onload = function (e) {
                document.getElementById('DarkLogo').src = e.target.result; // Preview the selected image
                selectedDarkImage = file; // Store the selected file for uploading later
            };
            reader.readAsDataURL(file); // Read the file as a data URL
        } else {
            // Show toast error if file type is not valid
            showToastImage("Invalid file type! Only JPG, PNG, and SVG are allowed.", true);
        }
    });



    // Function to upload the profile image to Firebase Storage
    function uploadMiniImage(file, userId) {
        return new Promise((resolve, reject) => {
            const imageRef = storageRef(storage, 'app_images/' + userId + '/' + file.name);
            const uploadTask = uploadBytesResumable(imageRef, file);

            uploadTask.on('state_changed',
                (snapshot) => {
                    // Optionally, monitor the upload progress here
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                },
                (error) => {
                    reject(error);
                },
                () => {
                    // Upload completed successfully, now get the download URL
                    getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {

                        // Update the user's profile with the image URL
                        const userImageRef = ref(database, 'data/app_settings/' +
                            '/mini_logo'); // Use dbRef to refer to the database
                        set(userImageRef, downloadURL) // Save the image URL to the user's profile
                            .then(() => {
                                resolve(downloadURL);
                            })
                            .catch((error) => {
                                reject(error);
                            });
                    });
                }
            );
        });
    }

    // Event listener for file input change
    document.getElementById('miniIconUpload').addEventListener('change', function (event) {
        const file = event.target.files[0];
        const validTypes = ['image/jpeg', 'image/png', 'image/svg+xml'];
        if (file && validTypes.includes(file.type)) {
            const reader = new FileReader();
            reader.onload = function (e) {
                document.getElementById('MiniLogo').src = e.target.result; // Preview the selected image
                selectedMiniImage = file; // Store the selected file for uploading later
            };
            reader.readAsDataURL(file); // Read the file as a data URL
        } else {
            // Show toast error if file type is not valid
            showToastImage("Invalid file type! Only JPG, PNG, and SVG are allowed.", true);
        }
    });

    
    // Function to upload the profile image to Firebase Storage
    function uploadDarkMiniImage(file, userId) {
        return new Promise((resolve, reject) => {
            const imageRef = storageRef(storage, 'app_images/' + userId + '/' + file.name);
            const uploadTask = uploadBytesResumable(imageRef, file);

            uploadTask.on('state_changed',
                (snapshot) => {
                    // Optionally, monitor the upload progress here
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                },
                (error) => {
                    reject(error);
                },
                () => {
                    // Upload completed successfully, now get the download URL
                    getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {

                        // Update the user's profile with the image URL
                        const userImageRef = ref(database, 'data/app_settings/' +
                            '/dark_mini_logo'); // Use dbRef to refer to the database
                        set(userImageRef, downloadURL) // Save the image URL to the user's profile
                            .then(() => {
                                resolve(downloadURL);
                            })
                            .catch((error) => {
                                reject(error);
                            });
                    });
                }
            );
        });
    }

    // Event listener for file input change
    document.getElementById('darkminiIconUpload').addEventListener('change', function (event) {
        const file = event.target.files[0];
        const validTypes = ['image/jpeg', 'image/png', 'image/svg+xml'];
        if (file && validTypes.includes(file.type)) {
            const reader = new FileReader();
            reader.onload = function (e) {
                document.getElementById('darkminilogo').src = e.target.result; // Preview the selected image
                selectedDarkMiniImage = file; // Store the selected file for uploading later
            };
            reader.readAsDataURL(file); // Read the file as a data URL
        }
        else {
            // Show toast error if file type is not valid
            showToastImage("Invalid file type! Only JPG, PNG, and SVG are allowed.", true);
        }
    });

 
    // Function to upload the profile image to Firebase Storage
    function uploadFaviImage(file, userId) {
        return new Promise((resolve, reject) => {
            const imageRef = storageRef(storage, 'app_images/' + userId + '/' + file.name);
            const uploadTask = uploadBytesResumable(imageRef, file);

            uploadTask.on('state_changed',
                (snapshot) => {
                    // Optionally, monitor the upload progress here
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;

                },
                (error) => {

                    reject(error);
                },
                () => {
                    // Upload completed successfully, now get the download URL
                    getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {


                        // Update the user's profile with the image URL
                        const userImageRef = ref(database, 'data/app_settings/'  +
                            '/favi_icon'); // Use dbRef to refer to the database
                        set(userImageRef, downloadURL) // Save the image URL to the user's profile
                            .then(() => {
                                resolve(downloadURL);
                            })
                            .catch((error) => {
                                reject(error);
                            });
                    });
                }
            );
        });
    }

    // Event listener for file input change
    document.getElementById('faviconUpload').addEventListener('change', function (event) {
        const file = event.target.files[0];
        const validTypes = ['image/jpeg', 'image/png', 'image/svg+xml'];
        if (file && validTypes.includes(file.type)) {
            const reader = new FileReader();
            reader.onload = function (e) {
                document.getElementById('faviIcon').src = e.target.result; // Preview the selected image
                selectedFaviImage = file; // Store the selected file for uploading later
            };
            reader.readAsDataURL(file); // Read the file as a data URL
        } else {
            // Show toast error if file type is not valid
            showToastImage("Invalid file type! Only JPG, PNG, and SVG are allowed.", true);
        }
    });

   
    // Function to upload the profile image to Firebase Storage
    function uploadAppleImage(file, userId) {
        return new Promise((resolve, reject) => {
            const imageRef = storageRef(storage, 'app_images/' + userId + '/' + file.name);
            const uploadTask = uploadBytesResumable(imageRef, file);

            uploadTask.on('state_changed',
                (snapshot) => {
                    // Optionally, monitor the upload progress here
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;

                },
                (error) => {
                    reject(error);
                },
                () => {
                    // Upload completed successfully, now get the download URL
                    getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {

                        // Update the user's profile with the image URL
                        const userImageRef = ref(database, 'data/app_settings/' +
                            '/apple_icon'); // Use dbRef to refer to the database
                        set(userImageRef, downloadURL) // Save the image URL to the user's profile
                            .then(() => {
                                resolve(downloadURL);
                            })
                            .catch((error) => {
                                reject(error);
                            });
                    });
                }
            );
        });
    }

    // Event listener for file input change
    document.getElementById('appleIconUpload').addEventListener('change', function (event) {
        const file = event.target.files[0];
        const validTypes = ['image/jpeg', 'image/png', 'image/svg+xml'];
        if (file && validTypes.includes(file.type)) {
            const reader = new FileReader();
            reader.onload = function (e) {
                document.getElementById('appleIcon').src = e.target.result; // Preview the selected image
                selectedAppleImage = file; // Store the selected file for uploading later
            };
            reader.readAsDataURL(file); // Read the file as a data URL
        } else {
            // Show toast error if file type is not valid
            showToastImage("Invalid file type! Only JPG, PNG, and SVG are allowed.", true);
        }
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
