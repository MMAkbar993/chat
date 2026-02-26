import { initializeFirebase } from "./firebase-user.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    sendPasswordResetEmail,
    setPersistence,
    browserLocalPersistence,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
    getDatabase,
    ref,
    push,
    onChildAdded,
    get,
    onValue,
    update,
    remove,
    set,
    onDisconnect,
    limitToLast,
    child,
    query,
    orderByChild,
    equalTo,
    onChildChanged,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import {
    getStorage,
    ref as storageRef,
    uploadBytes,
    getDownloadURL,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";
import {
    getFirestore,
    collection,
    getDocs,
    where,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js"; // Use this URL for Firestore

initializeFirebase(function (app, auth, database, storage) {
    const secretKey =
        "89def69f0bdddc995078037539dc6ef4f0bdbdd3fa04ef2d11eea30779d72ac6";

    let currentUser = null; // Define the current user here
    let selectedUserId = null; // Store the selected user ID
    let currentUserId = null;

    // Set session persistence
    setPersistence(auth, browserLocalPersistence)
        .then(() => {
            // Auth state listener
            onAuthStateChanged(auth, (user) => {
                if (user) {
                    currentUser = user;
                    currentUserId = user.uid;
                    if (window.location.pathname === "/login") {
                        // Redirect to chat if they try to visit the login page while logged in
                        window.location.href = "/chat";
                    }
                    fetchUsers();

                    // Check localStorage and trigger `selectUser` if a user ID is present

                    const storedUserId = localStorage.getItem("selectedUserId"); // Retrieve the stored user ID

                    if (storedUserId) {
                        // Trigger the selectUser function with the stored user ID
                        selectUser(storedUserId);
                        localStorage.removeItem("selectedUserId");
                    }
                    document.getElementById("chat-users-wrap").innerHTML = "";
                    document.getElementById(
                        "user-id"
                    ).innerText = `Logged in as: ${user.id}`;

                    // Set the user's online status
                    const userStatusRef = ref(
                        database,
                        `data/users/${user.uid}/status`
                    );
                    set(userStatusRef, "online");
                    onDisconnect(userStatusRef).set("offline");

                    // Real-time listener for connectivity
                    const connectedRef = ref(database, ".info/connected");
                    onValue(connectedRef, (snapshot) => {
                        if (snapshot.val() === true) {
                            set(userStatusRef, "online");
                        }
                    });

                    // Load other user data
                    loadUserList();
                } else {
                    if (window.location.pathname !== "/login") {
                        // Redirect to login if trying to access any other route
                        window.location.href = "/login";
                    }
                    document.getElementById("user-id").innerText =
                        "No user logged in";
                }
            });
        })
        .catch((error) => {});

    const generateAgoraToken = async (channelName, uid) => {
        if (!channelName || !uid) {
            return null;
        }

        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            .getAttribute("content");

        try {
            // Generate the Agora token
            const response = await fetch("/generate-token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": csrfToken,
                },
                body: JSON.stringify({ channel_name: channelName, uid: uid }),
            });

            const data = await response.json();
            if (!response.ok) {
                return null;
            }

            const token = data.token;

            // Save the generated token in Firebase
            const tokenData = {
                token: token,
                channelName: channelName,
                uid: uid,
                timestamp: Date.now(),
            };

            await saveTokenToFirebase(uid, tokenData);

            return token;
        } catch (error) {
            return null;
        }
    };

    const generateJoinerAgoraToken = async (channelName, uid) => {
        if (!channelName || !uid) {
            return null;
        }

        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            .getAttribute("content");

        try {
            // Generate the Agora token
            const response = await fetch("/generate-joiner-token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": csrfToken,
                },
                body: JSON.stringify({ channel_name: channelName, uid: uid }),
            });

            const data = await response.json();
            if (!response.ok) {
                return null;
            }

            const token = data.token;

            // Save the generated token in Firebase
            const tokenData = {
                token: token,
                channelName: channelName,
                uid: uid,
                timestamp: Date.now(),
            };

            await saveTokenToFirebase(uid, tokenData);

            return token;
        } catch (error) {
            return null;
        }
    };

    const saveTokenToFirebase = async (uid, tokenData) => {
        try {
            const dbRef = ref(database, `data/tokens/${uid}`); // Create a reference to the 'tokens' table with the unique UID
            await set(dbRef, tokenData); // Save the token data to Firebase
        } catch (error) {}
    };

    const generateTokenAndLog = async (channelName, uid) => {
        try {
            const token = await generateAgoraToken(channelName, uid);
            if (token) {
                // Log the generated token
                return token;
            }
        } catch (error) {
            return error;
        }
    };

    let usersMap = {};

    function fetchUsers() {
        const loggedInUserId = auth.currentUser?.uid;
        if (!loggedInUserId) {
            return;
        }

        const contactsRef = ref(database, `data/users`);

        get(contactsRef)
            .then((snapshot) => {
                if (snapshot.exists()) {
                    const contacts = snapshot.val();
                    const userIds = Object.keys(contacts);

                    if (userIds.length > 0) {
                        const usersRef = ref(database, "data/users");

                        get(usersRef)
                            .then((userSnapshot) => {
                                if (userSnapshot.exists()) {
                                    const users = userSnapshot.val();
                                    usersMap = {}; // Reset usersMap

                                    // Populate usersMap with contact users
                                    userIds.forEach((userId) => {
                                        if (users[userId]) {
                                            usersMap[userId] = {
                                                uid: userId,
                                                userName:
                                                    users[userId].firstName +
                                                    " " +
                                                    users[userId].lastName,
                                                profileImage:
                                                    users[userId]
                                                        .image ||
                                                    "assets/img/profiles/avatar-03.jpg",
                                            };
                                        }
                                    });

                                    displayUsers(usersMap); // Display users in the UI
                                }
                            })
                            .catch((error) => {
                                console.error("Error fetching users: ", error);
                            });
                    } else {
                        const usersList =
                            document.getElementById("chat-users-wrap");
                        const swiperList =
                            document.querySelector(".swiper-wrapper");
                        usersList.innerHTML = `<p>No Chat here ...</p>`;
                        swiperList.innerHTML = `<p>No recent chats</p>`;
                    }
                } else {
                    const usersList =
                        document.getElementById("chat-users-wrap");
                    const swiperList =
                        document.querySelector(".swiper-wrapper");
                    usersList.innerHTML = `<p>No Chat here ...</p>`;
                    swiperList.innerHTML = `<p>No recent chats</p>`;
                }
            })
            .catch((error) => {
                console.error("Error fetching contacts: ", error);
            });
    }

    document
        .getElementById("inviteFormChat")
        .addEventListener("submit", function (event) {
            event.preventDefault(); // Prevent the form from reloading the page

            const inviteInput = document
                .getElementById("inviteInput")
                .value.trim();
            const loggedInUserId = auth.currentUser.uid;

            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                .getAttribute("content");
            const sendInviteButton =
                document.getElementById("sendInviteButton");

            // Change button state to processing
            sendInviteButton.textContent = "Processing..."; // Change button text
            sendInviteButton.disabled = true; // Disable the button

            const usersRef = ref(database, "data/users");

            // Reference to the logged-in user's mobile number
            const loggedInUserRef = ref(
                database,
                `data/users/${loggedInUserId}/mobile_number`
            );

            // Fetch the logged-in user's mobile number
            get(loggedInUserRef)
                .then((mobileSnapshot) => {
                    const loggedInUserMobileNumber = mobileSnapshot.val();

                    get(usersRef)
                        .then((snapshot) => {
                            //if (snapshot.exists()) {
                            const users = snapshot.val();
                            let foundUser = null;

                            // Manually search for the user by email
                            for (const userId in users) {
                                if (users[userId].email === inviteInput) {
                                    foundUser = {
                                        ...users[userId],
                                        uid: userId,
                                    };
                                    break;
                                }
                            }

                            if (foundUser) {
                                const existingUserId = foundUser.uid;
                                if (loggedInUserId === existingUserId) {
                                    Swal.fire({
                                        title: "",
                                        width: 400,
                                        text: "You can't add yourself to the contact list.",
                                        icon: "error",
                                    });
                                    document
                                        .getElementById("inviteFormChat")
                                        .reset();
                                    $("#invite-contact").modal("hide");
                                    sendInviteButton.textContent =
                                        "Send Invitation";
                                    sendInviteButton.disabled = false;
                                    return;
                                }

                                // Add the user to contacts
                                const loggedInUserContactsRef = ref(
                                    database,
                                    `data/contacts/${loggedInUserId}/${existingUserId}`
                                );

                                // Check if the contact already exists
                                get(loggedInUserContactsRef).then(
                                    (contactSnapshot) => {
                                        if (contactSnapshot.exists()) {
                                            // Contact already exists
                                            Swal.fire({
                                                title: "",
                                                width: 400,
                                                text: "This contact is already in your contacts list!",
                                                icon: "info",
                                            });
                                            resetForm();
                                        } else {
                                            // Add the user to contacts
                                            set(loggedInUserContactsRef, {
                                                contact_id: existingUserId,
                                                email: foundUser.email,
                                                mobile_number:
                                                    foundUser.mobile_number,
                                            });

                                            const existingUserContactsRef = ref(
                                                database,
                                                `data/contacts/${existingUserId}/${loggedInUserId}`
                                            );
                                            set(existingUserContactsRef, {
                                                contact_id: loggedInUserId,
                                                email: auth.currentUser.email,
                                                mobile_number:
                                                    loggedInUserMobileNumber,
                                            });

                                            Swal.fire({
                                                title: "",
                                                width: 400,
                                                text: "User added to contacts!",
                                                icon: "success",
                                            }).then(() => {
                                                window.location.reload();
                                            });
                                        }
                                    }
                                );
                            } else {
                                const firstName = "";
                                const lastName = "";
                                const password = "tempoary@123";

                                // Email does not exist, create the user and add to contacts
                                fetch("/create-user", {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                        "X-CSRF-TOKEN": csrfToken, // Include the CSRF token in the request headers
                                    },
                                    body: JSON.stringify({
                                        firstName: firstName,
                                        lastName: lastName,
                                        email: inviteInput,
                                        password: password,
                                    }),
                                })
                                    .then((response) => response.json())
                                    .then((data) => {
                                        if (data.status === "success") {
                                            // Save the new user data in Firebase Realtime Database
                                            const newUserRef = ref(
                                                database,
                                                "data/users/" + data.uid
                                            );
                                            set(newUserRef, {
                                                uid: data.uid,
                                                firstName: firstName,
                                                lastName: lastName,
                                                email: inviteInput,
                                            })
                                                .then(() => {
                                                    document
                                                        .getElementById(
                                                            "inviteFormChat"
                                                        )
                                                        .reset(); // Clear the form
                                                    $("#invite-contact").modal(
                                                        "hide"
                                                    ); // Close the modal
                                                    Swal.fire({
                                                        title: "",
                                                        width: 400,
                                                        text: "User Invited Successfully!",
                                                        icon: "success",
                                                    });

                                                    // Add new user to the logged-in user's contact list
                                                    const loggedInUserContactsRef =
                                                        ref(
                                                            database,
                                                            "data/contacts/" +
                                                                loggedInUserId +
                                                                "/" +
                                                                data.uid
                                                        );
                                                    set(
                                                        loggedInUserContactsRef,
                                                        {
                                                            contact_id:
                                                                data.uid,
                                                            email: inviteInput,
                                                            name:
                                                                firstName +
                                                                " " +
                                                                lastName,
                                                        }
                                                    );

                                                    // // Add logged-in user to the new user's contact list
                                                    // const newUserContactsRef = ref(database, 'data/contacts/' + data.uid + '/' + loggedInUserId);
                                                    // set(newUserContactsRef, {
                                                    //     contact_id: loggedInUserId,
                                                    //     email: auth.currentUser.email,
                                                    //     name: auth.currentUser.displayName || '',
                                                    // });

                                                    // Send password reset email
                                                    sendPasswordResetEmail(
                                                        auth,
                                                        inviteInput
                                                    )
                                                        .then(() => {
                                                            window.location.reload();
                                                        })
                                                        .catch((error) => {
                                                            Swal.fire({
                                                                title: "",
                                                                width: 400,
                                                                text: error.message,
                                                                icon: "error",
                                                            });
                                                        });
                                                })
                                                .catch((error) => {
                                                    Swal.fire({
                                                        title: "",
                                                        width: 400,
                                                        text: error.message,
                                                        icon: "error",
                                                    });
                                                });
                                        } else {
                                            Swal.fire({
                                                title: "",
                                                width: 400,
                                                text:
                                                    "Error creating user: " +
                                                    data.message,
                                                icon: "error",
                                            });
                                        }
                                    })
                                    .catch((error) => {
                                        Swal.fire({
                                            title: "",
                                            width: 400,
                                            text: "Error: " + error.message,
                                            icon: "error",
                                        });
                                    });
                            }
                        })
                        .catch((error) => {
                            Swal.fire({
                                title: "",
                                width: 400,
                                text: "Error fetching users: " + error.message,
                                icon: "error",
                            });
                        })
                        .finally(() => {
                            sendInviteButton.textContent = "Send Invitation";
                            sendInviteButton.disabled = false;
                        });
                })
                .catch((error) => {
                    Swal.fire({
                        title: "",
                        width: 400,
                        text: "Error fetching mobile number: " + error.message,
                        icon: "error",
                    });
                });
        });

    function capitalizeFirstLetter(string) {
        if (!string) return ""; // Return empty string if input is empty
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    function displayUsers(users) {
        const usersList = document.getElementById("chat-users-wrap");
        const swiperList = document.querySelector(".swiper-wrapper"); // Swiper wrapper element for recent chats
        const existingUsers = {}; // Track displayed users for updates

        // Build an existing users map for efficient updates
        document.querySelectorAll(".chat-list").forEach((userDiv) => {
            const userId = userDiv.getAttribute("data-user-id");
            if (userId) {
                existingUsers[userId] = userDiv;
            }
        });

        const archiveChatsRef = ref(
            database,
            `data/users/${currentUser.uid}/archiveUserId`
        );
        const deleteChatsRef = ref(
            database,
            `data/users/${currentUser.uid}/delete_chats`
        );

        get(archiveChatsRef).then((archiveSnapshot) => {
            const archivedChats = archiveSnapshot.exists()
                ? archiveSnapshot.val()
                : [];
            get(deleteChatsRef).then((deleteSnapshot) => {
                const deletedChats = deleteSnapshot.exists()
                    ? deleteSnapshot.val()
                    : {};

                const fetchUserPromises = Object.keys(users).map((userId) => {
                    const user = users[userId];

                    // Skip the current user, deleted, or archived users
                    if (
                        userId === currentUserId ||
                        archivedChats.includes(userId) || // Check if the user is in the archived list
                        Object.values(deletedChats).some(
                            (chat) => chat.userId === userId && chat.deleted
                        )
                    ) {
                        return null;
                    }

                    // Check if messages exist in either chat path
                    const chatRef1 = ref(
                        database,
                        `data/chats/${currentUserId}-${userId}`
                    );
                    const chatRef2 = ref(
                        database,
                        `data/chats/${userId}-${currentUserId}`
                    );
                    const chatQuery1 = query(
                        chatRef1,
                        orderByChild("timestamp"),
                        limitToLast(1)
                    );
                    const chatQuery2 = query(
                        chatRef2,
                        orderByChild("timestamp"),
                        limitToLast(1)
                    );

                    return Promise.all([get(chatQuery1), get(chatQuery2)]).then(
                        ([snapshot1, snapshot2]) => {
                            let lastMessageTimestamp = 0;

                            // Helper function to process a snapshot and determine if messages exist
                            const processSnapshot = (snapshot) => {
                                if (snapshot.exists()) {
                                    snapshot.forEach((childSnapshot) => {
                                        const message = childSnapshot.val();
                                        lastMessageTimestamp = Math.max(
                                            lastMessageTimestamp,
                                            message.timestamp || 0
                                        );
                                    });
                                }
                            };

                            processSnapshot(snapshot1);
                            processSnapshot(snapshot2);

                            // Only include users with messages
                            if (lastMessageTimestamp > 0) {
                                return { userId, user, lastMessageTimestamp };
                            }

                            return null; // Exclude users without messages
                        }
                    );
                });

                Promise.all(fetchUserPromises).then((fetchedUsers) => {
                    const validUsers = fetchedUsers.filter(Boolean); // Filter out null values

                    // Clear the user list and swiper list before rendering
                    usersList.innerHTML = "";
                    swiperList.innerHTML = "";

                    if (validUsers.length === 0) {
                        // No valid users, display the 'No Chat' message
                        usersList.innerHTML = `<p>No Chat here ...</p>`;
                        swiperList.innerHTML = `<p>No recent chats</p>`;
                    } else {
                        // Render users in sorted order
                        validUsers.sort(
                            (a, b) =>
                                b.lastMessageTimestamp - a.lastMessageTimestamp
                        );

                        validUsers.forEach(({ userId, user }) => {
                            if (existingUsers[userId]) {
                                updateUserUI(
                                    existingUsers[userId],
                                    user,
                                    userId
                                );
                            } else {
                                const newUserDiv = createUserElement(
                                    user,
                                    userId
                                );
                                usersList.appendChild(newUserDiv);
                            }

                            // Add user to swiper
                            const userStatusRef = ref(
                                database,
                                `data/users/${userId}/status`
                            );
                            get(userStatusRef).then((statusSnapshot) => {
                                const status =
                                    statusSnapshot.val() || "offline";
                                addRecentChatUser(
                                    user,
                                    status,
                                    swiperList,
                                    userId
                                );
                            });
                        });
                    }

                    // Remove users no longer in the list
                    Object.keys(existingUsers).forEach((userId) => {
                        if (!users[userId]) {
                            existingUsers[userId].remove();
                        }
                    });

                    // Reinitialize swiper to update the UI
                    if (window.swiperInstance) {
                        window.swiperInstance.update(); // Update existing swiper instance
                    } else {
                        // Initialize a new swiper instance if not initialized
                        window.swiperInstance = new Swiper(
                            ".swiper-container",
                            {
                                slidesPerView: "auto",
                                spaceBetween: 10,
                                freeMode: true,
                            }
                        );
                    }
                });

                // Listen for new messages dynamically and update the UI
                listenForNewMessages(users);
            });
        });
    }

    // Listen for new messages and update the user list in real-time
    function listenForNewMessages(users) {
        const chatRef = ref(database, `data/chats`);

        // Listen for new chat rooms dynamically
        onChildAdded(chatRef, (chatRoomSnapshot) => {
            const chatRoomId = chatRoomSnapshot.key; // Get the chat room ID
            const messageRef = ref(database, `data/chats/${chatRoomId}`);

            // Listen for new messages within the specific chat room
            onChildAdded(messageRef, (messageSnapshot) => {
                const message = messageSnapshot.val();

                if (!message || !message.senderId) {
                    return;
                }

                const senderId = message.senderId;

                // Skip if the sender is not in the users list
                if (!users[senderId]) {
                    return;
                }

                const userDiv = document.querySelector(
                    `[data-user-id="${senderId}"]`
                );
                if (!userDiv) {
                    return;
                }

                const messageCountSpan =
                    userDiv.querySelector(".count-message");
                if (!messageCountSpan) {
                    return;
                }

                let unseenMessageCount =
                    parseInt(messageCountSpan.textContent) || 0;

                if (selectedUserId === senderId) {
                    return; // Do not show the count if the chat is open for this user
                }

                // Increment unseen message count for messages not marked as seen
                if (!message.seen && message.recipientId === currentUserId) {
                    unseenMessageCount++;
                    messageCountSpan.style.display =
                        unseenMessageCount > 0 ? "block" : "none";
                    messageCountSpan.textContent =
                        unseenMessageCount > 0
                            ? unseenMessageCount.toString()
                            : "";
                }
            });
        });
    }

    // Sanitize Firebase keys by replacing invalid characters with underscores or other valid characters
    function sanitizeFirebaseKey(key) {
        return key.replace(/[.#$[\]]/g, "_"); // Replace invalid characters with underscores
    }

    // Mark messages as seen when clicking on the chat
    function markMessagesAsSeen(chatRoomId, userId) {
        const chatRef1 = ref(database, `data/chats/${currentUserId}-${userId}`);
        const chatRef2 = ref(database, `data/chats/${userId}-${currentUserId}`);

        // Function to mark all messages in a chat as seen
        const markSeenInChat = (chatRef) => {
            get(chatRef)
                .then((snapshot) => {
                    if (snapshot.exists()) {
                        snapshot.forEach((childSnapshot) => {
                            const message = childSnapshot.val();
                            const messageKey = sanitizeFirebaseKey(
                                childSnapshot.key
                            ); // Sanitize the message key
                            if (
                                message.recipientId === currentUserId &&
                                !message.seen
                            ) {
                                // Update the message status to seen
                                update(
                                    ref(
                                        database,
                                        `data/chats/${chatRoomId}/${messageKey}`
                                    ),
                                    {
                                        seen: true,
                                    }
                                ).catch((error) => {
                                    console.error(
                                        "Error marking message as seen:",
                                        error
                                    );
                                });
                            }
                        });
                    }
                })
                .catch((error) => {
                    console.error("Error marking messages as seen:", error);
                });
        };

        // Mark messages as seen in both chat rooms
        markSeenInChat(chatRef1);
        markSeenInChat(chatRef2);
    }

    function updateUserUI(userDiv, user, userId) {
        const userNameElement = userDiv.querySelector("h6");
        const userMessageElement = userDiv.querySelector("p");
        const userStatusElement = userDiv.querySelector(".avatar");

        // Update the user's name
        const contactsRef = ref(
            database,
            `data/contacts/${currentUser.uid}/${userId}`
        );
        onValue(contactsRef, (contactSnapshot) => {
            const contactData = contactSnapshot.val();
            const displayName = contactData?.firstName
                ? `${contactData.firstName} ${contactData.lastName}`
                : `${contactData.mobile_number}`;

            userNameElement.textContent = displayName;
        });

        // Update the user's status
        const userStatusRef = ref(database, `data/users/${userId}/status`);
        onValue(userStatusRef, (snapshot) => {
            const status = snapshot.val() || "offline";
            if (status === "online") {
                userStatusElement.classList.add("online");
            } else {
                userStatusElement.classList.remove("online");
            }
        });

        const chatsRef = ref(database, "data/chats");

        let lastMessage = null;
        let unseenMessageCount = 0;
        let chatMessages = [];
        onChildAdded(chatsRef, async (snapshot) => {
            const chat = snapshot.val();
            chatMessages.push(chat);

            // Sort all messages in the chat by timestamp
            const sortedMessages = Object.values(chat).sort(
                (a, b) => b.timestamp - a.timestamp
            ); // Sort by timestamp descending
            const lastMessage = sortedMessages[0]; // Get the most recent message
            // Increment unseen message count if the message is unseen
            if (
                lastMessage &&
                lastMessage.recipientId === currentUser.uid &&
                !lastMessage.seen
            ) {
                unseenMessageCount++;
            }

            const roomId = snapshot.key;
            const [fromUserId, toUserId] = roomId.split("-");
            if (
                (fromUserId === currentUser.uid && toUserId === userId) ||
                (fromUserId === userId && toUserId === currentUser.uid)
            ) {
                let displayMessage = "No messages";

                // Determine message type and process it
                const messageType = lastMessage.attachmentType || "unknown";
                if (messageType === 6) {
                    const originalMessage = await decryptlibsodiumMessage(
                        lastMessage.body
                    );
                    displayMessage = originalMessage || "No messages";
                } else if (messageType === 5) {
                    displayMessage = "File sent";
                } else if (messageType === 2) {
                    displayMessage = "Image sent";
                } else if (messageType === 6) {
                    displayMessage = "Emoji";
                } else if (messageType === 1) {
                    displayMessage = "Video sent";
                } else if (messageType === 3) {
                    displayMessage = "Audio sent";
                } else if (messageType === 8) {
                    displayMessage = "Audio Record sent";
                } else {
                    displayMessage = "Unknown message type";
                }

                // Update the displayed last message and time
                userMessageElement.textContent = displayMessage;
                const lastMessageTimestamp = lastMessage?.timestamp;

                timeElement.textContent = lastMessageTimestamp
                    ? moment(lastMessageTimestamp).calendar(null, {
                          sameDay: "h:mm A", // Today
                          lastDay: "[Yesterday]", // Yesterday
                          lastWeek: "MM/D/YYYY", // Last week
                          sameElse: "MM/D/YYYY", // Older dates
                      })
                    : "No time";
                // messageCountSpan.textContent = unseenMessageCount > 0 ? unseenMessageCount.toString() : "";

                userLink.onclick = () => {
                    selectUser(userId);

                    if (
                        lastMessage &&
                        lastMessage.recipientId === currentUserId &&
                        !lastMessage.seen
                    ) {
                        unseenMessageCount++;
                    }

                    const messageCountSpan =
                        userDiv.querySelector(".count-message");
                    if (userId === currentUserId) {
                        messageCountSpan.style.display =
                            unseenMessageCount > 0 ? "block" : "none";
                        messageCountSpan.textContent =
                            unseenMessageCount.toString();
                    } else {
                        messageCountSpan.style.display = "none"; // Hide for the sender
                        messageCountSpan.textContent = "";
                    }

                    // Update the database to mark messages as seen
                    const chatRef1 = ref(
                        database,
                        `data/chats/${currentUserId}-${userId}`
                    );
                    const chatRef2 = ref(
                        database,
                        `data/chats/${userId}-${currentUserId}`
                    );

                    [chatRef1, chatRef2].forEach((chatRef) => {
                        get(chatRef).then((snapshot) => {
                            if (snapshot.exists()) {
                                snapshot.forEach((childSnapshot) => {
                                    const message = childSnapshot.val();
                                    if (
                                        message.recipientId ===
                                            currentUser.uid &&
                                        !message.seen
                                    ) {
                                        update(
                                            ref(
                                                database,
                                                `${chatRef}/${childSnapshot.key}`
                                            ),
                                            {
                                                seen: true,
                                            }
                                        );
                                    }
                                });
                            }
                        });
                    });
                };

                // Update message status (check marks)
                if (message.senderId === currentUserId) {
                    if (!message.delivered && !message.readMsg) {
                        statusIcon.innerHTML = `<i class="ti ti-check"></i>`; // Sent (single tick)
                    } else if (message.delivered && !message.readMsg) {
                        statusIcon.innerHTML = `<i class="ti ti-checks"></i>`; // Delivered (double ticks)
                    } else if (message.delivered && message.readMsg) {
                        statusIcon.innerHTML = `<i class="ti ti-checks text-success">dfv</i>`; // Read (green double ticks)
                    }
                }
            }
        });
        onChildChanged(chatsRef, async (snapshot) => {
            const chat = snapshot.val();
            const roomId = snapshot.key;
            const [fromUserId, toUserId] = roomId.split("-");
            let displayMessage = "No messages";
            if (
                (fromUserId === currentUser.uid && toUserId === userId) ||
                (fromUserId === userId && toUserId === currentUser.uid)
            ) {
                const lastMessage = chat[Object.keys(chat).pop()]; // Last message in chat
                if (lastMessage) {
                    const pinnedIcon = document.querySelector(
                        `[data-user-id="${userId}"] .pinned-icon`
                    );

                    if (pinnedIcon) {
                        const pinnedChatsRef = ref(
                            database,
                            `data/users/${currentUserId}/pinnedUserId`
                        );

                        get(pinnedChatsRef)
                            .then((snapshot) => {
                                const pinnedChats = snapshot.val() || []; // Ensure pinnedChats is an array

                                // Check if the userId is in the pinnedChats array
                                const isPinned = pinnedChats.includes(userId);

                                // If the user is pinned, show the pin icon
                                if (isPinned) {
                                    pinnedIcon.innerHTML =
                                        '<i class="ti ti-pin"></i>'; // Show pin icon
                                } else {
                                    pinnedIcon.innerHTML = ""; // Clear the pin icon if not pinned
                                }
                            })
                            .catch((error) => {
                                console.error(
                                    "Error fetching pinned chats:",
                                    error
                                );
                            });
                    }

                    // Determine the correct status icon based on the message's status
                    const statusIcon = document.querySelector(
                        `[data-user-id="${userId}"] .status-icon`
                    );

                    if (lastMessage.senderId === currentUserId) {
                        if (statusIcon) {
                            if (
                                !lastMessage.delivered &&
                                !lastMessage.readMsg
                            ) {
                                statusIcon.innerHTML = `<i class="ti ti-check"></i>`; // Single tick
                            } else if (
                                lastMessage.delivered &&
                                !lastMessage.readMsg
                            ) {
                                statusIcon.innerHTML = `<i class="ti ti-checks"></i>`; // Double ticks (delivered)
                            } else if (
                                lastMessage.delivered &&
                                lastMessage.readMsg
                            ) {
                                statusIcon.innerHTML = `<i class="ti ti-checks text-success">2</i>`; // Double ticks (read)
                            }

                            statusIcon.innerHTML = '<i class="ti ti-pin"></i>';
                        }
                    } else {
                        statusIcon.innerHTML = ""; // Hide checkmarks for the receiver
                    }
                }

                if (lastMessage && lastMessage.text) {
                    const messageType = lastMessage.type || "unknown";
                    if (messageType === 5) {
                        const originalMessage = await decryptlibsodiumMessage(
                            lastMessage.body
                        );
                        displayMessage = originalMessage || "No messages";
                    } else if (messageType === 5) {
                        displayMessage = "File sent";
                    } else if (messageType === 2) {
                        displayMessage = "Image sent";
                    } else if (messageType === 6) {
                        displayMessage = "Emoji";
                    } else if (messageType === 3) {
                        displayMessage = "Audio sent";
                    } else if (messageType === 1) {
                        displayMessage = "Video sent";
                    } else {
                        displayMessage = "Unknown message type";
                    }
                    userMessage.textContent = displayMessage;
                    // Update the unseen message count
                }
            }
        });
        // Fetch last message from both paths
        const chatRefs = [
            ref(database, `data/chats/${currentUserId}-${userId}`),
            ref(database, `data/chats/${userId}-${currentUserId}`),
        ];

        const chatPromises = chatRefs.map((chatRef) =>
            get(query(chatRef, orderByChild("timestamp"), limitToLast(1)))
        );

        Promise.all(chatPromises).then((snapshots) => {
            let lastMessage = null;
            let latestTimestamp = 0;

            snapshots.forEach((snapshot) => {
                if (snapshot.exists()) {
                    snapshot.forEach((childSnapshot) => {
                        const message = childSnapshot.val();
                        if (message.timestamp > latestTimestamp) {
                            lastMessage = message;
                            latestTimestamp = message.timestamp;
                        }
                    });
                }
            });

            if (lastMessage) {
                const displayMessage =
                    lastMessage.attachmentType === 6
                        ? decryptMessage(lastMessage.body)
                        : lastMessage.attachmentType === 2
                        ? "Image sent"
                        : lastMessage.attachmentType === 5
                        ? "File sent"
                        : "Unknown message type";

                userMessageElement.textContent = displayMessage;
            } else {
                userMessageElement.textContent = "No messages";
            }
        });
    }

    function createUserElement(user, userId) {
        const usersList = document.getElementById("chat-users-wrap");
        const userDiv = document.createElement("div");
        userDiv.classList.add("chat-list");
        userDiv.setAttribute("data-user-id", userId);

        const userLink = document.createElement("a");
        userLink.href = "#";
        userLink.classList.add("chat-user-list");
        userLink.onclick = () => selectUser(userId);

        // Avatar Div
        const avatarDiv = document.createElement("div");
        avatarDiv.classList.add("avatar", "avatar-lg", "me-2");

        const userImage = document.createElement("img");
        userImage.src =
            user.profileImage || "assets/img/profiles/avatar-03.jpg";
        userImage.classList.add("rounded-circle");
        userImage.alt = "image";
        avatarDiv.appendChild(userImage);

        // User Info Div
        const chatUserInfoDiv = document.createElement("div");
        chatUserInfoDiv.classList.add("chat-user-info");

        const chatUserMsgDiv = document.createElement("div");
        chatUserMsgDiv.classList.add("chat-user-msg");

        // Create userName and userMessage elements
        const userName = document.createElement("h6");
        const userMessage = document.createElement("p");

        // Append userName first, then userMessage
        chatUserMsgDiv.appendChild(userName);
        chatUserMsgDiv.appendChild(userMessage);

        chatUserInfoDiv.appendChild(chatUserMsgDiv);

        // Chat User Time Div
        const chatUserTimeDiv = document.createElement("div");
        chatUserTimeDiv.classList.add("chat-user-time");

        const timeElement = document.createElement("span");
        timeElement.classList.add("time");
        chatUserTimeDiv.appendChild(timeElement);

        // Chat Pin Div
        const chatPinDiv = document.createElement("div");
        chatPinDiv.classList.add("chat-pin");

        // Message Count Span
        const messageCountSpan = document.createElement("span");
        messageCountSpan.classList.add("count-message", "fs-12", "fw-semibold");
        messageCountSpan.style.display = "none"; // Initially hidden
        chatPinDiv.appendChild(messageCountSpan);

        const pinIcon = document.createElement("span");
        pinIcon.classList.add("status-icon");
        const pinsIcon = document.createElement("span");
        pinsIcon.classList.add("pinned-icon");

        // Determine the status icon based on message delivery and read status
        let statusIcon = "";
        let pinnedIcon = "";

        // if (!userMessage.delivered && !userMessage.readMsg) {
        //     statusIcon = `<i class="ti ti-check"></i>`; // Single tick (not delivered, not read)
        // } else if (userMessage.delivered && !userMessage.readMsg) {
        //     statusIcon = `<i class="ti ti-checks"></i>`; // Double ticks (delivered, not read)
        // } else if (userMessage.delivered && userMessage.readMsg) {
        //     statusIcon = `<i class="ti ti-checks text-success"></i>`; // Double ticks (delivered and read)
        // }

        // Insert the correct status icon into the pinIcon element
        pinIcon.innerHTML = statusIcon;
        pinsIcon.innerHTML = pinnedIcon;
        chatPinDiv.appendChild(pinIcon); // Add pin icon to the message div
        chatPinDiv.appendChild(pinsIcon); // Add pin icon to the message div
        chatUserTimeDiv.appendChild(chatPinDiv); // Add the pin icon to the message container

        chatUserInfoDiv.appendChild(chatUserTimeDiv);

        userLink.appendChild(avatarDiv);
        userLink.appendChild(chatUserInfoDiv);
        userDiv.appendChild(userLink);

        // Chat Dropdown (Options menu)
        const chatDropdown = document.createElement("div");
        chatDropdown.classList.add("chat-dropdown", "dropup");

        const dropdownToggle = document.createElement("a");
        dropdownToggle.href = "#";
        dropdownToggle.classList.add("#");
        dropdownToggle.setAttribute("data-bs-toggle", "dropdown");
        dropdownToggle.setAttribute("aria-expanded", "false");
        dropdownToggle.innerHTML = `<i class="ti ti-dots-vertical"></i>`;
        chatDropdown.appendChild(dropdownToggle);

        const dropdownMenu = document.createElement("ul");
        dropdownMenu.classList.add("dropdown-menu", "dropdown-menu-end", "p-3");

        // Define dropdown options
        const options = [
            {
                text: "Archive Chat",
                icon: "ti ti-box-align-right",
                click: () => archiveChat(userId),
            },
            {
                text: "Pin Chats",
                icon: "ti ti-pinned",
                click: () => pinChat(userId),
            },
            // {
            //     text: "Delete",
            //     icon: "ti ti-trash",
            //     click: () => deleteChat(userId),
            // },
        ];

        // Create dropdown items
        options.forEach((option) => {
            const dropdownItem = document.createElement("li");
            const dropdownLink = document.createElement("a");
            dropdownLink.classList.add("dropdown-item");
            dropdownLink.href = "#"; // Prevent default action
            dropdownLink.innerHTML = `<i class="${option.icon} me-2"></i>${option.text}`;

            dropdownLink.onclick = (event) => {
                event.preventDefault(); // Prevent default action
                option.click(); // Call the associated click function
            };
            dropdownItem.appendChild(dropdownLink);
            dropdownMenu.appendChild(dropdownItem);
        });

        chatDropdown.appendChild(dropdownMenu);
        userDiv.appendChild(chatDropdown);
        usersList.appendChild(userDiv);

        // Fetch first name and last name
        const contactsRef = ref(
            database,
            `data/contacts/${currentUser.uid}/${userId}`
        );
        onValue(contactsRef, (snapshot) => {
            const contactData = snapshot.val();

            if (contactData?.firstName) {
                // If first name and last name are available, display them
                const displayName = `${contactData.firstName} ${contactData.lastName}`;
                userName.textContent = displayName;
            } else if (contactData?.mobile_number) {
                // If mobile number is available in contacts, display it
                const displayName = `${contactData.mobile_number}`;
                userName.textContent = displayName;
            } else {
                // Fetch from users collection as fallback
                const userRef = ref(database, `data/users/${userId}`);
                get(userRef)
                    .then((userSnapshot) => {
                        const userData = userSnapshot.val();
                        if (userData?.mobile_number) {
                            const displayName = `${userData.mobile_number}`;
                            userName.textContent = displayName;
                        }
                    })
                    .catch((error) => {
                        console.error("Error fetching user data:", error);
                        const displayName = "Error Loading User";
                        userName.textContent = displayName;
                    });
            }
        });

        const chatsRef = ref(database, "data/chats");

        let lastMessage = null;
        let unseenMessageCount = 0;
        let chatMessages = [];
        onChildAdded(chatsRef, async (snapshot) => {
            const chat = snapshot.val();
            chatMessages.push(chat);

            // Sort all messages in the chat by timestamp
            const sortedMessages = Object.values(chat).sort(
                (a, b) => b.timestamp - a.timestamp
            ); // Sort by timestamp descending
            const lastMessage = sortedMessages[0]; // Get the most recent message
            // Increment unseen message count if the message is unseen
            if (
                lastMessage &&
                lastMessage.recipientId === currentUser.uid &&
                !lastMessage.seen
            ) {
                unseenMessageCount++;
            }

            const roomId = snapshot.key;
            const [fromUserId, toUserId] = roomId.split("-");
            if (
                (fromUserId === currentUser.uid && toUserId === userId) ||
                (fromUserId === userId && toUserId === currentUser.uid)
            ) {
                const lastMessage = chat[Object.keys(chat).pop()]; // Last message in chat
                if (
                    lastMessage &&
                    lastMessage.recipientId === currentUserId &&
                    !lastMessage.seen
                ) {
                    unseenMessageCount++;
                }

                const messageCountSpan =
                    userDiv.querySelector(".count-message");
                if (userId !== currentUserId) {
                    messageCountSpan.style.display = "none"; // Hide for sender
                    messageCountSpan.textContent = "";
                } else {
                    messageCountSpan.style.display =
                        unseenMessageCount > 0 ? "block" : "none";
                    messageCountSpan.textContent =
                        unseenMessageCount.toString();
                }

                let displayMessage = "No messages";

                // Determine message type and process it
                const messageType = lastMessage.attachmentType || "unknown";
                if (messageType === 6) {
                    const originalMessage = await decryptlibsodiumMessage(
                        lastMessage.body
                    );
                    displayMessage = originalMessage || "No messages";
                } else if (messageType === 5) {
                    displayMessage = "File sent";
                } else if (messageType === 2) {
                    displayMessage = "Image sent";
                } else if (messageType === 6) {
                    displayMessage = "Emoji";
                } else if (messageType === 1) {
                    displayMessage = "Video sent";
                } else if (messageType === 3) {
                    displayMessage = "Audio sent";
                } else if (messageType === 8) {
                    displayMessage = "Audio Record sent";
                } else {
                    displayMessage = "Unknown message type";
                }

                // Update the displayed last message and time
                userMessage.textContent = displayMessage;
                const lastMessageTimestamp = lastMessage?.timestamp;

                timeElement.textContent = lastMessageTimestamp
                    ? moment(lastMessageTimestamp).calendar(null, {
                          sameDay: "h:mm A", // Today
                          lastDay: "[Yesterday]", // Yesterday
                          lastWeek: "MM/D/YYYY", // Last week
                          sameElse: "MM/D/YYYY", // Older dates
                      })
                    : "No time";
                // messageCountSpan.textContent = unseenMessageCount > 0 ? unseenMessageCount.toString() : "";

                userLink.onclick = () => {
                    selectUser(userId);

                    // Reset unseen message count
                    unseenMessageCount = 0;
                    messageCountSpan.style.display = "none"; // Hide the count span
                    messageCountSpan.textContent = "";

                    // Update the database to mark messages as seen
                    const chatRef1 = ref(
                        database,
                        `data/chats/${currentUserId}-${userId}`
                    );
                    const chatRef2 = ref(
                        database,
                        `data/chats/${userId}-${currentUserId}`
                    );

                    [chatRef1, chatRef2].forEach((chatRef) => {
                        get(chatRef).then((snapshot) => {
                            if (snapshot.exists()) {
                                snapshot.forEach((childSnapshot) => {
                                    const message = childSnapshot.val();
                                    if (
                                        message.recipientId ===
                                            currentUser.uid &&
                                        !message.seen
                                    ) {

                                        update(
                                        child(chatRef, childSnapshot.key), 
                                        { seen: true }
                                        );
                                    }
                                });
                            }
                        });
                    });
                };

                const pinnedIcon = document.querySelector(
                    `[data-user-id="${userId}"] .pinned-icon`
                );

                if (pinnedIcon) {
                    const pinnedChatsRef = ref(
                        database,
                        `data/users/${currentUserId}/pinnedUserId`
                    );

                    get(pinnedChatsRef)
                        .then((snapshot) => {
                            const pinnedChats = snapshot.val() || []; // Ensure pinnedChats is an array

                            // Check if the userId is in the pinnedChats array
                            const isPinned = pinnedChats.includes(userId);

                            // If the user is pinned, show the pin icon
                            if (isPinned) {
                                pinnedIcon.innerHTML =
                                    '<i class="ti ti-pin"></i>'; // Show pin icon
                            } else {
                                pinnedIcon.innerHTML = ""; // Clear the pin icon if not pinned
                            }
                        })
                        .catch((error) => {
                            console.error(
                                "Error fetching pinned chats:",
                                error
                            );
                        });
                }

                if (lastMessage.senderId === currentUserId) {
                    // Update message status (check marks)
                    const statusIcon = document.querySelector(
                        `[data-user-id="${userId}"] .status-icon`
                    );
                    if (!lastMessage.delivered && !lastMessage.readMsg) {
                        statusIcon.innerHTML = `<i class="ti ti-check"></i>`; // Single tick
                    } else if (lastMessage.delivered && !lastMessage.readMsg) {
                        statusIcon.innerHTML = `<i class="ti ti-checks"></i>`; // Double ticks (delivered)
                    } else if (lastMessage.delivered && lastMessage.readMsg) {
                        statusIcon.innerHTML = `<i class="ti ti-checks text-success">3</i>`; // Double ticks (read)
                    }
                }
            }
        });
        onChildChanged(chatsRef, async (snapshot) => {
            const chat = snapshot.val();
            const roomId = snapshot.key;
            const [fromUserId, toUserId] = roomId.split("-");
            let displayMessage = "No messages";
            if (
                (fromUserId === currentUser.uid && toUserId === userId) ||
                (fromUserId === userId && toUserId === currentUser.uid)
            ) {
                const lastMessage = chat[Object.keys(chat).pop()]; // Last message in chat
                if (lastMessage) {
                    // Determine the correct status icon based on the message's status
                    const statusIcon = document.querySelector(
                        `[data-user-id="${userId}"] .status-icon`
                    );
                    if (lastMessage.senderId === currentUserId) {
                        if (statusIcon) {
                            if (
                                !lastMessage.delivered &&
                                !lastMessage.readMsg
                            ) {
                                statusIcon.innerHTML = `<i class="ti ti-check"></i>`; // Single tick
                            } else if (
                                lastMessage.delivered &&
                                !lastMessage.readMsg
                            ) {
                                statusIcon.innerHTML = `<i class="ti ti-checks"></i>`; // Double ticks (delivered)
                            } else if (
                                lastMessage.delivered &&
                                lastMessage.readMsg
                            ) {
                                statusIcon.innerHTML = `<i class="ti ti-checks text-success">4</i>`; // Double ticks (read)
                            }
                        }
                    }
                }
                if (lastMessage && lastMessage.body) {
                    const messageType = lastMessage.attachmentType || "unknown";
                    if (messageType === 6) {
                        const originalMessage = await decryptlibsodiumMessage(
                            lastMessage.body
                        );
                        displayMessage = originalMessage || "No messages";
                    } else if (messageType === 5) {
                        displayMessage = "File sent";
                    } else if (messageType === 2) {
                        displayMessage = "Image sent";
                    } else if (messageType === 6) {
                        displayMessage = "Emoji";
                    } else if (messageType === 3) {
                        displayMessage = "Audio sent";
                    } else if (messageType === 8) {
                        displayMessage = "Audio Record sent";
                    } else if (messageType === 1) {
                        displayMessage = "Video sent";
                    } else {
                        displayMessage = "Unknown message type";
                    }
                    userMessage.textContent = displayMessage;
                    // Update the unseen message count

                    const lastMessageTimestamp = lastMessage?.timestamp;

                    timeElement.textContent = lastMessageTimestamp
                        ? moment(lastMessageTimestamp).calendar(null, {
                              sameDay: "h:mm A", // Today
                              lastDay: "[Yesterday]", // Yesterday
                              lastWeek: "MM/D/YYYY", // Last week
                              sameElse: "MM/D/YYYY", // Older dates
                          })
                        : "No time";
                }
            }
        });
        // Fetch last message and timestamp
        const chatRef1 = ref(database, `data/chats/${currentUserId}-${userId}`);
        const chatRef2 = ref(database, `data/chats/${userId}-${currentUserId}`);
        const chatQuery1 = query(
            chatRef1,
            orderByChild("timestamp"),
            limitToLast(1)
        );
        const chatQuery2 = query(
            chatRef2,
            orderByChild("timestamp"),
            limitToLast(1)
        );

        // Fetch messages from both possible paths
        Promise.all([get(chatQuery1), get(chatQuery2)]).then(
            async ([snapshot1, snapshot2]) => {
                let latestMessage = null;
                let latestTimestamp = 0;

                // Helper function to process a snapshot
                const processSnapshot = (snapshot) => {
                    if (snapshot.exists()) {
                        snapshot.forEach((childSnapshot) => {
                            const message = childSnapshot.val();
                            if (message.timestamp > latestTimestamp) {
                                latestMessage = message;
                                latestTimestamp = message.timestamp;
                            }
                        });
                    }
                };

                // Process both snapshots
                processSnapshot(snapshot1);
                processSnapshot(snapshot2);

                if (latestMessage) {
                    // Decrypt message if it's text
                    let displayMessage = "";
                    if (latestMessage.attachmentType === 6) {
                        try {
                            const originalMessage =
                                await decryptlibsodiumMessage(
                                    latestMessage.body
                                );
                            displayMessage = originalMessage;
                        } catch (error) {
                            displayMessage = "Unable to decrypt message";
                        }
                    } else {
                        displayMessage =
                            latestMessage.attachmentType === 2
                                ? "Image sent"
                                : latestMessage.attachmentType === 5
                                ? "File sent"
                                : latestMessage.attachmentType === 3
                                ? "Audio sent"
                                : latestMessage.attachmentType === 8
                                ? "Audio Record sent"
                                : latestMessage.attachmentType === 1
                                ? "Video sent"
                                : "Unknown message type";
                    }

                    // Update message and timestamp
                    userMessage.textContent = displayMessage;
                    timeElement.textContent =
                        formatDisplayTimestamp(latestTimestamp);
                }
            }
        );

        return userDiv;
    }

    function formatDisplayTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();

        // Reset time for accurate day comparison
        const today = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        // Check if the timestamp is today
        if (date >= today) {
            let hours = date.getHours();
            const minutes = date.getMinutes().toString().padStart(2, "0");
            const period = hours >= 12 ? "PM" : "AM";
            hours = hours % 12 || 12; // Convert 0 to 12 for midnight
            return `${hours}:${minutes} ${period}`;
        }
        // Check if the timestamp is yesterday
        else if (date >= yesterday) {
            return "Yesterday";
        }
        // Format as MM/DD/YYYY for older dates
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Month is 0-based
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
    }

    function addRecentChatUser(user, status, swiperList, userId) {
        // Remove active class from any currently active slide
        const activeSlide = swiperList.querySelector(".swiper-slide-active");
        if (activeSlide) {
            activeSlide.classList.remove("swiper-slide-active");
        }

        // Create new swiper slide for the recent chat user
        const swiperSlideDiv = document.createElement("div");
        swiperSlideDiv.classList.add("swiper-slide", "swiper-slide-active"); // Add both classes
        swiperSlideDiv.style.width = "59px"; // Set width
        swiperSlideDiv.style.marginRight = "15px"; // Set margin-right

        const swiperUserLink = document.createElement("a");
        swiperUserLink.classList.add("chat-status", "text-center");

        // Add event listener for when the recent chat is clicked
        swiperUserLink.onclick = () => {
            selectUser(userId); // Pass the user's ID to the selectUser function to open the chat
        };

        const avatarDiv = document.createElement("div");
        avatarDiv.classList.add("avatar", "avatar-lg", "d-block");

        // Conditionally apply the "online" class based on user's status
        if (status === "online") {
            avatarDiv.classList.add("online");
        }

        const userImage = document.createElement("img");
        userImage.src =
            user.profileImage || "assets/img/profiles/avatar-03.jpg";
        userImage.classList.add("rounded-circle");
        userImage.alt = "image";

        avatarDiv.appendChild(userImage);
        swiperUserLink.appendChild(avatarDiv);
        swiperSlideDiv.appendChild(swiperUserLink);
        swiperList.appendChild(swiperSlideDiv);
    }

    // Load user list (this is just a dummy function; replace it with actual user loading logic)
    function loadUserList() {
        const userList = document.getElementById("user-list");
        // Example user IDs (replace this with actual user IDs from your database)
        const users = [
            "LgiFT1vjulPNVm362448cl0lPRK2",
            "0sjGsWBJBBXgSPrEThaWAkZtvEB2",
            "oGSAVrc0r4aKsXyhGpFG7dP0Z4C2",
            "OlS3n2rKcnXIF6VOfOrSgxjiPZm2",
            "f5qG5kdEcbQf0RVgspqmXrQJx7s2",
            "IHswBXCKYUYRBwJq8Mp4DMQdzFp1",
        ];

        users.forEach((userId) => {
            const userElement = document.createElement("div");
            userElement.innerText = userId; // Display user ID (replace with actual user name if available)
            userElement.classList.add("chat-user");
            userElement.onclick = () => selectUser(userId); // Set click event to select user
            userList.appendChild(userElement);
        });
    }

    function getDeterministicChatRoomId(userIdA, userIdB) {
        const a = String(userIdA ?? "").trim();
        const b = String(userIdB ?? "").trim();
        if (a === b) {
            return `${a}-${b}`;
        }
        return a < b ? `${a}-${b}` : `${b}-${a}`;
    }

    // Function to select a user and display their chat details
    async function selectUser(userId) {
        const loggedInUserId = currentUserId;
        selectedUserId = userId; // Set the selected user ID
        const userDetails = await getUserDetails(userId);

        // Check if user exists in usersMap
        if (!usersMap[userId]) {
            return; // Exit the function early to avoid further errors
        }

        // Clear the chat box
        document.getElementById("chat-box").innerHTML = "";

        // Generate chatRoomId deterministically (A-B)
        const chatRoomId = getDeterministicChatRoomId(loggedInUserId, selectedUserId);

        // Start listening for messages with the selected user
        listenForMessages(loggedInUserId, selectedUserId, chatRoomId);

        // Fetch user status from the database
        const userStatusRef = ref(database, `data/users/${userId}/status`);
        onValue(userStatusRef, (snapshot) => {
            const userStatus = snapshot.val() || "offline"; // Default to offline if no status found
            updateUserDetails(userId, userStatus, loggedInUserId); // Pass status to update function
        });

        // Update the chat header with the selected user's name
        const contactsRef = ref(
            database,
            `data/contacts/${currentUser.uid}/${userId}`
        );
        onValue(contactsRef, (contactSnapshot) => {
            let displayName = ""; // Default to empty
            const contactData = contactSnapshot.val();
            const userName = document.querySelector(".chat-header h6"); // Get the element for the user's name

            if (contactData && contactData.firstName) {
                // If firstName exists in contacts
                displayName = `${contactData.firstName} ${contactData.lastName}`;
                userName.textContent = capitalizeFirstLetter(displayName);
            } else if (contactData && contactData.mobile_number) {
                // If mobile_number exists in contacts
                displayName = contactData.mobile_number;
                userName.textContent = capitalizeFirstLetter(displayName);
            } else {
                // Fallback to the `users` collection to fetch mobile_number
                const userRef = ref(database, `data/users/${userId}`);
                get(userRef)
                    .then((userSnapshot) => {
                        const userData = userSnapshot.val();
                        if (userData && userData.mobile_number) {
                            displayName = userData.mobile_number;
                            userName.textContent =
                                capitalizeFirstLetter(displayName);
                        } else {
                            // Fallback text if no data is available
                            userName.textContent = "Unknown User";
                        }
                    })
                    .catch((error) => {
                        console.error("Error fetching user data:", error);
                        userName.textContent = "Error Loading User";
                    });
            }
        });

        // Update the user's profile image
        const userImage =
            usersMap[userId].profileImage ||
            "assets/img/profiles/avatar-03.jpg";
        document.querySelector(".chat-header img").src = userImage;

        // Fetch KYC verified badge status
        const kycBadges = document.querySelectorAll('.kyc-badge, .contact-kyc-badge');
        kycBadges.forEach(b => b.style.display = 'none');
        if (userDetails && userDetails.email) {
            fetch(`/api/kyc-status?email=${encodeURIComponent(userDetails.email)}`)
                .then(r => r.json())
                .then(data => {
                    kycBadges.forEach(b => b.style.display = data.verified ? 'inline-flex' : 'none');
                })
                .catch(() => {});
        }

        // Show the chat container
        document
            .getElementById("middle")
            .style.setProperty("display", "flex", "important");

        // Hide the welcome container
        const welcomeContainer = document.getElementById("welcome-container");
        if (welcomeContainer) {
            welcomeContainer.style.setProperty("display", "none", "important");
        }

        // Show contact info and handle common groups
        showContactInfo(userId);
        handleShowCommonGroups();
        highlightActiveUser(userId);
    }

    function highlightActiveUser(userId) {
        // Select all user elements, adjust the selector based on your HTML structure
        const userElements = document.querySelectorAll("[data-user-id]");

        userElements.forEach((userElement) => {
            const id = userElement.getAttribute("data-user-id");

            // Remove active class from all users
            userElement.classList.remove("active");

            // Add active class to the selected user
            if (id === userId) {
                userElement.classList.add("active");
            }
        });
    }

    // Function to fetch user details based on userId
    async function getUserDetails(userId) {
        const userRef = ref(database, "data/users/" + userId); // Reference to the user data
        try {
            const snapshot = await get(userRef);
            if (snapshot.exists()) {
                const userData = snapshot.val();
                return userData; // Return the user data
            } else {
                return null; // Return null if no data is found
            }
        } catch (error) {
            return null; // Return null on error
        }
    }

    async function getExcludedLastSeenUsers(loggedInUserId) {
        const excludedUsersRef = ref(
            database,
            `data/users/${loggedInUserId}/excluded_last_seen_users`
        );
        const snapshot = await get(excludedUsersRef);
        const excludedUsers = snapshot.val() || [];
        return excludedUsers;
    }

    // Function to update user details in the chat header
    async function updateUserDetails(userId, status, loggedInUserId) {
        const excludedLastSeenUsers = await getExcludedLastSeenUsers(
            loggedInUserId
        );

        // Select the elements for user details in the chat header
        const userStatusElement = document.querySelector(
            ".chat-header .last-seen"
        );
        const userAvatarElement = document.querySelector(
            ".chat-header .avatar"
        );

        // Check if the current userId is in the excluded last seen users list
        if (excludedLastSeenUsers.includes(userId)) {
            // If user is excluded, do not show last seen status
            userStatusElement.textContent = ""; // Optionally show a message
            userAvatarElement.classList.remove("online"); // Ensure the avatar does not show online status
            return; // Exit the function early
        }

        // Capitalize first letter of the status
        let displayStatus;
        if (status === "offline") {
            displayStatus = "Offline"; // Use a friendly offline message
        } else {
            displayStatus = status.charAt(0).toUpperCase() + status.slice(1); // Capitalize online status
        }

        userStatusElement.textContent = displayStatus;

        // Clear previous status classes
        userStatusElement.classList.remove("text-success", "text-danger");

        // Update the user status text and style based on current status
        if (status === "online") {
            userStatusElement.classList.add("text-success"); // Add online class
            userAvatarElement.classList.add("online"); // Add online class to avatar
        } else if (status === "offline") {
            userStatusElement.classList.add("text-danger"); // Add offline class
            userAvatarElement.classList.remove("online"); // Remove online class from avatar
        }
    }

    function showLocalNotification(title, body) {
        if (Notification.permission === "granted") {
            const notification = new Notification(title, {
                body: body,
            });

            notification.onclick = () => {};
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then((permission) => {
                if (permission === "granted") {
                    showLocalNotification(title, body);
                }
            });
        }
    }

    // Function to sanitize Firebase keys
    function sanitizeKey(key) {
        return key.replace(/[.#$[\]]/g, "_"); // Replace invalid characters with underscores
    }

    function sendMessage(
        toUserId,
        messageText,
        messageType = "text",
        fileUrl = null,
        tempKey = null
    ) {
        if (!currentUser) {
            return;
        }

        // Check if the user is blocked
        isUserBlocked(currentUser.uid, toUserId).then((isBlocked) => {
            if (isBlocked) {
                Toastify({
                    text: "You have blocked this user. Unblock to send a message.",
                    duration: 3000,
                    gravity: "top",
                    position: "right",
                    backgroundColor: "#ff3d00",
                    stopOnFocus: true,
                }).showToast();
                return; // Exit the function if the user is blocked
            }
            isUserBlocked(toUserId, currentUser.uid).then(async (isBlocked) => {
                if (isBlocked) {
                    Toastify({
                        text: "You have blocked by this user. Unable to send a message",
                        duration: 3000,
                        gravity: "top",
                        position: "right",
                        backgroundColor: "#ff3d00",
                        stopOnFocus: true,
                    }).showToast();
                    return; // Exit the function if the user is blocked
                }

                // Create a sanitized chatRoomId
                const chatRoomId = getDeterministicChatRoomId(toUserId, currentUser.uid);
                const sanitizedChatRoomId = chatRoomId;
                const chatRoomIdA = `${currentUser.uid}-${toUserId}`;
                const chatRoomIdB = `${toUserId}-${currentUser.uid}`;
                const mirrorChatRoomId = sanitizedChatRoomId === chatRoomIdA ? chatRoomIdB : chatRoomIdA;
                let message;
                if (messageType == 6) {
                    message = {
                        body: messageText || null,
                        attachmentType: messageType, // Dynamically set attachmentType
                        text: messageText || null,
                        timestamp: Date.now(),
                        date: Date.now(),
                        delivered: false,
                        readMsg: false,
                        blocked: false,
                        replyId: "0",
                        senderId: currentUser.uid,
                        id: currentUser.uid,
                        recipientId: toUserId,
                        delete: "",
                        tempKey: tempKey,
                    };
                } else {
                    message = {
                        attachment: messageText || null,
                        attachmentType: messageType, // Dynamically set attachmentType
                        text: messageText || null,
                        timestamp: Date.now(),
                        date: Date.now(),
                        delivered: false,
                        readMsg: false,
                        blocked: false,
                        replyId: "0",
                        senderId: currentUser.uid,
                        id: currentUser.uid,
                        recipientId: toUserId,
                        delete: "",
                        tempKey: tempKey,
                    };
                }

                // Check if this is a reply to another message
                if (replyToMessage) {
                    const replyType =
                        replyToMessage.attachmentType || "unknown"; // Use the extracted type
                    let replyContent;
                    // Handle different types of reply content
                    switch (replyType) {
                        case "6":
                            replyContent = replyToMessage.body || "No content";
                            break;
                        case "2":
                        case "3":
                        case "1":
                        case "5":
                        case "8":
                            replyContent =
                                replyToMessage.body ||
                                `${replyType} content missing`;
                            break;
                        default:
                            replyContent = "Unsupported message type";
                    }

                    let encryptedReplyContent = await encryptAndLogMessage(
                        replyContent
                    ); // Declare it in a higher scope

                    // Prepare the new reply message
                    const replyMessage = {
                        ...message, // Include the original message data
                        replyId: replyToMessage.key || "0",
                        isReply: true,
                        replyContent: encryptedReplyContent, // Encrypted reply content
                        replyUser: replyToMessage.senderId || "unknown", // The user who sent the original message
                        replyType, // The type of the original message
                        replyTimestamp: replyToMessage.timestamp || Date.now(), // Timestamp of the original message
                        originalMessage: replyContent, // Original message content
                    };

                    // Push the reply message as a new message (primary), then mirror with the same key
                    const messageRefPrimary = ref(
                        database,
                        `data/chats/${sanitizedChatRoomId}`
                    );
                    const newReplyRef = push(messageRefPrimary);
                    const newReplyKey = newReplyRef.key;

                    set(newReplyRef, replyMessage)
                        .then(() => {
                            const mirrorReplyRef = ref(
                                database,
                                `data/chats/${mirrorChatRoomId}/${newReplyKey}`
                            );
                            set(mirrorReplyRef, replyMessage).catch(() => {});
                            // Close the reply box and clear the input field
                            closeReplyBox();
                            document.getElementById("message-input").value = "";
                            replyToMessage = null; // Reset the reply message reference
                        })
                        .catch((error) => {
                            console.error(
                                "Error sending reply message:",
                                error
                            );
                        });
                } else {
                    // If it's not a reply, create a new message
                    const messageRefPrimary = ref(
                        database,
                        `data/chats/${sanitizedChatRoomId}`
                    );
                    const newMessageRef = push(messageRefPrimary); // Generate a unique contact_id
                    const newKey = newMessageRef.key; // Get the unique key

                    const messageWithId = {
                        ...message, // Spread the original message properties
                        id: newKey, // Add the generated key as the id
                    };
                    let msg =  await decryptlibsodiumMessage(
                        message.body
                    );
                    const userMsgRef = ref(
                        database,
                        `data/users/${message.id}`
                    );
                    
                     const snapshot = await get(userMsgRef);
                     const excludedUsers = snapshot.val() || [];
                     
                    sendCallNotification(message.recipientId, msg, excludedUsers.mobile_number, message.senderId, message.senderId, "")

                    set(newMessageRef, messageWithId)
                        .then(() => {
                            // Mirror the message to the reverse chat room using the same key
                            const mirrorRef = ref(
                                database,
                                `data/chats/${mirrorChatRoomId}/${newKey}`
                            );
                            set(mirrorRef, messageWithId).catch(() => {});
                            // Message sent successfully
                            document.getElementById("message-input").value = ""; // Clear the input field
                        })
                        .catch((error) => {
                            console.error("Error sending message:", error);
                        });
                }
            });
        });
    }

    async function encryptAndLogMessage(replyContent) {
        try {
            const ciphertext = await encryptMessage(replyContent);
            if (ciphertext) {
                const encryptedReplyContent = ciphertext; // This works now because it's inside the async function
                return encryptedReplyContent;
            } else {
                console.error("Failed to retrieve encrypted text.");
            }
        } catch (error) {
            console.error("Encryption error:", error);
        }
    }

   async function displayMessage(message) {
        const chatBox = document.getElementById("chat-box");
        // Check if chatBox element exists
        if (!chatBox) {
            console.error("Chat box element not found!");
            return;
        }
        // Create a unique identifier for the message
        const messageId = `msg-${message.timestamp}-${message.senderId}`;
        const messageKey = message.key;
        const messageType = message.attachmentType;

        // Avoid duplicates by checking if message ID already exists in DOM
        if (document.querySelector(`[data-message-id="${messageId}"]`)) {
            console.log("Message already displayed (by ID):", messageId);
            return; // Skip adding if already displayed
        }
        if (document.querySelector(`[data-message-key="${messageKey}"]`)) {
            console.log("Message already displayed (by key):", messageKey);
            return; // Skip adding if already displayed
        }

        // Prepare the message container
        const messageElement = document.createElement("div");
        messageElement.classList.add("chats");
        messageElement.dataset.messageId = messageId;
        messageElement.dataset.messageKey = messageKey;
        messageElement.dataset.messageType = messageType;

        const userId = message.senderId;
        const contactsRef = ref(
            database,
            `data/contacts/${currentUser.uid}/${userId}`
        );
        const userRef = ref(database, `data/users/${userId}`); // Use message.from to get the correct user

        let senderName = ""; // Initialize with an empty string
        let profileImage = "assets/img/profiles/avatar-03.jpg"; // Default profile image

        // First, check if the sender is in the current user's contacts
        get(contactsRef)
            .then((contactsSnapshot) => {
                if (contactsSnapshot.exists()) {
                    const contactData = contactsSnapshot.val();
                    const contactFirstName =
                        contactData.firstName || contactData.mobile_number;
                    const contactLastName = contactData.lastName || "";
                    senderName =
                        `${contactFirstName} ${contactLastName}`.trim(); // Combine first and last name
                }

                // Regardless of contact status, fetch the user data for profile image and fallback name
                return get(userRef);
            })
            .then(async (userSnapshot) => {
                if (userSnapshot.exists()) {
                    const userData = userSnapshot.val();
                    profileImage = userData.image || profileImage;
                    if (!senderName) {
                        const userFirstName = userData.mobile_number || "";
                        const userLastName = userData.lastName || "";
                        senderName = `${userFirstName}`; // Combine first and last name
                    }
                }

                let originalMessageChat;

        if (message.isOptimistic) {
            // For optimistic messages, the body is already plain text.
            originalMessageChat = message.body;
        } else if ([6].includes(message.attachmentType)) {
            // For real messages, decrypt as before.
            const decryptedText = await decryptlibsodiumMessage(
                message.body
            );
            originalMessageChat = decryptedText;
        } else if (message.attachmentType != 6) {
            originalMessageChat = message.attachment.url;
        }

                const forwardedLabel = message.isForward
                    ? `<div class="forwarded-label" style="color: #FFF; font-size: 12px; margin-bottom: 5px;">
                            <i class="ti ti-arrow-forward-up me-2t"></i>
                            Forwarded
                       </div>`
                    : "";

                // Determine the message content based on the type
                let messageContent = "";
                let replyContent = "";
                let forwardContent = "";

                // Handle original message content
                switch (message.attachmentType) {
                    case 6:
						// If text looks like a Google Maps link, render as clickable link
						if (typeof originalMessageChat === "string" && /https?:\/\/(maps\.google\.com|goo\.gl)\//.test(originalMessageChat)) {
							messageContent = `<a href="${originalMessageChat}" target="_blank" rel="noopener noreferrer">${originalMessageChat}</a>`;
						} else {
							messageContent = originalMessageChat;
						}
                        break;
                    case 4:
                        // Map attachment: show static map image linking to live Google Maps
                        (function () {
                            const uniqueId = `mapPreview-${message.timestamp}`;
                            const att = message.attachment || message.attachment;
                            const mapImg = att?.url || originalMessageChat;
                            const lat = att?.lat;
                            const lng = att?.lng;
                            const liveLink = att?.link || (lat && lng ? `https://maps.google.com/?q=${lat},${lng}` : originalMessageChat);
                            messageContent = `
                            <div class="image-preview-container" id="${uniqueId}">
                                <a href="${liveLink}" target="_blank" rel="noopener noreferrer">
                                    <img src="${mapImg}" alt="Location Map" class="message-image-preview video-style">
                                </a>
                            </div>`;
                        })();
                        break;
                    case 2:
                        const uniqueId = `imagePreview-${message.timestamp}`;
						// If the image is a Google Static Map, wrap it with a link to open live map
						let wrappedImageHtml = `
							<img src="${originalMessageChat}" alt="Image Preview" class="message-image-preview video-style">
						`;
						if (typeof originalMessageChat === "string" && originalMessageChat.includes("maps.googleapis.com/maps/api/staticmap")) {
							// Try to extract coordinates from URL
							let latLngMatch = originalMessageChat.match(/center=([-0-9.]+),([-0-9.]+)/);
							if (!latLngMatch) {
								latLngMatch = originalMessageChat.match(/markers=[^|]*%7C([-0-9.]+),([-0-9.]+)/);
							}
							if (latLngMatch) {
								const lat = latLngMatch[1];
								const lng = latLngMatch[2];
								const liveLink = `https://maps.google.com/?q=${lat},${lng}`;
								wrappedImageHtml = `<a href="${liveLink}" target="_blank" rel="noopener noreferrer">${wrappedImageHtml}</a>`;
							}
						}
						messageContent = `
						<div class="image-preview-container" id="${uniqueId}">
							${wrappedImageHtml}
						</div>`;
                        setTimeout(() => {
                            const imageContainer =
                                document.getElementById(uniqueId);
							if (imageContainer) {
								// If wrapped with link (map), let the anchor handle the click; else open preview
								const hasAnchor = !!imageContainer.querySelector('a');
								if (!hasAnchor) {
									imageContainer.addEventListener("click", () =>
										openImagePreview(originalMessageChat)
									);
								}
							}
                        }, 0);
                        break;
                    case 3:
                        messageContent = `<audio controls width="240" src="${originalMessageChat}"></audio>`;
                        break;
                    case 8:
                        messageContent = `<audio controls width="240" src="${originalMessageChat}"></audio>`;
                        break;
                    case 1:
                        messageContent = `<video controls width="200" src="${originalMessageChat}"></video>`;
                        break;
                    case 5:
                        messageContent = `<a href="${originalMessageChat}" target="_blank" download>Download File</a>`;
                        break;
                    default:
                        messageContent = originalMessageChat;
                }

                // If the message is a reply, look up the original message, decrypt it, and show the content
                if (message.replyId !== "0") {
                    try {
                        // Generate both possible chat room IDs
                        const chatRoomId1 = `${currentUser.uid}-${selectedUserId}`; // A-B
                        const chatRoomId2 = `${selectedUserId}-${currentUser.uid}`; // B-A

                        let originalMessageRef = null;
                        let messageSnapshot = null;

                        // Try fetching from the first possible ID
                        originalMessageRef = ref(
                            database,
                            `data/chats/${chatRoomId1}/${message.replyId}`
                        );
                        messageSnapshot = await get(originalMessageRef).catch(
                            () => null
                        );

                        if (!messageSnapshot?.exists()) {
                            // If not found, try the reverse ID
                            originalMessageRef = ref(
                                database,
                                `data/chats/${chatRoomId2}/${message.replyId}`
                            );
                            messageSnapshot = await get(
                                originalMessageRef
                            ).catch(() => null);
                        }

                        if (messageSnapshot?.exists()) {
                            console.log(
                                "Message found in:",
                                originalMessageRef.path
                            );
                            // originalMessageRef now contains the correct reference
                            // messageSnapshot contains the data
                        } else {
                            console.error(
                                "Message not found in either chat room ID!"
                            );
                            originalMessageRef = null; // or handle error case
                        }

                        // 2. Fetch the original message from the database
                        const snapshot = await get(originalMessageRef);

                        let contentToDecrypt;

                        // 3. Check if the message exists and get its encrypted body
                        if (snapshot.exists()) {
                            const originalMessageData = snapshot.val();
                            contentToDecrypt = originalMessageData.body; // Use the body of the fetched message
                        } else {
                            contentToDecrypt = "[Original message not found]";
                        }

                        // 4. Decrypt the fetched message body
                        const originalReplyMessage =
                            await decryptlibsodiumMessage(contentToDecrypt);
                        const decryptedReplyContent =
                            originalReplyMessage || "";

                        const sanitizedReplyContent =
                            decryptedReplyContent.trim();

                        // 5. Use the original message's type for correct rendering
                        const originalMessageType = snapshot.exists()
                            ? snapshot.val().attachmentType.toString()
                            : "6";

                        switch (originalMessageType) {
                            case "6": // Text
                                replyContent = `<div>${sanitizedReplyContent}</div>`;
                                break;
                            case "2": // Image
                                replyContent = `<img src="${sanitizedReplyContent}" class="reply-image" style="max-height: 70px; border-radius: 5px;" alt="Image">`;
                                break;
                            case "3": // Audio
                            case "8": // Audio Record
                                replyContent = `<div><i class="ti ti-microphone"></i> Audio</div>`;
                                break;
                            case "1": // Video
                                replyContent = `<div><i class="ti ti-video"></i> Video</div>`;
                                break;
                            case "5": // File/Document
                                replyContent = `<div><i class="ti ti-file"></i> File</div>`;
                                break;
                            default:
                                replyContent = `<div>${sanitizedReplyContent}</div>`;
                        }
                    } catch (error) {
                        console.error("Error processing reply message:", error);
                        replyContent = "[Decryption Error]";
                    }
                }

                const messageBody = `
                <div class="message-content-text">${messageContent}</div>`;

                // Build the message element with both original and reply message
                const formattedTime = formatTimestamp(message.timestamp);

                let statusIcon = "";
        if (message.senderId === currentUserId) {
            if (message.isOptimistic) {
                // Use a clock icon for the "sending" state.
                // Make sure your icon library (e.g., Tabler Icons) has 'ti-clock'.
                statusIcon = `<i class="ti ti-clock"></i>`;
            } else {
                // This is the existing logic for real messages
                if (!message.delivered && !message.readMsg) {
                    statusIcon = `<i class="ti ti-check"></i>`; // Sent (single tick)
                } else if (message.delivered && !message.readMsg) {
                    statusIcon = `<i class="ti ti-checks"></i>`; // Delivered (double ticks)
                } else if (message.delivered && message.readMsg) {
                    statusIcon = `<i class="ti ti-checks text-success">5</i>`; // Read (green double ticks)
                }
            }
        }

                // Check if the message is cleared for the current user
                if (
                    message.clearedFor &&
                    message.clearedFor.includes(currentUser.uid)
                ) {
                    return; // Skip displaying the message
                }

                if (
                    message.deletedFor &&
                    message.deletedFor.includes(currentUser.uid)
                ) {
                    return; // Skip displaying the message
                }

                if (message.senderId === currentUser.uid) {
                    messageElement.classList.add("chats-right"); // Align message to the right
                    messageElement.innerHTML = `
                        <div class="chat-content">
                            <div class="chat-profile-name text-end">
                                <h6>You<i class="ti ti-circle-filled fs-7 mx-2"></i><span class="chat-time">${formattedTime}</span>
                                <span class="msg-read">${statusIcon}</span>
                                </h6> 
                            </div>
                            <div class="chat-info">
                                <div class="chat-actions">
                                    <a class="#" href="#" data-bs-toggle="dropdown">
                                        <i class="ti ti-dots-vertical"></i>
                                    </a>
                                    <ul class="dropdown-menu dropdown-menu-end p-3">
                                        <li><a class="dropdown-item reply-btn" href="#"><i class="ti ti-corner-up-left me-2"></i>Reply</a></li>
                                        <li><a class="dropdown-item forward-btn" href="#"><i class="ti ti-arrow-forward-up me-2"></i>Forward</a></li>
                                        <li><a class="dropdown-item delete-btn" href="#" id="delete-btn" data-bs-toggle="modal" data-bs-target="#message-delete"><i class="ti ti-trash me-2"></i>Delete</a></li>
                                    </ul>
                                </div>   
                                <div class="message-content">
                                 ${forwardedLabel} <!-- Forwarded Label -->
                                 ${
                                     message.replyId != "0"
                                         ? `<div class="message-reply">${replyContent}</div>`
                                         : ""
                                 } <!-- Reply Content only if it's a reply -->
                                    ${messageBody} <!-- Default Message -->
                                </div>   
                            </div>
                        </div>
                        <div class="chat-avatar">
                            <img src="${profileImage}" class="rounded-circle" alt="image">
                        </div>
                    `;
                } else {
                    messageElement.innerHTML = `
                        <div class="chat-avatar">
                            <img src="${profileImage}" class="rounded-circle" alt="image">
                        </div>
                        <div class="chat-content">
                            <div class="chat-profile-name">
                                <h6>${senderName} <i class="ti ti-circle-filled fs-7 mx-2"></i><span class="chat-time">${formattedTime}</span>
                                </h6>
                            </div>
                            <div class="chat-info">
                                <div class="message-content">
                                 ${forwardedLabel} <!-- Forwarded Label -->
                                 ${
                                     message.replyId != "0"
                                         ? `<div class="message-reply">${replyContent}</div>`
                                         : ""
                                 } <!-- Reply Content only if it's a reply -->
                                    ${messageBody} <!-- Default Message -->
                                </div>   
                                <div class="chat-actions">
                                    <a class="#" href="#" data-bs-toggle="dropdown">
                                        <i class="ti ti-dots-vertical"></i>
                                    </a>
                                     <ul class="dropdown-menu dropdown-menu-end p-3">
                                        <li><a class="dropdown-item reply-btn" href="#"><i class="ti ti-corner-up-left me-2"></i>Reply</a></li>
                                        <li><a class="dropdown-item forward-btn" href="#"><i class="ti ti-arrow-forward-up me-2"></i>Forward</a></li>
                                        <li><a class="dropdown-item delete-btn" href="#" id="delete-btn" data-bs-toggle="modal" data-bs-target="#message-delete"><i class="ti ti-trash me-2"></i>Delete</a></li>
                                    </ul>
                                </div> 
                            </div>
                        </div>
                    `;
                }

                // Insert the message in the correct order by timestamp
                const allMessages = Array.from(chatBox.children);
                const index = allMessages.findIndex(
                    (msgElement) =>
                        parseInt(msgElement.dataset.messageId.split("-")[1]) >
                        message.timestamp
                );
                if (index !== -1) {
                    chatBox.insertBefore(messageElement, allMessages[index]);
                    console.log("Message inserted at position:", index);
                } else {
                    chatBox.appendChild(messageElement); // Append if it's the latest message
                    console.log("Message appended to end");
                }

                // Scroll to the bottom
                chatBox.scrollTop = chatBox.scrollHeight;
                console.log("Message successfully added to DOM");
            })
            .catch((error) => {
                console.error("Error loading message:", error);
            });
    }

    let replyToMessage = null; // To store the replied message content

    // Event listener for the reply button
    document.addEventListener("click", (e) => {
        if (e.target.classList.contains("reply-btn")) {
            const messageElement = e.target.closest(".chats");

            // Extract user and type information
            const replyUser = "";
            const replyType = messageElement.dataset.messageType || "6"; // Extract type from a data attribute

            let replyContent = ""; // To hold the reply content
            let mediaUrl = null; // To hold the media URL if applicable

            // Handle different message types
            if (replyType === "6") {
                replyContent = messageElement
                    .querySelector(".message-content > div:not(.message-reply)")
                    .innerText.trim();
            } else if (replyType === "2") {
                const imgElement = messageElement.querySelector(
                    ".message-content img"
                );
                if (imgElement) {
                    mediaUrl = imgElement.src;
                    replyContent = `<img src="${mediaUrl}" alt="Image Reply" class="reply-image" style="max-width: 100px; max-height: 100px;">`;
                }
            } else if (replyType === "1") {
                const videoElement = messageElement.querySelector(
                    ".message-content video"
                );
                if (videoElement) {
                    mediaUrl = videoElement.src;
                    replyContent = `<video src="${mediaUrl}" controls class="reply-video" style="max-width: 100px; max-height: 100px;"></video>`;
                }
            } else if (replyType === "3") {
                const audioElement = messageElement.querySelector(
                    ".message-content audio"
                );
                if (audioElement) {
                    mediaUrl = audioElement.src;
                    replyContent = `<audio src="${mediaUrl}" controls class="reply-audio"></audio>`;
                }
            } else if (replyType === "5") {
                const fileElement =
                    messageElement.querySelector(".message-content a");
                if (fileElement) {
                    mediaUrl = fileElement.href;
                    replyContent = `<a href="${mediaUrl}" target="_blank" download class="reply-file">Download File</a>`;
                }
            }

            // Update the reply box content
            const replyDiv = document.getElementById("reply-div");
            const replyContentElement = document.getElementById("replyContent");
            const replyUserElement = document.getElementById("replyUser");

            if (replyDiv && replyContentElement && replyUserElement) {
                replyDiv.style.display = "flex";
                replyUserElement.innerText = replyUser;

                // Use innerHTML for media types, innerText for text
                if (["2", "1", "3", "8", "5"].includes(replyType)) {
                    replyContentElement.innerHTML = replyContent;
                } else {
                    replyContentElement.innerText = replyContent;
                }
            } else {
                console.error(
                    "Reply box or content elements not found in the DOM."
                );
            }

            // Store the replied message with necessary details
            replyToMessage = {
                key: messageElement.dataset.messageKey,
                body: replyContent,
                senderId: replyUser,
                attachmentType: replyType, // Store the type of the original message
                media: mediaUrl,
            };

            // console.log(replyToMessage); // Debugging output
        }
    });

    document.getElementById("closeReply").onclick = () => {
        closeReplyBox();
    };

    // Close Reply Box
    function closeReplyBox() {
        replyToMessage = null; // Reset the replied message
        document.getElementById("reply-div").style.display = "none";
    }

    let forwardContent = null;
    document.addEventListener("click", (e) => {
        if (e.target.classList.contains("forward-btn")) {
            const messageElement = e.target.closest(".chats");
            const messageContentElement =
                messageElement.querySelector(".message-content");
            const messageKey = messageElement.getAttribute("data-message-key");

            let forwardContent = {
                key: messageKey,
                body: "",
                media: null,
            };

            const forwardedLabel =
                messageContentElement.querySelector(".forwarded-label");
            if (forwardedLabel) {
                forwardedLabel.remove();
            }

            const defaultMessageContent = messageContentElement.querySelector(
                "div:not(.message-reply)"
            );
            if (defaultMessageContent) {
                forwardContent.body = defaultMessageContent.textContent.trim(); // Safely handle emojis and text
            }

            const file = messageContentElement.querySelector("a");
            if (file) {
                const fileURL = file.getAttribute("href");
                forwardContent.body = {
                    url: fileURL,
                };
                forwardContent.media = {
                    attachmentType: 5,
                    src: fileURL,
                };
            } else if (!forwardContent.body) {
                const audio = messageContentElement.querySelector("audio");
                const video = messageContentElement.querySelector("video");
                const img = messageContentElement.querySelector("img");

                if (audio) {
                    forwardContent.body = {
                        url: audio.getAttribute("src"),
                    };

                    forwardContent.media = {
                        attachmentType: 3,
                        src: audio.getAttribute("src"),
                    };
                } else if (video) {
                    forwardContent.body = {
                        url: video.getAttribute("src"),
                    };

                    forwardContent.media = {
                        attachmentType: 1,
                        src: video.getAttribute("src"),
                    };
                } else if (img) {
                    forwardContent.body = {
                        url: img.getAttribute("src"),
                    };

                    forwardContent.media = {
                        attachmentType: 2,
                        src: img.getAttribute("src"),
                    };
                } else {
                    forwardContent.body = "This is a media message"; // Default for non-media
                }
            }

            getUsersFromContacts().then((users) => {
                showForwardModal(users, forwardContent);
            });
        }
    });

    // Function to fetch users from contacts (Firebase example)
    function getUsersFromContacts() {
        return new Promise((resolve, reject) => {
            const usersRef = ref(database, `data/contacts/${currentUser.uid}/`);
            get(usersRef)
                .then((snapshot) => {
                    const users = [];
                    snapshot.forEach((childSnapshot) => {
                        const userData = childSnapshot.val();
                        users.push({
                            id: childSnapshot.key,
                            firstName: userData.firstName,
                            lastName: userData.lastName,
                            mobile_number: userData.mobile_number,
                            email: userData.email,
                            avatar:
                                userData.avatar ||
                                "assets/img/profiles/avatar-03.jpg",
                        });
                    });
                    resolve(users);
                })
                .catch((error) => reject(error));
        });
    }

    function showForwardModal(users, forwardContent) {
        const modalContainer = new bootstrap.Modal(
            document.getElementById("forward-modal")
        );
        const userListContainer = document.querySelector(
            "#forward-modal .user-list"
        );
        userListContainer.innerHTML = "";

        users.forEach((user) => {
            const userItem = document.createElement("div");
            userItem.classList.add("user-item");

            const fullName =
                user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user.mobile_number;

            userItem.innerHTML = `
                <input type="checkbox" class="user-checkbox" data-user-id="${user.id}">
                <img src="${user.avatar}" alt="${fullName}" class="user-avatar avatar avatar-lg avatar-rounded" width="30">
                <span>${fullName}</span>
            `;

            userListContainer.appendChild(userItem);
        });

        modalContainer.show();

        document.getElementById("send-forward").onclick = () => {
            const selectedUsers = [];
            const checkboxes = document.querySelectorAll(
                ".user-checkbox:checked"
            );

            checkboxes.forEach((checkbox) => {
                selectedUsers.push(checkbox.getAttribute("data-user-id"));
            });

            if (selectedUsers.length > 0 && forwardContent) {
                selectedUsers.forEach((userId) => {
                    sendForwardMessage(
                        userId,
                        forwardContent.body,
                        forwardContent.media
                            ? forwardContent.media.attachmentType
                            : 6,
                        forwardContent.key
                    );
                });
                forwardContent = null; // Reset forward content after sending
            }

            modalContainer.hide();
        };
    }

    function sendForwardMessage(
        toUserId,
        forwardText,
        messageType = 6,
        originalMessageKey = null
    ) {
        if (!currentUser) {
            return;
        }

        isUserBlocked(currentUser.uid, toUserId)
            .then((isBlocked) => {
                if (isBlocked) {
                    Toastify({
                        text: "You have blocked this user. Unblock to send a message.",
                        duration: 3000,
                        gravity: "top",
                        position: "right",
                        backgroundColor: "#ff3d00",
                        stopOnFocus: true,
                    }).showToast();
                    return;
                }

                isUserBlocked(toUserId, currentUser.uid).then(
                    async (isBlocked) => {
                        if (isBlocked) {
                            Toastify({
                                text: "You have blocked by this user. Unable to send a message",
                                duration: 3000,
                                gravity: "top",
                                position: "right",
                                backgroundColor: "#ff3d00",
                                stopOnFocus: true,
                            }).showToast();
                            return; // Exit the function if the user is blocked
                        }

                        const chatRoomId = [currentUser.uid, toUserId]
                            .sort()
                            .join("-");

                        const message = {
                            attachmentType: messageType, // Dynamically set attachmentType
                            timestamp: Date.now(),
                            date: Date.now(),
                            delivered: false,
                            readMsg: false,
                            blocked: false,
                            replyId: "0",
                            senderId: currentUser.uid,
                            recipientId: toUserId,
                            delete: "",
                            isForward: true,
                            originalMessageKey: originalMessageKey,
                        };

                        if (messageType === 6) {
                            const encryptedForwardText = await encryptMessage(
                                forwardText
                            );
                            message.body = encryptedForwardText;
                        } else {
                            message.attachment = forwardText;
                        }

                        const messageRef = ref(
                            database,
                            `data/chats/${chatRoomId}`
                        );
                        push(messageRef, message)
                            .then((newMessageRef) => {
                                // Message forwarded successfully
                            })
                            .catch((error) => {
                                console.error(
                                    "Error forwarding message:",
                                    error
                                );
                            });
                    }
                );
            })
            .catch((error) => {
                console.error("Error checking if user is blocked:", error);
            });
    }

    document.addEventListener("click", (e) => {
        if (e.target.classList.contains("delete-btn")) {
            const messageElement = e.target.closest(".chats");
            const messageKey = messageElement.dataset.messageKey; // Unique message key
            const chatRoomId = getDeterministicChatRoomId(currentUserId, selectedUserId); // Generate chatRoomId dynamically

            // Populate hidden inputs in the form
            document.getElementById("message-to-delete").value = messageKey;
            document.getElementById("room-id").value = chatRoomId;

            if (!messageKey || !chatRoomId) {
                return;
            }

            const messageRef = ref(
                database,
                `data/chats/${chatRoomId}/${messageKey}`
            );

            // Fetch the message details from Firebase
            get(messageRef)
                .then((snapshot) => {
                    if (snapshot.exists()) {
                        const message = snapshot.val();
                        // Check if senderId matches current user ID
                        if (message.senderId == currentUserId) {
                            // Hide the "Delete For Everyone" option
                            const deleteForEveryoneDiv =
                                document.getElementById("delete-for-everyone");
                            if (deleteForEveryoneDiv) {
                                deleteForEveryoneDiv.style.display = "block";
                            }
                        } else {
                            // Ensure the "Delete For Everyone" option is visible
                            const deleteForEveryoneDiv =
                                document.getElementById("delete-for-everyone");
                            if (deleteForEveryoneDiv) {
                                deleteForEveryoneDiv.style.display = "none";
                            }
                        }
                    } else {
                        console.error("Message not found in Firebase");
                    }
                })
                .catch((error) => {
                    console.error("Error fetching message details:", error);
                });
        }
    });

    // Delete message for the current user
    function deleteForMe(messageElement, messageKey, chatRoomId) {
        const messageRef = ref(
            database,
            `data/chats/${chatRoomId}/${messageKey}`
        );

        // Read the current value of the `deletedFor` field
        get(messageRef)
            .then((snapshot) => {
                if (snapshot.exists()) {
                    const messageData = snapshot.val();
                    const deletedFor = messageData.deletedFor || []; // Existing array or initialize empty array

                    // Only update if the current user is not already in the `deletedFor` array
                    if (!deletedFor.includes(currentUserId)) {
                        const updates = {};
                        updates[`deletedFor`] = [...deletedFor, currentUserId];

                        // Update the message with the new `deletedFor` value
                        return update(messageRef, updates);
                    } else {
                        console.log(
                            "Message already marked as deleted for this user."
                        );
                        return Promise.resolve(); // No update needed
                    }
                } else {
                    console.error("Message does not exist.");
                }
            })
            .then(() => {
                // Remove the message locally after the update
                if (messageElement) {
                    messageElement.remove();
                } else {
                    console.error("Message element not found.");
                }
            })
            .catch((error) => {
                console.error("Error deleting message for me:", error);
            });
    }

    // Delete message for everyone
    function deleteForEveryone(messageElement, messageKey, chatRoomId) {
        const messageRef = ref(
            database,
            `data/chats/${chatRoomId}/${messageKey}`
        );
        remove(messageRef)
            .then(() => {
                if (messageElement) {
                    messageElement.remove(); // Remove the element locally
                } else {
                    console.error("Message element not found.");
                }
            })
            .catch((error) =>
                console.error("Error deleting message for everyone:", error)
            );
    }

    // Form submission handler
    document
        .getElementById("delete-chat-form")
        .addEventListener("submit", (e) => {
            e.preventDefault(); // Prevent form default behavior

            const messageKey =
                document.getElementById("message-to-delete").value;
            const chatRoomId = document.getElementById("room-id").value;
            const action = document.querySelector(
                'input[name="delete-chat"]:checked'
            ).id;

            const messageElement = document.querySelector(
                `[data-message-key="${messageKey}"]`
            );

            if (action === "delete-for-me") {
                deleteForMe(messageElement, messageKey, chatRoomId);
            } else if (action === "delete-for-everyone") {
                deleteForEveryone(messageElement, messageKey, chatRoomId);
            } else {
                console.error("Unknown action.");
            }

            // Close the modal
            const modal = bootstrap.Modal.getInstance(
                document.getElementById("message-delete")
            );
            modal.hide();
            document.body.classList.remove("modal-open");
            document.querySelector(".modal-backdrop").remove();
        });

    function openImagePreview(imageUrl) {
        // Remove any existing modal if it's open
        let existingModal = document.getElementById("image-preview-modal");
        if (existingModal) {
            existingModal.remove();
        }

        // Create a new modal container
        const modal = document.createElement("div");
        modal.id = "image-preview-modal";
        modal.classList.add("image-preview-modal");

        // Add modal content (image, close button, and download button)
        modal.innerHTML = `
        <div class="image-modal-content">
            <img src="${imageUrl}" alt="Image Preview">
            <div class="image-modal-header">
                <span class="image-close-btn">✖</span>
            </div>
        </div>
    `;

        // Append the modal to the body
        document.body.appendChild(modal);

        // Attach event listener to close button
        const closeButton = modal.querySelector(".image-close-btn");
        closeButton.addEventListener("click", closeImagePreview);

        // Function to close the image preview modal
        function closeImagePreview() {
            modal.remove();
        }
    }
    // Function to check if the user is blocked
    function isUserBlocked(currentUserId, otherUserId) {
        return get(
            ref(database, `data/blocked_users/${currentUserId}/${otherUserId}`)
        )
            .then((snapshot) => {
                return snapshot.exists(); // Returns true if the user is blocked
            })
            .catch((error) => {
                return false; // Default to not blocked on error
            });
    }

    async function decryptMessage(encryptedText, secretKey) {
        const originalMessage = await decryptlibsodiumMessage(encryptedText);
        return originalMessage; // Return the decrypted message
    }

    const messagenotificationSound = new Audio(
        "assets/sounds/message-notification-sound.mp3"
    ); // Replace with your sound file path
    const messagenotificationSoundSwitch = document.getElementById(
        "messagenotificationSoundSwitch"
    );
    let isMessageNotificationSoundEnabled = false;

    // Load saved state from localStorage and set the switch accordingly
    window.addEventListener("load", function () {
        const savedSetting = localStorage.getItem("messageNotificationSound");
        if (savedSetting === "enabled") {
            isMessageNotificationSoundEnabled = true;
            messagenotificationSoundSwitch.checked = true; // Set the switch to enabled
        } else {
            isMessageNotificationSoundEnabled = false;
            messagenotificationSoundSwitch.checked = false; // Set the switch to disabled
        }
    });

    // Event listener for the sound toggle switch
    messagenotificationSoundSwitch.addEventListener("change", function () {
        isMessageNotificationSoundEnabled = this.checked;

        // Save the current state in localStorage
        if (isMessageNotificationSoundEnabled) {
            localStorage.setItem("messageNotificationSound", "enabled");
            Toastify({
                text: "Message Notification Sound Enabled!",
                duration: 3000,
                gravity: "top",
                position: "right",
                backgroundColor: "#28a745",
            }).showToast();
        } else {
            localStorage.setItem("messageNotificationSound", "disabled");
            Toastify({
                text: "Message Notification Sound Disabled!",
                duration: 3000,
                gravity: "top",
                position: "right",
                backgroundColor: "#dc3545",
            }).showToast();
        }
    });

    // Play the message sent sound (to be called from chat.js)
    function playMessageSentSound() {
        if (isMessageNotificationSoundEnabled) {
            messagenotificationSound.play().catch((error) => {});
        }
    }

    // Play the message received sound (can be called in other scripts too)
    function playMessageReceivedSound() {
        if (isMessageNotificationSoundEnabled) {
            messagenotificationSound.play().catch((error) => {});
        }
    }

    function initializeMessageListener() {
        const messageRef = ref(database, "data/chats");

        // Attach a listener for real-time messages
        onChildAdded(messageRef, (snapshot) => {
            const message = snapshot.val();
            const isMessageForCurrentUser =
                message.recipientId === currentUser.uid;

            // Check if the message is for the current user
            if (
                message.recipientId === currentUser.uid ||
                message.senderId === currentUser.uid
            ) {
                // Display the message regardless of selection
                // displayMessage(message);

                // Notify if the message has not been seen
                if (!message.seen && isMessageForCurrentUser) {
                    // Play the sound for new messages
                    playMessageReceivedSound();

                    // Show desktop notification for the new message
                    const sender = usersMap[message.senderId];
                    const senderName = sender
                        ? sender.userName
                        : message.senderId;
                    const decryptedMessage = decryptMessage(
                        message.body,
                        "89def69f0bdddc995078037539dc6ef4f0bdbdd3fa04ef2d11eea30779d72ac6"
                    );

                    // Show notification
                    showLocalNotification(
                        "New Message from " + senderName,
                        decryptedMessage
                    );

                    // Mark message as seen
                    // markMessageAsSeen(chatRoomId, snapshot.key);
                    // updateMessageCount(message.from);
                }
            }
        });
    }

    initializeMessageListener();

    let messageListener = null;
    const displayedMessages = new Set(); // Keep track of displayed message keys

  function listenForMessages(fromUserId, toUserId, chatRoomId) {
        // Remove the previous listener before adding a new one
        if (messageListener) {
            messageListener(); // Detach previous listener
            messageListener = null; // Reset the listener reference
        }

        // Clear the displayed messages set for the new chat
        displayedMessages.clear();

        // Generate both possible chat room IDs
        const chatRoomId1 = `${fromUserId}-${toUserId}`; // A-B
        const chatRoomId2 = `${toUserId}-${fromUserId}`; // B-A
        
        console.log("Starting to listen for messages between:", fromUserId, "and", toUserId);
        console.log("Chat room IDs:", chatRoomId1, "and", chatRoomId2);

        // Create references to both possible chat paths
        const messageRef1 = ref(database, `data/chats/${chatRoomId1}`);
        const messageRef2 = ref(database, `data/chats/${chatRoomId2}`);

        // Function to handle new messages
        const handleNewMessage = (snapshot, chatRoomPath) => {
            const message = snapshot.val();
            const messageKey = snapshot.key;

            if (message.senderId === currentUser.uid && message.tempKey) {
                const optimisticElement = document.querySelector(`[data-message-key="${message.tempKey}"]`);
                if (optimisticElement) {
                    // It exists! Let's update it instead of creating a new one.
                    optimisticElement.dataset.messageKey = messageKey; // Update to the real key from Firebase
                    optimisticElement.dataset.messageId = `msg-${message.timestamp}-${message.senderId}`;

                    // Update the status icon from 'sending' (clock) to 'sent' (single check)
                    const statusElement = optimisticElement.querySelector('.msg-read');
                    if (statusElement) {
                        statusElement.innerHTML = `<i class="ti ti-check"></i>`; // Sent icon
                    }

                    // Mark as processed so it doesn't get added again
                    displayedMessages.add(messageKey);
                    return; // We're done, so we exit the function here.
                }
            }
            
            // Ensure we only process the message once
            if (!displayedMessages.has(messageKey)) {
                displayedMessages.add(messageKey); 
                message.key = messageKey; 
                
                if (
                    (message.senderId === fromUserId &&
                        message.recipientId === toUserId) ||
                    (message.senderId === toUserId &&
                        message.recipientId === fromUserId)
                ) {
                    console.log("New message received:", message);
                    console.log("Message sender:", message.senderId, "recipient:", message.recipientId);
                    console.log("Expected from:", fromUserId, "to:", toUserId);
                    displayMessage(message);

                    // Handle new message notifications for the current user
                    if (!message.seen && message.recipientId === currentUser.uid) {
                        playMessageReceivedSound();
                        markMessageAsSeen(chatRoomPath, messageKey);
                    }
                }
            }
        };

        // Function to handle message updates
        const handleMessageUpdate = (snapshot, chatRoomPath) => {
            const updatedMessage = snapshot.val();
            const messageKey = snapshot.key;

            // Update the message only if it is already displayed
            if (displayedMessages.has(messageKey)) {
                const existingMessageElement = document.querySelector(
                    `[data-message-key="${messageKey}"]`
                );
                if (existingMessageElement) {
                    // Remove and redisplay the updated message
                    existingMessageElement.remove();
                    updatedMessage.key = messageKey; // Include the unique message key
                    displayMessage(updatedMessage);
                }
            }
        };

        // Attach listeners to both possible chat paths
        const listener1 = onChildAdded(messageRef1, (snapshot) => {
            handleNewMessage(snapshot, chatRoomId1);
        });

        const listener2 = onChildAdded(messageRef2, (snapshot) => {
            handleNewMessage(snapshot, chatRoomId2);
        });

        // Attach update listeners to both paths
        const updateListener1 = onChildChanged(messageRef1, (snapshot) => {
            handleMessageUpdate(snapshot, chatRoomId1);
        });

        const updateListener2 = onChildChanged(messageRef2, (snapshot) => {
            handleMessageUpdate(snapshot, chatRoomId2);
        });

        // Store all listeners so they can be detached later
        messageListener = () => {
            listener1();
            listener2();
            updateListener1();
            updateListener2();
        };

        // Load existing messages from both paths
        Promise.all([
            get(messageRef1),
            get(messageRef2)
        ]).then(([snapshot1, snapshot2]) => {
            const allMessages = [];
            
            console.log("Loading existing messages...");
            console.log("Snapshot1 exists:", snapshot1.exists(), "Snapshot2 exists:", snapshot2.exists());
            
            // Collect messages from first path
            if (snapshot1.exists()) {
                snapshot1.forEach((childSnapshot) => {
                    const message = childSnapshot.val();
                    message.key = childSnapshot.key;
                    allMessages.push(message);
                });
                console.log("Messages from path1:", snapshot1.numChildren());
            }
            
            // Collect messages from second path
            if (snapshot2.exists()) {
                snapshot2.forEach((childSnapshot) => {
                    const message = childSnapshot.val();
                    message.key = childSnapshot.key;
                    allMessages.push(message);
                });
                console.log("Messages from path2:", snapshot2.numChildren());
            }
            
            console.log("Total messages collected:", allMessages.length);
            
            // Sort messages by timestamp and display them
            allMessages.sort((a, b) => a.timestamp - b.timestamp);
            
            allMessages.forEach((message) => {
                if (
                    (message.senderId === fromUserId &&
                        message.recipientId === toUserId) ||
                    (message.senderId === toUserId &&
                        message.recipientId === fromUserId)
                ) {
                    console.log("Displaying existing message:", message);
                    displayedMessages.add(message.key);
                    displayMessage(message);
                }
            });
            
            // Scroll to bottom after loading messages
            const chatBox = document.getElementById("chat-box");
            if (chatBox) {
                chatBox.scrollTop = chatBox.scrollHeight;
            }
        }).catch((error) => {
            console.error("Error loading existing messages:", error);
        });
    }

    function markMessageAsSeen(chatRoomId, messageId) {
        // Try to mark message as seen in both possible chat room paths
        const chatRoomId1 = chatRoomId;
        const chatRoomId2 = chatRoomId.includes('-') ? 
            chatRoomId.split('-').reverse().join('-') : chatRoomId;
        
        const messageRef1 = ref(
            database,
            `data/chats/${chatRoomId1}/${messageId}`
        );
        
        const messageRef2 = ref(
            database,
            `data/chats/${chatRoomId2}/${messageId}`
        );

        // Update the message in both paths to ensure consistency
        Promise.all([
            update(messageRef1, { seen: true, delivered: true, readMsg: true }),
            update(messageRef2, { seen: true, delivered: true, readMsg: true })
        ]).then(() => {
            // Successfully marked as seen in both paths
        }).catch((error) => {
            console.error("Error marking message as seen:", error);
        });
    }
    function formatTimestamp(timestamp) {
        const messageDate = new Date(timestamp);
        const today = new Date();

        // Check if the timestamp is from today
        const isToday =
            messageDate.getDate() === today.getDate() &&
            messageDate.getMonth() === today.getMonth() &&
            messageDate.getFullYear() === today.getFullYear();

        let hours = messageDate.getHours();
        const minutes = messageDate.getMinutes().toString().padStart(2, "0");
        const period = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12; // Convert 0 to 12 for midnight
        const time = `${hours}:${minutes} ${period}`;

        if (isToday) {
            // Return just the time if it's today
            return time;
        } else {
            // Format the date as MM/DD/YYYY and append the time
            const day = messageDate.getDate().toString().padStart(2, "0");
            const month = (messageDate.getMonth() + 1)
                .toString()
                .padStart(2, "0"); // Month is 0-based
            const year = messageDate.getFullYear();
            return `${month}/${day}/${year} ${time}`;
        }
    }

    // Function to get current time
    function getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    const sendButton = document.getElementById("send-button");
    const fileInput = document.getElementById("files");
    const messageInput = document.getElementById("message-input");
	const locationButton = document.getElementById("location-button");
	const GOOGLE_MAPS_API_KEY = "AIzaSyCAcoMewuBBAdWw5CEv6VfBcHPMl-k8uc8";

    // Create a container for file preview and the Clear button
    const messagePreview = document.createElement("div");
    messagePreview.id = "message-preview"; // A container to preview uploaded files
    messagePreview.style.display = "flex";
    messagePreview.style.alignItems = "center";
    messagePreview.style.marginTop = "10px";

    // Create the Clear button
    const clearButton = document.createElement("button");
    clearButton.id = "image-clear-button";
    clearButton.textContent = "X";
    clearButton.style.marginLeft = "10px";
    clearButton.style.display = "none"; // Initially hidden

    document.querySelector(".chat-footer-wrap").appendChild(messagePreview); // Add preview container to footer
    messagePreview.appendChild(clearButton); // Add Clear button to preview container

  if (sendButton) {
        sendButton.onclick = async function (e) {
            e.preventDefault(); // Prevent page reload

            const messageText = messageInput?.value.trim();
            const selectedFile = fileInput?.files[0];
            
            if (!messageText && !selectedFile) {
                return; // Do nothing if there's no message or file
            }

            sendButton.disabled = true;

            if (messageText) {
                // 1. Generate a unique temporary key for the optimistic message
                const tempKey = `temp_${Date.now()}_${Math.random()}`;

                // 2. Create a temporary message object for instant display
                const optimisticMessage = {
                    body: messageText, // Use plain text
                    timestamp: Date.now(),
                    senderId: currentUser.uid,
                    attachmentType: 6, // Text message type
                    key: tempKey,
                    isOptimistic: true, // Flag to prevent decryption
                    delivered: false,
                    readMsg: false,
                    replyId: replyToMessage ? replyToMessage.key : "0",
                    // Add reply content if needed for the optimistic display
                    ...(replyToMessage && { 
                        replyContent: replyToMessage.body, 
                        replyUser: replyToMessage.senderId,
                        replyType: replyToMessage.attachmentType
                    })
                };

                // 3. Display the message immediately
                displayMessage(optimisticMessage);
                
                // 4. Clear the input and close the reply box
                messageInput.value = "";
                closeReplyBox();

                // 5. Encrypt and send the real message in the background
                try {
                    const ciphertext = await encryptMessage(messageText);
                    if (ciphertext) {
                        // Pass the tempKey to sendMessage
                        sendMessage(selectedUserId, ciphertext, 6, null, tempKey);
                    } else {
                        console.error("Failed to encrypt message.");
                        // Optional: Find the optimistic message and show a "failed" icon
                    }
                } catch (error) {
                    console.error("Error sending message:", error);
                }
            }

            if (selectedFile) {
                // This logic can also be made optimistic if needed, but we focus on text first.
                const fileUrl = await uploadFileToFirebase(selectedFile);
                const fileType = selectedFile.type.split("/")[0];
                let attachment = {
                    bytesCount: selectedFile.size,
                    name: selectedFile.name,
                    url: fileUrl,
                };

                let messageType;
                switch (fileType) {
                    case "image": messageType = 2; break;
                    case "audio": messageType = 3; break;
                    case "video": messageType = 1; break;
                    default: messageType = 5; break;
                }
                sendMessage(selectedUserId, attachment, messageType);
                
                // Clear file preview
                fileInput.value = "";
                messagePreview.innerHTML = "";
                clearButton.style.display = "none";
            }
            
            sendButton.disabled = false;
        };
    }

	// Handle sending current location as a message
	if (locationButton) {
		locationButton.onclick = function (e) {
			e.preventDefault();
			if (!navigator.geolocation) {
				Toastify({
					text: "Geolocation is not supported by this browser.",
					duration: 3000,
					gravity: "top",
					position: "right",
					backgroundColor: "#ff3d00",
					stopOnFocus: true,
				}).showToast();
				return;
			}

			locationButton.disabled = true;

			navigator.geolocation.getCurrentPosition(
				async (pos) => {
					try {
						const { latitude, longitude } = pos.coords;
						const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
						const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=15&size=640x320&scale=2&maptype=roadmap&markers=color:red%7C${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;

						// Optimistic map attachment (type 4)
						const tempKey = `temp_${Date.now()}_${Math.random()}`;
						const optimisticMessage = {
							attachment: { url: staticMapUrl, link: mapsLink, lat: latitude, lng: longitude },
							timestamp: Date.now(),
							senderId: currentUser.uid,
							attachmentType: 4,
							key: tempKey,
							isOptimistic: true,
							delivered: false,
							readMsg: false,
							replyId: replyToMessage ? replyToMessage.key : "0",
							...(replyToMessage && {
								replyContent: replyToMessage.body,
								replyUser: replyToMessage.senderId,
								replyType: replyToMessage.attachmentType,
							}),
						};
						displayMessage(optimisticMessage);
						closeReplyBox();

						// Send only the map as attachmentType 4
						const attachment = {
							bytesCount: 0,
							name: "Location",
							url: staticMapUrl,
							link: mapsLink,
							lat: latitude,
							lng: longitude,
						};
						sendMessage(selectedUserId, attachment, 4, null, tempKey);
					} catch (err) {
						console.error("Error preparing location message:", err);
					} finally {
						locationButton.disabled = false;
					}
				},
				(error) => {
					console.error("Geolocation error:", error);
					Toastify({
						text: error.message || "Unable to retrieve location.",
						duration: 3000,
						gravity: "top",
						position: "right",
						backgroundColor: "#ff3d00",
						stopOnFocus: true,
					}).showToast();
					locationButton.disabled = false;
				},
				{ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
			);
		};
	}
    async function encryptMessage(messageText) {
        // Get CSRF token from meta tag
        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            .getAttribute("content");

        try {
            // Send POST request to Laravel endpoint
            const response = await fetch("/process-encryption-data", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "X-CSRF-TOKEN": csrfToken,
                },
                body: JSON.stringify({ data: messageText }),
            });

            if (!response.ok) {
                throw new Error(
                    `Failed to encrypt data. Status: ${response.status}`
                );
            }

            // Parse and return encrypted data
            const result = await response.json();
            return result.encryptedData;
        } catch (error) {
            console.error("Encryption error:", error);
            return null; // Return null in case of an error
        }
    }

    async function decryptlibsodiumMessage(encryptedMessage) {
        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            .getAttribute("content");

        try {
            const response = await fetch("/decrypt", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "X-CSRF-TOKEN": csrfToken,
                },
                body: JSON.stringify({ encryptedData: encryptedMessage }),
            });
            if (!response.ok) {
                throw new Error(`Decryption failed: ${response.status}`);
            }

            const result = await response.json();
            if (result.error) {
                throw new Error(result.error);
            }

            return result.decryptedData; // Decrypted message from Laravel
        } catch (error) {
            console.error("Decryption error:", error);
            return null; // Handle error appropriately
        }
    }

    // Show a file preview when a file is selected
    fileInput.onchange = function () {
        const selectedFile = fileInput.files[0];

        if (selectedFile) {
            const fileType = selectedFile.type.split("/")[0]; // Get type (e.g., 'image', 'audio', 'video', 'application')
            let filePreview;

            // Display different previews based on the file type
            if (fileType === "image") {
                filePreview = `<img src="${URL.createObjectURL(
                    selectedFile
                )}" alt="Image Preview" class="preview-image" style="max-width: 150px;">`;
            } else if (fileType === "audio") {
                filePreview = `<audio controls  width="240">
                               <source src="${URL.createObjectURL(
                                   selectedFile
                               )}" type="${selectedFile.type}">
                             
                           </audio>`;
            } else if (fileType === "video") {
                filePreview = `<video width="150" controls>
                               <source src="${URL.createObjectURL(
                                   selectedFile
                               )}" type="video/mp4">
                            
                           </video>`;
            } else {
                filePreview = `<p>File Selected: ${selectedFile.name}</p>`; // For other file types like documents
            }

            messagePreview.innerHTML = filePreview;
            messagePreview.appendChild(clearButton); // Add Clear button to the preview
            clearButton.style.display = "inline-block"; // Show Clear button

            // Refocus the cursor on the message input field
            messageInput.focus();
        }
    };

    // Clear the file selection and preview when Clear button is clicked
    clearButton.onclick = function () {
        fileInput.value = ""; // Reset the file input
        messagePreview.innerHTML = ""; // Clear the preview content
        clearButton.style.display = "none"; // Hide Clear button
    };

    // Function to handle emoji selection and insert it into the message input
    document
        .querySelectorAll(".emoj-group-list-foot a")
        .forEach(function (emojiBtn) {
            emojiBtn.onclick = function () {
                const emoji = emojiBtn.querySelector("img").alt; // Get emoji alt text (you can change to innerHTML if emoji is represented by image)
                messageInput.value += emoji; // Insert emoji into the text input
                messageInput.focus(); // Focus the input field
                messageInput.selectionStart = messageInput.selectionEnd =
                    messageInput.value.length; // Move cursor to the end
            };
        });

    // Function to upload file to Firebase Storage and get the file URL
    async function uploadFileToFirebase(file) {
        const fileStorageRef = storageRef(
            storage,
            `chats/${currentUser.uid}/${file.name}`
        );
        await uploadBytes(fileStorageRef, file); // Upload file to Firebase Storage
        const fileUrl = await getDownloadURL(fileStorageRef); // Get the file's URL
        return fileUrl; // Return the uploaded file URL
    }

    // Helper function to check if the text contains emojis
    function containsEmoji(text) {
        const emojiRegex = /[\u{1F600}-\u{1F64F}]/u; // Regex to detect emojis
        return emojiRegex.test(text);
    }

    let otherUserId = "";

    document
        .getElementById("blockUserDropdownBtn")
        .addEventListener("click", function (event) {
            otherUserId = selectedUserId;
        });

    // Function to block the user in Firebase
    function blockUser(otherUserId) {
        const currentUser = auth.currentUser; // Get the current user

        if (!currentUser) {
            return;
        }

        const currentUserId = currentUser.uid; // Get the current user's UID
        const blockedUserRef = ref(
            database,
            `data/blocked_users/${currentUserId}/${otherUserId}`
        );

        // Create an object to store the blocked date (timestamp)
        const blockedUserData = {
            blocked_date: Date.now(), // Save the current timestamp
        };

        // Use update() to add the new blocked user without overwriting existing ones
        update(blockedUserRef, blockedUserData)
            .then(() => {
                get(ref(database, `data/blocked_users/${currentUserId}`)).then(
                    (snapshot) => {}
                );
            })
            .catch((error) => {});
    }

    // Add an event listener to the 'Block' button in the modal
    document
        .getElementById("confirmBlockUserBtn")
        .addEventListener("click", function () {
            if (otherUserId) {
                blockUser(otherUserId);
                // Close the modal after blocking
                const blockModal = new bootstrap.Modal(
                    document.getElementById("block-user")
                );
                blockModal.hide();
            } else {
            }
        });

    document
        .getElementById("chatSearchInput")
        .addEventListener("input", function () {
            const searchValue = this.value.toLowerCase(); // Get the search value in lowercase
            const userDivs = document.querySelectorAll(
                "#chat-users-wrap .chat-list"
            ); // Select all user elements

            userDivs.forEach((userDiv) => {
                const userNameElement = userDiv.querySelector("h6"); // Assuming the username is in an <h6> tag
                const userName = userNameElement.textContent.toLowerCase(); // Get the username in lowercase

                // Check if the username includes the search value
                if (userName.includes(searchValue)) {
                    userDiv.style.display = ""; // Show user
                } else {
                    userDiv.style.display = "none"; // Hide user
                }
            });
        });

    document
        .getElementById("chatcontactSearchInput")
        .addEventListener("input", function () {
            const searchValue = this.value.trim().toLowerCase(); // Trim and convert to lowercase
            const contacts = document.querySelectorAll(
                "#main-container .contact-user"
            ); // Select all contact elements
            let anyVisible = false; // Track if any contact is visible

            contacts.forEach((contact) => {
                const contactNameElement = contact.querySelector("h6"); // Get the contact name in an <h6> tag
                const contactName = contactNameElement
                    ? contactNameElement.textContent.trim().toLowerCase()
                    : ""; // Trim and get the contact name in lowercase

                // Check if the contact name includes the search value
                if (contactName.includes(searchValue) || searchValue === "") {
                    contact.style.setProperty("display", "block", "important"); // Show matching contact
                    anyVisible = true; // Mark as visible
                } else {
                    contact.style.setProperty("display", "none", "important"); // Hide non-matching contact
                }
            });

            // Hide the entire contacts section if no matches are found
            const noMatchesMessage = document.getElementById(
                "noChatMatchesModalMessage"
            );
            if (noMatchesMessage) {
                noMatchesMessage.style.display = anyVisible ? "none" : "block"; // Show if no contacts are visible
            }
            const mainContainer = document.getElementById("main-container");
            if (mainContainer) {
                mainContainer.style.display = anyVisible ? "" : "none"; // Hide if no contacts are visible
            } else {
            }
        });

    // Clear search input when clicking "Cancel"
    document
        .querySelector("#cancelsearchbutton")
        .addEventListener("click", function () {
            const searchInput = document.getElementById(
                "chatcontactSearchInput"
            );
            searchInput.value = ""; // Clear the input field
            searchInput.dispatchEvent(new Event("input")); // Trigger the input event to refresh the contact list
        });

    document
        .querySelector("#cancelsearch")
        .addEventListener("click", function () {
            const searchInput = document.getElementById(
                "chatcontactSearchInput"
            );
            searchInput.value = ""; // Clear the input field
            searchInput.dispatchEvent(new Event("input")); // Trigger the input event to refresh the contact list
        });

    const logoutButton = document.getElementById("logout-button");

    logoutButton.addEventListener("click", function (event) {
        event.preventDefault(); // Prevent default action (if any)
        logoutUser(); // Call the logoutUser function
    });

    function logoutUser() {
        if (auth.currentUser) {
            const userId = auth.currentUser.uid; // Get the current user's ID
            const userStatusRef = ref(database, `data/users/${userId}/online`); // Reference to user status
            const lastSeenRef = ref(database, `data/users/${userId}/lastSeen`); // Reference to last seen
            // const deviceInfoRef = ref(database, `data/users/${userId}/device_info`); // Reference to device_info

            // Set the status to offline before logging out
            set(userStatusRef, "false")
                .then(() => {
                    // Once the status is set to offline, update the lastSeen timestamp
                    return set(lastSeenRef, Date.now());
                    // }).then(() => {
                    //     // Remove the device_info node
                    //     return remove(deviceInfoRef);
                })
                .then(() => {
                    // After lastSeen is updated, log the user out from Firebase
                    return auth.signOut(); // Sign out from Firebase
                })
                .then(() => {
                    // Redirect to the login page after successful logout
                    window.location.href = "/login";
                })
                .catch((error) => {
                    // Optionally, redirect to the login page in case of an error
                    window.location.href = "/login";
                });
        } else {
            // No user logged in, redirect directly to the login page
            window.location.href = "/login";
        }
    }

    // Function to check if a chat user already exists in a given reference
    function checkIfUserExists(userId, refPath) {
        return get(ref(database, refPath)).then((snapshot) => {
            if (snapshot.exists()) {
                const chats = snapshot.val();
                // Check if the userId exists in the retrieved chats
                return Object.values(chats).some(
                    (chat) => chat.userId === userId
                );
            }
            return false; // No chats found
        });
    }

    function archiveChat(userId) {
        const userRef = `data/users/${currentUser.uid}/archiveUserId`;

        checkIfUserExists(userId, userRef).then((exists) => {
            if (exists) {
                Toastify({
                    text: "Chat is already archived!",
                    duration: 3000,
                    gravity: "top",
                    position: "right",
                    backgroundColor: "#dc3545", // Red for error
                }).showToast();
            } else {
                get(ref(database, userRef))
                    .then((snapshot) => {
                        let archivedUserIds = snapshot.val() || []; // Get existing archived user IDs or initialize an empty array

                        // Ensure userId is not already in the archived list
                        if (!archivedUserIds.includes(userId)) {
                            archivedUserIds.push(userId); // Add the new userId to the array

                            // Update the database with the new array
                            return set(ref(database, userRef), archivedUserIds);
                        } else {
                            throw new Error("User is already archived.");
                        }
                    })
                    .then(() => {
                        removeUserFromUI(userId); // Remove user from UI (based on your implementation)
                        Toastify({
                            text: "Chat archived successfully!",
                            duration: 3000,
                            gravity: "top",
                            position: "right",
                            backgroundColor: "#28a745",
                        }).showToast();
                    })
                    .catch((error) => {
                        console.error("Failed to archive chat:", error);
                        alert("Failed to archive chat.");
                    });
            }
        });
    }

    function favouriteChat(userId) {
        const userRef = `data/users/${currentUser.uid}/favourite_chats`;

        checkIfUserExists(userId, userRef).then((exists) => {
            if (exists) {
                Toastify({
                    text: "Chat is already a favorite!",
                    duration: 3000,
                    gravity: "top",
                    position: "right",
                    backgroundColor: "#dc3545", // Red for error
                }).showToast();
            } else {
                const newFavouriteRef = push(ref(database, userRef));
                set(newFavouriteRef, {
                    userId: userId,
                    timestamp: Date.now(),
                })
                    .then(() => {
                        Toastify({
                            text: "Chat favorited successfully!",
                            duration: 3000,
                            gravity: "top",
                            position: "right",
                            backgroundColor: "#28a745",
                        }).showToast();
                    })
                    .catch((error) => {});
            }
        });
    }

    function pinChat(userId) {
        const userRef = `data/users/${currentUser.uid}/pinnedUserId`;

        checkIfUserExists(userId, userRef).then((exists) => {
            if (exists) {
                Toastify({
                    text: "Chat is already pinned!",
                    duration: 3000,
                    gravity: "top",
                    position: "right",
                    backgroundColor: "#dc3545", // Red for error
                }).showToast();
            } else {
                const newPinRef = ref(database, userRef);
                get(newPinRef)
                    .then((snapshot) => {
                        let pinnedUsers = snapshot.exists()
                            ? snapshot.val()
                            : [];

                        // Ensure it's an array before updating
                        if (!Array.isArray(pinnedUsers)) {
                            pinnedUsers = [];
                        }

                        // Add the new userId only if it doesn't already exist
                        if (!pinnedUsers.includes(userId)) {
                            pinnedUsers.push(userId);
                        }

                        // Save the updated array back to the database
                        return set(newPinRef, pinnedUsers);
                    })
                    .then(() => {
                        Toastify({
                            text: "Chat pinned successfully!",
                            duration: 3000,
                            gravity: "top",
                            position: "right",
                            backgroundColor: "#28a745",
                        }).showToast();
                        window.location.reload();
                    })
                    .catch((error) => {
                        Toastify({
                            text: `Error pinning chat: ${error.message}`,
                            duration: 3000,
                            gravity: "top",
                            position: "right",
                            backgroundColor: "#dc3545",
                        }).showToast();
                        console.error("Error updating pinned users:", error);
                    });
            }
        });
    }

    function deleteChat(userId) {
        const userRef = `data/users/${currentUser.uid}/delete_chats`;

        checkIfUserExists(userId, userRef).then((exists) => {
            if (exists) {
                Toastify({
                    text: "Chat is already deleted!",
                    duration: 3000,
                    gravity: "top",
                    position: "right",
                    backgroundColor: "#dc3545", // Red for error
                }).showToast();
            } else {
                const newDeleteRef = push(ref(database, userRef));
                set(newDeleteRef, {
                    userId: userId,
                    timestamp: Date.now(),
                    deleted: true,
                })
                    .then(() => {
                        removeUserFromUI(userId);
                        Toastify({
                            text: "Chat deleted successfully!",
                            duration: 3000,
                            gravity: "top",
                            position: "right",
                            backgroundColor: "#28a745",
                        }).showToast();
                    })
                    .catch((error) => {});
            }
        });
    }
    function removeUserFromUI(userId) {
        const userDiv = document.querySelector(
            `.chat-list[data-user-id='${userId}']`
        );
        if (userDiv) {
            userDiv.remove(); // This will remove the user's chat from the UI immediately
        }
    }
    function displayLastSeen(userId) {
        const userRef = ref(database, `data/users/${userId}`);

        // Fetch the lastSeen time from the database
        get(child(userRef, "lastSeen"))
            .then((snapshot) => {
                if (snapshot.exists()) {
                    const lastSeen = snapshot.val();
                    const lastSeenDate = new Date(lastSeen);

                    // Display the lastSeen time in a readable format
                    document.getElementById(
                        "last-seen-display"
                    ).innerText = `Last Seen: ${lastSeenDate.toLocaleString()}`;
                } else {
                    document.getElementById("last-seen-display").innerText =
                        "Last Seen: Not available";
                }
            })
            .catch((error) => {});
    }

    document
        .getElementById("contactInfoButton")
        .addEventListener("click", () => {
            if (selectedUserId) {
                showContactInfo(selectedUserId); // Call with the selected user ID
            }
        });

    function getUserInfo(userId) {
        const userRef = ref(database, "data/users/" + userId); // Create a reference to the user node
        return get(userRef) // Use get() instead of once()
            .then((snapshot) => {
                if (snapshot.exists()) {
                    return snapshot.val(); // Return user data if exists
                } else {
                    return null;
                }
            })
            .catch((error) => {});
    }

    // Function to get the excluded users for the current profile
    async function getExcludedUsers(userId) {
        const userRef = ref(database, "data/users/" + userId); // Reference to the user data
        try {
            const snapshot = await get(userRef);
            if (snapshot.exists()) {
                return snapshot.val().excluded_profile_info_users || []; // Return excluded user IDs
            } else {
                return [];
            }
        } catch (error) {
            return [];
        }
    }

    // Modified showContactInfo function
    async function showContactInfo(userId) {
        try {
            const currentUserId = currentUser?.uid; // Get current user ID

            // Fetch excluded users for the profile being viewed
            const excludedUsers = await getExcludedUsers(userId);

            // Check if the current user is excluded from seeing this profile
            if (excludedUsers.includes(currentUserId)) {
                document.getElementById("contact-name").textContent =
                    "Profile info hidden";
                document.getElementById("contact-email").textContent = "";
                document.getElementById("contact-phone").textContent = "";
                document.getElementById("contact-bio").textContent = "";
                document.getElementById("contact-last-seen").textContent = "";
                return; // Exit the function early
            }

            // Fetch contact information from the "contacts" reference
            const contactsRef = ref(
                database,
                `data/contacts/${currentUserId}/${userId}`
            );
            onValue(contactsRef, (contactSnapshot) => {
                let displayName = ""; // Default to "Unknown User"
                const contactData = contactSnapshot.val();

                if (contactData && contactData.firstName) {
                    // Use contact's first and last name if available
                    displayName = `${contactData.firstName} ${
                        contactData.lastName || ""
                    }`.trim();
                    updateContactUI(displayName, contactData);
                } else if (contactData && contactData.mobile_number) {
                    // Use mobile number if available in contacts
                    displayName = contactData.mobile_number;
                    updateContactUI(displayName, contactData);
                } else {
                    // Fallback: Fetch from the main "users" reference
                    const userRef = ref(database, `data/users/${userId}`);
                    get(userRef)
                        .then((userSnapshot) => {
                            const userData = userSnapshot.val();
                            if (userData && userData.mobile_number) {
                                displayName = userData.mobile_number;
                                updateContactUI(displayName, userData);
                            } else {
                                updateContactUI("Unknown User", {});
                            }
                        })
                        .catch((error) => {
                            console.error("Error fetching user data:", error);
                            updateContactUI("Error Loading User", {});
                        });
                }
            });
        } catch (error) {
            console.error("Error in showContactInfo:", error);
        }
    }

    function formatLastSeenInfo(lastSeen) {
        if (!lastSeen) return null; // Return null if lastSeen is falsy (null, undefined, etc.)

        // Format the lastSeen time to a human-readable format (adjust as necessary)
        const date = new Date(lastSeen);
        return date.toLocaleString(); // Example: "11/26/2024, 10:00 AM"
    }

    // Helper function to update the UI
    function updateContactUI(displayName, userData) {
        document.getElementById("contact-name").textContent =
            capitalizeFirstLetter(displayName);
        document.getElementById("contact-email").textContent =
            userData?.email || "No email";
        document.getElementById("contact-phone").textContent =
            userData?.mobile_number || "No phone";
        document.getElementById("contact-bio").textContent =
            userData?.about || "No bio available";
        document.getElementById("contact-full-name").textContent =
            capitalizeFirstLetter(displayName);

        const contactKycBadges = document.querySelectorAll('#contact-profile .contact-kyc-badge');
        contactKycBadges.forEach(b => b.style.display = 'none');
        if (userData?.email) {
            fetch(`/api/kyc-status?email=${encodeURIComponent(userData.email)}`)
                .then(r => r.json())
                .then(data => {
                    contactKycBadges.forEach(b => b.style.display = data.verified ? 'inline-flex' : 'none');
                })
                .catch(() => {});
        }

        const avatarElement = document.getElementById("contact-avatar");

        if (userData?.image) {
            // Use image if available
            avatarElement.src = userData.image;
        } else {
            // Fallback: Fetch from the "users" collection
            const userRef = ref(database, `data/users/${userData?.contact_id}`);
            get(userRef)
                .then((userSnapshot) => {
                    const userDataFallback = userSnapshot.val();
                    if (userDataFallback?.image) {
                        avatarElement.src = userDataFallback.image;
                    } else {
                        // Default avatar if no profile image is found
                        avatarElement.src = "assets/img/profiles/avatar-03.jpg";
                    }
                })
                .catch((error) => {
                    console.error(
                        "Error fetching fallback profile image:",
                        error
                    );
                    avatarElement.src = "assets/img/profiles/avatar-03.jpg"; // Default avatar on error
                });
        }

        if (userData?.lastSeen) {
            const lastSeenTime = formatLastSeenInfo(userData.lastSeen);
            document.getElementById(
                "contact-last-seen"
            ).textContent = `Last seen at ${lastSeenTime}`;
        } else {
            document.getElementById("contact-last-seen").style.display = "none"; // Optionally hide the element
        }

        // Update social profile links
        document.getElementById("facebook-link").href =
            userData?.facebook_link || "#";
        document.getElementById("twitter-link").href =
            userData?.twitter_link || "#";
        document.getElementById("google-link").href =
            userData?.google_link || "#";
        document.getElementById("linkedin-link").href =
            userData?.linkedin_link || "#";
    }

    function formatLastSeen(timestamp) {
        // Create a new Date object using the timestamp
        const date = new Date(timestamp);

        // Format the date and time (customize this format as needed)
        const options = {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        };

        return date.toLocaleString("en-US", options); // Adjust locale if needed
    }

    window.showContactInfo = showContactInfo;

    async function getUserGroups(userId) {
        const groupsRef = ref(database, "data/groups");

        try {
            const snapshot = await get(groupsRef);

            const groups = [];

            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    const groupData = childSnapshot.val();

                    if (
                        groupData.members &&
                        groupData.members.includes(userId)
                    ) {
                        groups.push({
                            groupId: childSnapshot.key,
                            ...groupData,
                        });
                    }
                });
            }

            return groups;
        } catch (error) {
            return [];
        }
    }

    // Function to handle user selection
    function handleUserSelection(selectedUsers) {
        // Call the function to fetch groups
        fetchGroupsForUsers(selectedUsers)
            .then((groups) => {
                // Check for common groups logic
                const commonGroups = findCommonGroups(groups);

                if (commonGroups.length === 0) {
                }
            })
            .catch((error) => {});
    }

    // Fetch groups function
    async function fetchGroupsForUsers(users) {
        const groupsPromises = users.map((userId) => getUserGroups(userId));
        return Promise.all(groupsPromises);
    }

    async function handleShowCommonGroups() {
        const currentUserId = currentUser?.uid;

        // Call the function to show common groups
        const commonGroups = await showCommonGroups(
            currentUserId,
            selectedUserId
        );
    }

    async function showCommonGroups(currentUserId, selectedUserId) {
        const [currentUserGroups, selectedUserGroups] = await Promise.all([
            getUserGroups(currentUserId),
            getUserGroups(selectedUserId),
        ]);

        // Retrieve common group IDs
        const commonGroupIds = currentUserGroups
            .map((group) => group.groupId)
            .filter((groupId) =>
                selectedUserGroups.some((group) => group.groupId === groupId)
            );

        // Prepare to display common groups
        const commonGroupsContainer = document.querySelector(
            ".content-wrapper.other-info .card-body"
        );
        commonGroupsContainer.innerHTML = ""; // Clear previous content

        if (commonGroupIds.length === 0) {
            document.querySelector(
                ".content-wrapper.other-info"
            ).style.display = "none";
            return []; // Return an empty array if no common groups
        } else {
            document.querySelector("#common-groups-container").style.display =
                "block"; // Ensure the container is visible

            // Initialize an array to hold common groups data
            const commonGroups = [];

            // Show the common groups section and populate it with the groups
            commonGroupIds.forEach((groupId) => {
                const group = currentUserGroups.find(
                    (g) => g.groupId === groupId
                );
                if (group) {
                    commonGroups.push(group); // Push the group data into the commonGroups array

                    const groupItem = document.createElement("a");
                    groupItem.classList.add("list-group-item");
                    groupItem.href = "javascript:void(0);";
                    groupItem.setAttribute("data-group-id", groupId); // Add data attribute for redirection

                    const avatarURL =
                        group.image || "assets/img/profiles/avatar-03.jpg"; // Replace with your default image URL

                    groupItem.innerHTML = `
                        <div class="d-flex align-items-center">
                            <div class="avatar avatar-lg rounded-circle me-2" style="background-image: url(${avatarURL});"></div>
                            <div class="chat-user-info">
                                <h6>${group.name}</h6>
                            </div>
                        </div>
                        <span class="link-icon"><i class="ti ti-chevron-right"></i></span>
                    `;

                    // Append the group item to the container
                    commonGroupsContainer.appendChild(groupItem);
                }
            });

            // Add click event listeners for redirection
            const groupItems =
                commonGroupsContainer.querySelectorAll(".list-group-item");
            groupItems.forEach((item) => {
                item.addEventListener("click", function () {
                    const groupId = this.getAttribute("data-group-id");
                    // Redirect to the group chat page
                    window.location.href = `/group-chat`;
                });
            });

            return commonGroups; // Return the common groups data for further use
        }
    }

    document
        .getElementById("clearChatBtn")
        .addEventListener("click", function (event) {
            event.preventDefault(); // Prevent the default form submission
            clearChat(selectedUserId); // Pass the selectedUserId to the deleteChat function
        });

    function clearChat(selectedUserId) {
        const chatRoomId = getDeterministicChatRoomId(currentUserId, selectedUserId);
        const messagesRef = ref(database, `data/chats/${chatRoomId}`);

        get(messagesRef)
            .then((snapshot) => {
                if (snapshot.exists()) {
                    const messages = snapshot.val();

                    // Prepare updates for each message
                    const updates = {};
                    Object.keys(messages).forEach((messageId) => {
                        const clearedFor = messages[messageId].clearedFor || [];

                        // Only update if the current user is not already in the clearedFor array
                        if (!clearedFor.includes(currentUserId)) {
                            updates[`${messageId}/clearedFor`] = [
                                ...clearedFor,
                                currentUserId,
                            ];
                        }
                    });

                    // Apply updates to the database
                    return update(messagesRef, updates);
                }
            })
            .then(() => {
                // Clear UI
                const chatBox = document.getElementById("chat-box");
                if (chatBox) {
                    chatBox.innerHTML = ""; // Clear the chat box
                }

                // Close modal if applicable
                const modal = document.getElementById("clear-user-chat");
                if (modal) {
                    const modalInstance = bootstrap.Modal.getInstance(modal);
                    modalInstance?.hide();
                }
            })
            .catch((error) => {
                console.error("Error clearing chat:", error);
            });
    }

    document
        .getElementById("deleteChatBtn")
        .addEventListener("click", function (event) {
            event.preventDefault(); // Prevent the default form submission
            deleteChat(selectedUserId); // Pass the selectedUserId to the deleteChat function
        });

    function deleteChat(selectedUserId) {
        const chatRoomId = getDeterministicChatRoomId(currentUserId, selectedUserId);
        const messagesRef = ref(database, `data/chats/${chatRoomId}`);

        get(messagesRef)
            .then((snapshot) => {
                if (snapshot.exists()) {
                    const messages = snapshot.val();

                    // Prepare updates for each message
                    const updates = {};
                    Object.keys(messages).forEach((messageId) => {
                        const deletedFor = messages[messageId].deletedFor || [];

                        // Only update if the current user is not already in the deletedFor array
                        if (!deletedFor.includes(currentUserId)) {
                            updates[`${messageId}/deletedFor`] = [
                                ...deletedFor,
                                currentUserId,
                            ];
                        }
                    });

                    // Apply updates to the database
                    return update(messagesRef, updates);
                }
            })
            .then(() => {
                // Clear UI
                const chatBox = document.getElementById("chat-box");
                if (chatBox) {
                    chatBox.innerHTML = ""; // Clear the chat box
                }

                // Close modal if applicable
                const modal = document.getElementById("delete-user-chat");
                if (modal) {
                    const modalInstance = bootstrap.Modal.getInstance(modal);
                    modalInstance?.hide();
                }
            })
            .catch((error) => {
                console.error("Error deleting chat:", error);
            });
    }

    let otherblockUserId = "";
    let isUserInfoBlocked = false; // Track if the user is blocked

    // Get the block status from localStorage when the page loads
    isUserInfoBlocked = localStorage.getItem("isUserInfoBlocked") === "true";

    // Update the label based on the blocked status
    if (isUserInfoBlocked) {
        document.getElementById("blockUserLabel").innerHTML =
            '<i class="ti ti-user me-2 text-info"></i> Unblock User';
    } else {
        document.getElementById("blockUserLabel").innerHTML =
            '<i class="ti ti-user-off me-2 text-info"></i> Block User';
    }

    // Event listener for dropdown button to open the correct modal
    document
        .getElementById("blockedUserDropdownBtn")
        .addEventListener("click", function (event) {
            otherblockUserId = selectedUserId; // Replace with actual user ID logic

            if (isUserInfoBlocked) {
                // Show the unblock modal only if the user is blocked
                const unblockModal = new bootstrap.Modal(
                    document.getElementById("unblock-user")
                );
                unblockModal.show();
            } else {
                // Show the block modal only if the user is not blocked
                const blockModal = new bootstrap.Modal(
                    document.getElementById("blocked-user")
                );
                blockModal.show();
            }
        });

    // Block user function
    function blockedUser(otherblockUserId) {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            return;
        }

        const currentUserId = currentUser.uid;
        const blockedUserRef = ref(
            database,
            `data/blocked_users/${currentUserId}/${otherblockUserId}`
        );
        const blockedUserData = { blocked_date: Date.now() };

        update(blockedUserRef, blockedUserData)
            .then(() => {
                document.getElementById("blockUserLabel").innerHTML =
                    '<i class="ti ti-user me-2 text-info"></i> Unblock User';
                isUserInfoBlocked = true;
                localStorage.setItem("isUserInfoBlocked", "true");
                // Close the block modal explicitly
                const blockModal = bootstrap.Modal.getInstance(
                    document.getElementById("blocked-user")
                );
                if (blockModal) blockModal.hide();
            })
            .catch((error) => {});
    }

    // Unblock user function
    function unblockUser(otherblockUserId) {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            return;
        }

        const currentUserId = currentUser.uid;
        const blockedUserRef = ref(
            database,
            `data/blocked_users/${currentUserId}/${otherblockUserId}`
        );

        remove(blockedUserRef)
            .then(() => {
                document.getElementById("blockUserLabel").innerHTML =
                    '<i class="ti ti-user-off me-2 text-info"></i> Block User';
                isUserInfoBlocked = false;
                localStorage.setItem("isUserInfoBlocked", "false");
                // Close the unblock modal explicitly
                const unblockModal = bootstrap.Modal.getInstance(
                    document.getElementById("unblock-user")
                );
                if (unblockModal) unblockModal.hide();
            })
            .catch((error) => {});
    }

    // Event listener for 'Block' button
    function removeBackdrop() {
        const backdrop = document.querySelector(".modal-backdrop");
        if (backdrop) {
            backdrop.parentNode.removeChild(backdrop);
        }
    }

    // Call this function after hiding each modal
    document
        .getElementById("confirmBlockedUserBtn")
        .addEventListener("click", function () {
            if (otherblockUserId) {
                blockedUser(otherblockUserId);
                const blockModalInstance = bootstrap.Modal.getInstance(
                    document.getElementById("blocked-user")
                );
                if (blockModalInstance) {
                    blockModalInstance.hide();
                    removeBackdrop(); // Remove any lingering backdrop
                }
            }
        });

    document
        .getElementById("confirmUnblockUserBtn")
        .addEventListener("click", function () {
            if (otherblockUserId) {
                unblockUser(otherblockUserId);
                const unblockModalInstance = bootstrap.Modal.getInstance(
                    document.getElementById("unblock-user")
                );
                if (unblockModalInstance) {
                    unblockModalInstance.hide();
                    removeBackdrop(); // Remove any lingering backdrop
                }
            }
        });

    function populateUsersMap() {
        const usersRef = ref(database, "data/users"); // Path to your users
        get(usersRef)
            .then((snapshot) => {
                if (snapshot.exists()) {
                    const usersData = snapshot.val();
                    for (const userId in usersData) {
                        // Combine firstName and lastName
                        const firstName = usersData[userId].firstName || ""; // Fallback to empty string if not present
                        const lastName = usersData[userId].lastName || ""; // Fallback to empty string if not present
                        const fullName = `${firstName} ${lastName}`.trim(); // Combine and trim

                        // Set profile image, with a default if none exists
                        const profileImage =
                            usersData[userId].image ||
                            "assets/img/profiles/avatar-03.jpg";

                        usersMap[userId] = {
                            userName: fullName, // Set combined name
                            profileImage: profileImage, // Use provided image or default
                        };
                    }
                    fetchArchivedChats(currentUserId);
                    fetchPinnedChats(currentUserId);
                    fetchFavouriteChats(currentUserId);
                    fetchTrashChats(currentUserId);
                }
            })
            .catch((error) => {});
    }

    populateUsersMap();
    function fetchArchivedChats(userId) {
        if (!userId) {
            return;
        }
        const archivedChatsRef = ref(
            database,
            `data/users/${userId}/archiveUserId`
        );

        onValue(
            archivedChatsRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    const archivedChats = snapshot.val(); // Array of archived userIds
                    const archivedUsers = [];

                    // Loop through the archivedChats array
                    archivedChats.forEach((chatUserId) => {
                        // Verify if user data exists in usersMap
                        if (usersMap[chatUserId]) {
                            archivedUsers.push({
                                userId: chatUserId,
                                firstName: usersMap[chatUserId].userName,
                                profileImage: usersMap[chatUserId].profileImage,
                                timestamp: Date.now(), // You can adjust the timestamp handling as needed
                            });
                        }
                    });

                    displayArchivedUsers(usersMap, archivedUsers);
                } else {
                    displayArchivedUsers(usersMap, []);
                }
            },
            (error) => {
                console.error("Error fetching archived chats:", error);
            }
        );
    }

    // fetchArchivedChats(currentUserId);

    function formatedTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();

        // Reset time for accurate day comparison
        const today = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        // Check if the timestamp is today
        if (date >= today) {
            let hours = date.getHours();
            const minutes = date.getMinutes().toString().padStart(2, "0");
            const period = hours >= 12 ? "PM" : "AM";
            hours = hours % 12 || 12; // Convert 0 to 12 for midnight
            return `${hours}:${minutes} ${period}`;
        }
        // Check if the timestamp is yesterday
        else if (date >= yesterday) {
            return "Yesterday";
        }
        // Format as MM/DD/YYYY for older dates
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Month is 0-based
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
    }

    async function displayArchivedUsers(usersMap, archivedUsers) {
        const sidebarElement = document.getElementById("archive-chats");
        sidebarElement.innerHTML = "";

        if (archivedUsers.length === 0) {
            sidebarElement.innerHTML = "<p>No archived users found.</p>";
            return;
        }

        for (const user of archivedUsers) {
            let senderName = ""; // Initialize sender name
            let profileImage =
                user.profileImage || "assets/img/profiles/avatar-03.jpg"; // Default profile image

            // Reference to the contact and user tables
            const contactsRef = ref(
                database,
                `data/contacts/${currentUser.uid}/${user.userId}`
            );
            const userRef = ref(database, `data/users/${user.userId}`);

            try {
                // Fetch contact and user data
                const contactSnapshot = await get(contactsRef);
                if (contactSnapshot.exists()) {
                    const contactData = contactSnapshot.val();
                    const contactFirstName =
                        contactData.firstName || contactData.mobile_number;
                    const contactLastName = contactData.lastName || "";
                    senderName =
                        `${contactFirstName} ${contactLastName}`.trim();
                }

                const userSnapshot = await get(userRef);
                if (userSnapshot.exists()) {
                    const userData = userSnapshot.val();
                    profileImage = userData.image || profileImage;

                    if (!senderName) {
                        const userFirstName = userData.mobile_number || "";
                        //const userLastName = userData.lastName || "";
                        senderName = `${userFirstName}`;
                    }
                }
            } catch (error) {}

            // Create the user element
            const userElement = document.createElement("div");
            userElement.classList.add("chat-users-wrap");

            const userDiv = document.createElement("div");
            userDiv.classList.add("chat-list");
            userDiv.setAttribute("data-user-id", user.userId);

            const userLink = document.createElement("a");
            userLink.href = "#";
            userLink.classList.add("chat-user-list");
            userLink.onclick = () => selectUser(user.userId);

            userLink.innerHTML = `
            <div class="avatar avatar-lg me-2">
                <img src="${profileImage}" class="rounded-circle" alt="image" />
            </div>
            <div class="chat-user-info">
                <div class="chat-user-msg">
                    <h6>${senderName}</h6>
                </div>
               
            </div>
        `;

            userDiv.appendChild(userLink);

            const chatDropdown = document.createElement("div");
            chatDropdown.classList.add("chat-dropdown");
            chatDropdown.innerHTML = `
            <a href="#"  data-bs-toggle="dropdown" aria-expanded="false">
                <i class="ti ti-dots-vertical"></i>
            </a>
            <ul class="dropdown-menu dropdown-menu-end p-3">
                <li>
                    <a class="dropdown-item unarchive-chat" href="#" data-chat-id="${user.chatId}" data-user-id="${user.userId}">
                        <i class="ti ti-box-align-right me-2"></i>Unarchive Chat
                    </a>
                </li>
            </ul>
        `;

            userDiv.appendChild(chatDropdown);
            userElement.appendChild(userDiv);
            sidebarElement.appendChild(userElement);

            // Attach event listener for this user's unarchive button
            const unarchiveButton =
                chatDropdown.querySelector(".unarchive-chat");
            unarchiveButton.addEventListener("click", handleUnarchiveClick);
        }
    }

    function handleUnarchiveClick(event, archivedUsers = []) {
        const chatUserId = event.target.getAttribute("data-user-id");
        const chatId = event.target.getAttribute("data-chat-id");

        if (!chatId) {
            return;
        }

        const archiveChatsRef = ref(
            database,
            `data/users/${currentUser.uid}/archiveUserId`
        );

        get(archiveChatsRef)
            .then((snapshot) => {
                if (snapshot.exists()) {
                    const archivedUserIds = snapshot.val(); // Get the array of archived user IDs

                    // Ensure archivedUserIds is an array, if not, initialize it as an empty array
                    const updatedArchivedUserIds = Array.isArray(
                        archivedUserIds
                    )
                        ? archivedUserIds.filter(
                              (userId) => userId !== chatUserId
                          )
                        : [];

                    // Update the database with the new array
                    return set(archiveChatsRef, updatedArchivedUserIds);
                } else {
                    throw new Error("No archived users found.");
                }
            })
            .then(() => {
                Toastify({
                    text: `User has been unarchived.`,
                    duration: 3000,
                    gravity: "top",
                    position: "right",
                    backgroundColor: "#28a745",
                }).showToast();

                // Ensure archivedUsers is an array, then filter it
                const updatedArchivedUsers = Array.isArray(archivedUsers)
                    ? archivedUsers.filter((user) => user.userId !== chatUserId)
                    : [];
                window.location.reload();
                // Update the UI
                displayArchivedUsers(usersMap, updatedArchivedUsers);
            })
            .catch((error) => {
                console.error("Error unarchiving user:", error);
            });
    }

    function fetchPinnedChats(userId) {
        const pinnedChatsRef = ref(
            database,
            `data/users/${userId}/pinnedUserId`
        ); // Path to the user's pinned chats

        onValue(
            pinnedChatsRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    const pinnedChats = snapshot.val(); // Assuming this is an array of user IDs
                    const pinnedUsers = [];

                    // Loop through the pinnedChats array
                    pinnedChats.forEach((chatUserId) => {
                        if (usersMap[chatUserId]) {
                            // Push the pinned user details to the array
                            pinnedUsers.push({
                                userId: chatUserId,
                                firstName: usersMap[chatUserId].userName,
                                profileImage: usersMap[chatUserId].profileImage,
                            });
                        }
                    });

                    displayPinnedUsers(usersMap, pinnedUsers); // Display or process the pinned users as needed
                } else {
                    displayPinnedUsers(usersMap, []); // Clear the display if no pinned chats
                }
            },
            (error) => {
                console.error("Error fetching pinned chats:", error);
            }
        );
    }

    // fetchPinnedChats(currentUserId);

    function displayPinnedUsers(usersMap, pinnedUsers) {
        // Get the sidebar element where users will be displayed
        const sidebarElement = document.getElementById("pinned-chats");

        // Clear the sidebar first to avoid duplication
        sidebarElement.innerHTML = "";

        // Check if there are pinned users
        if (pinnedUsers.length === 0) {
            sidebarElement.innerHTML = "<p>No pinned users found.</p>";
            return;
        }

        // Loop through the pinned users and create HTML elements for each
        pinnedUsers.forEach((user) => {
            const contactsRef = ref(
                database,
                `data/contacts/${currentUser.uid}/${user.userId}`
            );
            const userRef = ref(database, `data/users/${user.userId}`);

            let senderName = ""; // Initialize sender name
            let profileImage = "assets/img/profiles/avatar-03.jpg"; // Default profile image

            // Fetch contact and user data
            get(contactsRef)
                .then((contactsSnapshot) => {
                    if (contactsSnapshot.exists()) {
                        const contactData = contactsSnapshot.val();
                        const contactFirstName =
                            contactData.firstName || contactData.mobile_number;
                        const contactLastName = contactData.lastName || "";
                        senderName =
                            `${contactFirstName} ${contactLastName}`.trim();
                    }

                    return get(userRef);
                })
                .then((userSnapshot) => {
                    if (userSnapshot.exists()) {
                        const userData = userSnapshot.val();
                        profileImage = userData.image || profileImage;

                        if (!senderName) {
                            const userFirstName =
                                userData.firstName || userData.mobile_number;
                            // const userLastName = userData.lastName || "";
                            senderName = `${userFirstName}`;
                        }
                    }

                    // Create the HTML elements for the user
                    const userElement = document.createElement("div");
                    userElement.classList.add("chat-users-wrap");

                    const userDiv = document.createElement("div");
                    userDiv.classList.add("chat-list");
                    userDiv.setAttribute("data-user-id", user.userId);

                    const userLink = document.createElement("a");
                    userLink.href = "#";
                    userLink.classList.add("chat-user-list");
                    userLink.onclick = () => selectUser(user.userId);

                    userLink.innerHTML = `
                    <div class="avatar avatar-lg me-2">
                        <img src="${profileImage}" class="rounded-circle" alt="image" />
                    </div>
                    <div class="chat-user-info">
                        <div class="chat-user-msg">
                            <h6>${senderName}</h6>
                            <p></p>
                        </div>
                        <div class="chat-user-time">
                            <i class="ti ti-pin"></i>
                        </div>
                    </div>
                `;

                    userDiv.appendChild(userLink);

                    const chatDropdown = document.createElement("div");
                    chatDropdown.classList.add("chat-dropdown");
                    chatDropdown.innerHTML = `
                    <a href="#" data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="ti ti-dots-vertical"></i>
                    </a>
                    <ul class="dropdown-menu dropdown-menu-end p-3">
                        <li>
                            <a class="dropdown-item unpin-chat" href="#" data-chat-id="${user.chatId}" data-user-id="${user.userId}">
                                <i class="ti ti-pinned me-2"></i>Unpin Chats
                            </a>
                        </li>
                    </ul>
                `;

                    userDiv.appendChild(chatDropdown);
                    userElement.appendChild(userDiv);
                    sidebarElement.appendChild(userElement);

                    // Attach event listener for the unpin button
                    const unpinButton = userDiv.querySelector(".unpin-chat");
                    unpinButton.addEventListener("click", handleUnpinClick);
                })
                .catch((error) => {});
        });
    }

    function handleUnpinClick(event, pinnedUsers) {
        const chatUserId = event.target.getAttribute("data-user-id"); // User ID to unpin
        if (!chatUserId) {
            return;
        }

        const pinnedChatsRef = ref(
            database,
            `data/users/${currentUser.uid}/pinnedUserId`
        );

        // Get the current pinnedUserId array
        get(pinnedChatsRef)
            .then((snapshot) => {
                if (snapshot.exists()) {
                    const pinnedUserIds = snapshot.val(); // Array of pinned user IDs

                    // Ensure the data is a valid array
                    if (Array.isArray(pinnedUserIds)) {
                        const updatedPinnedUserIds = pinnedUserIds.filter(
                            (userId) => userId !== chatUserId
                        );

                        // Update the database with the new array
                        return set(pinnedChatsRef, updatedPinnedUserIds);
                    } else {
                        throw new Error("Pinned user data is not an array.");
                    }
                } else {
                    throw new Error("No pinned users found.");
                }
            })
            .then(() => {
                Toastify({
                    text: `User has been unpinned.`,
                    duration: 3000,
                    gravity: "top",
                    position: "right",
                    backgroundColor: "#28a745",
                }).showToast();

                // Update the UI
                const updatedPinnedUsers = Array.isArray(pinnedUsers)
                    ? pinnedUsers.filter((user) => user.userId !== chatUserId)
                    : []; // If pinnedUsers is not an array, use an empty array
                window.location.reload();
                displayPinnedUsers(usersMap, updatedPinnedUsers);
            })
            .catch((error) => {
                console.error("Error unpinning user:", error);
            });
    }

    function fetchFavouriteChats(userId) {
        const favouriteChatsRef = ref(
            database,
            `data/users/${userId}/favourite_chats`
        ); // Path to the user's pinned chats

        onValue(
            favouriteChatsRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    const favouriteChats = snapshot.val();
                    const favouriteUsers = [];

                    // Loop through the Favourite chats and match with user data
                    for (const chatId in favouriteChats) {
                        const chat = favouriteChats[chatId];
                        const chatUserId = chat.userId;

                        if (usersMap[chatUserId]) {
                            // Push the Favourite user details to the array
                            favouriteUsers.push({
                                userId: chatUserId,
                                firstName: usersMap[chatUserId].userName,
                                profileImage: usersMap[chatUserId].profileImage,
                                timestamp: chat.timestamp,
                            });
                        }
                    }

                    displayFavouriteUsers(usersMap, favouriteUsers); // Display or process the Favourite users as needed
                } else {
                    displayFavouriteUsers(usersMap, []);
                }
            },
            (error) => {}
        );
    }

    // fetchFavouriteChats(currentUserId);

    function displayFavouriteUsers(usersMap, favouriteUsers) {
        // Get the sidebar element where users will be displayed
        const sidebarElement = document.getElementById("favourites-chats");

        // Clear the sidebar first to avoid duplication
        sidebarElement.innerHTML = "";

        // Check if there are pinned users
        if (favouriteUsers.length === 0) {
            sidebarElement.innerHTML = "<p>No pinned users found.</p>";
            return;
        }

        // Loop through the pinned users and create HTML elements for each
        favouriteUsers.forEach((user) => {
            const userElement = document.createElement("div");
            userElement.classList.add("chat-users-wrap");
            userElement.innerHTML = `
            <div class="chat-list">
                <a href="#" class="chat-user-list">
                    <div class="avatar avatar-lg me-2">
                        <img src="${
                            user.profileImage
                        }" class="rounded-circle" alt="image" />
                    </div>
                    <div class="chat-user-info">
                        <div class="chat-user-msg">
                            <h6>${user.firstName}</h6>
                            <p></p>
                        </div>
                        <div class="chat-user-time">
                            <span class="time">${formatedTimestamp(
                                user.timestamp
                            )}</span>
                            <div class="chat-pin">
                                <i class="ti me-2"></i>
                                <span class="count-message fs-12 fw-semibold"></span>
                            </div>
                        </div>
                    </div>
                </a>
                <div class="chat-dropdown">
                    <a href="#"  data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="ti ti-dots-vertical"></i>
                    </a>
                    <ul class="dropdown-menu dropdown-menu-end p-3">
                        <li>
                            <a class="dropdown-item" href="#"><i class="ti ti-box-align-right me-2"></i>Archive Chat</a>
                        </li>
                        <li>
                            <a class="dropdown-item" href="#"><i class="ti ti-heart me-2"></i>Mark as Favourite</a>
                        </li>
                        <li>
                            <a class="dropdown-item" href="#"><i class="ti ti-check me-2"></i>Mark as Unread</a>
                        </li>
                        <li>
                            <a class="dropdown-item" href="#"><i class="ti ti-pinned me-2"></i>Pin Chats</a>
                        </li>
                       
                    </ul>
                </div>
            </div>
        `;

            // Append the user element to the sidebar
            sidebarElement.appendChild(userElement);
        });
    }

    function fetchTrashChats(userId) {
        const trashChatsRef = ref(
            database,
            `data/users/${userId}/delete_chats`
        ); // Path to the user's pinned chats

        onValue(
            trashChatsRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    const trashChats = snapshot.val();
                    const trashUsers = [];

                    // Loop through the Trash chats and match with user data
                    for (const chatId in trashChats) {
                        const chat = trashChats[chatId];
                        const chatUserId = chat.userId;

                        if (usersMap[chatUserId]) {
                            // Push the Trash user details to the array
                            trashUsers.push({
                                chatId: chatId,
                                userId: chatUserId,
                                firstName: usersMap[chatUserId].userName,
                                profileImage: usersMap[chatUserId].profileImage,
                                timestamp: chat.timestamp,
                            });
                        }
                    }

                    displayTrashUsers(usersMap, trashUsers); // Display or process the Trash users as needed
                } else {
                    displayTrashUsers(usersMap, []);
                }
            },
            (error) => {}
        );
    }

    // fetchTrashChats(currentUserId);

    function displayTrashUsers(usersMap, trashUsers) {
        // Get the sidebar element where users will be displayed
        const sidebarElement = document.getElementById("trash-chats");

        // Clear the sidebar first to avoid duplication
        //sidebarElement.innerHTML = "";

        // Check if there are Trash users
        if (trashUsers.length === 0) {
            // sidebarElement.innerHTML = "<p>No Trash users found.</p>";
            return;
        }

        // Loop through the Trash users and create HTML elements for each
        trashUsers.forEach((user) => {
            const contactsRef = ref(
                database,
                `data/contacts/${currentUser.uid}/${user.userId}`
            );
            const userRef = ref(database, `data/users/${user.userId}`);
            let senderName = ""; // Initialize with an empty string
            let profileImage = "assets/img/profiles/avatar-03.jpg"; // Default profile image

            // First, check if the sender is in the current user's contacts
            get(contactsRef)
                .then((contactsSnapshot) => {
                    if (contactsSnapshot.exists()) {
                        const contactData = contactsSnapshot.val();
                        const contactFirstName = contactData.firstName || "";
                        const contactLastName = contactData.lastName || "";
                        senderName =
                            `${contactFirstName} ${contactLastName}`.trim(); // Combine first and last name
                    }

                    // Regardless of contact status, fetch the user data for profile image and fallback name
                    return get(userRef);
                })
                .then((userSnapshot) => {
                    if (userSnapshot.exists()) {
                        const userData = userSnapshot.val();
                        profileImage = userData.image || profileImage;

                        // If senderName is still empty, fall back to the user's table data
                        if (!senderName) {
                            const userFirstName = userData.firstName || "";
                            const userLastName = userData.lastName || "";
                            senderName =
                                `${userFirstName} ${userLastName}`.trim(); // Combine first and last name
                        }
                    }

                    // Create user elements with the resolved name and profile image
                    const userElement = document.createElement("div");
                    userElement.classList.add("chat-users-wrap");
                    const userDiv = document.createElement("div");
                    userDiv.classList.add("chat-list");
                    userDiv.setAttribute("data-user-id", user.userId);

                    // Create the chat-user-list link and add an onclick event
                    const userLink = document.createElement("a");
                    userLink.href = "#";
                    userLink.classList.add("chat-user-list");
                    userLink.onclick = () => selectUser(user.userId);

                    userLink.innerHTML = `
                            <div class="avatar avatar-lg me-2">
                                <img src="${profileImage}" class="rounded-circle" alt="image" />
                            </div>
                            <div class="chat-user-info">
                                <div class="chat-user-msg">
                                    <h6>${senderName}</h6>
                                    <p></p>
                                </div>
                                <div class="chat-user-time">
                                    <span class="time">${formatedTimestamp(
                                        user.timestamp
                                    )}</span>
                                </div>
                            </div>
                `;
                    // Append the userLink to the userDiv
                    userDiv.appendChild(userLink);

                    // Add the dropdown menu for each user
                    const chatDropdown = document.createElement("div");
                    chatDropdown.classList.add("chat-dropdown");
                    chatDropdown.innerHTML = `
                            <a href="#"  data-bs-toggle="dropdown" aria-expanded="false">
                                <i class="ti ti-dots-vertical"></i>
                            </a>
                            <ul class="dropdown-menu dropdown-menu-end p-3">
                                <li>
                                    <a class="dropdown-item undelete-chat" href="#" data-chat-id="${user.chatId}" data-user-id="${user.userId}">
                                        <i class="ti ti-box-align-right me-2"></i>Undelete Chat
                                    </a>
                                </li>
                            </ul>
                `;

                    // Append the dropdown menu to the userDiv
                    userDiv.appendChild(chatDropdown);

                    // Append the userDiv to the userElement
                    userElement.appendChild(userDiv);
                    // Append the user element to the sidebar
                    sidebarElement.appendChild(userElement);

                    // Attach event listener for undelete button after appending the user element to DOM
                    const undeleteButton =
                        userElement.querySelector(".undelete-chat");
                    if (undeleteButton) {
                        undeleteButton.addEventListener(
                            "click",
                            handleUndeleteClick
                        );
                    }
                })
                .catch((error) => {});
        });
    }

    function handleUndeleteClick(event, deletedUsers) {
        const chatUserId = event.target.getAttribute("data-user-id");
        const chatId = event.target.getAttribute("data-chat-id");

        if (!chatId) {
            return;
        }

        const deletedChatsRef = ref(
            database,
            `data/users/${currentUser.uid}/delete_chats/${chatId}`
        );

        remove(deletedChatsRef)
            .then(() => {
                // Update the UI by filtering out the undeleted user
                window.location.reload();
                const updatedDeletedUsers = deletedUsers.filter(
                    (user) => user.userId !== chatUserId
                );
                displayTrashUsers(usersMap, updatedDeletedUsers);
            })
            .catch((error) => {});
    }

    document
        .getElementById("close-chat-btn")
        .addEventListener("click", function (event) {
            event.preventDefault(); // Prevent default link behavior

            // Get the chat section by its ID
            const chatSection = document.getElementById("middle");
            const welcomeContainer =
                document.getElementById("welcome-container");

            if (chatSection) {
                chatSection.style.display = "none"; // Hide the chat section
                welcomeContainer.style.display = "block";
            }
        });

    function requestNotificationPermission() {
        if (Notification.permission === "default") {
            Notification.requestPermission().then((permission) => {
                if (permission === "granted") {
                }
            });
        }
    }

    // Call this function when your application initializes
    requestNotificationPermission();

    function showDesktopNotification(senderName, messageText) {
        const notificationTitle = `New message from ${senderName}`;
        const notificationBody = messageText;

        if (Notification.permission === "granted") {
            new Notification(notificationTitle, {
                body: notificationBody,
            });
        }
    }

    async function fetchActiveContacts() {
        const defaultProfileImage = "/assets/img/profiles/avatar-03.jpg"; // Set your default image path here
        const loggedInUserId = currentUser.uid; // Replace with the actual logged-in user's ID

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

    // Add event listener to each dropdown item
    document.querySelectorAll("#innerTab .dropdown-item").forEach((item) => {
        item.addEventListener("click", function () {
            // Get the title from the data attribute and update the title
            const title = this.getAttribute("data-title");
            document.getElementById("chatTitle").textContent = title;
        });
    });

    const emojiButton = document.getElementById("emoji-button");
    const emojiPicker = document.getElementById("emoji-picker");
    const emojiList = document.getElementById("emoji-list");
    const inputField = document.getElementById("message-input");

    const emojis = [
        // Smilies and Expressions
        "😀",
        "😃",
        "😄",
        "😁",
        "😆",
        "😅",
        "😂",
        "🤣",
        "😊",
        "😇",
        "🥰",
        "😍",
        "🤩",
        "😘",
        "😗",
        "😙",
        "😚",
        "😉",
        "😌",
        "😜",
        "😝",
        "😛",
        "😋",
        "😎",
        "😏",
        "😒",
        "😔",
        "😕",
        "🙁",
        "☹️",
        "😣",
        "😖",
        "😫",
        "😩",
        "🥺",
        "😢",
        "😭",
        "😤",
        "😡",
        "😠",
        "🤬",
        "😷",
        "🤒",
        "🤕",
        "🥴",
        "😵",
        "🤯",
        "😳",
        "🥵",
        "🥶",
        "😨",
        "😰",
        "😥",
        "😓",
        "🤗",
        "🤔",
        "🤭",
        "🤫",
        "😬",
        "😔",
        "🤪",
        "🤩",
        "🤪",
        "🥳",
        "😈",
        "👿",

        // Kiss & Hug
        "💋",
        "🤲",
        "💞",
        "💕",
        "💌",
        "💖",
        "💘",

        // People & Professions
        "👩‍💻",
        "👨‍💻",
        "👩‍⚖️",
        "👨‍⚖️",
        "👩‍🔬",
        "👨‍🔬",
        "👩‍🎨",
        "👨‍🎨",
        "👩‍🍳",
        "👨‍🍳",
        "🧑‍🎓",
        "👩‍🎓",
        "👨‍🎓",
        "👩‍🚀",
        "👨‍🚀",
        "👩‍⚕️",
        "👨‍⚕️",
        "👩‍🦳",
        "👨‍🦳",
        "👩‍🦰",
        "👨‍🦰",

        // Dress & Fashion
        "👗",
        "👚",
        "👕",
        "👖",
        "👔",
        "👙",
        "👒",
        "🎩",
        "👢",
        "👠",
        "👡",
        "👟",
        "🥾",
        "🥿",
        "👑",
        "👒",

        // Gift & Celebration
        "🎁",
        "🎉",
        "🎊",
        "🎀",
        "🎈",
        "🥳",
        "🎂",
        "🍰",
        "🧁",
        "🎆",
        "🎇",
        "🧨",

        // Clouds & Weather
        "☁️",
        "🌥️",
        "🌦️",
        "🌤️",
        "🌧️",
        "⛈️",
        "🌩️",
        "🌨️",
        "🌪️",
        "🌈",
        "🌬️",

        // Animals
        "🐶",
        "🐱",
        "🐭",
        "🐹",
        "🐰",
        "🦊",
        "🦝",
        "🐻",
        "🐼",
        "🐨",
        "🐯",
        "🦁",
        "🐮",
        "🐷",
        "🐗",
        "🐴",
        "🐮",
        "🐔",
        "🐧",
        "🐦",
        "🐤",
        "🦆",
        "🦅",
        "🦉",
        "🦇",
        "🐸",
        "🐍",
        "🐢",
        "🦎",
        "🦋",
        "🐛",
        "🐜",
        "🦀",
        "🦑",
        "🦐",
        "🦞",
        "🦓",
        "🦒",

        // Nature & Plants
        "🌹",
        "🌻",
        "🌺",
        "🌼",
        "🌷",
        "🌸",
        "💐",
        "🌵",
        "🌴",
        "🌳",
        "🌲",
        "🌱",
        "🍃",
        "🌾",
        "🌿",
        "🍂",
        "🍁",

        // Insects & Bugs
        "🐝",
        "🦋",
        "🐜",
        "🐞",
        "🐜",
        "🐛",
        "🦗",
        "🦟",

        // Sun & Moon
        "🌞",
        "🌝",
        "🌚",
        "🌑",
        "🌒",
        "🌓",
        "🌔",
        "🌕",
        "🌖",
        "🌗",
        "🌘",

        // Thunder & Storms
        "⚡",
        "🌩️",
        "⛈️",
        "🌧️",

        // Food & Drink
        "🍎",
        "🍏",
        "🍊",
        "🍋",
        "🍒",
        "🍉",
        "🍇",
        "🍓",
        "🍍",
        "🍑",
        "🍈",
        "🥥",
        "🥝",
        "🍅",
        "🥭",
        "🍆",
        "🥔",
        "🥕",
        "🌽",
        "🌶️",
        "🥒",
        "🍄",
        "🥯",
        "🍞",
        "🥖",
        "🧀",
        "🥩",
        "🍗",
        "🍖",
        "🥓",
        "🥚",
        "🍳",
        "🍔",
        "🍟",
        "🍕",
        "🌮",
        "🌯",
        "🥙",
        "🥗",
        "🍝",
        "🍜",
        "🍲",
        "🥘",
        "🍛",
        "🍣",
        "🍤",
        "🍥",
        "🥟",
        "🍡",
        "🍧",
        "🍨",
        "🍦",
        "🥧",
        "🍪",
        "🍩",
        "🍫",
        "🍬",
        "🍭",
        "🍮",
        "🍪",

        // Drinks & Cups
        "🍻",
        "🍺",
        "🍷",
        "🍸",
        "🍹",
        "🥤",
        "☕",
        "🥂",
        "🥃",
        "🍾",
        "🥄",
        "🍽️",

        // Snacks & Treats
        "🍪",
        "🍩",
        "🍫",
        "🍬",
        "🍭",
        "🍮",
        "🍧",
        "🍨",
        "🍦",

        // Activity & Sports
        "⚽",
        "🏀",
        "🏈",
        "⚾",
        "🎾",
        "🏐",
        "🏉",
        "🥏",
        "🏓",
        "🏸",
        "🥅",
        "🎱",
        "🥊",
        "🥋",
        "🥇",
        "🥈",
        "🥉",
        "🏅",
        "🏆",
        "🎗️",
        "🎟️",
        "🎫",
        "🛹",
        "🎳",
        "🎮",
        "🕹️",
        "🎯",
        "🎮",
        "🥌",
        "🏒",
        "🥍",

        // Transportation & Vehicles
        "🚗",
        "🚙",
        "🚌",
        "🚎",
        "🚑",
        "🚒",
        "🚓",
        "🚕",
        "🚐",
        "🚚",
        "🚛",
        "🚜",
        "🚲",
        "🛵",
        "🏍️",
        "🚨",
        "🛴",
        "🚠",
        "🚟",
        "🚃",
        "🚋",
        "🚞",
        "🚝",
        "🚆",
        "🚄",
        "🚅",
        "🚈",
        "🚞",
        "🚂",
        "🚢",
        "⛴️",
        "🚤",
        "🛳️",
        "⛵",
        "🚀",
        "🛸",

        // Places & Landmarks
        "🏰",
        "🏯",
        "🗼",
        "🗽",
        "🏝️",
        "🏞️",
        "🏜️",
        "🏖️",
        "🏕️",
        "🛤️",
        "⛰️",
        "🌋",
        "🏠",
        "🏡",
        "🏢",
        "🏣",
        "🏤",
        "🏥",
        "🏦",
        "🏨",
        "🏩",

        // Objects & Things
        "🧳",
        "💼",
        "📱",
        "📲",
        "💻",
        "⌨️",
        "🖥️",
        "🖨️",
        "📷",
        "📸",
        "📹",
        "📺",
        "📞",
        "☎️",
        "📠",
        "📡",
        "💡",
        "🔦",
        "🕯️",
        "🔌",
        "🔋",
        "🔋",
        "📦",
        "📑",
        "📎",
        "🖊️",
        "🖋️",
        "✏️",
        "📝",
        "📍",
        "📅",
        "🗓️",
        "📌",
        "📖",
        "📚",
        "📜",

        // Symbols
        "❤️",
        "💛",
        "💚",
        "💙",
        "💜",
        "🖤",
        "🤍",
        "🤎",
        "💔",
        "❣️",
        "💥",
        "💫",
        "✨",
        "💢",
        "💣",
        "💬",
        "🗨️",
        "🗯️",
        "❗",
        "❕",
        "❓",
        "❔",
        "💡",
        "🔅",
        "🔆",
        "🔎",
        "🔍",
        "🔓",
        "🔒",
        "🔑",
        "🗝️",
        "🛠️",
        "🧰",
        "🧲",
        "🖇️",
        "📶",
    ];

    // Populate the emoji list dynamically
    emojis.forEach((emoji) => {
        const li = document.createElement("li");
        const emojiElement = document.createElement("a");
        emojiElement.href = "javascript:void(0);";
        emojiElement.classList.add("emoji");
        emojiElement.textContent = emoji;
        li.appendChild(emojiElement);
        emojiList.appendChild(li);
    });

    // Toggle emoji picker visibility when the emoji button is clicked
    emojiButton.addEventListener("click", () => {
        emojiPicker.style.display =
            emojiPicker.style.display === "none" ||
            emojiPicker.style.display === ""
                ? "block"
                : "none";
    });

    // Add emoji to input field when an emoji is selected
    const emojisInPicker = emojiPicker.querySelectorAll(".emoji");
    emojisInPicker.forEach((emoji) => {
        emoji.addEventListener("click", () => {
            inputField.value += emoji.textContent; // Add emoji to message input
            inputField.focus(); // Focus the input field
            inputField.selectionStart = inputField.selectionEnd =
                inputField.value.length; // Move cursor to the end
            emojiPicker.style.display = "none"; // Hide the picker after selection
        });
    });

    //Recorder

    let recorder;
    let context;
    let audio = document.querySelector("audio");
    let startBtn = document.getElementById("startRecording");
    let stopBtn = document.getElementById("stopRecording");
    let send_voice = document.getElementById("send_voice");
    window.URL = window.URL || window.webkitURL;

    /**
     * Detecte the correct AudioContext for the browser
     * */
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    navigator.getUserMedia =
        navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia;

    let onFail = function (e) {
        alert("Error " + e);
        console.log("Rejected!", e);
    };

    let onSuccess = function (s) {
        let tracks = s.getTracks();
        startBtn.setAttribute("disabled", true);
        send_voice.setAttribute("disabled", true);
        stopBtn.removeAttribute("disabled");
        context = new AudioContext();
        let mediaStreamSource = context.createMediaStreamSource(s);
        recorder = new Recorder(mediaStreamSource);
        recorder.record();

        stopBtn.addEventListener("click", () => {
            stopBtn.setAttribute("disabled", true);
            startBtn.removeAttribute("disabled");
            send_voice.removeAttribute("disabled");
            recorder.stop();
            tracks.forEach((track) => track.stop());
            recorder.exportWAV(function (s) {
                audio.src = window.URL.createObjectURL(s);
                const blobFile = new File([s], "file" + Date.now() + ".wav", {
                    type: "audio/wav",
                });
            });
        });

        send_voice.addEventListener("click", () => {
            stopBtn.setAttribute("disabled", true);
            startBtn.setAttribute("disabled", true);
            tracks.forEach((track) => track.stop());

            recorder.exportWAV(function (s) {
                const blobFile = new File([s], "file" + Date.now() + ".wav", {
                    type: "audio/wav",
                });
                voiceupload(blobFile, "");
                $("#record_audio").modal("hide");
                audio.removeAttribute("src");
            });
        });
    };

    startBtn.addEventListener("click", () => {
        navigator.mediaDevices
            .getUserMedia({ audio: true })
            .then(onSuccess)
            .catch(onFail);
    });

    async function voiceupload(files) {
        var fd = new FormData();
        fd.append("file", files);
        var atttype = 3;
        const fileUrl = await uploadFileToFirebase(files);

        let attachment = {
            bytesCount: files.size,
            name: files.name,
            url: fileUrl,
        };
        sendMessage(selectedUserId, attachment, atttype);
    }

    const toggleRecentChatsLink = document.getElementById("toggleRecentChats");
    const recentChatsContainer = document.getElementById(
        "recentChatsContainer"
    );
    const toggleText = document.getElementById("toggleText");

    // Check local storage for user preference
    const hideRecentChats = localStorage.getItem("hideRecentChats");
    if (hideRecentChats === "true") {
        recentChatsContainer.style.display = "none"; // Hide on load if preference is set
        toggleText.innerHTML = '<i class="ti ti-eye me-2"></i> Show Recent'; // Change text to show option with icon
    } else {
        toggleText.innerHTML = '<i class="ti ti-eye-off me-2"></i> Hide Recent'; // Set initial state if recent chats are visible
    }

    toggleRecentChatsLink.addEventListener("click", function (event) {
        event.preventDefault(); // Prevent the default anchor behavior

        // Toggle the visibility of the recent chats container
        if (recentChatsContainer.style.display === "none") {
            recentChatsContainer.style.display = "block"; // Show recent chats
            toggleText.innerHTML =
                '<i class="ti ti-eye-off me-2"></i> Hide Recent'; // Change text and icon to hide
            localStorage.setItem("hideRecentChats", "false"); // Update preference
        } else {
            recentChatsContainer.style.display = "none"; // Hide recent chats
            toggleText.innerHTML = '<i class="ti ti-eye me-2"></i> Show Recent'; // Change text and icon to show
            localStorage.setItem("hideRecentChats", "true"); // Update preference
        }
    });

    function displayContactsInModal(users) {
        const mainContainer = document.getElementById("main-container"); // The container inside the modal
        mainContainer.innerHTML = ""; // Clear previous contacts in the modal

        // Loop through the users and create user elements
        Object.keys(users).forEach((userId) => {
            const user = users[userId];

            // Create the contact user element
            const userListDiv = document.createElement("div");
            userListDiv.classList.add("contact-user");

            const innerDiv = document.createElement("div");
            innerDiv.classList.add(
                "d-flex",
                "align-items-center",
                "justify-content-between"
            );
            userListDiv.appendChild(innerDiv);

            const userLinks = document.createElement("a");
            userLinks.href = "#";
            userLinks.classList.add("contact-user-link");
            userLinks.onclick = () => {
                selectUser(userId); // Call selectUser with the userId
                const popup = document.querySelector("#new-chat"); // Close the popup
                if (popup) {
                    $(popup).modal("hide");
                }
            };

            const userInnerDiv = document.createElement("div");
            userInnerDiv.classList.add("d-flex", "align-items-center");

            const userAvatarDiv = document.createElement("div");
            userAvatarDiv.classList.add("avatar", "avatar-lg");

            // Retrieve the user data from Firebase
            const usersRef = ref(database, "data/users/" + userId);
            onValue(usersRef, (data) => {
                const userData = data.val();
                const userAvatarImage = document.createElement("img");
                userAvatarImage.src =
                    userData.image ||
                    "assets/img/profiles/avatar-03.jpg"; // Use the image or a dummy image
                userAvatarImage.classList.add("rounded-circle");
                userAvatarImage.alt = "Image";
                userAvatarDiv.appendChild(userAvatarImage);

                const userDetailsDiv = document.createElement("div");
                userDetailsDiv.classList.add("user-details", "ms-2");

                // Reference to the contact in the "contacts" table
                const contactsRef = ref(
                    database,
                    `data/contacts/${currentUser.uid}/${userId}`
                );
                onValue(contactsRef, (contactSnapshot) => {
                    const contactData = contactSnapshot.val();
                    let displayName =
                        contactData.firstName || contactData.mobile_number; // Default to user's username

                    // Create the userTitle element
                    const userTitle = document.createElement("h6");
                    userTitle.classList.add("user-title");

                    if (contactData && contactData.firstName) {
                        // If contact data exists, use it for the display name
                        displayName =
                            contactData.firstName + " " + contactData.lastName;
                        userTitle.textContent =
                            capitalizeFirstLetter(displayName);
                    } else {
                        // Fallback to the "users" table if contact data is unavailable
                        const userRef = ref(database, `data/users/${userId}`);
                        onValue(userRef, (userSnapshot) => {
                            const userData = userSnapshot.val();
                            displayName = `${
                                contactData.firstName ||
                                `${contactData.mobile_number}`
                            } ${contactData.lastName || ""}`.trim(); // Fallback logic
                            userTitle.textContent =
                                capitalizeFirstLetter(displayName);
                        });
                    }

                    // Append the element after determining the display name
                    userDetailsDiv.appendChild(userTitle);
                });

                // Create the online/offline indicator
                const onlineStatusDiv = document.createElement("div");
                onlineStatusDiv.classList.add("status-indicator");
                if (userData.status === "online") {
                    onlineStatusDiv.classList.add("online");
                } else {
                    onlineStatusDiv.classList.add("offline");
                }

                userInnerDiv.appendChild(userAvatarDiv);
                userInnerDiv.appendChild(userDetailsDiv);
                userInnerDiv.appendChild(onlineStatusDiv);

                userLinks.appendChild(userInnerDiv);
                userListDiv.appendChild(userLinks);

                // Append the new user list to the main container in the modal
                mainContainer.appendChild(userListDiv);
            });
        });
    }
    // Example of calling displayContactsInModal inside your modal
    const openNewChatModal = async () => {
        try {
            // Reference to the contacts of the current user
            const contactsRef = ref(
                database,
                "data/contacts/" + currentUser.uid
            );
            const contactsSnapshot = await get(contactsRef);

            if (contactsSnapshot.exists()) {
                const contacts = contactsSnapshot.val();

                // Get all contact IDs
                const contactIds = Object.keys(contacts);

                // Fetch corresponding users from the "users" collection
                const usersRef = ref(database, "data/users");
                const usersSnapshot = await get(usersRef);

                if (usersSnapshot.exists()) {
                    const users = usersSnapshot.val();

                    // Filter contacts that exist in the "users" collection
                    const validContacts = contactIds
                        .filter((contactId) => users[contactId]) // Keep only contacts that exist in users
                        .reduce((result, contactId) => {
                            result[contactId] = contacts[contactId]; // Build the filtered contacts object
                            return result;
                        }, {});

                    // Display the filtered contacts in the modal
                    displayContactsInModal(validContacts);
                } else {
                    console.log("No users found in the users collection.");
                }
            } else {
                console.log("No contacts found for the current user.");
            }
        } catch (error) {
            console.error("Error fetching contacts or users:", error);
        }
    };


// Assuming you have a button to open the modal
document
    .getElementById("newChatButton")
    .addEventListener("click", openNewChatModal);

// =================================================================
// AGORA AUDIO CALL IMPLEMENTATION (REVISED)
// =================================================================

const APP_ID = "e368b7a2b5d84c34a1b31da838758a32";
let audioClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
let localAudioTrack = null;
let callTimerInterval = null;
let currentCallId = null; // Keep track of the active call

// Firebase references
const callRef = ref(database, 'data/calls');
const usersRef = ref(database, 'data/users');

const audioCallButton = document.getElementById("audio-call-btn");
const joinCallButton = document.getElementById('join-audio-call');
const endCallButton = document.getElementById("end-audio-call");
const muteButton = document.getElementById("mute-btn");
const declineButton = document.getElementById("decline-audio-call");

// 1. INITIATE A CALL
if (audioCallButton) {
    audioCallButton.onclick = async (e) => {
        e.preventDefault();

        const receiverId = selectedUserId;
        if (!receiverId) {
            console.error("No user selected for the call.");
            return;
        }
        const currentUser = auth.currentUser;
        if (!currentUser) {
            console.error("User not authenticated.");
            return;
        }

        const callerId = currentUser.uid;
        const newCallId = push(callRef).key;
        const channelName = newCallId;
        
        // Fetch details for both users to construct the incomingcall string
        const [callerSnapshot, receiverSnapshot] = await Promise.all([
            get(child(usersRef, callerId)),
            get(child(usersRef, receiverId))
        ]);
        const callerData = callerSnapshot.val();
        const receiverData = receiverSnapshot.val();

        const callerName = `${callerData.firstName} ${callerData.lastName}`.trim() || "Unknown User";
        const callerImg = callerData.image || 'assets/img/profiles/avatar-03.jpg';
        const callerMobile = callerData.mobile_number || callerId;
        const receiverMobile = receiverData.mobile_number || receiverId;

        const callData = {
            callerId: [receiverId],
            callerImg: callerImg,
            callerName: callerName,
            currentMills: Date.now(),
            duration: "Ringing",
            id: newCallId,
            inOrOut: "OUT",
            type: "single",
            userId: callerId,
            video: false,
            channelName: channelName
        };

        await set(ref(database, `data/calls/${callerId}/${newCallId}`), callData);
        await set(ref(database, `data/calls/${receiverId}/${newCallId}`), {
            ...callData,
            inOrOut: "IN",
            userId: receiverId,
            callerId: [callerId]
        });

        const incomingCallString = `user_type=onetoone&call_type=audio&channelname=${channelName}&caller=${callerMobile}&receiver=${receiverMobile}&group=&currentuser=${callerMobile}`;
        await update(child(usersRef, callerId), {
            incomingcall: incomingCallString,
            call_status: false
        });
        await update(child(usersRef, receiverId), {
            incomingcall: incomingCallString,
            call_status: false
        });
        sendCallNotification(receiverId, callerMobile, "Audio call", channelName, callerId, callerName);

    };
}



// 3. ACCEPT A CALL
if (joinCallButton) {
    joinCallButton.onclick = async () => {
        if (!currentCallId) return;
        const currentUser = auth.currentUser;
        const callSnapshot = await get(ref(database, `data/calls/${currentUser.uid}/${currentCallId}`));
        if (!callSnapshot.exists()) return;

        const callData = callSnapshot.val();
        const callerId = callData.callerId[0];

        // This update triggers the onValue listener for both users to join the channel
        await update(ref(database, `data/calls/${currentUser.uid}/${currentCallId}`), { duration: "00:00:00" });
        await update(ref(database, `data/calls/${callerId}/${currentCallId}`), { duration: "00:00:00" });
    };
}

if (declineButton) {
    declineButton.onclick = async () => {
         if (!currentCallId) return;

        const currentUser = auth.currentUser;
        const callSnapshot = await get(ref(database, `data/calls/${currentUser.uid}/${currentCallId}`));
        if (!callSnapshot.exists()) return;

        const callData = callSnapshot.val();
        const otherUserId =
            callData.userId === currentUser.uid
                ? callData.callerId[0]
                : callData.userId;

        const [currentUserCall, otherUserCall] = await Promise.all([
            get(
                ref(database, `data/calls/${currentUser.uid}/${currentCallId}`)
            ),
            get(ref(database, `data/calls/${otherUserId}/${currentCallId}`)),
        ]);

        // 2. Update DB with final duration while preserving other data
        const updates = {};
        updates[`data/calls/${currentUser.uid}/${currentCallId}`] = {
            ...currentUserCall.val(),
            duration: "Declined",
        };
        updates[`data/calls/${otherUserId}/${currentCallId}`] = {
            ...otherUserCall.val(),
            duration: "Declined",
        };

        await update(ref(database), updates);
        

        // 2. Immediately clean up local state (don't wait for the listener)
        cleanUpLocalState();

        // 3. Clean up user status fields
        const userUpdates = {};
        userUpdates[`data/users/${currentUser.uid}/incomingcall`] = "";
        userUpdates[`data/users/${currentUser.uid}/call_status`] = true;
        userUpdates[`data/users/${otherUserId}/incomingcall`] = "";
        userUpdates[`data/users/${otherUserId}/call_status`] = true;
        
        await update(ref(database), userUpdates);
    };
}

// 4. END A CALL
if (endCallButton) {
    endCallButton.onclick = async () => {
        if (!currentCallId) return;

        const finalDuration = stopCallTimer();
        const currentUser = auth.currentUser;
        const callSnapshot = await get(ref(database, `data/calls/${currentUser.uid}/${currentCallId}`));
        if (!callSnapshot.exists()) return;

        const callData = callSnapshot.val();
        const otherUserId =
            callData.userId === currentUser.uid
                ? callData.callerId[0]
                : callData.userId;

        const [currentUserCall, otherUserCall] = await Promise.all([
            get(
                ref(database, `data/calls/${currentUser.uid}/${currentCallId}`)
            ),
            get(ref(database, `data/calls/${otherUserId}/${currentCallId}`)),
        ]);

        // 2. Update DB with final duration while preserving other data
        const updates = {};
        updates[`data/calls/${currentUser.uid}/${currentCallId}`] = {
            ...currentUserCall.val(),
            duration: finalDuration,
        };
        updates[`data/calls/${otherUserId}/${currentCallId}`] = {
            ...otherUserCall.val(),
            duration: finalDuration,
        };

        await update(ref(database), updates);
        

        // 2. Immediately clean up local state (don't wait for the listener)
        cleanUpLocalState();

        // 3. Clean up user status fields
        const userUpdates = {};
        userUpdates[`data/users/${currentUser.uid}/incomingcall`] = "";
        userUpdates[`data/users/${currentUser.uid}/call_status`] = true;
        userUpdates[`data/users/${otherUserId}/incomingcall`] = "";
        userUpdates[`data/users/${otherUserId}/call_status`] = true;
        
        await update(ref(database), userUpdates);
    };
}



// 5. HELPER FUNCTIONS

async function joinAgoraChannel(channelName, uid) {
    try {
        if (localAudioTrack) return; // Prevent joining twice
        await audioClient.join(APP_ID, channelName, null, uid);
        localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        await audioClient.publish([localAudioTrack]);
        
        // Alternative approach: Use user-joined event instead of user-published
        audioClient.on("user-joined", async (user) => {
            console.log(`User ${user.uid} joined the channel ${channelName}`);
            
            try {
                // Subscribe to audio immediately when user joins
                await audioClient.subscribe(user, "audio");
                console.log(`Successfully subscribed to audio for user ${user.uid}`);
                
                // Store user info for better tracking
                if (!window.agoraUsers) window.agoraUsers = {};
                window.agoraUsers[user.uid] = {
                    uid: user.uid,
                    channelName: channelName,
                    appId: APP_ID,
                    joinedAt: Date.now()
                };
                
                // Check if user has audio track and play it
                if (user.audioTrack) {
                    console.log(`Attempting to play audio for user ${user.uid} in channel ${channelName}...`);
                    
                    user.audioTrack.play().then(() => {
                        console.log(`Successfully playing audio for user ${user.uid} in channel ${channelName}.`);
                    }).catch(error => {
                        console.error(`Playback failed for user ${user.uid}:`, error);
                        
                        // Create play button for user interaction
                        const playButton = document.createElement('button');
                        playButton.textContent = `Click to play audio from user ${user.uid}`;
                        playButton.onclick = () => {
                            user.audioTrack.play().catch(e => console.error("Still failed to play:", e));
                            playButton.remove();
                        };
                        document.body.appendChild(playButton);
                    });
                }
            } catch (error) {
                console.error(`Failed to subscribe to user ${user.uid}:`, error);
            }
        });
        
        // Additional event listeners for better user tracking
        audioClient.on("user-joined", (user) => {
            console.log(`User ${user.uid} joined the channel ${channelName}`);
            if (!window.agoraUsers) window.agoraUsers = {};
            window.agoraUsers[user.uid] = {
                uid: user.uid,
                channelName: channelName,
                appId: APP_ID,
                joinedAt: Date.now()
            };
        });
        
        audioClient.on("user-left", (user) => {
            console.log(`User ${user.uid} left the channel ${channelName}`);
            if (window.agoraUsers && window.agoraUsers[user.uid]) {
                delete window.agoraUsers[user.uid];
            }
        });
        
        audioClient.on("user-unpublished", (user, mediaType) => {
            console.log(`User ${user.uid} unpublished ${mediaType} in channel ${channelName}`);
        });
        
        // Log all users in the channel
        audioClient.on("user-list-updated", (users) => {
            console.log(`Users in channel ${channelName}:`, users.map(u => u.uid));
        });
        
        // Alternative 3: Manual subscription check every few seconds
        const manualSubscriptionInterval = setInterval(async () => {
            try {
                const remoteUsers = audioClient.remoteUsers;
                console.log(`Manual check - Remote users in channel:`, remoteUsers.map(u => u.uid));
                
                for (const remoteUser of remoteUsers) {
                    if (remoteUser.hasAudio && !remoteUser.audioTrack) {
                        console.log(`Attempting manual subscription to user ${remoteUser.uid}`);
                        await audioClient.subscribe(remoteUser, "audio");
                        
                        if (remoteUser.audioTrack) {
                            console.log(`Manual subscription successful for user ${remoteUser.uid}`);
                            remoteUser.audioTrack.play().catch(error => {
                                console.error(`Manual playback failed for user ${remoteUser.uid}:`, error);
                            });
                        }
                    }
                }
            } catch (error) {
                console.error("Manual subscription check error:", error);
            }
        }, 3000); // Check every 3 seconds
        
        // Store interval ID for cleanup
        if (!window.agoraIntervals) window.agoraIntervals = {};
        window.agoraIntervals[channelName] = manualSubscriptionInterval;
        
        // Alternative 4: Add manual trigger function
        window.manualSubscribeToUsers = async () => {
            try {
                console.log("Manual subscription triggered");
                const remoteUsers = audioClient.remoteUsers;
                console.log("Available remote users:", remoteUsers);
                
                for (const remoteUser of remoteUsers) {
                    console.log(`Processing user ${remoteUser.uid}:`, {
                        hasAudio: remoteUser.hasAudio,
                        audioTrack: !!remoteUser.audioTrack,
                        uid: remoteUser.uid
                    });
                    
                    if (remoteUser.hasAudio && !remoteUser.audioTrack) {
                        console.log(`Subscribing to user ${remoteUser.uid}`);
                        await audioClient.subscribe(remoteUser, "audio");
                        
                        if (remoteUser.audioTrack) {
                            console.log(`Playing audio for user ${remoteUser.uid}`);
                            remoteUser.audioTrack.play().catch(error => {
                                console.error(`Playback failed for user ${remoteUser.uid}:`, error);
                            });
                        }
                    }
                }
            } catch (error) {
                console.error("Manual subscription error:", error);
            }
        };
        
        // Alternative 5: Add button to trigger manual subscription
        const manualButton = document.createElement('button');
        manualButton.textContent = 'Manual Subscribe to Users';
        manualButton.style.position = 'fixed';
        manualButton.style.top = '10px';
        manualButton.style.right = '10px';
        manualButton.style.zIndex = '9999';
        manualButton.onclick = window.manualSubscribeToUsers;
        document.body.appendChild(manualButton);
        
    } catch (error) {
        console.error("Agora Join Error:", error);
    }
}

function cleanUpLocalState() {
    stopCallTimer();
    
    // Clean up Agora resources
    if (localAudioTrack) {
        localAudioTrack.stop();
        localAudioTrack.close();
        localAudioTrack = null;
    }
    
    if (audioClient.connectionState === 'CONNECTED' || audioClient.connectionState === 'CONNECTING') {
        audioClient.leave().catch(e => console.error("Agora leave error:", e));
    }
    
    // Force close all call-related modals
    $('#voice-attend-new').modal('hide');
    $('#audio-call-modal').modal('hide');
    
    // Reset call tracking
    currentCallId = null;
    
    // Clear any pending call status in Firebase
    const currentUser = auth.currentUser;
    if (currentUser) {
        update(ref(database, `data/users/${currentUser.uid}`), {
            incomingcall: "",
            call_status: true
        }).catch(console.error);
    }
}

if (muteButton) {
    let isMuted = false;
    muteButton.onclick = async () => {
        if (localAudioTrack) {
            isMuted = !isMuted;
            await localAudioTrack.setMuted(isMuted);
            muteButton.innerHTML = isMuted ? '<i class="ti ti-microphone-off"></i>' : '<i class="ti ti-microphone"></i>';
        }
    };
}

function startCallTimer() {
    let seconds = 0;
    const timerDisplay = document.getElementById('call-timer-display');
    const loadingDisplay = timerDisplay ? timerDisplay.previousElementSibling : null;

    if (callTimerInterval) clearInterval(callTimerInterval);
    if(timerDisplay) timerDisplay.textContent = "00:00:00";
    if(loadingDisplay) loadingDisplay.style.display = 'none';
    if(timerDisplay) timerDisplay.style.display = 'block';

    callTimerInterval = setInterval(() => {
        seconds++;
        const format = (val) => `0${Math.floor(val)}`.slice(-2);
        const hours = seconds / 3600;
        const minutes = (seconds % 3600) / 60;
        const secs = seconds % 60;
        const timeString = `${format(hours)}:${format(minutes)}:${format(secs)}`;
        if (timerDisplay) {
            timerDisplay.textContent = timeString;
        }
    }, 1000);
}

function stopCallTimer() {
    clearInterval(callTimerInterval);
    const timerDisplay = document.getElementById('call-timer-display');
    const loadingDisplay = timerDisplay ? timerDisplay.previousElementSibling : null;
    let finalDuration = "00:00:00";

    if (timerDisplay) {
        finalDuration = timerDisplay.textContent;
        timerDisplay.style.display = 'none';
    }
    if (loadingDisplay) {
        loadingDisplay.style.display = 'block';
    }
    return finalDuration;
}

async function updateModalUserDetails(userId) {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    // Get the other user's details
    const otherUserSnapshot = await get(child(usersRef, userId));
    // Get current user's details
    const currentUserSnapshot = await get(child(usersRef, currentUser.uid));

    if (otherUserSnapshot.exists()) {
        const userData = otherUserSnapshot.val();
        const userName = `${userData.firstName} ${userData.lastName}`.trim() || 'Unknown User';
        const userImage = userData.image || 'assets/img/profiles/avatar-03.jpg';

        // Update audio call modal (incoming call screen)
        $('.audio-name').text(userName);
        $('.avatar-audio img').attr('src', userImage);
        
        // Update voice attend modal (active call screen)
        $('.new-name h6').first().text(userName);
        $('.avatar-new-audio img').attr('src', userImage);
        $('.avatar-new-audio-big img').attr('src', userImage);
    }

    if (currentUserSnapshot.exists()) {
        const currentUserData = currentUserSnapshot.val();
        const currentUserImage = currentUserData.image || 'assets/img/profiles/avatar-03.jpg';
        
        // Update current user's image in voice attend modal
        $('.current-image img').attr('src', currentUserImage);
    }
}

async function sendCallNotification(toId, phone, title, channelName, fromId, callerName) {
    try {
        const snapshot = await get(ref(database, `data/users/${toId}/deviceToken`));
        if (!snapshot.exists()) {
            console.error(`Device token not found for user: ${toId}`);
            return;
        }
        const deviceToken = snapshot.val();
        await fetch('/api/send-call-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                body: phone, toId, callerName, title, fromId, channelName, device_token: deviceToken
            })
        });
    } catch (error) {
        console.error('Error sending notification:', error);
    }
}


