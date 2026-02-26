import { initializeFirebase } from "./firebase-user.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
    getDatabase,
    ref,
    push,
    onValue,
    get,
    child,
    set,
    remove,
    serverTimestamp,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import {
    getStorage,
    ref as storageRef,
    uploadBytes,
    getDownloadURL,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

initializeFirebase(function (app, auth, database, storage) {
    // Get the current user ID (this happens when the user is authenticated)
    let loggeduserId;

    onAuthStateChanged(auth, (user) => {
        if (user) {
            loggeduserId = user.uid;
            fetchStatuses();
        } else {
            window.location.href = "/login";
        }
    });

    let uploadedFiles = [];
    let message = ""; // Store the latest message

    let currentReplyingStatusInfo = {
        statusId: null,
        statusUrl: null
    };

    // Handle File Upload and Preview
    async function handleFileUpload(event) {
        const files = event.target.files; // Get selected files

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileStorageRef = storageRef(
                storage,
                `status/${loggeduserId}/${file.name}`
            );

            // Upload file to Firebase Storage
            await uploadBytes(fileStorageRef, file);

            // Get the file's URL
            const fileUrl = await getDownloadURL(fileStorageRef);

            // Store the file URL
            uploadedFiles.push(fileUrl);
        }

        // Show preview in the next modal
        const previewContainer = document.getElementById("previewContainer");
        previewContainer.innerHTML = ""; // Clear previous previews
        uploadedFiles.forEach((fileUrl) => {
            const img = document.createElement("img");
            img.src = fileUrl;
            img.alt = "Uploaded Image";
            img.style.width = "100px"; // Adjust image size
            img.style.margin = "5px";
            previewContainer.appendChild(img);
        });

        // Reset file input to allow re-selecting the same files if needed
        event.target.value = "";
    }

    /**
     * Saves a new status update to the Firebase Realtime Database.
     * Each status is saved as a new object with a unique ID under the current user's node.
     */
    async function saveStatus() {
        const message = document.getElementById("statuscontent").value; // Get the status text.
        const fileUrl = uploadedFiles[0]; // Get the URL of the first uploaded file.
        const userStatusListRef = ref(database, `data/status/${loggeduserId}`);

        const newStatusRef = push(userStatusListRef);

        const statusId = newStatusRef.key;

        // Create the new status data object with the required structure.
        const newStatusData = {
            id: statusId,
            attachmentType: 2, // As requested, '2' for image/video status
            message: message,
            uploadTime: Date.now(), // The current timestamp
            url: fileUrl,
        };

        try {
            // Save the new status object to the unique location in the database.
            await set(newStatusRef, newStatusData);

            // Show a success notification
            Toastify({
                text: "Status uploaded successfully!",
                duration: 3000,
                gravity: "top",
                position: "right",
                backgroundColor: "#28a745",
            }).showToast();

            // Close the Bootstrap modal
            const modalElement = document.querySelector("#upload-file-image");
            if (modalElement) {
                const modalInstance = bootstrap.Modal.getInstance(modalElement);
                if (modalInstance) {
                    modalInstance.hide();
                }
            }

            // Clear inputs and reset the state for the next upload
            document.getElementById("statuscontent").value = "";
            document.getElementById("fileInput").value = "";
            const previewContainer =
                document.getElementById("previewContainer");
            if (previewContainer) {
                previewContainer.innerHTML = ""; // Clear the image preview
            }
            uploadedFiles = [];
        } catch (error) {
            console.error("Failed to save status:", error);
            Toastify({
                text: "Failed to upload status. Please try again.",
                duration: 3000,
                gravity: "top",
                position: "right",
                backgroundColor: "red",
            }).showToast();
        }
    }

    // Event Listeners
    document
        .getElementById("fileInput")
        .addEventListener("change", handleFileUpload);
    document.getElementById("sendStatus").addEventListener("click", saveStatus);

    //view status
    let isUserListRendered = false; // State variable to track if user list has been rendered

    // Modified fetchStatuses to check already seen statuses on page load
    async function fetchStatuses() {
        // 1. Calculate the timestamp for 24 hours ago
        const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);

        const statusesRef = ref(database, "data/status");
        const statusesSnapshot = await get(statusesRef);
        const allStatuses = statusesSnapshot.val();

        if (!allStatuses) {
            renderStatusList(null); // Render with no statuses
            return;
        }

        // 2. Filter the statuses on the client-side
        const recentStatuses = {};

        // Loop through each user who has statuses
        for (const userId in allStatuses) {
            const userStatuses = allStatuses[userId];
            const recentUserStatuses = {};
            let hasRecent = false;

            // Loop through each status of that user
            for (const statusId in userStatuses) {
                const status = userStatuses[statusId];
                // Check if the status was uploaded within the last 24 hours
                if (status.uploadTime >= twentyFourHoursAgo) {
                    recentUserStatuses[statusId] = status;
                    hasRecent = true;
                }
            }

            // Only add the user to our final list if they have recent statuses
            if (hasRecent) {
                recentStatuses[userId] = recentUserStatuses;
            }
        }

        // 3. Render the list using only the filtered, recent statuses
        renderStatusList(recentStatuses);
    }

    async function renderStatusList(statuses) {
        if (!statuses) {
            document.querySelector("#myStatusList").innerHTML =
                '<div>Add your status</div>';
            document.querySelector("#recentUpdatesList").innerHTML =
                '<div>No recent status</div>';
            document.querySelector("#alreadySeenList").innerHTML =
                '<div>No viewed status</div>';
            return;
        }

        const myStatusContainer = document.querySelector("#myStatusList");
        const recentUpdatesContainer =
            document.querySelector("#recentUpdatesList");
        const alreadySeenContainer = document.querySelector("#alreadySeenList");
        const userDetailsContainer = document.querySelector(
            ".user-details-status"
        );

        const groupedStatuses = {};
        for (const userId in statuses) {
            const userStatusCollection = statuses[userId];
            groupedStatuses[userId] = {
                userId: userId,
                userName: "Unknown User",
                userImage: "assets/img/profiles/avatar-03.jpg",
                statuses: [],
                lastStatusTime: 0,
                allSeen: true,
            };
            for (const statusId in userStatusCollection) {
                const status = userStatusCollection[statusId];
                groupedStatuses[userId].statuses.push(status);
                if (
                    status.uploadTime > groupedStatuses[userId].lastStatusTime
                ) {
                    groupedStatuses[userId].lastStatusTime = status.uploadTime;
                }
                const hasViewed = status.viewedBy?.some(
                    (viewer) => viewer.userId === loggeduserId
                );
                if (!hasViewed && userId !== loggeduserId) {
                    groupedStatuses[userId].allSeen = false;
                }
            }
        }

        const userIds = Object.keys(groupedStatuses);
        const userDetailsPromises = userIds.map(async (userId) => {
            const group = groupedStatuses[userId];
            const userRef = ref(database, `data/users/${userId}`);
            const userSnap = await get(userRef);
            if (userSnap.exists()) {
                const userData = userSnap.val();
                group.userImage =
                    userData.image ||
                    "assets/img/profiles/avatar-03.jpg";
            }
            const contactRef = ref(
                database,
                `data/contacts/${loggeduserId}/${userId}`
            );
            const contactSnap = await get(contactRef);
            if (contactSnap.exists()) {
                const contactData = contactSnap.val();
                group.userName =
                    `${contactData.firstName || ""} ${contactData.lastName || ""
                        }`.trim() || contactData.mobile_number;
            } else if (userSnap.exists()) {
                const userData = userSnap.val();
                group.userName =
                    `${userData.firstName || ""} ${userData.lastName || ""
                        }`.trim() || userData.mobile_number;
            }
        });
        await Promise.all(userDetailsPromises);

        myStatusContainer.innerHTML = "";
        recentUpdatesContainer.innerHTML = "";
        alreadySeenContainer.innerHTML = "";
        let recentCount = 0;
        let seenCount = 0;

        const sortedGroups = Object.values(groupedStatuses).sort(
            (a, b) => b.lastStatusTime - a.lastStatusTime
        );

        for (const userGroup of sortedGroups) {
            if (userGroup.statuses.length === 0) continue;

            // Use moment.js if you have it, otherwise use a simpler format
            const statusTime = moment(userGroup.lastStatusTime).fromNow();

            const statusHTML = `
                <div class="position-relative">
                    <a href="javascript:void(0)" class="chat-user-list" data-user-id="${userGroup.userId
                }">
                        <div class="story-avatar avatar avatar-lg">
                            <img src="${userGroup.userImage
                }" class="rounded-circle" alt="image">
                        </div>
                        <div class="chat-user-info">
                            <h6 class="ms-2">${userGroup.userName}</h6>
                            <br><p>${statusTime}</p>
                        </div>
                    </a>
                    ${userGroup.userId === loggeduserId
                    ? `
                    <div class="chats-dropdown">
                        <a href="#" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="ti ti-dots-vertical"></i>
                        </a>
                        <ul class="dropdown-menu dropdown-menu-end p-2">
                            <li><a class="dropdown-item delete-status" href="#" data-user-id="${userGroup.userId}"><i class="ti ti-trash me-2"></i>Delete All</a></li>
                        </ul>
                    </div>`
                    : ""
                }
                </div>`;

            if (userGroup.userId === loggeduserId) {
                myStatusContainer.innerHTML += statusHTML;
            } else if (userGroup.allSeen) {
                alreadySeenContainer.innerHTML += statusHTML;
                seenCount++;
            } else {
                recentUpdatesContainer.innerHTML += statusHTML;
                recentCount++;
            }
        }

        if (myStatusContainer.innerHTML === "")
            myStatusContainer.innerHTML =
                '<div>Add your status</div>';
        if (recentCount === 0)
            recentUpdatesContainer.innerHTML =
                '<div>No recent status.</div>';
        if (seenCount === 0)
            alreadySeenContainer.innerHTML =
                '<div>No viewed status.</div>';

        // --- Re-bind Event Listeners ---
        document.querySelectorAll(".chat-user-list").forEach((item) => {
            item.addEventListener("click", function () {
                const userId = this.getAttribute("data-user-id");
                const userGroup = groupedStatuses[userId];
                if (userGroup) {
                    // Pass the whole group to the function
                    showUserStatus(userGroup);
                }
            });
        });

        document.querySelectorAll(".delete-status").forEach((button) => {
            button.addEventListener("click", async function (event) {
                event.preventDefault();
                const userId = this.getAttribute("data-user-id");
                if (
                    confirm(
                        "Are you sure you want to delete all your statuses?"
                    )
                ) {
                    const userStatusRef = ref(
                        database,
                        `data/status/${userId}`
                    );
                    await remove(userStatusRef);
                    fetchStatuses(); // Refresh the list
                }
            });
        });
    }

    // Function to delete all statuses for a specific user from Firebase
    async function deleteAllStatusesForUser(userId) {
        console.log("Starting deletion...");
        const statusesRef = ref(database, "data/status");
        try {
            // Get all statuses from the database
            const snapshot = await get(statusesRef);

            if (snapshot.exists()) {
                const statuses = snapshot.val();

                // Filter status IDs where the statusId matches the userId
                const userStatusesIds = Object.keys(statuses).filter(
                    (statusId) => statusId === userId
                );

                // Loop through the matching status IDs and delete them
                for (const statusId of userStatusesIds) {
                    const statusRef = ref(database, `data/status/${statusId}`);
                    await remove(statusRef);
                    location.reload();
                }
            } else {
            }
        } catch (error) {
            console.error("Error deleting statuses:", error);
        }
    }

    let selectedUserId = null; // Variable to hold the selected user ID

    async function showUserStatus(userGroup) {
        const { userId, statuses, userName, userImage } = userGroup;

        // Call the function to display the statuses in the carousel
        updateCarousel(statuses, userName, userImage);

        // This is where you would hide the main view and show the story viewer view
        document.getElementById("welcome-container").style.setProperty("display", "none", "important");
        document.querySelector('.user-stories-box').style.display = 'block';

        // Mark statuses as viewed in the background
        const updatePromises = [];
        for (const status of statuses) {
            const alreadyViewed = status.viewedBy?.some(viewer => viewer.userId === loggeduserId);
            if (!alreadyViewed && userId !== loggeduserId) {
                updatePromises.push(markSpecificStatusAsViewed(userId, status.id));
            }
            selectedUserId = userId;
        }

        if (updatePromises.length > 0) {
            await Promise.all(updatePromises);
            await fetchStatuses(); // Refresh the main list to move the ring to "Viewed"
        }
    }

    async function markSpecificStatusAsViewed(statusOwnerId, statusId) {
        const viewedByRef = ref(database, `data/status/${statusOwnerId}/${statusId}/viewedBy`);
        try {
            const snapshot = await get(viewedByRef);
            const currentViewers = snapshot.val() || [];
            if (!currentViewers.some(viewer => viewer.userId === loggeduserId)) {
                currentViewers.push({
                    userId: loggeduserId,
                    viewedTime: serverTimestamp()
                });
                await set(viewedByRef, currentViewers);
            }
        } catch (error) {
            console.error(`Failed to mark status ${statusId} as viewed:`, error);
        }
    }

    async function refreshStatusLists() {
        const statusesRef = ref(database, "data/status");
        const readedStatusRef = ref(database, "data/readed_status");
        const contactsRef = ref(database, `data/contacts/${loggeduserId}`);

        try {
            // Fetch the latest statuses, read statuses, and contacts
            const [statusesSnapshot, readedStatusSnapshot, contactsSnapshot] =
                await Promise.all([
                    get(statusesRef),
                    get(readedStatusRef),
                    get(contactsRef),
                ]);

            const statuses = statusesSnapshot.val();
            const readedStatuses = readedStatusSnapshot.val();
            const contacts = contactsSnapshot.val();

            if (!contacts) {
                console.warn("No contacts found for the logged-in user.");
                return;
            }

            // Extract user IDs from contacts
            const contactUserIds = Object.keys(contacts);

            // Categorize and render the lists
            const recentUpdates = [];
            const alreadySeen = [];

            Object.entries(statuses).forEach(([userId, status]) => {
                // Skip statuses not in the contact list
                if (!contactUserIds.includes(userId)) return;

                const statusKey = `${loggeduserId}_${userId}`;
                if (readedStatuses && readedStatuses[statusKey]) {
                    // Status is already seen
                    alreadySeen.push({ userId, ...status });
                } else {
                    // Status is recent
                    recentUpdates.push({ userId, ...status });
                }
            });

            // Update the UI with the categorized lists
            updateRecentUpdatesList(recentUpdates);
            updateAlreadySeenList(alreadySeen);
        } catch (error) {
            console.error("Error refreshing status lists:", error);
        }
    }

    function updateRecentUpdatesList(recentUpdates) {
        const recentUpdatesContainer =
            document.getElementById("recentUpdatesList");
        recentUpdatesContainer.innerHTML = ""; // Clear previous content

        if (recentUpdates.length > 0) {
            recentUpdates.forEach(async (update) => {
                const listItem = await createStatusHTML(update); // Ensure it returns a Node
                if (listItem instanceof Node) {
                    recentUpdatesContainer.appendChild(listItem);
                } else {
                    console.error(
                        "Invalid list item for Recent Updates:",
                        update
                    );
                }
            });
        } else {
            recentUpdatesContainer.innerHTML = "<p>No Recent Updates</p>";
        }
    }

    function updateAlreadySeenList(alreadySeen) {
        const alreadySeenContainer = document.getElementById("alreadySeenList");
        alreadySeenContainer.innerHTML = ""; // Clear previous content

        if (alreadySeen.length > 0) {
            alreadySeen.forEach(async (update) => {
                const listItem = await createStatusHTML(update); // Ensure it returns a Node
                if (listItem instanceof Node) {
                    alreadySeenContainer.appendChild(listItem);
                } else {
                    console.error(
                        "Invalid list item for Already Seen:",
                        update
                    );
                }
            });
        } else {
            alreadySeenContainer.innerHTML = "<p>No Already Seen Updates</p>";
        }
    }

    // Create HTML for a status entry
    async function createStatusHTML(status) {
        const listItem = document.createElement("div");
        listItem.className = "chat-user";

        let userName = "Unknown User";
        if (status.userId === loggeduserId) {
            // If it's the logged-in user's status, display "My Status"
            userName = "My Status";
        } else {
            try {
                // Fetch user details from contacts
                const contactRef = ref(
                    database,
                    `data/contacts/${loggeduserId}/${status.userId}`
                );
                const contactSnapshot = await get(contactRef);
                if (contactSnapshot.exists()) {
                    const contactData = contactSnapshot.val();
                    const contactFirstName = contactData?.firstName || "";
                    const contactLastName = contactData?.lastName || "";
                    if (contactFirstName || contactLastName) {
                        userName =
                            `${contactFirstName} ${contactLastName}`.trim();
                    } else {
                        userName = `${contactData?.mobile_number}`;
                    }
                }
            } catch (error) {
                console.error("Error fetching contact data:", error);
            }
        }

        // Safeguard against empty or missing files
        const fileUrl =
            status.files && status.files.length > 0
                ? status.files[0]
                : "default_image_url_here";
        const statusTime = new Date(status.timestamp).toLocaleString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: undefined, // Exclude seconds
            hour12: true, // Optional: Set to false for 24-hour format
        });
        // Construct the list item
        listItem.innerHTML = `
        <div class="avatar avatar-lg me-2">
            <img src="${fileUrl}" class="rounded-circle" alt="image">
        </div>
        <div class="user-online">
            <h5>${userName}</h5>
            <span>${statusTime}</span>
        </div>
    `;

        // Add click event listener
        listItem.addEventListener("click", () => showUserStatus(status.userId));

        return listItem;
    }
    async function markStatusAsRead(loggedUserId, viewedUserId) {
        const readedStatusRef = ref(database, "data/readed_status");
        const statusKey = `${loggedUserId}_${viewedUserId}`;

        // Mark as read if not already done
        const readedStatusSnapshot = await get(
            child(readedStatusRef, statusKey)
        );
        if (!readedStatusSnapshot.exists()) {
            await set(child(readedStatusRef, statusKey), {
                loggedUserId,
                viewedUserId,
                timestamp: Date.now(),
            });
            refreshStatusLists(); // Update the lists dynamically
        }
    }

    function getSelectedUserId() {
        return selectedUserId; // Return the currently selected user ID
    }

    async function displayUserStatuses(userStatuses) {
        checkUserIds(); // Keep this logic intact

        const recentUpdatesList = document.getElementById("recentUpdatesList");
        const alreadySeenList = document.getElementById("alreadySeenList");
        recentUpdatesList.innerHTML = ""; // Clear previous entries
        alreadySeenList.innerHTML = ""; // Clear previous entries

        const readedStatusRef = ref(database, "data/readed_status");
        const readedStatusSnapshot = await get(readedStatusRef); // Fetch read statuses
        const readedStatuses = readedStatusSnapshot.val(); // Get read statuses

        let recentUpdates = [];
        let alreadySeen = [];
        let userName = "Unknown User"; // Define userName outside the loop
        let userImage = "assets/img/profiles/avatar-03.jpg"; // Default image

        for (const status of userStatuses) {
            try {
                const userId = status.userId; // Now userId is available in the status object

                // Fetch contact details
                const contactRef = ref(
                    database,
                    `data/contacts/${loggeduserId}/${userId}`
                );
                const contactSnapshot = await get(contactRef);

                if (contactSnapshot.exists()) {
                    const contactData = contactSnapshot.val();
                    const contactFirstName =
                        contactData?.firstName || contactData?.mobile_number;
                    const contactLastName = contactData?.lastName || "";

                    // Use contact data if available
                    if (contactFirstName || contactLastName) {
                        userName =
                            `${contactFirstName} ${contactLastName}`.trim();
                    }
                }

                // If contact data is not available, fallback to user details
                if (userName === "Unknown User") {
                    const userRef = ref(database, `data/users/${userId}`);
                    const userSnapshot = await get(userRef);

                    if (userSnapshot.exists()) {
                        const user = userSnapshot.val();
                        userName = `${user.firstName || ""} ${user.lastName || ""
                            }`.trim();
                        userImage = user.image || userImage; // Use profile image from users collection if available
                    }
                }

                const statusTime = new Date(status.timestamp).toLocaleString(
                    "en-US",
                    {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: undefined, // Exclude seconds
                        hour12: true, // Optional: Set to false for 24-hour format
                    }
                );

                // Prepare HTML for this status
                const statusHTML = `
                <div class="chat-user">
                    <div class="avatar avatar-lg me-2">
                        <img src="${userImage}" class="rounded-circle" alt="image">
                    </div>
                    <div class="user-online">
                        <h5>${userName}</h5>
                        <span>${statusTime}</span>
                    </div>
                </div>
            `;

                // Check if the status is already seen or recent
                const statusKey = `${loggeduserId}_${userId}`;
                if (readedStatuses && readedStatuses[statusKey]) {
                    alreadySeen.push(statusHTML); // Status is already seen
                } else {
                    recentUpdates.push(statusHTML); // Status is recent
                }
            } catch (error) {
                console.error("Error processing status:", error);
            }
        }

        // Display Recent Updates
        recentUpdatesList.innerHTML =
            recentUpdates.length > 0
                ? recentUpdates.join("")
                : "<p>No Recent Updates</p>";

        // Display Already Seen Updates
        alreadySeenList.innerHTML =
            alreadySeen.length > 0
                ? alreadySeen.join("")
                : "<p>No Already Seen Updates</p>";

        // Call updateCarousel with userStatuses and userName
        updateCarousel(userStatuses, userName);
    }

    function closeStatusView() {
        const userStoriesBox = document.querySelector('.user-stories-box');
        if (userStoriesBox) {
            userStoriesBox.style.display = 'none';
        }
        const welcomeContainer = document.getElementById("welcome-container");
        if (welcomeContainer) {
            welcomeContainer.style.removeProperty("display");
        }
    }

    function updateCarousel(statuses, userName, userImage) {
        const carouselInner = document.querySelector('.carousel-inner.status_slider');
        const carouselIndicators = document.querySelector('.carousel-indicators');
        const statusFooter = document.getElementById('status-footer-content');
        const carouselHeader = document.querySelector('.user-stories-box .chat-user');

        // Clear previous content
        carouselInner.innerHTML = '';
        carouselIndicators.innerHTML = '';
        statusFooter.innerHTML = '';

        if (!statuses || statuses.length === 0) {
            closeStatusView();
            return;
        }

        // Update the header of the story viewer
        if (carouselHeader) {
            carouselHeader.querySelector('img').src = userImage;
            carouselHeader.querySelector('h5').textContent = userName;
            // We'll update the time dynamically as the slide changes
        }

        // Create a carousel item for each status
        statuses.forEach((status, index) => {
            const carouselItem = document.createElement('div');
            carouselItem.className = `carousel-item ${index === 0 ? 'active' : ''}`;
            carouselItem.innerHTML = `
            <img src="${status.url}" class="d-block w-100" alt="Status Image">
            ${status.message ? `<div class="carousel-caption d-none d-md-block">
                <p style="margin-top:-100px;">${status.message}</p>
            </div>` : ''}
        `;
            carouselInner.appendChild(carouselItem);

            currentReplyingStatusInfo = {
                statusId: status.id,
                statusUrl: status.url
            };
            const indicator = document.createElement('li');
            indicator.dataset.bsTarget = "#carouselIndicators";
            indicator.dataset.bsSlideTo = index;
            indicator.className = index === 0 ? 'active' : '';
            carouselIndicators.appendChild(indicator);
        });

        // Function to update the header time and footer based on the active slide
        const updateSlideDetails = (index) => {
            const activeStatus = statuses[index];
            if (activeStatus && carouselHeader) {
                carouselHeader.querySelector('span').textContent = moment(activeStatus.uploadTime).fromNow();

            }
        };

        // Set initial details for the first slide
        updateSlideDetails(0);

        // Add event listener to update details when the slide changes
        const carouselElement = document.getElementById('carouselIndicators');
        carouselElement.addEventListener('slid.bs.carousel', (event) => {
            updateSlideDetails(event.to);
        });
    }

    // Reference to the user's status in Firebase
    const userStatusRef = ref(database, "data/status/" + loggeduserId);

    // Disable input if the user has a status
    onValue(userStatusRef, (snapshot) => {
        const statusMessageInput = document.getElementById("statusMessage");
        if (snapshot.exists()) {
            // User has a status, disable the input
            statusMessageInput.disabled = true;
        } else {
            // Enable input if no status exists
            statusMessageInput.disabled = false;
        }
    });

    const chatFooter = document.querySelector(".chat-footer"); // Select the chat footer

    function checkUserIds() {
        const recipientUserId = selectedUserId;
        if (loggeduserId === recipientUserId) {
            chatFooter.style.display = "none"; // Hide the chat footer
        } else {
            chatFooter.style.display = "block"; // Show the chat footer
        }
    }

    // Add click event listener for the send button

    document
        .getElementById("status-message-form")
        .addEventListener("submit", async (event) => {
            event.preventDefault(); // Prevent page reload

            const messageTextRaw = document.getElementById("statusMessage").value;
            if (!messageTextRaw.trim()) {
                // Optional: Show a toast or alert for empty message
                console.error("Message cannot be empty.");
                return;
            }

            const recipientUserId = getSelectedUserId(); // Get the selected user ID
            // --- VALIDATION ---
            if (!loggeduserId) {
                throw new Error("No user is logged in.");
            }
            if (!recipientUserId) {
                throw new Error("No recipient selected to send a message to.");
            }

            // --- ENCRYPTION ---
            const secretKey = "89def69f0bdddc995078037539dc6ef4f0bdbdd3fa04ef2d11eea30779d72ac6";
            const messageTextEncrypted = CryptoJS.AES.encrypt(messageTextRaw, secretKey).toString();

            // --- DATABASE LOGIC ---
            try {
                // 1. CRITICAL FIX: Create a consistent, sorted chat room ID
                // This ensures that the chat between UserA and UserB is ALWAYS the same,
                // regardless of who sends the first message.
                const chatRoomId = `${loggeduserId}-${recipientUserId}`;


                // 2. Create a reference to the specific chat room
                const chatRoomRef = ref(database, `data/chats/${chatRoomId}`);

                // 3. Use push() to generate a unique key (ID) for the new message
                const newMessageRef = push(chatRoomRef);
                const messageId = newMessageRef.key;

                // 4. Create the new message object with the exact structure you need
                const messageData = {
                    id: messageId,
                    attachmentType: 6, // Hardcoded as requested
                    senderId: loggeduserId,
                    recipientId: recipientUserId,
                    body: messageTextRaw,
                    timestamp: serverTimestamp(), // Use Firebase server time for consistency
                    date: serverTimestamp(),      // Use Firebase server time for consistency
                    replyId: "0",                 // Hardcoded as requested
                    blocked: false,               // Default value
                    delivered: false,             // Default to false, will be updated by a listener on the recipient's side
                    deliveredTime: 0,
                    readMsg: false,               // Default to false
                    readTime: 0,
                    delete: "",                   // Default value
                    sent: true,                    // Mark as sent immediately
                    statusUrl: currentReplyingStatusInfo.statusUrl || ""
                };

                // 5. Use set() to save the complete message data at the unique location
                await set(newMessageRef, messageData);

                // 6. Clear the input field on success
                document.getElementById("statusMessage").value = "";

            } catch (error) {
                console.error("Failed to send message:", error);
                // Optionally, show a failure toast notification to the user
            }
        });

    // Add your Firebase Storage reference
    // const storage = getStorage(); // Make sure you have initialized Firebase Storage

    // Function to filter statuses based on search input

    function filterStatuses() {
        const input = document
            .getElementById("statusSearchInput")
            .value.toLowerCase();
        const noMatchesMessage = document.getElementById(
            "noStatusMatchesMessage"
        );

        const myStatusList = document.getElementById("myStatusList").children;
        const recentUpdatesList =
            document.getElementById("recentUpdatesList").children;
        const alreadySeenList =
            document.getElementById("alreadySeenList").children;

        function filterList(list) {
            let foundMatch = false;
            for (let i = 0; i < list.length; i++) {
                const item = list[i];
                const userNameElement = item.querySelector(".chat-user-msg h6");
                if (userNameElement) {
                    const userName = userNameElement.textContent.toLowerCase();
                    if (userName.includes(input)) {
                        item.style.display = ""; // Show item
                        foundMatch = true;
                    } else {
                        item.style.display = "none"; // Hide item
                    }
                }
            }
            return foundMatch;
        }

        const myStatusFound = filterList(myStatusList);
        const recentUpdatesFound = filterList(recentUpdatesList);
        const alreadySeenFound = filterList(alreadySeenList);

        if (!myStatusFound && !recentUpdatesFound && !alreadySeenFound) {
            noMatchesMessage.style.display = "block";
        } else {
            noMatchesMessage.style.display = "none";
        }
    }

    document
        .getElementById("statusSearchInput")
        .addEventListener("input", filterStatuses);

    // Emoji Picker
    const emojiButton = document.getElementById("emoji-button");
    const emojiPicker = document.getElementById("emoji-picker");
    const emojiList = document.getElementById("emoji-list");
    const inputField = document.getElementById("statuscontent");

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
            emojiPicker.style.display = "none"; // Hide the picker after selection
        });
    });
});
