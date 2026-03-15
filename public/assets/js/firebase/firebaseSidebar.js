import { initializeFirebase } from './firebase-user.js';
import {
    initializeApp
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import {
    getAuth,
    onAuthStateChanged,
    signOut,
    signInWithEmailAndPassword,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    updateEmail,
    sendEmailVerification
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
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js';

initializeFirebase(function (app, auth, database, storage) {

    let currentUser = null; // Define the current user here
    let selectedUserId = null; // Store the selected user ID
    let usersMap = {}; // Define usersMap here
    let currentUserId = null;
    // Populate sidebar profile pane from Firebase RTDB (so it doesn't stay "Loading...")
    function applyProfileFromFirebase(user) {
        const u = user && typeof user === 'object' ? user : {};
        const defaultImg = 'assets/img/profiles/avatar-03.jpg';
        const setText = (id, text) => { const el = document.getElementById(id); if (el) el.innerText = (text != null && text !== '') ? text : '—'; };
        const imageUrl = u.image || u.profile_image || u.photoURL || u.profileImage || defaultImg;
        const setImg = (id, src) => { const el = document.getElementById(id); if (el && el.tagName === 'IMG') el.src = src || imageUrl || defaultImg; };
        const fullName = (u.firstName || '') + ' ' + (u.lastName || '').trim() || u.username || 'No Name';
        setText('profile-name', fullName);
        setText('profile-info-name', fullName);
        setText('profile-info-chat-name', fullName);
        setText('profile-info-email', u.email || '—');
        setText('profile-info-phone', u.mobile_number || '—');
        setText('profile-info-country', u.country || '—');
        setText('profile-info-about', u.about || '—');
        setText('profile-info-bio', u.about || '—');
        setText('profile-info-gender', u.gender || '—');
        const roleEl = document.getElementById('profile-info-role');
        if (roleEl) {
            let roleLabel = (u.primary_role_label != null && u.primary_role_label !== '') ? u.primary_role_label : '';
            if (!roleLabel && u.primary_role && typeof PRIMARY_ROLES !== 'undefined') {
                roleLabel = PRIMARY_ROLES[u.primary_role] || u.primary_role;
                if (u.primary_role === 'other' && u.other_role_text) roleLabel += ' (' + u.other_role_text + ')';
            }
            roleEl.innerText = roleLabel || '—';
        }
        setText('profile-info-youtube', u.youtube_link || '—');
        setText('profile-info-linkedin', u.linkedin_link || '—');
        setText('profile-info-twitter', u.twitter_link || '—');
        setText('profile-info-website', u.website_url || u.website_link || '—');
        setText('profile-info-facebook', u.facebook_link || '—');
        setText('profile-info-instagram', u.instagram_link || '—');
        setText('profile-info-kick', u.kick_link || '—');
        setText('profile-info-twitch', u.twitch_link || '—');
        const joinEl = document.getElementById('profile-info-join-date');
        if (joinEl) {
            if (u.timestamp || u.created_at) {
                const d = new Date(u.timestamp || u.created_at);
                joinEl.innerText = d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
            } else joinEl.innerText = '—';
        }
        setImg('profileImage', imageUrl);
        setImg('profileImageProfile', imageUrl);
        setImg('profileImageChat', imageUrl);
        setImg('ProfileImageSidebar', imageUrl);
    }

    // Build profile object from window.LARAVEL_USER for applyProfileFromFirebase (Laravel-only or fallback)
    function getLaravelProfileData() {
        const u = typeof window !== 'undefined' && window.LARAVEL_USER;
        if (!u || typeof u !== 'object') return null;
        return {
            firstName: u.firstName,
            lastName: u.lastName,
            email: u.email,
            mobile_number: u.mobile_number,
            gender: u.gender,
            primary_role: u.primary_role,
            primary_role_label: u.primary_role_label,
            other_role_text: u.other_role_text,
            created_at: u.created_at,
            timestamp: u.created_at ? new Date(u.created_at).getTime() : null,
            image: u.profile_image || u.image,
            profile_image: u.profile_image || u.image,
            about: u.about,
            country: u.country,
            facebook_link: u.facebook_link || u.facebook,
            twitter_link: u.twitter_link || u.twitter,
            linkedin_link: u.linkedin_link || u.linkedin,
            website_url: u.website_url,
            website_link: u.website_url,
            youtube_link: u.youtube_link || u.youtube,
            instagram_link: u.instagram_link || u.instagram,
            kick_link: u.kick_link || u.kick,
            twitch_link: u.twitch_link || u.twitch
        };
    }

    function applyProfileFromLaravel() {
        const data = getLaravelProfileData();
        if (data) applyProfileFromFirebase(data);
    }

    // Monitor the user's authentication state
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user; // Set currentUser to the signed-in user
            currentUserId = user.uid;
            const userEl = document.getElementById('user-id');
            if (userEl) userEl.innerText = `Logged in as: ${currentUser.uid}`;
            applySavedBackground(currentUser.uid);
            // Fetch profile from Firebase RTDB and populate sidebar profile pane
            get(ref(database, 'data/users/' + user.uid))
                .then((snapshot) => {
                    const rtdb = snapshot.exists() ? snapshot.val() : {};
                    const laravelData = getLaravelProfileData();
                    // Prefer RTDB when it has meaningful profile fields; otherwise use Laravel so profile doesn't disappear
                    const hasRtdbProfile = rtdb && (
                        (rtdb.firstName != null && rtdb.firstName !== '') ||
                        (rtdb.lastName != null && rtdb.lastName !== '') ||
                        (rtdb.email != null && rtdb.email !== '')
                    );
                    if (hasRtdbProfile) {
                        applyProfileFromFirebase(rtdb);
                    } else if (laravelData) {
                        // RTDB empty or only non-profile keys (e.g. wallpaper): keep Laravel profile visible
                        const merged = Object.assign({}, laravelData, rtdb);
                        applyProfileFromFirebase(merged);
                    } else {
                        applyProfileFromFirebase(rtdb);
                    }
                })
                .catch(() => {
                    const laravelData = getLaravelProfileData();
                    applyProfileFromFirebase(laravelData || {});
                });
        } else {
            const userEl = document.getElementById('user-id');
            if (userEl) userEl.innerText = 'No user logged in';
            if (getLaravelProfileData()) applyProfileFromLaravel();
        }
    });

    const defaultAvatar = "{{ asset('assets/img/profiles/avatar-03.jpg') }}";
    // Background Image
    let selectedBackground = null;

    // Background Image
    function selectBackground(imageUrl, imgElement) {
        selectedBackground = imageUrl; // Set the selected background URL
        // Highlight the selected image
        const allImages = document.querySelectorAll('.img-wrap');
        allImages.forEach((imgWrap) => {
            imgWrap.classList.remove('selected-background'); // Remove class from all images
            imgWrap.classList.remove('selected');
        });
        imgElement.classList.add('selected-background'); // Add class to the clicked image
        imgElement.classList.add('selected');

        const chatArea = document.getElementById('chat-area');
        if (chatArea) {
            chatArea.style.backgroundImage = `url(${selectedBackground})`;
        }

        const groupArea = document.getElementById('group-area');
        if (groupArea) {
            groupArea.style.backgroundImage = `url(${selectedBackground})`;
        }
    }

    // Background Image
    function saveBackground() {
        if (currentUser) { // Check if the user is logged in
            if (selectedBackground) {
                // Save to Firebase under the user ID
                const backgroundRef = ref(database, `data/users/${currentUser.uid}/wallpaper`); // Path to user-specific background
                set(backgroundRef, selectedBackground)
                    .then(() => {
                        Toastify({
                            text: "Background Image updated successfully!",
                            duration: 3000,
                            gravity: "top",
                            position: "right",
                            backgroundColor: "#28a745",
                        }).showToast();
                        // Save to local storage for access on chat page
                        localStorage.setItem('chat-background', selectedBackground);
                    })
                    .catch((error) => {

                    });
            } else {
                alert('Please select a background image.');
            }
        } else {
            alert('You must be logged in to save a background image.');
        }
    }

    // Background Image
    function applySavedBackground(userId) {
        const backgroundRef = ref(database, `data/users/${userId}/wallpaper`); // Path to user-specific background
        get(backgroundRef).then((snapshot) => {
            if (snapshot.exists()) {
                const retrievedBackground = snapshot.val();
                const chatArea = document.getElementById('chat-area');
                if (chatArea) {
                    chatArea.style.backgroundImage = `url(${retrievedBackground})`;
                    selectedBackground = retrievedBackground; // Store the selectedBackground for the session
                }

                const groupArea = document.getElementById('group-area');
                if (groupArea) {
                    groupArea.style.backgroundImage = `url(${retrievedBackground})`;
                    selectedBackground = retrievedBackground; // Store the selectedBackground for the session
                }
            }
        }).catch((error) => {

        });
    }

    // Background Image (removed from UI - keep handlers for backwards compatibility)
    const imageGallery = document.getElementById('image-gallery');
    if (imageGallery) {
        imageGallery.addEventListener('click', function (event) {
            const target = event.target.closest('.img-wrap');
            if (target) {
                const imageUrl = target.getAttribute('data-image');
                selectBackground(imageUrl, target);
            }
        });
    }
    const imageSaveBtn = document.getElementById('image-save-button');
    if (imageSaveBtn) imageSaveBtn.addEventListener('click', saveBackground);

    // Background Image

    if (currentUser) {
        applySavedBackground(currentUser.uid); // Apply saved background for the logged-in user
    }


    // Function to remove the background image

    function removeBackground() {
        selectedBackground = null; // Reset the selected background
        const allImages = document.querySelectorAll('.img-wrap');
        allImages.forEach((imgWrap) => {
            imgWrap.classList.remove('selected-background'); // Remove class from all images
            imgWrap.classList.remove('selected');
        });

        // Remove from local storage
        localStorage.removeItem('chat-background');

        // Check Firebase for existing background
        if (currentUser) {
            const backgroundRef = ref(database, `data/users/${currentUser.uid}/wallpaper`);
            get(backgroundRef)
                .then((snapshot) => {
                    if (snapshot.exists()) {
                        // Background exists, so remove it
                        remove(backgroundRef)
                            .then(() => {
                                Toastify({
                                    text: "Background Image removed successfully!",
                                    duration: 3000,
                                    gravity: "top",
                                    position: "right",
                                    backgroundColor: "#28a745",
                                }).showToast();
                            })
                            .catch((error) => {

                            });
                    } else {
                        // Background does not exist
                        Toastify({
                            text: "No background image is saved.",
                            duration: 3000,
                            gravity: "top",
                            position: "right",
                            backgroundColor: "#dc3545",
                        }).showToast();
                    }
                })
                .catch((error) => {

                });
        }
    }


    const removeBgBtn = document.getElementById('remove-background-button');
    if (removeBgBtn) removeBgBtn.addEventListener('click', removeBackground);

    // Load language file
    function loadLanguage(language) {
        fetch(`/languages/${language}.json`) // Adjusted to use the correct path
            .then(response => response.json())
            .then(data => {
                updateTextContent(data);
            })
            .catch(error => console.error('Error loading language file:', error));
    }
    // Function to fetch language list from Firebase

    function fetchLanguageList() {
        const languageSelect = document.getElementById("ulanguage");

        if (languageSelect) {
            // Clear existing options
            languageSelect.innerHTML = `<option value="" disabled selected>Select Language</option>`;

            // Fetch languages from Firebase
            get(ref(database, "data/languages"))
                .then((snapshot) => {
                    if (snapshot.exists()) {
                        const languages = snapshot.val();
                        Object.keys(languages).forEach((key) => {
                            const language = languages[key];
                            if (language.status === "Active") {
                                const option = document.createElement("option");
                                option.value = key; // Use the language name (e.g., "Arabic") as the value
                                option.textContent = key; // Display the language name
                                languageSelect.appendChild(option);
                            }
                        });
                    }
                })
                .catch((error) => {
                    console.error("Error fetching languages: ", error);
                });
        }
    }

    function saveLanguage() {
        var selectedLanguage = $("#ulanguage").val();

        if (!selectedLanguage) {
            $("#ulanguage").val("English");
            return;
        }

        const languageRef = ref(database, "data/languages/" + selectedLanguage);

        get(languageRef)
            .then((snapshot) => {
                if (snapshot.exists()) {
                    const languageData = snapshot.val();

                    if (languageData.status === "Inactive") {
                        toastr.error("Selected Language is Inactive");
                        return;
                    }

                    // Dynamically fetch the keywords associated with the selected language
                    const languageKeywordsRef = ref(database, "data/languageKeywords/" + selectedLanguage);

                    get(languageKeywordsRef)
                        .then((keywordSnapshot) => {
                            if (keywordSnapshot.exists()) {
                                const languageKeywords = keywordSnapshot.val();

                                // Get CSRF token from meta tag
                                var csrfToken = $('meta[name="csrf-token"]').attr('content');

                                // Send both languageData and languageKeywords together
                                $.ajax({
                                    url: "/set-new-json-language",  // The URL for your POST request
                                    type: "POST",
                                    data: {
                                        username: currentUserId,
                                        language: selectedLanguage, // The language name (e.g., "Arabic")
                                        languagedata: languageData,  // This includes the language details
                                        keywords: languageKeywords,  // The keywords retrieved from Firebase
                                        session: "yes",
                                    },
                                    headers: {
                                        'X-CSRF-TOKEN': csrfToken,  // Add the CSRF token to the request header
                                    },
                                    success: function () {
                                    },
                                    error: function (xhr, status, error) {
                                    }
                                });
                            } else {
                            }
                        })
                        .catch((error) => {
                        });
                } else {
                    $("#ulanguage").val("English");
                    setTimeout(function () {
                        window.location.reload();
                    }, 2000);
                }
            })
            .catch((error) => {
            });
    }


    // Load language from Firebase on page load

    fetchLanguageList(); // Populate language list



    // Event listener for saving language
    const saveLanguageBtn = document.getElementById('saveLanguageBtn');
    if (saveLanguageBtn) {
        saveLanguageBtn.addEventListener('click', saveLanguage);
    }

    // Event listener for the delete chat switch (HTML id is deleteAllChatSwitch)
    const deleteChatSwitch = document.getElementById("deleteAllChatSwitch");
    if (deleteChatSwitch) {
        deleteChatSwitch.addEventListener("change", async function (e) {
            localStorage.setItem("deleteChatSwitchState", e.target.checked);
            if (e.target.checked) {
                // Automatically delete all chats for the current user
                const deleteChatModal = new bootstrap.Modal(document.getElementById("delete-chat"));
                deleteChatModal.show();
            }
        });
    }

    // Handle delete confirmation from modal
    const deleteChatForm = document.getElementById("deleteChatForm");
    if (deleteChatForm) {
        deleteChatForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            // Proceed with chat deletion
            await deleteAllChats(currentUserId);

            // Close the modal
            const deleteChatModal = bootstrap.Modal.getInstance(document.getElementById("delete-chat"));
            deleteChatModal.hide();

            // Optionally uncheck the switch to allow reopening the modal
            document.getElementById("deleteAllChatSwitch").checked = false;
        });
    }
    // Event listener for the Cancel button to uncheck the switch
    const cancelDeleteChatBtn = document.getElementById("cancelDeleteChatBtn");
    if (cancelDeleteChatBtn) cancelDeleteChatBtn.addEventListener("click", function () {
        const sw = document.getElementById("deleteAllChatSwitch");
        if (sw) { sw.checked = false; localStorage.setItem("deleteChatSwitchState", false); }
    });
    const cancelDeleteChatButton = document.getElementById("cancelDeleteChatButton");
    if (cancelDeleteChatButton) cancelDeleteChatButton.addEventListener("click", function () {
        const sw = document.getElementById("deleteAllChatSwitch");
        if (sw) { sw.checked = false; localStorage.setItem("deleteChatSwitchState", false); }
    });
    async function deleteAllChats(userId) {
        const userChatsRef = ref(database, 'data/chats'); // Reference to the chats
        const toastDuration = 3000; // Duration of the toast in milliseconds

        try {
            const snapshot = await get(userChatsRef);
            const allChats = snapshot.val();

            // Check if there are any chats
            if (!allChats) {

                // Show message if no chats exist
                Toastify({
                    text: "No chats found to delete.",
                    duration: toastDuration,
                    gravity: "top",
                    position: "right",
                    backgroundColor: "#ff9800", // Orange color for info
                    stopOnFocus: true,
                }).showToast();

                // Wait for the toast to finish before disabling the switch
                setTimeout(() => {
                    deleteChatSwitch.checked = false;
                    localStorage.setItem("deleteChatSwitchState", false);
                }, toastDuration);

                return;
            }

            // Create an array to hold promises for deletion
            const deletePromises = [];

            // Loop through each chat and check if the to-from ID contains the userId
            for (const chatId in allChats) {

                // Check if the chat ID contains the current user's userId
                if (chatId.includes(userId)) {
                    deletePromises.push(remove(ref(database, `data/chats/${chatId}`)));
                }
            }

            // Wait for all delete operations to complete
            await Promise.all(deletePromises);

            // Show success message using Toastify
            Toastify({
                text: "All chats have been successfully deleted.",
                duration: toastDuration,
                gravity: "top",
                position: "right",
                backgroundColor: "#4caf50", // Green color for success
                stopOnFocus: true,
            }).showToast();

            // Wait for the toast to finish before disabling the switch
            setTimeout(() => {
                deleteChatSwitch.checked = false;
                localStorage.setItem("deleteChatSwitchState", false);
            }, toastDuration);

            // Optional: Refresh the chat list or update the UI here
            refreshChatList(); // Implement this function to update the UI if needed
        } catch (error) {

            // Show error message using Toastify
            Toastify({
                text: "An error occurred while trying to delete chats. Please try again.",
                duration: toastDuration,
                gravity: "top",
                position: "right",
                backgroundColor: "#ff3d00", // Red color for error
                stopOnFocus: true,
            }).showToast();

            // Wait for the toast to finish before disabling the switch
            setTimeout(() => {
                deleteChatSwitch.checked = false;
                localStorage.setItem("deleteChatSwitchState", false);
            }, toastDuration);
        }
    }


    // Optional: Function to refresh the chat list UI
    function refreshChatList() {
        const chatBox = document.getElementById("chat-box");
        if (chatBox) {
            chatBox.innerHTML = ""; // Empty the chat box content
        }
        // Implement the logic to refresh the chat list
    }

    const deleteChatSwitchState = localStorage.getItem("deleteChatSwitchState") === 'true';
    const deleteChatSwitchEl = document.getElementById("deleteAllChatSwitch");
    if (deleteChatSwitchEl) deleteChatSwitchEl.checked = deleteChatSwitchState;



    const logoutButton = document.getElementById("profile-logout-button");
    if (logoutButton) logoutButton.addEventListener("click", function (event) {
        event.preventDefault(); // Prevent default action (if any)
        logoutUser(); // Call the logoutUser function
    });

    async function fetchActiveContacts() {
        const defaultProfileImage = "/assets/img/profiles/avatar-03.jpg"; // Set your default image path here
        const loggedInUserId = currentUserId; // Replace with the actual logged-in user's ID

        try {
            const dbRef = ref(database);
            const contactSnapshot = await get(
                child(dbRef, `data/contacts/${loggedInUserId}`)
            );

            if (!contactSnapshot.exists()) {
                return [];
            }

            // Extract contact IDs and their associated contact names
            const contactDataMap = {};
            contactSnapshot.forEach((contact) => {
                const contactData = contact.val();
                if (contactData.contact_id) {
                    contactDataMap[contactData.contact_id] = {
                        firstname: contactData.firstName || "",
                        lastname: contactData.lastName || "",
                    };
                }
            });

            const activeContacts = [];
            // Loop through contact IDs and check if each contact is online
            for (const [contactId, contactName] of Object.entries(
                contactDataMap
            )) {
                const userSnapshot = await get(
                    child(dbRef, `contacts/${contactId}`)
                );
                if (userSnapshot.exists()) {
                    const userData = userSnapshot.val();
                    if (userData.status === "online") {
                        // Check if the contact is online
                        // Use contact name if available, otherwise fallback to user name
                        const firstname =
                            contactName.firstname || userData.firstName || "";
                        const lastname =
                            contactName.lastname || userData.lastName || "";

                        activeContacts.push({
                            firstname,
                            lastname,
                            profileImage:
                                userData.image || defaultProfileImage,
                            contact_id: userSnapshot.key, // Set this as contact_id
                        });
                    }
                }
            }

            return activeContacts;
        } catch (error) {
            return []; // Return an empty array on error
        }
    }

    const activeContactsLink = document.getElementById('activeContactsLink');
    const activeContactsModal = document.getElementById('activeContactsModal');
    const activeContactsList = document.getElementById('activeContactsList');

    if (activeContactsLink) activeContactsLink.addEventListener('click', function (event) {
        event.preventDefault();
        const listEl = document.getElementById('activeContactsList');
        if (!listEl) return;
        fetchActiveContacts()
            .then(contacts => {
                // Log the fetched contacts for debugging

                // Clear previous contacts
                listEl.innerHTML = '';

                // Populate the list with active contacts
                contacts.forEach(contact => {
                    const { firstname, lastname, profileImage, contact_id } = contact; // Destructure to get properties

                    const listItem = document.createElement('li');
                    listItem.classList.add('list-group-item', 'd-flex', 'align-items-center');

                    // Create the link that will trigger selectUser
                    const userLink = document.createElement("a");
                    userLink.href = "#";
                    userLink.classList.add("chat-user-list", "d-flex", "align-items-center");
                    userLink.setAttribute("data-user-id", contact_id); // Set the data-user-id attribute

                    // Log userId to verify it's being set

                    // Create the profile image
                    const avatar = document.createElement('img');
                    avatar.src = profileImage || defaultProfileImage; // Use default if missing
                    avatar.classList.add('rounded-circle', 'me-2');
                    avatar.style.width = '40px';
                    avatar.style.height = '40px';

                    // Create the initials (First Name + Last Name)
                    const initials = `${firstname} ${lastname || ''}`.trim();

                    // Create the span for the initials
                    const initialsSpan = document.createElement('span');
                    initialsSpan.textContent = initials;
                    initialsSpan.classList.add('ms-2', 'fw-bold'); // Optional: Adds margin and makes it bold

                    // Append avatar and initials to the userLink
                    userLink.appendChild(avatar);
                    userLink.appendChild(initialsSpan);

                    // Add onclick handler to userLink to retrieve userId from data attribute
                    userLink.onclick = (event) => {
                        event.preventDefault(); // Prevent the default anchor behavior
                        const userId = userLink.getAttribute("data-user-id"); // Get userId from data attribute
                        if (userId) {
                            selectUser(userId); // Call selectUser with the retrieved userId

                            // Close the modal
                            if (activeContactsModal) {
                                const modal = bootstrap.Modal.getInstance(activeContactsModal);
                                if (modal) modal.hide();
                            }
                        }
                    };

                    // Append the link to the list item
                    listItem.appendChild(userLink);

                    // Add the list item to the active contacts list
                    listEl.appendChild(listItem);
                });

                // Show the modal if there are active contacts
                if (contacts.length > 0 && activeContactsModal) {
                    const modal = new bootstrap.Modal(activeContactsModal);
                    modal.show();
                }
            });
    });


    function logoutUser() {
        var loginUrl = "/login";
        var doServerLogout = function () {
            var csrfToken = document.querySelector('meta[name="csrf-token"]') && document.querySelector('meta[name="csrf-token"]').getAttribute('content');
            return fetch('/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken || '', 'Accept': 'application/json' },
                credentials: 'same-origin'
            }).catch(function () { });
        };
        if (auth.currentUser) {
            const userId = auth.currentUser.uid;
            const userStatusRef = ref(database, `data/users/${userId}/status`);
            const lastSeenRef = ref(database, `data/users/${userId}/lastSeen`); // Reference to last seen
            // const deviceInfoRef = ref(database, `users/${userId}/device_info`); // Reference to device_info

            set(userStatusRef, 'offline').then(() => {
                // Once the status is set to offline, update the lastSeen timestamp
                return set(lastSeenRef, Date.now());

            }).then(() => {
                // After lastSeen is updated, log the user out from Firebase
                return auth.signOut(); // Sign out from Firebase
            }).then(function () {
                return doServerLogout();
            }).then(function () {
                // Redirect to the login page after successful logout
                window.location.href = loginUrl;
            }).catch((error) => {
                // Optionally, redirect to the login page in case of an error
                doServerLogout().then(function () { window.location.href = loginUrl; });
            });
        } else {
            // No user logged in, still clear Laravel session then redirect
            doServerLogout().then(function () { window.location.href = loginUrl; });
        }
    }


    let recaptchaVerifier;  // Declare the reCAPTCHA verifier globally


    const TwoStepVerificationButton = document.getElementById('enable-2fa-switch'); // Your toggle button for 2FA
    const confirmButton = document.getElementById('confirmButton'); // The Confirm button

    // Handle 2FA toggle
    const handle2FAToggle = () => {
        const is2FAEnabled = TwoStepVerificationButton.checked;

        if (is2FAEnabled) {
            showModal('Please enter your phone number with country code for 2FA:', true);
        } else {
            document.getElementById('phoneInput').value = '';  // Clear phone input
            document.getElementById('otpInput').value = '';    // Clear OTP input
            showModal('2FA has been disabled.', false);
        }
    };

    // Attach event listener to the 2FA switch
    if (TwoStepVerificationButton) {
        TwoStepVerificationButton.addEventListener('change', handle2FAToggle);
    }

    // Function to show modal dynamically
    const showModal = (message, showPhoneInput = false, showOtpInput = false) => {
        const modalBody = document.getElementById('modalBody');
        modalBody.innerText = message;

        const phoneInputGroup = document.getElementById('phoneInputGroup');
        const otpInputGroup = document.getElementById('otpInputGroup');
        const confirmButton = document.getElementById('confirmButton');
        const cancelButton = document.getElementById('cancelButton');
        if (showOtpInput) {
            document.getElementById('otpInput').value = ''; // Clear OTP input
        }
        if (message === "2FA has been disabled.") {
            phoneInputGroup.style.display = 'none';
            cancelButton.style.display = 'none';
            confirmButton.style.display = 'none';
        } else {
            phoneInputGroup.style.display = showPhoneInput ? 'block' : 'none';
            otpInputGroup.style.display = showOtpInput ? 'block' : 'none';
            confirmButton.style.display = 'block';
            cancelButton.style.display = 'block';
        }


        // Initialize and show modal
        const modalPopupElement = document.getElementById('modalPopup');
        let modalInstance = bootstrap.Modal.getInstance(modalPopupElement);
        if (!modalInstance) {
            modalInstance = new bootstrap.Modal(modalPopupElement);
        }
        modalInstance.show();
    };

    // Send OTP
    const sendOtp = (phoneNumber) => {
        const e164Regex = /^\+[1-9]\d{1,14}$/;
        if (!e164Regex.test(phoneNumber)) {
            showModal("Invalid phone number format. Please enter a valid number.");
            return;
        }
        window.confirmationResult = null;
        // Disable and update the button while sending OTP
        confirmButton.disabled = true;
        confirmButton.textContent = "Sending...";

        try {
            const recaptchaContainer = document.getElementById('recaptcha-container');
            // Initialize RecaptchaVerifier only if it hasn't been created
            if (!recaptchaVerifier) {
                recaptchaVerifier = new RecaptchaVerifier(recaptchaContainer, {
                    'size': 'invisible',
                    'callback': (response) => {
                        console.log('ReCAPTCHA solved', response);
                    },
                    'expired-callback': () => {
                        console.log('ReCAPTCHA expired, please try again.');
                    }
                }, auth);
            }

            recaptchaVerifier.render().then(() => {
                return signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
            })
                .then((confirmationResult) => {
                    window.confirmationResult = confirmationResult;
                    showModal('Enter the OTP sent to your phone:', false, true); // Show OTP input modal

                    // Re-enable the button and update text
                    confirmButton.disabled = false;
                    confirmButton.textContent = "Confirm";
                })
                .catch((error) => {
                    showModal("Failed to send OTP. Please try again.");
                    TwoStepVerificationButton.checked = false;

                    // Re-enable the button and update text in case of error
                    confirmButton.disabled = false;
                    confirmButton.textContent = "Confirm";
                });
        } catch (error) {
            showModal("An error occurred. Please try again.");

            // Re-enable the button and update text in case of error
            confirmButton.disabled = false;
            confirmButton.textContent = "Confirm";
        }
    };

    // Verify OTP
    const verifyOtp = (otp) => {
        confirmButton.disabled = true;  // Disable the button while verifying
        confirmButton.textContent = "Verifying...";

        window.confirmationResult.confirm(otp)
            .then((result) => {
                const user = result.user;

                showModal("Phone number verified successfully!");
                Toastify({
                    text: "Successfully Verified!",
                    duration: 3000,
                    gravity: "top",
                    position: "right",
                    backgroundColor: "#28a745",
                }).showToast();
                // Reset confirm button state
                confirmButton.disabled = false;
                confirmButton.textContent = "Confirm";

                // Manually close the modal
                const modalPopupElement = document.getElementById('modalPopup');
                modalPopupElement.style.display = 'none';  // Hide modal
                modalPopupElement.classList.remove('show');  // Remove the 'show' class
                const modalInstance = bootstrap.Modal.getInstance(modalPopupElement) || new bootstrap.Modal(modalPopupElement);
                modalInstance.hide();

                // Clean up remaining modal artifacts
                document.body.classList.remove('modal-open');
                const modalBackdrops = document.querySelectorAll('.modal-backdrop');
                modalBackdrops.forEach((backdrop) => {
                    backdrop.remove();  // Remove the backdrop from the DOM
                });
                // Clear phone number and OTP fields
                document.getElementById('phoneInput').value = '';
                document.getElementById('otpInput').value = '';

            })
            .catch((error) => {
                showModal("Please enter the valid otp.");
                document.getElementById('phoneInput').value = '';
                document.getElementById('otpInput').value = '';
                // Re-enable the button and update text in case of error
                TwoStepVerificationButton.checked = false;
                confirmButton.disabled = false;
                confirmButton.textContent = "Confirm";
            });
    };

    // Handle Confirm button click (Send OTP or Verify OTP)
    confirmButton.addEventListener('click', () => {
        const phoneNumber = document.getElementById('phoneInput').value;
        const otp = document.getElementById('otpInput').value;

        if (TwoStepVerificationButton.checked) {
            // If 2FA is enabled, check if phone number or OTP is entered
            if (phoneNumber && !otp) {
                sendOtp(phoneNumber);  // Send OTP if phone number is entered
            } else if (otp) {
                verifyOtp(otp);  // Verify OTP if entered
            } else {
                showModal("Phone number or OTP is required.");
            }
        }
    });

    const cancelButton = document.getElementById('cancelButton');
    const closeButton = document.getElementById('close2faButton');
    const enable2FASwitch = document.getElementById('enable-2fa-switch');
    const phoneInput = document.getElementById('phoneInput');
    const otpInput = document.getElementById('otpInput');

    // Function to reset 2FA-related inputs and disable the switch
    const reset2FA = () => {
        if (enable2FASwitch) enable2FASwitch.checked = false;
        if (phoneInput) phoneInput.value = '';
        if (otpInput) otpInput.value = '';
    };

    // Attach event listener to "Cancel" button
    if (cancelButton) {
        cancelButton.addEventListener('click', reset2FA);
    }

    // Attach event listener to "Close" button
    if (closeButton) {
        closeButton.addEventListener('click', reset2FA);
    }







    // Add event listener to each dropdown item
    document.querySelectorAll('#innerTab .dropdown-item').forEach(item => {
        item.addEventListener('click', function () {
            // Get the title from the data attribute and update the title
            const title = this.getAttribute('data-title');
            document.getElementById('c').textContent = title;
        });
    });

});