onValue(ref(database, `data/calls`), (snapshot) => {
    const allCalls = snapshot.val();
    const currentUser = auth.currentUser;
    if (!currentUser || !allCalls) {
        cleanUpLocalState();
        return;
    }

    let activeCall = null;
    let ringingCall = null;

    if (allCalls[currentUser.uid]) {
        for (const callId in allCalls[currentUser.uid]) {
            const call = allCalls[currentUser.uid][callId];
            
            if (call.duration === "Declined" || call.duration === "Ended") {
                continue;
            }
            
            if(call.video == false)
            {
            if (call.duration === "00:00:00") {
                activeCall = call;
                break;
            }
            
            if (call.duration === "Ringing") {
                ringingCall = call;
            }
            }
        }
    }

    if (activeCall) {
        console.log("Active call found:", activeCall);
        currentCallId = activeCall.id;
        if (!localAudioTrack) {
            // Determine who is the other participant
            const otherUserId = activeCall.userId === currentUser.uid 
                ? activeCall.callerId[0] 
                : activeCall.userId;
            updateModalUserDetails(otherUserId);
            joinAgoraChannel(activeCall.channelName, currentUser.uid);
            $('#audio-call-modal').modal('hide');
            $('#voice-attend-new').modal('show');
            startCallTimer();
        }
    } 
    else if (ringingCall) {
        console.log("Ringing call found:", ringingCall);
        currentCallId = ringingCall.id;
        // The other user is the caller if this is an incoming call
        const otherUserId = ringingCall.inOrOut === 'IN' 
            ? ringingCall.callerId[0] 
            : ringingCall.userId;
        updateModalUserDetails(otherUserId);
        $('#voice-attend-new').modal('hide');
        $('#audio-call-modal').modal('show');
    }
    else if (currentCallId) {
        cleanUpLocalState();
    }
});

