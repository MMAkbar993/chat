import { initializeFirebase } from './firebase-user.js';
import { initializeApp, setLogLevel } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    sendPasswordResetEmail,
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
    update,
    query, orderByChild, equalTo, remove, goOnline
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import {
    getStorage,
    ref as storageRef,
    uploadBytes,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

initializeFirebase(function (app, auth, database, storage) {


    let currentUserId = null; // Define the current user here

    // Monitor the user's authentication state
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUserId = user.uid; // Set the current user ID

        } else {
            // window.location.href = "/login";

        }
    });

    // Initialize Firebase Database reference
    const usersRef = ref(database, "data/users"); // Correct Firebase reference to the "users" node

    function displayUsers(searchTerm = '') {
        const contactsRef = ref(database, `data/contacts/${currentUserId}`);
    
        get(contactsRef).then(async snapshot => {
            if (snapshot.exists()) {
                const contacts = snapshot.val(); // Get all contacts
                const contactIds = Object.keys(contacts); // Get the contact user IDs
    
                const usersArray = await Promise.all(
                    contactIds.map(async (userId) => {
                        const contact = contacts[userId] || {}; // Get contact data safely
                
                        try {
                            const userRef = ref(database, `data/users/${userId}`); // Correct Firebase reference
                            const snapshot = await get(userRef); // Fetch user details
                
                            let userData = {};
                            if (snapshot.exists()) {
                                userData = snapshot.val(); // Get user details
                            }
                
                            return {
                                uid: userId,
                                firstName: contact.firstName || userData.firstName || "",
                                lastName: contact.lastName || userData.lastName ||  "",
                                userName: userData.username || userData.userName || userData.profileName || "",
                                image: userData.image || "assets/img/profiles/avatar-03.jpg",
                                mobile_number: contact.mobile_number || userData.mobile_number ||  "",
                                email: contact.email || userData.email ||  "",
                            };
                        } catch (error) {
                            console.error(`Error fetching user data for ${userId}:`, error);
                            return null; // Handle errors gracefully
                        }
                    })
                );
                
    
                // Sort users alphabetically by first name and handle users without names
                const validUsersArray = usersArray.filter(user => user.firstName && user.lastName);
                const othersArray = usersArray.filter(user => !user.firstName && !user.lastName);
    
                // Sort valid users alphabetically by first name
                validUsersArray.sort((a, b) => a.firstName.localeCompare(b.firstName));
    
                const filteredUsersArray = validUsersArray.filter(user =>
                    (user.firstName && user.firstName.toLowerCase().includes(searchTerm)) ||
                    (user.lastName && user.lastName.toLowerCase().includes(searchTerm)) ||
                    (user.userName && user.userName.toLowerCase().includes(searchTerm))
                );
    
                // Group users by the first letter of their first name
                const groupedUsers = filteredUsersArray.reduce((groups, user) => {
                    const firstLetter = user.firstName.charAt(0).toUpperCase();
                    if (!groups[firstLetter]) {
                        groups[firstLetter] = [];
                    }
                    groups[firstLetter].push(user);
                    return groups;
                }, {});
    
                // Include the 'Others' category
                if (othersArray.length > 0) {
                    groupedUsers['Others'] = othersArray;
                }
    
                // Clear the container first to avoid duplicates
                const chatContainer = document.getElementById('chatContainer'); // Your container div
                chatContainer.innerHTML = ''; // Clear previous content
    
                // Build and append the HTML for each user group
                Object.keys(groupedUsers).forEach(letter => {
                    const group = groupedUsers[letter];
    
                    // Create a div for each letter group
                    let groupHtml = `
                    <div class="mb-4">
                        <h6 class="mb-2">${letter}</h6>
                        <div class="chat-list">
                    `;
    
                    // Loop through the users in this group and build HTML
                    group.forEach(user => {
                        const contact = contacts[user.uid] || {};
                        const displayName = (contact.firstName || user.firstName || user.userName || user.mobile_number || user.email) + ' ' + (contact.lastName || user.lastName || '').trim();
                        groupHtml += `
                        <a href="javascript:void(0);" data-bs-toggle="modal" data-bs-target="#contact-details" class="chat-user-list"
                            data-user-id="${user.uid}" data-username="${(user.userName || '').replace(/"/g, '&quot;')}">
                            <div class="avatar avatar-lg me-2">
                                <img src="${user.image}" class="rounded-circle" alt="image">
                            </div>
                            <div class="chat-user-info">
                                <div class="chat-user-msg">
                                    <h6>${displayName.trim() || 'Unknown'}</h6>
                                </div>
                            </div>
                        </a>
                    `;
                    });
    
                    // Close the group div
                    groupHtml += '</div></div>';
    
                    // Append to the container
                    chatContainer.innerHTML += groupHtml;
                });
    
                // Add event listener for fetching user details when clicking on a user
                document.querySelectorAll('.chat-user-list').forEach(item => {
                    item.addEventListener('click', function () {
                        const userId = this.getAttribute('data-user-id');
                        fetchUserData(userId); // Fetch and display user details in modal
                    });
                });
            } else {
                chatContainer.innerHTML = '<p id="no-message">No Contacts Found!</p>'
            }
        }).catch(error => {
            console.error("Error fetching contacts: ", error);
        });
    }
    
    // Fetch user data from Firebase using user ID and display it in the modal
    function fetchUserData(userId) {
        
        const contactRef = ref(database, `data/contacts/${currentUserId}/${userId}`); // Reference to the contact data
       
        // Fetch contact data from Firebase
        get(contactRef).then(async snapshot => {
            if (snapshot.exists()) {
                const userRef = ref(database, `data/users/${userId}`); // Correct Firebase reference
                        const snapshot = await get(userRef); // Fetch user details
            
                        let userData = {};
                        if (snapshot.exists()) {
                            userData = snapshot.val(); // Get user details
                        }
                        const snapshotContact = await get(contactRef); 
                       const contactData = snapshotContact.val();
                // Update modal content with fetched data
                document.getElementById("edit-user-id").value = userId;
                document.querySelector('#contact-details h6').textContent = 
                    `${contactData.firstName || contactData.mobile_number || contactData.email} ${contactData.lastName || ''}`;
                document.querySelector('#contact-details .avatar img').src = userData.image || 'assets/img/profiles/avatar-03.jpg';
                document.querySelector('#contact-details .fw-medium.fs-14.mb-2[data-field="phone"]').textContent = contactData.mobile_number || 'N/A';
                document.querySelector('#contact-details .fw-medium.fs-14.mb-2[data-field="email"]').textContent = contactData.email || 'N/A';

                const contactKycBadge = document.querySelector('#contact-details .contact-kyc-badge');
                if (contactKycBadge) {
                    contactKycBadge.style.display = 'none';
                    const checkEmail = contactData.email || (userData && userData.email);
                    if (checkEmail) {
                        fetch(`/api/kyc-status?email=${encodeURIComponent(checkEmail)}`)
                            .then(r => r.json())
                            .then(data => { contactKycBadge.style.display = data.verified ? 'inline-flex' : 'none'; })
                            .catch(() => {});
                    }
                }

            } else {
                // If no data exists for this user, handle gracefully
                Swal.fire({
                    title: "",
                    width: 400,
                    text: "Contact details not found.",
                    icon: "error",
                });
            }
        }).catch(error => {
            // Handle errors
            Swal.fire({
                title: "Error",
                text: error.message,
                icon: "error",
            });
        });
    }

    document.addEventListener("click", function (event) {
        const chatBtn = event.target.closest("#chat-button, #contact-detail-chat-btn");
        if (chatBtn) {
            event.preventDefault();
            handleChatButtonClick();
            return;
        }

        const voiceBtn = event.target.closest("#contact-detail-voice-btn");
        if (voiceBtn) {
            event.preventDefault();
            handleVoiceCallClick();
            return;
        }

        const videoBtn = event.target.closest("#contact-detail-video-btn");
        if (videoBtn) {
            event.preventDefault();
            handleVideoCallClick();
            return;
        }
    });

    function handleVoiceCallClick() {
        const userId = document.getElementById("edit-user-id").value;
        if (!currentUserId || !userId) return;
        
        const modalEl = document.getElementById('contact-details');
        if (modalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const m = bootstrap.Modal.getInstance(modalEl);
            if (m) m.hide();
        }
        var callBtn = document.getElementById('audio-call-btn') || document.getElementById('audio-new-btn-group');
        if (callBtn) callBtn.click();
    }

    function handleVideoCallClick() {
        const userId = document.getElementById("edit-user-id").value;
        if (!currentUserId || !userId) return;
        
        const modalEl = document.getElementById('contact-details');
        if (modalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const m = bootstrap.Modal.getInstance(modalEl);
            if (m) m.hide();
        }
        var callBtn = document.getElementById('video-call-new-btn') || document.getElementById('video-call-new-btn-group');
        if (callBtn) callBtn.click();
    }

    function handleChatButtonClick() {
        const userId = document.getElementById("edit-user-id").value; // Get the user ID from the modal
        // Reference to the user in the "users" collection
        const userRef = ref(database, `data/users/${userId}`);
    
        // Check if the user exists in the "users" collection
        get(userRef).then(snapshot => {
            if (snapshot.exists()) {
                 localStorage.setItem("selectedUserId", userId); // Save user ID in localStorage
                window.location.href = `/chat`;
            } else {
                // User does not exist - show Toastify message
                Toastify({
                    text: "User not available for chat.",
                    duration: 3000,
                    gravity: "top",
                    position: "right",
                    backgroundColor: "#ff6b6b",
                }).showToast();
            }
        }).catch(error => {
            // Handle errors
            console.error("Error checking user:", error);
            Toastify({
                text: "An error occurred. Please try again.",
                duration: 3000,
                gravity: "top",
                position: "right",
                backgroundColor: "#ff6b6b",
            }).showToast();
        });
    }
    
    

    // Call the function to load users on page load
    displayUsers;

    // Function to handle form submission and save user data to Firebase
    function handleRegisterFormSubmit(event) {
        event.preventDefault();
        event.stopPropagation();
    
        // Disable the submit button and change the text
        const submitButton = document.getElementById("submit-contact-button"); // Ensure you have an ID for your button
        submitButton.disabled = true;
        submitButton.textContent = "Processing...";
    
        const firstName = document.getElementById("first_name").value;
        const lastName = document.getElementById("last_name").value;
        const email_new = document.getElementById("email_new").value;
        const mobileNumber = document.getElementById("mobile_number_new").value;
        const password = 'tempPassword123';  // Password can be set dynamically
    
        const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    
        // Reset any previous error messages
        document.getElementById("firstNameError").textContent = "";
        document.getElementById("lastNameError").textContent = "";
        document.getElementById("emailError").textContent = "";
        document.getElementById("mobileNumberError").textContent = "";
    
        // Perform validation
        let valid = true;
    
        // Validate firstName
        if (!firstName.trim()) {
            document.getElementById('firstNameError').textContent = 'First Name is required.';
            document.getElementById('first_name').classList.add('is-invalid');
            valid = false;
        } else if (firstName.charAt(0) === ' ') {
            document.getElementById('firstNameError').textContent = 'First Name cannot start with a space.';
            document.getElementById('first_name').classList.add('is-invalid');
            valid = false;
        } else {
            document.getElementById('first_name').classList.remove('is-invalid');
            document.getElementById('first_name').classList.add('is-valid');
        }

        // Validate lastName
        if (!lastName.trim()) {
            document.getElementById('lastNameError').textContent = 'Last Name is required.';
            document.getElementById('last_name').classList.add('is-invalid');
            valid = false;
        } else if (lastName.charAt(0) === ' ') {
            document.getElementById('lastNameError').textContent = 'Last Name cannot start with a space.';
            document.getElementById('last_name').classList.add('is-invalid');
            valid = false;
        } else {
            document.getElementById('last_name').classList.remove('is-invalid');
            document.getElementById('last_name').classList.add('is-valid');
        }
    
        const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        if (!email_new) {
            document.getElementById('emailError').textContent = 'Email is required.';
            document.getElementById('email_new').classList.add('is-invalid');
            valid = false;
        } else if (!emailPattern.test(email_new)) {
            document.getElementById('emailCharError').textContent = 'Enter a valid email.';
            document.getElementById('emailCharError').style.display = 'block';
            document.getElementById('email_new').classList.add('is-invalid');
            valid = false;
        } else {
            document.getElementById('email_new').classList.add('is-valid');
        }

        const phonePattern = /^[0-9]{10,21}$/; // Assuming 13-digit number pattern
        if (!mobileNumber) {
            document.getElementById("mobileNumberError").textContent = "Mobile number is required.";
            document.getElementById("mobile_number_new").classList.add("is-invalid");
            valid = false;
        } else if (!phonePattern.test(mobileNumber)) {
            document.getElementById('mobileNumberCharError').textContent = 'Enter a valid mobile number.';
            document.getElementById('mobileNumberCharError').style.display = 'block';
            document.getElementById('mobile_number_new').classList.remove('is-valid');
            document.getElementById('mobile_number_new').classList.add('is-invalid');
            valid = false;
        } else {
            document.getElementById("mobile_number_new").classList.add("is-valid");
        }
    
        // If validation fails, re-enable button and exit function
        if (!valid) {
            submitButton.disabled = false;
            submitButton.textContent = "Add Contact";
            return;
        }
    
        const loggedInUserId = auth.currentUser.uid;
        const usersRef = ref(database, 'data/users');
    
        // Check if the email already exists in Firebase
        const emailQuery = query(usersRef, orderByChild('email'), equalTo(email_new));
        get(emailQuery).then((snapshot) => {
            if (snapshot.exists()) {
                const existingUserData = Object.values(snapshot.val())[0];
                const existingUserId = existingUserData.id;
                if(loggedInUserId == existingUserId){
                    Swal.fire({
                        title: "",
                        width: 400,
                        text: "You can't able add yourself in contact list",
                        icon: "error",
                    });
                    document.getElementById("register-form").reset(); // Clear the form
                    $("#add-contact").modal("hide"); // Close the modal
                    // Re-enable button and reset text
                    submitButton.disabled = false;
                    submitButton.textContent = "Add Contact"; // Change back to original text
                    return false;
                            } 
                // Check if the contact is already in the user's contact list
                const loggedInUserContactsRef = ref(database, `data/contacts/${loggedInUserId}/${existingUserId}`);
                get(loggedInUserContactsRef).then((contactSnapshot) => {
                    if (contactSnapshot.exists()) {
                        // Contact already exists
                        Swal.fire({
                            title: "",
                            width: 400,
                            text: "This contact is already in your contacts list!",
                            icon: "info",
                        });
                    } else {
                        // Add existing user to the logged-in user's contact list
                        set(loggedInUserContactsRef, {
                            contact_id: existingUserId,
                            email: existingUserData.email,
                            firstName: capitalizeFirstLetter(firstName),
                            lastName: capitalizeFirstLetter(lastName),
                            mobile_number: existingUserData.mobile_number,
                        });

                       
                         // Retrieve the logged-in user's details from the users collection
                         const loggedInUserRef = ref(
                            database,
                            `data/users/${loggedInUserId}`
                        );
                        get(loggedInUserRef)
                            .then((loggedInUserSnapshot) => {
                                if (loggedInUserSnapshot.exists()) {
                                     console.log("if");
                                    const loggedInUserData =
                                        loggedInUserSnapshot.val();

                                    // Add logged-in user to the new user's contact list with the mobile_number
                                    const newUserContactsRef = ref(
                                        database,
                                        "data/contacts/" + data.uid + "/" + loggedInUserId
                                    );
                                    set(newUserContactsRef, {
                                        contact_id: loggedInUserId,
                                        email: loggedInUserData.email,
                                        mobile_number:loggedInUserData.mobile_number ||"",
                                    });
                                        
                                } else {
                                     console.log("else");
                                    console.error(
                                        "Logged-in user data not found in the users collection"
                                    );
                                }
                            })
                            .catch((error) => {
                                console.error(
                                    "Error retrieving logged-in user data:",
                                    error
                                );
                            });
                        Swal.fire({
                            title: "",
                            width: 400,
                            text: "User added to contacts!",
                            icon: "success",
                        }).then((result) => {
                            if (result.isConfirmed) {
                                // Redirect to the desired page
                                window.location.href = "/contact";
                            }
                        });
                    }
                    document.getElementById("register-form").reset(); // Clear the form
                    $("#add-contact").modal("hide"); // Close the modal
                    submitButton.disabled = false;
                    submitButton.textContent = "Add Contact"; // Change back to original text
                }).catch((error) => {
                    
                });
            } else {
                // Add new user to the logged-in user's contact list
                const loggedInUserContactsRef = ref(
                    database,
                    "data/contacts/" + loggedInUserId
                );
                const newContactRef = push(loggedInUserContactsRef); // Generate a unique contact_id

                set(newContactRef, {
                    contact_id: newContactRef.key, // Use the generated key as the contact_id
                    email: email_new,
                    firstName: capitalizeFirstLetter(firstName),
                    lastName: capitalizeFirstLetter(lastName),
                    mobile_number: mobileNumber,
                })
                    .then(() => {
                        Swal.fire({
                            title: "",
                            width: 400,
                            text: "User added to contacts!",
                            icon: "success",
                        }).then((result) => {
                            if (result.isConfirmed) {
                                // Redirect to the desired page
                                window.location.href = "/contact";
                            }
                        });
                    })
                    .catch((error) => {
                        console.error("Error adding contact:", error.message);
                    });
            }
        }).catch((error) => {
            Swal.fire({
                title: "",
                width: 400,
                text: "Error checking email: " + error.message,
                icon: "error"
            });
            submitButton.disabled = false;
            submitButton.textContent = "Add Contact"; // Change back to original text
        });
    }

    // Set up a listener for new users added
    onChildAdded(usersRef, (data) => {
        displayUsers(); // Call displayUsers whenever a new user is added
    });


    // Search by username - add contact from API results
    let addContactSearchTimeout;
    const addContactSearchInput = document.getElementById("add-contact-username-search");
    const addContactSearchResults = document.getElementById("add-contact-search-results");
    if (addContactSearchInput && addContactSearchResults) {
        addContactSearchInput.addEventListener("input", function () {
            const q = this.value.trim();
            clearTimeout(addContactSearchTimeout);
            if (q.length < 2) {
                addContactSearchResults.style.display = "none";
                addContactSearchResults.innerHTML = "";
                return;
            }
            addContactSearchTimeout = setTimeout(() => {
                fetch(`/api/users/search?q=${encodeURIComponent(q)}`, { credentials: 'same-origin' })
                    .then(r => r.json())
                    .then(data => {
                        const users = data.users || [];
                        addContactSearchResults.innerHTML = "";
                        if (users.length === 0) {
                            addContactSearchResults.innerHTML = '<p class="text-muted small mb-0 p-2">No users found.</p>';
                        } else {
                            users.forEach(u => {
                                const div = document.createElement("div");
                                div.className = "d-flex align-items-center justify-content-between p-2 border-bottom";
                                div.innerHTML = `
                                    <div class="d-flex align-items-center">
                                        <img src="${u.profile_image || 'assets/img/profiles/avatar-03.jpg'}" class="rounded-circle me-2" width="32" height="32" alt="">
                                        <div>
                                            <strong>${u.full_name || (u.first_name + ' ' + u.last_name) || u.user_name || 'User'}</strong>
                                            <br><small class="text-muted">@${u.user_name || ''}</small>
                                        </div>
                                    </div>
                                    <button type="button" class="btn btn-sm btn-primary add-contact-from-search" ${!u.firebase_uid ? 'disabled title="User not yet on chat"' : ''} data-uid="${u.firebase_uid || ''}" data-name="${(u.full_name || u.first_name + ' ' + u.last_name || u.user_name || '').replace(/"/g, '&quot;')}" data-username="${(u.user_name || '').replace(/"/g, '&quot;')}">Add</button>
                                `;
                                addContactSearchResults.appendChild(div);
                            });
                            addContactSearchResults.querySelectorAll(".add-contact-from-search").forEach(btn => {
                                btn.addEventListener("click", function () {
                                    const uid = this.getAttribute("data-uid");
                                    const name = this.getAttribute("data-name") || "";
                                    const username = this.getAttribute("data-username") || "";
                                    if (!uid) return;
                                    addContactFromSearch(uid, name, username);
                                });
                            });
                        }
                        addContactSearchResults.style.display = "block";
                    })
                    .catch(() => {
                        addContactSearchResults.innerHTML = '<p class="text-danger small mb-0 p-2">Search failed.</p>';
                        addContactSearchResults.style.display = "block";
                    });
            }, 300);
        });
    }

    function addContactFromSearch(firebaseUid, displayName, username) {
        const loggedInUserId = auth.currentUser?.uid;
        if (!loggedInUserId || !firebaseUid) return;
        const nameParts = (displayName || username || "User").trim().split(/\s+/);
        const firstName = nameParts[0] || "Contact";
        const lastName = nameParts.slice(1).join(" ") || "";
        const contactRef = ref(database, `data/contacts/${loggedInUserId}/${firebaseUid}`);
        get(contactRef).then(snap => {
            if (snap.exists()) {
                Swal.fire({ text: "Contact already in your list!", icon: "info", width: 400 });
                return;
            }
            get(ref(database, `data/users/${firebaseUid}`)).then(userSnap => {
                const userData = userSnap.exists() ? userSnap.val() : {};
                set(contactRef, {
                    contact_id: firebaseUid,
                    email: userData.email || "",
                    firstName: firstName,
                    lastName: lastName,
                    mobile_number: userData.mobile_number || "",
                }).then(() => {
                    Swal.fire({ text: "Contact added!", icon: "success", width: 400 }).then(() => {
                        addContactSearchInput.value = "";
                        addContactSearchResults.style.display = "none";
                        addContactSearchResults.innerHTML = "";
                        displayUsers();
                        bootstrap.Modal.getInstance(document.getElementById("add-contact"))?.hide();
                    });
                }).catch(err => Swal.fire({ text: err.message || "Failed to add", icon: "error", width: 400 }));
            });
        });
    }

    // Attach event listener when the DOM is loaded

    const form = document.getElementById("register-form");
    if (form) {
        form.addEventListener("submit", handleRegisterFormSubmit);
        const submitBtn = document.getElementById("submit-contact-button");
        if (submitBtn) submitBtn.addEventListener("click", handleRegisterFormSubmit);
    }



    //edit contact

    // Fetch user data from Firebase when edit modal is opened
    document.getElementById('edit-contact').addEventListener('show.bs.modal', function (event) {
        const userId = document.getElementById("edit-user-id").value;
        document.querySelector('#edit-contact .modal-body #edit-user-id').value = userId; // Set the user ID
        fetchUserDataForEdit(userId);
    });
    let otherUserId = "";
    let isUserContactBlocked = false;
    document.getElementById('block-contact-user').addEventListener('show.bs.modal', function (event) {
        const userId = document.getElementById("edit-user-id").value;
        const otherUserId = userId;
        isUserContactBlocked = localStorage.getItem("isUserContactBlocked") === "true";
        if (isUserContactBlocked) {
            document.getElementById("blockContactUserLabel").textContent = "Unblock";
        } else {
            document.getElementById("blockContactUserLabel").textContent = "Block";
        }
        document.querySelector('#block-contact-user .modal-body #edit-user-id').value = userId; // Set the user ID
        // blockUser(userId);
    });
    document.getElementById("blockContactUserDropdownBtn").addEventListener("click", function (event) {
        const userId = document.getElementById("edit-user-id").value;
        otherUserId = userId; // Replace with actual user ID logic
        const EditpopupElement = document.getElementById('contact-details');  // The contact details modal ID
        if (EditpopupElement) {
            const editpopup = bootstrap.Modal.getInstance(EditpopupElement);  // Get the existing modal instance
            if (editpopup) {
                editpopup.hide();  // Hide the contact details modal
            }
        }
        if (isUserContactBlocked) {
            document.getElementById("blockContactUserLabel").textContent = "Unblock";
            // Show the unblock modal only if the user is blocked
            const unblockModal = new bootstrap.Modal(document.getElementById("unblock-contact-user"));
            unblockModal.show();
        } else {
            document.getElementById("blockContactUserLabel").textContent = "Block";
            // Show the block modal only if the user is not blocked
            const blockModal = new bootstrap.Modal(document.getElementById("block-contact-user"));
            blockModal.show();
        }
    });
    // Fetch user data from Firebase for edit modal
    function fetchUserDataForEdit(userId) {
        const contactRef = ref(database, `data/contacts/${currentUserId}/${userId}`);
            // Fetch user data
            get(contactRef).then(snapshot => {
                const userData = snapshot.val();
                if (userData) {
                    // Update form fields
                    document.getElementById('edit-first-name').value = userData.firstName;
                    document.getElementById('edit-last-name').value = userData.lastName;
                    document.getElementById('edit-email').value = userData.email ?? '';
                    document.getElementById('edit-phone').value = userData.mobile_number ?? '';
                }
            }).catch(error => {

            });

      
    }

    // Add event listener to edit modal trigger button
    document.querySelectorAll('.chat-user-list').forEach(item => {
        item.addEventListener('click', function () {
            const userId = this.getAttribute('data-user-id');
            document.getElementById('edit-user-id').value = userId; // Set the user ID
            $('#edit-contact').modal('show'); // Open the edit modal
        });
    });

    // Function to handle edit form submission and update user data in Firebase
    function handleEditFormSubmit(event) {
        event.preventDefault(); // Prevent the form from reloading the page
        const loggedInUserId = currentUserId;
        const userId = document.getElementById('edit-user-id').value;
        const firstName = document.getElementById('edit-first-name').value;
        const lastName = document.getElementById('edit-last-name').value;
        const email_edit = document.getElementById('edit-email').value;
        const phone_edit = document.getElementById('edit-phone').value;

        // Update user data in Firebase
        const userRef = ref(database, `data/contacts/${loggedInUserId}/${userId}`);
        const emailQuery = query(usersRef, orderByChild('email'), equalTo(email_edit));
        get(emailQuery).then((snapshot) => {
            if (snapshot.exists()) {
                const mobileQuery = query(usersRef, orderByChild('mobile_number'), equalTo(phone_edit));
                get(mobileQuery).then((snapshot) => {
                   
                        update(userRef, {
                            firstName: firstName,
                            lastName: lastName,
                            email: email_edit,
                            mobile_number: phone_edit,
                        }).then(() => {
                            $('#edit-contact').modal('hide'); // Close the edit modal
                            Swal.fire({
                                title: "",
                                width: 400,
                                text: "User updated successfully!",
                                icon: "success"
                            }).then((result) => {
                                if (result.isConfirmed) {
                                    // Redirect to the desired page
                                    window.location.href = "/contact";
                                }
                            });

                        }).catch((error) => {
                            Swal.fire({
                                title: "",
                                width: 400,
                                text: error.message,
                                icon: "error",
                            });
                        });
                   
                });
            }
            else {
                Toastify({
                    text: "Sorry, There is no user available for this email!",
                    duration: 3000,
                    gravity: "top",
                    position: "right",
                    backgroundColor: "#f7bd4c",
                }).showToast();
            }
        });
    }

    // Attach event listener when the DOM is loaded

    const Editform = document.getElementById("edit-contact-form");
    Editform.addEventListener("submit", handleEditFormSubmit);



    // Function to fetch chat data and display the form
    function showChatForm(loggedInUserId, otherUserId) {
        if (!loggedInUserId || !otherUserId) {
            return;
        }

        const chatContainer = document.getElementById('chat-container');

        // Reference to the chat messages in Firebase
        const chatRef = firebase.database().ref(`data/chats/${loggedInUserId}_${otherUserId}`);

        // Clear the chat container before loading new messages
        chatContainer.innerHTML = '';

        // Fetch the chat messages
        chatRef.on('value', (snapshot) => {
            const messages = snapshot.val();
            if (messages) {
                for (const messageId in messages) {
                    const message = messages[messageId];
                    const messageElement = document.createElement('div');
                    messageElement.textContent = `${message.sender}: ${message.text}`;
                    chatContainer.appendChild(messageElement);
                }
            } else {
                chatContainer.innerHTML = 'No messages found.';
            }
        });
    }



    const contactSearchEl = document.getElementById("contactSearchInput");
    if (contactSearchEl) contactSearchEl.addEventListener("input", function () {
        const searchValue = this.value.toLowerCase(); // Get the search value in lowercase
        const sections = document.querySelectorAll("#chatContainer .mb-4"); // Select all sections (letter groups)
    
        let anyVisible = false; // Track if any user is visible
    
        sections.forEach(section => {
            const userDivs = section.querySelectorAll(".chat-user-list"); // Get all user elements in the section
            let sectionVisible = false; // Track if the current section has any visible users
    
            userDivs.forEach(userDiv => {
                const userNameElement = userDiv.querySelector(".chat-user-msg h6"); // Get the displayed name
                const displayedName = (userNameElement?.textContent || '').toLowerCase();
                const username = (userDiv.getAttribute('data-username') || '').toLowerCase();
    
                // Show or hide the user based on the search value (search by displayed name or username)
                if (displayedName.includes(searchValue) || (username && username.includes(searchValue))) {
                    userDiv.style.display = ""; // Show user
                    sectionVisible = true; // Mark the section as visible
                } else {
                    userDiv.style.display = "none"; // Hide user
                }
            });
    
            // Show or hide the section based on whether it contains visible users
            section.style.display = sectionVisible ? "" : "none";
            if (sectionVisible) anyVisible = true; // If any section is visible, mark anyVisible as true
        });
    
        // Show or hide the "no matches" message and "no-message"
        const noMatchesMessage = document.getElementById('noMatchesMessage');
        const noMessage = document.getElementById('no-message');
    
        if (searchValue.trim() === "") {
            // If the input field is empty, hide both messages
            if (noMatchesMessage) noMatchesMessage.style.display = "none";
            if (noMessage) noMessage.style.display = anyVisible ? "none" : "block";
        } else {
            // If the input field is not empty, manage visibility based on matches
            if (noMatchesMessage) noMatchesMessage.style.display = anyVisible ? "none" : "block";
            if (noMessage) noMessage.style.display = "none"; // Show noMessage if no matches
        }
    });     

    // Function to block the user in Firebase
    function blockUser(otherUserId) {
        const currentUser = auth.currentUser; // Get the current user

        if (!currentUser) {
            return;
        }

        const currentUserId = currentUser.uid; // Get the current user's UID
        // Reference to the 'blocked_users/user_id/blocked_user_id' node in Firebase
        const blockedUserRef = ref(database, `data/contacts/${currentUserId}/${otherUserId}`);

        // Create an object to store the blocked date (timestamp)
        const blockedUserData = {
            isBlocked: true, // Save the current timestamp
        };

        // Use update() to add the new blocked user without overwriting existing ones
        update(blockedUserRef, blockedUserData)
            .then(() => {
                Toastify({
                    text: "User blocked successfully!",
                    duration: 3000,
                    gravity: "top",
                    position: "right",
                    backgroundColor: "#28a745",
                }).showToast();
                document.getElementById("blockContactUserLabel").textContent = "Unblock";
                isUserContactBlocked = true;
                localStorage.setItem("isUserContactBlocked", "true");
                // Close the block modal explicitly
                const blockModal = bootstrap.Modal.getInstance(document.getElementById("block-contact-user"));
                if (blockModal) blockModal.hide();
                get(ref(database, `data/blocked_users/${currentUserId}`)).then(snapshot => {

                });
            })
            .catch(error => {

            });
    }
    function unblockUser(otherblockUserId) {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            return;
        }

        const currentUserId = currentUser.uid; // Get the current user's UID
        // Reference to the 'blocked_users/user_id/blocked_user_id' node in Firebase
        const blockedUserRef = ref(database, `data/contacts/${currentUserId}/${otherblockUserId}`);

        // Create an object to store the blocked date (timestamp)
        const blockedUserData = {
            isBlocked: false, // Save the current timestamp
        };

        // Use update() to add the new blocked user without overwriting existing ones
        update(blockedUserRef, blockedUserData)
            .then(() => {
                Toastify({
                    text: "User Unblocked successfully!",
                    duration: 3000,
                    gravity: "top",
                    position: "right",
                    backgroundColor: "#28a745",
                }).showToast();
                document.getElementById("blockContactUserLabel").textContent = "Block";
                isUserContactBlocked = true;
                localStorage.setItem("isUserContactBlocked", "true");
                // Close the block modal explicitly
                const unblockModal = bootstrap.Modal.getInstance(document.getElementById("unblock-contact-user"));
                if (unblockModal) unblockModal.hide();
                
            })
            .catch(error => {

            });
    }

    // Event listener for 'Block' button
    function removeBackdrop() {
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.parentNode.removeChild(backdrop);
        }
    }
    // Add an event listener to the 'Block' button in the modal

    document.getElementById("confirmBlockContactUserBtn").addEventListener("click", function (event) {
        event.preventDefault(); // Prevent default form submission
        const otherUserId = document.getElementById("edit-user-id").value;
        if (otherUserId) {
            blockUser(otherUserId); // Call the function to block the user
            // Close the block modal after blocking
            const blockModalInstance = bootstrap.Modal.getInstance(document.getElementById("block-contact-user"));
            if (blockModalInstance) {
                blockModalInstance.hide();
                removeBackdrop(); // Remove any lingering backdrop
            }
        }
    });
    document.getElementById("confirmUnblockContactBtn").addEventListener("click", function () {
        if (otherUserId) {
            unblockUser(otherUserId);
            const unblockModalInstance = bootstrap.Modal.getInstance(document.getElementById("unblock-contact-user"));
            if (unblockModalInstance) {
                unblockModalInstance.hide();
                removeBackdrop(); // Remove any lingering backdrop
            }
        }
    });



    // Reference to the delete button
    const deleteContactBtn = document.getElementById('deleteContactBtn');

    // Add event listener to the delete button
    deleteContactBtn.addEventListener('click', function (event) {
        event.preventDefault(); // Prevent form submission
        const contactId = document.getElementById("edit-user-id").value;

        // Reference to the specific contact document to be deleted
        const contactRef = ref(database, `data/contacts/${currentUserId}/${contactId}`);

        remove(contactRef)
            .then(() => {
                Toastify({
                    text: "Contact deleted successfully!",
                    duration: 3000,
                    gravity: "top",
                    position: "right",
                    backgroundColor: "#28a745",
                }).showToast();
               
                $('#delete-contact').modal('hide'); 
                window.location.href = "/contact";
            })
            .catch((error) => {

                // Handle error, show an alert or message to the user
            });
    });
});