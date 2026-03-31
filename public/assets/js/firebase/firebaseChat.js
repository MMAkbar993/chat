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
    /** Same-tab only: restores open chat after refresh. Do not use localStorage for panel visibility (stale after SPA / no selection). */
    const CHAT_ACTIVE_PEER_SESSION_KEY = "dreamchat_active_peer";

    let typingIdleTimer = null;
    function clearChatTyping() {
        if (typingIdleTimer) {
            clearTimeout(typingIdleTimer);
            typingIdleTimer = null;
        }
        if (!currentUser || !currentUser.uid) return;
        update(ref(database, `data/users/${currentUser.uid}`), {
            typing: "",
        }).catch(() => {});
    }
    function pulseChatTyping(recipientId) {
        if (!currentUser || !currentUser.uid || !recipientId) return;
        update(ref(database, `data/users/${currentUser.uid}`), {
            typing: recipientId,
        }).catch(() => {});
        if (typingIdleTimer) clearTimeout(typingIdleTimer);
        typingIdleTimer = setTimeout(clearChatTyping, 3000);
    }

    let chatHeaderStatusUnsub = null;
    let chatHeaderTypingUnsub = null;
    let lastPartnerStatusForHeader = "offline";
    let headerShowsTyping = false;

    let mediaPanelRoomUnsub = null;
    let mediaPanelRefreshTimer = null;

    function detachMediaPanelRoomListener() {
        if (mediaPanelRefreshTimer) {
            clearTimeout(mediaPanelRefreshTimer);
            mediaPanelRefreshTimer = null;
        }
        if (typeof mediaPanelRoomUnsub === "function") {
            try {
                mediaPanelRoomUnsub();
            } catch (e) {
                /* ignore */
            }
            mediaPanelRoomUnsub = null;
        }
    }

    function attachMediaPanelRoomListener() {
        detachMediaPanelRoomListener();
        if (!currentUser?.uid || !selectedUserId) return;
        const canonicalRoomId = getDeterministicChatRoomId(
            currentUser.uid,
            selectedUserId
        );
        const roomRef = ref(database, `data/chats/${canonicalRoomId}`);
        mediaPanelRoomUnsub = onValue(roomRef, () => {
            if (mediaPanelRefreshTimer) clearTimeout(mediaPanelRefreshTimer);
            mediaPanelRefreshTimer = setTimeout(() => {
                if (
                    typeof window.__dreamchatRefreshOpenMediaAccordions ===
                    "function"
                ) {
                    window.__dreamchatRefreshOpenMediaAccordions();
                }
            }, 400);
        });
    }

    /* Set body attribute immediately so at 1200px+ the message panel shows (CSS uses data-chat-panel) */
    if (typeof document !== "undefined" && document.body) {
        var p = (typeof location !== "undefined" && location.pathname) ? location.pathname.replace(/\/+$/, "") || "/" : "";
        var onChat = p === "/chat" || p === "/index";
        var hasUser = false;
        try {
            hasUser = !!(
                typeof location !== "undefined" &&
                location.search &&
                new URLSearchParams(location.search).get("user")
            );
        } catch (e) { }
        document.body.setAttribute("data-chat-panel", onChat && hasUser ? "visible" : "welcome");
    }

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
                    // fetchUsers creates the usersMap asynchronously.
                    // We need to wait for it before calling selectUser.
                    populateUsersMap(); // archived/pinned/etc. + usersMap merged with contacts
                    fetchUsers();

                    // On hard refresh, always show welcome (do not auto-restore the last open chat).
                    let isPageReload = false;
                    try {
                        const nav = performance.getEntriesByType("navigation");
                        isPageReload = !!(
                            nav &&
                            nav[0] &&
                            nav[0].type === "reload"
                        );
                    } catch (e) {
                        isPageReload = false;
                    }

                    // Restore open chat from ?user= or same-tab session only when this is not a reload.
                    const urlParams = new URLSearchParams(window.location.search);
                    let storedUserId = isPageReload ? null : urlParams.get("user");
                    if (!storedUserId && !isPageReload) {
                        try {
                            storedUserId = sessionStorage.getItem(CHAT_ACTIVE_PEER_SESSION_KEY) || "";
                        } catch (e) {
                            storedUserId = "";
                        }
                    }
                    if (isPageReload) {
                        try {
                            sessionStorage.removeItem(CHAT_ACTIVE_PEER_SESSION_KEY);
                        } catch (e) {
                            /* ignore */
                        }
                        if (typeof history !== "undefined" && history.replaceState) {
                            const cleanUrl = new URL(window.location.href);
                            cleanUrl.searchParams.delete("user");
                            cleanUrl.searchParams.delete("call");
                            history.replaceState({}, "", cleanUrl.toString());
                        }
                        if (document.body) {
                            document.body.setAttribute("data-chat-panel", "welcome");
                        }
                    }
                    if (!storedUserId) {
                        storedUserId = null;
                    }

                    if (storedUserId) {
                        const callAction = urlParams.get('call');
                        function showChatPanelIfPresent() {
                            const middleEl = document.getElementById("middle");
                            const welcomeEl = document.getElementById("welcome-container");
                            if (middleEl) { middleEl.style.setProperty("display", "flex", "important"); middleEl.classList.add("message-panel-visible"); }
                            if (document.body) document.body.setAttribute("data-chat-panel", "visible");
                            if (welcomeEl) welcomeEl.style.setProperty("display", "none", "important");
                        }
                        // wait for usersMap to populate before selecting
                        const checkInterval = setInterval(() => {
                            if (Object.keys(usersMap).length > 0 || usersMap[storedUserId]) {
                                clearInterval(checkInterval);
                                showChatPanelIfPresent();
                                selectUser(storedUserId);
                                if (callAction === 'voice' || callAction === 'video') {
                                    setTimeout(() => {
                                        const btn = callAction === 'voice'
                                            ? (document.getElementById('audio-call-btn') || document.getElementById('audio-new-btn-group'))
                                            : (document.getElementById('video-call-new-btn') || document.getElementById('video-call-new-btn-group'));
                                        if (btn) btn.click();
                                        if (typeof history !== 'undefined' && history.replaceState) {
                                            const u = new URL(window.location.href);
                                            u.searchParams.delete('call');
                                            history.replaceState({}, '', u.toString());
                                        }
                                    }, 400);
                                }
                            }
                        }, 100);
                        
                        // Fallback clear after some time to prevent infinite loop
                        setTimeout(() => clearInterval(checkInterval), 5000);
                        // Ensure panel is shown even if selectUser runs late or DOM was not ready: retry after a short delay
                        setTimeout(showChatPanelIfPresent, 300);
                        setTimeout(showChatPanelIfPresent, 800);
                        // If interval never fired (e.g. usersMap slow), still show panel and try selectUser after 1.5s
                        setTimeout(() => {
                            showChatPanelIfPresent();
                            if (document.getElementById("middle") && document.getElementById("chat-box")) {
                                // Only call if not already listening to this user (prevents double load)
                                if (selectedUserId !== storedUserId) {
                                    selectUser(storedUserId);
                                }
                            }
                        }, 1500);

                        // localStorage.removeItem("selectedUserId"); // keep this if you want it to persist during refresh
                    }
                    const chatUsersWrap = document.getElementById("chat-users-wrap");
                    if (chatUsersWrap) chatUsersWrap.innerHTML = "";
                    const userIdEl = document.getElementById("user-id");
                    if (userIdEl) userIdEl.innerText = `Logged in as: ${user.id}`;

                    if (!storedUserId && (window.location.pathname === "/chat" || window.location.pathname === "/index")) {
                        setTimeout(ensureChatPageVisible, 50);
                        setTimeout(ensureChatPageVisible, 400);
                        setTimeout(ensureChatPageVisible, 1000);
                    }

                    // Set the user's online status
                    const userStatusRef = ref(
                        database,
                        `data/users/${user.uid}/status`
                    );
                    set(userStatusRef, "online");
                    onDisconnect(userStatusRef).set("offline");

                    const typingDisconnectRef = ref(
                        database,
                        `data/users/${user.uid}/typing`
                    );
                    onDisconnect(typingDisconnectRef).set("");

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
                    firebaseChatSidebarListenersAttached = false;
                    if (window.location.pathname !== "/login") {
                        // Redirect to login if trying to access any other route
                        // window.location.href = "/login";
                    }
                    document.getElementById("user-id").innerText =
                        "No user logged in";
                }
            });
        })
        .catch((error) => { });

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
        } catch (error) { }
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
    /** Avoid duplicate onValue listeners if onAuthStateChanged fires more than once. */
    let firebaseChatSidebarListenersAttached = false;

    const inviteFormChatEl = document.getElementById("inviteFormChat");
    if (inviteFormChatEl) {
        inviteFormChatEl.addEventListener("submit", function (event) {
            event.preventDefault(); // Prevent the form from reloading the page

            const inviteInputEl = document.getElementById("inviteInput");
            const inviteInput = inviteInputEl ? inviteInputEl.value.trim() : "";
            if (!inviteInput) {
                if (typeof Swal !== "undefined") {
                    Swal.fire({ title: "", text: "Please enter an email address.", icon: "warning" });
                } else {
                    alert("Please enter an email address.");
                }
                return;
            }

            if (!auth.currentUser || !auth.currentUser.uid) {
                if (typeof Swal !== "undefined") {
                    Swal.fire({ title: "", text: "Please sign in to send an invitation.", icon: "error" });
                } else {
                    alert("Please sign in to send an invitation.");
                }
                return;
            }

            const loggedInUserId = auth.currentUser.uid;

            const csrfMeta = document.querySelector('meta[name="csrf-token"]');
            const csrfToken = csrfMeta ? csrfMeta.getAttribute("content") : "";
            const sendInviteButton =
                document.getElementById("sendInviteButton");

            // Change button state to processing
            if (sendInviteButton) {
                sendInviteButton.textContent = "Processing...";
                sendInviteButton.disabled = true;
            }

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
                                    const inviteModalEl = document.getElementById("invite-contact");
                                    if (inviteModalEl && typeof bootstrap !== "undefined" && bootstrap.Modal) {
                                        const inst = bootstrap.Modal.getInstance(inviteModalEl);
                                        if (inst) inst.hide();
                                    } else if (typeof $ !== "undefined" && $.fn.modal) {
                                        $("#invite-contact").modal("hide");
                                    }
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
                                            if (document.getElementById("inviteFormChat")) document.getElementById("inviteFormChat").reset();
                                            if (sendInviteButton) { sendInviteButton.textContent = "Send Invitation"; sendInviteButton.disabled = false; }
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
                                                    const inviteModalEl = document.getElementById("invite-contact");
                                                    if (inviteModalEl && typeof bootstrap !== "undefined" && bootstrap.Modal) {
                                                        const inst = bootstrap.Modal.getInstance(inviteModalEl);
                                                        if (inst) inst.hide();
                                                    } else if (typeof $ !== "undefined" && $.fn.modal) {
                                                        $("#invite-contact").modal("hide");
                                                    }
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
                            if (sendInviteButton) {
                                sendInviteButton.textContent = "Send Invitation";
                                sendInviteButton.disabled = false;
                            }
                        });
                })
                .catch((error) => {
                    Swal.fire({
                        title: "",
                        width: 400,
                        text: "Error fetching mobile number: " + error.message,
                        icon: "error",
                    });
                    if (sendInviteButton) {
                        sendInviteButton.textContent = "Send Invitation";
                        sendInviteButton.disabled = false;
                    }
                });
        });
    }

    function capitalizeFirstLetter(string) {
        if (!string) return ""; // Return empty string if input is empty
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    function displayUsers(users) {
        const usersList = document.getElementById("chat-users-wrap");
        const swiperList = document.querySelector(".swiper-wrapper"); // Swiper wrapper element for recent chats

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
                            /* Always build fresh rows after innerHTML clear; reusing old nodes left them detached. */
                            const newUserDiv = createUserElement(user, userId);
                            usersList.appendChild(newUserDiv);

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

                    scheduleRefreshChatFilterBadgeCounts();

                    // Sidebar only lists peers with at least one message. Do not tear down an explicitly
                    // opened thread (contact / ?user= / same-tab session) just because there is no history yet.
                    if (selectedUserId) {
                        const listedIds = new Set(
                            validUsers.map((v) => String(v.userId))
                        );
                        if (!listedIds.has(String(selectedUserId))) {
                            let keepChatOpen = false;
                            try {
                                const qPeer = new URLSearchParams(
                                    window.location.search || ""
                                ).get("user");
                                if (
                                    qPeer &&
                                    String(qPeer) === String(selectedUserId)
                                ) {
                                    keepChatOpen = true;
                                }
                            } catch (e) {
                                /* ignore */
                            }
                            try {
                                if (
                                    !keepChatOpen &&
                                    sessionStorage.getItem(
                                        CHAT_ACTIVE_PEER_SESSION_KEY
                                    ) === String(selectedUserId)
                                ) {
                                    keepChatOpen = true;
                                }
                            } catch (e) {
                                /* ignore */
                            }
                            if (!keepChatOpen) {
                                resetChatShellToWelcome();
                            }
                        }
                    }
                });

                // Listen for new messages dynamically and update the UI
                listenForNewMessages(users);
            });
        });
    }

    // Sidebar rows use per-room onValue listeners for unread counts; avoid duplicating badge updates here.
    function listenForNewMessages(users) {
        void users;
    }

    let chatFilterBadgeDebounce = null;
    function scheduleRefreshChatFilterBadgeCounts() {
        if (typeof document === "undefined") return;
        if (chatFilterBadgeDebounce) clearTimeout(chatFilterBadgeDebounce);
        chatFilterBadgeDebounce = setTimeout(() => {
            chatFilterBadgeDebounce = null;
            refreshChatFilterBadgeCounts();
        }, 120);
    }

    function sumUnreadInChatListContainer(root) {
        if (!root) return 0;
        let sum = 0;
        root
            .querySelectorAll(".chat-list[data-user-id] .count-message")
            .forEach((span) => {
                if (span.style.display === "none") return;
                const t = (span.textContent || "").trim();
                if (!t) return;
                const n = parseInt(t, 10);
                if (!isNaN(n)) sum += n;
            });
        return sum;
    }

    function collectPeerIdsFromContainer(root) {
        if (!root) return [];
        return [...root.querySelectorAll(".chat-list[data-user-id]")].map((el) =>
            el.getAttribute("data-user-id")
        );
    }

    function sumUnreadForPeersInAllChats(peerIds) {
        const set = new Set((peerIds || []).filter(Boolean));
        if (set.size === 0) return 0;
        const pane = document.querySelector("#chat-menu #all-chats");
        if (!pane) return 0;
        let sum = 0;
        pane.querySelectorAll(".chat-list[data-user-id]").forEach((row) => {
            const id = row.getAttribute("data-user-id");
            if (!set.has(id)) return;
            const span = row.querySelector(".count-message");
            if (!span || span.style.display === "none") return;
            const n = parseInt(span.textContent, 10);
            if (!isNaN(n)) sum += n;
        });
        return sum;
    }

    function refreshChatFilterBadgeCounts() {
        if (typeof document === "undefined") return;
        const chatMenu = document.getElementById("chat-menu");
        if (!chatMenu) return;

        const allEl = chatMenu.querySelector("#chat-filter-count-all");
        const favEl = chatMenu.querySelector("#chat-filter-count-favourite");
        const pinEl = chatMenu.querySelector("#chat-filter-count-pinned");
        const archEl = chatMenu.querySelector("#chat-filter-count-archive");
        const trashEl = chatMenu.querySelector("#chat-filter-count-trash");
        const headerBadge = chatMenu.querySelector("#chat-header-unread-badge");
        if (
            !allEl &&
            !favEl &&
            !pinEl &&
            !archEl &&
            !trashEl &&
            !headerBadge
        )
            return;

        const wrap = chatMenu.querySelector("#chat-users-wrap");
        const allUnread = sumUnreadInChatListContainer(wrap);

        const favRoot = chatMenu.querySelector("#favourites-chats");
        const favUnread = sumUnreadForPeersInAllChats(
            collectPeerIdsFromContainer(favRoot)
        );

        const pinRoot = chatMenu.querySelector("#pinned-chats");
        const pinUnread = sumUnreadForPeersInAllChats(
            collectPeerIdsFromContainer(pinRoot)
        );

        const archRoot = chatMenu.querySelector("#archive-chats");
        const archCount = collectPeerIdsFromContainer(archRoot).length;

        const trashRoot = chatMenu.querySelector("#trash-chats");
        const trashCount = collectPeerIdsFromContainer(trashRoot).length;

        function setUnreadBadge(el, n) {
            if (!el) return;
            if (n > 0) {
                el.textContent = String(n);
                el.classList.remove("d-none");
            } else {
                el.textContent = "";
                el.classList.add("d-none");
            }
        }

        setUnreadBadge(allEl, allUnread);
        setUnreadBadge(favEl, favUnread);
        setUnreadBadge(pinEl, pinUnread);

        function tabPaneActive(pane) {
            return (
                pane &&
                pane.classList.contains("active") &&
                pane.classList.contains("show")
            );
        }

        const allPane = chatMenu.querySelector("#all-chats.tab-pane");
        const favPane = chatMenu.querySelector("#favourites-chats.tab-pane");
        const pinnedPane = chatMenu.querySelector("#pinned-chats.tab-pane");
        const archivePane = chatMenu.querySelector("#archive-chats.tab-pane");
        const trashPane = chatMenu.querySelector("#trash-chats.tab-pane");
        let headerN = allUnread;
        if (tabPaneActive(favPane)) headerN = favUnread;
        else if (tabPaneActive(pinnedPane)) headerN = pinUnread;
        else if (tabPaneActive(archivePane)) headerN = archCount;
        else if (tabPaneActive(trashPane)) headerN = trashCount;
        else if (tabPaneActive(allPane)) headerN = allUnread;
        setUnreadBadge(headerBadge, headerN);

        if (archEl) {
            if (archCount > 0) {
                archEl.textContent = String(archCount);
                archEl.classList.remove("d-none");
            } else {
                archEl.textContent = "";
                archEl.classList.add("d-none");
            }
        }
        if (trashEl) {
            if (trashCount > 0) {
                trashEl.textContent = String(trashCount);
                trashEl.classList.remove("d-none");
            } else {
                trashEl.textContent = "";
                trashEl.classList.add("d-none");
            }
        }
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

        function applySidebarPreviewRow(text) {
            if (!userMessageElement) return;
            userMessageElement.dataset.lastPreview = text;
            if (userMessageElement.getAttribute("data-typing-peer") !== "1") {
                userMessageElement.textContent = text;
            }
        }

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
                applySidebarPreviewRow(displayMessage);
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
                    applySidebarPreviewRow(displayMessage);
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

        const peerTypingListRef = ref(database, `data/users/${userId}/typing`);
        onValue(peerTypingListRef, (snap) => {
            if (!userMessageElement) return;
            const v = snap.val();
            if (v === currentUser.uid) {
                userMessageElement.setAttribute("data-typing-peer", "1");
                userMessageElement.textContent = "Typing...";
            } else {
                userMessageElement.removeAttribute("data-typing-peer");
                userMessageElement.textContent =
                    userMessageElement.dataset.lastPreview || "No messages";
            }
        });

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

                applySidebarPreviewRow(displayMessage);
            } else {
                applySidebarPreviewRow("No messages");
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

        // Avatar Div
        const avatarDiv = document.createElement("div");
        avatarDiv.classList.add("avatar", "avatar-lg", "me-2");

        const userImage = document.createElement("img");
        userImage.src = resolveCallProfileImageUrl(user.profileImage || "");
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

        function applySidebarPreview(text) {
            userMessage.dataset.lastPreview = text;
            if (userMessage.getAttribute("data-typing-peer") !== "1") {
                userMessage.textContent = text;
            }
        }

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

        // Chat Dropdown (Options menu) — use .dropdown (not .dropup) so menu opens below the ⋮ like the template
        const chatDropdown = document.createElement("div");
        chatDropdown.classList.add("chat-dropdown", "dropdown");

        const dropdownToggle = document.createElement("a");
        dropdownToggle.href = "#";
        dropdownToggle.classList.add("text-muted", "dropdown-toggle");
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
                text: "Mark as Favourite",
                icon: "ti ti-heart",
                click: () => favouriteChat(userId),
            },
            {
                text: "Mark as Unread",
                icon: "ti ti-check",
                click: () => markChatAsUnread(userId),
            },
            {
                text: "Pin Chats",
                icon: "ti ti-pinned",
                click: () => pinChat(userId),
            },
            {
                text: "Delete",
                icon: "ti ti-trash",
                click: () => {
                    if (
                        typeof window !== "undefined" &&
                        window.confirm(
                            "Delete this chat from your list?"
                        )
                    ) {
                        removeChatFromSidebarList(userId);
                    }
                },
            },
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

        const roomIdForRow = getDeterministicChatRoomId(
            currentUserId,
            userId
        );
        const chatRoomRef = ref(database, `data/chats/${roomIdForRow}`);
        const markedUnreadRef = ref(
            database,
            `data/users/${currentUser.uid}/marked_unread/${userId}`
        );

        let lastUnseenFromChat = 0;
        let markedUnreadActive = false;

        function applyUnreadBadge() {
            if (selectedUserId === userId) {
                messageCountSpan.style.display = "none";
                messageCountSpan.textContent = "";
            } else {
                const n = markedUnreadActive
                    ? Math.max(lastUnseenFromChat, 1)
                    : lastUnseenFromChat;
                if (n > 0) {
                    messageCountSpan.style.display = "inline-block";
                    messageCountSpan.textContent = String(n);
                } else {
                    messageCountSpan.style.display = "none";
                    messageCountSpan.textContent = "";
                }
            }
            scheduleRefreshChatFilterBadgeCounts();
        }

        userDiv._applySidebarUnreadBadge = applyUnreadBadge;

        onValue(markedUnreadRef, (snap) => {
            markedUnreadActive = snap.exists();
            applyUnreadBadge();
        });

        const pinnedListRef = ref(
            database,
            `data/users/${currentUserId}/pinnedUserId`
        );
        onValue(pinnedListRef, (snap) => {
            const pinned = snap.val() || [];
            const arr = Array.isArray(pinned) ? pinned : [];
            pinsIcon.innerHTML = arr.includes(userId)
                ? '<i class="ti ti-pin"></i>'
                : "";
        });

        /** Avoids stale sidebar text/time when an older onValue async pass finishes after a newer one. */
        let lastSidebarPreviewAppliedTs = 0;

        onValue(chatRoomRef, async (snapshot) => {
            const viewerUid = currentUser?.uid || currentUserId;

            if (!snapshot.exists()) {
                lastSidebarPreviewAppliedTs = 0;
                applySidebarPreview("No messages");
                timeElement.textContent = "";
                lastUnseenFromChat = 0;
                pinIcon.innerHTML = "";
                applyUnreadBadge();
                return;
            }

            let latestMsg = null;
            let latestTs = 0;
            let unseen = 0;

            snapshot.forEach((childSnapshot) => {
                const message = childSnapshot.val();
                if (!message || !message.timestamp) return;
                if (uidIncludedInFirebaseList(message.clearedFor, viewerUid)) {
                    return;
                }
                if (uidIncludedInFirebaseList(message.deletedFor, viewerUid)) {
                    return;
                }
                if (
                    message.recipientId === viewerUid &&
                    !message.seen
                ) {
                    unseen++;
                }
                if (message.timestamp > latestTs) {
                    latestTs = message.timestamp;
                    latestMsg = message;
                }
            });

            lastUnseenFromChat = unseen;

            if (!latestMsg) {
                lastSidebarPreviewAppliedTs = 0;
                applySidebarPreview("No messages");
                timeElement.textContent = "";
                pinIcon.innerHTML = "";
                applyUnreadBadge();
                return;
            }

            const applyTs = latestTs;

            let displayMessage = "No messages";
            const messageType = latestMsg.attachmentType || "unknown";
            if (messageType === 6) {
                try {
                    const originalMessage = await decryptlibsodiumMessage(
                        latestMsg.body
                    );
                    displayMessage = originalMessage || "No messages";
                } catch (e) {
                    displayMessage = "Unable to decrypt message";
                }
            } else if (messageType === 5) {
                displayMessage = "File sent";
            } else if (messageType === 2) {
                displayMessage = "Image sent";
            } else if (messageType === 1) {
                displayMessage = "Video sent";
            } else if (messageType === 3) {
                displayMessage = "Audio sent";
            } else if (messageType === 8) {
                displayMessage = "Audio Record sent";
            } else {
                displayMessage = "Unknown message type";
            }

            if (applyTs < lastSidebarPreviewAppliedTs) {
                return;
            }
            lastSidebarPreviewAppliedTs = applyTs;

            applySidebarPreview(displayMessage);
            timeElement.textContent = latestTs
                ? moment(latestTs).calendar(null, {
                    sameDay: "h:mm A",
                    lastDay: "[Yesterday]",
                    lastWeek: "MM/D/YYYY",
                    sameElse: "MM/D/YYYY",
                })
                : "";

            if (latestMsg.senderId === currentUserId) {
                if (!latestMsg.delivered && !latestMsg.readMsg) {
                    pinIcon.innerHTML = `<i class="ti ti-check"></i>`;
                } else if (
                    latestMsg.delivered &&
                    !latestMsg.readMsg
                ) {
                    pinIcon.innerHTML = `<i class="ti ti-checks"></i>`;
                } else if (latestMsg.delivered && latestMsg.readMsg) {
                    pinIcon.innerHTML = `<i class="ti ti-checks text-success"></i>`;
                }
            } else {
                pinIcon.innerHTML = "";
            }

            applyUnreadBadge();
        });

        userLink.onclick = (e) => {
            e.preventDefault();
            selectUser(userId);
            remove(markedUnreadRef).catch(() => {});
            messageCountSpan.style.display = "none";
            messageCountSpan.textContent = "";

            const chatRef = ref(database, `data/chats/${roomIdForRow}`);
            get(chatRef).then((snap) => {
                if (!snap.exists()) return;
                snap.forEach((childSnapshot) => {
                    const message = childSnapshot.val();
                    if (
                        message.recipientId === currentUser.uid &&
                        !message.seen
                    ) {
                        update(child(chatRef, childSnapshot.key), {
                            seen: true,
                        }).catch(() => {});
                    }
                });
            });
        };

        const peerTypingRowRef = ref(database, `data/users/${userId}/typing`);
        onValue(peerTypingRowRef, (snap) => {
            const v = snap.val();
            if (v === currentUser.uid) {
                userMessage.setAttribute("data-typing-peer", "1");
                userMessage.textContent = "Typing...";
            } else {
                userMessage.removeAttribute("data-typing-peer");
                userMessage.textContent =
                    userMessage.dataset.lastPreview || "No messages";
            }
        });

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
        swiperSlideDiv.setAttribute("data-recent-user-id", String(userId));

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
        userImage.src = resolveCallProfileImageUrl(user.profileImage || "");
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
        if (!userList) return;
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

    /** RTDB often returns "arrays" as objects; normalize to string uid list. */
    function firebaseUidList(raw) {
        if (raw == null) return [];
        if (Array.isArray(raw)) return raw.filter((x) => x != null && String(x));
        if (typeof raw === "object")
            return Object.values(raw).filter(
                (x) => x != null && String(x)
            );
        return [];
    }

    function uidIncludedInFirebaseList(raw, uid) {
        if (uid == null) return false;
        return firebaseUidList(raw).includes(uid);
    }

    function mergeFirebaseUidLists(a, b) {
        const s = new Set();
        firebaseUidList(a).forEach((x) => s.add(x));
        firebaseUidList(b).forEach((x) => s.add(x));
        return [...s];
    }

    /** Same pairing as sendMessage mirror path (forward vs reverse room id). */
    function chatMirrorRoomId(chatRoomId, userA, userB) {
        const idA = `${userA}-${userB}`;
        const idB = `${userB}-${userA}`;
        return chatRoomId === idA ? idB : idA;
    }

    /** Refs for the same message under deterministic room id and its mirror path. */
    function getChatMessageRefsBothPaths(messageKey, chatRoomId, userA, userB) {
        const mirrorChatRoomId = chatMirrorRoomId(chatRoomId, userA, userB);
        return {
            refPri: ref(database, `data/chats/${chatRoomId}/${messageKey}`),
            refMir: ref(database, `data/chats/${mirrorChatRoomId}/${messageKey}`),
            mirrorChatRoomId,
        };
    }

    function loadChatMessageFromEitherPath(messageKey, chatRoomId, userA, userB) {
        const { refPri, refMir, mirrorChatRoomId } =
            getChatMessageRefsBothPaths(messageKey, chatRoomId, userA, userB);
        return Promise.all([get(refPri), get(refMir)]).then(([snapPri, snapMir]) => ({
            snapPri,
            snapMir,
            refPri,
            refMir,
            mirrorChatRoomId,
        }));
    }

    // Function to select a user and display their chat details
    async function selectUser(userId) {
        const chatBox = document.getElementById("chat-box");
        const middleEl = document.getElementById("middle");
        const welcomeContainer = document.getElementById("welcome-container");
        if (!chatBox || !middleEl) return;

        const userDetails = await getUserDetails(userId);

        // Peers opened from Contacts / ?user= may not appear in usersMap yet (bulk data/users read
        // incomplete under rules, or map built before this uid exists). Hydrate from single-user + contact reads.
        if (!usersMap[userId]) {
            let contactData = null;
            if (currentUser?.uid) {
                try {
                    const cs = await get(
                        ref(database, `data/contacts/${currentUser.uid}/${userId}`)
                    );
                    if (cs.exists()) contactData = cs.val();
                } catch (e) {
                    /* ignore */
                }
            }
            const u = userDetails;
            if (u || contactData) {
                const nm = u
                    ? `${u.firstName || ""} ${u.lastName || ""}`.trim()
                    : `${(contactData && contactData.firstName) || ""} ${(contactData && contactData.lastName) || ""}`.trim();
                const raw = rawAvatarFromFirebaseAndContact(u || {}, contactData);
                usersMap[userId] = {
                    uid: userId,
                    userName:
                        nm ||
                        (contactData &&
                            (contactData.userName || contactData.user_name)) ||
                        (u && (u.userName || u.email)) ||
                        "",
                    profileImage: resolveCallProfileImageUrl(raw || ""),
                };
            }
        }

        // Only switch from welcome → chat shell when the peer exists in the sidebar map (or hydrated above).
        if (!usersMap[userId]) {
            highlightActiveUser("");
            try {
                if (selectedUserId === userId) selectedUserId = null;
            } catch (e) { /* ignore */ }
            try {
                if (typeof history !== "undefined" && history.replaceState) {
                    const u = new URL(window.location.href);
                    if (u.searchParams.get("user") === String(userId)) {
                        u.searchParams.delete("user");
                        history.replaceState({}, "", u.toString());
                    }
                }
            } catch (e) { /* ignore */ }
            try {
                const stored = sessionStorage.getItem(
                    CHAT_ACTIVE_PEER_SESSION_KEY
                );
                if (stored === String(userId)) {
                    sessionStorage.removeItem(CHAT_ACTIVE_PEER_SESSION_KEY);
                }
            } catch (e) { /* ignore */ }
            if (typeof ensureChatPageVisible === "function") {
                ensureChatPageVisible();
            }
            return;
        }

        // Persist selection for other modules; panel visibility uses selectedUserId / ?user / session only.
        try { localStorage.setItem("selectedUserId", String(userId)); } catch (e) { }
        try {
            sessionStorage.setItem(CHAT_ACTIVE_PEER_SESSION_KEY, String(userId));
        } catch (e) { }
        try {
            if (typeof history !== "undefined" && history.replaceState) {
                const u = new URL(window.location.href);
                u.searchParams.set("user", String(userId));
                history.replaceState({}, "", u.toString());
            }
        } catch (e) { }

        // Show chat panel and hide welcome only after we know the conversation can load.
        middleEl.style.setProperty("display", "flex", "important");
        middleEl.classList.add("message-panel-visible");
        if (document.body) document.body.setAttribute("data-chat-panel", "visible");
        if (welcomeContainer) welcomeContainer.style.setProperty("display", "none", "important");

        const loggedInUserId = currentUserId;
        selectedUserId = userId; // Set the selected user ID
        // Reset media accordion state so fresh data loads for the new contact
        document.querySelectorAll(".media-collapse-content").forEach(colEl => {
            delete colEl.dataset.mediaLoaded;
            if (typeof bootstrap !== "undefined") {
                const inst = bootstrap.Collapse.getInstance(colEl);
                if (inst) inst.hide(); else colEl.classList.remove("show");
            } else {
                colEl.classList.remove("show");
            }
            colEl.querySelectorAll(".media-photos-grid,.media-videos-grid,.media-links-list,.media-docs-list").forEach(c => { c.innerHTML = ""; });
            colEl.querySelectorAll(".media-empty").forEach(e => e.classList.add("d-none"));
            colEl.querySelectorAll(".media-loading").forEach(e => e.classList.add("d-none"));
        });
        document.querySelectorAll(".media-chevron i").forEach(i => {
            i.classList.remove("ti-chevron-up");
            i.classList.add("ti-chevron-right");
        });
        // Reset Others accordion state for the new contact
        document.querySelectorAll(".others-collapse-content").forEach(colEl => {
            delete colEl.dataset.othersLoaded;
            if (typeof bootstrap !== "undefined") {
                const inst = bootstrap.Collapse.getInstance(colEl);
                if (inst) inst.hide(); else colEl.classList.remove("show");
            } else {
                colEl.classList.remove("show");
            }
            const favList = document.getElementById("others-favourites-list");
            if (favList) favList.innerHTML = "";
            colEl.querySelectorAll(".others-empty").forEach(e => e.classList.add("d-none"));
            colEl.querySelectorAll(".others-loading").forEach(e => e.classList.add("d-none"));
            colEl.querySelectorAll('input[type="radio"]').forEach(r => { r.checked = false; });
            colEl.querySelectorAll('input[type="checkbox"]').forEach(c => { c.checked = false; });
        });
        document.querySelectorAll(".others-chevron i").forEach(i => {
            i.classList.remove("ti-chevron-up");
            i.classList.add("ti-chevron-right");
        });
        if (currentUser?.uid) {
            remove(
                ref(
                    database,
                    `data/users/${currentUser.uid}/marked_unread/${userId}`
                )
            ).catch(() => {});
        }

        // Clear the chat box and show spinner while messages load
        chatBox.innerHTML = "";
        _chatInitialLoad = true;
        _chatInitialMsgCount = 0;
        if (_chatInitialLoadTimer) clearTimeout(_chatInitialLoadTimer);
        _showChatSpinner();

        // Generate chatRoomId deterministically (A-B)
        const chatRoomId = getDeterministicChatRoomId(loggedInUserId, selectedUserId);

        // Start listening for messages with the selected user
        listenForMessages(loggedInUserId, selectedUserId, chatRoomId);
        detachMediaPanelRoomListener();
        attachMediaPanelRoomListener();

        if (chatHeaderStatusUnsub) {
            chatHeaderStatusUnsub();
            chatHeaderStatusUnsub = null;
        }
        if (chatHeaderTypingUnsub) {
            chatHeaderTypingUnsub();
            chatHeaderTypingUnsub = null;
        }
        headerShowsTyping = false;

        // Fetch user status from the database
        const userStatusRef = ref(database, `data/users/${userId}/status`);
        chatHeaderStatusUnsub = onValue(userStatusRef, (snapshot) => {
            const userStatus = snapshot.val() || "offline";
            lastPartnerStatusForHeader = userStatus;
            if (!headerShowsTyping) {
                updateUserDetails(userId, userStatus, loggedInUserId);
            }
        });

        const partnerTypingRef = ref(database, `data/users/${userId}/typing`);
        chatHeaderTypingUnsub = onValue(partnerTypingRef, (snapshot) => {
            if (selectedUserId !== userId) return;
            const el = document.querySelector(".chat-header .last-seen");
            if (!el) return;
            const v = snapshot.val();
            if (v === currentUser.uid) {
                headerShowsTyping = true;
                el.textContent = "Typing...";
                el.classList.remove("text-success", "text-danger");
                el.classList.add("text-muted");
            } else {
                headerShowsTyping = false;
                updateUserDetails(
                    userId,
                    lastPartnerStatusForHeader,
                    loggedInUserId
                );
            }
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
        const userImage = resolveCallProfileImageUrl(
            (usersMap[userId] && usersMap[userId].profileImage)
                ? usersMap[userId].profileImage
                : (contactData && (contactData.profile_image || contactData.image))
                    ? (contactData.profile_image || contactData.image)
                    : ""
        );
        const headerImg =
            document.getElementById("chat-header-avatar") ||
            document.querySelector(".chat-header .avatar img");
        if (headerImg) headerImg.src = userImage;

        // Fetch KYC verified badge status
        const kycBadges = document.querySelectorAll('.kyc-badge, .contact-kyc-badge');
        kycBadges.forEach(b => b.style.display = 'none');
        if (userDetails && userDetails.email) {
            fetch(`/api/kyc-status?email=${encodeURIComponent(userDetails.email)}`)
                .then(r => r.json())
                .then(data => {
                    kycBadges.forEach(b => b.style.display = data.verified ? 'inline-flex' : 'none');
                })
                .catch(() => { });
        }

        // Show contact info and handle common groups
        showContactInfo(userId);
        handleShowCommonGroups();
        highlightActiveUser(userId);

        queueMicrotask(() => {
            document
                .querySelectorAll(
                    "#chat-menu #chat-users-wrap .chat-list[data-user-id]"
                )
                .forEach((row) => {
                    if (typeof row._applySidebarUnreadBadge === "function") {
                        row._applySidebarUnreadBadge();
                    }
                });
            scheduleRefreshChatFilterBadgeCounts();
        });
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

        if (!userStatusElement || !userAvatarElement) return;

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

            notification.onclick = () => { };
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
                            return set(mirrorReplyRef, replyMessage).catch(
                                () => {}
                            );
                        })
                        .then(() => afterOutgoingMessagePersisted(toUserId))
                        .then(() => {
                            closeReplyBox();
                            document.getElementById("message-input").value = "";
                            replyToMessage = null;
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
                    // Only type 6 stores libsodium ciphertext in `body`. Attachments use `attachment`;
                    // calling /decrypt with undefined or a non-ciphertext string causes HTTP 400.
                    let msg = "New message";
                    if (
                        messageType == 6 &&
                        message.body &&
                        typeof message.body === "string"
                    ) {
                        const plain = await decryptlibsodiumMessage(
                            message.body
                        );
                        if (plain) {
                            msg = String(plain);
                        }
                    } else if (messageType != 6) {
                        const labels = {
                            1: "Sent a video",
                            2: "Sent a photo",
                            3: "Sent a voice message",
                            4: "Sent a location",
                            5: "Sent a file",
                            8: "Sent a voice message",
                        };
                        msg =
                            labels[messageType] || "Sent an attachment";
                    }
                    const userMsgRef = ref(
                        database,
                        `data/users/${message.id}`
                    );

                    const snapshot = await get(userMsgRef);
                    const excludedUsers = snapshot.val() || [];

                    sendCallNotification(message.recipientId, msg, excludedUsers.mobile_number, message.senderId, message.senderId, "")

                    set(newMessageRef, messageWithId)
                        .then(() => {
                            const mirrorRef = ref(
                                database,
                                `data/chats/${mirrorChatRoomId}/${newKey}`
                            );
                            return set(mirrorRef, messageWithId).catch(() => {});
                        })
                        .then(() => afterOutgoingMessagePersisted(toUserId))
                        .then(() => {
                            document.getElementById("message-input").value = "";
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

    /** Use same host as the page for /storage URLs so <audio>/<video> are not cross-origin (fixes 0:00 duration). */
    function normalizeChatMediaUrl(url) {
        if (!url || typeof url !== "string") return url;
        if (url.startsWith("/")) return url;
        try {
            const parsed = new URL(url, window.location.origin);
            const h = parsed.hostname;
            if (
                (h === "localhost" || h === "127.0.0.1") &&
                parsed.pathname.startsWith("/storage/")
            ) {
                return parsed.pathname + (parsed.search || "") + (parsed.hash || "");
            }
        } catch (e) {
            /* ignore */
        }
        return url;
    }

    function resolveCallProfileImageUrl(raw) {
        const origin =
            typeof window !== "undefined" && window.location && window.location.origin
                ? window.location.origin
                : "";
        const defaultUrl = origin
            ? origin + "/assets/img/profiles/avatar-03.jpg"
            : "assets/img/profiles/avatar-03.jpg";
        if (raw == null || !String(raw).trim()) return defaultUrl;
        const s = String(raw).trim();
        if (/^https?:\/\//i.test(s) || s.startsWith("data:") || s.startsWith("blob:"))
            return s;
        if (s.startsWith("//"))
            return (window.location && window.location.protocol
                ? window.location.protocol
                : "https:") + s;
        const path = s.replace(/^\.?\/+/, "");
        return origin ? origin + "/" + path : defaultUrl;
    }

    function rawAvatarFromFirebaseAndContact(userData, contactData) {
        if (contactData && contactData.profile_image)
            return String(contactData.profile_image).trim();
        if (!userData || typeof userData !== "object") return "";
        return (
            (userData.profile_image && String(userData.profile_image).trim()) ||
            (userData.image && String(userData.image).trim()) ||
            (userData.profileImage && String(userData.profileImage).trim()) ||
            (userData.photoURL && String(userData.photoURL).trim()) ||
            (userData.avatar && String(userData.avatar).trim()) ||
            (contactData && contactData.image && String(contactData.image).trim()) ||
            ""
        );
    }

    /** Build usersMap from data/users + data/contacts/{me} so chat list matches Contacts (profile_image on contacts). */
    function fillUsersMapFromFirebase(loggedInUserId) {
        const usersRef = ref(database, "data/users");
        const contactsPromise = loggedInUserId
            ? get(ref(database, `data/contacts/${loggedInUserId}`))
            : Promise.resolve(null);
        return Promise.all([get(usersRef), contactsPromise])
            .then(([userSnapshot, contactSnapshot]) => {
                const contactsByPeer =
                    contactSnapshot && contactSnapshot.exists()
                        ? contactSnapshot.val()
                        : {};
                /** Pending / invite contacts often exist only under data/contacts, not data/users — sidebar must still list their chats. */
                function mergeContactOnlyPeersIntoUsersMap() {
                    Object.keys(contactsByPeer).forEach((peerId) => {
                        if (
                            !peerId ||
                            peerId === loggedInUserId ||
                            usersMap[peerId]
                        ) {
                            return;
                        }
                        const contactData = contactsByPeer[peerId];
                        if (!contactData || typeof contactData !== "object") return;
                        const nm = `${contactData.firstName || ""} ${contactData.lastName || ""}`.trim();
                        const raw = rawAvatarFromFirebaseAndContact(
                            {},
                            contactData
                        );
                        const fallbackName = String(
                            contactData.userName ||
                                contactData.user_name ||
                                contactData.mobile_number ||
                                contactData.email ||
                                peerId
                        ).trim();
                        usersMap[peerId] = {
                            uid: peerId,
                            userName: nm || fallbackName,
                            profileImage: resolveCallProfileImageUrl(raw || ""),
                        };
                    });
                }
                if (!userSnapshot.exists()) {
                    usersMap = {};
                    mergeContactOnlyPeersIntoUsersMap();
                    return;
                }
                const users = userSnapshot.val();
                usersMap = {};
                Object.keys(users).forEach((userId) => {
                    const u = users[userId];
                    if (!u) return;
                    const contactData = contactsByPeer[userId] || null;
                    const nm = `${u.firstName || ""} ${u.lastName || ""}`.trim();
                    const raw = rawAvatarFromFirebaseAndContact(u, contactData);
                    usersMap[userId] = {
                        uid: userId,
                        userName: nm || "",
                        profileImage: resolveCallProfileImageUrl(raw || ""),
                    };
                });
                mergeContactOnlyPeersIntoUsersMap();
            });
    }

    /** Fill chat sidebar avatars from MySQL (same API as Contacts) when Firebase/contact nodes lack profile_image. */
    async function enrichChatListUsersMapFromLaravel() {
        const me = auth.currentUser?.uid;
        const allIds = Object.keys(usersMap).filter(
            (id) =>
                id &&
                id !== me &&
                String(id).indexOf("pending_") !== 0
        );
        const token =
            typeof document !== "undefined" &&
            document.querySelector('meta[name="csrf-token"]')
                ? document
                      .querySelector('meta[name="csrf-token"]')
                      .getAttribute("content")
                : "";
        const origin =
            typeof window !== "undefined" && window.location && window.location.origin
                ? window.location.origin
                : "";
        if (!token || !origin || allIds.length === 0) return;
        for (let i = 0; i < allIds.length; i += 60) {
            const chunk = allIds.slice(i, i + 60);
            try {
                const r = await fetch(origin + "/api/users/contact-avatars", {
                    method: "POST",
                    credentials: "same-origin",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        "X-CSRF-TOKEN": token,
                        "X-Requested-With": "XMLHttpRequest",
                    },
                    body: JSON.stringify({
                        firebase_uids: chunk,
                        emails: [],
                        usernames: [],
                    }),
                });
                if (!r.ok) continue;
                const data = await r.json();
                const byUid = data.by_uid || {};
                chunk.forEach((uid) => {
                    const url = byUid[uid];
                    if (
                        url &&
                        String(url).trim() &&
                        usersMap[uid]
                    ) {
                        usersMap[uid].profileImage = resolveCallProfileImageUrl(
                            String(url).trim()
                        );
                    }
                });
            } catch (e) {
                /* ignore */
            }
        }
    }

    /** New Chat modal: apply MySQL avatars when RTDB has no profile_image (same API as sidebar). */
    async function enrichNewChatModalAvatarsFromLaravel(peerIds) {
        const me = auth.currentUser?.uid;
        const container = document.getElementById("main-container");
        const token =
            typeof document !== "undefined" &&
            document.querySelector('meta[name="csrf-token"]')
                ? document
                      .querySelector('meta[name="csrf-token"]')
                      .getAttribute("content")
                : "";
        const origin =
            typeof window !== "undefined" && window.location && window.location.origin
                ? window.location.origin
                : "";
        if (!token || !origin || !container || !peerIds || peerIds.length === 0) {
            return;
        }
        const ids = peerIds.filter(
            (id) =>
                id &&
                id !== me &&
                String(id).indexOf("pending_") !== 0
        );
        for (let i = 0; i < ids.length; i += 60) {
            const chunk = ids.slice(i, i + 60);
            try {
                const r = await fetch(origin + "/api/users/contact-avatars", {
                    method: "POST",
                    credentials: "same-origin",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        "X-CSRF-TOKEN": token,
                        "X-Requested-With": "XMLHttpRequest",
                    },
                    body: JSON.stringify({
                        firebase_uids: chunk,
                        emails: [],
                        usernames: [],
                    }),
                });
                if (!r.ok) continue;
                const data = await r.json();
                const byUid = data.by_uid || {};
                chunk.forEach((uid) => {
                    const url = byUid[uid];
                    if (!url || !String(url).trim()) return;
                    const row = container.querySelector(
                        `[data-new-chat-peer="${uid}"]`
                    );
                    if (!row) return;
                    const img = row.querySelector(".avatar img");
                    if (!img) return;
                    img.src = resolveCallProfileImageUrl(String(url).trim());
                });
            } catch (e) {
                /* ignore */
            }
        }
    }

    /** Forward modal: fill avatars from MySQL when RTDB contact has no profile_image. */
    async function enrichForwardModalAvatarsFromLaravel(peerIds) {
        const me = auth.currentUser?.uid;
        const container = document.querySelector("#forward-modal .user-list");
        const token =
            typeof document !== "undefined" &&
            document.querySelector('meta[name="csrf-token"]')
                ? document
                      .querySelector('meta[name="csrf-token"]')
                      .getAttribute("content")
                : "";
        const origin =
            typeof window !== "undefined" && window.location && window.location.origin
                ? window.location.origin
                : "";
        if (!token || !origin || !container || !peerIds || peerIds.length === 0) {
            return;
        }
        const ids = peerIds.filter(
            (id) =>
                id &&
                id !== me &&
                String(id).indexOf("pending_") !== 0
        );
        for (let i = 0; i < ids.length; i += 60) {
            const chunk = ids.slice(i, i + 60);
            try {
                const r = await fetch(origin + "/api/users/contact-avatars", {
                    method: "POST",
                    credentials: "same-origin",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        "X-CSRF-TOKEN": token,
                        "X-Requested-With": "XMLHttpRequest",
                    },
                    body: JSON.stringify({
                        firebase_uids: chunk,
                        emails: [],
                        usernames: [],
                    }),
                });
                if (!r.ok) continue;
                const data = await r.json();
                const byUid = data.by_uid || {};
                chunk.forEach((uid) => {
                    const url = byUid[uid];
                    if (!url || !String(url).trim()) return;
                    const row = container.querySelector(
                        `[data-forward-peer="${uid}"]`
                    );
                    if (!row) return;
                    const img = row.querySelector("img.user-avatar");
                    if (!img) return;
                    img.src = resolveCallProfileImageUrl(String(url).trim());
                });
            } catch (e) {
                /* ignore */
            }
        }
    }

    function fetchUsers() {
        const loggedInUserId = auth.currentUser?.uid;
        if (!loggedInUserId) {
            return;
        }
        fillUsersMapFromFirebase(loggedInUserId)
            .then(() => enrichChatListUsersMapFromLaravel())
            .then(() => {
                const usersList = document.getElementById("chat-users-wrap");
                const swiperList = document.querySelector(".swiper-wrapper");
                const n = Object.keys(usersMap).length;
                if (n === 0) {
                    if (usersList) usersList.innerHTML = `<p>No Chat here ...</p>`;
                    if (swiperList)
                        swiperList.innerHTML = `<p>No recent chats</p>`;
                    return;
                }
                displayUsers(usersMap);
            })
            .catch((error) => {
                console.error("Error fetching users: ", error);
            });
    }

    const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

    function normalizeMessageReactions(raw) {
        if (!raw || typeof raw !== "object") return {};
        const out = {};
        Object.entries(raw).forEach(([uid, emoji]) => {
            const safeUid = String(uid || "").trim();
            const safeEmoji = String(emoji || "").trim();
            if (safeUid && safeEmoji) out[safeUid] = safeEmoji;
        });
        return out;
    }

    function buildReactionSummaryMarkup(rawReactions) {
        const reactions = normalizeMessageReactions(rawReactions);
        const counts = {};
        Object.values(reactions).forEach((emoji) => {
            counts[emoji] = (counts[emoji] || 0) + 1;
        });
        const parts = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([emoji, count]) => {
                return `<span class="message-reaction-chip">${emoji} ${count}</span>`;
            });
        return parts.length
            ? `<div class="message-reaction-summary">${parts.join("")}</div>`
            : "";
    }

    function buildReactionPickerMarkup() {
        return `
            <div class="message-reaction-picker" aria-label="Message reactions">
                ${REACTION_EMOJIS.map(
                    (emoji) =>
                        `<button type="button" class="message-react-option" data-reaction="${emoji}">${emoji}</button>`
                ).join("")}
                <button type="button" class="message-react-more" title="More emojis">+</button>
            </div>
            <div class="message-reaction-picker-extended" aria-label="More reaction emojis"></div>
        `;
    }

    async function displayMessage(message) {
        const chatBox = document.getElementById("chat-box");
        // Check if chatBox element exists
        if (!chatBox) {
            console.error("Chat box element not found!");
            return;
        }
        const viewerUid = currentUser?.uid || currentUserId;
        if (uidIncludedInFirebaseList(message.clearedFor, viewerUid)) {
            return;
        }
        if (uidIncludedInFirebaseList(message.deletedFor, viewerUid)) {
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
        {
            const t = parseInt(message.attachmentType, 10);
            messageElement.dataset.messageType = Number.isFinite(t)
                ? String(t)
                : "6";
        }

        const userId = message.senderId;
        const contactsRef = ref(
            database,
            `data/contacts/${currentUser.uid}/${userId}`
        );
        const userRef = ref(database, `data/users/${userId}`); // Use message.from to get the correct user

        let senderName = ""; // Initialize with an empty string
        let profileImage = resolveCallProfileImageUrl("");

        let contactData = null;
        // First, check if the sender is in the current user's contacts
        get(contactsRef)
            .then((contactsSnapshot) => {
                if (contactsSnapshot.exists()) {
                    contactData = contactsSnapshot.val();
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
                const userData = userSnapshot.exists()
                    ? userSnapshot.val()
                    : null;
                let raw = rawAvatarFromFirebaseAndContact(userData, contactData);
                if (
                    message.senderId === currentUser.uid &&
                    typeof window !== "undefined" &&
                    window.LARAVEL_USER
                ) {
                    const lu =
                        window.LARAVEL_USER.profile_image ||
                        window.LARAVEL_USER.image;
                    if (lu && String(lu).trim()) raw = String(lu).trim();
                }
                profileImage = resolveCallProfileImageUrl(raw || "");
                if (userData) {
                    if (!senderName) {
                        const userFirstName = userData.mobile_number || "";
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
                    originalMessageChat = normalizeChatMediaUrl(
                        message.attachment && message.attachment.url
                    );
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
                        messageContent = `<audio controls preload="metadata" width="240" src="${originalMessageChat}"></audio>`;
                        break;
                    case 8:
                        messageContent = `<audio controls preload="metadata" width="240" src="${originalMessageChat}"></audio>`;
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

                // If the message is a reply, prefer embedded replyContent (fast/reliable),
                // then fall back to looking up the original message by replyId.
                if (message.replyId !== "0") {
                    try {
                        const renderReplyContent = (type, rawContent) => {
                            const normalizedType = String(type || "6");
                            const safeContent = (rawContent || "").toString().trim();
                            switch (normalizedType) {
                                case "6":
                                    return `<div>${safeContent}</div>`;
                                case "2":
                                    return safeContent
                                        ? `<img src="${safeContent}" class="reply-image" style="max-height: 70px; border-radius: 5px;" alt="Image">`
                                        : `<div><i class="ti ti-photo"></i> Image</div>`;
                                case "3":
                                case "8":
                                    return `<div><i class="ti ti-microphone"></i> Audio</div>`;
                                case "1":
                                    return `<div><i class="ti ti-video"></i> Video</div>`;
                                case "5":
                                    return `<div><i class="ti ti-file"></i> File</div>`;
                                default:
                                    return `<div>${safeContent}</div>`;
                            }
                        };

                        // 1) Prefer the metadata already stored on the reply message
                        if (message.replyContent) {
                            let decodedReply = message.replyContent;
                            try {
                                if (!message.isOptimistic) {
                                    decodedReply =
                                        await decryptlibsodiumMessage(
                                            message.replyContent
                                        );
                                }
                            } catch (e) {
                                // Keep raw value as fallback.
                            }
                            replyContent = renderReplyContent(
                                message.replyType || "6",
                                decodedReply
                            );
                        } else {
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

                        replyContent = renderReplyContent(
                            originalMessageType,
                            sanitizedReplyContent
                        );
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

                const reactionsMarkup = buildReactionSummaryMarkup(
                    message.reactions
                );
                const reactionPickerMarkup = buildReactionPickerMarkup();

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
                                <div class="message-hover-actions">
                                    <a href="#" class="message-hover-btn hover-emoji-btn" title="React">
                                        <i class="ti ti-mood-smile"></i>
                                    </a>
                                    <a href="#" class="message-hover-btn forward-btn" title="Forward">
                                        <i class="ti ti-arrow-forward-up"></i>
                                    </a>
                                    ${reactionPickerMarkup}
                                </div>
                                <div class="chat-actions">
                                    <a class="#" href="#" data-bs-toggle="dropdown">
                                        <i class="ti ti-dots-vertical"></i>
                                    </a>
                                    <ul class="dropdown-menu dropdown-menu-end p-3">
                                        <li><a class="dropdown-item reply-btn" href="#"><i class="ti ti-corner-up-left me-2"></i>Reply</a></li>
                                        <li><a class="dropdown-item forward-btn" href="#"><i class="ti ti-arrow-forward-up me-2"></i>Forward</a></li>
                                        <li><a class="dropdown-item copy-btn" href="#"><i class="ti ti-copy me-2"></i>Copy</a></li>
                                        <li><a class="dropdown-item favourite-chat-btn" href="#"><i class="ti ti-heart me-2"></i>Mark as Favourite</a></li>
                                        <li><a class="dropdown-item delete-btn" href="#" id="delete-btn" data-bs-toggle="modal" data-bs-target="#message-delete"><i class="ti ti-trash me-2"></i>Delete</a></li>
                                        <li><a class="dropdown-item mark-unread-chat-btn" href="#"><i class="ti ti-check me-2"></i>Mark as Unread</a></li>
                                        <li><a class="dropdown-item archive-chat-btn" href="#"><i class="ti ti-box-align-right me-2"></i>Archive Chat</a></li>
                                        <li><a class="dropdown-item pin-chat-btn" href="#"><i class="ti ti-pinned me-2"></i>Pin Chat</a></li>
                                    </ul>
                                </div>   
                                <div class="message-bubble-wrap">
                                    <div class="message-content">
                                     ${forwardedLabel} <!-- Forwarded Label -->
                                     ${message.replyId != "0"
                                ? `<div class="message-reply">${replyContent}</div>`
                                : ""
                            } <!-- Reply Content only if it's a reply -->
                                        ${messageBody} <!-- Default Message -->
                                    </div>
                                    ${reactionsMarkup}
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
                                <div class="message-hover-actions">
                                    <a href="#" class="message-hover-btn hover-emoji-btn" title="React">
                                        <i class="ti ti-mood-smile"></i>
                                    </a>
                                    <a href="#" class="message-hover-btn forward-btn" title="Forward">
                                        <i class="ti ti-arrow-forward-up"></i>
                                    </a>
                                    ${reactionPickerMarkup}
                                </div>
                                <div class="message-bubble-wrap">
                                    <div class="message-content">
                                     ${forwardedLabel} <!-- Forwarded Label -->
                                     ${message.replyId != "0"
                                ? `<div class="message-reply">${replyContent}</div>`
                                : ""
                            } <!-- Reply Content only if it's a reply -->
                                        ${messageBody} <!-- Default Message -->
                                    </div>
                                    ${reactionsMarkup}
                                </div>
                                <div class="chat-actions">
                                    <a class="#" href="#" data-bs-toggle="dropdown">
                                        <i class="ti ti-dots-vertical"></i>
                                    </a>
                                     <ul class="dropdown-menu dropdown-menu-end p-3">
                                        <li><a class="dropdown-item reply-btn" href="#"><i class="ti ti-corner-up-left me-2"></i>Reply</a></li>
                                        <li><a class="dropdown-item forward-btn" href="#"><i class="ti ti-arrow-forward-up me-2"></i>Forward</a></li>
                                        <li><a class="dropdown-item copy-btn" href="#"><i class="ti ti-copy me-2"></i>Copy</a></li>
                                        <li><a class="dropdown-item favourite-chat-btn" href="#"><i class="ti ti-heart me-2"></i>Mark as Favourite</a></li>
                                        <li><a class="dropdown-item delete-btn" href="#" id="delete-btn" data-bs-toggle="modal" data-bs-target="#message-delete"><i class="ti ti-trash me-2"></i>Delete</a></li>
                                        <li><a class="dropdown-item mark-unread-chat-btn" href="#"><i class="ti ti-check me-2"></i>Mark as Unread</a></li>
                                        <li><a class="dropdown-item archive-chat-btn" href="#"><i class="ti ti-box-align-right me-2"></i>Archive Chat</a></li>
                                        <li><a class="dropdown-item pin-chat-btn" href="#"><i class="ti ti-pinned me-2"></i>Pin Chat</a></li>
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
                } else {
                    chatBox.appendChild(messageElement);
                }

                if (_chatInitialLoad) {
                    _chatInitialMsgCount++;
                    _bumpInitialLoadTimer();
                } else {
                    messageElement.classList.add("msg-fade-in");
                    const chatScrollHost =
                        document.getElementById("chat-area") || chatBox;
                    chatScrollHost.scrollTop = chatScrollHost.scrollHeight;
                }
            })
            .catch((error) => {
                console.error("Error loading message:", error);
            });
    }

    let replyToMessage = null; // To store the replied message content

    function getActiveReplyElements() {
        const root =
            document.querySelector("#middle .chat-footer .footer-form") ||
            document.querySelector(".chat-footer .footer-form") ||
            document;
        const replyDiv =
            root.querySelector("#reply-div") ||
            document.getElementById("reply-div");
        const replyContentElement =
            root.querySelector("#replyContent") ||
            document.getElementById("replyContent");
        const replyUserElement =
            root.querySelector("#replyUser") ||
            document.getElementById("replyUser");
        const closeReplyBtn =
            root.querySelector("#closeReply") ||
            document.getElementById("closeReply");
        return { replyDiv, replyContentElement, replyUserElement, closeReplyBtn };
    }

    // Event listener for the reply button
    document.addEventListener("click", (e) => {
        const replyBtn = e.target.closest(".reply-btn");
        if (replyBtn) {
            e.preventDefault();
            const messageElement = replyBtn.closest(".chats");
            if (!messageElement) {
                return;
            }

            // Normalize type: dataset stores DOMString; null attachmentType becomes literal "null" (truthy), which skipped all branches and left preview empty.
            const typeParsed = parseInt(messageElement.dataset.messageType, 10);
            const attType = Number.isFinite(typeParsed) ? typeParsed : 6;
            const replyType = String(attType);
            const rawSenderLabel = (
                messageElement.querySelector(".chat-profile-name h6")
                    ?.textContent || ""
            )
                .replace(/\s+/g, " ")
                .trim();
            const replyUser = messageElement.classList.contains("chats-right")
                ? "You"
                : rawSenderLabel || "Contact";

            let replyContent = ""; // To hold the reply content
            let mediaUrl = null; // To hold the media URL if applicable

            // Handle different message types
            if (attType === 6) {
                const textEl =
                    messageElement.querySelector(".message-content-text") ||
                    messageElement.querySelector(
                        ".message-content > div:not(.message-reply)"
                    );
                replyContent = textEl
                    ? String(textEl.innerText || "").trim()
                    : "";
            } else if (attType === 2) {
                const imgElement = messageElement.querySelector(
                    ".message-content img"
                );
                if (imgElement) {
                    mediaUrl = imgElement.src;
                    replyContent = `<img src="${mediaUrl}" alt="Image Reply" class="reply-image" style="max-width: 100px; max-height: 100px;">`;
                }
            } else if (attType === 1) {
                const videoElement = messageElement.querySelector(
                    ".message-content video"
                );
                if (videoElement) {
                    mediaUrl = videoElement.src;
                    replyContent = `<video src="${mediaUrl}" controls class="reply-video" style="max-width: 100px; max-height: 100px;"></video>`;
                }
            } else if (attType === 3) {
                const audioElement = messageElement.querySelector(
                    ".message-content audio"
                );
                if (audioElement) {
                    mediaUrl = audioElement.src;
                    replyContent = `<audio src="${mediaUrl}" controls class="reply-audio"></audio>`;
                }
            } else if (attType === 5) {
                const fileElement =
                    messageElement.querySelector(".message-content a");
                if (fileElement) {
                    mediaUrl = fileElement.href;
                    replyContent = `<a href="${mediaUrl}" target="_blank" download class="reply-file">Download File</a>`;
                }
            }

            // Update the reply box content
            const { replyDiv, replyContentElement, replyUserElement } =
                getActiveReplyElements();

            if (replyDiv && replyContentElement && replyUserElement) {
                replyDiv.style.display = "flex";
                replyUserElement.innerText = replyUser;

                // Use innerHTML for media types, innerText for text
                if ([2, 1, 3, 8, 5].includes(attType)) {
                    replyContentElement.innerHTML = replyContent;
                } else {
                    replyContentElement.innerText = replyContent;
                }
                if (!replyContent || !String(replyContent).trim()) {
                    replyContentElement.innerText = "Message";
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
                attachmentType: replyType,
                media: mediaUrl,
            };

            // console.log(replyToMessage); // Debugging output
        }
    });

    const { closeReplyBtn } = getActiveReplyElements();
    if (closeReplyBtn) {
        closeReplyBtn.onclick = () => {
            closeReplyBox();
        };
    }

    // Close Reply Box
    function closeReplyBox() {
        replyToMessage = null; // Reset the replied message
        const { replyDiv } = getActiveReplyElements();
        if (replyDiv) replyDiv.style.display = "none";
    }

    let forwardContent = null;
    document.addEventListener("click", (e) => {
        const forwardBtn = e.target.closest(".forward-btn");
        if (forwardBtn) {
            e.preventDefault();
            const messageElement = forwardBtn.closest(".chats");
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
                    if (!snapshot.exists()) {
                        resolve(users);
                        return;
                    }
                    snapshot.forEach((childSnapshot) => {
                        const userData = childSnapshot.val() || {};
                        const rawAv = rawAvatarFromFirebaseAndContact(
                            {},
                            userData
                        );
                        users.push({
                            id: childSnapshot.key,
                            firstName: userData.firstName,
                            lastName: userData.lastName,
                            userName: userData.userName || userData.user_name,
                            user_name: userData.user_name,
                            mobile_number: userData.mobile_number,
                            email: userData.email,
                            avatar: resolveCallProfileImageUrl(rawAv || ""),
                        });
                    });
                    resolve(users);
                })
                .catch((error) => reject(error));
        });
    }

    function forwardRecipientLabel(user) {
        const fn = String(user.firstName ?? "").trim();
        const ln = String(user.lastName ?? "").trim();
        const combined = `${fn} ${ln}`.trim();
        if (combined) return combined;
        const u = String(user.userName || user.user_name || "").trim();
        if (u) return u;
        const m = String(user.mobile_number || "").trim();
        if (m) return m;
        const em = String(user.email || "").trim();
        if (em) return em;
        return String(user.id || "Contact");
    }

    function showForwardModal(users, forwardContent) {
        const forwardModalEl = document.getElementById("forward-modal");
        if (
            !forwardModalEl ||
            typeof bootstrap === "undefined" ||
            !bootstrap.Modal
        ) {
            return;
        }

        /* new bootstrap.Modal() on every open stacks instances/backdrops; use a single instance. */
        const modalContainer =
            typeof bootstrap.Modal.getOrCreateInstance === "function"
                ? bootstrap.Modal.getOrCreateInstance(forwardModalEl)
                : bootstrap.Modal.getInstance(forwardModalEl) ||
                  new bootstrap.Modal(forwardModalEl);

        if (!forwardModalEl.dataset.forwardBackdropCleanup) {
            forwardModalEl.dataset.forwardBackdropCleanup = "1";
            forwardModalEl.addEventListener("hidden.bs.modal", () => {
                requestAnimationFrame(() => {
                    if (!document.querySelector(".modal.show")) {
                        document
                            .querySelectorAll(".modal-backdrop")
                            .forEach((el) => el.remove());
                        document.body.classList.remove("modal-open");
                        document.body.style.removeProperty("padding-right");
                        document.body.style.removeProperty("overflow");
                    }
                });
            });
        }

        const userListContainer = forwardModalEl.querySelector(".user-list");
        if (!userListContainer) {
            return;
        }
        userListContainer.innerHTML = "";

        users.forEach((user) => {
            const userItem = document.createElement("div");
            userItem.classList.add("user-item");
            userItem.setAttribute("data-forward-peer", user.id);

            const label = forwardRecipientLabel(user);

            const cb = document.createElement("input");
            cb.type = "checkbox";
            cb.classList.add("user-checkbox");
            cb.setAttribute("data-user-id", user.id);

            const img = document.createElement("img");
            img.src = user.avatar;
            img.alt = label;
            img.className =
                "user-avatar avatar avatar-lg avatar-rounded";
            img.width = 30;

            const span = document.createElement("span");
            span.textContent = label;

            userItem.appendChild(cb);
            userItem.appendChild(img);
            userItem.appendChild(span);
            userListContainer.appendChild(userItem);
        });

        enrichForwardModalAvatarsFromLaravel(users.map((u) => u.id)).catch(
            () => {}
        );

        modalContainer.show();

        const sendForwardBtn = document.getElementById("send-forward");
        if (sendForwardBtn) {
            sendForwardBtn.onclick = () => {
                const selectedUsers = [];
                const checkboxes = forwardModalEl.querySelectorAll(
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
                    forwardContent = null;
                }

                modalContainer.hide();
            };
        }
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
        const deleteBtn = e.target.closest(".delete-btn");
        if (deleteBtn) {
            e.preventDefault();
            const messageElement = deleteBtn.closest(".chats");
            if (!messageElement) return;
            const messageKey = messageElement.dataset.messageKey; // Unique message key
            const chatRoomId = getDeterministicChatRoomId(currentUserId, selectedUserId); // Generate chatRoomId dynamically

            // Populate hidden inputs in the form
            document.getElementById("message-to-delete").value = messageKey;
            document.getElementById("room-id").value = chatRoomId;

            if (!messageKey || !chatRoomId) {
                return;
            }

            loadChatMessageFromEitherPath(
                messageKey,
                chatRoomId,
                currentUserId,
                selectedUserId
            )
                .then(({ snapPri, snapMir }) => {
                    const exists = snapPri.exists() || snapMir.exists();
                    if (!exists) {
                        console.error("Message not found in Firebase (either path)");
                        return;
                    }
                    const message = snapPri.exists()
                        ? snapMir.exists()
                            ? {
                                  ...snapPri.val(),
                                  deletedFor: mergeFirebaseUidLists(
                                      snapPri.val().deletedFor,
                                      snapMir.val().deletedFor
                                  ),
                              }
                            : snapPri.val()
                        : snapMir.val();
                    if (message.senderId == currentUserId) {
                        const deleteForEveryoneDiv =
                            document.getElementById("delete-for-everyone-wrap");
                        if (deleteForEveryoneDiv) {
                            deleteForEveryoneDiv.style.display = "block";
                        }
                    } else {
                        const deleteForEveryoneDiv =
                            document.getElementById("delete-for-everyone-wrap");
                        if (deleteForEveryoneDiv) {
                            deleteForEveryoneDiv.style.display = "none";
                        }
                    }
                })
                .catch((error) => {
                    console.error("Error fetching message details:", error);
                });
        }
    });

    document.addEventListener("click", async (e) => {
        const copyBtn = e.target.closest(".copy-btn");
        if (!copyBtn) return;
        e.preventDefault();
        const messageElement = copyBtn.closest(".chats");
        if (!messageElement) return;
        const bodyEl = messageElement.querySelector(
            ".message-content > div:not(.message-reply)"
        );
        const textToCopy = bodyEl ? String(bodyEl.textContent || "").trim() : "";
        if (!textToCopy) return;
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(textToCopy);
            } else {
                const ta = document.createElement("textarea");
                ta.value = textToCopy;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand("copy");
                ta.remove();
            }
            Toastify({
                text: "Message copied",
                duration: 2200,
                gravity: "top",
                position: "right",
                backgroundColor: "#28a745",
            }).showToast();
        } catch (err) {
            Toastify({
                text: "Unable to copy message",
                duration: 2200,
                gravity: "top",
                position: "right",
                backgroundColor: "#dc3545",
            }).showToast();
        }
    });

    document.addEventListener("click", (e) => {
        const favBtn = e.target.closest(".favourite-chat-btn");
        if (!favBtn) return;
        e.preventDefault();
        if (selectedUserId) favouriteChat(selectedUserId);
    });

    document.addEventListener("click", (e) => {
        const unreadBtn = e.target.closest(".mark-unread-chat-btn");
        if (!unreadBtn) return;
        e.preventDefault();
        if (selectedUserId) markChatAsUnread(selectedUserId);
    });

    document.addEventListener("click", (e) => {
        const archiveBtn = e.target.closest(".archive-chat-btn");
        if (!archiveBtn) return;
        e.preventDefault();
        if (selectedUserId) archiveChat(selectedUserId);
    });

    document.addEventListener("click", (e) => {
        const pinBtn = e.target.closest(".pin-chat-btn");
        if (!pinBtn) return;
        e.preventDefault();
        if (selectedUserId) pinChat(selectedUserId);
    });

    // Delete message for the current user
    function deleteForMe(messageElement, messageKey, chatRoomId) {
        loadChatMessageFromEitherPath(
            messageKey,
            chatRoomId,
            currentUserId,
            selectedUserId
        )
            .then(({ snapPri, snapMir, refPri, refMir, mirrorChatRoomId }) => {
                if (!snapPri.exists() && !snapMir.exists()) {
                    console.error(
                        "Message does not exist on either chat path; UI left unchanged."
                    );
                    return Promise.reject(new Error("deleteForMe_missing"));
                }

                const deletedFor = mergeFirebaseUidLists(
                    snapPri.exists() ? snapPri.val().deletedFor : null,
                    snapMir.exists() ? snapMir.val().deletedFor : null
                );

                if (!deletedFor.includes(currentUserId)) {
                    const updates = { deletedFor: [...deletedFor, currentUserId] };
                    const writes = [];
                    if (snapPri.exists()) writes.push(update(refPri, updates));
                    if (snapMir.exists()) writes.push(update(refMir, updates));
                    return Promise.all(writes);
                }
                return Promise.resolve();
            })
            .then(() => {
                if (messageElement) {
                    messageElement.remove();
                } else {
                    console.error("Message element not found.");
                }
            })
            .catch((error) => {
                if (
                    !error ||
                    String(error.message || error) !== "deleteForMe_missing"
                ) {
                    console.error("Error deleting message for me:", error);
                }
            });
    }

    // Delete message for everyone
    function deleteForEveryone(messageElement, messageKey, chatRoomId) {
        const messageRef = ref(
            database,
            `data/chats/${chatRoomId}/${messageKey}`
        );
        const mirrorChatRoomId = chatMirrorRoomId(
            chatRoomId,
            currentUserId,
            selectedUserId
        );
        const mirrorMessageRef = ref(
            database,
            `data/chats/${mirrorChatRoomId}/${messageKey}`
        );
        Promise.all([remove(messageRef), remove(mirrorMessageRef)])
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

    // Before Bootstrap applies aria-hidden, ensure no focused control remains inside #message-delete (avoids a11y warning when .btn-close or submit holds focus).
    const messageDeleteModalEl = document.getElementById("message-delete");
    if (messageDeleteModalEl) {
        messageDeleteModalEl.addEventListener("hide.bs.modal", () => {
            const ae = document.activeElement;
            if (ae && messageDeleteModalEl.contains(ae)) {
                try {
                    ae.blur();
                } catch (err) {
                    /* ignore */
                }
            }
        });
    }

    // Form submission handler
    const deleteChatForm = document.getElementById("delete-chat-form");
    if (deleteChatForm) {
        deleteChatForm.addEventListener("submit", (e) => {
            e.preventDefault(); // Prevent form default behavior

            const submitter =
                typeof SubmitEvent !== "undefined" && e instanceof SubmitEvent
                    ? e.submitter
                    : null;
            if (
                submitter &&
                typeof submitter.blur === "function"
            ) {
                submitter.blur();
            }

            const messageKey =
                document.getElementById("message-to-delete").value;
            const chatRoomId = document.getElementById("room-id").value;
            const checkedDel = document.querySelector(
                'input[name="delete-chat"]:checked'
            );
            const action = checkedDel ? checkedDel.id : "";

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

            // Close the modal: move focus outside, then hide after layout — avoids Chrome warning when aria-hidden is set while the submit button still holds focus
            const modalEl = document.getElementById("message-delete");
            if (
                modalEl &&
                typeof bootstrap !== "undefined" &&
                bootstrap.Modal
            ) {
                const modal =
                    bootstrap.Modal.getInstance(modalEl) ||
                    (typeof bootstrap.Modal.getOrCreateInstance === "function"
                        ? bootstrap.Modal.getOrCreateInstance(modalEl)
                        : null);
                if (modal) {
                    const ae = document.activeElement;
                    if (ae && modalEl.contains(ae)) {
                        try {
                            ae.blur();
                        } catch (err) {
                            /* ignore */
                        }
                    }
                    const focusSink = document.createElement("button");
                    focusSink.type = "button";
                    focusSink.setAttribute("tabindex", "-1");
                    focusSink.setAttribute("aria-label", "");
                    focusSink.style.cssText =
                        "position:fixed;left:-10000px;width:1px;height:1px;overflow:hidden;opacity:0;";
                    document.body.appendChild(focusSink);
                    focusSink.focus({ preventScroll: true });
                    let cleaned = false;
                    const cleanup = () => {
                        if (cleaned) return;
                        cleaned = true;
                        modalEl.removeEventListener("hidden.bs.modal", onHidden);
                        clearTimeout(fallbackTimer);
                        focusSink.remove();
                    };
                    const onHidden = () => cleanup();
                    const fallbackTimer = setTimeout(cleanup, 2000);
                    modalEl.addEventListener("hidden.bs.modal", onHidden);
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            modal.hide();
                        });
                    });
                }
            }
        });
    }

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
            messagenotificationSound.play().catch((error) => { });
        }
    }

    // Play the message received sound (can be called in other scripts too)
    function playMessageReceivedSound() {
        if (isMessageNotificationSoundEnabled) {
            messagenotificationSound.play().catch((error) => { });
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
    const pendingOptimisticKeys = new Set(); // Track tempKeys before DOM insertion

    let _chatInitialLoad = false;
    let _chatInitialLoadTimer = null;
    let _chatInitialMsgCount = 0;

    function _showChatSpinner() {
        const spinner = document.getElementById("chat-loading-spinner");
        const chatBox = document.getElementById("chat-box");
        if (spinner) spinner.classList.add("active");
        if (chatBox) {
            chatBox.classList.add("chat-loading-hidden");
            chatBox.classList.remove("chat-reveal");
        }
    }

    function _revealChatMessages() {
        _chatInitialLoad = false;
        const spinner = document.getElementById("chat-loading-spinner");
        const chatBox = document.getElementById("chat-box");
        if (spinner) spinner.classList.remove("active");
        if (chatBox) {
            chatBox.classList.remove("chat-loading-hidden");
            chatBox.classList.add("chat-reveal");
            const msgs = chatBox.querySelectorAll(".chats:not(.msg-fade-in)");
            msgs.forEach((el, i) => {
                el.style.animationDelay = (i * 0.03) + "s";
                el.classList.add("msg-fade-in");
            });
        }
        const chatScrollHost = document.getElementById("chat-area") || chatBox;
        if (chatScrollHost) chatScrollHost.scrollTop = chatScrollHost.scrollHeight;
    }

    function _bumpInitialLoadTimer() {
        if (!_chatInitialLoad) return;
        if (_chatInitialLoadTimer) clearTimeout(_chatInitialLoadTimer);
        _chatInitialLoadTimer = setTimeout(() => { _revealChatMessages(); }, 300);
    }

    function listenForMessages(fromUserId, toUserId, chatRoomId) {
        // Remove the previous listener before adding a new one
        if (messageListener) {
            messageListener(); // Detach previous listener
            messageListener = null; // Reset the listener reference
        }

        // Clear the displayed messages set for the new chat
        displayedMessages.clear();

        // sendMessage() writes each message to the deterministic room and its mirror with the SAME key.
        // Listening on both rooms fires onChildAdded twice per message (and displayMessage is async), which
        // produced duplicate bubbles after refresh. Listen only on the canonical room; still merge flags
        // from the mirror via get() below. (Legacy data only under the mirror path would need a one-off migration.)
        const canonicalRoomId = getDeterministicChatRoomId(fromUserId, toUserId);
        const mirrorRoomId = chatMirrorRoomId(canonicalRoomId, fromUserId, toUserId);

        const messageRef = ref(database, `data/chats/${canonicalRoomId}`);

        // Function to handle new messages
        const handleNewMessage = (snapshot) => {
            const message = snapshot.val();
            const messageKey = snapshot.key;

            if (message.senderId === currentUser.uid && message.tempKey) {
                if (pendingOptimisticKeys.has(message.tempKey)) {
                    pendingOptimisticKeys.delete(message.tempKey);
                    displayedMessages.add(messageKey);
                    const optimisticElement = document.querySelector(`[data-message-key="${message.tempKey}"]`);
                    if (optimisticElement) {
                        optimisticElement.dataset.messageKey = messageKey;
                        optimisticElement.dataset.messageId = `msg-${message.timestamp}-${message.senderId}`;
                        const statusElement = optimisticElement.querySelector('.msg-read');
                        if (statusElement) {
                            statusElement.innerHTML = `<i class="ti ti-check"></i>`;
                        }
                    }
                    return;
                }
            }

            if (!displayedMessages.has(messageKey)) {
                displayedMessages.add(messageKey);
                const msg = { ...message, key: messageKey };

                if (
                    (msg.senderId === fromUserId &&
                        msg.recipientId === toUserId) ||
                    (msg.senderId === toUserId &&
                        msg.recipientId === fromUserId)
                ) {
                    get(
                        ref(
                            database,
                            `data/chats/${mirrorRoomId}/${messageKey}`
                        )
                    )
                        .then((otherSnap) => {
                            if (otherSnap.exists()) {
                                const ov = otherSnap.val();
                                msg.deletedFor = mergeFirebaseUidLists(
                                    msg.deletedFor,
                                    ov.deletedFor
                                );
                                msg.clearedFor = mergeFirebaseUidLists(
                                    msg.clearedFor,
                                    ov.clearedFor
                                );
                            }
                            displayMessage(msg);

                            if (!msg.seen && msg.recipientId === currentUser.uid) {
                                playMessageReceivedSound();
                                markMessageAsSeen(canonicalRoomId, messageKey);
                            }
                        })
                        .catch(() => {
                            displayMessage(msg);
                            if (!msg.seen && msg.recipientId === currentUser.uid) {
                                playMessageReceivedSound();
                                markMessageAsSeen(canonicalRoomId, messageKey);
                            }
                        });
                }
            }
        };

        const handleMessageUpdate = (snapshot) => {
            const updatedMessage = { ...snapshot.val(), key: snapshot.key };
            const messageKey = snapshot.key;

            if (displayedMessages.has(messageKey)) {
                const existingMessageElement = document.querySelector(
                    `[data-message-key="${messageKey}"]`
                );
                if (existingMessageElement) {
                    get(
                        ref(
                            database,
                            `data/chats/${mirrorRoomId}/${messageKey}`
                        )
                    )
                        .then((otherSnap) => {
                            if (otherSnap.exists()) {
                                const ov = otherSnap.val();
                                updatedMessage.deletedFor = mergeFirebaseUidLists(
                                    updatedMessage.deletedFor,
                                    ov.deletedFor
                                );
                                updatedMessage.clearedFor = mergeFirebaseUidLists(
                                    updatedMessage.clearedFor,
                                    ov.clearedFor
                                );
                            }
                            existingMessageElement.remove();
                            displayMessage(updatedMessage);
                        })
                        .catch(() => {
                            existingMessageElement.remove();
                            displayMessage(updatedMessage);
                        });
                }
            }
        };

        const listenerAdded = onChildAdded(messageRef, (snapshot) => {
            handleNewMessage(snapshot);
        });

        const updateListener = onChildChanged(messageRef, (snapshot) => {
            handleMessageUpdate(snapshot);
        });

        _bumpInitialLoadTimer();

        messageListener = () => {
            listenerAdded();
            updateListener();
        };
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
    const fileInputCamera = document.getElementById("files-camera");
    const messageInput = document.getElementById("message-input");
    const locationButton = document.getElementById("location-button");
    const attachCameraBtn = document.getElementById("attach-camera");
    const attachGalleryBtn = document.getElementById("attach-gallery");
    const attachAudioBtn = document.getElementById("attach-audio");
    const attachFileBtn = document.getElementById("attach-file");
    const GOOGLE_MAPS_API_KEY = "AIzaSyCAcoMewuBBAdWw5CEv6VfBcHPMl-k8uc8";

    function openAttachmentPicker(options) {
        if (!fileInput) return;
        fileInput.value = "";
        fileInput.removeAttribute("capture");
        fileInput.removeAttribute("multiple");
        fileInput.accept = (options && options.accept) ? options.accept : "*/*";
        if (options && options.capture) {
            fileInput.setAttribute("capture", options.capture);
        }
        fileInput.click();
    }

    if (attachCameraBtn) {
        attachCameraBtn.addEventListener("click", (e) => {
            e.preventDefault();
            openChatCameraCapture();
        });
    }
    if (attachGalleryBtn) {
        attachGalleryBtn.addEventListener("click", (e) => {
            e.preventDefault();
            openAttachmentPicker({ accept: "image/*,video/*" });
        });
    }
    if (attachAudioBtn) {
        attachAudioBtn.addEventListener("click", (e) => {
            e.preventDefault();
            openAttachmentPicker({ accept: "audio/*" });
        });
    }
    if (attachFileBtn) {
        attachFileBtn.addEventListener("click", (e) => {
            e.preventDefault();
            openAttachmentPicker({
                accept:
                    ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.7z,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/csv,application/zip,application/x-rar-compressed,application/x-7z-compressed",
            });
        });
    }

    if (messageInput) {
        messageInput.addEventListener("input", () => {
            if (!selectedUserId || !currentUser) return;
            if (messageInput.value.trim().length > 0) {
                pulseChatTyping(selectedUserId);
            } else {
                clearChatTyping();
            }
        });
        messageInput.addEventListener("blur", () => {
            clearChatTyping();
        });
    }

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

    const chatFooterWrap = document.querySelector(".chat-footer-wrap");
    if (chatFooterWrap) {
    chatFooterWrap.appendChild(messagePreview); // Add preview container to footer
    messagePreview.appendChild(clearButton); // Add Clear button to preview container
    }

    function renderChatFilePreview(selectedFile) {
        if (!selectedFile) return;
        const fileType = selectedFile.type.split("/")[0];
        let filePreview;
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
            filePreview = `<p>File Selected: ${selectedFile.name}</p>`;
        }
        messagePreview.innerHTML = filePreview;
        messagePreview.appendChild(clearButton);
        clearButton.style.display = "inline-block";
        if (messageInput) messageInput.focus();
    }

    function assignFileToMainChatInput(file) {
        if (!fileInput || !file) return;
        try {
            const dt = new DataTransfer();
            dt.items.add(file);
            fileInput.files = dt.files;
        } catch (err) {
            console.error(err);
            return;
        }
        renderChatFilePreview(fileInput.files[0]);
    }

    function shouldPreferNativeCameraPicker() {
        if (typeof navigator === "undefined") return false;
        if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "")) {
            return true;
        }
        try {
            if (
                typeof navigator.maxTouchPoints === "number" &&
                navigator.maxTouchPoints > 0 &&
                window.matchMedia &&
                window.matchMedia("(pointer: coarse)").matches
            ) {
                return true;
            }
        } catch {
            /* ignore */
        }
        return false;
    }

    async function openChatCameraCapture() {
        const toggle = document.querySelector(
            ".chat-footer-wrap [data-bs-toggle=\"dropdown\"]"
        );
        if (toggle && typeof bootstrap !== "undefined" && bootstrap.Dropdown) {
            const inst = bootstrap.Dropdown.getInstance(toggle);
            if (inst) inst.hide();
        }

        function fallbackNativeCameraPicker() {
            if (fileInputCamera) {
                fileInputCamera.value = "";
                fileInputCamera.onchange = function () {
                    const f = fileInputCamera.files[0];
                    if (f) assignFileToMainChatInput(f);
                    fileInputCamera.value = "";
                    fileInputCamera.onchange = null;
                };
                fileInputCamera.click();
                return;
            }
            openAttachmentPicker({ accept: "image/*", capture: "environment" });
        }

        if (shouldPreferNativeCameraPicker()) {
            fallbackNativeCameraPicker();
            return;
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            fallbackNativeCameraPicker();
            return;
        }

        let stream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: "environment" } },
                audio: false,
            });
        } catch {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: false,
                });
            } catch (err) {
                console.warn("Camera unavailable, using file picker.", err);
                fallbackNativeCameraPicker();
                return;
            }
        }

        const overlay = document.createElement("div");
        overlay.id = "chat-camera-capture-overlay";
        overlay.setAttribute("role", "dialog");
        overlay.style.cssText =
            "position:fixed;inset:0;z-index:10050;background:rgba(0,0,0,0.92);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:16px;";

        const video = document.createElement("video");
        video.setAttribute("playsinline", "");
        video.setAttribute("autoplay", "");
        video.muted = true;
        video.style.cssText =
            "max-width:100%;max-height:65vh;border-radius:8px;background:#000;";
        video.srcObject = stream;

        const row = document.createElement("div");
        row.style.cssText =
            "display:flex;gap:12px;flex-wrap:wrap;justify-content:center;";

        const capBtn = document.createElement("button");
        capBtn.type = "button";
        capBtn.className = "btn btn-primary";
        capBtn.textContent = "Capture";
        capBtn.disabled = true;

        const cancelBtn = document.createElement("button");
        cancelBtn.type = "button";
        cancelBtn.className = "btn btn-secondary";
        cancelBtn.textContent = "Cancel";

        function cleanup() {
            stream.getTracks().forEach((t) => t.stop());
            overlay.remove();
            document.removeEventListener("keydown", onKey);
        }

        function onKey(ev) {
            if (ev.key === "Escape") cleanup();
        }
        document.addEventListener("keydown", onKey);

        cancelBtn.onclick = () => cleanup();

        capBtn.onclick = () => {
            const w = video.videoWidth;
            const h = video.videoHeight;
            if (!w || !h) {
                if (typeof Toastify !== "undefined") {
                    Toastify({
                        text: "Camera is still starting. Try again in a moment.",
                        duration: 2500,
                        gravity: "top",
                        position: "right",
                        backgroundColor: "#ff3d00",
                        stopOnFocus: true,
                    }).showToast();
                }
                return;
            }
            const canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(video, 0, 0);
            canvas.toBlob(
                (blob) => {
                    cleanup();
                    if (!blob) return;
                    const file = new File(
                        [blob],
                        `camera-${Date.now()}.jpg`,
                        { type: "image/jpeg" }
                    );
                    assignFileToMainChatInput(file);
                },
                "image/jpeg",
                0.92
            );
        };

        row.appendChild(capBtn);
        row.appendChild(cancelBtn);
        overlay.appendChild(video);
        overlay.appendChild(row);
        document.body.appendChild(overlay);

        video.addEventListener(
            "loadedmetadata",
            () => {
                capBtn.disabled = false;
            },
            { once: true }
        );

        video.play().catch(() => {});
    }

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

                // 3. Register tempKey before display so Firebase listener can skip it even if DOM isn't ready
                pendingOptimisticKeys.add(tempKey);

                // 4. Display the message immediately
                displayMessage(optimisticMessage);

                // 4. Clear the input and close the reply box
                messageInput.value = "";
                closeReplyBox();
                clearChatTyping();

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
                clearChatTyping();

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
                        clearChatTyping();
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

    // Show a file preview when a file is selected (only when chat footer and file input exist)
    if (fileInput && chatFooterWrap) {
        fileInput.onchange = function () {
            const selectedFile = fileInput.files[0];
            if (selectedFile) renderChatFilePreview(selectedFile);
        };

        // Clear the file selection and preview when Clear button is clicked
        clearButton.onclick = function () {
            fileInput.value = ""; // Reset the file input
            messagePreview.innerHTML = ""; // Clear the preview content
            clearButton.style.display = "none"; // Hide Clear button
        };
    }

    // Function to handle emoji selection and insert it into the message input (only when chat elements exist)
    if (messageInput) {
        document
            .querySelectorAll(".emoj-group-list-foot a")
            .forEach(function (emojiBtn) {
                emojiBtn.onclick = function () {
                    const img = emojiBtn.querySelector("img");
                    if (img) messageInput.value += img.alt;
                    messageInput.focus();
                    messageInput.selectionStart = messageInput.selectionEnd =
                        messageInput.value.length;
                };
            });
    }

    // Upload chat attachments via Laravel (same origin) to avoid browser CORS against
    // Firebase Storage on localhost / misconfigured buckets. Message payloads still store a URL.
    async function uploadFileToFirebase(file) {
        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute("content");
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/chat/upload-file", {
            method: "POST",
            headers: {
                "X-Requested-With": "XMLHttpRequest",
                "X-CSRF-TOKEN": csrfToken || "",
                Accept: "application/json",
            },
            body: formData,
            credentials: "same-origin",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            const msg =
                data.error ||
                data.message ||
                (typeof data === "string" ? data : res.statusText);
            throw new Error(msg || "Upload failed");
        }
        if (!data.url) {
            throw new Error("Upload did not return a URL");
        }
        return data.url;
    }

    // Helper function to check if the text contains emojis
    function containsEmoji(text) {
        const emojiRegex = /[\u{1F600}-\u{1F64F}]/u; // Regex to detect emojis
        return emojiRegex.test(text);
    }

    let otherUserId = "";

    const blockUserDropdownBtn = document.getElementById("blockUserDropdownBtn");
    if (blockUserDropdownBtn) {
        blockUserDropdownBtn.addEventListener("click", function (event) {
            otherUserId = selectedUserId;
        });
    }

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
                    (snapshot) => { }
                );
            })
            .catch((error) => { });
    }

    // Add an event listener to the 'Block' button in the modal
    const confirmBlockUserBtn = document.getElementById("confirmBlockUserBtn");
    if (confirmBlockUserBtn) {
        confirmBlockUserBtn.addEventListener("click", function () {
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
    }

    const chatSearchInput = document.getElementById("chatSearchInput");
    if (chatSearchInput) {
        chatSearchInput.addEventListener("input", function () {
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
    }

    const chatcontactSearchInput = document.getElementById("chatcontactSearchInput");
    if (chatcontactSearchInput) {
        chatcontactSearchInput.addEventListener("input", function () {
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
    }

    // Clear search input when clicking "Cancel"
    const cancelsearchbutton = document.querySelector("#cancelsearchbutton");
    if (cancelsearchbutton) {
        cancelsearchbutton.addEventListener("click", function () {
            const searchInput = document.getElementById(
                "chatcontactSearchInput"
            );
            searchInput.value = ""; // Clear the input field
            searchInput.dispatchEvent(new Event("input")); // Trigger the input event to refresh the contact list
        });
    }

    const cancelsearch = document.querySelector("#cancelsearch");
    if (cancelsearch) {
        cancelsearch.addEventListener("click", function () {
            const searchInput = document.getElementById(
                "chatcontactSearchInput"
            );
            if (searchInput) {
                searchInput.value = "";
                searchInput.dispatchEvent(new Event("input"));
            }
        });
    }

    const logoutButton = document.getElementById("logout-button");
    if (logoutButton) {
        logoutButton.addEventListener("click", function (event) {
        event.preventDefault(); // Prevent default action (if any)
        logoutUser(); // Call the logoutUser function
    });
    }

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
                .then(function () {
                    return doServerLogout();
                })
                .then(function () {
                    // Redirect to the login page after successful logout
                    window.location.href = loginUrl;
                })
                .catch((error) => {
                    doServerLogout().then(function () { window.location.href = loginUrl; });
                });
        } else {
            doServerLogout().then(function () { window.location.href = loginUrl; });
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
                    .catch((error) => { });
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

    /**
     * Mark every message in the canonical + mirror chat rooms as clearedFor the current user.
     * Delete chat only hid the sidebar row before; RTDB messages stayed, so reopening showed full history.
     */
    function applyClearedForEntireThread(peerUserId) {
        const me = currentUser?.uid || currentUserId;
        if (!me || !peerUserId) {
            return Promise.resolve();
        }
        const canonical = getDeterministicChatRoomId(me, peerUserId);
        const mirror = chatMirrorRoomId(canonical, me, peerUserId);

        function applyForRoom(roomId) {
            const messagesRef = ref(database, `data/chats/${roomId}`);
            return get(messagesRef).then((snapshot) => {
                if (!snapshot.exists()) return;
                const messages = snapshot.val();
                const updates = {};
                Object.keys(messages).forEach((messageId) => {
                    const clearedFor = firebaseUidList(
                        messages[messageId].clearedFor
                    );
                    if (!clearedFor.includes(me)) {
                        updates[`${messageId}/clearedFor`] = [
                            ...clearedFor,
                            me,
                        ];
                    }
                });
                if (Object.keys(updates).length === 0) return;
                return update(messagesRef, updates);
            });
        }

        return Promise.all([
            applyForRoom(canonical),
            applyForRoom(mirror),
        ]).then(() => {});
    }

    /** Delete-chat keeps rows under delete_chats; displayUsers skips those peers until removed. */
    function unhidePeerFromDeletedChatsIfAny(peerUserId) {
        const me = currentUser?.uid || currentUserId;
        if (!me || !peerUserId) {
            return Promise.resolve();
        }
        const delRef = ref(database, `data/users/${me}/delete_chats`);
        return get(delRef)
            .then((snap) => {
                if (!snap.exists()) return;
                const v = snap.val();
                const tasks = [];
                Object.keys(v).forEach((key) => {
                    const row = v[key];
                    if (
                        row &&
                        String(row.userId) === String(peerUserId) &&
                        row.deleted
                    ) {
                        tasks.push(
                            remove(
                                ref(
                                    database,
                                    `data/users/${me}/delete_chats/${key}`
                                )
                            )
                        );
                    }
                });
                if (tasks.length === 0) return;
                return Promise.all(tasks);
            })
            .catch(() => {});
    }

    function afterOutgoingMessagePersisted(peerUserId) {
        return unhidePeerFromDeletedChatsIfAny(peerUserId).then(() => {
            try {
                fetchUsers();
            } catch (e) {
                /* ignore */
            }
        });
    }

    /** Records chat under delete_chats (so displayUsers hides it), removes sidebar row, resets view if open. */
    function removeChatFromSidebarList(userId) {
        if (!userId || !currentUser?.uid) return;
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
                applyClearedForEntireThread(userId)
                    .catch(() => {})
                    .then(() => {
                        removeUserFromUI(userId);
                        if (String(selectedUserId) === String(userId)) {
                            resetChatShellToWelcome();
                        }
                        scheduleRefreshChatFilterBadgeCounts();
                    });
            } else {
                const newDeleteRef = push(ref(database, userRef));
                set(newDeleteRef, {
                    userId: userId,
                    timestamp: Date.now(),
                    deleted: true,
                })
                    .then(() => applyClearedForEntireThread(userId))
                    .catch(() => {})
                    .then(() => {
                        removeUserFromUI(userId);
                        if (String(selectedUserId) === String(userId)) {
                            resetChatShellToWelcome();
                        }
                        scheduleRefreshChatFilterBadgeCounts();
                        Toastify({
                            text: "Chat deleted successfully!",
                            duration: 3000,
                            gravity: "top",
                            position: "right",
                            backgroundColor: "#28a745",
                        }).showToast();
                    })
                    .catch((error) => { });
            }
        });
    }

    function markChatAsUnread(userId) {
        if (!currentUser?.uid || !userId) return;
        set(
            ref(
                database,
                `data/users/${currentUser.uid}/marked_unread/${userId}`
            ),
            Date.now()
        )
            .then(() => {
                Toastify({
                    text: "Chat marked as unread",
                    duration: 3000,
                    gravity: "top",
                    position: "right",
                    backgroundColor: "#28a745",
                }).showToast();
            })
            .catch(() => {});
    }

    function removeUserFromUI(userId) {
        document
            .querySelectorAll(`.chat-list[data-user-id='${userId}']`)
            .forEach((el) => el.remove());
        const slide = document.querySelector(
            `.swiper-slide[data-recent-user-id='${userId}']`
        );
        if (slide) slide.remove();
        if (window.swiperInstance && typeof window.swiperInstance.update === "function") {
            try {
                window.swiperInstance.update();
            } catch (e) { /* ignore */ }
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
            .catch((error) => { });
    }

    function refreshContactFavouritesBadgeCount() {
        if (!currentUser?.uid) return;
        get(ref(database, `data/users/${currentUser.uid}/favourite_chats`))
            .then((s) => {
                const badge = document.getElementById(
                    "contact-favourites-badge"
                );
                if (!badge) return;
                let n = 0;
                if (s.exists()) {
                    const v = s.val();
                    n =
                        v && typeof v === "object"
                            ? Object.keys(v).length
                            : 0;
                }
                if (n > 0) {
                    badge.textContent = String(n);
                    badge.classList.remove("d-none");
                } else {
                    badge.textContent = "";
                    badge.classList.add("d-none");
                }
            })
            .catch(() => {});
    }

    const contactInfoButton = document.getElementById("contactInfoButton");
    if (contactInfoButton) {
        contactInfoButton.addEventListener("click", () => {
            if (selectedUserId) {
                showContactInfo(selectedUserId);
                refreshContactFavouritesBadgeCount();
            }
        });
    }

    (function wireContactInfoPanelActions() {
        const audio = document.getElementById("contact-profile-audio-btn");
        const video = document.getElementById("contact-profile-video-btn");
        const chatBtn = document.getElementById("contact-profile-chat-btn");
        const searchBtn = document.getElementById("contact-profile-search-btn");
        if (audio && !audio.dataset.wired) {
            audio.dataset.wired = "1";
            audio.addEventListener("click", (e) => {
                e.preventDefault();
                document.getElementById("audio-call-btn")?.click();
            });
        }
        if (video && !video.dataset.wired) {
            video.dataset.wired = "1";
            video.addEventListener("click", (e) => {
                e.preventDefault();
                document.getElementById("video-call-new-btn")?.click();
            });
        }
        if (chatBtn && !chatBtn.dataset.wired) {
            chatBtn.dataset.wired = "1";
            chatBtn.addEventListener("click", (e) => {
                e.preventDefault();
                const oc = document.getElementById("contact-profile");
                if (oc && typeof bootstrap !== "undefined") {
                    const inst = bootstrap.Offcanvas.getInstance(oc);
                    if (inst) inst.hide();
                }
                document.getElementById("message-input")?.focus();
            });
        }
        if (searchBtn && !searchBtn.dataset.wired) {
            searchBtn.dataset.wired = "1";
            searchBtn.addEventListener("click", (e) => {
                e.preventDefault();
                document.querySelector(".chat-search-btn")?.click();
            });
        }
        const mediaAccordionMap = {
            "contact-media-photos": { collapseId: "media-collapse-photos", type: "photos", attachmentTypes: [2] },
            "contact-media-videos": { collapseId: "media-collapse-videos", type: "videos", attachmentTypes: [1] },
            "contact-media-links":  { collapseId: "media-collapse-links",  type: "links",  attachmentTypes: [6] },
            "contact-media-docs":   { collapseId: "media-collapse-docs",   type: "docs",   attachmentTypes: [5] },
        };

        async function loadMediaAccordion(collapseEl, mediaType) {
            if (!currentUser || !selectedUserId) return;
            const loadingEl = collapseEl.querySelector(".media-loading");
            const emptyEl   = collapseEl.querySelector(".media-empty");
            const gridEl    = collapseEl.querySelector(".media-photos-grid, .media-videos-grid");
            const listEl    = collapseEl.querySelector(".media-links-list, .media-docs-list");

            if (loadingEl) loadingEl.classList.remove("d-none");
            if (emptyEl)   emptyEl.classList.add("d-none");
            if (gridEl) gridEl.innerHTML = "";
            if (listEl) listEl.innerHTML = "";

            const canonicalRoomId = getDeterministicChatRoomId(
                currentUser.uid,
                selectedUserId
            );
            let messages = [];
            try {
                const snap = await get(
                    ref(database, `data/chats/${canonicalRoomId}`)
                );
                if (snap.exists()) {
                    snap.forEach((child) => {
                        messages.push(child.val());
                    });
                }
            } catch (e) {
                /* ignore */
            }

            if (loadingEl) loadingEl.classList.add("d-none");

            const filtered = messages.filter((msg) =>
                mediaType.attachmentTypes.includes(Number(msg.attachmentType))
            );

            if (mediaType.type === "photos" || mediaType.type === "videos") {
                if (!filtered.length) { if (emptyEl) emptyEl.classList.remove("d-none"); return; }
                filtered.forEach(msg => {
                    const url = normalizeChatMediaUrl(msg.attachment && msg.attachment.url ? msg.attachment.url : msg.attachment);
                    const col = document.createElement("div");
                    col.className = "col-4";
                    if (mediaType.type === "photos") {
                        col.innerHTML = `<a href="${url}" target="_blank"><img src="${url}" class="img-fluid rounded" style="height:80px;width:100%;object-fit:cover;" alt="photo"></a>`;
                    } else {
                        col.innerHTML = `<video src="${url}" class="img-fluid rounded" style="height:80px;width:100%;object-fit:cover;" controls></video>`;
                    }
                    if (gridEl) gridEl.appendChild(col);
                });

            } else if (mediaType.type === "links") {
                const seenUrls = new Set();
                let found = false;

                function trimTrailingUrlPunct(u) {
                    return String(u || "").replace(/[)\],.;:!?]+$/g, "");
                }

                function normalizeUrl(href) {
                    if (!href || typeof href !== "string") return null;
                    let u = trimTrailingUrlPunct(href.trim());
                    if (!u) return null;
                    if (!/^https?:\/\//i.test(u) && /^www\./i.test(u)) {
                        u = "https://" + u;
                    }
                    if (!/^https?:\/\//i.test(u)) return null;
                    try {
                        return new URL(u).href;
                    } catch (e) {
                        return null;
                    }
                }

                function addLinkRow(rawHref) {
                    const u = normalizeUrl(rawHref);
                    if (!u || seenUrls.has(u)) return;
                    seenUrls.add(u);
                    found = true;
                    const item = document.createElement("a");
                    item.href = u;
                    item.target = "_blank";
                    item.rel = "noopener noreferrer";
                    item.className =
                        "list-group-item list-group-item-action px-0 py-2 text-truncate border-0";
                    item.style.fontSize = "0.82rem";
                    item.textContent = u;
                    item.title = u;
                    if (listEl) listEl.appendChild(item);
                }

                const extractUrlsFromText = (text) => {
                    if (!text || typeof text !== "string") return;
                    const reHttp = /https?:\/\/[^\s<>"']+/gi;
                    const reWww =
                        /\bwww\.[a-z0-9][a-z0-9.-]*\.[a-z]{2,}[^\s<>"']*/gi;
                    let m;
                    while ((m = reHttp.exec(text)) !== null) {
                        addLinkRow(m[0]);
                    }
                    while ((m = reWww.exec(text)) !== null) {
                        addLinkRow(m[0]);
                    }
                };

                const textMsgs = messages.filter(
                    (msg) => Number(msg.attachmentType) === 6 && msg.body
                );
                for (const msg of textMsgs) {
                    let text = null;
                    try {
                        text = await decryptlibsodiumMessage(msg.body);
                    } catch (e) {
                        text = null;
                    }
                    if (!text && typeof msg.body === "string") {
                        const b = msg.body.trim();
                        if (/^https?:\/\//i.test(b) || /^www\./i.test(b)) {
                            text = b;
                        }
                    }
                    extractUrlsFromText(text);
                }

                const mapMsgs = messages.filter(
                    (m) => Number(m.attachmentType) === 4 && m.attachment
                );
                for (const msg of mapMsgs) {
                    const att = msg.attachment;
                    if (att.link) addLinkRow(att.link);
                    if (att.url && typeof att.url === "string") {
                        const u = att.url;
                        if (
                            /maps\.(google|googleapis)\.|goo\.gl|g\.co\/maps/i.test(
                                u
                            ) ||
                            /maps\.google\.com|google\.com\/maps/i.test(u)
                        ) {
                            addLinkRow(u);
                        }
                    }
                }

                if (!found && emptyEl) emptyEl.classList.remove("d-none");

            } else if (mediaType.type === "docs") {
                if (!filtered.length) { if (emptyEl) emptyEl.classList.remove("d-none"); return; }
                for (const msg of filtered) {
                    let url = msg.attachment && msg.attachment.url ? msg.attachment.url : msg.attachment;
                    if (!url) { try { url = await decryptlibsodiumMessage(msg.body); } catch(e) {} }
                    url = normalizeChatMediaUrl(url);
                    const name = (msg.attachment && msg.attachment.name) || (url && url.split("/").pop()) || "File";
                    const item = document.createElement("a");
                    item.href = url; item.target = "_blank"; item.download = name;
                    item.className = "list-group-item list-group-item-action px-0 py-2 border-0 d-flex align-items-center gap-2";
                    item.innerHTML = `<i class="ti ti-file text-primary"></i><span class="text-truncate" style="font-size:0.82rem;">${name}</span>`;
                    if (listEl) listEl.appendChild(item);
                }
            }
        }

        Object.keys(mediaAccordionMap).forEach((id) => {
            const triggerEl = document.getElementById(id);
            if (!triggerEl || triggerEl.dataset.wired) return;
            triggerEl.dataset.wired = "1";
            const cfg = mediaAccordionMap[id];
            const collapseEl = document.getElementById(cfg.collapseId);
            if (!collapseEl) return;

            triggerEl.addEventListener("click", (e) => {
                e.preventDefault();
                if (typeof bootstrap === "undefined") return;
                let inst = bootstrap.Collapse.getInstance(collapseEl);
                if (!inst) inst = new bootstrap.Collapse(collapseEl, { toggle: false });

                const isOpen = collapseEl.classList.contains("show");
                const chevron = triggerEl.querySelector(".media-chevron i");

                // Close all other media sections first
                Object.keys(mediaAccordionMap).forEach(otherId => {
                    if (otherId === id) return;
                    const otherCollapseEl = document.getElementById(mediaAccordionMap[otherId].collapseId);
                    if (otherCollapseEl && otherCollapseEl.classList.contains("show")) {
                        const otherInst = bootstrap.Collapse.getInstance(otherCollapseEl);
                        if (otherInst) otherInst.hide();
                        const otherTrigger = document.getElementById(otherId);
                        const otherChevron = otherTrigger && otherTrigger.querySelector(".media-chevron i");
                        if (otherChevron) { otherChevron.classList.remove("ti-chevron-up"); otherChevron.classList.add("ti-chevron-right"); }
                    }
                });

                if (isOpen) {
                    inst.hide();
                    if (chevron) { chevron.classList.remove("ti-chevron-up"); chevron.classList.add("ti-chevron-right"); }
                } else {
                    inst.show();
                    if (chevron) { chevron.classList.remove("ti-chevron-right"); chevron.classList.add("ti-chevron-up"); }
                    loadMediaAccordion(collapseEl, cfg);
                }
            });
        });

        function refreshOpenMediaAccordions() {
            if (!currentUser || !selectedUserId) return;
            Object.keys(mediaAccordionMap).forEach((id) => {
                const cfg = mediaAccordionMap[id];
                const collapseEl = document.getElementById(cfg.collapseId);
                if (!collapseEl || !collapseEl.classList.contains("show")) {
                    return;
                }
                collapseEl
                    .querySelectorAll(
                        ".media-photos-grid,.media-videos-grid,.media-links-list,.media-docs-list"
                    )
                    .forEach((c) => {
                        c.innerHTML = "";
                    });
                collapseEl
                    .querySelectorAll(".media-empty")
                    .forEach((e) => e.classList.add("d-none"));
                loadMediaAccordion(collapseEl, cfg);
            });
        }
        window.__dreamchatRefreshOpenMediaAccordions = refreshOpenMediaAccordions;

        // ── Others accordion ──────────────────────────────────────────
        const othersAccordionMap = {
            "contact-open-favourites": "others-collapse-favourites",
            "others-row-mute":         "others-collapse-mute",
            "blockedUserDropdownBtn":  "others-collapse-block",
            "others-row-report":       "others-collapse-report",
            "others-row-delete":       "others-collapse-delete",
        };

        function closeAllOthers(exceptId) {
            Object.keys(othersAccordionMap).forEach(id => {
                if (id === exceptId) return;
                const col = document.getElementById(othersAccordionMap[id]);
                if (col && col.classList.contains("show")) {
                    const inst = bootstrap.Collapse.getInstance(col);
                    if (inst) inst.hide();
                    const tr = document.getElementById(id);
                    const ch = tr && tr.querySelector(".others-chevron i");
                    if (ch) { ch.classList.remove("ti-chevron-up"); ch.classList.add("ti-chevron-right"); }
                }
            });
        }

        Object.keys(othersAccordionMap).forEach(id => {
            const triggerEl = document.getElementById(id);
            if (!triggerEl || triggerEl.dataset.othersWired) return;
            triggerEl.dataset.othersWired = "1";
            const collapseEl = document.getElementById(othersAccordionMap[id]);
            if (!collapseEl) return;

            triggerEl.addEventListener("click", (e) => {
                e.preventDefault();
                if (typeof bootstrap === "undefined") return;
                const isOpen = collapseEl.classList.contains("show");
                const chevron = triggerEl.querySelector(".others-chevron i");

                closeAllOthers(id);

                let inst = bootstrap.Collapse.getInstance(collapseEl);
                if (!inst) inst = new bootstrap.Collapse(collapseEl, { toggle: false });

                if (isOpen) {
                    inst.hide();
                    if (chevron) { chevron.classList.remove("ti-chevron-up"); chevron.classList.add("ti-chevron-right"); }
                } else {
                    inst.show();
                    if (chevron) { chevron.classList.remove("ti-chevron-right"); chevron.classList.add("ti-chevron-up"); }
                    // Load favourites on first open
                    if (id === "contact-open-favourites" && collapseEl.dataset.othersLoaded !== "1") {
                        collapseEl.dataset.othersLoaded = "1";
                        loadOthersFavourites(collapseEl);
                    }
                    // Update block label & button on open
                    if (id === "blockedUserDropdownBtn") {
                        otherblockUserId = selectedUserId;
                        const btn = document.getElementById("others-block-confirm-btn");
                        const desc = document.getElementById("others-block-desc");
                        if (isUserInfoBlocked) {
                            if (btn) btn.textContent = "Unblock";
                            if (desc) desc.textContent = "Are you sure you want to unblock this user?";
                        } else {
                            if (btn) btn.textContent = "Block";
                            if (desc) desc.textContent = "Blocked contacts will no longer be able to call you or send you messages.";
                        }
                    }
                }
            });
        });

        // Cancel buttons collapse their parent section
        document.querySelectorAll(".others-collapse-cancel").forEach(btn => {
            btn.addEventListener("click", () => {
                const col = btn.closest(".others-collapse-content");
                if (!col) return;
                const inst = bootstrap.Collapse.getInstance(col);
                if (inst) inst.hide();
                // Reset chevron for the matching trigger
                Object.keys(othersAccordionMap).forEach(id => {
                    if (othersAccordionMap[id] === col.id) {
                        const ch = document.getElementById(id)?.querySelector(".others-chevron i");
                        if (ch) { ch.classList.remove("ti-chevron-up"); ch.classList.add("ti-chevron-right"); }
                    }
                });
            });
        });

        // Favourites loader
        async function loadOthersFavourites(collapseEl) {
            const loadingEl = collapseEl.querySelector(".others-loading");
            const emptyEl   = collapseEl.querySelector(".others-empty");
            const listEl    = document.getElementById("others-favourites-list");
            if (!currentUser || !listEl) return;
            if (loadingEl) loadingEl.classList.remove("d-none");
            try {
                const snap = await get(ref(database, `data/users/${currentUser.uid}/favourite_chats`));
                if (loadingEl) loadingEl.classList.add("d-none");
                if (!snap.exists()) { if (emptyEl) emptyEl.classList.remove("d-none"); return; }
                const favs = snap.val();
                let count = 0;
                for (const key in favs) {
                    const f = favs[key];
                    const uid = f.userId;
                    if (!uid) continue;
                    const u = usersMap[uid] || {};
                    const name = u.userName || uid;
                    const img = resolveCallProfileImageUrl(u.profileImage || "");
                    const item = document.createElement("div");
                    item.className = "d-flex align-items-center gap-2 py-2 border-bottom";
                    item.innerHTML = `<img src="${img}" class="rounded-circle" style="width:36px;height:36px;object-fit:cover;" alt="">
                        <span class="small fw-medium text-truncate">${name}</span>`;
                    listEl.appendChild(item);
                    count++;
                }
                if (count === 0 && emptyEl) emptyEl.classList.remove("d-none");
            } catch(e) {
                if (loadingEl) loadingEl.classList.add("d-none");
                if (emptyEl) emptyEl.classList.remove("d-none");
            }
        }

        // Block / Unblock inline confirm
        const othersBlockBtn = document.getElementById("others-block-confirm-btn");
        if (othersBlockBtn) {
            othersBlockBtn.addEventListener("click", () => {
                if (!otherblockUserId) otherblockUserId = selectedUserId;
                if (isUserInfoBlocked) {
                    unblockUser(otherblockUserId);
                } else {
                    blockedUser(otherblockUserId);
                }
                const col = document.getElementById("others-collapse-block");
                const inst = col && bootstrap.Collapse.getInstance(col);
                if (inst) inst.hide();
                const ch = document.getElementById("blockedUserDropdownBtn")?.querySelector(".others-chevron i");
                if (ch) { ch.classList.remove("ti-chevron-up"); ch.classList.add("ti-chevron-right"); }
            });
        }

        // Delete Chat inline confirm
        const othersDeleteBtn = document.getElementById("others-delete-confirm-btn");
        if (othersDeleteBtn) {
            othersDeleteBtn.addEventListener("click", () => {
                if (!selectedUserId) return;
                removeChatFromSidebarList(selectedUserId);
                const col = document.getElementById("others-collapse-delete");
                const inst = col && bootstrap.Collapse.getInstance(col);
                if (inst) inst.hide();
                const ch = document.getElementById("others-row-delete")?.querySelector(".others-chevron i");
                if (ch) { ch.classList.remove("ti-chevron-up"); ch.classList.add("ti-chevron-right"); }
            });
        }

        // Report inline confirm (UI only — no backend hooked)
        const othersReportBtn = document.getElementById("others-report-confirm-btn");
        if (othersReportBtn) {
            othersReportBtn.addEventListener("click", () => {
                const col = document.getElementById("others-collapse-report");
                const inst = col && bootstrap.Collapse.getInstance(col);
                if (inst) inst.hide();
                const ch = document.getElementById("others-row-report")?.querySelector(".others-chevron i");
                if (ch) { ch.classList.remove("ti-chevron-up"); ch.classList.add("ti-chevron-right"); }
                if (typeof Toastify !== "undefined") Toastify({ text: "User reported.", duration: 2500 }).showToast();
            });
        }

        // Mute inline confirm (UI only — no backend hooked)
        const othersMuteBtn = document.getElementById("others-mute-confirm-btn");
        if (othersMuteBtn) {
            othersMuteBtn.addEventListener("click", () => {
                const selected = document.querySelector('input[name="others_mute"]:checked');
                const label = selected ? selected.nextElementSibling?.textContent?.trim() : null;
                const col = document.getElementById("others-collapse-mute");
                const inst = col && bootstrap.Collapse.getInstance(col);
                if (inst) inst.hide();
                const ch = document.getElementById("others-row-mute")?.querySelector(".others-chevron i");
                if (ch) { ch.classList.remove("ti-chevron-up"); ch.classList.add("ti-chevron-right"); }
                if (typeof Toastify !== "undefined" && label) Toastify({ text: `Muted for ${label}.`, duration: 2500 }).showToast();
            });
        }
    })();

    (function bindContactProfileDockLayout() {
        const spa = document.getElementById("spa-page-content");
        const panel = document.getElementById("contact-profile");
        if (!spa || !panel || panel.dataset.contactDockBound === "1") return;
        panel.dataset.contactDockBound = "1";
        const setDockOpen = function (open) {
            spa.classList.toggle("contact-profile-dock-open", !!open);
        };
        panel.addEventListener("shown.bs.offcanvas", function () {
            setDockOpen(true);
        });
        panel.addEventListener("hidden.bs.offcanvas", function () {
            setDockOpen(false);
        });
        if (panel.classList.contains("show")) {
            setDockOpen(true);
        }
    })();

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
            .catch((error) => { });
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
                setContactName("Profile info hidden");
                const ids = [
                    "contact-bio",
                    "contact-location",
                    "contact-website",
                    "contact-join-date",
                    "contact-last-seen",
                ];
                ids.forEach((id) => {
                    const el = document.getElementById(id);
                    if (el) el.textContent = "";
                });
                document.querySelectorAll('#contact-profile .contact-kyc-badge, #contact-profile .contact-social-verified').forEach(b => { b.style.display = "none"; });
                const avHidden = document.getElementById("contact-avatar");
                if (avHidden) {
                    avHidden.src = resolveCallProfileImageUrl("");
                    avHidden.alt = "";
                }
                return;
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
                    displayName = `${contactData.firstName} ${contactData.lastName || ""
                        }`.trim();
                    updateContactUI(displayName, contactData, userId);
                } else if (contactData && contactData.mobile_number) {
                    // Use mobile number if available in contacts
                    displayName = contactData.mobile_number;
                    updateContactUI(displayName, contactData, userId);
                } else {
                    // Fallback: Fetch from the main "users" reference
                    const userRef = ref(database, `data/users/${userId}`);
                    get(userRef)
                        .then((userSnapshot) => {
                            const userData = userSnapshot.val();
                            if (userData && userData.mobile_number) {
                                displayName = userData.mobile_number;
                                updateContactUI(displayName, userData, userId);
                            } else {
                                updateContactUI("Unknown User", {}, userId);
                            }
                        })
                        .catch((error) => {
                            console.error("Error fetching user data:", error);
                            updateContactUI("Error Loading User", {}, userId);
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

    function setContactName(text) {
        const nameText = document.getElementById("contact-name-text");
        const nameEl = document.getElementById("contact-name");
        if (nameText) nameText.textContent = text;
        else if (nameEl) nameEl.textContent = text;
        const fullNameEl = document.getElementById("contact-full-name");
        if (fullNameEl) fullNameEl.textContent = text;
    }

    // Contact Info: same data path as #contact-details modal (firebaseContact.js): Firebase merge + Laravel public profile by email, username, or Firebase UID.
    function updateContactUI(displayName, userData, userIdForRef) {
        const contactKycBadges = document.querySelectorAll("#contact-profile .contact-kyc-badge");
        const socialVerifiedEls = document.querySelectorAll("#contact-profile .contact-social-verified");
        contactKycBadges.forEach((b) => {
            b.style.display = "none";
        });
        socialVerifiedEls.forEach((b) => {
            b.style.display = "none";
        });

        const uid =
            userIdForRef ||
            (userData && (userData.contact_id || userData.uid || userData.id)) ||
            "";
        const curUid = auth.currentUser?.uid;
        const initialName = String(displayName || "").trim();

        function normalizeExcludedList(v) {
            if (!v) return [];
            if (Array.isArray(v)) return v;
            if (typeof v === "object") return Object.keys(v).map((k) => v[k]).filter(Boolean);
            return [];
        }

        function formatJoinDateDisplay(v) {
            if (v == null || v === "") return "";
            const s = String(v).trim();
            if (/^\d+$/.test(s)) {
                const n = Number(s);
                if (!Number.isNaN(n) && n > 0) {
                    const d = new Date(n);
                    if (!Number.isNaN(d.getTime())) {
                        return d.toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        });
                    }
                }
            }
            const d = new Date(v);
            if (!Number.isNaN(d.getTime())) {
                return d.toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                });
            }
            return s;
        }

        function firstWebsiteFromFirebase(websites) {
            if (!websites) return "";
            if (Array.isArray(websites)) {
                const x = websites[0];
                return (x && (x.url || x)) || "";
            }
            if (typeof websites === "object") {
                const keys = Object.keys(websites).sort();
                for (let i = 0; i < keys.length; i++) {
                    const item = websites[keys[i]];
                    if (item && typeof item === "object" && item.url) return String(item.url);
                    if (typeof item === "string") return item;
                }
            }
            return "";
        }

        async function fetchPublicProfileLikeContactModal(uid, merged, contactData) {
            const em = String(merged.email || "").trim();
            const un = String(
                (contactData &&
                    (contactData.userName ||
                        contactData.username ||
                        contactData.user_name)) ||
                    merged.userName ||
                    merged.username ||
                    merged.user_name ||
                    merged.mobile_number ||
                    ""
            ).trim();
            try {
                if (em) {
                    const r = await fetch(
                        "/api/public-profile-by-email?email=" +
                            encodeURIComponent(em)
                    );
                    return await r.json();
                }
                if (un) {
                    const r = await fetch(
                        "/api/public-profile-by-username?username=" +
                            encodeURIComponent(un)
                    );
                    return await r.json();
                }
                if (uid) {
                    const r = await fetch(
                        "/api/public-profile-by-firebase-uid?uid=" +
                            encodeURIComponent(uid)
                    );
                    return await r.json();
                }
            } catch (e) {
                /* ignore */
            }
            return null;
        }

        function applySocialFromMerged(merged) {
            const fb = document.getElementById("facebook-link");
            const tw = document.getElementById("twitter-link");
            const ig = document.getElementById("instagram-link");
            const li = document.getElementById("linkedin-link");
            const hrefOrVoid = function (u) {
                const s = String(u || "").trim();
                return s || "javascript:void(0);";
            };
            if (fb)
                fb.href = hrefOrVoid(
                    merged.facebook_link || merged.facebook
                );
            if (tw)
                tw.href = hrefOrVoid(
                    merged.twitter_link || merged.twitter
                );
            if (ig)
                ig.href = hrefOrVoid(
                    merged.instagram_link || merged.instagram
                );
            if (li)
                li.href = hrefOrVoid(
                    merged.linkedin_link || merged.linkedin
                );
        }

        if (!uid) {
            setContactName(capitalizeFirstLetter(initialName || "Unknown User"));
            const m = userData && typeof userData === "object" ? userData : {};
            const bioEl = document.getElementById("contact-bio");
            const locEl = document.getElementById("contact-location");
            const webEl = document.getElementById("contact-website");
            const joinEl = document.getElementById("contact-join-date");
            if (bioEl) bioEl.textContent = m.about || m.bio || "—";
            if (locEl)
                locEl.textContent =
                    m.country || m.location || m.address || "—";
            if (webEl) {
                const w = m.website_url || m.website_link || m.website || "";
                const ws = String(w).trim();
                if (ws && /^https?:\/\//i.test(ws)) {
                    webEl.innerHTML =
                        '<a href="' +
                        ws +
                        '" target="_blank" rel="noopener">' +
                        ws +
                        "</a>";
                } else if (ws) {
                    webEl.innerHTML =
                        '<a href="https://' +
                        ws.replace(/^\/+/, "") +
                        '" target="_blank" rel="noopener">' +
                        ws +
                        "</a>";
                } else webEl.textContent = "—";
            }
            if (joinEl) {
                let j = "";
                if (m.timestamp)
                    try {
                        j = new Date(m.timestamp).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        });
                    } catch (e) { /* ignore */ }
                joinEl.textContent = j || "—";
            }
            applySocialFromMerged(m);
            const avatarElement = document.getElementById("contact-avatar");
            if (avatarElement) {
                avatarElement.src = resolveCallProfileImageUrl("");
                avatarElement.alt = initialName || "";
            }
            const lastSeenEl = document.getElementById("contact-last-seen");
            if (lastSeenEl) lastSeenEl.textContent = "";
            return;
        }

        Promise.all([
            get(ref(database, `data/users/${uid}`)).then((s) =>
                s.exists() ? s.val() : {}
            ),
            curUid
                ? get(ref(database, `data/contacts/${curUid}/${uid}`)).then((s) =>
                      s.exists() ? s.val() : null
                  )
                : Promise.resolve(null),
            get(ref(database, `data/users/${uid}/status`))
                .then((s) => (s.exists() ? s.val() : null))
                .catch(() => null),
            get(ref(database, `data/users/${uid}/lastSeen`))
                .then((s) => (s.exists() ? s.val() : null))
                .catch(() => null),
            curUid
                ? getExcludedLastSeenUsers(curUid).then(normalizeExcludedList)
                : Promise.resolve([]),
        ])
            .then(async ([firebaseUser, contactData, statusVal, lastSeenVal, excludedIds]) => {
                const merged = Object.assign({}, firebaseUser || {}, contactData || {});
                const pub = await fetchPublicProfileLikeContactModal(
                    uid,
                    merged,
                    contactData
                );

                const laravel = await resolveCallUserAvatarAndDisplayName(
                    uid,
                    firebaseUser || {},
                    contactData,
                    { includeLaravelDisplayName: true }
                );

                let finalName =
                    (pub && pub.profile_loaded && pub.display_name) ||
                    (laravel.displayName && String(laravel.displayName).trim()) ||
                    `${merged.firstName || merged.first_name || ""} ${merged.lastName || merged.last_name || ""}`.trim() ||
                    `${(contactData && contactData.firstName) || ""} ${(contactData && contactData.lastName) || ""}`.trim() ||
                    (merged.user_name && String(merged.user_name).trim()) ||
                    (merged.userName && String(merged.userName).trim()) ||
                    (merged.username && String(merged.username).trim()) ||
                    merged.mobile_number ||
                    initialName;
                if (isGarbageConcatenatedName(finalName)) finalName = initialName || merged.mobile_number || "";
                setContactName(
                    capitalizeFirstLetter(String(finalName || "Unknown User").trim())
                );

                const pubOk = pub && pub.profile_loaded;
                contactKycBadges.forEach((b) => {
                    b.style.display = pubOk && pub.kyc_verified ? "inline-flex" : "none";
                });
                socialVerifiedEls.forEach((b) => {
                    b.style.display = pubOk && pub.social_verified ? "inline-flex" : "none";
                });

                const defaultBio =
                    (contactData && (contactData.about || contactData.bio)) ||
                    (firebaseUser &&
                        (firebaseUser.about ||
                            firebaseUser.bio ||
                            firebaseUser.user_about)) ||
                    merged.about ||
                    merged.bio ||
                    merged.user_about ||
                    "";
                const defaultLoc =
                    (contactData &&
                        (contactData.location || contactData.country)) ||
                    (firebaseUser &&
                        (firebaseUser.country || firebaseUser.location)) ||
                    merged.location ||
                    merged.country ||
                    merged.address ||
                    "";
                const defaultSiteRaw =
                    firstWebsiteFromFirebase(
                        (firebaseUser && firebaseUser.websites) ||
                            (contactData && contactData.websites) ||
                            merged.websites
                    ) ||
                    merged.website_url ||
                    merged.website_link ||
                    merged.website ||
                    "";
                const defaultJoinRaw =
                    (firebaseUser &&
                        (firebaseUser.join_date ||
                            firebaseUser.created_at ||
                            firebaseUser.timestamp)) ||
                    (contactData &&
                        (contactData.join_date ||
                            contactData.created_at ||
                            contactData.timestamp)) ||
                    merged.join_date ||
                    merged.created_at ||
                    merged.timestamp ||
                    "";

                const bioEl = document.getElementById("contact-bio");
                const bio =
                    (pubOk && pub.bio && String(pub.bio).trim()) ||
                    String(defaultBio).trim() ||
                    "";
                if (bioEl) bioEl.textContent = bio || "—";

                const locEl = document.getElementById("contact-location");
                const loc =
                    (pubOk && pub.location && String(pub.location).trim()) ||
                    String(defaultLoc).trim() ||
                    "";
                if (locEl) locEl.textContent = loc || "—";

                const webEl = document.getElementById("contact-website");
                if (webEl) {
                    if (pubOk && pub.websites && pub.websites.length > 0) {
                        webEl.innerHTML = pub.websites
                            .map(function (w) {
                                return (
                                    '<a href="' +
                                    w.url +
                                    '" target="_blank" rel="noopener">' +
                                    w.url +
                                    "</a>"
                                );
                            })
                            .join(", ");
                    } else {
                        const ws = String(defaultSiteRaw).trim();
                        if (ws && /^https?:\/\//i.test(ws)) {
                            webEl.innerHTML =
                                '<a href="' +
                                ws +
                                '" target="_blank" rel="noopener">' +
                                ws +
                                "</a>";
                        } else if (ws) {
                            webEl.innerHTML =
                                '<a href="https://' +
                                ws.replace(/^\/+/, "") +
                                '" target="_blank" rel="noopener">' +
                                ws +
                                "</a>";
                        } else webEl.textContent = "—";
                    }
                }

                const joinEl = document.getElementById("contact-join-date");
                let joinStr =
                    pubOk && pub.join_date
                        ? String(pub.join_date).trim()
                        : "";
                if (!joinStr) {
                    joinStr = formatJoinDateDisplay(defaultJoinRaw);
                }
                if (joinEl) joinEl.textContent = joinStr || "—";

                const lastSeenEl = document.getElementById("contact-last-seen");
                if (lastSeenEl) {
                    lastSeenEl.classList.remove(
                        "text-success",
                        "text-danger",
                        "text-muted"
                    );
                    const hideLast = excludedIds.indexOf(uid) >= 0;
                    if (hideLast) {
                        lastSeenEl.textContent = "";
                    } else {
                        const st = String(statusVal || "offline").toLowerCase();
                        if (st === "online") {
                            lastSeenEl.textContent = "Online";
                            lastSeenEl.classList.add("text-success");
                        } else {
                            lastSeenEl.classList.add("text-muted");
                            let lsRaw = lastSeenVal;
                            if (
                                (lsRaw == null || lsRaw === "") &&
                                merged.lastSeen != null
                            ) {
                                lsRaw = merged.lastSeen;
                            }
                            if (
                                lsRaw != null &&
                                lsRaw !== "" &&
                                !Number.isNaN(Number(lsRaw))
                            ) {
                                const d = new Date(Number(lsRaw));
                                if (!Number.isNaN(d.getTime())) {
                                    lastSeenEl.textContent =
                                        "Last seen at " +
                                        d.toLocaleTimeString(undefined, {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            hour12: true,
                                        }) +
                                        " · " +
                                        d.toLocaleDateString(undefined, {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                        });
                                } else {
                                    lastSeenEl.textContent = "Offline";
                                    lastSeenEl.classList.add("text-danger");
                                }
                            } else {
                                lastSeenEl.textContent = "Offline";
                                lastSeenEl.classList.add("text-danger");
                            }
                        }
                    }
                }

                const fb = document.getElementById("facebook-link");
                const tw = document.getElementById("twitter-link");
                const ig = document.getElementById("instagram-link");
                const li = document.getElementById("linkedin-link");
                const sl = pub && pub.social_links;
                const hrefOrVoid = function (u) {
                    const s = String(u || "").trim();
                    return s || "javascript:void(0);";
                };
                if (sl) {
                    if (fb) fb.href = hrefOrVoid(sl.facebook);
                    if (tw) tw.href = hrefOrVoid(sl.twitter || sl.x);
                    if (ig) ig.href = hrefOrVoid(sl.instagram);
                    if (li) li.href = hrefOrVoid(sl.linkedin);
                } else {
                    applySocialFromMerged(merged);
                }

                const avatarElement = document.getElementById("contact-avatar");
                if (avatarElement) {
                    const url = await resolveCallUserAvatarUrl(
                        uid,
                        firebaseUser || {},
                        contactData
                    );
                    avatarElement.src = url;
                    avatarElement.alt = String(finalName || "").trim();
                }
            })
            .catch(() => {
                setContactName(
                    capitalizeFirstLetter(initialName || "Unknown User")
                );
            });
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
            .catch((error) => { });
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

        const commonWrap = document.getElementById("common-groups-container");
        const commonGroupsContainer = document.getElementById(
            "common-groups-list"
        );
        const commonHeading = document.getElementById("common-groups-heading");
        if (!commonGroupsContainer) {
            return [];
        }
        commonGroupsContainer.innerHTML = "";

        if (commonGroupIds.length === 0) {
            if (commonWrap) commonWrap.style.display = "none";
            return [];
        }
        if (commonWrap) commonWrap.style.display = "";
        if (commonHeading) {
            commonHeading.textContent = `Common in ${commonGroupIds.length} Groups`;
        }

        const commonGroups = [];

        commonGroupIds.forEach((groupId) => {
            const group = currentUserGroups.find((g) => g.groupId === groupId);
            if (group) {
                commonGroups.push(group);

                const groupItem = document.createElement("a");
                groupItem.classList.add(
                    "list-group-item",
                    "list-group-item-action",
                    "d-flex",
                    "align-items-center",
                    "justify-content-between",
                    "rounded-3",
                    "mb-2",
                    "common-group-row"
                );
                groupItem.href = "javascript:void(0);";
                groupItem.setAttribute("data-group-id", groupId);

                const initials = (group.name || "G")
                    .split(/\s+/)
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();
                const m = group.members;
                const preview =
                    Array.isArray(m) && m.length
                        ? `${m.length} ${m.length === 1 ? "member" : "members"}`
                        : "";

                groupItem.innerHTML = `
                        <div class="d-flex align-items-center gap-2 min-w-0 flex-grow-1">
                            <div class="common-group-avatar flex-shrink-0">${initials}</div>
                            <div class="chat-user-info min-w-0">
                                <h6 class="mb-0 text-truncate">${group.name || "Group"}</h6>
                                <p class="text-muted small mb-0 text-truncate">${preview}</p>
                            </div>
                        </div>
                        <span class="link-icon flex-shrink-0 ms-2"><i class="ti ti-chevron-right"></i></span>
                    `;

                commonGroupsContainer.appendChild(groupItem);
            }
        });

        const groupItems =
            commonGroupsContainer.querySelectorAll("[data-group-id]");
        groupItems.forEach((item) => {
            item.addEventListener("click", function () {
                const groupId = this.getAttribute("data-group-id");
                window.location.href = `/group-chat`;
            });
        });

        return commonGroups;
    }

    const clearChatBtn = document.getElementById("clearChatBtn");
    if (clearChatBtn) {
        clearChatBtn.addEventListener("click", function (event) {
            event.preventDefault(); // Prevent the default form submission
            clearChat(selectedUserId); // Pass the selectedUserId to clearChat
        });
    }

    function clearChat(selectedUserId) {
        applyClearedForEntireThread(selectedUserId)
            .then(() => {
                const chatBox = document.getElementById("chat-box");
                if (chatBox) {
                    chatBox.innerHTML = "";
                }

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

    const deleteChatBtn = document.getElementById("deleteChatBtn");
    if (deleteChatBtn) {
        deleteChatBtn.addEventListener("click", function (event) {
            event.preventDefault(); // Prevent the default form submission
            if (!selectedUserId) return;
            removeChatFromSidebarList(selectedUserId);
            const modal = document.getElementById("delete-user-chat");
            if (modal && typeof bootstrap !== "undefined" && bootstrap.Modal) {
                const modalInstance = bootstrap.Modal.getInstance(modal);
                modalInstance?.hide();
            }
        });
    }

    let otherblockUserId = "";
    let isUserInfoBlocked = false; // Track if the user is blocked

    // Get the block status from localStorage when the page loads
    isUserInfoBlocked = localStorage.getItem("isUserInfoBlocked") === "true";

    // Update the label based on the blocked status
    const blockUserLabel = document.getElementById("blockUserLabel");
    if (blockUserLabel) {
        if (isUserInfoBlocked) {
            blockUserLabel.innerHTML =
                '<i class="ti ti-user-check me-2 text-info"></i> Unblock User';
        } else {
            blockUserLabel.innerHTML =
                '<i class="ti ti-user-off me-2 text-info"></i> Block Users';
        }
    }

    // Event listener for dropdown button to open the correct modal
    const blockedUserDropdownBtn = document.getElementById("blockedUserDropdownBtn");
    if (blockedUserDropdownBtn) {
        blockedUserDropdownBtn.addEventListener("click", function (event) {
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
    }

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
                const el = document.getElementById("blockUserLabel");
                if (el)
                    el.innerHTML =
                        '<i class="ti ti-user-check me-2 text-info"></i> Unblock User';
                isUserInfoBlocked = true;
                localStorage.setItem("isUserInfoBlocked", "true");
                // Close the block modal explicitly
                const blockModal = bootstrap.Modal.getInstance(
                    document.getElementById("blocked-user")
                );
                if (blockModal) blockModal.hide();
            })
            .catch((error) => { });
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
                const el = document.getElementById("blockUserLabel");
                if (el)
                    el.innerHTML =
                        '<i class="ti ti-user-off me-2 text-info"></i> Block Users';
                isUserInfoBlocked = false;
                localStorage.setItem("isUserInfoBlocked", "false");
                // Close the unblock modal explicitly
                const unblockModal = bootstrap.Modal.getInstance(
                    document.getElementById("unblock-user")
                );
                if (unblockModal) unblockModal.hide();
            })
            .catch((error) => { });
    }

    // Event listener for 'Block' button
    function removeBackdrop() {
        const backdrop = document.querySelector(".modal-backdrop");
        if (backdrop) {
            backdrop.parentNode.removeChild(backdrop);
        }
    }

    // Call this function after hiding each modal
    const confirmBlockedUserBtn = document.getElementById("confirmBlockedUserBtn");
    if (confirmBlockedUserBtn) {
        confirmBlockedUserBtn.addEventListener("click", function () {
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
    }

    const confirmUnblockUserBtn = document.getElementById("confirmUnblockUserBtn");
    if (confirmUnblockUserBtn) {
        confirmUnblockUserBtn.addEventListener("click", function () {
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
    }

    function populateUsersMap() {
        const uid = auth.currentUser?.uid || currentUserId;
        fillUsersMapFromFirebase(uid || "")
            .then(() => {
                if (!uid) return;
                if (firebaseChatSidebarListenersAttached) return;
                firebaseChatSidebarListenersAttached = true;
                fetchArchivedChats(uid);
                fetchPinnedChats(uid);
                fetchFavouriteChats(uid);
                fetchTrashChats(uid);
            })
            .catch(() => { });
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
            scheduleRefreshChatFilterBadgeCounts();
            return;
        }

        for (const user of archivedUsers) {
            let senderName = ""; // Initialize sender name
            let profileImage = resolveCallProfileImageUrl("");

            // Reference to the contact and user tables
            const contactsRef = ref(
                database,
                `data/contacts/${currentUser.uid}/${user.userId}`
            );
            const userRef = ref(database, `data/users/${user.userId}`);

            try {
                let contactData = null;
                // Fetch contact and user data
                const contactSnapshot = await get(contactsRef);
                if (contactSnapshot.exists()) {
                    contactData = contactSnapshot.val();
                    const contactFirstName =
                        contactData.firstName || contactData.mobile_number;
                    const contactLastName = contactData.lastName || "";
                    senderName =
                        `${contactFirstName} ${contactLastName}`.trim();
                }

                const userSnapshot = await get(userRef);
                const userData = userSnapshot.exists()
                    ? userSnapshot.val()
                    : null;
                let raw = rawAvatarFromFirebaseAndContact(userData, contactData);
                if (
                    user.userId === currentUser.uid &&
                    typeof window !== "undefined" &&
                    window.LARAVEL_USER
                ) {
                    const lu =
                        window.LARAVEL_USER.profile_image ||
                        window.LARAVEL_USER.image;
                    if (lu && String(lu).trim()) raw = String(lu).trim();
                }
                profileImage = resolveCallProfileImageUrl(raw || "");

                if (userData && !senderName) {
                    const userFirstName = userData.mobile_number || "";
                    senderName = `${userFirstName}`;
                }
            } catch (error) { }

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
        scheduleRefreshChatFilterBadgeCounts();
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
            scheduleRefreshChatFilterBadgeCounts();
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
            let profileImage = resolveCallProfileImageUrl("");
            let contactData = null;

            // Fetch contact and user data
            get(contactsRef)
                .then((contactsSnapshot) => {
                    if (contactsSnapshot.exists()) {
                        contactData = contactsSnapshot.val();
                        const contactFirstName =
                            contactData.firstName || contactData.mobile_number;
                        const contactLastName = contactData.lastName || "";
                        senderName =
                            `${contactFirstName} ${contactLastName}`.trim();
                    }

                    return get(userRef);
                })
                .then((userSnapshot) => {
                    const userData = userSnapshot.exists()
                        ? userSnapshot.val()
                        : null;
                    let raw = rawAvatarFromFirebaseAndContact(
                        userData,
                        contactData
                    );
                    if (
                        user.userId === currentUser.uid &&
                        typeof window !== "undefined" &&
                        window.LARAVEL_USER
                    ) {
                        const lu =
                            window.LARAVEL_USER.profile_image ||
                            window.LARAVEL_USER.image;
                        if (lu && String(lu).trim()) raw = String(lu).trim();
                    }
                    profileImage = resolveCallProfileImageUrl(raw || "");

                    if (userData && !senderName) {
                        const userFirstName =
                            userData.firstName || userData.mobile_number;
                        senderName = `${userFirstName}`;
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
                    scheduleRefreshChatFilterBadgeCounts();
                })
                .catch((error) => { });
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
            (error) => { }
        );
    }

    // fetchFavouriteChats(currentUserId);

    function displayFavouriteUsers(usersMap, favouriteUsers) {
        // Get the sidebar element where users will be displayed
        const sidebarElement = document.getElementById("favourites-chats");
        if (!sidebarElement) return;

        // Clear the sidebar first to avoid duplication
        sidebarElement.innerHTML = "";

        if (favouriteUsers.length === 0) {
            sidebarElement.innerHTML =
                '<p class="px-3 py-2 text-muted small mb-0">No favourite chats yet.</p>';
            scheduleRefreshChatFilterBadgeCounts();
            return;
        }

        favouriteUsers.forEach((user) => {
            const userElement = document.createElement("div");
            userElement.classList.add("chat-users-wrap");
            userElement.innerHTML = `
            <div class="chat-list" data-user-id="${user.userId}">
                <a href="#" class="chat-user-list">
                    <div class="avatar avatar-lg me-2">
                        <img src="${resolveCallProfileImageUrl(
                    user.profileImage || ""
                )}" class="rounded-circle" alt="image" />
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
                <div class="chat-dropdown dropdown">
                    <a href="#" class="dropdown-toggle text-muted" data-bs-toggle="dropdown" aria-expanded="false">
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

            sidebarElement.appendChild(userElement);
            const favLink = userElement.querySelector(".chat-user-list");
            if (favLink) {
                favLink.onclick = (e) => {
                    e.preventDefault();
                    selectUser(user.userId);
                };
            }
        });
        scheduleRefreshChatFilterBadgeCounts();
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
            (error) => { }
        );
    }

    // fetchTrashChats(currentUserId);

    function displayTrashUsers(usersMap, trashUsers) {
        const sidebarElement = document.getElementById("trash-chats");
        if (!sidebarElement) return;

        sidebarElement.innerHTML = "";

        if (trashUsers.length === 0) {
            sidebarElement.innerHTML =
                '<p class="px-3 py-2 text-muted small mb-0">No chats in trash.</p>';
            scheduleRefreshChatFilterBadgeCounts();
            return;
        }

        trashUsers.forEach((user) => {
            const contactsRef = ref(
                database,
                `data/contacts/${currentUser.uid}/${user.userId}`
            );
            const userRef = ref(database, `data/users/${user.userId}`);
            let senderName = ""; // Initialize with an empty string
            let profileImage = resolveCallProfileImageUrl("");
            let contactData = null;

            // First, check if the sender is in the current user's contacts
            get(contactsRef)
                .then((contactsSnapshot) => {
                    if (contactsSnapshot.exists()) {
                        contactData = contactsSnapshot.val();
                        const contactFirstName = contactData.firstName || "";
                        const contactLastName = contactData.lastName || "";
                        senderName =
                            `${contactFirstName} ${contactLastName}`.trim(); // Combine first and last name
                    }

                    // Regardless of contact status, fetch the user data for profile image and fallback name
                    return get(userRef);
                })
                .then((userSnapshot) => {
                    const userData = userSnapshot.exists()
                        ? userSnapshot.val()
                        : null;
                    let raw = rawAvatarFromFirebaseAndContact(
                        userData,
                        contactData
                    );
                    if (
                        user.userId === currentUser.uid &&
                        typeof window !== "undefined" &&
                        window.LARAVEL_USER
                    ) {
                        const lu =
                            window.LARAVEL_USER.profile_image ||
                            window.LARAVEL_USER.image;
                        if (lu && String(lu).trim()) raw = String(lu).trim();
                    }
                    profileImage = resolveCallProfileImageUrl(raw || "");

                    if (userData && !senderName) {
                        const userFirstName = userData.firstName || "";
                        const userLastName = userData.lastName || "";
                        senderName =
                            `${userFirstName} ${userLastName}`.trim(); // Combine first and last name
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
                    scheduleRefreshChatFilterBadgeCounts();
                })
                .catch((error) => { });
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
            .catch((error) => { });
    }

    function resetChatShellToWelcome() {
        try {
            detachMediaPanelRoomListener();
        } catch (e) { /* ignore */ }
        try {
            if (typeof messageListener === "function" && messageListener) {
                messageListener();
            }
        } catch (e) { /* ignore */ }
        try {
            messageListener = null;
        } catch (e) { /* ignore */ }
        try {
            _chatInitialLoad = false;
            if (_chatInitialLoadTimer) clearTimeout(_chatInitialLoadTimer);
            const spinner = document.getElementById("chat-loading-spinner");
            if (spinner) spinner.classList.remove("active");
            const box = document.getElementById("chat-box");
            if (box) { box.innerHTML = ""; box.classList.remove("chat-loading-hidden", "chat-reveal"); }
        } catch (e) { /* ignore */ }
        try {
            highlightActiveUser("");
        } catch (e) { /* ignore */ }
        try {
            localStorage.removeItem("selectedUserId");
        } catch (e) { /* ignore */ }
        try {
            sessionStorage.removeItem(CHAT_ACTIVE_PEER_SESSION_KEY);
        } catch (e) { /* ignore */ }
        try {
            selectedUserId = null;
        } catch (e) { /* ignore */ }
        try {
            if (typeof history !== "undefined" && history.replaceState) {
                const u = new URL(window.location.href);
                u.searchParams.delete("user");
                history.replaceState({}, "", u.toString());
            }
        } catch (e) { /* ignore */ }
        const chatSection = document.getElementById("middle");
        const welcomeContainer = document.getElementById("welcome-container");
        if (chatSection) {
            chatSection.style.setProperty("display", "none", "important");
            chatSection.classList.remove("message-panel-visible");
        }
        if (document.body) document.body.setAttribute("data-chat-panel", "welcome");
        if (welcomeContainer) {
            welcomeContainer.style.setProperty("display", "flex", "important");
            welcomeContainer.style.setProperty("visibility", "visible", "important");
            welcomeContainer.style.setProperty("opacity", "1", "important");
        }
        if (typeof ensureChatPageVisible === "function") {
            ensureChatPageVisible();
        }
    }

    window.addEventListener("spa-logo-chat-home", function () {
        resetChatShellToWelcome();
    });

    const closeChatBtn = document.getElementById("close-chat-btn");
    if (closeChatBtn) {
        closeChatBtn.addEventListener("click", function (event) {
            event.preventDefault();
            resetChatShellToWelcome();
        });
    }

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
    document
        .querySelectorAll("#chat-menu #innerTab .dropdown-item")
        .forEach((item) => {
            item.addEventListener("click", function () {
                document
                    .querySelectorAll("#chat-menu #innerTab .dropdown-item")
                    .forEach((el) => el.classList.remove("active"));
                this.classList.add("active");
                const title = this.getAttribute("data-title");
                const chatTitleEl = document.getElementById("chatTitle");
                if (chatTitleEl) chatTitleEl.textContent = title;
                scheduleRefreshChatFilterBadgeCounts();
            });
        });

    const chatSidebarTabContent = document.querySelector(
        "#chat-menu #innerTabContent"
    );
    if (chatSidebarTabContent) {
        chatSidebarTabContent.addEventListener("shown.bs.tab", () => {
            scheduleRefreshChatFilterBadgeCounts();
        });
    }

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

    function closeAllReactionPickers() {
        document
            .querySelectorAll(".message-hover-actions.reaction-open")
            .forEach((el) => el.classList.remove("reaction-open"));
        document
            .querySelectorAll(".message-hover-actions.reaction-more-open")
            .forEach((el) => el.classList.remove("reaction-more-open"));
    }

    function ensureExtendedReactionPickerFilled(container) {
        if (!container || container.dataset.emojiFilled === "1") return;
        emojis.forEach((emoji) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "message-react-option";
            btn.setAttribute("data-reaction", emoji);
            btn.textContent = emoji;
            container.appendChild(btn);
        });
        container.dataset.emojiFilled = "1";
    }

    async function setMessageReaction(messageElement, reactionEmoji) {
        if (!currentUser?.uid || !selectedUserId || !messageElement) return;
        const messageKey = messageElement.dataset.messageKey;
        if (!messageKey) return;
        const chatRoomId = getDeterministicChatRoomId(
            currentUser.uid,
            selectedUserId
        );
        const { refPri, refMir } = getChatMessageRefsBothPaths(
            messageKey,
            chatRoomId,
            currentUser.uid,
            selectedUserId
        );
        const payload = {};
        payload[`reactions/${currentUser.uid}`] = reactionEmoji;
        await Promise.all([update(refPri, payload), update(refMir, payload)]);
    }

    function ensureChatEmojiListFilled(emojiList) {
        if (!emojiList || emojiList.dataset.emojiFilled === "1") return;
        emojis.forEach((emoji) => {
            const li = document.createElement("li");
            const emojiElement = document.createElement("a");
            emojiElement.href = "javascript:void(0);";
            emojiElement.classList.add("emoji");
            emojiElement.textContent = emoji;
            li.appendChild(emojiElement);
            emojiList.appendChild(li);
        });
        emojiList.dataset.emojiFilled = "1";
    }

    // Delegated handlers: chat footer may load later via SPA (/index → /chat), so direct
    // getElementById + addEventListener on first paint would miss #emoji-button.
    document.addEventListener("click", (e) => {
        const emojiToggle = e.target.closest("#emoji-button");
        if (emojiToggle) {
            e.preventDefault();
            const emojiPicker = document.getElementById("emoji-picker");
            const emojiList = document.getElementById("emoji-list");
            const inputField = document.getElementById("message-input");
            if (!emojiPicker || !emojiList || !inputField) return;
            ensureChatEmojiListFilled(emojiList);
            const isHidden =
                emojiPicker.style.display === "none" ||
                emojiPicker.style.display === "";
            emojiPicker.style.display = isHidden ? "block" : "none";
            return;
        }

        const emojiChoice = e.target.closest("#emoji-picker a.emoji");
        if (emojiChoice) {
            e.preventDefault();
            const inputField = document.getElementById("message-input");
            const emojiPicker = document.getElementById("emoji-picker");
            if (!inputField || !emojiPicker) return;
            inputField.value += emojiChoice.textContent;
            inputField.focus();
            inputField.selectionStart = inputField.selectionEnd =
                inputField.value.length;
            emojiPicker.style.display = "none";
            if (selectedUserId && currentUser && inputField.value.trim()) {
                pulseChatTyping(selectedUserId);
            }
            return;
        }

        const inlineEmojiBtn = e.target.closest(".hover-emoji-btn");
        if (inlineEmojiBtn) {
            e.preventDefault();
            const actionsWrap = inlineEmojiBtn.closest(".message-hover-actions");
            if (!actionsWrap) return;
            const willOpen = !actionsWrap.classList.contains("reaction-open");
            closeAllReactionPickers();
            if (willOpen) actionsWrap.classList.add("reaction-open");
            return;
        }

        const reactionChoice = e.target.closest(".message-react-option");
        if (reactionChoice) {
            e.preventDefault();
            const messageElement = reactionChoice.closest(".chats");
            if (!messageElement) return;
            const reactionEmoji = reactionChoice.getAttribute("data-reaction");
            if (!reactionEmoji) return;
            setMessageReaction(messageElement, reactionEmoji).catch((err) => {
                console.error("Error saving reaction:", err);
            });
            closeAllReactionPickers();
            return;
        }

        const reactionMoreBtn = e.target.closest(".message-react-more");
        if (reactionMoreBtn) {
            e.preventDefault();
            const actionsWrap = reactionMoreBtn.closest(".message-hover-actions");
            if (!actionsWrap) return;
            const extendedPicker = actionsWrap.querySelector(
                ".message-reaction-picker-extended"
            );
            if (!extendedPicker) return;
            ensureExtendedReactionPickerFilled(extendedPicker);
            actionsWrap.classList.add("reaction-open");
            actionsWrap.classList.toggle("reaction-more-open");
            return;
        }

        if (
            document.querySelector(".message-hover-actions.reaction-open") &&
            !e.target.closest(".message-hover-actions")
        ) {
            closeAllReactionPickers();
        }
    });

    // Voice: MediaRecorder (no ScriptProcessorNode / deprecated Recorder.js path for this modal)
    let mediaRecorder = null;
    let activeRecordStream = null;
    let recordedChunks = [];
    let lastVoiceBlob = null;
    let voicePreviewObjectUrl = null;
    let recordTimerId = null;
    let recordStartedAt = 0;
    const recordAudioEl = document.getElementById("audio");
    const recordTimerEl = document.getElementById("voice-record-timer");
    const startBtn = document.getElementById("startRecording");
    const stopBtn = document.getElementById("stopRecording");
    const send_voice = document.getElementById("send_voice");
    const recordModalEl = document.getElementById("record_audio");
    window.URL = window.URL || window.webkitURL;

    function pickVoiceMimeType() {
        const candidates = [
            "audio/webm;codecs=opus",
            "audio/webm",
            "audio/mp4",
        ];
        for (let i = 0; i < candidates.length; i++) {
            if (MediaRecorder.isTypeSupported(candidates[i])) {
                return candidates[i];
            }
        }
        return "";
    }

    function stopMediaTracks() {
        if (activeRecordStream) {
            activeRecordStream.getTracks().forEach((track) => track.stop());
            activeRecordStream = null;
        }
    }

    function formatRecSecs(sec) {
        const s = Math.max(0, Math.floor(sec));
        const m = Math.floor(s / 60);
        const r = s % 60;
        return `${m}:${r.toString().padStart(2, "0")}`;
    }

    function stopRecordTimer() {
        if (recordTimerId) {
            clearInterval(recordTimerId);
            recordTimerId = null;
        }
    }

    function updateRecordTimerDisplay() {
        if (recordTimerEl) {
            recordTimerEl.textContent = formatRecSecs(
                (Date.now() - recordStartedAt) / 1000
            );
        }
    }

    function revokeVoicePreviewUrl() {
        if (voicePreviewObjectUrl) {
            try {
                URL.revokeObjectURL(voicePreviewObjectUrl);
            } catch (e) {
                /* ignore */
            }
            voicePreviewObjectUrl = null;
        }
    }

    /** Chrome often reports duration 0/Infinity for MediaRecorder WebM blobs until seek forces metadata. */
    function primeVoicePreviewDuration(audioEl) {
        if (!audioEl) return;
        const fix = () => {
            audioEl.removeEventListener("loadedmetadata", fix);
            const d = audioEl.duration;
            if (isFinite(d) && d > 0 && d !== Infinity) {
                return;
            }
            const onSeeked = () => {
                audioEl.removeEventListener("seeked", onSeeked);
                try {
                    audioEl.currentTime = 0;
                } catch (e) {
                    /* ignore */
                }
            };
            audioEl.addEventListener("seeked", onSeeked);
            try {
                audioEl.currentTime = Number.MAX_SAFE_INTEGER;
            } catch (e) {
                audioEl.removeEventListener("seeked", onSeeked);
            }
        };
        audioEl.addEventListener("loadedmetadata", fix, { once: true });
    }

    function hideVoiceRecordModal() {
        if (!recordModalEl) return;
        const ae = document.activeElement;
        if (ae && recordModalEl.contains(ae)) {
            ae.blur();
        }
        if (typeof bootstrap !== "undefined" && bootstrap.Modal) {
            let inst = bootstrap.Modal.getInstance(recordModalEl);
            if (!inst && typeof bootstrap.Modal.getOrCreateInstance === "function") {
                inst = bootstrap.Modal.getOrCreateInstance(recordModalEl);
            }
            if (inst) inst.hide();
        } else if (window.jQuery && typeof window.jQuery.fn.modal === "function") {
            window.jQuery(recordModalEl).modal("hide");
        }
    }

    function onRecordFail(e) {
        alert("Error " + e);
        console.log("Rejected!", e);
    }

    if (recordModalEl) {
        recordModalEl.addEventListener("hidden.bs.modal", () => {
            stopRecordTimer();
            if (mediaRecorder && mediaRecorder.state !== "inactive") {
                try {
                    mediaRecorder.stop();
                } catch (e) { }
            }
            stopMediaTracks();
            mediaRecorder = null;
            recordedChunks = [];
            lastVoiceBlob = null;
            revokeVoicePreviewUrl();
            if (recordTimerEl) {
                recordTimerEl.style.display = "";
                recordTimerEl.textContent = "0:00";
            }
            if (recordAudioEl) recordAudioEl.removeAttribute("src");
            if (startBtn) startBtn.removeAttribute("disabled");
            if (stopBtn) stopBtn.setAttribute("disabled", true);
            if (send_voice) send_voice.setAttribute("disabled", true);
        });
    }

    if (stopBtn) {
        stopBtn.addEventListener("click", () => {
            if (!mediaRecorder || mediaRecorder.state === "inactive") return;
            stopRecordTimer();
            if (recordTimerEl) {
                recordTimerEl.textContent = formatRecSecs(
                    (Date.now() - recordStartedAt) / 1000
                );
            }
            stopBtn.setAttribute("disabled", true);
            if (startBtn) startBtn.removeAttribute("disabled");
            if (send_voice) send_voice.setAttribute("disabled", true);
            try {
                mediaRecorder.stop();
            } catch (e) {
                console.error(e);
                stopMediaTracks();
                mediaRecorder = null;
            }
        });
    }

    if (send_voice) {
        send_voice.addEventListener("click", async () => {
            if (!lastVoiceBlob || !lastVoiceBlob.size) {
                Toastify({
                    text: "Wait for recording to finish processing, then try again.",
                    duration: 4000,
                    gravity: "top",
                    position: "right",
                    backgroundColor: "#ff3d00",
                    stopOnFocus: true,
                }).showToast();
                return;
            }
            if (!selectedUserId) {
                Toastify({
                    text: "Select a chat before sending a voice message.",
                    duration: 4000,
                    gravity: "top",
                    position: "right",
                    backgroundColor: "#ff3d00",
                    stopOnFocus: true,
                }).showToast();
                return;
            }
            const blobType = lastVoiceBlob.type || "audio/webm";
            const ext = blobType.includes("webm")
                ? "webm"
                : blobType.includes("mp4") || blobType.includes("m4a")
                    ? "m4a"
                    : "webm";
            const blobFile = new File(
                [lastVoiceBlob],
                "voice-" + Date.now() + "." + ext,
                { type: blobType }
            );
            send_voice.setAttribute("disabled", true);
            try {
                await voiceupload(blobFile, "");
                lastVoiceBlob = null;
                revokeVoicePreviewUrl();
                hideVoiceRecordModal();
                if (recordAudioEl) recordAudioEl.removeAttribute("src");
                if (startBtn) startBtn.removeAttribute("disabled");
                if (stopBtn) stopBtn.setAttribute("disabled", true);
            } catch (err) {
                console.error("voiceupload", err);
                Toastify({
                    text: "Could not send voice message. Check connection and try again.",
                    duration: 4000,
                    gravity: "top",
                    position: "right",
                    backgroundColor: "#ff3d00",
                    stopOnFocus: true,
                }).showToast();
                if (send_voice) send_voice.removeAttribute("disabled");
            }
        });
    }

    if (startBtn) {
        startBtn.addEventListener("click", () => {
            if (typeof MediaRecorder === "undefined") {
                Toastify({
                    text: "Voice recording is not supported in this browser.",
                    duration: 4000,
                    gravity: "top",
                    position: "right",
                    backgroundColor: "#ff3d00",
                    stopOnFocus: true,
                }).showToast();
                return;
            }
            navigator.mediaDevices
                .getUserMedia({ audio: true })
                .then((stream) => {
                    lastVoiceBlob = null;
                    recordedChunks = [];
                    revokeVoicePreviewUrl();
                    if (recordAudioEl) recordAudioEl.removeAttribute("src");
                    if (recordTimerEl) {
                        recordTimerEl.style.display = "";
                        recordTimerEl.textContent = "0:00";
                    }
                    recordStartedAt = Date.now();
                    stopRecordTimer();
                    recordTimerId = setInterval(updateRecordTimerDisplay, 200);
                    activeRecordStream = stream;
                    startBtn.setAttribute("disabled", true);
                    if (send_voice) send_voice.setAttribute("disabled", true);
                    if (stopBtn) stopBtn.removeAttribute("disabled");
                    const mime = pickVoiceMimeType();
                    const mr = mime
                        ? new MediaRecorder(stream, { mimeType: mime })
                        : new MediaRecorder(stream);
                    mediaRecorder = mr;
                    mr.ondataavailable = (ev) => {
                        if (ev.data && ev.data.size > 0) {
                            recordedChunks.push(ev.data);
                        }
                    };
                    mr.onstop = () => {
                        stopMediaTracks();
                        const outType = mr.mimeType || mime || "audio/webm";
                        lastVoiceBlob = new Blob(recordedChunks, {
                            type: outType,
                        });
                        recordedChunks = [];
                        mediaRecorder = null;
                        if (recordAudioEl && lastVoiceBlob.size > 0) {
                            revokeVoicePreviewUrl();
                            voicePreviewObjectUrl = window.URL.createObjectURL(
                                lastVoiceBlob
                            );
                            recordAudioEl.preload = "metadata";
                            primeVoicePreviewDuration(recordAudioEl);
                            recordAudioEl.src = voicePreviewObjectUrl;
                            try {
                                recordAudioEl.load();
                            } catch (e) {
                                /* ignore */
                            }
                            if (recordTimerEl) {
                                recordTimerEl.style.display = "none";
                            }
                        }
                        if (send_voice && lastVoiceBlob.size > 0) {
                            send_voice.removeAttribute("disabled");
                        } else if (send_voice) {
                            send_voice.setAttribute("disabled", true);
                        }
                    };
                    mr.start(200);
                })
                .catch(onRecordFail);
        });
    }

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
        clearChatTyping();
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

    /** New Chat modal: same avatar fields as sidebar (profile_image on user + contact). */
    function displayContactsInModal(contactsByUserId) {
        const mainContainer = document.getElementById("main-container");
        if (!mainContainer) return;
        mainContainer.innerHTML = "";

        Object.keys(contactsByUserId).forEach((userId) => {
            const contactRow = contactsByUserId[userId] || {};

            const userListDiv = document.createElement("div");
            userListDiv.classList.add("contact-user");
            userListDiv.setAttribute("data-new-chat-peer", userId);

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
                selectUser(userId);
                const popup = document.querySelector("#new-chat");
                if (popup) {
                    $(popup).modal("hide");
                }
            };

            const userInnerDiv = document.createElement("div");
            userInnerDiv.classList.add("d-flex", "align-items-center");

            const userAvatarDiv = document.createElement("div");
            userAvatarDiv.classList.add("avatar", "avatar-lg");

            const userDetailsDiv = document.createElement("div");
            userDetailsDiv.classList.add("user-details", "ms-2");

            const onlineStatusDiv = document.createElement("div");
            onlineStatusDiv.classList.add("status-indicator", "offline");

            const usersRef = ref(database, "data/users/" + userId);
            onValue(usersRef, (snap) => {
                const userData = snap.val() || {};
                const raw = rawAvatarFromFirebaseAndContact(
                    userData,
                    contactRow
                );
                const resolved = resolveCallProfileImageUrl(raw);
                userAvatarDiv.innerHTML = "";
                const userAvatarImage = document.createElement("img");
                userAvatarImage.src = resolved;
                userAvatarImage.classList.add("rounded-circle");
                userAvatarImage.alt = "Image";
                userAvatarDiv.appendChild(userAvatarImage);

                onlineStatusDiv.classList.remove("online", "offline");
                if (userData.status === "online") {
                    onlineStatusDiv.classList.add("online");
                } else {
                    onlineStatusDiv.classList.add("offline");
                }
            });

            const contactsRef = ref(
                database,
                `data/contacts/${currentUser.uid}/${userId}`
            );
            onValue(contactsRef, (contactSnapshot) => {
                const contactData = contactSnapshot.val() || {};
                let displayName =
                    contactData.firstName || contactData.mobile_number || "Unknown";

                const userTitle = document.createElement("h6");
                userTitle.classList.add("user-title");

                if (contactData && contactData.firstName) {
                    displayName =
                        contactData.firstName +
                        " " +
                        (contactData.lastName || "");
                    userTitle.textContent = capitalizeFirstLetter(displayName);
                } else {
                    const userRef = ref(database, `data/users/${userId}`);
                    onValue(userRef, (userSnapshot) => {
                        const uData = userSnapshot.val() || {};
                        displayName = `${uData.firstName ||
                            contactData.mobile_number ||
                            ""
                            } ${uData.lastName || ""}`.trim();
                        userTitle.textContent =
                            capitalizeFirstLetter(displayName) || "Unknown";
                    });
                }

                userDetailsDiv.innerHTML = "";
                userDetailsDiv.appendChild(userTitle);
            });

            userInnerDiv.appendChild(userAvatarDiv);
            userInnerDiv.appendChild(userDetailsDiv);
            userInnerDiv.appendChild(onlineStatusDiv);

            userLinks.appendChild(userInnerDiv);
            userListDiv.appendChild(userLinks);
            mainContainer.appendChild(userListDiv);
        });
    }
    // Example of calling displayContactsInModal inside your modal
    const openNewChatModal = async () => {
        if (!currentUser || !currentUser.uid) {
            console.warn("New Chat: user not signed in yet.");
            return;
        }
        const mainContainer = document.getElementById("main-container");
        if (mainContainer) {
            mainContainer.innerHTML = '<div class="text-center py-3"><span class="spinner-border spinner-border-sm" role="status"></span> Loading contacts...</div>';
        }
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

                    displayContactsInModal(validContacts);
                    enrichNewChatModalAvatarsFromLaravel(
                        Object.keys(validContacts)
                    ).catch(() => {});
                } else {
                    if (mainContainer) mainContainer.innerHTML = "<p class=\"text-muted text-center py-3\">No users found.</p>";
                }
            } else {
                if (mainContainer) mainContainer.innerHTML = "<p class=\"text-muted text-center py-3\">No contacts yet. Use Invite Others to add contacts.</p>";
            }
        } catch (error) {
            console.error("Error fetching contacts or users:", error);
            if (mainContainer) mainContainer.innerHTML = "<p class=\"text-danger text-center py-3\">Failed to load contacts.</p>";
        }
    };

    // Load contacts when New Chat modal is shown (works for + button or any opener)
    const newChatModalEl = document.getElementById("new-chat");
    if (newChatModalEl && typeof bootstrap !== "undefined" && bootstrap.Modal) {
        newChatModalEl.addEventListener("show.bs.modal", function () {
            openNewChatModal();
        });
    }
    const newChatBtn = document.getElementById("newChatButton");
    if (newChatBtn) {
        newChatBtn.addEventListener("click", openNewChatModal);
    }

    // =================================================================
    // AGORA AUDIO CALL IMPLEMENTATION (REVISED)
    // =================================================================

    // Use Agora App ID from server (script.blade.php sets window.APP_ID from .env) or fallback
    const APP_ID = typeof window.APP_ID !== "undefined" && window.APP_ID ? window.APP_ID : "e368b7a2b5d84c34a1b31da838758a32";
    let audioClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    let localAudioTrack = null;
    let callTimerInterval = null;
    let currentCallId = null; // Keep track of the active call
    let lastAudioCallerDeclineToastId = null;

    // Firebase references
    const callRef = ref(database, 'data/calls');
    const usersRef = ref(database, 'data/users');

    function buildContactAvatarsRequestBody(userId, userData, contactData) {
        const body = { firebase_uids: [], emails: [], usernames: [] };
        if (userId && String(userId).indexOf("pending_") !== 0) body.firebase_uids.push(userId);
        if (contactData && contactData.email && String(contactData.email).trim()) {
            body.emails.push(String(contactData.email).trim().toLowerCase());
        }
        if (userData && userData.email && String(userData.email).trim()) {
            const em = String(userData.email).trim().toLowerCase();
            if (body.emails.indexOf(em) < 0) body.emails.push(em);
        }
        if (contactData && contactData.user_name && String(contactData.user_name).trim()) {
            body.usernames.push(String(contactData.user_name).trim());
        }
        const un = userData && (userData.userName || userData.username) ? String(userData.userName || userData.username).trim() : "";
        if (un && body.usernames.indexOf(un) < 0) body.usernames.push(un);
        return body;
    }

    function pickLaravelAvatarAndName(data, userId, body) {
        const bu = data.by_uid || {};
        const be = data.by_email || {};
        const buser = data.by_username || {};
        const nu = data.name_by_uid || {};
        const ne = data.name_by_email || {};
        const nuser = data.name_by_username || {};
        let avatar = "";
        let displayName = "";
        if (userId && bu[userId]) avatar = bu[userId];
        if (userId && nu[userId]) displayName = nu[userId];
        if (!avatar) {
            for (let i = 0; i < body.emails.length; i++) {
                if (be[body.emails[i]]) {
                    avatar = be[body.emails[i]];
                    break;
                }
            }
        }
        if (!displayName) {
            for (let i = 0; i < body.emails.length; i++) {
                if (ne[body.emails[i]]) {
                    displayName = ne[body.emails[i]];
                    break;
                }
            }
        }
        if (!avatar) {
            for (let j = 0; j < body.usernames.length; j++) {
                const k = String(body.usernames[j]).toLowerCase();
                if (buser[k]) {
                    avatar = buser[k];
                    break;
                }
            }
        }
        if (!displayName) {
            for (let j = 0; j < body.usernames.length; j++) {
                const k = String(body.usernames[j]).toLowerCase();
                if (nuser[k]) {
                    displayName = nuser[k];
                    break;
                }
            }
        }
        return {
            avatarUrl: avatar ? resolveCallProfileImageUrl(avatar) : "",
            displayName: String(displayName || "").trim(),
        };
    }

    async function resolveCallUserAvatarAndDisplayName(userId, userData, contactData, opts) {
        const needLaravelName = !!(opts && opts.includeLaravelDisplayName);
        const raw = rawAvatarFromFirebaseAndContact(userData, contactData);
        const fallback = resolveCallProfileImageUrl("");
        let imageUrl = raw ? resolveCallProfileImageUrl(raw) : "";
        let displayName = "";
        const body = buildContactAvatarsRequestBody(userId, userData, contactData);
        if (!body.firebase_uids.length && !body.emails.length && !body.usernames.length) {
            return { imageUrl: imageUrl || fallback, displayName };
        }
        const fetchForImage = !imageUrl;
        if (!fetchForImage && !needLaravelName) {
            return { imageUrl: imageUrl || fallback, displayName };
        }
        const token = typeof document !== "undefined" && document.querySelector('meta[name="csrf-token"]') ? document.querySelector('meta[name="csrf-token"]').getAttribute("content") : "";
        const origin = typeof window !== "undefined" && window.location && window.location.origin ? window.location.origin : "";
        if (!token || !origin) return { imageUrl: imageUrl || fallback, displayName };
        try {
            const r = await fetch(origin + "/api/users/contact-avatars", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "X-CSRF-TOKEN": token,
                    "X-Requested-With": "XMLHttpRequest",
                },
                body: JSON.stringify(body),
            });
            if (!r.ok) return { imageUrl: imageUrl || fallback, displayName };
            const data = await r.json();
            const picked = pickLaravelAvatarAndName(data, userId, body);
            if (!imageUrl && picked.avatarUrl) imageUrl = picked.avatarUrl;
            if (picked.displayName) displayName = picked.displayName;
        } catch (err) { /* ignore */ }
        return { imageUrl: imageUrl || fallback, displayName };
    }

    async function resolveCallUserAvatarUrl(userId, userData, contactData) {
        const { imageUrl } = await resolveCallUserAvatarAndDisplayName(userId, userData, contactData, null);
        return imageUrl;
    }

    function isGarbageConcatenatedName(s) {
        const t = String(s || "").trim();
        if (!t) return true;
        const parts = t.split(/\s+/).filter(Boolean);
        return parts.length > 0 && parts.every((p) => p === "undefined");
    }

    /** When Firebase user/contact lack name fields, chat list still has display name in usersMap. */
    function callDisplayNameFromUsersMap(userId, nameSoFar) {
        let cur = String(nameSoFar || "").trim();
        if (isGarbageConcatenatedName(cur)) cur = "";
        if (cur && cur !== "Unknown User") return cur;
        if (typeof usersMap === "undefined" || !userId || !usersMap[userId]) return cur || "Unknown User";
        let fromMap = String(usersMap[userId].userName || "").trim();
        if (isGarbageConcatenatedName(fromMap)) fromMap = "";
        if (fromMap && fromMap !== "Unknown User") return fromMap;
        return cur || "Unknown User";
    }

    /** Incoming call ring: Settings → Notifications → Notification Sound (`notification_sound` in localStorage). */
    let incomingCallRingAudio = null;
    let incomingCallRingActiveId = null;

    function isNotificationRingSoundEnabled() {
        try {
            if (localStorage.getItem("notification_sound") === "1") return true;
            if (localStorage.getItem("NotificationSound") === "enabled") return true;
            return false;
        } catch (e) {
            return false;
        }
    }

    function stopIncomingCallRing() {
        incomingCallRingActiveId = null;
        if (incomingCallRingAudio) {
            try {
                incomingCallRingAudio.pause();
                incomingCallRingAudio.currentTime = 0;
            } catch (e) {}
        }
    }

    function ensureIncomingCallRing(callId) {
        if (!callId || !isNotificationRingSoundEnabled()) {
            stopIncomingCallRing();
            return;
        }
        if (incomingCallRingActiveId === callId) return;
        stopIncomingCallRing();
        incomingCallRingActiveId = callId;
        if (!incomingCallRingAudio) {
            incomingCallRingAudio = new Audio("assets/sounds/notification_sound.mp3");
            incomingCallRingAudio.loop = true;
        }
        incomingCallRingAudio.play().catch(() => {});
    }

    if (typeof window !== "undefined") {
        window.__dreamchatIncomingCallRing = {
            ensure: ensureIncomingCallRing,
            stop: stopIncomingCallRing,
        };
    }

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
            const callerData = callerSnapshot.val() || {};
            const receiverData = receiverSnapshot.val() || {};

            let callerName = '';
            let callerImg = callerData.image || 'assets/img/profiles/avatar-03.jpg';
            if (callerData.firstName != null || callerData.lastName != null) {
                callerName = `${callerData.firstName || ''} ${callerData.lastName || ''}`.trim() || "Unknown User";
            } else {
                const receiverContactSnap = await get(ref(database, `data/contacts/${receiverId}/${callerId}`));
                const receiverContact = receiverContactSnap.exists() ? receiverContactSnap.val() : null;
                if (receiverContact && (receiverContact.firstName != null || receiverContact.lastName != null)) {
                    callerName = `${receiverContact.firstName || ''} ${receiverContact.lastName || ''}`.trim() || "Unknown User";
                    if (receiverContact.image) callerImg = receiverContact.image;
                } else {
                    callerName = (receiverContact && (receiverContact.username || receiverContact.userName || receiverContact.mobile_number)) || callerData.username || callerData.userName || callerData.mobile_number || '';
                    callerName = String(callerName || '').trim() || "Unknown User";
                }
            }
            let receiverName = '';
            if (receiverData.firstName != null || receiverData.lastName != null) {
                receiverName = `${receiverData.firstName || ''} ${receiverData.lastName || ''}`.trim() || "Unknown User";
            } else {
                const callerContactSnap = await get(ref(database, `data/contacts/${callerId}/${receiverId}`));
                const callerContact = callerContactSnap.exists() ? callerContactSnap.val() : null;
                if (callerContact && (callerContact.firstName != null || callerContact.lastName != null)) {
                    receiverName = `${callerContact.firstName || ''} ${callerContact.lastName || ''}`.trim() || "Unknown User";
                } else {
                    receiverName = (callerContact && (callerContact.username || callerContact.userName || callerContact.mobile_number)) || receiverData.username || receiverData.userName || receiverData.mobile_number || '';
                    receiverName = String(receiverName || '').trim() || "Unknown User";
                }
            }
            callerName = callDisplayNameFromUsersMap(callerId, callerName);
            receiverName = callDisplayNameFromUsersMap(receiverId, receiverName);
            const callerMobile = callerData.mobile_number || callerId;
            const receiverMobile = receiverData.mobile_number || receiverId;

            const callData = {
                callerId: [receiverId],
                callerImg: callerImg,
                callerName: callerName,
                receiverName: receiverName,
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

            // Caller hanging up while still ringing = cancel, not "declined by callee"
            const finalDuration =
                callData.inOrOut === "OUT" && callData.duration === "Ringing"
                    ? "Cancelled"
                    : "Declined";

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
            let audioToken = null;
            try {
                audioToken = await generateAgoraToken(channelName, uid);
            } catch (e) { /* use null on server errors */ }
            await audioClient.join(APP_ID, channelName, audioToken || null, uid);
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

        } catch (error) {
            console.error("Agora Join Error:", error);
        }
    }

    function cleanUpLocalState() {
        stopIncomingCallRing();
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

        const joinAudioReset = document.getElementById('join-audio-call');
        if (joinAudioReset) {
            // Keep join hidden during cleanup to avoid green+red flash while modal is closing.
            joinAudioReset.classList.add('d-none');
            joinAudioReset.classList.remove('d-flex');
            joinAudioReset.style.removeProperty('display');
        }

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
        if (timerDisplay) timerDisplay.textContent = "00:00:00";
        if (loadingDisplay) loadingDisplay.style.display = 'none';
        if (timerDisplay) timerDisplay.style.display = 'block';

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

    async function updateModalUserDetails(userId, callRecordName) {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        // Get the other user's details
        const otherUserSnapshot = await get(child(usersRef, userId));
        // Get current user's details
        const currentUserSnapshot = await get(child(usersRef, currentUser.uid));

        const contactSnap = await get(ref(database, `data/contacts/${currentUser.uid}/${userId}`));
        const contactDataForOther = contactSnap.exists() ? contactSnap.val() : null;

        if (otherUserSnapshot.exists()) {
            const userData = otherUserSnapshot.val();
            let userName = '';
            if (userData.firstName != null || userData.lastName != null) {
                userName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Unknown User';
            } else if (contactDataForOther && (contactDataForOther.firstName != null || contactDataForOther.lastName != null)) {
                userName = `${contactDataForOther.firstName || ''} ${contactDataForOther.lastName || ''}`.trim() || 'Unknown User';
            } else {
                userName = (userData.username || userData.userName || userData.mobile_number || '').trim() || 'Unknown User';
            }
            if ((!userName || userName === 'Unknown User') && callRecordName && String(callRecordName).trim()) {
                userName = String(callRecordName).trim();
            }
            userName = callDisplayNameFromUsersMap(userId, userName);
            const needLaravelName = !userName || userName === "Unknown User" || isGarbageConcatenatedName(userName);
            const { imageUrl: userImage, displayName: laravelDisplayName } = await resolveCallUserAvatarAndDisplayName(userId, userData, contactDataForOther, { includeLaravelDisplayName: needLaravelName });
            if (needLaravelName && laravelDisplayName) userName = laravelDisplayName;

            // Update audio call modal (incoming call screen)
            $('.audio-name').text(userName);
            $('.avatar-audio img').attr('src', userImage);

            // Update voice attend modal (active call screen)
            $('.new-name h6').first().text(userName);
            $('.avatar-new-audio img').attr('src', userImage);
            $('.avatar-new-audio-big img').attr('src', userImage);
        } else if (contactDataForOther || callRecordName) {
            let userName = (callRecordName && String(callRecordName).trim()) || (contactDataForOther && `${contactDataForOther.firstName || ''} ${contactDataForOther.lastName || ''}`.trim()) || 'Unknown User';
            userName = callDisplayNameFromUsersMap(userId, userName);
            const needLaravelName2 = !userName || userName === "Unknown User" || isGarbageConcatenatedName(userName);
            const { imageUrl: userImage, displayName: laravelN2 } = await resolveCallUserAvatarAndDisplayName(userId, {}, contactDataForOther, { includeLaravelDisplayName: needLaravelName2 });
            if (needLaravelName2 && laravelN2) userName = laravelN2;
            $('.audio-name').text(userName);
            $('.avatar-audio img').attr('src', userImage);
            $('.new-name h6').first().text(userName);
            $('.avatar-new-audio img').attr('src', userImage);
            $('.avatar-new-audio-big img').attr('src', userImage);
        }

        if (currentUserSnapshot.exists()) {
            const currentUserData = currentUserSnapshot.val();
            const currentUserImage = resolveCallProfileImageUrl(rawAvatarFromFirebaseAndContact(currentUserData, null));

            // Update current user's image in voice attend modal
            $('.current-image img').attr('src', currentUserImage);
        }
    }

    async function sendCallNotification(toId, phone, title, channelName, fromId, callerName) {
        try {
            const snapshot = await get(ref(database, `data/users/${toId}/deviceToken`));
            if (!snapshot.exists() || !snapshot.val()) {
                // No FCM token (e.g. web-only callee) — call still signals via data/calls
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

    function notifyOutgoingCallDeclined() {
        Toastify({
            text: "The user declined your call. They may be busy or unavailable.",
            duration: 4500,
            gravity: "top",
            position: "right",
            backgroundColor: "#f59e0b",
        }).showToast();
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
        let userAudioCallTotal = 0;
        let userAudioRingingCount = 0;
        let userAudioConnectedCount = 0;

        if (allCalls[currentUser.uid]) {
            for (const callId in allCalls[currentUser.uid]) {
                const call = allCalls[currentUser.uid][callId];
                if (call && call.video == false) {
                    userAudioCallTotal++;
                    if (call.duration === "Ringing") userAudioRingingCount++;
                    if (call.duration === "00:00:00") userAudioConnectedCount++;
                }

                if (
                    call.duration === "Declined" ||
                    call.duration === "Ended" ||
                    call.duration === "Cancelled"
                ) {
                    continue;
                }

                if (call.video == false) {
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
            stopIncomingCallRing();
            currentCallId = activeCall.id;
            if (!localAudioTrack) {
                // Determine who is the other participant
                const otherUserId = activeCall.userId === currentUser.uid
                    ? activeCall.callerId[0]
                    : activeCall.userId;
                const activeCallName = activeCall.callerName;
                updateModalUserDetails(otherUserId, activeCallName);
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
            const nameFromCall = ringingCall.inOrOut === 'IN' ? ringingCall.callerName : (ringingCall.receiverName || undefined);
            updateModalUserDetails(otherUserId, nameFromCall);
            $('#voice-attend-new').modal('hide');
            
            // Outgoing: red end only. Incoming: green answer + red decline.
            // jQuery .hide() loses to Bootstrap .d-flex { display:flex !important } on the same element.
            const joinAudioEl = document.getElementById('join-audio-call');
            if (ringingCall.inOrOut === 'OUT') {
                stopIncomingCallRing();
                if (joinAudioEl) {
                    joinAudioEl.classList.add('d-none');
                    joinAudioEl.classList.remove('d-flex');
                }
                $('#audio-call-modal .modal-title').text('Calling...');
            } else {
                if (joinAudioEl) {
                    joinAudioEl.classList.remove('d-none');
                    joinAudioEl.classList.add('d-flex');
                    joinAudioEl.style.removeProperty('display');
                }
                $('#audio-call-modal .modal-title').text('Incoming Audio Call...');
            }
            
            $('#audio-call-modal').modal('show');
            if (ringingCall.inOrOut === 'IN') {
                ensureIncomingCallRing(ringingCall.id);
            }
        }
        else if (currentCallId) {
            const myCallRow = allCalls[currentUser.uid] && allCalls[currentUser.uid][currentCallId];
            if (
                myCallRow &&
                myCallRow.video == false &&
                myCallRow.duration === "Declined" &&
                myCallRow.inOrOut === "OUT" &&
                lastAudioCallerDeclineToastId !== currentCallId
            ) {
                lastAudioCallerDeclineToastId = currentCallId;
                notifyOutgoingCallDeclined();
            }
            cleanUpLocalState();
        }
    });

    // =================================================================
    // AGORA VIDEO CALL IMPLEMENTATION (REVISED)
    // =================================================================

    const VIDEO_APP_ID = typeof window.APP_ID !== "undefined" && window.APP_ID ? window.APP_ID : "e368b7a2b5d84c34a1b31da838758a32"; // Same as APP_ID from .env when using Agora
    let videoClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    let localVideoTrack = null;
    let localAudioTrackForVideo = null;
    let videoCallTimerInterval = null;
    let currentVideoCallId = null;
    let lastVideoCallerDeclineToastId = null;

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
            const callerData = callerSnapshot.val() || {};
            const receiverData = receiverSnapshot.val() || {};

            let callerName = '';
            let callerImg = callerData.image || 'assets/img/profiles/avatar-03.jpg';
            if (callerData.firstName != null || callerData.lastName != null) {
                callerName = `${callerData.firstName || ''} ${callerData.lastName || ''}`.trim() || "Unknown User";
            } else {
                const receiverContactSnap = await get(ref(database, `data/contacts/${receiverId}/${callerId}`));
                const receiverContact = receiverContactSnap.exists() ? receiverContactSnap.val() : null;
                if (receiverContact && (receiverContact.firstName != null || receiverContact.lastName != null)) {
                    callerName = `${receiverContact.firstName || ''} ${receiverContact.lastName || ''}`.trim() || "Unknown User";
                    if (receiverContact.image) callerImg = receiverContact.image;
                } else {
                    callerName = (receiverContact && (receiverContact.username || receiverContact.userName || receiverContact.mobile_number)) || callerData.username || callerData.userName || callerData.mobile_number || '';
                    callerName = String(callerName || '').trim() || "Unknown User";
                }
            }
            let receiverName = '';
            if (receiverData.firstName != null || receiverData.lastName != null) {
                receiverName = `${receiverData.firstName || ''} ${receiverData.lastName || ''}`.trim() || "Unknown User";
            } else {
                const callerContactSnap = await get(ref(database, `data/contacts/${callerId}/${receiverId}`));
                const callerContact = callerContactSnap.exists() ? callerContactSnap.val() : null;
                if (callerContact && (callerContact.firstName != null || callerContact.lastName != null)) {
                    receiverName = `${callerContact.firstName || ''} ${callerContact.lastName || ''}`.trim() || "Unknown User";
                } else {
                    receiverName = (callerContact && (callerContact.username || callerContact.userName || callerContact.mobile_number)) || receiverData.username || receiverData.userName || receiverData.mobile_number || '';
                    receiverName = String(receiverName || '').trim() || "Unknown User";
                }
            }
            callerName = callDisplayNameFromUsersMap(callerId, callerName);
            receiverName = callDisplayNameFromUsersMap(receiverId, receiverName);

            const callData = {
                callerId: [receiverId], // The other person in the call
                callerImg: callerImg,
                callerName: callerName,
                receiverName: receiverName,
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

        const currentUser = auth.currentUser;
        const callSnapshot = await get(ref(database, `data/calls/${currentUser.uid}/${currentVideoCallId}`));
        if (!callSnapshot.exists()) {
            cleanUpVideoLocalState(); // Clean up if call record is already gone
            return;
        }

        const callData = callSnapshot.val();
        const otherUserId = callData.callerId[0];

        let finalDuration;
        if (status === "Declined") {
            finalDuration =
                callData.inOrOut === "OUT" && callData.duration === "Ringing"
                    ? "Cancelled"
                    : "Declined";
        } else {
            finalDuration = stopVideoCallTimer();
        }

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
            // Replace "Ringing..." with "00:00:00" as soon as we start joining (caller sees call connected)
            $('#start-video-call-container #local-call-timer, #start-video-call-container #video-call-timer-display').text('00:00:00');
            const lt = document.getElementById('local-call-timer');
            const ht = document.getElementById('video-call-timer-display');
            if (lt) lt.textContent = '00:00:00';
            if (ht) ht.textContent = '00:00:00';

            // Register listeners BEFORE join so we never miss user-published for users already in the channel.
            videoClient.off("user-published", handleUserPublished);
            videoClient.off("user-unpublished", handleUserUnpublished);
            videoClient.off("user-joined");
            videoClient.off("user-left");

            videoClient.on("user-published", handleUserPublished);
            videoClient.on("user-unpublished", handleUserUnpublished);
            videoClient.on("user-left", (user) => {
                console.log(`Video user ${user.uid} left the channel ${channelName}`);
                if (window.agoraVideoUsers && window.agoraVideoUsers[user.uid]) {
                    delete window.agoraVideoUsers[user.uid];
                }
            });

            let videoToken = null;
            try {
                videoToken = await generateAgoraToken(channelName, uid);
            } catch (e) { /* use null on server errors (e.g. localhost without cert) */ }
            await videoClient.join(VIDEO_APP_ID, channelName, videoToken || null, uid);

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

            // Second participant may already be publishing when we finish join; subscribe to anyone already present.
            try {
                for (const remoteUser of videoClient.remoteUsers) {
                    if (!window.agoraVideoUsers) window.agoraVideoUsers = {};
                    window.agoraVideoUsers[remoteUser.uid] = {
                        uid: remoteUser.uid,
                        channelName: channelName,
                        appId: VIDEO_APP_ID,
                        joinedAt: Date.now()
                    };
                    if (remoteUser.hasAudio && !remoteUser.audioTrack) {
                        await videoClient.subscribe(remoteUser, "audio");
                    }
                    if (remoteUser.hasVideo && !remoteUser.videoTrack) {
                        await videoClient.subscribe(remoteUser, "video");
                    }
                    if (remoteUser.audioTrack || remoteUser.videoTrack) {
                        handleVideoUserDisplay(remoteUser);
                    }
                }
            } catch (syncErr) {
                console.error("Video remote user sync after join:", syncErr);
            }

            // Manual subscription check every few seconds for video calls
            const videoManualSubscriptionInterval = setInterval(async () => {
                try {
                    const remoteUsers = videoClient.remoteUsers;
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
            const userData = userSnapshot.exists() ? userSnapshot.val() : {};
            const currentUser = auth.currentUser;
            const contactSnap = currentUser ? await get(ref(database, `data/contacts/${currentUser.uid}/${userId}`)) : { exists: () => false };
            const contactDataForImg = contactSnap.exists() ? contactSnap.val() : null;

            let userName = '';
            if (userData.firstName != null || userData.lastName != null) {
                userName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'User';
            } else if (contactDataForImg && (contactDataForImg.firstName != null || contactDataForImg.lastName != null)) {
                userName = `${contactDataForImg.firstName || ''} ${contactDataForImg.lastName || ''}`.trim() || 'User';
            } else {
                userName = (userData.username || userData.userName || userData.mobile_number || '').trim() || 'User';
            }

            const avatarUrl = await resolveCallUserAvatarUrl(userId, userData, contactDataForImg);
            // Update the header of the active call modal
            const nameEl = document.querySelector('#start-video-call-container .user-video-head .user-name');
            if (nameEl) nameEl.textContent = userName;
            const userImgElement = document.querySelector('#start-video-call-container .user-video-head .avatar-video img');
            if (userImgElement) {
                userImgElement.src = avatarUrl;
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
            const userData = userSnapshot.exists() ? userSnapshot.val() : {};
            const currentUser = auth.currentUser;
            const contactSnap = currentUser ? await get(ref(database, `data/contacts/${currentUser.uid}/${userId}`)) : { exists: () => false };
            const contactDataImg = contactSnap.exists() ? contactSnap.val() : null;

            let userName = '';
            if (userData.firstName != null || userData.lastName != null) {
                userName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'User';
            } else if (contactDataImg && (contactDataImg.firstName != null || contactDataImg.lastName != null)) {
                userName = `${contactDataImg.firstName || ''} ${contactDataImg.lastName || ''}`.trim() || 'User';
            } else {
                userName = (userData.username || userData.userName || userData.mobile_number || '').trim() || 'User';
            }
            const userImage = await resolveCallUserAvatarUrl(userId, userData, contactDataImg);

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
        stopIncomingCallRing();
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

        const remotePlayerList = document.getElementById("remote-playerlist");
        if (remotePlayerList) remotePlayerList.innerHTML = "";

        const localPlayerContainer = document.getElementById('video-container');
        if (localPlayerContainer) localPlayerContainer.innerHTML = ''; // Clear local view

        $('#start-video-call-container').modal('hide');
        $('#video-call').modal('hide');

        const joinVideoRingBtn = document.getElementById('join-video-call');
        if (joinVideoRingBtn) {
            // Keep join hidden during cleanup to avoid green+red flash while modal is closing.
            joinVideoRingBtn.classList.add('d-none');
            joinVideoRingBtn.classList.remove('d-flex');
            joinVideoRingBtn.style.removeProperty('display');
        }
        const ringStatus = document.getElementById('video-call-ring-status');
        if (ringStatus) ringStatus.textContent = '';

        const videoRingModal = document.getElementById('video-call');
        if (videoRingModal) videoRingModal.classList.remove('video-call-ring-outgoing');

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


    // <-- FIX: Use same name resolution as audio (user → contact → callRecord) so receiver sees caller name
    async function updateRingingModalDetails(callData) {
        const otherUserId = callData.callerId[0];
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        try {
            const contactSnap = await get(ref(database, `data/contacts/${currentUser.uid}/${otherUserId}`));
            const contactData = contactSnap.exists() ? contactSnap.val() : null;
            const otherUserSnapshot = await get(child(usersRef, otherUserId));
            const userData = otherUserSnapshot.exists() ? otherUserSnapshot.val() : {};

            let userName = '';
            if (userData.firstName != null || userData.lastName != null) {
                userName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Unknown User';
            } else if (contactData && (contactData.firstName != null || contactData.lastName != null)) {
                userName = `${contactData.firstName || ''} ${contactData.lastName || ''}`.trim() || 'Unknown User';
            } else {
                userName = (userData.username || userData.userName || userData.mobile_number || '').trim() || 'Unknown User';
            }
            if ((!userName || userName === 'Unknown User') && callData.callerName && String(callData.callerName).trim()) {
                userName = String(callData.callerName).trim();
            }
            userName = callDisplayNameFromUsersMap(otherUserId, userName);
            const needVidName = !userName || userName === "Unknown User" || isGarbageConcatenatedName(userName);
            const { imageUrl: userImage, displayName: laravelVid } = await resolveCallUserAvatarAndDisplayName(otherUserId, userData, contactData, { includeLaravelDisplayName: needVidName });
            if (needVidName && laravelVid) userName = laravelVid;

            const modal = $('#video-call');
            modal.removeClass('video-call-ring-outgoing');
            modal.find('#video-call-ring-title').text('Incoming video call');
            modal.find('.video-call-ring-name').text(userName);
            modal.find('.video-call-ring-avatar').attr('src', userImage).attr('alt', userName);
            const statusEl = document.getElementById('video-call-ring-status');
            if (statusEl) statusEl.textContent = '';
            const joinBtn = document.getElementById('join-video-call');
            if (joinBtn) {
                joinBtn.classList.remove('d-none');
                joinBtn.style.removeProperty('display');
            }
        } catch (error) {
            console.error('Error updating video modal details:', error);
        }
    }


    async function sendVideoCallNotification(toId, fromName, title, channelName, callerName) {
        try {
            const snapshot = await get(ref(database, `data/users/${toId}/deviceToken`));
            if (!snapshot.exists() || !snapshot.val()) {
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
     * Simple outgoing ring UI (same shell as incoming): callee avatar, red cancel only.
     * Full Agora UI opens in #start-video-call-container after the callee answers.
     */
    async function showOutgoingCallUI(callData) {
        const otherUserId = callData.callerId[0];

        try {
            const currentUser = auth.currentUser;
            const contactSnap = currentUser ? await get(ref(database, `data/contacts/${currentUser.uid}/${otherUserId}`)) : { exists: () => false };
            const contactDataVideo = contactSnap.exists() ? contactSnap.val() : null;
            const otherUserSnapshot = await get(child(usersRef, otherUserId));
            const userData = otherUserSnapshot.exists() ? otherUserSnapshot.val() : {};

            let userName = '';
            if (userData.firstName != null || userData.lastName != null) {
                userName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Unknown User';
            } else if (contactDataVideo && (contactDataVideo.firstName != null || contactDataVideo.lastName != null)) {
                userName = `${contactDataVideo.firstName || ''} ${contactDataVideo.lastName || ''}`.trim() || 'Unknown User';
            } else {
                userName = (userData.username || userData.userName || userData.mobile_number || '').trim() || 'Unknown User';
            }
            if ((!userName || userName === 'Unknown User') && callData.receiverName && String(callData.receiverName).trim()) {
                userName = String(callData.receiverName).trim();
            }
            userName = callDisplayNameFromUsersMap(otherUserId, userName);
            const needVidOut = !userName || userName === "Unknown User" || isGarbageConcatenatedName(userName);
            const { imageUrl: userImage, displayName: laravelVidOut } = await resolveCallUserAvatarAndDisplayName(otherUserId, userData, contactDataVideo, { includeLaravelDisplayName: needVidOut });
            if (needVidOut && laravelVidOut) userName = laravelVidOut;

            const modal = $('#video-call');
            modal.addClass('video-call-ring-outgoing');
            modal.find('#video-call-ring-title').text(`Calling ${userName}…`);
            modal.find('.video-call-ring-name').text('');
            modal.find('.video-call-ring-avatar').attr('src', userImage).attr('alt', userName);
            const statusEl = document.getElementById('video-call-ring-status');
            if (statusEl) statusEl.textContent = 'Ringing…';

            const joinBtn = document.getElementById('join-video-call');
            if (joinBtn) joinBtn.classList.add('d-none');

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
                stopIncomingCallRing();
                // Sender (caller) fix: update UI from "Ringing..." to "00:00:00" immediately when we receive accepted state,
                // so the caller sees the call was picked up even before joinAgoraVideoChannel completes.
                if (callToProcess.inOrOut === "OUT") {
                    function setCallTimerToConnected() {
                        const videoModal = $('#start-video-call-container');
                        videoModal.find('#local-call-timer').text('00:00:00');
                        videoModal.find('#video-call-timer-display').text('00:00:00');
                        const t = document.getElementById('local-call-timer');
                        const h = document.getElementById('video-call-timer-display');
                        if (t) t.textContent = '00:00:00';
                        if (h) h.textContent = '00:00:00';
                    }
                    setCallTimerToConnected();
                    setTimeout(setCallTimerToConnected, 0);
                }
                // Join the channel if we are not already connected.
                const willJoin = !localVideoTrack && videoClient.connectionState !== 'CONNECTED';
                if (willJoin) {
                    updateRemoteUserDetails(otherUserId); // Pre-populate remote user details
                    joinAgoraVideoChannel(callToProcess.channelName, currentUser.uid);
                }
            }
            // --- STATE 2: Call is Ringing ---
            else if (callToProcess.duration === "Ringing") {
                // If it's an INCOMING call for me, show the ringing modal.
                if (callToProcess.inOrOut === "IN") {
                    if (!$('#video-call').is(':visible')) {
                        updateRingingModalDetails(callToProcess);
                        $('#video-call').modal('show');
                    }
                    ensureIncomingCallRing(callToProcess.id);
                }
                // If it's an OUTGOING call I started, show the "calling..." screen.
                else if (callToProcess.inOrOut === "OUT" && !$('#video-call').is(':visible')) {
                    stopIncomingCallRing();
                    showOutgoingCallUI(callToProcess);
                }
            }
        } else {
            // --- STATE 3: No Active Call Found ---
            // No call is "Ringing" or has the "00:00:00" trigger.
            // This means the call was ended (duration is now a timestamp like "00:02:15") or declined.
            // If we previously had a `currentVideoCallId`, it's time to clean up.
            if (currentVideoCallId && userCalls && userCalls[currentVideoCallId]) {
                const row = userCalls[currentVideoCallId];
                if (
                    row.video &&
                    row.duration === "Declined" &&
                    row.inOrOut === "OUT" &&
                    lastVideoCallerDeclineToastId !== currentVideoCallId
                ) {
                    lastVideoCallerDeclineToastId = currentVideoCallId;
                    notifyOutgoingCallDeclined();
                }
            }
            if (currentVideoCallId) {
                cleanUpVideoLocalState();
            }
        }
    });

    // Ensure welcome panel is visible on all SPA pages when no chat is selected
    function ensureChatPageVisible() {
        const path = (window.location.pathname || "").replace(/\/+$/, "") || "/";
        let welcomeEl = document.getElementById("welcome-container");
        const middleEl = document.getElementById("middle");
        const spaContent = document.getElementById("spa-page-content");
        const urlPeer = new URLSearchParams(window.location.search || "").get("user");
        const hasSelectedUser = !!(urlPeer || selectedUserId);
        if (spaContent) {
            spaContent.style.setProperty("display", "flex", "important");
            spaContent.style.setProperty("visibility", "visible", "important");
            if (typeof window !== "undefined" && window.innerWidth >= 1200) {
                spaContent.style.removeProperty("min-height");
            } else {
                spaContent.style.setProperty("min-height", "200px", "important");
            }
        }

        if (!welcomeEl && spaContent && !hasSelectedUser) {
            const base = (typeof window !== "undefined" && window.location && window.location.origin) ? window.location.origin : "";
            const welcomeHtml = '<div id="welcome-container" class="welcome-content d-flex align-items-center justify-content-center" style="display:flex!important;visibility:visible!important;min-height:200px;flex:1;width:100%;"><div class="welcome-info text-center"><div class="welcome-box bg-white d-inline-flex align-items-center gap-2"><span class="avatar avatar-md flex-shrink-0"><img id="profileImageChat" src="' + base + '/assets/img/profiles/avatar-03.jpg" alt="img" class="rounded-circle"></span><h6 class="title mb-0">Welcome! <span id="profile-info-chat-name">Loading...</span></h6></div><p class="mt-3 mb-4">Choose a person or group to start chat with them.</p><a href="javascript:void(0);" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#add-contact"><i class="ti ti-send me-2"></i>Invite Contacts</a></div></div>';
            const wrap = document.createElement("div");
            wrap.innerHTML = welcomeHtml.trim();
            const first = wrap.firstChild;
            if (spaContent.firstChild) spaContent.insertBefore(first, spaContent.firstChild);
            else spaContent.appendChild(first);
            welcomeEl = document.getElementById("welcome-container");
            if (typeof window.syncLaravelUserProfileImages === "function") {
                window.syncLaravelUserProfileImages();
            }
        }

        if (welcomeEl) {
            welcomeEl.style.setProperty("display", hasSelectedUser ? "none" : "flex", "important");
            welcomeEl.style.setProperty("visibility", hasSelectedUser ? "hidden" : "visible", "important");
            welcomeEl.style.setProperty("opacity", hasSelectedUser ? "0" : "1", "important");
            welcomeEl.style.setProperty("min-height", hasSelectedUser ? "0" : "200px", "important");
        }
        if (middleEl) {
            middleEl.style.setProperty("display", hasSelectedUser ? "flex" : "none", "important");
            if (hasSelectedUser) middleEl.classList.add("message-panel-visible");
            else middleEl.classList.remove("message-panel-visible");
        }

        if (typeof document !== "undefined" && document.body) {
            document.body.setAttribute("data-chat-panel", hasSelectedUser ? "visible" : "welcome");
        }
        if (
            !hasSelectedUser &&
            typeof window.syncLaravelUserProfileImages === "function"
        ) {
            window.syncLaravelUserProfileImages();
        }
        if (auth.currentUser && !hasSelectedUser) fetchUsers();
    }

    function guardWelcomeVisible() {
        const gUrl = new URLSearchParams(window.location.search || "").get("user");
        if (gUrl || selectedUserId) return;
        const welcomeEl = document.getElementById("welcome-container");
        if (!welcomeEl) return;
        const computed = window.getComputedStyle(welcomeEl);
        if (computed.display === "none" || computed.visibility === "hidden") {
            welcomeEl.style.setProperty("display", "flex", "important");
            welcomeEl.style.setProperty("visibility", "visible", "important");
            welcomeEl.style.setProperty("opacity", "1", "important");
        }
    }
    window.addEventListener("spa-page-applied", function (e) {
        [0, 50, 150, 400, 800].forEach(function (ms) { setTimeout(ensureChatPageVisible, ms); });
        var guardCount = 0;
        var guardInterval = setInterval(function () {
            guardWelcomeVisible();
            guardCount++;
            if (guardCount >= 50) clearInterval(guardInterval);
        }, 200);
    });
    var initialPath = (window.location.pathname || "").replace(/\/+$/, "") || "/";
    {
        [100, 200, 500, 800, 1200, 2000, 3000, 4000].forEach(function (ms) { setTimeout(ensureChatPageVisible, ms); });
        var guardCount = 0;
        var guardInterval = setInterval(function () {
            guardWelcomeVisible();
            guardCount++;
            if (guardCount >= 50) clearInterval(guardInterval);
        }, 200);
    }

});