// =================================================================
// AGORA VIDEO CALL IMPLEMENTATION (REVISED)
// =================================================================

const VIDEO_APP_ID = "e368b7a2b5d84c34a1b31da838758a32"; // Same or different from audio app ID
let videoClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
let localVideoTrack = null;
let localAudioTrackForVideo = null;
let videoCallTimerInterval = null;
let currentVideoCallId = null;

// Video call UI elements
const videoCallButton = document.getElementById("video-call-new-btn");
const joinVideoCallButton = document.getElementById("join-video-call");
const endVideoCallButton = document.getElementById("leave-video-call");
const muteVideoAudioButton = document.getElementById("mute-call");
const muteVideoButton = document.getElementById("video-mute-call");
const declineVideoButton = document.getElementById("decline-video-call");

// 1. INITIATE A VIDEO CALL (No major changes needed here, logic is sound)
if (videoCallButton) {
    videoCallButton.onclick = async (e) => {
        e.preventDefault();

        const receiverId = selectedUserId;
        if (!receiverId) {
            console.error("No user selected for the call.");
            return;
        }
        const currentUser = auth.currentUser;
        if (!currentUser) {
            console.error("User not authenticated.");
            return;
        }

        const callerId = currentUser.uid;
        const newCallId = push(callRef).key;
        const channelName = newCallId;
        
        const [callerSnapshot, receiverSnapshot] = await Promise.all([
            get(child(usersRef, callerId)),
            get(child(usersRef, receiverId))
        ]);
        const callerData = callerSnapshot.val();
        const receiverData = receiverSnapshot.val();

        const callerName = `${callerData.firstName} ${callerData.lastName}`.trim() || "Unknown User";
        const callerImg = callerData.image || 'assets/img/profiles/avatar-03.jpg';
        
        const callData = {
            callerId: [receiverId], // The other person in the call
            callerImg: callerImg,
            callerName: callerName,
            currentMills: Date.now(),
            duration: "Ringing",
            id: newCallId,
            inOrOut: "OUT",
            type: "single",
            userId: callerId, // The owner of this call record
            video: true,
            channelName: channelName
        };

        // Create call records for both users
        const updates = {};
        updates[`data/calls/${callerId}/${newCallId}`] = callData;
        updates[`data/calls/${receiverId}/${newCallId}`] = {
            ...callData,
            callerId: [callerId], // The other person is the original caller
            inOrOut: "IN",
            userId: receiverId, // The owner of this record is the receiver
        };
        
        await update(ref(database), updates);

        // Send notification
        sendCallNotification(receiverId, callerData.mobile_number, "Video call", channelName, callerId, callerName);
    };
}

