import { initializeFirebase } from './firebase.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    signOut,
    signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import {
    getDatabase,
    ref,
    get,
    set,
    update,
    remove,
    onValue,
    onChildAdded,
    child,
    push,
    serverTimestamp,
} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";
import {
    getStorage,
    ref as storageRef,
    uploadBytesResumable,
    getDownloadURL,
} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-storage.js"; // Storage (file upload)

import {
    getFirestore,
    collection,
    setDoc,
    doc,
} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";

initializeFirebase(function (app, auth, database, storage) {

    let currentUser = null; // Define the current user here
    let selectedUserId = null; // Store the selected user ID
    let usersMap = {}; // Define usersMap here

    // Monitor the user's authentication state
    onAuthStateChanged(auth, (user) => {
        if (user) {
            const uid = user.uid;
            currentUser = user; // Set currentUser to the signed-in user
            fetchUsers();
            const userId = user.uid;
        } else {
            window.location.href = "/admin";
            document.getElementById("uid").innerText = "No user logged in";
        }
    });

    function formatDate(timestamp) {
        if (timestamp) {
            const date = new Date(timestamp);
            const options = {
                year: "numeric",
                month: "long",
                day: "numeric",
            };
            return date.toLocaleDateString(undefined, options); // Format and return the date
        } else {
            return "-"; // Fallback if no timestamp is provided
        }
    }
    // Clear error messages when the modal is closed (Cancel button clicked)
    document.querySelector('[data-bs-dismiss="modal"]').addEventListener('click', function () {
        clearUserErrors(); // Clear any error messages
    });

    // Function to clear error messages
    function clearUserErrors() {
        const errorMessages = document.querySelectorAll('.error-message');
        errorMessages.forEach((msg) => {
            msg.innerHTML = ''; // Clear the error message text
        });

        // Optionally, you can also remove any CSS classes indicating errors
        const errorFields = document.querySelectorAll('.error');
        errorFields.forEach((field) => {
            field.classList.remove('error'); // Remove error class
        });
    }
    function fetchUsers() {
        const usersTableBody = document.querySelector("tbody"); // Get tbody element
        const usersRef = ref(database, "data/users"); // Create a reference to the users node

        // Set up a real-time listener
        onValue(
            usersRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    const usersArray = []; // Array to hold user objects

                    // Collect user data
                    snapshot.forEach((childSnapshot) => {
                        const user = childSnapshot.val();
                        const userId = childSnapshot.key;

                        // Check if required fields are available
                        if (user.email && user.firstName && user.lastName &&
                            user.role !== "admin" && user.mobile_number) {
                            usersArray.push({ ...user, userId }); // Add user and ID to the array
                        }
                    });

                    // Sort users by combined full name in alphabetical order
                    usersArray.sort((a, b) => {
                        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
                        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
                        return nameA.localeCompare(nameB);
                    });

                    // Clear existing rows
                    usersTableBody.innerHTML = "";
                    let rowIndex = 1;
                    // Append sorted users to the table
                    usersArray.forEach((user) => {
                        const formattedRegDate = formatDate(user.timestamp);
                        const blockButtonClass = user.isBlocked ? "" : "";
                        const blockButtonText = user.isBlocked ? "Unblock" : "Block";
                        const fullName = `${user.firstName} ${user.lastName}`; // Combine first and last name

                        const row = document.createElement("tr");
                        row.setAttribute("data-user-id", user.userId); // Add userId to the row

                        row.innerHTML = `
                            <td>
                            ${rowIndex++}
                            </td>
                            <td>
                                <div class="d-flex align-items-center">
                                    <a href="#" class="avatar avatar-md">
                                        <img src="${user.image || defaultAvatar}" class="img-fluid rounded-circle" alt="img">
                                    </a>
                                    <div class="ms-2 profile-name">
                                        <p class="text-dark mb-0">${fullName || "-"}</p> <!-- Display full name -->
                                    </div>
                                </div>
                            </td>
                            <td>${user.email}</td>
                            <td>${user.mobile_number}</td>
                            <td>${formattedRegDate || "-"}</td>
                            <td>${user.country || "-"}</td>
                            <td>${user.lastSeen ? new Date(user.lastSeen).toLocaleTimeString() : "-"}</td>
                            <td>
                                <div class="d-flex align-items-center">
                                    <div class="dropdowns">
                                        <a href="#" class="btn btn-white btn-icon btn-sm d-flex align-items-center justify-content-center rounded-circle p-0" data-bs-toggle="dropdown" aria-expanded="false">
                                            <i class="ti ti-dots-vertical fs-14"></i>
                                        </a>
                                        <ul class="dropdown-menu dropdown-menu-right p-3">
                                            <li>
                                                <a class="dropdown-item rounded-1 edit-user-button" href="#" data-user-id="${user.userId}" data-bs-toggle="modal" data-bs-target="#edit_user"><i class="ti ti-edit me-2"></i>Edit</a>
                                            </li>
                                            <li>
                                                <a class="dropdown-item rounded-1 block-user-button ${blockButtonClass}" href="#" data-block-id="${user.userId}" data-block-status="${user.isBlocked}" data-bs-toggle="modal" data-bs-target="#block_user"><i class="ti ti-ban me-2"></i>${blockButtonText}</a>
                                            </li>
                                            <li>
                                                <a class="dropdown-item rounded-1 delete-user-btn" href="#" data-id="${user.userId}" data-bs-toggle="modal" data-bs-target="#delete-user">
                                                    <i class="ti ti-trash me-2"></i>Delete
                                                </a>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </td>
                        `;

                        usersTableBody.appendChild(row); // Append new row to tbody

                        // Attach event listener for the delete button
                        row.querySelector('.delete-user-btn').addEventListener('click', () => {
                            document.getElementById('confirmDeleteUserBtn').setAttribute('data-id', user.userId); // Pass userId to the modal button
                        });

                        row.querySelector('.block-user-button').addEventListener('click', (event) => {
                            const userId = event.target.dataset.blockId; // Fetch userId
                            const isBlocked = event.target.dataset.blockStatus === 'true'; // Check block status

                            // Show the block/unblock modal with the appropriate action
                            const modal = new bootstrap.Modal(document.getElementById('block_user')); // Initialize the modal
                            const blockButton = document.getElementById('confirmBlockUserBtn');
                            const modalTitle = document.getElementById('block-user-label'); // Title element
                            const modalDescription = document.querySelector('.description'); // Description element

                            // Dynamically update modal button text, title, and description
                            if (isBlocked) {
                                blockButton.textContent = 'Unblock';  // Change text to Unblock
                                modalTitle.textContent = 'Unblock User'; // Change title to Unblock
                                modalDescription.textContent = 'Unblocking this user will allow them to call you and send you messages again.'; // Update description for unblock
                            } else {
                                blockButton.textContent = 'Block';   // Change text to Block
                                modalTitle.textContent = 'Block User'; // Change title to Block
                                modalDescription.textContent = 'Blocked contacts will no longer be able to call you or send you messages.'; // Description for block
                            }

                            // Set up the modal button's action when confirming the block/unblock
                            blockButton.onclick = function () {
                                toggleBlockStatus(userId, isBlocked); // Call function to toggle block/unblock
                                modal.hide(); // Hide the modal after the action
                            };

                            // Show the modal
                            modal.show();
                        });

                    });

                    // Initialize or reinitialize DataTable after all rows are appended
                    if ($.fn.dataTable.isDataTable("#usersTable")) {
                        $("#usersTable").DataTable().destroy(); // Destroy the existing DataTable instance
                    }

                    // Reinitialize DataTable after table is populated
                    $("#usersTable").DataTable({
                        pageLength: 10, // Number of records per page
                        lengthMenu: [5, 10, 20, 50], // Define page length options
                        searching: true, // Enable search functionality
                        ordering: true, // Enable sorting functionality
                        columnDefs: [
                            { orderable: false, targets: 0 }, // Disable ordering on the checkbox column
                        ],
                        drawCallback: function () {
                            // Reinitialize the edit buttons after DataTable redraws the table
                            reinitializeEditButtons();
                        }
                    });

                    // Attach event listeners for edit buttons
                    document.querySelectorAll(".dropdown-item.edit-user-button").forEach((editButton) => {
                        editButton.addEventListener("click", (event) => {
                            const userId = event.target.dataset.userId; // Fetch user ID from data attribute
                            clearModalData(); // Clear any existing data in the modal
                            fetchUserData(userId); // Fetch and populate new user data
                        });
                    });

                } 
            },
            (error) => {
               
            }
        );
    }

    document.getElementById('confirmDeleteUserBtn').addEventListener('click', (e) => {
        e.preventDefault();
        const userId = e.target.getAttribute('data-id'); // Get the userId from the modal button

        if (userId) {
            deleteuser(userId); // Call delete function
        }
    });

    function deleteuser(userId) {
        const chatRef = ref(database, `data/users/${userId}`);

        remove(chatRef)
            .then(() => {
                showToast(`User deleted successfully!`);

                const chatRows = document.querySelectorAll('tbody tr');
                chatRows.forEach(row => {
                    if (row.querySelector('.delete-user-btn').getAttribute('data-id') === userId) {
                        row.remove();
                    }
                });

                // Close the modal
                const deleteUserModal = bootstrap.Modal.getInstance(document.getElementById('delete-user'));
                if (deleteUserModal) {
                    deleteUserModal.hide();
                }
                location.reload();
            })
            .catch((error) => {
              
            });
    }

    function toggleBlockStatus(userId, isBlocked) {
        const usersRef = ref(database, `data/users/${userId}`);

        // Toggle block status
        update(usersRef, {
            isBlocked: !isBlocked,
        })
            .then(() => {
                const message = isBlocked
                    ? "User has been unblocked successfully!"
                    : "User has been blocked successfully!";

                // Close the modal using Bootstrap's modal instance
                const blockUserModal = bootstrap.Modal.getInstance(document.getElementById('block_user'));
                if (blockUserModal) {
                    blockUserModal.hide();
                }

                // Show toast message
                showToastWithReload(message);
            })
            .catch((error) => {
              
            });
    }


    function showToastWithReload(message, delayBeforeReload = 5000) {
        Toastify({
            text: message,
            duration: 3000, // Duration in milliseconds
            gravity: "top", // `top` or `bottom`
            position: "right", // `left`, `center` or `right`
            style: {
                background: "#28a745", // Custom background color
            },
            stopOnFocus: true, // Prevents dismissing the toast on hover
            onClose: () => {
                // Reload the page only after the toast is closed
                setTimeout(() => {
                    location.reload();
                }, delayBeforeReload); // Use a small delay to ensure modal closure
            },
        }).showToast();
    }
    document.getElementById('block_user').addEventListener('hidden.bs.modal', function () {
        // Remove any remaining modal backdrops
        document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.remove());

        // Restore scrolling on the body
        document.body.style.overflow = '';
        document.body.style.position = '';
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
    function clearModalData() {
        // Replace '#edit_user_modal' with your modal's ID
        const modal = document.getElementById('edit_user');

        // Clear inputs (adjust selectors as per your modal structure)
        modal.querySelector('#editUserFirstName').value = '';
        modal.querySelector('#editUserEmail').value = '';
        modal.querySelector('#editUserMobile').value = '';
        modal.querySelector('#editCountry').value = '';
    }

    function fetchUserData(userId) {
        const userRef = ref(database, `data/users/${userId}`); 
        // Fetch user data
        get(userRef)
            .then((snapshot) => {
                if (snapshot.exists()) {
                    const user = snapshot.val();
                    const modal = document.getElementById('edit_user')
                    // Assuming your edit form has these input fields
                    document.getElementById("uid").value = user.uid || "";
                    document.getElementById("editUserFirstName").value =
                        user.firstName || "";
                    document.getElementById("editUserLastName").value =
                        user.lastName || "";
                    document.getElementById("editUserEmail").value =
                        user.email || "";
                    document.getElementById("editUserMobile").value =
                        user.mobile_number || "";
                    document.getElementById("editCountry").value =
                        user.country || "";
                } 
            })
            .catch((error) => {
                
            });
    }
    function reinitializeEditButtons() {
        document
            .querySelectorAll(".dropdown-item.edit-user-button")
            .forEach((editButton) => {
                editButton.addEventListener("click", (event) => {
                    const userId = event.currentTarget.dataset.userId; // Get user ID
                    fetchUserData(userId); // Fetch user data and populate modal
                });
            });
    }
    reinitializeEditButtons();
    function capitalizeFirstLetter(string) {
        if (!string) return ""; // Return empty string if input is empty
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    document
        .querySelectorAll(".dropdown-item.edit-user-button")
        .forEach((editButton) => {
            editButton.addEventListener("click", (event) => {
                // Remove active class from all buttons
                document
                    .querySelectorAll(".edit-user-button")
                    .forEach((btn) => btn.classList.remove("active"));

                // Set active class on the clicked button
                event.currentTarget.classList.add("active");

                const userId = event.currentTarget.dataset.userId; // Fetch user ID from data attribute
                fetchUserData(userId); // Fetch user data before showing the modal
            });
        });

    const form = document.getElementById("editUserForm");
    form.addEventListener("submit", (event) => {
        event.preventDefault(); // Prevent the form from submitting normally

        const userId = document.getElementById("uid").value;
        const firstName = document.getElementById("editUserFirstName").value.trim();
        const lastName = document.getElementById("editUserLastName").value.trim();
        const email = document.getElementById("editUserEmail").value.trim();
        const mobileNumber = document.getElementById("editUserMobile").value.trim();
        const country = document.getElementById("editCountry").value.trim();
        // Clear previous error messages
        clearErrors();

        let isValid = true;

        // Validate First Name
        if (!firstName) {
            showErrorMessage("editUserFirstName", "First name is required.");
            isValid = false;
        } else if (!validateAlphaCharacters(firstName)) {
            showErrorMessage("editUserFirstName", "First name should contain only alphabetic characters.");
            isValid = false;
        }

        // Validate Last Name
        if (!lastName) {
            showErrorMessage("editUserLastName", "Last name is required.");
            isValid = false;
        } else if (!validateAlphaCharacters(lastName)) {
            showErrorMessage("editUserLastName", "Last name should contain only alphabetic characters.");
            isValid = false;
        }

        // Validate Email
        if (!email) {
            showErrorMessage("editUserEmail", "Email is required.");
            isValid = false;
        } else if (!validateEmail(email)) {
            showErrorMessage("editUserEmail", "Please enter a valid email address.");
            isValid = false;
        }

        // Validate Mobile Number
        if (!mobileNumber) {
            showErrorMessage("editUserMobile", "Mobile number is required.");
            isValid = false;
        } else if (!validatePhoneNumber(mobileNumber)) {
            showErrorMessage("editUserMobile", "Please enter a valid phone number (10 digits).");
            isValid = false;
        }

        // Validate Country
        if (!country) {
            showErrorMessage("editCountry", "Country is required.");
            isValid = false;
        } else if (!validateAlphaCharacters(country)) {
            showErrorMessage("editCountry", "Country should contain only alphabetic characters.");
            isValid = false;
        }

        // If validation failed, stop here
        if (!isValid) {
            return;
        }

        // Check for duplicate email and phone number

        // Create a reference to the specific user
        const userRef = ref(database, `data/users/${userId}`);

        // Update user data
        update(userRef, {
            uid: userId,
            firstName: capitalizeFirstLetter(firstName),
            lastName: capitalizeFirstLetter(lastName),
            email: email,
            mobile_number: mobileNumber,
            country: country,
        })
            .then(() => {
                showToast(`User updated successfully!`);
                location.reload();

                return get(userRef);
            })
            .then((snapshot) => {
                if (snapshot.exists()) {
                    const updatedUser = snapshot.val();
                    const usersTableBody = document.querySelector("tbody");
                    const rowToUpdate = usersTableBody.querySelector(
                        `tr[data-user-id='${userId}']`
                    );

                    if (rowToUpdate) {
                        const formattedRegDate = formatDate(updatedUser.timestamp);

                        rowToUpdate.innerHTML = `
                                        <td><div class="form-check form-check-md"><input class="form-check-input" type="checkbox"></div></td>
                                        <td><div class="d-flex align-items-center"><div class="ms-2 profile-name"><p class="text-dark mb-0"><a href="#">${updatedUser.firstName || "-"}</a></p></div></div></td>
                                        <td>${updatedUser.email || "-"}</td>
                                        <td>${updatedUser.mobile_number || "-"}</td>
                                        <td>${formattedRegDate || "-"}</td>
                                        <td>${updatedUser.country || "-"}</td>
                                        <td>${updatedUser.lastSeen ? new Date(updatedUser.lastSeen).toLocaleTimeString() : "-"}</td>
                                        <td>
                                            <div class="d-flex align-items-center">
                                                <div class="dropdown">
                                                    <a href="#" class="btn btn-white btn-icon btn-sm d-flex align-items-center justify-content-center rounded-circle p-0" data-bs-toggle="dropdown" aria-expanded="false">
                                                        <i class="ti ti-dots-vertical fs-14"></i>
                                                    </a>
                                                    <ul class="dropdown-menu dropdown-menu-right p-3">
                                                        <li><a class="dropdown-item rounded-1 edit-user-button" href="#" data-user-id="${user.userId}" data-bs-toggle="modal" data-bs-target="#edit_user"><i class="ti ti-edit me-2"></i>Edit</a></li>
                                                        <li><a class="dropdown-item rounded-1 block-user-button ${blockButtonClass}" href="#" data-block-id="${user.userId}" data-block-status="${user.isBlocked}" data-bs-toggle="modal" data-bs-target="#block_user"><i class="ti ti-ban me-2"></i>${blockButtonText}</a></li>
                                                        <li><a class="dropdown-item rounded-1 delete-user-btn" href="#" data-id="${user.userId}" data-bs-toggle="modal" data-bs-target="#delete-user"><i class="ti ti-trash me-2"></i>Delete</a></li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </td>
                                    `;
                    }
                } 
                fetchUserData(userId);
                $("#edit_user").modal("hide"); // Hide the modal after successful update
                fetchUsers(); // Refresh the user list
            })
            .catch((error) => {
               
            });

    });

    // Helper functions
    function validateAlphaCharacters(input) {
        const alphaRegex = /^[A-Za-z\s]+$/;
        return alphaRegex.test(input);
    }

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    }

    function validatePhoneNumber(phoneNumber) {
        const re = /^\d{10}$/;
        return re.test(phoneNumber);
    }

    // Check for duplicates in email and phone number
    function checkForDuplicates(email, mobileNumber, userId) {
        return new Promise((resolve, reject) => {
            const usersRef = ref(database, "data/users");
            get(usersRef)
                .then((snapshot) => {
                    let isDuplicate = false;
                    snapshot.forEach((childSnapshot) => {
                        const userData = childSnapshot.val();
                        if ((userData.email === email || userData.mobile_number === mobileNumber) && userData.uid !== userId) {
                            showErrorMessage("editUserEmail", "This email or phone number is already registered.");
                            isDuplicate = true;
                        }
                    });
                    resolve(isDuplicate);
                })
                .catch(reject);
        });
    }

    // Show error message below the input field
    function showErrorMessage(inputId, message) {
        const inputField = document.getElementById(inputId);
        const errorDiv = document.createElement("div");
        errorDiv.className = "error-message text-danger";
        errorDiv.innerText = message;
        inputField.parentNode.appendChild(errorDiv);
    }

    // Clear previous error messages
    function clearErrors() {
        const errorMessages = document.querySelectorAll(".error-message");
        errorMessages.forEach((error) => {
            error.remove();
        });
    }



    // Function to clear all error messages
    function clearErrors() {
        const errorElements = document.querySelectorAll(".error-message");
        errorElements.forEach((element) => element.textContent = "");
    }

    document.getElementById('adduserbtn').addEventListener('click', function (event) {
        event.preventDefault(); // Prevent form submission

        // Disable the submit button and change the text to "Processing..."
        const submitButton = document.getElementById('adduserbtn');
        submitButton.disabled = true;
        submitButton.innerHTML = 'Processing...'; // Change button text to "Processing..."

        // Clear previous error messages
        clearErrors();

        // Get input values
        const firstName = document.getElementById("first_name").value.trim();
        const lastName = document.getElementById("last_name").value.trim();
        const email = document.getElementById("email").value.trim();
        const mobile_number = document.getElementById("mobile_number").value.trim();
        const country = document.getElementById("country").value.trim();

        let isValid = true;

        // Check for empty fields
        if (!firstName) {
            showErrorMessage("first_name", "First name is required.");
            isValid = false;
        } else if (!validateAlphaCharacters(firstName)) {
            showErrorMessage("first_name", "First name should contain only alphabetic characters.");
            isValid = false;
        }

        if (!lastName) {
            showErrorMessage("last_name", "Last name is required.");
            isValid = false;
        } else if (!validateAlphaCharacters(lastName)) {
            showErrorMessage("last_name", "Last name should contain only alphabetic characters.");
            isValid = false;
        }

        if (!email) {
            showErrorMessage("email", "Email is required.");
            isValid = false;
        } else if (!validateEmail(email)) {
            showErrorMessage("email", "Please enter a valid email address.");
            isValid = false;
        }

        if (!mobile_number) {
            showErrorMessage("mobile_number", "Phone number is required.");
            isValid = false;
        } else if (!validatePhoneNumber(mobile_number)) {
            showErrorMessage("mobile_number", "Please enter a valid phone number (min 10 digits).");
            isValid = false;
        }

        if (!country) {
            showErrorMessage("country", "Country is required.");
            isValid = false;
        } else if (!validateAlphaCharacters(country)) {
            showErrorMessage("country", "Country should contain only alphabetic characters.");
            isValid = false;
        }

        if (!isValid) {
            submitButton.disabled = false; // Enable the button again if validation fails
            submitButton.innerHTML = 'Submit'; // Restore the button text
            return; // If there are validation errors, stop here
        }

        // Check for existing email or phone number in Firebase before proceeding
        checkForDuplicates(email, mobile_number).then(isDuplicate => {
            if (isDuplicate) {
                submitButton.disabled = false; // Re-enable button if there's a duplicate
                submitButton.innerHTML = 'Submit';
                return; // Stop further processing if there is a duplicate
            }

            const temporaryPassword = generateTemporaryPassword(); // Generate a random temporary password
            const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

            // Create the user in Firebase
            auth.currentUser.getIdToken(true)
                .then((idToken) => {
                    return fetch('/create-admin-user', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${idToken}`,
                            'X-CSRF-TOKEN': csrfToken
                        },
                        body: JSON.stringify({
                            email,
                            password: temporaryPassword,
                            firstName,
                            lastName,
                            mobile_number,
                            country
                        })
                    });
                })
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        // Save user in Firebase Realtime Database
                        const usersRef = ref(database, 'data/users/' + data.uid);

                        const user = {
                            firstName: capitalizeFirstLetter(firstName),
                            lastName: capitalizeFirstLetter(lastName),
                            email: email,
                            mobile_number: mobile_number,
                            country: country,
                            uid: data.uid,
                            timestamp: serverTimestamp()
                        };

                        set(usersRef, user)
                            .then(() => {
                                showToast('User created successfully and email sent!');
                                document.getElementById("add_user_admin").reset(); // Clear form
                                const modal = bootstrap.Modal.getInstance(document.getElementById("add_user"));
                                modal.hide(); // Close the modal
                                window.location.reload();
                            })
                            .catch((error) => {
                               
                            });
                    } 
                })
                .catch((error) => {
                   
                })
                .finally(() => {
                    // Re-enable the button and restore its text after the operation completes
                    submitButton.disabled = false;
                    submitButton.innerHTML = 'Submit';
                });
        });
    });

    // Function to check for duplicate email or mobile number in Firebase
    function checkForDuplicates(email, phoneNumber) {
        return new Promise((resolve, reject) => {
            const usersRef = ref(database, "data/users");

            // Fetch existing users
            get(usersRef)
                .then((snapshot) => {
                    let isDuplicate = false;

                    // Check each user for duplicate email or phone number
                    snapshot.forEach((childSnapshot) => {
                        const userData = childSnapshot.val();
                        if (userData.email === email) {
                            showErrorMessage("email", "This email is already registered.");
                            isDuplicate = true; // Email already exists
                        }
                        if (userData.mobile_number === phoneNumber) {
                            showErrorMessage("mobile_number", "This phone number is already registered.");
                            isDuplicate = true; // Phone number already exists
                        }
                    });

                    resolve(isDuplicate); // Resolve promise with duplicate status
                })
                .catch(reject); // Reject promise on error
        });
    }


    // Helper function to generate a random temporary password
    function generateTemporaryPassword() {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$!";
        let password = "";
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }

    // Helper function to validate alphabetic characters
    function validateAlphaCharacters(input) {
        const alphaRegex = /^[A-Za-z\s]+$/; // Allows only letters and spaces
        return alphaRegex.test(input);
    }



    // Email validation function
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    }

    // Phone number validation function (10 digits only)
    function validatePhoneNumber(phoneNumber) {
        const re = /^\d{10}$/; // Validates a 10-digit phone number
        return re.test(phoneNumber);
    }

    // Show error message below the input field
    function showErrorMessage(inputId, message) {
        const inputField = document.getElementById(inputId);
        const errorDiv = document.createElement("div");
        errorDiv.className = "error-message text-danger"; // Add a class for styling
        errorDiv.innerText = message;

        // Insert the error message after the input field
        inputField.parentNode.appendChild(errorDiv);
    }

    // Clear previous error messages
    function clearErrors() {
        const errorMessages = document.querySelectorAll(".error-message");
        errorMessages.forEach((error) => {
            error.remove(); // Remove all existing error messages
        });
    }

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

    // Fetch all users for export (without modifying the table display or pagination)
    function fetchAllUsersForExport() {
        const usersRef = ref(database, "data/users");
        const allUsers = [];

        // Fetch all users from Firebase
        onValue(
            usersRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    snapshot.forEach((childSnapshot) => {
                        const user = childSnapshot.val();
                        const userId = childSnapshot.key;

                        // Only add users with necessary fields
                        if (user.email && user.firstName && user.role !== "admin" && user.mobile_number) {
                            allUsers.push({
                                full_name: `${user.firstName} ${user.lastName || ''}`.trim(), // Combine first and last name
                                email: user.email,
                                mobile_number: user.mobile_number,
                                country: user.country,
                                timestamp: user.timestamp,
                                lastSeen: user.lastSeen,
                                image: user.image || defaultAvatar,
                                userId: userId
                            });
                        }
                    });

                    // Sort users by full_name in ascending order
                    allUsers.sort((a, b) => a.full_name.localeCompare(b.full_name));

                    // Once sorted, trigger PDF generation
                    generatePdf(allUsers);
                }
            },
            (error) => {
               
            }
        );
    }

    // Function to generate PDF with the sorted list of users
    function generatePdf(allUsers) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Add title to the PDF
        doc.text("User List", 14, 16);

        // Prepare the data for the table (mapping users to the table columns)
        const userData = allUsers.map(user => [
            user.full_name || '-', // Use full_name
            user.email,
            user.mobile_number,
            formatDate(user.timestamp) || '-',
            user.country || '-',
            user.lastSeen ? new Date(user.lastSeen).toLocaleTimeString() : '-'
        ]);

        // Generate table in PDF using jsPDF's autoTable plugin
        doc.autoTable({
            head: [['Full Name', 'Email', 'Mobile Number', 'Registration Date', 'Country', 'Last Seen']],
            body: userData,
            startY: 20,  // Starting position for the table
            theme: 'grid',
            headStyles: {
                fillColor: [22, 160, 133] // Customize header color
            },
        });

        // Save the PDF
        doc.save('user-list.pdf');
    }

    // Event listener for the Export PDF button
    document.querySelector('#exportPdfBtn').addEventListener('click', function () {
        fetchAllUsersForExport();  // Fetch all users and export to PDF
    });

});   