// 2. ACCEPT A VIDEO CALL
if (joinVideoCallButton) {
    joinVideoCallButton.onclick = async () => {
        if (!currentVideoCallId) {
            console.error("Cannot accept call, currentVideoCallId is not set.");
            return;
        }
        const currentUser = auth.currentUser;

        // Immediately hide the ringing modal for a faster UI response
        $('#video-call').modal('hide');

        const callSnapshot = await get(ref(database, `data/calls/${currentUser.uid}/${currentVideoCallId}`));
        if (!callSnapshot.exists()) return;

        const callData = callSnapshot.val();
        const otherUserId = callData.callerId[0];

        // Update the database. The onValue listener will do the rest.
        const updates = {};
        updates[`data/calls/${currentUser.uid}/${currentVideoCallId}/duration`] = "00:00:00";
        updates[`data/calls/${otherUserId}/${currentVideoCallId}/duration`] = "00:00:00";
        
        await update(ref(database), updates);
    };
}

// 3. DECLINE OR END A CALL (Combined logic for End & Decline as they are similar)
async function endOrDeclineCall(status) {
    if (!currentVideoCallId) return;

    const finalDuration = (status === "Declined") ? "Declined" : stopVideoCallTimer();
    const currentUser = auth.currentUser;
    const callSnapshot = await get(ref(database, `data/calls/${currentUser.uid}/${currentVideoCallId}`));
    if (!callSnapshot.exists()) {
        cleanUpVideoLocalState(); // Clean up if call record is already gone
        return;
    }

    const callData = callSnapshot.val();
    const otherUserId = callData.callerId[0];

    // <-- FIX: Update the database for BOTH users to end the call for everyone.
    const updates = {};
    updates[`data/calls/${currentUser.uid}/${currentVideoCallId}/duration`] = finalDuration;
    updates[`data/calls/${otherUserId}/${currentVideoCallId}/duration`] = finalDuration;
    
    // <-- FIX: Clean up user status fields for BOTH users.
    updates[`data/users/${currentUser.uid}/incomingcall`] = "";
    updates[`data/users/${currentUser.uid}/call_status`] = true;
    updates[`data/users/${otherUserId}/incomingcall`] = "";
    updates[`data/users/${otherUserId}/call_status`] = true;
    
    await update(ref(database), updates);
    
    // The `onValue` listener on both clients will see the change and trigger cleanUpVideoLocalState().
    // We can call it here immediately for the current user for faster UI response.
    cleanUpVideoLocalState();
}

if (declineVideoButton) {
    declineVideoButton.onclick = () => endOrDeclineCall("Declined");
}

if (endVideoCallButton) {
    endVideoCallButton.onclick = () => endOrDeclineCall("Ended");
}

// 5. VIDEO CALL HELPER FUNCTIONS

async function joinAgoraVideoChannel(channelName, uid) {
    try {
        // Prevent joining if already connected or connecting
        if (videoClient.connectionState === 'CONNECTED' || videoClient.connectionState === 'CONNECTING') {
            return;
        }
        
        $('#video-call').modal('hide');
        $('#start-video-call-container').modal('show');
        
        await videoClient.join(VIDEO_APP_ID, channelName, null, uid);
        
        // Create tracks in parallel
        [localAudioTrackForVideo, localVideoTrack] = await Promise.all([
            AgoraRTC.createMicrophoneAudioTrack(),
            AgoraRTC.createCameraVideoTrack()
        ]);
        
        await videoClient.publish([localAudioTrackForVideo, localVideoTrack]);
        
        const localPlayerContainer = document.getElementById('video-container');
        localPlayerContainer.innerHTML = ''; // Clear any previous profile image
        localVideoTrack.play(localPlayerContainer);

        startVideoCallTimer(); // Start timer after successful join
        
        // Alternative approach: Use user-joined event instead of user-published for video calls
        videoClient.on("user-joined", async (user) => {
            console.log(`Video user ${user.uid} joined the channel ${channelName}`);
            
            try {
                // Subscribe to both audio and video immediately when user joins
                await videoClient.subscribe(user, "audio");
                await videoClient.subscribe(user, "video");
                console.log(`Successfully subscribed to audio and video for user ${user.uid}`);
                
                // Store user info for better tracking
                if (!window.agoraVideoUsers) window.agoraVideoUsers = {};
                window.agoraVideoUsers[user.uid] = {
                    uid: user.uid,
                    channelName: channelName,
                    appId: VIDEO_APP_ID,
                    joinedAt: Date.now()
                };
                
                // Handle video display
                let remotePlayerContainer = document.getElementById(`remote-player-${user.uid}`);
                if (!remotePlayerContainer) {
                    remotePlayerContainer = document.createElement("div");
                    remotePlayerContainer.id = `remote-player-${user.uid}`;
                    remotePlayerContainer.className = "remote-player";
                    document.getElementById("remote-playerlist").appendChild(remotePlayerContainer);
                }
                
                // Play video track
                if (user.videoTrack) {
                    console.log(`Playing video for user ${user.uid}`);
                    remotePlayerContainer.innerHTML = '';
                    user.videoTrack.play(remotePlayerContainer);
                }
                
                // Play audio track
                if (user.audioTrack) {
                    console.log(`Playing audio for user ${user.uid}`);
                    user.audioTrack.play().catch(error => {
                        console.error(`Audio playback failed for user ${user.uid}:`, error);
                        
                        // Create play button for user interaction
                        const playButton = document.createElement('button');
                        playButton.textContent = `Click to play audio from user ${user.uid}`;
                        playButton.onclick = () => {
                            user.audioTrack.play().catch(e => console.error("Still failed to play:", e));
                            playButton.remove();
                        };
                        document.body.appendChild(playButton);
                    });
                }
                
                updateRemoteUserDetails(user.uid);
                
            } catch (error) {
                console.error(`Failed to subscribe to user ${user.uid}:`, error);
            }
        });
        
        // Keep original event listeners as fallback
        videoClient.on("user-published", handleUserPublished);
        videoClient.on("user-unpublished", handleUserUnpublished);
        
        // Additional event listeners for better user tracking
        videoClient.on("user-left", (user) => {
            console.log(`Video user ${user.uid} left the channel ${channelName}`);
            if (window.agoraVideoUsers && window.agoraVideoUsers[user.uid]) {
                delete window.agoraVideoUsers[user.uid];
            }
        });
        
        // Manual subscription check every few seconds for video calls
        const videoManualSubscriptionInterval = setInterval(async () => {
            try {
                const remoteUsers = videoClient.remoteUsers;
                console.log(`Video manual check - Remote users in channel:`, remoteUsers.map(u => u.uid));
                
                for (const remoteUser of remoteUsers) {
                    if ((remoteUser.hasAudio && !remoteUser.audioTrack) || 
                        (remoteUser.hasVideo && !remoteUser.videoTrack)) {
                        console.log(`Attempting manual subscription to video user ${remoteUser.uid}`);
                        
                        if (remoteUser.hasAudio && !remoteUser.audioTrack) {
                            await videoClient.subscribe(remoteUser, "audio");
                        }
                        if (remoteUser.hasVideo && !remoteUser.videoTrack) {
                            await videoClient.subscribe(remoteUser, "video");
                        }
                        
                        // Handle display after subscription
                        if (remoteUser.audioTrack || remoteUser.videoTrack) {
                            handleVideoUserDisplay(remoteUser);
                        }
                    }
                }
            } catch (error) {
                console.error("Video manual subscription check error:", error);
            }
        }, 3000); // Check every 3 seconds
        
        // Store interval ID for cleanup
        if (!window.agoraIntervals) window.agoraIntervals = {};
        window.agoraIntervals[`video_${channelName}`] = videoManualSubscriptionInterval;
        
        // Manual trigger function for video calls
        window.manualSubscribeToVideoUsers = async () => {
            try {
                console.log("Manual video subscription triggered");
                const remoteUsers = videoClient.remoteUsers;
                console.log("Available video remote users:", remoteUsers);
                
                for (const remoteUser of remoteUsers) {
                    console.log(`Processing video user ${remoteUser.uid}:`, {
                        hasAudio: remoteUser.hasAudio,
                        hasVideo: remoteUser.hasVideo,
                        audioTrack: !!remoteUser.audioTrack,
                        videoTrack: !!remoteUser.videoTrack,
                        uid: remoteUser.uid
                    });
                    
                    if (remoteUser.hasAudio && !remoteUser.audioTrack) {
                        console.log(`Subscribing to audio for video user ${remoteUser.uid}`);
                        await videoClient.subscribe(remoteUser, "audio");
                    }
                    
                    if (remoteUser.hasVideo && !remoteUser.videoTrack) {
                        console.log(`Subscribing to video for user ${remoteUser.uid}`);
                        await videoClient.subscribe(remoteUser, "video");
                    }
                    
                    // Handle display after subscription
                    if (remoteUser.audioTrack || remoteUser.videoTrack) {
                        handleVideoUserDisplay(remoteUser);
                    }
                }
            } catch (error) {
                console.error("Manual video subscription error:", error);
            }
        };
        
        // Add button to trigger manual video subscription
        const videoManualButton = document.createElement('button');
        videoManualButton.textContent = 'Manual Subscribe to Video Users';
        videoManualButton.style.position = 'fixed';
        videoManualButton.style.top = '50px';
        videoManualButton.style.right = '10px';
        videoManualButton.style.zIndex = '9999';
        videoManualButton.onclick = window.manualSubscribeToVideoUsers;
        document.body.appendChild(videoManualButton);

    } catch (error) {
        console.error("Agora Video Join Error:", error);
        cleanUpVideoLocalState(); // Clean up if join fails
    }
}

async function handleUserPublished(user, mediaType) {
    await videoClient.subscribe(user, mediaType);
    
    let remotePlayerContainer = document.getElementById(`remote-player-${user.uid}`);
    if (!remotePlayerContainer) {
        remotePlayerContainer = document.createElement("div");
        remotePlayerContainer.id = `remote-player-${user.uid}`;
        remotePlayerContainer.className = "remote-player";
        document.getElementById("remote-playerlist").appendChild(remotePlayerContainer);
    }
    
    if (mediaType === "video") {
        remotePlayerContainer.innerHTML = ''; // Clear profile pic if video starts
        user.videoTrack.play(remotePlayerContainer);
    }
    
    if (mediaType === "audio") {
        user.audioTrack.play();
    }
    updateRemoteUserDetails(user.uid); // Update name/UI elements
}

function handleUserUnpublished(user, mediaType) {
    if (mediaType === 'video') {
        const remotePlayerContainer = document.getElementById(`remote-player-${user.uid}`);
        if (remotePlayerContainer) {
            // <-- FIX: Don't remove the container, show profile image instead.
            showProfileImage(remotePlayerContainer, user.uid);
        }
    }
}

// Helper function to handle video user display after subscription
function handleVideoUserDisplay(remoteUser) {
    let remotePlayerContainer = document.getElementById(`remote-player-${remoteUser.uid}`);
    if (!remotePlayerContainer) {
        remotePlayerContainer = document.createElement("div");
        remotePlayerContainer.id = `remote-player-${remoteUser.uid}`;
        remotePlayerContainer.className = "remote-player";
        document.getElementById("remote-playerlist").appendChild(remotePlayerContainer);
    }
    
    // Handle video display
    if (remoteUser.videoTrack) {
        console.log(`Playing video for user ${remoteUser.uid}`);
        remotePlayerContainer.innerHTML = '';
        remoteUser.videoTrack.play(remotePlayerContainer);
    }
    
    // Handle audio display
    if (remoteUser.audioTrack) {
        console.log(`Playing audio for user ${remoteUser.uid}`);
        remoteUser.audioTrack.play().catch(error => {
            console.error(`Audio playback failed for user ${remoteUser.uid}:`, error);
        });
    }
    
    // Update UI elements
    updateRemoteUserDetails(remoteUser.uid);
}

async function updateRemoteUserDetails(userId) {
    try {
        const userSnapshot = await get(child(usersRef, userId));
        if (!userSnapshot.exists()) return;
        
        const userData = userSnapshot.val();
        const userName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'User';

        // Update the header of the active call modal
        document.querySelector('#start-video-call-container .user-video-head .user-name').textContent = userName;
        const userImgElement = document.querySelector('#start-video-call-container .user-video-head .avatar-video img');
        if (userImgElement) {
            userImgElement.src = userData.image || 'assets/img/profiles/avatar-03.jpg';
            userImgElement.alt = userName;
        }

        // <-- FIX: If remote video is not playing, show profile image as fallback.
        const remotePlayerContainer = document.getElementById(`remote-player-${userId}`);
        const remoteVideo = remotePlayerContainer?.querySelector('video');
        if (!remoteVideo && remotePlayerContainer) {
            showProfileImage(remotePlayerContainer, userId);
        }

    } catch (error) {
        console.error('Error updating remote user details:', error);
    }
}

async function showProfileImage(container, userId) {
    try {
        const userSnapshot = await get(child(usersRef, userId));
        if (!userSnapshot.exists()) return;
        
        const userData = userSnapshot.val();
        const userName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'User';
        const userImage = userData.image || 'assets/img/profiles/avatar-03.jpg';

        container.innerHTML = ''; // Clear previous content (like video player)
        
        const img = document.createElement("img");
        img.src = userImage;
        img.alt = userName;
        
        // Use the new, more specific class for styling.
        // The centering is now handled by the parent container's CSS.
        img.className = "user-image-fallback"; 
        
        container.appendChild(img);

    } catch (error) {
        console.error('Error showing profile image:', error);
    }
}


function cleanUpVideoLocalState() {
    stopVideoCallTimer();
    
    if (localVideoTrack) {
        localVideoTrack.stop();
        localVideoTrack.close();
        localVideoTrack = null;
    }
    
    if (localAudioTrackForVideo) {
        localAudioTrackForVideo.stop();
        localAudioTrackForVideo.close();
        localAudioTrackForVideo = null;
    }
    
    // Unsubscribe from events to prevent memory leaks
    videoClient.off("user-published", handleUserPublished);
    videoClient.off("user-unpublished", handleUserUnpublished);
    videoClient.off("user-joined");
    videoClient.off("user-left");
    
    if (videoClient.connectionState === 'CONNECTED' || videoClient.connectionState === 'CONNECTING') {
        videoClient.leave().catch(e => console.error("Agora video leave error:", e));
    }
    
    // Clean up video intervals
    if (window.agoraIntervals) {
        Object.keys(window.agoraIntervals).forEach(key => {
            if (key.startsWith('video_')) {
                clearInterval(window.agoraIntervals[key]);
                delete window.agoraIntervals[key];
            }
        });
    }
    
    // Clean up video users tracking
    if (window.agoraVideoUsers) {
        window.agoraVideoUsers = {};
    }
    
    // Remove manual video subscription button
    const videoManualButton = document.querySelector('button[onclick="window.manualSubscribeToVideoUsers"]');
    if (videoManualButton) {
        videoManualButton.remove();
    }
    
    const remotePlayerList = document.getElementById("remote-playerlist");
    if (remotePlayerList) remotePlayerList.innerHTML = "";
    
    const localPlayerContainer = document.getElementById('video-container');
    if (localPlayerContainer) localPlayerContainer.innerHTML = ''; // Clear local view
    
    $('#start-video-call-container').modal('hide');
    $('#video-call').modal('hide');
    
    currentVideoCallId = null;
}

// Mute/unmute audio in video call
if (muteVideoAudioButton) {
    let isVideoAudioMuted = false;
    muteVideoAudioButton.onclick = async () => {
        // <-- FIX: Add a guard to ensure the track exists.
        if (!localAudioTrackForVideo) return;
        
        isVideoAudioMuted = !isVideoAudioMuted;
        await localAudioTrackForVideo.setMuted(isVideoAudioMuted);
        muteVideoAudioButton.innerHTML = isVideoAudioMuted 
            ? '<i class="ti ti-microphone-off"></i>' 
            : '<i class="ti ti-microphone"></i>';
    };
}

// Mute/unmute video in video call
if (muteVideoButton) {
    let isVideoMuted = false;
    muteVideoButton.onclick = async () => {
        // <-- FIX: Add a guard to ensure the track exists.
        if (!localVideoTrack) return;
        
        isVideoMuted = !isVideoMuted;
        await localVideoTrack.setMuted(isVideoMuted);
        muteVideoButton.innerHTML = isVideoMuted 
            ? '<i class="ti ti-video-off"></i>' 
            : '<i class="ti ti-video"></i>';
        
        const localPlayerContainer = document.getElementById('video-container');
        if (isVideoMuted) {
            showProfileImage(localPlayerContainer, auth.currentUser.uid);
        } else {
            localPlayerContainer.innerHTML = '';
            localVideoTrack.play(localPlayerContainer);
        }
    };
}

// Timer functions (No changes needed)
function startVideoCallTimer() {
    let seconds = 0;
    if (videoCallTimerInterval) clearInterval(videoCallTimerInterval);
    
    const timerDisplays = [
        document.getElementById('video-call-timer-display'), // In header of modal
        document.getElementById('local-call-timer') // Also in header
    ].filter(Boolean);
    
    videoCallTimerInterval = setInterval(() => {
        seconds++;
        const timeString = new Date(seconds * 1000).toISOString().substr(11, 8);
        timerDisplays.forEach(display => {
            if (display) display.textContent = timeString;
        });
    }, 1000);
}

function stopVideoCallTimer() {
    clearInterval(videoCallTimerInterval);
    videoCallTimerInterval = null;
    const timerDisplay = document.getElementById('local-call-timer');
    return timerDisplay ? timerDisplay.textContent : "00:00:00";
}


// <-- FIX: Renamed and clarified this function's purpose
async function updateRingingModalDetails(callData) {
    const otherUserId = callData.callerId[0];

    try {
        const otherUserSnapshot = await get(child(usersRef, otherUserId));
        if (otherUserSnapshot.exists()) {
            const userData = otherUserSnapshot.val();
            const userName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Unknown User';
            const userImage = userData.image || 'assets/img/profiles/avatar-03.jpg';

            const modal = $('#video-call');
            modal.find('.modal-title').text(`Video Call from ${userName}`);
            modal.find('.avatar img').attr('src', userImage).attr('alt', userName);
            modal.find('h6').text(userName);
        }
    } catch (error) {
        console.error('Error updating video modal details:', error);
    }
}


 async function sendVideoCallNotification(toId, fromName, title, channelName, callerName) {
    try {
        const snapshot = await get(ref(database, `data/users/${toId}/deviceToken`));
        if (!snapshot.exists()) {
            console.error(`Device token not found for user: ${toId}`);
            return;
        }
        const deviceToken = snapshot.val();
        await fetch('/api/send-call-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                body: fromName, 
                toId, 
                callerName, 
                title, 
                channelName, 
                device_token: deviceToken,
                call_type: "video"
            })
        });
    } catch (error) {
        console.error('Error sending video call notification:', error);
    }
}

// Add this new helper function somewhere in your "VIDEO CALL HELPER FUNCTIONS" section

/**
 * Shows the main video call UI for an outgoing call before it's connected.
 * @param {object} callData The call data from Firebase.
 */
async function showOutgoingCallUI(callData) {
    const otherUserId = callData.callerId[0];

    try {
        const otherUserSnapshot = await get(child(usersRef, otherUserId));
        if (!otherUserSnapshot.exists()) return;

        const userData = otherUserSnapshot.val();
        const userName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Unknown User';
        const userImage = userData.image || 'assets/img/profiles/avatar-03.jpg';

        // Get the active call modal elements
        const modal = $('#start-video-call-container');
        const timerDisplay = modal.find('#local-call-timer');
        const headerTimerDisplay = modal.find('#video-call-timer-display');

        // Update user details in the modal header
        modal.find('.user-video-head .user-name').text(userName);
        modal.find('.user-video-head .avatar-video img').attr('src', userImage);

        // Set the status to "Ringing..." instead of a timer
        if (timerDisplay) timerDisplay.text('Ringing...');
        if (headerTimerDisplay) headerTimerDisplay.text('Ringing...');

        // Show the user's profile picture in the remote player area while ringing
        const remotePlayerContainer = document.getElementById("remote-playerlist");
        if(remotePlayerContainer) {
            remotePlayerContainer.innerHTML = `<div id="remote-player-${otherUserId}" class="remote-player"></div>`;
            await showProfileImage(document.getElementById(`remote-player-${otherUserId}`), otherUserId);
        }

        // Show the modal
        modal.modal('show');

    } catch (error) {
        console.error('Error showing outgoing call UI:', error);
    }
}


// =================================================================
// REALTIME DATABASE LISTENER - THE CORE LOGIC (CORRECTED)
// =================================================================
onValue(ref(database, 'data/calls'), (snapshot) => {
    const allCalls = snapshot.val();
    const currentUser = auth.currentUser;

    if (!currentUser || !allCalls) {
        if (currentVideoCallId) cleanUpVideoLocalState();
        return;
    }

    const userCalls = allCalls[currentUser.uid];
    let callToProcess = null;

    if (userCalls) {
        // Priority 1: Find a call that was just accepted (duration "00:00:00" is the trigger).
        const acceptedCall = Object.values(userCalls).find(c => c.video && c.duration === "00:00:00");

        // Priority 2: If no call was just accepted, find a ringing call.
        const ringingCall = Object.values(userCalls).find(c => c.video && c.duration === "Ringing");

        // An accepted call takes precedence over a ringing one.
        callToProcess = acceptedCall || ringingCall;
    }

    if (callToProcess) {
        // A valid call (ringing or accepted) has been found.
        currentVideoCallId = callToProcess.id;
        const otherUserId = callToProcess.callerId[0];

        // --- STATE 1: Call Accepted ---
        // The `duration` is "00:00:00". This is the trigger for both users to join the Agora channel.
        if (callToProcess.duration === "00:00:00") {
            // Join the channel if we are not already connected.
            if (!localVideoTrack && videoClient.connectionState !== 'CONNECTED') {
                updateRemoteUserDetails(otherUserId); // Pre-populate remote user details
                joinAgoraVideoChannel(callToProcess.channelName, currentUser.uid);
            }
        }
        // --- STATE 2: Call is Ringing ---
        else if (callToProcess.duration === "Ringing") {
            // If it's an INCOMING call for me, show the ringing modal.
            if (callToProcess.inOrOut === "IN" && !$('#video-call').is(':visible')) {
                updateRingingModalDetails(callToProcess);
                $('#video-call').modal('show');
            }
            // If it's an OUTGOING call I started, show the "calling..." screen.
            else if (callToProcess.inOrOut === "OUT" && !$('#start-video-call-container').is(':visible')) {
                showOutgoingCallUI(callToProcess);
            }
        }
    } else {
        // --- STATE 3: No Active Call Found ---
        // No call is "Ringing" or has the "00:00:00" trigger.
        // This means the call was ended (duration is now a timestamp like "00:02:15") or declined.
        // If we previously had a `currentVideoCallId`, it's time to clean up.
        if (currentVideoCallId) {
            cleanUpVideoLocalState();
        }
    }
});


});
