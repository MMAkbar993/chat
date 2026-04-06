import { initializeFirebase } from './firebase-user.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
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
    remove,
    onDisconnect,
    child,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import {
    getStorage,
    ref as storageRef,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

initializeFirebase(function (app, auth, database,storage) {

let currentUserId = null; // Define the current user here
let displayGroupUsersGeneration = 0; // Ignore stale async renders when fetchGroupUsers runs concurrently
let laravelGroupPickerGeneration = 0;

function dreamchatWebBase() {
    if (typeof APP_URL !== "undefined" && APP_URL) {
        return String(APP_URL).replace(/\/$/, "");
    }
    return typeof window !== "undefined" && window.location ? window.location.origin : "";
}

function refetchGroupPickerIfModalOpen() {
    const addModal = document.getElementById("add-group");
    if (!addModal || !addModal.classList.contains("show")) return;
    const ul = document.getElementById("users-list");
    if (ul && currentUserId && ul.querySelectorAll(".contact-user").length === 0) {
        fetchGroupUsers(currentUserId);
    }
}

// Monitor the user's authentication state
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserId = user.uid; // Set the current user ID

        // Fetch groups or other data
        fetchGroups();
        fetchGroupUsers(currentUserId);
        refetchGroupPickerIfModalOpen();
    } else {
        // window.location.href = "/login";
    
    }
});

let usersMap = {};

function groupMessageVisibleForViewer(msg, viewerUid) {
    if (!msg || !viewerUid) return false;
    if (Array.isArray(msg.clearedFor) && msg.clearedFor.includes(viewerUid)) return false;
    if (Array.isArray(msg.deletedFor) && msg.deletedFor.includes(viewerUid)) return false;
    if (msg.senderId === viewerUid && msg.deletedForMe) return false;
    return true;
}

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

/** Root-relative fallbacks break on /group-chat (browser resolves assets under /group-chat/...). Same logic as firebaseChat.js */
function resolveGroupProfileImageUrl(raw) {
    const origin =
        typeof window !== "undefined" && window.location && window.location.origin
            ? window.location.origin
            : "";
    const defaultUrl = origin
        ? origin + "/assets/img/profiles/avatar-03.jpg"
        : "/assets/img/profiles/avatar-03.jpg";
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

function pickGroupAvatarRaw(groupData) {
    if (!groupData || typeof groupData !== "object") return "";
    const candidate =
        groupData.image ||
        groupData.avatarURL ||
        groupData.profile_image ||
        groupData.avatar ||
        "";
    if (candidate && typeof candidate === "object") {
        return (
            candidate.url ||
            candidate.path ||
            candidate.src ||
            ""
        );
    }
    return String(candidate || "").trim();
}

function withCacheBuster(url, version) {
    if (!url || !version) return url;
    try {
        const abs = new URL(url, window.location.origin);
        abs.searchParams.set("v", String(version));
        return abs.toString();
    } catch (e) {
        return url;
    }
}

function rawAvatarFromUserAndContact(userData, contactData) {
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

/** Name for group info sidebar — contacts may exist but lack names; users may use user_name / mobile only */
function buildGroupParticipantDisplayName(contactData, userData) {
    if (userData && userData.public_display_name) {
        return String(userData.public_display_name).trim();
    }
    if (contactData && typeof contactData === "object" && contactData.firstName) {
        const n = `${contactData.firstName} ${contactData.lastName || ""}`.trim();
        if (n) return n;
    }
    if (contactData && contactData.mobile_number) {
        return String(contactData.mobile_number).trim();
    }
    if (userData && typeof userData === "object") {
        const fromParts = [userData.firstName, userData.lastName].filter(Boolean).join(" ").trim();
        if (fromParts) return fromParts;
        if (userData.mobile_number) return String(userData.mobile_number).trim();
        if (userData.userName) return String(userData.userName).trim();
        if (userData.user_name) return String(userData.user_name).trim();
        if (userData.username) return String(userData.username).trim();
        if (userData.displayName) return String(userData.displayName).trim();
        if (userData.email) return String(userData.email).trim();
    }
    return "Unknown User";
}

/**
 * RTDB often only has online/osType; Laravel session has the real profile for the logged-in user.
 */
function mergeLaravelProfileIfSelf(memberId, userData) {
    if (!memberId || !currentUserId || memberId !== currentUserId) {
        return userData ? { ...userData } : {};
    }
    const lu =
        typeof window !== "undefined" &&
        window.LARAVEL_USER &&
        typeof window.LARAVEL_USER === "object"
            ? window.LARAVEL_USER
            : null;
    if (!lu) return userData ? { ...userData } : {};
    const base = { ...(userData || {}) };
    const empty = (v) => v == null || String(v).trim() === "";
    const fill = (key, val) => {
        if (val == null || String(val).trim() === "") return;
        if (empty(base[key])) base[key] = val;
    };
    fill("firstName", lu.firstName);
    fill("lastName", lu.lastName);
    fill("userName", lu.username || lu.user_name);
    fill("user_name", lu.user_name || lu.username);
    fill("username", lu.username || lu.user_name);
    fill("mobile_number", lu.mobile_number);
    fill("email", lu.email);
    fill("profile_image", lu.profile_image || lu.image);
    fill("image", lu.image || lu.profile_image);
    fill("public_display_name", lu.public_display_name);
    if (empty(base.firstName) && empty(base.lastName) && lu.full_name) {
        const parts = String(lu.full_name).trim().split(/\s+/);
        if (parts.length) {
            fill("firstName", parts[0]);
            if (parts.length > 1) fill("lastName", parts.slice(1).join(" "));
        }
    }
    return base;
}

/** Resolve names/avatars from MySQL when RTDB has no profile (matches firebase_uid). */
async function enrichGroupMembersWithLaravelBatch(members) {
    const uids = [
        ...new Set(
            members
                .filter((m) => m && m.memberId && m.displayName === "Unknown User")
                .map((m) => m.memberId)
        ),
    ];
    if (uids.length === 0) return members;
    const baseUrl =
        typeof APP_URL !== "undefined" && APP_URL
            ? String(APP_URL).replace(/\/$/, "")
            : typeof window !== "undefined" && window.location
              ? window.location.origin
              : "";
    if (!baseUrl) return members;
    const csrfMeta =
        typeof document !== "undefined"
            ? document.querySelector('meta[name="csrf-token"]')
            : null;
    const csrf = csrfMeta ? csrfMeta.getAttribute("content") : "";
    try {
        const res = await fetch(baseUrl + "/api/users/contact-avatars", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "X-Requested-With": "XMLHttpRequest",
                ...(csrf ? { "X-CSRF-TOKEN": csrf } : {}),
            },
            credentials: "same-origin",
            body: JSON.stringify({ firebase_uids: uids }),
        });
        if (!res.ok) return members;
        const data = await res.json();
        const nameByUid = data.name_by_uid || {};
        const byUid = data.by_uid || {};
        return members.map((m) => {
            if (!m || m.memberId == null || m.displayName !== "Unknown User") return m;
            const name = nameByUid[m.memberId];
            const img = byUid[m.memberId];
            if (!name && !img) return m;
            const next = { ...m };
            if (name) next.displayName = name;
            if (img) {
                next._userForAvatar = { ...(next._userForAvatar || {}), profile_image: img };
            }
            return next;
        });
    } catch (e) {
        return members;
    }
}

/**
 * Populate the overlapping member-avatar strip in the group chat header.
 * Shows up to MAX_HEADER_AVATARS thumbnails + a "+N" badge for the rest.
 * Also updates the member-count line with an online count.
 */
const MAX_HEADER_AVATARS = 4;
async function renderHeaderMemberAvatars(groupData) {
    try {
        const wrap = document.getElementById('header-member-avatars-wrap');
        if (!wrap) return;

        const userIds = Array.isArray(groupData && groupData.userIds) ? groupData.userIds : [];
        if (userIds.length === 0) {
            wrap.style.setProperty('display', 'none', 'important');
            return;
        }

        const visible = userIds.slice(0, MAX_HEADER_AVATARS);
        const remaining = Math.max(0, userIds.length - MAX_HEADER_AVATARS);

        const memberSnapshots = await Promise.all(
            userIds.map(async (uid) => {
                try {
                    const uSnap = await get(ref(database, `data/users/${uid}`));
                    return { uid, data: uSnap.exists() ? uSnap.val() : {} };
                } catch (e) {
                    return { uid, data: {} };
                }
            })
        );

        const memberMap = {};
        memberSnapshots.forEach((s) => { memberMap[s.uid] = s.data; });

        let onlineCount = 0;
        memberSnapshots.forEach((s) => {
            if (s.data && s.data.status === 'online') onlineCount++;
        });

        const countEl = document.getElementById('group-member-count');
        if (countEl) {
            let txt = `${userIds.length} Member${userIds.length !== 1 ? 's' : ''}`;
            if (onlineCount > 0) txt += `, <span class="text-success">${onlineCount} Online</span>`;
            countEl.innerHTML = txt;
        }

        const avatarUrls = visible.map((uid) => {
            const u = memberMap[uid] || {};
            const merged = mergeLaravelProfileIfSelf(uid, u);
            const raw = rawAvatarFromUserAndContact(merged, null);
            return resolveGroupProfileImageUrl(raw || '');
        });

        wrap.innerHTML = '';
        const stack = document.createElement('div');
        stack.className = 'header-member-stack';

        avatarUrls.forEach((url) => {
            const img = document.createElement('img');
            img.className = 'hm-avatar';
            img.src = url;
            img.alt = '';
            stack.appendChild(img);
        });

        if (remaining > 0) {
            const badge = document.createElement('span');
            badge.className = 'hm-count-badge';
            badge.textContent = `${remaining}+`;
            stack.appendChild(badge);
        }

        wrap.appendChild(stack);
        wrap.style.setProperty('display', 'flex', 'important');
    } catch (e) {
        /* never break page rendering */
    }
}

// Function to display users in the HTML list (one-shot reads — avoids stacking onValue listeners on each open / refetch)
function displayGroupUsers(users, currentUser) {
    const renderGen = ++displayGroupUsersGeneration;
    const usersContainer = document.getElementById("users-list"); // The div where you want to list users
    if (!usersContainer) return;
    usersContainer.classList.remove("d-none");
    usersContainer.innerHTML = ""; // Clear existing content

    const userIds = users && typeof users === "object" ? Object.keys(users) : [];
    if (userIds.length === 0) return;

    Promise.all(
        userIds.map((userId) => {
            const user = users[userId];
            const contactsRef = ref(database, `data/contacts/${currentUserId}/${userId}`);
            return get(contactsRef).then((contactSnapshot) => {
                const contactData = contactSnapshot.exists() ? contactSnapshot.val() : null;
                let displayName =
                    user.public_display_name ||
                    user.userName ||
                    user.user_name ||
                    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
                    "";
                const profileImage = resolveGroupProfileImageUrl(
                    rawAvatarFromUserAndContact(user, contactData || null)
                );

                if (contactData && contactData.firstName) {
                    displayName = `${contactData.firstName} ${contactData.lastName || ""}`.trim();
                    return {
                        userId,
                        displayName,
                        img: profileImage,
                        role: user.role,
                    };
                }

                const userRef = ref(database, `data/users/${userId}`);
                return get(userRef).then((userSnapshot) => {
                    const userData = userSnapshot.exists() ? userSnapshot.val() : null;
                    if (!userData) {
                        return {
                            userId,
                            displayName: displayName || "No Name Available",
                            img: profileImage,
                            role: user.role,
                        };
                    }
                    const dn =
                        userData.mobile_number ||
                        [userData.firstName, userData.lastName].filter(Boolean).join(" ").trim() ||
                        userData.userName ||
                        "No Name Available";
                    const img = resolveGroupProfileImageUrl(
                        rawAvatarFromUserAndContact(userData, contactData || null)
                    );
                    return {
                        userId,
                        displayName: dn,
                        img,
                        role: userData.role != null ? userData.role : user.role,
                    };
                });
            });
        })
    )
        .then((rows) => {
            if (renderGen !== displayGroupUsersGeneration) return;
            rows.forEach((r) => {
                if (!r) return;
                appendUserCard(usersContainer, r.displayName, r.img, r.role, r.userId);
            });
        })
        .catch(() => {
            /* ignore */
        });
}

// Helper function to append user card
function appendUserCard(container, displayName, profileImage, role, userId) {
    const userHtml = `
        <div class="contact-user">
            <div class="d-flex align-items-center justify-content-between">
                <div class="d-flex align-items-center">
                    <div class="avatar avatar-lg">
                        <img src="${profileImage}" class="rounded-circle" alt="image">
                    </div>
                    <div class="ms-2">
                        <h6>${capitalizeFirstLetter(displayName)}</h6>
                        <p>${role ? role : ""}</p>
                    </div>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" name="contact" value="${userId}">
                </div>                                       
            </div>
        </div>
    `;
    container.innerHTML += userHtml; // Append user card to the container
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
    if (!string || typeof string !== "string") return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/** Laravel /contacts when RTDB data/contacts is empty (e.g. contacts only in MySQL). Checkbox values must be Firebase UIDs. */
function fetchLaravelContactsForGroupPicker() {
    const usersContainer = document.getElementById("users-list");
    if (!usersContainer) return Promise.resolve();
    const base = dreamchatWebBase();
    if (!base) return Promise.resolve();
    const gen = ++laravelGroupPickerGeneration;
    return fetch(base + "/contacts", {
        method: "GET",
        headers: {
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
        },
        credentials: "same-origin",
    })
        .then((r) => r.json())
        .then((contacts) => {
            if (gen !== laravelGroupPickerGeneration) return;
            if (!Array.isArray(contacts)) return;
            const withFb = contacts.filter((c) => c && String(c.firebase_uid || c.firebaseUid || "").trim());
            if (withFb.length === 0) {
                if (!usersContainer.querySelector(".contact-user")) {
                    usersContainer.innerHTML =
                        '<p class="text-muted text-center py-3">No contacts yet, or contacts are not linked to chat. Add contacts from the Contacts page.</p>';
                }
                return;
            }
            usersContainer.innerHTML = "";
            usersContainer.classList.remove("d-none");
            displayGroupUsersGeneration++;
            withFb.forEach((c) => {
                const fb = String(c.firebase_uid || c.firebaseUid || "").trim();
                const first = (c.firstName || "").trim();
                const last = (c.lastName || "").trim();
                const name =
                    `${first} ${last}`.trim() ||
                    String(c.userName || "").trim() ||
                    String(c.email || "").trim() ||
                    "Contact";
                const img = resolveGroupProfileImageUrl(c.image || "");
                let role = String(c.primary_role_label || "").trim();
                if (!role) {
                    const k = String(c.primary_role || "").trim();
                    const custom = String(c.other_role_text || "").trim();
                    const PR = typeof PRIMARY_ROLES !== "undefined" ? PRIMARY_ROLES : {};
                    if (k === "other") role = custom || PR.other || k;
                    else if (k) role = PR[k] || k;
                }
                appendUserCard(usersContainer, name, img, role, fb);
            });
        })
        .catch(() => {
            /* ignore */
        });
}

function fetchGroupUsers(uid) {
    const firebaseUid = uid || currentUserId;
    if (!firebaseUid) return;
    const contactsRef = ref(database, `data/contacts/${firebaseUid}`);

    get(contactsRef)
        .then((snapshot) => {
            if (!snapshot.exists()) {
                fetchLaravelContactsForGroupPicker();
                return;
            }
            const contacts = snapshot.val();
            const userIds = Object.keys(contacts || {});
            if (userIds.length === 0) {
                fetchLaravelContactsForGroupPicker();
                return;
            }
            const usersRef = ref(database, "data/users");
            get(usersRef)
                .then((userSnapshot) => {
                    if (!userSnapshot.exists()) {
                        fetchLaravelContactsForGroupPicker();
                        return;
                    }
                    const users = userSnapshot.val();
                    const usersMap = {};
                    userIds.forEach((userId) => {
                        if (users[userId]) {
                            const u = users[userId];
                            const contactData = contacts[userId] || null;
                            usersMap[userId] = {
                                ...u,
                                profileImage: resolveGroupProfileImageUrl(
                                    rawAvatarFromUserAndContact(u, contactData)
                                ),
                            };
                        }
                    });
                    if (Object.keys(usersMap).length === 0) {
                        fetchLaravelContactsForGroupPicker();
                        return;
                    }
                    displayGroupUsers(usersMap);
                })
                .catch(() => {
                    fetchLaravelContactsForGroupPicker();
                });
        })
        .catch(() => {
            fetchLaravelContactsForGroupPicker();
        });
}

let selectedMembers = [];

function bindDreamchatGroupCreateUi() {
    const newGroupRoot = document.getElementById("new-group");
    if (!newGroupRoot || newGroupRoot.dataset.dreamchatGroupBind === "1") return;
    newGroupRoot.dataset.dreamchatGroupBind = "1";

    const groupAddBtn = document.getElementById("group-add-btn");
    if (groupAddBtn) {
        groupAddBtn.addEventListener("click", function (e) {
            const newGroupEl = document.getElementById("new-group");
            if (newGroupEl && typeof bootstrap !== "undefined") {
                e.preventDefault();
                e.stopPropagation();
                const modal = bootstrap.Modal.getOrCreateInstance(newGroupEl);
                modal.show();
            }
        });
    }

    const startGroupBtn = document.getElementById("start-group");
    if (startGroupBtn) {
        startGroupBtn.addEventListener("click", function (e) {
    e.preventDefault(); // Prevent default button behavior

    // Disable the button to prevent multiple clicks
    const startGroupButton = document.getElementById('start-group');
    startGroupButton.disabled = true;
    startGroupButton.textContent = "Creating..."; // Optionally update the button text to indicate the process is running

    // Fetching input elements by ID
    const groupNameInput = document.getElementById('group-names'); // Group name input
    const aboutInput = document.getElementById('group-about'); // About input
    const groupTypeInput = document.querySelector('input[name="group-type"]:checked');

    // Check if the inputs are valid
    if (!groupNameInput || !aboutInput ) {
        Swal.fire({
            title: "",
            width: 400,
            text: "Please fill in all required fields.",
            icon: "error",
        });
        startGroupButton.disabled = false; // Re-enable the button on error
        startGroupButton.textContent = "Start Group"; // Reset the button text
        return;
    }

    // Fetching input values and trimming them
    const groupName = groupNameInput.value.trim(); // Group name
    const about = aboutInput.value.trim(); // About
    const groupType = groupTypeInput ? groupTypeInput.value : 'public';

    // Check if groupName and about are not empty
    if (!groupName || !about) {
        Swal.fire({
            title: "",
            width: 400,
            text: "Please fill in all required fields.",
            icon: "error",
        });
        startGroupButton.disabled = false; // Re-enable the button on error
        startGroupButton.textContent = "Start Group"; // Reset the button text
        return;
    }

    // Collect selected member IDs (clear each run; same array is reused elsewhere)
    selectedMembers.length = 0;
    document.querySelectorAll('#users-list input[type="checkbox"]:checked').forEach((checkbox) => {
        selectedMembers.push(checkbox.value); // Push member ID
    });

    // Check if any members are selected
    if (selectedMembers.length === 0) {
        alert('Please select at least one member.');
        startGroupButton.disabled = false; // Re-enable the button on error
        startGroupButton.textContent = "Start Group"; // Reset the button text
        return;
    }

    // Create a new group in the database
    //const newGroupKey = push(ref(database, 'data/groups/')).currentUserId + "_" + Date.now(); // Create a new group key
    const newGroupKey = currentUserId + "_" + Date.now();
    selectedMembers.push(currentUserId);
    const groupData = {
        group_id: newGroupKey,
        id:"group_" + newGroupKey,
        groupName: groupName,
        name:groupName,
        status: about,
        about: about,
        groupType: groupType,
        userIds:selectedMembers,
        createdBy: currentUserId,
        admin:currentUserId,
        date: Date.now(),
        createdAt: Date.now()
    };
    const resetStartGroupButton = () => {
        startGroupButton.disabled = false;
        startGroupButton.textContent = "Start Group";
    };

    // Handle avatar upload
    const fileInputGroup = document.getElementById('avatar-upload');
    if (fileInputGroup && fileInputGroup.files.length > 0) {
        const file = fileInputGroup.files[0];

        if (!auth || !auth.currentUser) {
            resetStartGroupButton();
            Swal.fire({
                icon: "error",
                width: 400,
                text: "You must be signed in with Firebase to upload a group icon. Create the group without an icon, or sign in again.",
            });
            return;
        }

        // Upload icon via Laravel backend to avoid Firebase Storage CORS issues
        const csrfToken = document.querySelector('meta[name="csrf-token"]')
            ? document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            : null;
        const iconFormData = new FormData();
        iconFormData.append('image', file);

        fetch(dreamchatWebBase() + '/api/groups/icon-upload', {
            method: 'POST',
            headers: csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {},
            body: iconFormData,
        })
            .then(async (res) => {
                if (!res.ok) {
                    const text = await res.text().catch(() => '');
                    throw new Error(`Icon upload failed (${res.status}) ${text}`.slice(0, 250));
                }
                return res.json();
            })
            .then((payload) => {
                const downloadURL = payload && payload.url ? payload.url : '';
                groupData.image = downloadURL;
                groupData.avatarURL = downloadURL;
                groupData.profile_image = downloadURL;

                return set(ref(database, "data/groups/group_" + newGroupKey), groupData);
            })
            .then(() => {
                resetStartGroupButton();
                finalizeGroupCreateUI("group_" + newGroupKey);
                Swal.fire({
                    title: "",
                    width: 400,
                    text: "Group created successfully!",
                    icon: "success",
                });
            })
            .catch(async (error) => {
                const errMsg = error && error.message ? String(error.message).slice(0, 300) : "Unknown error";
                const errCode = error && error.code ? String(error.code) : "";
                // Fallback: still create the group without an icon.
                // This makes "Create group with image" behave like "without image" when Storage upload is blocked.
                resetStartGroupButton();
                // Avoid showing an error popup on fallback (group creation should still succeed).
                // The root cause is Firebase Storage upload/CORS rules; we log it via debug logs already.
                if (typeof console !== "undefined") {
                    console.warn("Group icon upload failed; creating group without icon.");
                }

                try {
                    await set(ref(database, "data/groups/group_" + newGroupKey), groupData);

                    resetStartGroupButton();
                    finalizeGroupCreateUI("group_" + newGroupKey);
                } catch (fallbackErr) {
                    Swal.fire({
                        icon: "error",
                        width: 420,
                        text: "Failed to create group after icon upload failure.",
                    });
                }
            });
    } else {
        // Save group data without avatar
        set(ref(database, 'data/groups/group_' + newGroupKey), groupData)
            .then(() => {
                resetStartGroupButton();
                finalizeGroupCreateUI("group_" + newGroupKey);
                Swal.fire({
                    title: "",
                    width: 400,
                    text: "Group created successfully!",
                    icon: "success",
                });
            })
            .catch((error) => {
                resetStartGroupButton();
            });
    }
        });
    }

    const cancleGroupBtn = document.querySelector('#cancle-btn-group');
    if (cancleGroupBtn) {
        cancleGroupBtn.addEventListener('click', function () {
             document.getElementById("group-names").value = '';
             document.getElementById("group-about").value = '';
             document.getElementById("groupcontactSearchInput").value = '';
             const publicRadio = document.getElementById("group-type-public");
             if (publicRadio) publicRadio.checked = true;
             document.querySelectorAll('.contact-user .form-check-input').forEach(checkbox => {
                checkbox.checked = false;
            });

            const searchInput = document.getElementById("groupcontactSearchInput");
            if (searchInput) searchInput.dispatchEvent(new Event("input"));
            
        });
    }
    const groupAddCancleBtn = document.querySelector('#group-add-cancle-btn');
    if (groupAddCancleBtn) groupAddCancleBtn.addEventListener('click', function () {
        document.getElementById("group-names").value = '';
        document.getElementById("group-about").value = '';
        document.getElementById("groupcontactSearchInput").value = '';
        document.querySelectorAll('.contact-user .form-check-input').forEach(checkbox => {
            checkbox.checked = false;
        });
        
       
    });

    const canlceBtnSearch = document.querySelector('#canlce-btn-search');
    if (canlceBtnSearch) canlceBtnSearch.addEventListener('click', function () {
        document.getElementById("group-names").value = '';
        document.getElementById("group-about").value = '';
        document.getElementById("groupcontactSearchInput").value = '';
        document.querySelectorAll('.contact-user .form-check-input').forEach(checkbox => {
            checkbox.checked = false;
        });
       
    });

    const avatarUpload = document.getElementById('avatar-upload');
    if (avatarUpload) avatarUpload.addEventListener('change', function (event) {
        const file = event.target.files[0]; // Get the selected file
        const preview = document.getElementById('avatar-preview'); // Get the image preview element
        if (!preview) return;

        // Check if a file is selected
        if (file) {
            const reader = new FileReader(); // Create a FileReader object

            reader.onload = function (e) {
                preview.src = e.target.result; // Set the src of the preview to the file's result
                preview.style.display = 'block'; // Show the preview
                preview.style.objectFit = 'cover';
                preview.classList.add('position-relative');
                preview.style.zIndex = '5';
            };

            reader.readAsDataURL(file); // Read the file as a Data URL
        } else {
            preview.style.display = 'none'; // Hide the preview if no file is selected
        }
    });

    const addGroupModal = document.getElementById('add-group');
    if (addGroupModal) {
        addGroupModal.addEventListener('shown.bs.modal', function () {
            const ul = document.getElementById('users-list');
            if (ul) ul.classList.remove("d-none");
            if (ul && ul.querySelectorAll(".contact-user").length === 0) {
                if (currentUserId) fetchGroupUsers(currentUserId);
            }
        });
    }

    if (newGroupRoot) {
        newGroupRoot.addEventListener("shown.bs.modal", function () {
            const fileIn = document.getElementById("avatar-upload");
            if (fileIn) fileIn.value = "";
            const prev = document.getElementById("avatar-preview");
            if (prev) {
                const def = prev.getAttribute("data-default-avatar");
                if (def) prev.src = def;
                prev.style.objectFit = "";
                prev.style.zIndex = "";
            }
            const ul = document.getElementById("users-list");
            if (ul && ul.querySelectorAll(".contact-user").length === 0) {
                if (currentUserId) fetchGroupUsers(currentUserId);
            }
        });
    }

    const groupcontactSearchInputEl = document.getElementById("groupcontactSearchInput");
    if (groupcontactSearchInputEl) {
        groupcontactSearchInputEl.addEventListener("input", function () {
            const searchValue = this.value.toLowerCase(); // Get the search value in lowercase
            const groupDivs = document.querySelectorAll("#users-list .contact-user"); // Select all contact elements
            const usersList = document.getElementById("users-list");
            let anyVisible = false; // Track if any contact is visible

            groupDivs.forEach((groupDiv) => {
                const groupNameElement = groupDiv.querySelector("h6"); // Get the contact name in an <h6> tag
                const groupName = groupNameElement ? groupNameElement.textContent.toLowerCase() : ""; // Get the contact name in lowercase

                // Check if the contact name includes the search value
                if (groupName.includes(searchValue)) {
                   
                    groupDiv.style.display = ""; // Show the contact
                    const groupFlexElements = groupDiv.querySelectorAll('.d-flex.align-items-center');
                    groupFlexElements.forEach((groupFlex) => {
                        groupFlex.style.display = "";
                    });
                    anyVisible = true; // Mark as visible
                } else {
                    groupDiv.style.display = "none"; // Hide the contact

                    // Apply display: none to all .d-flex.align-items-center elements inside the current groupDiv
                    const groupFlexElements = groupDiv.querySelectorAll('.d-flex.align-items-center');
                    groupFlexElements.forEach((groupFlex) => {
                        groupFlex.setAttribute("style", "display: none !important;");
                    });
                }
            });

            // Show or hide the no matches message
            const noMatchesMessage = document.getElementById("noGroupMatchesModalMessage");
            if (noMatchesMessage) {
                noMatchesMessage.style.display = anyVisible ? "none" : "block"; // Show if no contacts are visible
            }
            if (usersList) {
                if (!anyVisible && searchValue.trim() !== "") {
                    usersList.classList.add("d-none"); // Hide users-list if no matches are found
                } else {
                    usersList.classList.remove("d-none"); // Show users-list if matches are found
                }
            }
        });
    }
}

bindDreamchatGroupCreateUi();
if (typeof window !== "undefined") {
    window.addEventListener("spa-page-applied", function (e) {
        const path = e && e.detail && e.detail.pathname ? e.detail.pathname : "";
        if (path === "/group-chat" || document.getElementById("new-group")) {
            bindDreamchatGroupCreateUi();
        }
    });
}

// Function to close the popup
function closePopup() {
    // Logic to close the popup/modal
    const groupNameInput = document.getElementById("group-names");
    const groupAboutInput = document.getElementById("group-about");
    if (groupNameInput) groupNameInput.value = "";
    if (groupAboutInput) groupAboutInput.value = "";
    document
        .querySelectorAll('#users-list input[type="checkbox"]')
        .forEach((checkbox) => {
            checkbox.checked = false; // Uncheck all checkboxes
        });
}

let selectedGroupId = null; // Declare a variable to hold the selected group ID globally
let previousMessagesRef = null; // Store previous messages reference for detaching listeners
/** Bumps on each fetchGroupInfo call so in-flight async work does not paint stale group data */
let groupInfoRenderGeneration = 0;

function resetGroupInfoPanelPlaceholders() {
    const nameEl = document.getElementById("group-profile-name");
    if (nameEl) nameEl.textContent = "";
    const countEl = document.getElementById("group-profile-participant-count");
    if (countEl) countEl.textContent = "—";
    const aboutEl = document.getElementById("group-info-about");
    if (aboutEl) aboutEl.textContent = "—";
    const dateEl = document.getElementById("group-date");
    if (dateEl) dateEl.textContent = "";
    const membersEl = document.getElementById("members-container");
    if (membersEl) membersEl.innerHTML = "";
    const avatarEl = document.getElementById("group-avatar");
    if (avatarEl) {
        avatarEl.src = "assets/img/profiles/avatar-03.jpg";
        avatarEl.alt = "img";
    }
    const headingEl = document.getElementById("group-participants-heading");
    if (headingEl) headingEl.textContent = "Participants";
    const viewAllWrap = document.getElementById("group-view-all-members");
    if (viewAllWrap) viewAllWrap.classList.add("d-none");
    const searchWrap = document.getElementById("group-participants-search-wrap");
    if (searchWrap) searchWrap.classList.add("d-none");
    const searchInput = document.getElementById("group-participants-search");
    if (searchInput) searchInput.value = "";
}

function finalizeGroupCreateUI(fullGroupId) {
    if (!fullGroupId) return;
    selectedGroupId = fullGroupId;
    if (typeof window !== "undefined") {
        window.__dreamchatSelectedGroupId = selectedGroupId;
    }

    const gf = document.getElementById("group-form");
    const amf = document.getElementById("add-members-form");
    if (gf) gf.reset();
    if (amf) amf.reset();

    $("#add-group").modal("hide");
    $("#new-group").modal("hide");

    // Refresh sidebar and immediately hydrate chat/header/offcanvas data.
    refreshGroupsList();
    loadGroupDetails(selectedGroupId);
    loadGroupMessages(selectedGroupId);
    fetchGroupInfo(selectedGroupId);
}

function closeGroupInfoOffcanvas() {
    const el = document.getElementById("contact-profile");
    if (!el) return;
    try {
        if (typeof bootstrap !== "undefined" && bootstrap.Offcanvas) {
            const inst = bootstrap.Offcanvas.getInstance(el);
            if (inst) {
                inst.hide();
                return;
            }
        }
    } catch (e) {
        /* ignore */
    }
    el.classList.remove("show");
}
if (typeof window !== "undefined") {
    window.closeGroupInfoOffcanvas = closeGroupInfoOffcanvas;
}

// Function to display groups and set click event listeners
let displayGroupsGeneration = 0;

function updateGroupSidebarUnreadBadge(groupId, count) {
    const row = document.querySelector(
        `#group-list .chat-list[data-group-id="${groupId}"]`
    );
    if (!row) return;
    const span = row.querySelector(".count-message");
    if (!span) return;
    const n = Math.max(0, Math.floor(Number(count)) || 0);
    if (n > 0) {
        span.textContent = String(n);
        span.style.display = "inline-block";
    } else {
        span.textContent = "";
        span.style.display = "none";
    }
}

/** One RTDB read of the chat + per-user read state; used for sidebar preview and red unread count. */
function getGroupSidebarMeta(groupId) {
    const uid = currentUserId;
    if (!uid) {
        return Promise.resolve({
            latestMessage: null,
            unreadCount: 0,
            latestMessageTimestamp: null,
        });
    }
    const messagesRef = ref(database, `data/chats/${groupId}`);
    return Promise.all([
        get(messagesRef),
        get(ref(database, `data/users/${uid}/group_last_read/${groupId}`)),
        get(ref(database, `data/users/${uid}/unread_groups/${groupId}`)),
    ])
        .then(([snap, lastReadSnap, manualSnap]) => {
            let lastReadTs = 0;
            if (lastReadSnap.exists()) {
                const v = Number(lastReadSnap.val());
                lastReadTs = Number.isFinite(v) ? v : 0;
            }
            let manualMarked = false;
            if (manualSnap.exists()) {
                const v = manualSnap.val();
                manualMarked = !!(v && typeof v === "object" && v.marked);
            }

            if (!snap.exists()) {
                return {
                    latestMessage: null,
                    unreadCount: manualMarked ? 1 : 0,
                    latestMessageTimestamp: null,
                };
            }

            const messagesVal = snap.val();
            const messageArray = Object.values(messagesVal);
            const latestMessage = messageArray.reduce((latest, current) => {
                const ca = Number(current.timestamp || 0);
                const la = Number(latest.timestamp || 0);
                return ca > la ? current : latest;
            });

            let unreadCount = 0;
            for (let i = 0; i < messageArray.length; i++) {
                const m = messageArray[i];
                if (!m || m.senderId === uid) continue;
                const ts = Number(m.timestamp || m.date || 0);
                if (ts > lastReadTs) unreadCount++;
            }
            if (manualMarked) unreadCount = Math.max(unreadCount, 1);

            return {
                latestMessage,
                unreadCount,
                latestMessageTimestamp: latestMessage ? latestMessage.timestamp : null,
            };
        })
        .catch(() => ({
            latestMessage: null,
            unreadCount: 0,
            latestMessageTimestamp: null,
        }));
}

function displayGroups(groups, currentUserId) {
    if (!groups || typeof groups !== 'object') return;
    const chatUsersWrap = document.querySelector("#group-list");
    if (!chatUsersWrap) return;

    const renderGen = ++displayGroupsGeneration;

    const groupPromises = Object.keys(groups).map(groupId => {
        const group = groups[groupId];

        if (group.userIds && group.userIds.includes(currentUserId)) {
            return getGroupSidebarMeta(groupId)
                .then(async (meta) => {
                    const latestMessage = meta.latestMessage;
                    let displayMessage = "";
                    if (latestMessage) {
                        const messageType = latestMessage.attachmentType || "unknown";
                        if (messageType === 6) {
                            try {
                                const originalMessage = await decryptlibsodiumMessage(latestMessage.body);
                                displayMessage = originalMessage || "";
                            } catch (e) {
                                displayMessage = "Encrypted message";
                            }
                        } else if (messageType === 5) {
                            displayMessage = "File sent";
                        } else if (messageType === 2) {
                            displayMessage = "Image sent";
                        } else if (messageType === 1) {
                            displayMessage = "Video sent";
                        } else if (messageType === 3) {
                            displayMessage = "Audio sent";
                        } else {
                            displayMessage = "Unknown message type";
                        }
                    }

                    return {
                        groupId,
                        ...group,
                        latestMessageTimestamp:
                            meta.latestMessageTimestamp != null
                                ? meta.latestMessageTimestamp
                                : group.date,
                        displayMessage,
                        unreadCount: meta.unreadCount || 0,
                    };
                })
                .catch(() => ({
                    groupId,
                    ...group,
                    latestMessageTimestamp: group.date,
                    displayMessage: "",
                    unreadCount: 0,
                }));
        } else {
            return Promise.resolve(null);
        }
    });

    Promise.all(groupPromises).then(groupsWithLatestMessage => {
        if (renderGen !== displayGroupsGeneration) return;

        const filteredGroups = groupsWithLatestMessage.filter(group => group !== null);

        filteredGroups.sort((a, b) => {
            return new Date(b.latestMessageTimestamp) - new Date(a.latestMessageTimestamp);
        });

        const htmlParts = filteredGroups.map(group => {
            const AvatarURL = resolveGroupProfileImageUrl(
                withCacheBuster(
                    pickGroupAvatarRaw(group),
                    group.updatedAt || group.date || Date.now()
                )
            );
            const formattedTime = formatedTimestamp(group.latestMessageTimestamp);
            const isPinned = group.pinnedBy && group.pinnedBy[currentUserId];
            const isArchived = group.archivedBy && group.archivedBy[currentUserId];
            const pinIcon = isPinned ? '<i class="ti ti-pinned-filled text-warning" style="font-size:12px;"></i>' : '';
            const archivedClass = isArchived ? ' group-archived' : '';
            const pinLabel = isPinned ? 'Unpin Group' : 'Pin Group';
            const pinIconClass = isPinned ? 'ti-pinned-off' : 'ti-pin';
            const archiveLabel = isArchived ? 'Unarchive Group' : 'Archive Group';
            const archiveIconClass = isArchived ? 'ti-archive-off' : 'ti-archive';
            const uc = Number(group.unreadCount) || 0;
            const unreadBadgeDisplay = uc > 0 ? "inline-block" : "none";
            const unreadBadgeText = uc > 0 ? String(uc) : "";

            return `
                <div class="chat-list${archivedClass}" data-group-id="${group.groupId}">
                    <a href="#" class="chat-user-list">
                        <div class="avatar avatar-lg me-2">
                             <img src="${AvatarURL}" class="rounded-circle" alt="image">
                        </div>
                        <div class="chat-user-info">
                            <div class="chat-user-msg">
                                <h6>${group.name}</h6>
                                <p>${group.displayMessage}</p>
                            </div>
                            <div class="chat-user-time">
                                <span class="time">${formattedTime}</span>
                                <div class="chat-pin">
                                    ${pinIcon}
                                    <span class="count-message fs-12 fw-semibold" style="display:${unreadBadgeDisplay}">${unreadBadgeText}</span>
                                </div>
                            </div>    
                        </div>
                    </a>
                    <div class="chat-drop dropdown">
                        <a class="group-sidebar-dots" href="#" data-bs-toggle="dropdown">
                            <i class="ti ti-dots-vertical"></i>
                        </a>
                        <ul class="dropdown-menu dropdown-menu-end p-2 group-sidebar-dropdown">
                            <li><a class="dropdown-item" href="#" data-sidebar-action="archive" data-gid="${group.groupId}"><i class="ti ${archiveIconClass} me-2"></i>${archiveLabel}</a></li>
                            <li><a class="dropdown-item" href="#" data-sidebar-action="mute" data-gid="${group.groupId}"><i class="ti ti-bell-off me-2"></i>Mute Notification</a></li>
                            <li><a class="dropdown-item" href="#" data-sidebar-action="exit" data-gid="${group.groupId}"><i class="ti ti-logout-2 me-2"></i>Exit Group</a></li>
                            <li><a class="dropdown-item" href="#" data-sidebar-action="pin" data-gid="${group.groupId}"><i class="ti ${pinIconClass} me-2"></i>${pinLabel}</a></li>
                            <li><a class="dropdown-item" href="#" data-sidebar-action="unread" data-gid="${group.groupId}"><i class="ti ti-mail me-2"></i>Mark as Unread</a></li>
                        </ul>
                    </div>
                </div>
            `;
        });

        chatUsersWrap.innerHTML = htmlParts.join("");

        chatUsersWrap.querySelectorAll(".chat-list").forEach((group) => {
            group.addEventListener("click", (event) => {
                if (event) event.preventDefault();
                if (event.target.closest(".chat-drop")) return;
                const newGroupId = group.getAttribute("data-group-id");
                if (selectedGroupId && newGroupId && selectedGroupId !== newGroupId) {
                    closeGroupInfoOffcanvas();
                }
                selectedGroupId = newGroupId;
                if (typeof window !== "undefined") {
                    window.__dreamchatSelectedGroupId = selectedGroupId;
                }
                loadGroupMessages(selectedGroupId);
                loadGroupDetails(selectedGroupId);
            });
        });
    });
}

function formatedTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();

    // Reset time for accurate day comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
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

// Function to format the timestamp into a readable time
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();

    // Check if the timestamp is from today
    const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const period = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12; // Convert 0 to 12 for midnight
    const time = `${hours}:${minutes} ${period}`;

    if (isToday) {
        // Return just the time if it's today
        return time;
    } else {
        // Format the date as MM/DD/YYYY and append the time
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Month is 0-based
        const year = date.getFullYear();
        return `${month}/${day}/${year} ${time}`;
    }
}

// Function to get users data from Firebase Realtime Database
function getUsers() {
    const usersRef = ref(database, "data/users"); // Path to your users data

    return get(usersRef)
        .then((snapshot) => {
            if (snapshot.exists()) {
                return snapshot.val(); // Return the users data
            } else {
                return {};
            }
        })
        .catch((error) => {
            return {};
        });
}

// Function to load group details
function loadGroupDetails(groupId) {
   
    const groupRef = ref(database, `data/groups/${groupId}`); // Path to your group data

    // Get group details
    get(groupRef)
        .then((snapshot) => {
            if (snapshot.exists()) {
                const groupData = snapshot.val();
               
                // Update group name and member count
                document.getElementById("group-name").innerText = groupData.name; // Update group name
                const groupIdField = document.getElementById("group_id");
                if (groupIdField) groupIdField.value = groupId;
                document.getElementById("group_image").src = resolveGroupProfileImageUrl(
                    withCacheBuster(
                        pickGroupAvatarRaw(groupData),
                        groupData.updatedAt || groupData.date || Date.now()
                    )
                );
                document.getElementById("group-member-count").innerText = `${(groupData.userIds || []).length} Members`;
                try { renderHeaderMemberAvatars(groupData); } catch (e) { /* safe */ }
                const _wc = document.getElementById("welcome-container");
                if (_wc) _wc.style.setProperty("display", "none", "important");
                const _mid = document.getElementById("middle");
                if (_mid) {
                    _mid.style.setProperty("display", "flex", "important");
                    _mid.classList.add("message-panel-visible");
                }

                // Load chat messages or any other group-specific data here if needed
                loadChatMessages(groupId);
            }
        })
        .catch((error) => {
        
        });
}

function loadChatMessages(groupId) {
    // Scroll to bottom after a short delay so loadGroupMessages' onValue render has time to paint.
    // Messages are rendered by the onValue listener in loadGroupMessages — this function
    // must NOT clear the container (the old rendering code was commented out, leaving only
    // a destructive innerHTML="" that blanked the screen).
    setTimeout(() => {
        const messagesContainer = document.getElementById("chat-messages");
        const groupScrollHost =
            document.getElementById("group-area") || messagesContainer;
        if (groupScrollHost) groupScrollHost.scrollTop = groupScrollHost.scrollHeight;
    }, 300);
}

// Call loadGroupDetails when a group is clicked
document.querySelectorAll(".group-item").forEach((item) => {
    item.addEventListener("click", (event) => {
        const groupId = item.getAttribute("data-group-id"); // Assuming you have a data attribute with group ID
        loadGroupDetails(groupId);
    });
});

const GROUP_REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

function normalizeGroupMessageReactions(raw) {
    if (!raw || typeof raw !== "object") return {};
    const out = {};
    Object.entries(raw).forEach(([uid, emoji]) => {
        const safeUid = String(uid || "").trim();
        const safeEmoji = String(emoji || "").trim();
        if (safeUid && safeEmoji) out[safeUid] = safeEmoji;
    });
    return out;
}

function buildGroupReactionSummaryMarkup(rawReactions) {
    const reactions = normalizeGroupMessageReactions(rawReactions);
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

function buildGroupReactionPickerMarkup() {
    return `
            <div class="message-reaction-picker" aria-label="Message reactions">
                ${GROUP_REACTION_EMOJIS.map(
                    (emoji) =>
                        `<button type="button" class="message-react-option" data-reaction="${emoji}">${emoji}</button>`
                ).join("")}
                <button type="button" class="message-react-more" title="More emojis">+</button>
            </div>
            <div class="message-reaction-picker-extended" aria-label="More reaction emojis"></div>
        `;
}

function updateGroupReactionSummaryInMessage(messageElement, rawReactions) {
    if (!messageElement) return;
    const bubbleWrap = messageElement.querySelector(".message-bubble-wrap");
    if (!bubbleWrap) return;
    const currentSummary = bubbleWrap.querySelector(".message-reaction-summary");
    const nextMarkup = buildGroupReactionSummaryMarkup(rawReactions);
    if (!nextMarkup) {
        if (currentSummary) currentSummary.remove();
        return;
    }
    if (currentSummary) {
        currentSummary.outerHTML = nextMarkup;
        return;
    }
    bubbleWrap.insertAdjacentHTML("beforeend", nextMarkup);
}

function groupMessagesContentFingerprint(snapshot) {
    const parts = [];
    snapshot.forEach((child) => {
        const v = child.val();
        if (!v || typeof v !== "object") {
            parts.push(`${child.key}:__primitive__:${String(v)}`);
            return;
        }
        const copy = { ...v };
        delete copy.reactions;
        parts.push(`${child.key}:${JSON.stringify(copy)}`);
    });
    parts.sort();
    return parts.join("\n");
}

let groupChatMessageFingerprint = { groupId: null, fp: null };

let loadGroupMessagesGeneration = 0;
let cachedUsers = null;

function syncGroupReadReceiptFromSnapshot(groupId, snapshot, loggedInUserId, renderGen) {
    if (renderGen !== loadGroupMessagesGeneration) return;
    if (groupId !== selectedGroupId) return;
    if (!loggedInUserId || !snapshot.exists()) return;
    let maxTs = 0;
    snapshot.forEach((child) => {
        const v = child.val();
        if (!v) return;
        if (!groupMessageVisibleForViewer(v, loggedInUserId)) return;
        const t = Number(v.timestamp || v.date || 0);
        if (t > maxTs) maxTs = t;
    });
    if (maxTs <= 0) return;
    const lastReadRef = ref(database, `data/users/${loggedInUserId}/group_last_read/${groupId}`);
    const manualUnreadRef = ref(database, `data/users/${loggedInUserId}/unread_groups/${groupId}`);
    Promise.all([
        set(lastReadRef, maxTs),
        remove(manualUnreadRef).catch(() => {}),
    ])
        .then(() => {
            if (renderGen !== loadGroupMessagesGeneration) return;
            updateGroupSidebarUnreadBadge(groupId, 0);
        })
        .catch(() => {});
}

function loadGroupMessages(groupId) {
    highlightActiveGroup(groupId);
    const messagesRef = ref(database, `data/chats/${groupId}`);
    if (previousMessagesRef) {
        off(previousMessagesRef);
    }
    previousMessagesRef = messagesRef;
    const messagesContainer = document.getElementById("chat-messages");

    if (!messagesContainer) {
        return;
    }

    const loggedInUserId = currentUserId;
    const renderGen = ++loadGroupMessagesGeneration;

    onValue(messagesRef, async (snapshot) => {
        if (renderGen !== loadGroupMessagesGeneration) return;

        if (groupChatMessageFingerprint.groupId !== groupId) {
            groupChatMessageFingerprint = { groupId, fp: null };
        }

        if (!snapshot.exists()) {
            groupChatMessageFingerprint.fp = null;
            messagesContainer.innerHTML = "";
            return;
        }

        const contentFp = groupMessagesContentFingerprint(snapshot);
        if (
            groupChatMessageFingerprint.fp !== null &&
            contentFp === groupChatMessageFingerprint.fp
        ) {
            snapshot.forEach((child) => {
                const el = messagesContainer.querySelector(
                    `.chats[data-message-key="${child.key}"]`
                );
                if (el) {
                    updateGroupReactionSummaryInMessage(
                        el,
                        child.val().reactions
                    );
                }
            });
            const groupScrollHostFast =
                document.getElementById("group-area") || messagesContainer;
            groupScrollHostFast.scrollTop = groupScrollHostFast.scrollHeight;
            return;
        }

        if (!cachedUsers) {
            cachedUsers = await getUsers();
        }
        const users = cachedUsers;
        if (renderGen !== loadGroupMessagesGeneration) return;

        const entries = [];
        snapshot.forEach((childSnapshot) => {
            entries.push({ data: childSnapshot.val(), key: childSnapshot.key });
        });

        const htmlParts = await Promise.all(entries.map(async (entry) => {
            if (renderGen !== loadGroupMessagesGeneration) return null;

            const messageData = entry.data;
            const messageKey = entry.key;
            const formattedTime = formatTimestamp(messageData.timestamp);
            const type = messageData.attachmentType;

            if (messageData.clearedFor && messageData.clearedFor.includes(currentUserId)) {
                return null;
            }
            if (messageData.deletedFor && messageData.deletedFor.includes(currentUserId)) {
                return null;
            }
            if (messageData.senderId === loggedInUserId && messageData.deletedForMe) {
                return null;
            }

            let senderName = "Unknown";
            let senderImage = resolveGroupProfileImageUrl("");

            try {
                const contactRef = ref(database, `data/contacts/${loggedInUserId}/${messageData.senderId}`);
                const contactSnapshot = await get(contactRef);
                if (contactSnapshot.exists()) {
                    const contactData = contactSnapshot.val();
                    senderName = contactData.firstName || contactData.lastName
                        ? `${contactData.firstName || ""} ${contactData.lastName || ""}`.trim()
                        : senderName;
                    senderImage = resolveGroupProfileImageUrl(
                        rawAvatarFromUserAndContact(contactData, contactData)
                    );
                } else if (users[messageData.senderId]) {
                    const userData = users[messageData.senderId];
                    senderName = `${userData.mobile_number}`;
                    senderImage = resolveGroupProfileImageUrl(
                        rawAvatarFromUserAndContact(userData, null)
                    );
                }
            } catch (_e) { /* keep defaults */ }

            if (
                messageData.senderId === loggedInUserId &&
                typeof window !== "undefined" &&
                window.LARAVEL_USER
            ) {
                const lu =
                    window.LARAVEL_USER.profile_image ||
                    window.LARAVEL_USER.image;
                if (lu && String(lu).trim()) {
                    senderImage = resolveGroupProfileImageUrl(String(lu).trim());
                }
            }

            const forwardedLabel = messageData.isForward
                ? `<div class="forwarded-label" style="color: #FFF; font-size: 12px; margin-bottom: 5px;">
                        <i class="ti ti-arrow-forward-up me-2t"></i>
                        Forwarded
                   </div>`
                : "";

            let messageContent = "";
            let replyContent = "";

            if (messageData.attachmentType === 6) {
                messageContent = await decryptlibsodiumMessage(messageData.body);
            } else {
                const attUrl =
                    messageData.attachment &&
                    normalizeChatMediaUrl(messageData.attachment.url);
                if (messageData.attachmentType === 3) {
                    messageContent = `<audio controls preload="metadata" src="${attUrl}"></audio>`;
                } else if (messageData.attachmentType === 2) {
                    messageContent = `<img src="${attUrl}" alt="Image Preview" class="message-image-preview video-style"></img>`;
                } else if (messageData.attachmentType === 1) {
                    messageContent = `<video width="200" controls src="${attUrl}"></video>`;
                } else if (messageData.attachmentType === 5) {
                    messageContent = `<a href="${attUrl}" target="_blank" download>Download ${messageData.fileName || 'File'}</a>`;
                } else {
                    messageContent = "Unsupported message type.";
                }
            }

            if (messageData.replyId != "0") {
                try {
                    const originalMessageRef = ref(database, `data/chats/${groupId}/${messageData.replyId}`);
                    const replySnap = await get(originalMessageRef);

                    if (replySnap.exists()) {
                        const originalMessageData = replySnap.val();
                        const originalMessageType = originalMessageData.attachmentType.toString();

                        switch (originalMessageType) {
                            case "6":
                                const decryptedReplyContent = await decryptlibsodiumMessage(originalMessageData.body);
                                replyContent = `<div>${decryptedReplyContent.trim()}</div>`;
                                break;
                            case "2":
                                replyContent = `<img src="${normalizeChatMediaUrl(originalMessageData.attachment && originalMessageData.attachment.url)}" alt="Image" style="max-height: 70px; border-radius: 5px;">`;
                                break;
                            case "3":
                                replyContent = `<div><i class="ti ti-microphone"></i> Audio</div>`;
                                break;
                            case "1":
                                replyContent = `<div><i class="ti ti-video"></i> Video</div>`;
                                break;
                            case "5":
                                replyContent = `<div><i class="ti ti-file"></i> File</div>`;
                                break;
                            default:
                                replyContent = "<div>Unsupported reply content</div>";
                        }
                    } else {
                        replyContent = "<div>[Original message not found]</div>";
                    }
                } catch (error) {
                    console.error("Error processing reply:", error);
                    replyContent = "[Decryption Error]";
                }
            }

            const messageBody = `<div>${messageContent}</div>`;
            let statusIcon = "";
            const reactionsMarkup = buildGroupReactionSummaryMarkup(
                messageData.reactions
            );
            const reactionPickerMarkup = buildGroupReactionPickerMarkup();

            if (messageData.senderId === loggedInUserId) {
                return `
                    <div class="chats chats-right" data-group-id="${groupId}" data-message-key="${messageKey}" data-type="${type}">
                        <div class="chat-content">
                            <div class="chat-profile-name text-end">
                                <h6>You <i class="ti ti-circle-filled fs-7 mx-2"></i><span class="chat-time">${formattedTime}</span>
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
                                    <li><a class="dropdown-item group-msg-info-btn" href="#"><i class="ti ti-info-circle me-2"></i>Message Info</a></li>
                                    <li><a class="dropdown-item reply-btn" href="#"><i class="ti ti-corner-up-left me-2"></i>Reply</a></li>
                                    <li><a class="dropdown-item forward-btn" href="#"><i class="ti ti-arrow-forward-up me-2"></i>Forward</a></li>
                                    <li><a class="dropdown-item group-favourite-btn" href="#"><i class="ti ti-heart me-2"></i>Mark as Favourite</a></li>
                                    ${type == 6 ? `<li><a class="dropdown-item group-edit-msg-btn" href="#"><i class="ti ti-pencil me-2"></i>Edit</a></li>` : ""}
                                    <li><a class="dropdown-item delete-btn" href="#" data-bs-toggle="modal" data-bs-target="#message-delete"><i class="ti ti-trash me-2"></i>Delete</a></li>
                                </ul>
                                </div>
                                <div class="message-bubble-wrap">
                                <div class="message-content">
                                ${forwardedLabel}
                                ${messageData.editedAt ? `<span class="edited-label text-muted" style="font-size:11px;"><i class="ti ti-pencil" style="font-size:10px;"></i> edited</span>` : ""}
                                ${messageData.replyId != "0" ? `<div class="message-reply">${replyContent}</div>` : ""}
                                    ${messageBody}
                                </div>
                                ${reactionsMarkup}
                                </div>
                            </div>
                        </div>
                        <div class="chat-avatar">
                            <img src="${senderImage}" class="rounded-circle" alt="image">
                        </div>
                    </div>
                `;
            } else {
                return `
                    <div class="chats" data-group-id="${groupId}" data-message-key="${messageKey}" data-type="${type}">
                        <div class="chat-avatar">
                            <img src="${senderImage}" class="rounded-circle" alt="image">
                        </div>
                        <div class="chat-content">
                            <div class="chat-profile-name">
                                <h6>${senderName} <i class="ti ti-circle-filled fs-7 mx-2"></i><span class="chat-time">${formattedTime}</span>
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
                            <div class="message-bubble-wrap">
                            <div class="message-content">
                                ${forwardedLabel}
                                ${messageData.editedAt ? `<span class="edited-label text-muted" style="font-size:11px;"><i class="ti ti-pencil" style="font-size:10px;"></i> edited</span>` : ""}
                                ${messageData.replyId != "0" ? `<div class="message-reply">${replyContent}</div>` : ""}
                                    ${messageBody}
                                </div>
                                ${reactionsMarkup}
                                </div>
                                <div class="chat-actions">
                                    <a class="#" href="#" data-bs-toggle="dropdown">
                                        <i class="ti ti-dots-vertical"></i>
                                    </a>
                                    <ul class="dropdown-menu dropdown-menu-end p-3">
                                        <li><a class="dropdown-item group-msg-info-btn" href="#"><i class="ti ti-info-circle me-2"></i>Message Info</a></li>
                                        <li><a class="dropdown-item reply-btn" href="#"><i class="ti ti-corner-up-left me-2"></i>Reply</a></li>
                                        <li><a class="dropdown-item forward-btn" href="#"><i class="ti ti-arrow-forward-up me-2"></i>Forward</a></li>
                                        <li><a class="dropdown-item group-favourite-btn" href="#"><i class="ti ti-heart me-2"></i>Mark as Favourite</a></li>
                                        <li><a class="dropdown-item delete-btn" href="#" data-bs-toggle="modal" data-bs-target="#message-delete"><i class="ti ti-trash me-2"></i>Delete</a></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }
        }));

        if (renderGen !== loadGroupMessagesGeneration) return;

        messagesContainer.innerHTML = htmlParts.filter(Boolean).join("");
        groupChatMessageFingerprint.fp = contentFp;
        const groupScrollHost =
            document.getElementById("group-area") || messagesContainer;
        groupScrollHost.scrollTop = groupScrollHost.scrollHeight;
        syncGroupReadReceiptFromSnapshot(
            groupId,
            snapshot,
            loggedInUserId,
            renderGen
        );
    });
}


// Single listener on data/groups (was registered twice: here + a top-level onValue), which raced async
// displayGroups() and duplicated rows. fetchGroups() must only attach once; after sends, refresh via get().
let groupsListenerAttached = false;

function fetchGroups() {
    if (groupsListenerAttached) return;
    groupsListenerAttached = true;
    const groupsRef = ref(database, "data/groups/");
    onValue(groupsRef, (snapshot) => {
        const groups = snapshot.val();
        if (groups && currentUserId) {
            displayGroups(groups, currentUserId);
        }
    });
}

function refreshGroupsList() {
    if (!currentUserId) return;
    const groupsRef = ref(database, "data/groups/");
    get(groupsRef)
        .then((snapshot) => {
            const groups = snapshot.val();
            if (groups) {
                displayGroups(groups, currentUserId);
            }
        })
        .catch(() => {});
}

const secretKey = "89def69f0bdddc995078037539dc6ef4f0bdbdd3fa04ef2d11eea30779d72ac6"; // Replace with your actual secret key

// Group composer: send, attachments, preview, and emoji are handled by firebaseChat.js (same IDs as 1:1 chat).

// Function to upload file to Firebase Storage and get URL
async function uploadFileToFirebase(file) {
    const fileStorageRef = storageRef(storage, `chats/${currentUserId}/${file.name}`);
    await uploadBytes(fileStorageRef, file); // Upload file to Firebase Storage
    const fileUrl = await getDownloadURL(fileStorageRef); // Get the file's URL
    return fileUrl; // Return the uploaded file URL
}

// Helper function to check if text contains emojis
function containsEmoji(text) {
    if(text == 6){
        let text_new = "emoji";
        const emojiRegex = /[\u{1F600}-\u{1F64F}]/u; // Regex to detect emojis
        return emojiRegex.test(text_new);
    } 
    
}

//Audio call
// =========================================================================
//         COMPLETE GROUP AUDIO CALL SCRIPT FOR FIREBASE & AGORA
// =========================================================================
// HTML Requirements:
// 1. An incoming call modal with ID: "audio-call-new-group"
// 2. An active call modal with ID: "audio_group_new"
// 3. Buttons with the IDs used in the 'DOM element references' section below.
// =========================================================================

// Agora and Firebase SDK functions (ensure these are imported in your main script/HTML)
// import { ref, onValue, get, set, update, child, push } from "firebase/database";
// import { auth, database } from "./firebase-config.js";

// -------------------
// CONFIG & INITIALIZATION
// -------------------
// =========================================================================
//         COMPLETE GROUP AUDIO CALL SCRIPT FOR FIREBASE & AGORA
// =========================================================================
// HTML Requirements:
// 1. An incoming call modal with ID: "audio-call-new-group"
// 2. An active call modal with ID: "audio_group_new"
// 3. Buttons with the IDs used in the 'DOM element references' section below.
// =========================================================================

// Agora and Firebase SDK functions (ensure these are imported in your main script/HTML)
// import { ref, onValue, get, set, update, child, push } from "firebase/database";
// import { auth, database } from "./firebase-config.js";

// -------------------
// CONFIG & INITIALIZATION
// -------------------
// =========================================================================
//         COMPLETE GROUP AUDIO CALL SCRIPT FOR FIREBASE & AGORA
// =========================================================================

// -------------------
// CONFIG & INITIALIZATION
// -------------------
// =========================================================================
//         COMPLETE GROUP AUDIO CALL SCRIPT FOR FIREBASE & AGORA
// =========================================================================

// -------------------
// CONFIG & INITIALIZATION
// -------------------
// =================================================================================
//         COMPLETE SCRIPT FOR GROUP AUDIO & VIDEO CALLS (FIREBASE & AGORA)
// =================================================================================

// -------------------
// CONFIG & INITIALIZATION
// -------------------
const APP_ID = "e368b7a2b5d84c34a1b31da838758a32";
let audioClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

// Global state variables
let localAudioTrack = null;
let localVideoTrack = null; // For Video Calls
let callTimerInterval = null;
let currentCallId = null;

// Firebase references
const callRef = ref(database, 'data/calls');
const usersRef = ref(database, 'data/users');

// DOM element references
// Audio Buttons
const audioCallButton = document.getElementById("audio-new-btn-group");
const joinAudioCallButton = document.getElementById('join-audio-group');
const endAudioCallButton = document.getElementById("leave-group-audio");
const muteAudioButton = document.getElementById("mute-audio-group-btn");
const declineAudioCallButton = document.getElementById("decline-audio-group");

// Video Buttons
const videoCallButton = document.getElementById("video-call-new-btn-group"); // ASSUMING this is the ID for the video call button
const joinVideoCallButton = document.getElementById('join-group');
const endVideoCallButton = document.getElementById("leave-group-video1");
const muteVideoButton = document.getElementById("mute-group-btn"); // Audio mute in video call
const disableVideoButton = document.getElementById("video-group-btn"); // Video on/off
const declineVideoCallButton = document.getElementById("decline-group");

// -------------------
// 1. GENERIC CALL INITIATION
// -------------------

/**
 * A generic function to initiate a group call (audio or video).
 * @param {boolean} isVideoCall - True if initiating a video call, false for audio.
 */
async function initiateGroupCall(isVideoCall) {
    if (!selectedGroupId) { console.error("No group selected for the call."); return; }
    const currentUser = auth.currentUser;
    if (!currentUser) { console.error("User not authenticated."); return; }

    try {
        const callerId = currentUser.uid;
        const groupsRef = ref(database, 'data/groups');
        const groupRef = child(groupsRef, selectedGroupId);
        const groupSnapshot = await get(groupRef);
        if (!groupSnapshot.exists()) { console.error("Group does not exist."); return; }
        
        const groupData = groupSnapshot.val();
        const memberIds = groupData.userIds || [];
        if (memberIds.length <= 1) { console.error("Group must have more than one member."); return; }
        const receiverIds = memberIds.filter(id => id !== callerId);
        
        const userDetailPromises = memberIds.map(id => get(child(usersRef, id)));
        const userSnapshots = await Promise.all(userDetailPromises);
        const userDataMap = new Map();
        userSnapshots.forEach(snap => { if (snap.exists()) { userDataMap.set(snap.key, snap.val()); } });
        
        const callerData = userDataMap.get(callerId);
        if (!callerData) { console.error("Could not fetch caller's details."); return; }
        
        const callerMobile = callerData.mobile_number || callerId;
        const newCallId = push(ref(database, 'data/calls')).key;
        const channelName = newCallId;
        const groupNameForCall = groupData.groupName || "Group Call";
        const groupImageForCall = resolveGroupProfileImageUrl(pickGroupAvatarRaw(groupData));

        const baseCallData = {
            callerImg: groupImageForCall, callerName: groupNameForCall, currentMills: Date.now(),
            duration: "Ringing", id: newCallId, type: "group", 
            video: isVideoCall, // The key difference!
            channelName: channelName,
        };
        console.log(isVideoCall);
        const callTypeForNotif = isVideoCall ? "Video" : "Audio";
        const promises = [];
        const callerCallData = { ...baseCallData, inOrOut: "OUT", userId: callerId, callerId: receiverIds };
        promises.push(set(ref(database, `data/calls/${callerId}/${newCallId}`), callerCallData));
        const callerIncomingCallString = `user_type=group&call_type=${isVideoCall ? 'video' : 'audio'}&channelname=${channelName}&caller=${callerMobile}&group=${selectedGroupId}&currentuser=${callerMobile}`;
        promises.push(update(child(usersRef, callerId), { incomingcall: callerIncomingCallString, call_status: false }));

        receiverIds.forEach(receiverId => {
            const participantsForReceiver = memberIds.filter(id => id !== receiverId);
            const receiverCallData = { ...baseCallData, inOrOut: "IN", userId: receiverId, callerId: participantsForReceiver };
            promises.push(set(ref(database, `data/calls/${receiverId}/${newCallId}`), receiverCallData));
            const receiverData = userDataMap.get(receiverId);
            const receiverMobile = receiverData ? (receiverData.mobile_number || receiverId) : receiverId;
            const receiverIncomingCallString = `user_type=group&call_type=${isVideoCall ? 'video' : 'audio'}&channelname=${channelName}&caller=${callerMobile}&group=${selectedGroupId}&currentuser=${receiverMobile}`;
            promises.push(update(child(usersRef, receiverId), { incomingcall: receiverIncomingCallString, call_status: false }));
            sendCallNotification(receiverId, groupNameForCall, `Group ${callTypeForNotif} call`, channelName, groupNameForCall, callerId);
        });

        await Promise.all(promises);
        // Keep caller in ringing state; do not auto-answer.
        // Caller switches to active only after any participant answers.
        currentCallId = newCallId;
        console.log(`Group ${callTypeForNotif} call initiated in ringing state.`);

    } catch (error) {
        console.error(`Failed to initiate group ${isVideoCall ? 'video' : 'audio'} call:`, error);
    }
}

// Attach the generic function to the specific buttons
if (audioCallButton) { audioCallButton.onclick = (e) => { e.preventDefault(); initiateGroupCall(false); }; }
if (videoCallButton) { videoCallButton.onclick = (e) => { e.preventDefault(); initiateGroupCall(true); }; }

// -------------------
// 2. RESPOND TO A CALL (JOIN, DECLINE, LEAVE)
// -------------------

// Generic Join Function
const joinCall = async () => {
    if (!currentCallId) { console.error("No current call to join."); return; }
    const currentUser = auth.currentUser;
    if (!currentUser) return;
  
const callRefNew = ref(database, `data/calls/${currentUser.uid}/${currentCallId}`);

// 1. Update the data in the database
await update(callRefNew, { duration: "00:00:00" });
console.log("Data updated successfully in the DB.");

// 1.5 If this is the first participant answer, move caller OUT record to active.
// This prevents auto-pick at call start and starts only when someone answers.
try {
    const allCallsSnap = await get(ref(database, 'data/calls'));
    if (allCallsSnap.exists()) {
        const allCallsData = allCallsSnap.val() || {};
        const promoteCallerPromises = [];
        for (const uid in allCallsData) {
            const callEntry = allCallsData[uid] && allCallsData[uid][currentCallId];
            if (
                callEntry &&
                callEntry.type === 'group' &&
                callEntry.inOrOut === 'OUT' &&
                callEntry.duration === 'Ringing'
            ) {
                promoteCallerPromises.push(
                    update(ref(database, `data/calls/${uid}/${currentCallId}`), { duration: "00:00:00" })
                );
            }
        }
        if (promoteCallerPromises.length) {
            await Promise.all(promoteCallerPromises);
        }
    }
} catch (err) {
    console.warn('Failed to promote caller to active after participant answer:', err);
}

// 2. Now, FETCH the data from that reference
const snapshot = await get(callRefNew); // <-- Use get() to perform the read

// 3. Check if data exists and then get its value
if (snapshot.exists()) {
  const activeCallData = snapshot.val();
   enterActiveCall(activeCallData, currentUser);
  updateCallUI(myCall, allCalls, currentUser);
  
} else {
  console.log("No data available at this location.");
}
    
};
if (joinAudioCallButton) { joinAudioCallButton.onclick = joinCall; }
if (joinVideoCallButton) { joinVideoCallButton.onclick = joinCall; }

// Generic Decline Function
const declineCall = async () => {
    if (!currentCallId) return;
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    await update(ref(database, `data/calls/${currentUser.uid}/${currentCallId}`), { duration: "Declined" });
    await update(ref(database, `data/users/${currentUser.uid}`), { incomingcall: "", call_status: true });
    cleanUpLocalState();
};
if (declineAudioCallButton) { declineAudioCallButton.onclick = declineCall; }
if (declineVideoCallButton) { declineVideoCallButton.onclick = declineCall; }

// Generic End/Leave Function
const endCall = async () => {
    if (!currentCallId) return;
    const finalDuration = stopCallTimer();
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    await update(ref(database, `data/calls/${currentUser.uid}/${currentCallId}`), { duration: finalDuration });
    await update(ref(database, `data/users/${currentUser.uid}`), { incomingcall: "", call_status: true });
    cleanUpLocalState();
};
if (endAudioCallButton) { endAudioCallButton.onclick = endCall; }
if (endVideoCallButton) { endVideoCallButton.onclick = endCall; }

// Mute Buttons
if (muteAudioButton) {
    let isMuted = false;
    muteAudioButton.onclick = async () => {
        if (localAudioTrack) {
            isMuted = !isMuted;
            await localAudioTrack.setMuted(isMuted);
            muteAudioButton.innerHTML = isMuted ? '<i class="ti ti-microphone-off"></i>' : '<i class="ti ti-microphone"></i>';
        }
    };
}
if (muteVideoButton) {
    let isMuted = false;
    muteVideoButton.onclick = async () => {
        if (localAudioTrack) {
            isMuted = !isMuted;
            await localAudioTrack.setMuted(isMuted);
            muteVideoButton.innerHTML = isMuted ? '<i class="ti ti-microphone-off"></i>' : '<i class="ti ti-microphone"></i>';
        }
    };
}
if (disableVideoButton) {
    let isVideoEnabled = true;
    disableVideoButton.onclick = async () => {
        if (localVideoTrack) {
            isVideoEnabled = !isVideoEnabled;
            await localVideoTrack.setEnabled(isVideoEnabled);
            disableVideoButton.innerHTML = isVideoEnabled ? '<i class="ti ti-video"></i>' : '<i class="ti ti-video-off"></i>';
        }
    };
}


// -------------------
// 3. REAL-TIME LISTENER (THE BRAIN OF THE UI)
// -------------------
onValue(ref(database, 'data/calls'), (snapshot) => {
    const allCalls = snapshot.val();
    const currentUser = auth.currentUser;
    if (!currentUser || !allCalls) {
        if (currentCallId) cleanUpLocalState();
        return;
    }

    let myCall = null;
    let foundCall = false; // Flag to see if we are part of any active call

    if (allCalls[currentUser.uid]) {
        // Find the most relevant call for the current user
        // Priority: Ringing > Active (00:00:00)
        let activeCall = null;
        let ringingCall = null;

        for (const callId in allCalls[currentUser.uid]) {
            const call = allCalls[currentUser.uid][callId];
            if (call.type === "group") {
                // A call is considered 'over' if its duration is a final timestamp, or a specific string
                const isOver = ['Declined', 'Missed'].includes(call.duration) || /^\d{2}:\d{2}:\d{2}$/.test(call.duration) && call.duration !== "00:00:00";
                
                if (!isOver) {
                     if (call.duration === 'Ringing') {
                        ringingCall = call;
                        break; // A ringing call is the highest priority
                    } else {
                        activeCall = call; // It's an ongoing call
                    }
                }
            }
        }
        
        myCall = ringingCall || activeCall;
    }
    

    if (myCall) {
        currentCallId = myCall.id;
        const isRinging = myCall.duration === "Ringing";

        // Update the UI based on the current call state
        updateCallUI(myCall, allCalls, currentUser);
        
        if (isRinging) {
            // 1:1 / legacy call UI must not stack on top of group modals
            $('#start-video-call-container, #video-call, #video_group, #voice-attend-new, #audio-call-modal').modal('hide');
            // Show incoming call modal
            if (myCall.video) {
                $('#audio-call-new-group, #audio_group_new, #video_group_new').modal('hide');
                $('#video-call-new-group').modal('show');
            } else {
                $('#video-call-new-group, #audio_group_new, #video_group_new').modal('hide');
                $('#audio-call-new-group').modal('show');
            }
            if (typeof window !== 'undefined' && window.__dreamchatIncomingCallRing && myCall.inOrOut === 'IN') {
                window.__dreamchatIncomingCallRing.ensure(myCall.id);
            }
        } else {
            if (typeof window !== 'undefined' && window.__dreamchatIncomingCallRing) {
                window.__dreamchatIncomingCallRing.stop();
            }
            // The call is active, enter the call screen
            enterActiveCall(myCall, currentUser);
        }

    } else {
        // No active or ringing call found for the user. Clean up.
        if (typeof window !== 'undefined' && window.__dreamchatIncomingCallRing) {
            window.__dreamchatIncomingCallRing.stop();
        }
        if (currentCallId) {
            cleanUpLocalState();
        }
    }
});


// -------------------
// 4. HELPER FUNCTIONS
// -------------------

function enterActiveCall(callData, currentUser) {
    console.log(callData);
    // Join Agora channel only once
    if (!localAudioTrack && !localVideoTrack) {
        joinAgoraChannel(callData.channelName, currentUser.userId, callData.video);
        startCallTimer();
    }
    // Show the correct active call modal
    $('#start-video-call-container, #video-call, #video_group, #voice-attend-new, #audio-call-modal').modal('hide');
    if (callData.video) {
        $('#audio-call-new-group, #video-call-new-group, #audio_group_new').modal('hide');
        $('#video_group_new').modal('show');
    } else {
        $('#audio-call-new-group, #video-call-new-group, #video_group_new').modal('hide');
        $('#audio_group_new').modal('show');
    }
}

async function updateCallUI(myCallData, allCalls, currentUser) {
    const groupName = myCallData.callerName;
    const groupImage = myCallData.callerImg;

    if (myCallData.video) {
        $('#video-call-new-group .group-video-call-ring-name').text(groupName);
        $('#video-call-new-group .group-video-call-ring-avatar').attr('src', groupImage).attr('alt', groupName);
        const ringTitle = $('#video-call-new-group .group-video-ring-title');
        if (ringTitle.length) {
            ringTitle.text(
                myCallData.inOrOut === 'IN'
                    ? 'Incoming video call'
                    : `Calling ${groupName}…`
            );
        }
        const ringStatus = document.getElementById('group-video-ring-status');
        if (ringStatus) {
            ringStatus.textContent =
                myCallData.duration === 'Ringing' ? 'Ringing…' : '';
        }
        $('#video_group_new #group-video-head-name').text(groupName);
        $('#video_group_new #group-video-head-avatar').attr('src', groupImage).attr('alt', groupName);
        
        // You would also update the remote video users here in a similar way to audio
        // For example, by iterating through 'allCalls' and finding active video participants.

    } else {
        // --- AUDIO CALL UI LOGIC ---

        $('#audio-call-new-group .audio-name').text(groupName);
        $('#audio-call-new-group .avatar-audio img').attr('src', groupImage).attr('alt', groupName);
        const audioRingTitle = $('#audio-call-new-group .group-audio-ring-title');
        const audioRingAnswerBtn = $('#audio-call-new-group .group-audio-answer-btn');
        if (audioRingTitle.length) {
            audioRingTitle.text(myCallData.inOrOut === 'IN' ? 'Incoming audio call' : 'Calling…');
        }
        if (audioRingAnswerBtn.length) {
            if (myCallData.inOrOut === 'IN') {
                audioRingAnswerBtn.removeClass('d-none');
            } else {
                audioRingAnswerBtn.addClass('d-none');
            }
        }
        $('#group-audio-head-name').text(groupName);
        $('#group-audio-head-avatar').attr('src', groupImage).attr('alt', groupName);

        // Update Active AUDIO Call Modal
        const userSnap = await get(child(usersRef, currentUser.uid));
        if (userSnap.exists()) {
            const userData = userSnap.val();
            // This is YOU (the local user) — prefer Laravel profile when Firebase has no image
            const laravelSelf =
                typeof window !== "undefined" &&
                window.LARAVEL_USER &&
                (window.LARAVEL_USER.profile_image || window.LARAVEL_USER.image)
                    ? String(
                          window.LARAVEL_USER.profile_image ||
                              window.LARAVEL_USER.image
                      ).trim()
                    : "";
            const firebaseSelf =
                (userData.profile_image && String(userData.profile_image).trim()) ||
                userData.image ||
                "";
            $('#local-user-avatar').attr(
                'src',
                resolveGroupProfileImageUrl(laravelSelf || firebaseSelf || "")
            );
            $('#local-user-name').text(`${userData.firstName} ${userData.lastName}`.trim() || 'You');
        }

        // --- CORE FIX FOR REMOTE USERS ---
        const remoteUsersContainer = $('#remote-users-container');
        remoteUsersContainer.empty(); // Clear previous participants
        
        const remoteParticipantPromises = [];
        
        // Find all users who are part of the current call
        for (const userId in allCalls) {
            // Skip the current user, they are handled as the "local user"
            if (userId === currentUser.uid) continue;

            const userCalls = allCalls[userId];
            // Check if this user has a record for our current call
            if (userCalls && userCalls[currentCallId]) {
                const participantCallData = userCalls[currentCallId];
                
                // A participant is "active" if their duration is NOT Ringing, Declined, or Missed.
                // This correctly includes "00:00:00" and any future running timer values.
                const isActiveParticipant = !['Ringing', 'Declined', 'Missed'].includes(participantCallData.duration);
                
                if (isActiveParticipant) {
                    // If they are active, fetch their user details to display
                    remoteParticipantPromises.push(get(child(usersRef, userId)));
                }
            }
        }

        const remoteSnapshots = await Promise.all(remoteParticipantPromises);
        
        if(remoteSnapshots.length > 0) {
            const remoteUsersRow = $('<div class="row"></div>');
            remoteUsersContainer.append(remoteUsersRow);

            remoteSnapshots.forEach(snap => {
                if (snap.exists()) {
                    const userData = snap.val();
                    const userName = `${userData.firstName} ${userData.lastName}`.trim() || 'Guest';
                    const userImage = resolveGroupProfileImageUrl(
                        rawAvatarFromUserAndContact(userData, null)
                    );
                    const userHtml = `
                        <div class="col-12 mb-3">
                            <div class="card audio-crd bg-transparent-dark border h-100 pt-4">
                                <div class="modal-bgimg">
                                    <span class="modal-bg1"><img src="assets/img/bg/bg-02.png" class="img-fluid" alt="bg"></span>
                                    <span class="modal-bg2"><img src="assets/img/bg/bg-03.png" class="img-fluid" alt="bg"></span>
                                </div>
                                <div class="card-body">
                                    <div class="d-flex justify-content-center align-items-center">
                                        <span class="avatar avatar-xxxl bg-soft-primary rounded-circle p-2">
                                            <img src="${userImage}" class="rounded-circle" alt="${userName}">
                                        </span>
                                        <div class="d-flex audio-group-m-name align-items-end justify-content-end">
                                            <span class="badge badge-info">${userName}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>`;
                    remoteUsersRow.append(userHtml);
                }
            });
        }
    }
}

function getGroupVideoRemoteListEl() {
    return (
        document.getElementById("group-remote-playerlist") ||
        document.getElementById("remote-playerlist")
    );
}

function getGroupVideoLocalPlayTarget() {
    return document.getElementById("group-local-player")
        ? "group-local-player"
        : "local-player";
}

async function joinAgoraChannel(channelName, uid, isVideo) {
    try {
        // Handle publishing
        const tracksToPublish = [];
        localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        tracksToPublish.push(localAudioTrack);

        if (isVideo) {
            localVideoTrack = await AgoraRTC.createCameraVideoTrack();
            tracksToPublish.push(localVideoTrack);
        }

        await audioClient.join(APP_ID, channelName, null, uid);
        await audioClient.publish(tracksToPublish);

        // Play local video if it exists (same pip target pattern as 1:1 chat)
        if (localVideoTrack) {
            localVideoTrack.play(getGroupVideoLocalPlayTarget());
        }
        
        // Alternative approach: Use user-joined event instead of user-published for group calls
        audioClient.on("user-joined", async (user) => {
            console.log(`Group user ${user.uid} joined the channel ${channelName}`);
            
            try {
                // Subscribe to both audio and video immediately when user joins
                await audioClient.subscribe(user, "audio");
                if (isVideo) {
                    await audioClient.subscribe(user, "video");
                }
                console.log(`Successfully subscribed to media for user ${user.uid}`);
                
                // Store user info for better tracking
                if (!window.agoraGroupUsers) window.agoraGroupUsers = {};
                window.agoraGroupUsers[user.uid] = {
                    uid: user.uid,
                    channelName: channelName,
                    appId: APP_ID,
                    joinedAt: Date.now(),
                    isVideo: isVideo
                };
                
                // Handle audio
                if (user.audioTrack) {
                    console.log(`Playing audio for group user ${user.uid}`);
                    user.audioTrack.play().catch((error) => {
                        console.error(`Audio playback failed for user ${user.uid}:`, error);
                    });
                }
                
                // Handle video
                if (isVideo && user.videoTrack) {
                    console.log(`Playing video for group user ${user.uid}`);
                    let remotePlayerContainer = document.getElementById(`player-container-${user.uid}`);
                    if (!remotePlayerContainer) {
                        remotePlayerContainer = document.createElement('div');
                        remotePlayerContainer.id = `player-container-${user.uid}`;
                        remotePlayerContainer.className = 'col-6 player-wrapper mb-3';
                        const listEl = getGroupVideoRemoteListEl();
                        if (listEl) listEl.append(remotePlayerContainer);
                    }
                    user.videoTrack.play(remotePlayerContainer);
                }
                
            } catch (error) {
                console.error(`Failed to subscribe to group user ${user.uid}:`, error);
            }
        });
        
        // Keep original event listeners as fallback
        audioClient.on("user-published", async (user, mediaType) => {
            await audioClient.subscribe(user, mediaType);
            if (mediaType === "audio") {
                user.audioTrack.play();
            }
            if (mediaType === "video") {
                let remotePlayerContainer = document.getElementById(`player-container-${user.uid}`);
                if (!remotePlayerContainer) {
                    remotePlayerContainer = document.createElement('div');
                    remotePlayerContainer.id = `player-container-${user.uid}`;
                    remotePlayerContainer.className = 'col-6 player-wrapper mb-3'; // Bootstrap class for 2-column layout
                    const listEl = getGroupVideoRemoteListEl();
                    if (listEl) listEl.append(remotePlayerContainer);
                }
                user.videoTrack.play(remotePlayerContainer);
            }
        });

        audioClient.on("user-left", (user) => {
            console.log(`Group user ${user.uid} left the channel ${channelName}`);
            const remotePlayerContainer = document.getElementById(`player-container-${user.uid}`);
            if (remotePlayerContainer) {
                remotePlayerContainer.remove();
            }
            
            // Clean up user tracking
            if (window.agoraGroupUsers && window.agoraGroupUsers[user.uid]) {
                delete window.agoraGroupUsers[user.uid];
            }
        });
        
        // Additional event listeners for better user tracking
        audioClient.on("user-unpublished", (user, mediaType) => {
            console.log(`Group user ${user.uid} unpublished ${mediaType} in channel ${channelName}`);
        });
        
        // Log all users in the channel
        audioClient.on("user-list-updated", (users) => {
            console.log(`Group users in channel ${channelName}:`, users.map(u => u.uid));
        });
        
        // Manual subscription check every few seconds for group calls
        const groupManualSubscriptionInterval = setInterval(async () => {
            try {
                const remoteUsers = audioClient.remoteUsers;
                console.log(`Group manual check - Remote users in channel:`, remoteUsers.map(u => u.uid));
                
                for (const remoteUser of remoteUsers) {
                    if ((remoteUser.hasAudio && !remoteUser.audioTrack) || 
                        (isVideo && remoteUser.hasVideo && !remoteUser.videoTrack)) {
                        console.log(`Attempting manual subscription to group user ${remoteUser.uid}`);
                        
                        if (remoteUser.hasAudio && !remoteUser.audioTrack) {
                            await audioClient.subscribe(remoteUser, "audio");
                        }
                        if (isVideo && remoteUser.hasVideo && !remoteUser.videoTrack) {
                            await audioClient.subscribe(remoteUser, "video");
                        }
                        
                        // Handle display after subscription
                        if (remoteUser.audioTrack || remoteUser.videoTrack) {
                            handleGroupUserDisplay(remoteUser, isVideo);
                        }
                    }
                }
            } catch (error) {
                console.error("Group manual subscription check error:", error);
            }
        }, 3000); // Check every 3 seconds
        
        // Store interval ID for cleanup
        if (!window.agoraIntervals) window.agoraIntervals = {};
        window.agoraIntervals[`group_${channelName}`] = groupManualSubscriptionInterval;

    } catch (error) { console.error("Agora Join Error:", error); }
}

// Helper function to handle group user display after subscription
function handleGroupUserDisplay(remoteUser, isVideo) {
    // Handle audio
    console.log(`Handling display for group user ${remoteUser.uid}`);
    if (remoteUser.audioTrack) {
        console.log(`Playing audio for group user ${remoteUser.uid}`);
        remoteUser.audioTrack.play().catch(error => {
            console.error(`Audio playback failed for group user ${remoteUser.uid}:`, error);
        });
    }
    
    // Handle video
    if (isVideo && remoteUser.videoTrack) {
        console.log(`Playing video for group user ${remoteUser.uid}`);
        let remotePlayerContainer = document.getElementById(`player-container-${remoteUser.uid}`);
        if (!remotePlayerContainer) {
            remotePlayerContainer = document.createElement('div');
            remotePlayerContainer.id = `player-container-${remoteUser.uid}`;
            remotePlayerContainer.className = 'col-6 player-wrapper mb-3';
            const listEl = getGroupVideoRemoteListEl();
            if (listEl) listEl.append(remotePlayerContainer);
        }
        remoteUser.videoTrack.play(remotePlayerContainer);
    }
}

function cleanUpLocalState() {
    if (typeof window !== 'undefined' && window.__dreamchatIncomingCallRing) {
        window.__dreamchatIncomingCallRing.stop();
    }
    stopCallTimer();
    if (localAudioTrack) {
        localAudioTrack.stop();
        localAudioTrack.close();
        localAudioTrack = null;
    }
    if (localVideoTrack) {
        localVideoTrack.stop();
        localVideoTrack.close();
        localVideoTrack = null;
    }
    
    // Unsubscribe from events to prevent memory leaks
    audioClient.off("user-published");
    audioClient.off("user-joined");
    audioClient.off("user-left");
    audioClient.off("user-unpublished");
    audioClient.off("user-list-updated");
    
    if (audioClient.connectionState === 'CONNECTED' || audioClient.connectionState === 'CONNECTING') {
        audioClient.leave().catch(e => console.error("Agora leave error:", e));
    }
    
    // Clean up group intervals
    if (window.agoraIntervals) {
        Object.keys(window.agoraIntervals).forEach(key => {
            if (key.startsWith('group_')) {
                clearInterval(window.agoraIntervals[key]);
                delete window.agoraIntervals[key];
            }
        });
    }
    
    // Clean up group users tracking
    if (window.agoraGroupUsers) {
        window.agoraGroupUsers = {};
    }

    // Hide all possible call modals (group + any 1:1 UI that may have opened)
    $('#audio-call-new-group, #audio_group_new, #video-call-new-group, #video_group_new').modal('hide');
    $('#start-video-call-container, #video-call, #video_group, #voice-attend-new, #audio-call-modal').modal('hide');
    currentCallId = null;
    const currentUser = auth.currentUser;
    if (currentUser) {
        update(ref(database, `data/users/${currentUser.uid}`), {
            incomingcall: "",
            call_status: true
        }).catch(console.error);
    }
}

// (Other helper functions like startCallTimer, stopCallTimer, sendCallNotification are unchanged)
function startCallTimer() {
    let seconds = 0;
    const timerEls = [
        document.getElementById('group-call-timer-display'),
        document.getElementById('group-video-call-timer'),
        document.getElementById('call-timer-display'),
    ].filter(Boolean);
    if (!timerEls.length) return;
    if (callTimerInterval) clearInterval(callTimerInterval);
    const tick = `${formatCallTick(seconds)}`;
    timerEls.forEach((el) => {
        el.textContent = tick;
    });
    callTimerInterval = setInterval(() => {
        seconds++;
        const text = formatCallTick(seconds);
        timerEls.forEach((el) => {
            el.textContent = text;
        });
    }, 1000);
}

function formatCallTick(seconds) {
    const format = (val) => `0${Math.floor(val)}`.slice(-2);
    const hours = seconds / 3600;
    const minutes = (seconds % 3600) / 60;
    return `${format(hours)}:${format(minutes)}:${format(seconds % 60)}`;
}

function stopCallTimer() {
    clearInterval(callTimerInterval);
    const el =
        document.getElementById('group-call-timer-display') ||
        document.getElementById('group-video-call-timer') ||
        document.getElementById('call-timer-display');
    return el ? el.textContent : "00:00:00";
}

async function sendCallNotification(toId, fromId, title, channelName, callerName, callerId) {
    try {
        const snapshot = await get(ref(database, `data/users/${toId}/deviceToken`));
        if (!snapshot.exists()) { console.error(`Device token not found for user: ${toId}`); return; }
        const deviceToken = snapshot.val();
        await fetch('/api/send-call-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ body: fromId, toId, fromId: callerId, callerName, title, channelName, device_token: deviceToken })
        });
    } catch (error) { console.error('Error sending notification:', error); }
}

/**
 * Sends a message to a group chat, handling both new messages and replies.
 * This corrected version ensures the message ID is always included in the message data
 * and uses the 'set' method for a more efficient database write.
 *
 * @param {string} groupId - The ID of the group to send the message to.
 * @param {string|object} messageText - The message content (text or file object).
 * @param {string|number} messageType - The type of the message (e.g., 6 for text).
 * @param {string|null} fileUrl - The URL if the message is a file (deprecated, part of messageText object).
 */
async function sendGroupMessage(groupId, messageText, messageType = 'text', fileUrl = null) {
    highlightActiveGroup(groupId);

    if (!currentUserId || !groupId) {
        console.error("User or Group ID is missing.");
        return;
    }

    try {
        const groupMembersRef = ref(database, `data/groups/${groupId}/userIds`);
        const snapshot = await get(groupMembersRef);

        if (!snapshot.exists()) {
            console.error("Group members not found for groupId:", groupId);
            return;
        }

        const members = snapshot.val();
        
        // ====================================================================
        // FIX 1: Generate the unique key for the new message FIRST.
        // This creates the ID like "-OWyMi80lk7dqzQuZiu0".
        // ====================================================================
        const messagesCollectionRef = ref(database, `data/chats/${groupId}`);
        const newMessageKey = push(messagesCollectionRef).key;

        // ====================================================================
        // FIX 2: Create the base message object and immediately assign the
        // generated key to the 'id' field.
        // ====================================================================
        let messageData = {
            id: newMessageKey, // <-- THIS IS THE CORRECTION YOU ASKED FOR.
            sender: currentUserId,
            senderId: currentUserId,
            groupId: groupId,
            timestamp: Date.now(),
            date: Date.now(),
            attachmentType: messageType,
            delivered: false,
            readMsg: false,
            blocked: false,
            sent: true,
            userIds: members,
            replyId: "0",
        };

        // Add 'body' for text messages or 'attachment' for files.
        if (messageType == 6) { // Assuming 6 is for text messages
            messageData.body = messageText;
        } else {
            messageData.attachment = messageText;
        }

        let finalMessageData = messageData;

        // Handle replies, ensuring the correct ID is carried over.
        if (replyToMessage) {
            if (!replyToMessage.body) {
                console.error("Invalid reply content.");
                return;
            }

            const replyType = replyToMessage.attachmentType || "unknown";
            let replyContent = "";

            if (replyType == 6) {
                 replyContent = replyToMessage.body || "No content";
            } else if (['2', '3', '1', '5', '8'].includes(replyType.toString())) {
                 replyContent = replyToMessage.attachment?.url || `${replyType} content missing`;
            } else {
                 replyContent = "Unsupported message type";
            }
            
            let encryptedReplyContent;
            if (replyType == 6) {
                encryptedReplyContent = await encryptMessage(replyContent);
            } else {
                encryptedReplyContent = replyContent;
            }

            // Create the final reply message object, spreading the original
            // messageData to include the correct 'id'.
            finalMessageData = {
                ...messageData,
                isReply: true,
                replyId: replyToMessage.key || "0",
                replyContent: encryptedReplyContent,
                replyUser: replyToMessage.from, // 'from' should be senderId of the original message
                replyType: replyType,
                replyTimestamp: replyToMessage.timestamp || Date.now(),
                originalMessage: replyContent,
            };
        }

        // ====================================================================
        // FIX 3: Use `set` with the specific path including the `newMessageKey`.
        // This ensures the object is saved under the key we generated.
        // ====================================================================
        const newMessageRef = ref(database, `data/chats/${groupId}/${newMessageKey}`);
        await set(newMessageRef, finalMessageData);

        try {
            await update(ref(database, `data/groups/${groupId}`), {
                lastMessageAt: Date.now(),
            });
        } catch (e) {
            if (typeof console !== "undefined" && console.warn) {
                console.warn("Group lastMessageAt update failed (sidebar may lag):", e);
            }
        }

        // --- UI and State Updates after successful send ---
        if (replyToMessage) {
            closeReplyBox();
            document.getElementById("message-input").value = "";
            replyToMessage = null;
        } else {
            const messageInputGroup = document.getElementById("message-input");
            const fileInputGroup = document.getElementById("files");
            const messagePreviewEl = document.getElementById("message-preview");
            if (messageInputGroup) messageInputGroup.value = "";
            if (fileInputGroup) fileInputGroup.value = "";
            if (messagePreviewEl) messagePreviewEl.innerHTML = "";
        }
        
        highlightActiveGroup(groupId);
        refreshGroupsList(); // Re-render list (latest message); do not re-attach onValue

    } catch (error) {
        console.error("Error sending group message:", error);
    }
}

if (typeof window !== "undefined") {
    window.__dreamchatSendGroupMessage = sendGroupMessage;
}

let pendingGroupDelete = { messageKey: "", groupId: "" };

document.addEventListener("click", (e) => {
    if (e.target.classList.contains("delete-btn")) {
        e.preventDefault();
        const messageElement = e.target.closest(".chats");
        if (!messageElement) return;
        const messageKey = messageElement.dataset.messageKey; // Unique message key
        const groupIdkey = messageElement.dataset.groupId; // Get the group ID
        // Ignore one-to-one chat delete buttons handled in firebaseChat.js
        if (!groupIdkey) return;
        if (!messageKey || !groupIdkey) return;

        pendingGroupDelete = { messageKey: messageKey, groupId: groupIdkey };

        const messageToDeleteInput = document.getElementById("message-to-delete");
        const groupIdInput = document.getElementById("group-id");
        // Populate hidden inputs in the form
        if (messageToDeleteInput) messageToDeleteInput.value = messageKey;
        if (groupIdInput) groupIdInput.value = groupIdkey;
    
        const messageRef = ref(database, `data/chats/${groupIdkey}/${messageKey}`);
  
        // Fetch the message details from Firebase
        get(messageRef)
            .then((snapshot) => {
                if (snapshot.exists()) {
                    const message = snapshot.val();
                    // Check if senderId matches current user ID
                    if (message.senderId == currentUserId) {
                        // Hide the "Delete For Everyone" option
                        const deleteForEveryoneDiv = document.getElementById('delete-for-everyone-group');
                        if (deleteForEveryoneDiv) {
                            deleteForEveryoneDiv.style.display = 'block';
                        }
                    } else {
                        // Ensure the "Delete For Everyone" option is visible
                        const deleteForEveryoneDiv = document.getElementById('delete-for-everyone-group');
                        if (deleteForEveryoneDiv) {
                            deleteForEveryoneDiv.style.display = 'none';
                        }
                    }
                } else {
                    console.error('Message not found in Firebase');
                }
            })
            .catch((error) => {
                console.error('Error fetching message details:', error);
            });
    }

    const favBtn = e.target.closest(".group-favourite-btn");
    if (favBtn) {
        e.preventDefault();
        const messageElement = favBtn.closest(".chats");
        if (!messageElement || !currentUserId) return;
        const messageKey = messageElement.getAttribute("data-message-key");
        const gid = messageElement.getAttribute("data-group-id");
        if (!messageKey || !gid) return;
        const type = messageElement.getAttribute("data-type") || "6";
        let preview = "Message";
        const contentRoot = messageElement.querySelector(".message-content");
        if (contentRoot) {
            const textDiv = contentRoot.querySelector("div:not(.message-reply)");
            if (textDiv) preview = textDiv.innerText.trim().slice(0, 500) || preview;
        }
        favouriteMessageForGroup(gid, messageKey, preview, type);
    }
});

function favouriteMessageForGroup(groupId, messageKey, preview, attachmentType) {
    if (!currentUserId || !groupId || !messageKey) return;
    const msgRef = ref(
        database,
        `data/users/${currentUserId}/group_favourite_messages/${groupId}/${messageKey}`
    );
    get(msgRef)
        .then((snap) => {
            if (snap.exists()) {
                if (typeof Toastify !== "undefined") {
                    Toastify({
                        text: "Message already in Favorites",
                        duration: 2500,
                        gravity: "top",
                        position: "right",
                        backgroundColor: "#dc3545",
                    }).showToast();
                }
                return Promise.resolve(null);
            }
            return set(msgRef, {
                savedAt: Date.now(),
                preview: String(preview || "").slice(0, 500),
                attachmentType: attachmentType != null ? String(attachmentType) : "6",
            });
        })
        .then((written) => {
            if (written === null) return;
            if (typeof Toastify !== "undefined") {
                Toastify({
                    text: "Message saved to Favorites",
                    duration: 2500,
                    gravity: "top",
                    position: "right",
                    backgroundColor: "#28a745",
                }).showToast();
            }
            refreshGroupFavouritesBadgeCount();
            const col = document.getElementById("group-collapse-favourites");
            if (col && col.classList.contains("show")) {
                loadGroupFavouritesList(col);
            }
        })
        .catch(() => {});
}

async function refreshGroupFavouritesBadgeCount() {
    const badge = document.getElementById("group-favourites-badge");
    if (!badge || !currentUserId || !selectedGroupId) {
        if (badge) badge.classList.add("d-none");
        return;
    }
    try {
        const snap = await get(
            ref(
                database,
                `data/users/${currentUserId}/group_favourite_messages/${selectedGroupId}`
            )
        );
        const n = snap.exists() ? Object.keys(snap.val()).length : 0;
        badge.textContent = String(n);
        badge.classList.toggle("d-none", n === 0);
    } catch (e) {
        badge.classList.add("d-none");
    }
}

function scrollChatToSavedGroupMessage(messageKey) {
    if (!messageKey) return;
    const el = document.querySelector(`#group-area .chats[data-message-key="${messageKey}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    const offcanvasEl = document.getElementById("contact-profile");
    if (offcanvasEl && typeof bootstrap !== "undefined") {
        const inst = bootstrap.Offcanvas.getInstance(offcanvasEl);
        if (inst) inst.hide();
    }
    const favCol = document.getElementById("group-collapse-favourites");
    if (favCol && typeof bootstrap !== "undefined") {
        const c = bootstrap.Collapse.getInstance(favCol);
        if (c) c.hide();
    }
}

async function loadGroupFavouritesList(collapseEl) {
    const loadingEl = collapseEl.querySelector(".others-loading");
    const emptyEl = collapseEl.querySelector(".others-empty");
    const listEl = document.getElementById("group-favourites-list");
    if (!listEl || !currentUserId || !selectedGroupId) return;
    listEl.innerHTML = "";
    if (loadingEl) loadingEl.classList.remove("d-none");
    if (emptyEl) emptyEl.classList.add("d-none");
    try {
        const snap = await get(
            ref(
                database,
                `data/users/${currentUserId}/group_favourite_messages/${selectedGroupId}`
            )
        );
        if (loadingEl) loadingEl.classList.add("d-none");
        if (!snap.exists()) {
            if (emptyEl) emptyEl.classList.remove("d-none");
            return;
        }
        const favs = snap.val();
        const rows = [];
        for (const messageKey in favs) {
            const f = favs[messageKey];
            if (!f || typeof f !== "object") continue;
            rows.push({
                messageKey,
                preview: (f.preview && String(f.preview).trim()) || "Message",
                savedAt: Number(f.savedAt) || 0,
            });
        }
        rows.sort((a, b) => b.savedAt - a.savedAt);
        if (rows.length === 0) {
            if (emptyEl) emptyEl.classList.remove("d-none");
            return;
        }
        rows.forEach(({ messageKey, preview, savedAt }) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className =
                "list-group-item list-group-item-action border-0 px-0 py-2 text-start w-100";
            btn.dataset.messageKey = messageKey;
            const title = document.createElement("div");
            title.className = "small fw-medium text-truncate";
            title.textContent = preview;
            btn.appendChild(title);
            if (savedAt) {
                const sub = document.createElement("div");
                sub.className = "text-muted";
                sub.style.fontSize = "0.75rem";
                sub.textContent = new Date(savedAt).toLocaleString();
                btn.appendChild(sub);
            }
            btn.addEventListener("click", () => scrollChatToSavedGroupMessage(messageKey));
            listEl.appendChild(btn);
        });
    } catch (e) {
        if (loadingEl) loadingEl.classList.add("d-none");
        if (emptyEl) emptyEl.classList.remove("d-none");
    }
}

// Function to delete message locally (from the DOM)
function deleteForMe(messageElement, messageKey, groupId) {
    // Update Firebase to mark message as deleted for the current user
    const messageRef = ref(database, `data/chats/${groupId}/${messageKey}`);

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
                //console.log("Message already marked as deleted for this user.");
                return Promise.resolve(); // No update needed
            }
        } else {
            console.error("Message does not exist at path:", messageRef.toString());
            //console.error("Message does not exist.");
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

// Function to delete message for everyone from Firebase
function deleteForEveryone(messageKey, messageElement, groupId) {
    const messageRef = ref(database, `data/chats/${groupId}/${messageKey}`);
    remove(messageRef).then(() => {
        if (messageElement) messageElement.remove();
    }).catch((error) => {
        console.error("Error deleting for everyone:", error);
    });
}


// Event listener for the form submission (delete chat form) - only when group chat DOM exists
const deleteChatForm = document.getElementById("delete-chat-form");
if (deleteChatForm) {
    deleteChatForm.addEventListener("submit", (e) => {
        e.preventDefault(); // Prevent form default behavior

        const submitter =
            typeof SubmitEvent !== "undefined" && e instanceof SubmitEvent
                ? e.submitter
                : null;
        if (submitter && typeof submitter.blur === "function") {
            submitter.blur();
        }

        const messageToDeleteInput = document.getElementById("message-to-delete");
        const groupIdInput = document.getElementById("group-id");
        const messageKey =
            (messageToDeleteInput && messageToDeleteInput.value) ||
            pendingGroupDelete.messageKey ||
            "";
        const groupId =
            (groupIdInput && groupIdInput.value) ||
            pendingGroupDelete.groupId ||
            "";
        if (!messageKey || !groupId) return;

        const selectedAction = document.querySelector('input[name="delete-chat"]:checked');
        if (!selectedAction) {
            console.warn("No delete action selected.");
            return;
        }
        const action = selectedAction.id;
        
        // Ensure you're selecting the message element using messageKey
        const messageElement = document.querySelector(`[data-message-key="${messageKey}"]`);
        
        if (action === "delete-for-me") {
            deleteForMe(messageElement, messageKey, groupId);
        } else if (action === "delete-for-everyone") {
            deleteForEveryone(messageKey, messageElement, groupId);  // Pass the messageKey directly
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
            const modalH =
                bootstrap.Modal.getInstance(modalEl) ||
                (typeof bootstrap.Modal.getOrCreateInstance === "function"
                    ? bootstrap.Modal.getOrCreateInstance(modalEl)
                    : null);
            if (modalH) {
                const focusSink = document.createElement("button");
                focusSink.type = "button";
                focusSink.setAttribute("tabindex", "-1");
                focusSink.setAttribute("aria-hidden", "true");
                focusSink.style.cssText =
                    "position:fixed;left:-10000px;width:1px;height:1px;overflow:hidden;";
                document.body.appendChild(focusSink);
                focusSink.focus();
                let cleaned = false;
                const cleanup = () => {
                    if (cleaned) return;
                    cleaned = true;
                    modalEl.removeEventListener("hidden.bs.modal", onHidden);
                    clearTimeout(fallbackTimer);
                    focusSink.remove();
                    pendingGroupDelete = { messageKey: "", groupId: "" };
                };
                const onHidden = () => cleanup();
                const fallbackTimer = setTimeout(cleanup, 2000);
                modalEl.addEventListener("hidden.bs.modal", onHidden);
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        modalH.hide();
                    });
                });
            } else {
                pendingGroupDelete = { messageKey: "", groupId: "" };
            }
        } else {
            pendingGroupDelete = { messageKey: "", groupId: "" };
        }
    });
}


let replyToMessage = null; // To store the replied message content

// Event listener for the reply button
document.addEventListener("click", (e) => {
    if (e.target.classList.contains("reply-btn")) {
        const messageElement = e.target.closest(".chats");
      
        // Extract user and type information
        const replyUser = "";
        const replyType = messageElement.dataset.type || 6; // Extract type from a data attribute

        let replyContent = ""; // To hold the reply content
        let mediaUrl = null; // To hold the media URL if applicable
        // Handle different message types
        if (replyType === "6" ) {
            replyContent = messageElement.querySelector(".message-content > div:not(.message-reply)").innerText.trim();
        } else if (replyType === "2") {
            const imgElement = messageElement.querySelector(".message-content img");
            if (imgElement) {
                mediaUrl = imgElement.src;
                replyContent = `<img src="${mediaUrl}" alt="Image Reply" class="reply-image" style="max-width: 100px; max-height: 100px;">`;
            }
        } else if (replyType === "1") {
            const videoElement = messageElement.querySelector(".message-content video");
            if (videoElement) {
                mediaUrl = videoElement.src;
                replyContent = `<video src="${mediaUrl}" controls class="reply-video" style="max-width: 100px; max-height: 100px;"></video>`;
            }
        } else if (replyType === "3") {
            const audioElement = messageElement.querySelector(".message-content audio");
            if (audioElement) {
                mediaUrl = audioElement.src;
                replyContent = `<audio src="${mediaUrl}" controls class="reply-audio"></audio>`;
            }
        } else if (replyType === "5") {
            const fileElement = messageElement.querySelector(".message-content a");
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
            if (["2", "1", "3", "5"].includes(replyType)) {
                replyContentElement.innerHTML = replyContent;
            } else {
                replyContentElement.innerText = replyContent;
            }
        } else {
            console.error("Reply box or content elements not found in the DOM.");
        }

        let attachment = {
            url : replyContent,
        }

        // Store the replied message with necessary details
        replyToMessage = {
            key: messageElement.dataset.messageKey,
            body: replyContent,
            from: replyUser,
            attachmentType: replyType, // Store the type of the original message
            attachment: attachment,
        };

   
    }
});

const closeReplyEl = document.getElementById("closeReply");
if (closeReplyEl) {
    closeReplyEl.onclick = () => {
        closeReplyBox();
    };
}

 
    // Close Reply Box
    function closeReplyBox() {
        const rd = document.getElementById("reply-div");
        if (rd) rd.style.display = "none";
        replyToMessage = null; // Reset the replied message
    }
    if (typeof window !== "undefined") {
        window.closeReplyBox = closeReplyBox;
    }

    let forwardContent = null;
    document.addEventListener("click", (e) => {
        const forwardBtn = e.target.closest(".forward-btn");
        if (forwardBtn) {
            // Keep group forwarding isolated to group chat area only.
            if (!forwardBtn.closest("#group-area")) return;
            e.preventDefault();
            const messageElement = forwardBtn.closest(".chats");
            if (!messageElement) return;
            const messageContentElement = messageElement.querySelector(".message-content");
            if (!messageContentElement) return;
            const messageKey = messageElement.getAttribute("data-message-key");
    
            let forwardContent = {
                key: messageKey,
                body: "",
                media: null,
            };
    
            const forwardedLabel = messageContentElement.querySelector(".forwarded-label");
            if (forwardedLabel) {
                forwardedLabel.remove();
            }
    
            const defaultMessageContent = messageContentElement.querySelector("div:not(.message-reply)");
            if (defaultMessageContent) {
                forwardContent.body = defaultMessageContent.textContent.trim(); // Safely handle emojis and text
            }
    
        
    
            const file = messageContentElement.querySelector("a");
  
            if (file) {
        
                const fileURL = file.getAttribute("href");
                forwardContent.body = {
                    url : fileURL,
                };
                forwardContent.media = { 
                    attachmentType: 5, 
                    src: fileURL 
                };
            } else if (!forwardContent.body) {
           
                const audio = messageContentElement.querySelector("audio");
                const video = messageContentElement.querySelector("video");
                const img = messageContentElement.querySelector("img");
    
                if (audio) {
                    forwardContent.body = {
                        url : audio.getAttribute("src"),
                    };
                    forwardContent.media = { 
                        attachmentType: 3, 
                        src: audio.getAttribute("src") 
                    };
                } else if (video) {
                    forwardContent.body = {
                        url : video.getAttribute("src"),
                    };
                    forwardContent.media = { 
                        attachmentType: 1, 
                        src: video.getAttribute("src") 
                    };
                } else if (img) {
                    forwardContent.body = {
                        url : img.getAttribute("src"),
                    };
                    forwardContent.media = { 
                        attachmentType: 2, 
                        src: img.getAttribute("src") 
                    };
                } else {
                    forwardContent.text = "This is a media message"; // Default for non-media
                }
            }
    
            getUsersFromContacts().then((users) => {
                showForwardModal(users, forwardContent);
            });
        }
    });
        

    function getUsersFromContacts() {
        return new Promise((resolve, reject) => {
            const groupsRef = ref(database, `data/groups/`);
            get(groupsRef)
                .then((snapshot) => {
                    const groups = [];
                    snapshot.forEach((childSnapshot) => {
                        const groupData = childSnapshot.val();
                        // Check if the current user is in the group's members list
                        if (groupData.userIds.includes(currentUserId)) {
                            groups.push({
                                id: childSnapshot.key,
                                groupName: groupData.name,
                                groupType: groupData.groupType,
                                date: groupData.date,
                                createdBy: groupData.createdBy,
                                avatarURL: groupData.image,
                            });
                        }
                    });
                    resolve(groups);
                })
                .catch((error) => reject(error));
        });
    }
    
    function showForwardModal(users, forwardContent) {
        const modalContainer = new bootstrap.Modal(document.getElementById("forward-modal"));
        const userListContainer = document.querySelector("#forward-modal .user-list");
        userListContainer.innerHTML = "";
    
        users.forEach((user) => {

            const userItem = document.createElement("div");
            userItem.classList.add("user-item");
            const avatar = resolveGroupProfileImageUrl(
                user.avatarURL || user.image || ""
            );
            const label = user.groupName || user.name || "Group";
            userItem.innerHTML = `
                <input type="checkbox" class="user-checkbox" data-group-id="${user.id}">
                <img src="${avatar}" alt="${label}" class="user-avatar" width="30">
                <span>${label}</span>
            `;
    
            userListContainer.appendChild(userItem);
        });
    
        modalContainer.show();
    
        document.getElementById("send-forward").onclick = () => {
            const selectedUsers = [];
            const checkboxes = document.querySelectorAll(".user-checkbox:checked");
    
            checkboxes.forEach((checkbox) => {
                selectedUsers.push(checkbox.getAttribute("data-group-id"));
            });

            if (selectedUsers.length > 0 && forwardContent) {
                selectedUsers.forEach((userId) => {

                    sendForwardMessage(userId, forwardContent.body, forwardContent.media ? forwardContent.media.attachmentType : 6, forwardContent.key);
                });
                forwardContent = null; // Reset forward content after sending
            }
    
            modalContainer.hide();
        };
    }

    let otherUserId = "";
    function isUserBlocked(currentUserId, otherUserId) {
        return get(ref(database, `data/blocked_users/${currentUserId}/${otherUserId}`))
            .then((snapshot) => {
                return snapshot.exists(); // Returns true if the user is blocked
            })
            .catch((error) => {
                return false; // Default to not blocked on error
            });
    }

    function sendForwardMessage(toUserId, forwardText, messageType = 'text', originalMessageKey = null) {
        if (!currentUserId) {
            return;
        }
        const activeForwardButton = document.querySelector('.forward-btn'); // Adjust selector as needed
        if (!activeForwardButton) {
            console.error("Active forward button not found.");
            return;
        }
        const chatsElement = activeForwardButton.closest('.chats');
        if (!chatsElement) {
            console.error("Chats element not found.");
            return;
        }    
        const groupId = chatsElement.getAttribute('data-group-id');
        if (!groupId) {
            console.error("Group ID not found.");
            return;
        }
        // Check if the user is blocked
        isUserBlocked(currentUserId, toUserId)
            .then(async (isBlocked) => {
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

                // Prepare the forward message object
                const message = {
                    sender: currentUserId,
                    senderId: currentUserId,
                    to: toUserId,
                    attachmentType: messageType,
                    body: forwardText,
                    timestamp: Date.now(),
                    delivered: false,
                    readMsg: false,
                    isForward: true,
                    originalMessageKey: originalMessageKey,
                };

                  // If the message is of type 'text', encrypt it
                  if (messageType === 6) {
                     const encryptedForwardText = await encryptMessage(forwardText);
                    message.body = encryptedForwardText; // Use the encrypted message here
                } else {
                    // For video, audio, or file, just pass the original content as is
                    message.attachment = forwardText; // Keep the original content without encryption
                }

                const messageRef = ref(database, `data/chats/${toUserId}`);
                 // Push the message to the chat room
                push(messageRef, message)
                    .then((newMessageRef) => {
                        // console.log(
                        //     "Message forwarded and encrypted successfully."
                        // );
                    })
                    .catch((error) => {
                        // console.error(
                        //     "Error forwarding encrypted message:",
                        //     error
                        // );
                    });
            })
            .catch((error) => {
            });
    }

    // Emoji picker: delegated handlers live only in firebaseChat.js (this file also loads on every page;
    // a second listener here toggled the picker open then immediately closed it).

const messageForm = document.getElementById("message-form");
if (messageForm) {
    messageForm.addEventListener("submit", function (event) {
        event.preventDefault(); // Prevent form submission and page reload
        const messageText = document.getElementById("message-input").value;
    });
}

const groupSearchInput = document.getElementById("groupSearchInput");
if (groupSearchInput) {
    groupSearchInput.addEventListener("input", function () {
    const searchValue = this.value.toLowerCase(); // Get the search value in lowercase
    const groupDivs = document.querySelectorAll("#group-list .chat-list"); // Select all group elements
    let anyVisible = false; // Track if any group is visible

    groupDivs.forEach((groupDiv) => {
        const groupNameElement =
            groupDiv.querySelector(".chat-user-msg h6"); // Get the group name in an <h6> tag
        const groupName = groupNameElement.textContent.toLowerCase(); // Get the group name in lowercase

        // Check if the group name includes the search value
        if (groupName.includes(searchValue)) {
            groupDiv.style.display = ""; // Show group
            anyVisible = true; // Mark as visible
        } else {
            groupDiv.style.display = "none"; // Hide group
        }
    });

    // Show or hide the no matches message
    const noMatchesMessage = document.getElementById(
        "noGroupMatchesMessage"
    );
    if (searchValue.trim() === "") {
        // If the input field is empty, hide both messages
        if (noMatchesMessage) noMatchesMessage.style.display = "none";
    } else {
        // If the input field is not empty, manage visibility based on matches
        if (noMatchesMessage) noMatchesMessage.style.display = anyVisible ? "none" : "block";
    }

});
}

function getUserDetails(userId) {
    const userRef = ref(database, 'data/users/' + userId); // Create a reference to the user node
    return get(userRef)
        .then((snapshot) => {
            if (snapshot.exists()) {
                return snapshot.val(); // Return user data if exists
            } else {
                // Return a default user object
                return { user_name: 'Unknown User', image: resolveGroupProfileImageUrl(""), status: 'No Status', role: 'Member' };
            }
        })
        .catch((error) => {
            // Return a default user object in case of error
            return { user_name: 'Unknown User', image: resolveGroupProfileImageUrl(""), status: 'No Status', role: 'Member' };
        });
}

// Function to fetch and display group info (one-shot get + generation guard — avoids stacked onValue listeners and stale async paints)
async function fetchGroupInfo(groupId) {
    if (!groupId) return;

    const fetchTargetId = groupId;
    const renderGen = ++groupInfoRenderGeneration;
    const groupRef = ref(database, `data/groups/${fetchTargetId}`);

    let snapshot;
    try {
        snapshot = await get(groupRef);
    } catch (error) {
        return;
    }

    if (renderGen !== groupInfoRenderGeneration || fetchTargetId !== selectedGroupId) {
        return;
    }

    const nameEl = document.getElementById("group-profile-name");
    const countEl = document.getElementById("group-profile-participant-count");
    const aboutEl = document.getElementById("group-info-about");
    const groupDateElement = document.getElementById("group-date");
    const avatarElement = document.getElementById("group-avatar");
    const membersContainer = document.getElementById("members-container");

    if (!snapshot.exists()) {
        if (nameEl) nameEl.textContent = "No Name";
        if (countEl) countEl.textContent = "Group - 0 Participants";
        if (aboutEl) aboutEl.textContent = "No Description";
        if (groupDateElement) groupDateElement.textContent = "No data available";
        if (membersContainer) membersContainer.innerHTML = "";
        return;
    }

    const groupData = snapshot.val();

    if (nameEl) nameEl.textContent = groupData.name || "No Name";
    if (countEl) {
        countEl.textContent = `Group - ${
            (groupData.userIds && groupData.userIds.length) || 0
        } Participants`;
    }
    if (aboutEl) aboutEl.textContent = groupData.status || "No Description";

    try { renderHeaderMemberAvatars(groupData); } catch (e) { /* safe */ }

    const timestamp = groupData.date;
    if (groupDateElement) {
        if (timestamp) {
            const date = new Date(Number(timestamp));
            const formattedDate = date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });
            const formattedTime = date.toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
            });
            const creatorId = groupData.createdBy;
            groupDateElement.textContent = `Group created on ${formattedDate}`;
            if (creatorId) {
                getUserDetails(creatorId).then((u) => {
                    if (renderGen !== groupInfoRenderGeneration || fetchTargetId !== selectedGroupId) {
                        return;
                    }
                    const merged = mergeLaravelProfileIfSelf(creatorId, u);
                    const creatorName = buildGroupParticipantDisplayName(null, merged);
                    groupDateElement.textContent = `Group created by ${creatorName}, on ${formattedDate} at ${formattedTime}`;
                });
            }
        } else {
            groupDateElement.textContent = "No data available";
        }
    }

    if (avatarElement) {
        avatarElement.src = resolveGroupProfileImageUrl(
            withCacheBuster(
                pickGroupAvatarRaw(groupData),
                groupData.updatedAt || groupData.date || Date.now()
            )
        );
    }

    if (membersContainer) membersContainer.innerHTML = "";

    const userIds = groupData.userIds || [];
    const memberPromises = userIds.map(async (memberId) => {
        let contactData = null;
        let userData = null;
        try {
            const contactSnap = await get(
                ref(database, `data/contacts/${currentUserId}/${memberId}`)
            );
            contactData = contactSnap.exists() ? contactSnap.val() : null;
        } catch (e) {
            /* ignore */
        }
        try {
            const userSnap = await get(ref(database, `data/users/${memberId}`));
            userData = userSnap.exists() ? userSnap.val() : null;
        } catch (e) {
            /* ignore */
        }
        const userMerged = mergeLaravelProfileIfSelf(memberId, userData);
        const displayName = buildGroupParticipantDisplayName(
            contactData,
            userMerged
        );
        return {
            ...userMerged,
            memberId,
            displayName,
            status:
                (userData && userData.status) ||
                (userData && userData.userStatus) ||
            "",
            _contactForAvatar: contactData,
            _userForAvatar: userMerged,
        };
    });

    let membersDetails = await Promise.all(memberPromises);
    membersDetails = await enrichGroupMembersWithLaravelBatch(membersDetails);

    if (renderGen !== groupInfoRenderGeneration || fetchTargetId !== selectedGroupId) {
        return;
    }

    if (!membersContainer) return;

    const maxVisibleMembers = 4;
    const totalMembers = membersDetails.length;

    membersDetails.forEach((user, index) => {
        if (!user) return;
        const memberElement = document.createElement("div");
        memberElement.className = "card mb-2 group-member-card";
        if (index >= maxVisibleMembers) {
            memberElement.classList.add("d-none");
            memberElement.dataset.hiddenMember = "1";
        }

        const isAdmin = groupData.createdBy === user.memberId;

        const statusText = user.status === "online" ? "Available" :
                           user.status === "busy" ? "Busy" :
                           user.status === "away" ? "Away" :
                           user.status || "Available";

        const avatarClass =
            user.status === "online"
                ? "avatar avatar-lg online flex-shrink-0"
                : "avatar avatar-lg flex-shrink-0";
        const adminBadge = isAdmin
            ? '<span class="badge badge-danger ms-2">Admin</span>'
            : '';

        const uForPic = user._userForAvatar || user;
        const cForPic = user._contactForAvatar || null;
        const avatarRaw = rawAvatarFromUserAndContact(uForPic, cForPic);

        const threeDotMenu = `
            <div class="dropdown">
                <a href="javascript:void(0);" class="text-muted" data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="ti ti-dots-vertical"></i>
                </a>
                <ul class="dropdown-menu dropdown-menu-end p-2">
                    <li><a class="dropdown-item small" href="javascript:void(0);" data-action="view-profile" data-uid="${user.memberId}"><i class="ti ti-user me-2"></i>View Profile</a></li>
                    <li class="group-admin-action d-none"><a class="dropdown-item small" href="javascript:void(0);" data-action="make-admin" data-uid="${user.memberId}"><i class="ti ti-shield me-2"></i>Make Admin</a></li>
                    <li class="group-admin-action d-none"><a class="dropdown-item small text-danger" href="javascript:void(0);" data-action="remove-member" data-uid="${user.memberId}"><i class="ti ti-user-minus me-2"></i>Remove</a></li>
                </ul>
            </div>`;

        memberElement.innerHTML = `
            <div class="card-body py-2 px-3">
                <div class="d-flex align-items-center justify-content-between">
                    <div class="d-flex align-items-center overflow-hidden">
                        <span class="${avatarClass}">
                            <img src="${resolveGroupProfileImageUrl(avatarRaw)}" alt="img" class="rounded-circle">
                        </span>
                        <div class="ms-2 overflow-hidden">
                            <div class="d-flex align-items-center">
                                <h6 class="text-truncate mb-0">${user.displayName}</h6>
                                ${adminBadge}
                            </div>
                            <p class="text-muted small mb-0">${capitalizeFirstLetter(statusText)}</p>
                        </div>
                    </div>
                    ${threeDotMenu}
                </div>
            </div>`;

        membersContainer.appendChild(memberElement);
    });

    const viewAllWrap = document.getElementById("group-view-all-members");
    const viewAllCount = document.getElementById("group-view-all-count");
    const viewAllLink = document.getElementById("group-view-all-link");
    if (totalMembers > maxVisibleMembers && viewAllWrap) {
        viewAllWrap.classList.remove("d-none");
        if (viewAllCount) viewAllCount.textContent = `(${totalMembers - maxVisibleMembers} more)`;
        if (viewAllLink) {
            viewAllLink.onclick = function () {
                membersContainer.querySelectorAll('[data-hidden-member="1"]').forEach(function (el) {
                    el.classList.remove("d-none");
                });
                viewAllWrap.classList.add("d-none");
            };
        }
    } else if (viewAllWrap) {
        viewAllWrap.classList.add("d-none");
    }

    const headingEl = document.getElementById("group-participants-heading");
    if (headingEl) headingEl.textContent = totalMembers + " Participants";

    if (currentUserId && (groupData.admin === currentUserId || groupData.createdBy === currentUserId)) {
        membersContainer.querySelectorAll(".group-admin-action").forEach(function (el) {
            el.classList.remove("d-none");
        });
    }
}

async function populateEditAdminMembersModal() {
    const groupId = selectedGroupId;
    const container = document.getElementById("edit-admin-members-list");
    if (!container) return;
    const searchInput = document.getElementById("edit-admin-search");
    if (searchInput) searchInput.value = "";

    if (!groupId || !currentUserId) {
        container.innerHTML =
            '<p class="text-center text-muted mb-0 px-2">' +
            "Select a group first." +
            "</p>";
        return;
    }

    container.innerHTML =
        '<div class="text-center py-4"><div class="spinner-border spinner-border-sm text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';

    try {
        const groupRef = ref(database, `data/groups/${groupId}`);
        const snapshot = await get(groupRef);
        if (!snapshot.exists()) {
            container.innerHTML =
                '<p class="text-center text-muted mb-0 px-2">Group not found.</p>';
            return;
        }

        const groupData = snapshot.val();
        const userIds = groupData.userIds || [];
        if (userIds.length === 0) {
            container.innerHTML =
                '<p class="text-center text-muted mb-0 px-2">No members in this group.</p>';
            return;
        }

        const adminUid = groupData.admin || "";
        const creatorUid = groupData.createdBy || "";

        const memberPromises = userIds.map(async (memberId) => {
            let contactData = null;
            let userData = null;
            try {
                const contactSnap = await get(
                    ref(database, `data/contacts/${currentUserId}/${memberId}`)
                );
                contactData = contactSnap.exists() ? contactSnap.val() : null;
            } catch (e) {
                /* ignore */
            }
            try {
                const userSnap = await get(ref(database, `data/users/${memberId}`));
                userData = userSnap.exists() ? userSnap.val() : null;
            } catch (e) {
                /* ignore */
            }
            const userMerged = mergeLaravelProfileIfSelf(memberId, userData);
            const displayName = buildGroupParticipantDisplayName(
                contactData,
                userMerged
            );
            return {
                ...userMerged,
                memberId,
                displayName,
                status:
                    (userData && userData.status) ||
                    (userData && userData.userStatus) ||
                    "",
                _contactForAvatar: contactData,
                _userForAvatar: userMerged,
            };
        });

        let membersDetails = await Promise.all(memberPromises);
        membersDetails = await enrichGroupMembersWithLaravelBatch(membersDetails);

        if (selectedGroupId !== groupId) return;

        container.innerHTML = "";
        membersDetails.forEach((user) => {
            if (!user) return;
            const isAdmin =
                user.memberId === adminUid ||
                user.memberId === creatorUid;
            const statusText =
                user.status === "online"
                    ? "Available"
                    : user.status === "busy"
                      ? "Busy"
                      : user.status === "away"
                        ? "Away"
                        : user.status || "Member";

            const uForPic = user._userForAvatar || user;
            const cForPic = user._contactForAvatar || null;
            const avatarRaw = rawAvatarFromUserAndContact(uForPic, cForPic);
            const imgSrc = resolveGroupProfileImageUrl(avatarRaw);

            const row = document.createElement("div");
            row.className =
                "contact-user d-flex align-items-center justify-content-between edit-admin-member-row";
            row.dataset.memberId = user.memberId;
            row.dataset.searchText =
                `${user.displayName || ""} ${statusText}`.toLowerCase();

            row.innerHTML = `
                <div class="d-flex align-items-center min-w-0">
                    <div class="avatar avatar-lg flex-shrink-0">
                        <img src="${imgSrc}" class="rounded-circle" alt="">
                    </div>
                    <div class="ms-2 min-w-0">
                        <h6 class="text-truncate mb-0">${user.displayName}</h6>
                        <p class="text-muted small mb-0 text-truncate">${capitalizeFirstLetter(
                            statusText
                        )}</p>
                    </div>
                </div>
                <div class="form-check flex-shrink-0 ms-2">
                    <input class="form-check-input edit-admin-cb" type="checkbox" name="edit_admin_member" value="${
                        user.memberId
                    }" ${isAdmin ? "checked" : ""} aria-label="Group admin">
                </div>`;
            container.appendChild(row);
        });
    } catch (err) {
        console.error("populateEditAdminMembersModal:", err);
        container.innerHTML =
            '<p class="text-center text-danger mb-0 px-2">Failed to load members.</p>';
    }
}

const editAdminModalEl = document.getElementById("edit-admin");
if (editAdminModalEl) {
    editAdminModalEl.addEventListener("show.bs.modal", function () {
        populateEditAdminMembersModal();
    });
}

const editAdminForm = document.getElementById("edit-admin-form");
if (editAdminForm) {
    editAdminForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        const gid = selectedGroupId;
        const container = document.getElementById("edit-admin-members-list");
        if (!gid || !container || !currentUserId) return;

        const checked = [
            ...container.querySelectorAll("input.edit-admin-cb:checked"),
        ].map((i) => i.value);
        if (checked.length === 0) {
            Toastify({
                text: "Select at least one group admin.",
                duration: 3000,
                gravity: "top",
                position: "right",
                backgroundColor: "#ef4444",
            }).showToast();
            return;
        }

        try {
            const groupRef = ref(database, `data/groups/${gid}`);
            const snap = await get(groupRef);
            if (!snap.exists()) return;
            const gd = snap.val();
            if (gd.admin !== currentUserId && gd.createdBy !== currentUserId) {
                Toastify({
                    text: "Only a group admin can change this.",
                    duration: 3000,
                    gravity: "top",
                    position: "right",
                    backgroundColor: "#ef4444",
                }).showToast();
                return;
            }

            const order = gd.userIds || [];
            const orderedPick = order.filter((id) => checked.includes(id));
            const newAdmin = orderedPick.length ? orderedPick[0] : checked[0];

            await update(groupRef, { admin: newAdmin });
            fetchGroupInfo(gid);
            Toastify({
                text: "Group admin updated.",
                duration: 2500,
                gravity: "top",
                position: "right",
                backgroundColor: "#22c55e",
            }).showToast();
            const modal = bootstrap.Modal.getInstance(editAdminModalEl);
            if (modal) modal.hide();
        } catch (err) {
            console.error("edit-admin save:", err);
            Toastify({
                text: "Could not save. Try again.",
                duration: 3000,
                gravity: "top",
                position: "right",
                backgroundColor: "#ef4444",
            }).showToast();
        }
    });
}

const editAdminSearchInput = document.getElementById("edit-admin-search");
if (editAdminSearchInput) {
    editAdminSearchInput.addEventListener("input", function () {
        const q = (this.value || "").toLowerCase().trim();
        document.querySelectorAll(".edit-admin-member-row").forEach(function (row) {
            const t = row.dataset.searchText || "";
            row.classList.toggle("d-none", q.length > 0 && !t.includes(q));
        });
    });
}

const contactProfileOffcanvas = document.getElementById("contact-profile");
if (contactProfileOffcanvas) {
    contactProfileOffcanvas.addEventListener("show.bs.offcanvas", function () {
        resetGroupInfoPanelPlaceholders();
        const groupId =
            selectedGroupId ||
            (typeof window !== "undefined" ? window.__dreamchatSelectedGroupId : null);
        fetchGroupInfo(groupId);
        if (groupId && currentUserId) {
            checkAdminAccess(groupId, currentUserId);
        }
        refreshGroupFavouritesBadgeCount();
    });
}

const groupLogoutEl = document.getElementById("group-logout");
if (groupLogoutEl) groupLogoutEl.addEventListener("click", async function () {
    //await exitGroup(selectedGroupId, currentUserId);
});

// Function to handle exiting the group
async function exitGroup(groupId, userId) {
    const groupRef = ref(database, `data/groups/${groupId}`);

    try {
        const groupSnapshot = await get(groupRef);
        if (groupSnapshot.exists()) {
            const groupData = groupSnapshot.val();
            const members = groupData.userIds || [];
            const exitedUsers = groupData.grpExitUserIds || []; // Initialize as an empty array if not present

            // Check if the user is a member of the group
            if (members.includes(userId)) {
                // Remove the user from the members array
                const updatedMembers = members.filter(memberId => memberId !== userId);

                // Append the userId to grpExitUserIds array
                const updatedExitedUsers = [...exitedUsers, userId];

                // Update the group in the database
                await set(groupRef, {
                    ...groupData,
                    userIds: updatedMembers,
                    grpExitUserIds: updatedExitedUsers,
                });

                Toastify({
                    text: "You have successfully exited the group.",
                    duration: 3000, // Duration in milliseconds
                    gravity: "top", // `top` or `bottom`
                    position: "right", // `left`, `center` or `right`
                    backgroundColor: "#4caf50", // Green color for success
                    stopOnFocus: true, // Prevents dismissing of toast on hover
                }).showToast();

                // Optionally, refresh the group info
                fetchGroupInfo(groupId);
            } 
        } 
    } catch (error) {
        alert("An error occurred while trying to exit the group. Please try again.");
    }
}


// Add event listener to the document for the modal open event

    // Add an event listener for the exit group link
    document.querySelectorAll('.list-group-item[data-bs-target="#group-logout"]').forEach(item => {
        item.addEventListener('click', function () {
            // Get the data attributes for groupId and userId
            const groupId = this.getAttribute('data-group-id');
            const userId = this.getAttribute('data-user-id');

            // Store them in the modal for later use
            const confirmExitButton = document.getElementById('confirm-exit');
            confirmExitButton.setAttribute('data-group-id', groupId);
            confirmExitButton.setAttribute('data-user-id', userId);
        });
    });

    // Add event listener to confirm exit button
    const confirmExitEl = document.getElementById('confirm-exit');
    if (confirmExitEl) confirmExitEl.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        // Retrieve groupId and userId from the button's data attributes
        const groupId = this.getAttribute('data-group-id');
        const userId = this.getAttribute('data-user-id');
        exitGroup(selectedGroupId, currentUserId);
        forceCloseBootstrapModal("group-logout");
    });


// Add event listener to the delete chat button
const deleteGroupBtnEl = document.getElementById('deleteGroupBtn');
if (deleteGroupBtnEl) deleteGroupBtnEl.addEventListener('click', function (event) {
    event.preventDefault(); // Prevent the default form submission
    event.stopPropagation(); // Avoid duplicate execution via delegated handler
    forceCloseBootstrapModal("delete-group");
    deleteGroupChat(); // Call the deleteGroupChat function
});

// Function to delete a group chat
function deleteGroupChat() {
    const currentUser = auth.currentUser; // Get the currently logged-in user

    if (!currentUser) {
        forceCloseBootstrapModal("delete-group");
        return;
    }

    // Ensure selectedGroupId is set from the previous context
    if (!selectedGroupId) {
        forceCloseBootstrapModal("delete-group");
        return;
    }

    // Reference to the group in Firebase
    const groupRef = ref(database, `data/groups/${selectedGroupId}`);

    // Remove the group from the database
    remove(groupRef)
        .then(() => {
            closeGroupModal(); // Close modal after deletion
            forceCloseBootstrapModal("delete-group");

            // Hide the chat section
            const chatSection = document.getElementById('middle');
            if (chatSection) {
                chatSection.style.display = 'none'; // Hide the chat section
            }
            selectedGroupId = null;
            if (typeof window !== 'undefined') window.__dreamchatSelectedGroupId = null;

            // Show the welcome container
            const welcomeContainer = document.getElementById('welcome-container');
            if (welcomeContainer) {
                welcomeContainer.style.display = 'block'; // Show the welcome container
            }

            // Optionally refresh the UI or redirect
        })
        .catch((error) => {
            alert("An error occurred while trying to delete the group.");
            forceCloseBootstrapModal("delete-group");
        });
}


function closeGroupModal() {
    const blockModal = bootstrap.Modal.getInstance(document.getElementById("delete-group")); // Get existing modal instance
    if (blockModal) {
        blockModal.hide(); // Hide the modal
    }
}

function forceCloseBootstrapModal(modalId) {
    const el = document.getElementById(modalId);
    try {
        if (document.activeElement && typeof document.activeElement.blur === "function") {
            document.activeElement.blur();
        }
        if (el) {
            const instance = bootstrap.Modal.getOrCreateInstance(el);
            if (instance) instance.hide();
        }
    } catch (e) {
        // Ignore modal hide errors; we'll still remove backdrop.
    }

    // If a JS error occurs mid-flow, Bootstrap sometimes leaves the backdrop/body state behind.
    document.body.classList.remove("modal-open");
    if (!document.querySelector(".modal.show") && !document.querySelector(".offcanvas.show")) {
        document.body.style.removeProperty("overflow");
        document.body.style.removeProperty("padding-right");
    }
    document
        .querySelectorAll(".modal-backdrop, .offcanvas-backdrop")
        .forEach((b) => b.parentNode && b.parentNode.removeChild(b));
}

function normalizeOverlayState() {
    const hasOpenModal = !!document.querySelector(".modal.show");
    const hasOpenOffcanvas = !!document.querySelector(".offcanvas.show");
    if (!hasOpenModal && !hasOpenOffcanvas) {
        document.body.classList.remove("modal-open");
        document.body.style.removeProperty("overflow");
        document.body.style.removeProperty("padding-right");
        document
            .querySelectorAll(".modal-backdrop, .offcanvas-backdrop")
            .forEach((b) => b.parentNode && b.parentNode.removeChild(b));
    }
}

["clear-group-chat", "delete-group", "group-logout"].forEach((modalId) => {
    const modalEl = document.getElementById(modalId);
    if (!modalEl) return;
    modalEl.addEventListener("hidden.bs.modal", normalizeOverlayState);
    modalEl.addEventListener("hide.bs.modal", () => {
        // Delay one tick so Bootstrap can finish state transition first.
        setTimeout(normalizeOverlayState, 0);
    });
});

const closeGroupBtnEl = document.getElementById('close-group-btn');
if (closeGroupBtnEl) closeGroupBtnEl.addEventListener('click', function (event) {
    event.preventDefault(); // Prevent default link behavior

    // Get the chat section by its ID
    const chatSection = document.getElementById('middle');
    const welcomeContainer = document.getElementById('welcome-container');

    if (chatSection) {
        chatSection.style.display = 'none'; // Hide the chat section
        welcomeContainer.style.display = 'block';
    }
    selectedGroupId = null;
    if (typeof window !== 'undefined') window.__dreamchatSelectedGroupId = null;
});

const clearGroupBtnEl = document.getElementById('clear-group-btn');
if (clearGroupBtnEl) clearGroupBtnEl.addEventListener('click', function (event) {
    event.preventDefault(); // Prevent the default form submission
    event.stopPropagation(); // Avoid duplicate execution via delegated handler
    forceCloseBootstrapModal("clear-group-chat");
    clearGroupMessages(selectedGroupId);
});

// Delegated handlers ensure buttons keep working after SPA DOM swaps.
document.addEventListener("click", function (event) {
    if (event.defaultPrevented) return;

    const deleteBtn = event.target.closest("#deleteGroupBtn");
    if (deleteBtn) {
        event.preventDefault();
        event.stopPropagation();
        forceCloseBootstrapModal("delete-group");
        deleteGroupChat();
        return;
    }
    const clearBtn = event.target.closest("#clear-group-btn");
    if (clearBtn) {
        event.preventDefault();
        event.stopPropagation();
        forceCloseBootstrapModal("clear-group-chat");
        clearGroupMessages(selectedGroupId);
    }
});


function clearGroupMessages(selectedGroupId) {
    if (!selectedGroupId) {
        forceCloseBootstrapModal("clear-group-chat");
        return;
    }

    const messagesRef = ref(database, `data/chats/${selectedGroupId}`);

    get(messagesRef)
        .then((snapshot) => {
            if (snapshot.exists()) {
                const messages = snapshot.val();
                const updates = {};

                // Iterate over each message in the group
                Object.keys(messages).forEach((messageId) => {
                    const message = messages[messageId];
                    const clearedFor = message.clearedFor || [];

                    // If the current user has not cleared this message, add them to clearedFor
                    if (!clearedFor.includes(currentUserId)) {
                        updates[`chats/${selectedGroupId}/${messageId}/clearedFor`] = [...clearedFor, currentUserId];
                    }
                });

                // Apply updates to the database
                return update(ref(database), updates);
            }
        })
        .then(() => {
            // Clear UI
            const chatBox = document.getElementById("chat-messages");
            if (chatBox) {
                chatBox.innerHTML = ""; // Clear the chat box
            }

            // Close modal if applicable
            const modal = document.getElementById('clear-group-chat');
            if (modal) {
                const modalInstance = bootstrap.Modal.getInstance(modal);
                modalInstance?.hide();
            }
            forceCloseBootstrapModal("clear-group-chat");
        })
        .catch((error) => {
            console.error("Error clearing chat:", error);
            // Ensure UI isn't left in a black/blocked state if the async call fails.
            forceCloseBootstrapModal("clear-group-chat");
        });
}

function highlightActiveGroup(userId) {
    const userElements = document.querySelectorAll('[data-group-id]');

    userElements.forEach(userElement => {
        const id = userElement.getAttribute('data-group-id');
        
        // Remove active class from all users
        userElement.classList.remove('active'); 
        
        // Add active class to the selected user
        if (id === userId) {
            userElement.classList.add('active');
        }
    });
}

// Emoji picker: handled by firebaseChat.js (document delegation) so SPA-injected chat footers work
// and we avoid double toggle when both firebaseChat.js and this module load on the same page.

// Voice messages: #record_audio + MediaRecorder in firebaseChat.js; group sends via __dreamchatSendGroupMessage.

async function fetchContactsNotInGroup(groupId, currentUserId) {
    const contactsContainer = document.getElementById('contact-list-container');
    contactsContainer.innerHTML = `<div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
    </div>`;

    try {
        // Reference the paths in the database
        const contactsRef = ref(database, `data/contacts/${currentUserId}`);
        const groupMembersRef = ref(database, `data/groups/${groupId}/userIds`);

        // Get data snapshots
        const [contactsSnapshot, groupMembersSnapshot] = await Promise.all([
            get(contactsRef),
            get(groupMembersRef),
        ]);

        const contacts = contactsSnapshot.val() || {};
        const groupMemberIds = groupMembersSnapshot.val() || []; // Assume userIds is an array

        if (!Array.isArray(groupMemberIds)) {
            throw new Error("userIds is not an array in the database");
        }

        // Filter contacts not in the group's userIds list
        const nonMemberContacts = Object.entries(contacts).filter(
            ([contactId]) => !groupMemberIds.includes(contactId)
        );

        // Show a message if no contacts are available to add
        if (nonMemberContacts.length === 0) {
            contactsContainer.innerHTML = `<p class="text-center">No contacts available to add.</p>`;
            return;
        }

        // Render the contacts as checkboxes (same style as group creation picker)
        contactsContainer.innerHTML = nonMemberContacts
            .map(([contactId, contactInfo]) => {
                const imgSrc = resolveGroupProfileImageUrl(
                    rawAvatarFromUserAndContact(contactInfo, contactInfo)
                );
                const displayName = contactInfo.userName
                    || contactInfo.firstName
                    || contactInfo.mobile_number
                    || 'Unknown';
                return `
                <div class="contact-user">
                    <div class="d-flex align-items-center justify-content-between">
                        <div class="d-flex align-items-center">
                            <div class="avatar avatar-lg">
                                <img src="${imgSrc}" class="rounded-circle" alt="image">
                            </div>
                            <div class="ms-2">
                                <h6>${capitalizeFirstLetter(displayName)}</h6>
                            </div>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" value="${contactId}"
                                onchange="toggleMemberSelection('${contactId}')">
                        </div>
                    </div>
                </div>
            `;
            })
            .join('');
    } catch (error) {
        console.error('Error fetching contacts:', error);
        contactsContainer.innerHTML = `<p class="text-center text-danger">Failed to load contacts. Please try again.</p>`;
    }
}

// Attach toggleMemberSelection to the global scope
window.toggleMemberSelection = toggleMemberSelection;

function toggleMemberSelection(contactId) {
    if (selectedMembers.includes(contactId)) {
        // Remove if already selected
        selectedMembers = selectedMembers.filter((id) => id !== contactId);
    } else {
        // Add if not already selected
        selectedMembers.push(contactId);
    }

    //console.log('Selected Members:', selectedMembers); // Debugging output
}

async function addSelectedMembersToGroup(groupId) {
    if (selectedMembers.length === 0) {
        alert('Please select at least one member to add.');
        return;
    }

    try {
        const groupMembersRef = ref(database, `data/groups/${groupId}/userIds`);

        // Fetch the existing userIds array
        const snapshot = await get(groupMembersRef);
        let existingUserIds = snapshot.val() || []; // Default to an empty array if no members exist

        if (!Array.isArray(existingUserIds)) {
            // Ensure userIds is an array
            existingUserIds = [];
        }

        // Add new members without duplicates
        const updatedUserIds = [...new Set([...existingUserIds, ...selectedMembers])];

        // Update the userIds array in the database
        await set(groupMembersRef, updatedUserIds);

        const modal = bootstrap.Modal.getInstance(document.getElementById('group-add-new'));
        if (modal) modal.hide();

        selectedMembers = [];

        // Refresh the group info panel (participants list + member count) live
        if (typeof fetchGroupInfo === 'function') {
            fetchGroupInfo(groupId);
        }
    } catch (error) {
        console.error('Error adding members to group:', error);
    }
}


// Open the modal and fetch contacts not in the group
const groupAddNewTrigger = document.querySelector('[data-bs-target="#group-add-new"]');
if (groupAddNewTrigger) groupAddNewTrigger.addEventListener('click', () => {
    const groupId = selectedGroupId; // Replace with your logic to get the current group ID
    fetchContactsNotInGroup(groupId, currentUserId); // Make sure currentUserId is defined globally
});

// Add selected members to the group when clicking "Add" button
const selectAddGroupEl = document.getElementById('select-add-group');
if (selectAddGroupEl) selectAddGroupEl.addEventListener('click', function (e) {
    e.preventDefault(); // Prevent default button behavior
    const groupId = selectedGroupId;
    addSelectedMembersToGroup(groupId);
});

const removeGroupMemberEl = document.getElementById('remove-group-memeber');
if (removeGroupMemberEl) removeGroupMemberEl.addEventListener('click', function (e) {
    e.preventDefault(); // Prevent default button behavior
    const groupId = selectedGroupId;
    removeSelectedMembersFromGroup(groupId);
});

window.toggleRemoveSelection = toggleRemoveSelection;


async function fetchGroupMembers(groupId) {
    const membersContainer = document.getElementById('member-list-container');
    membersContainer.innerHTML = `<div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
    </div>`;

    try {
        // Reference the group members in Firebase
        const groupMembersRef = ref(database, `data/groups/${groupId}/userIds`);

        // Fetch the group members
        const snapshot = await get(groupMembersRef);
        const memberIds = snapshot.val() || [];

        if (!Array.isArray(memberIds)) {
            throw new Error("userIds is not an array in the database");
        }

        // Show a message if no members are in the group
        if (memberIds.length === 0) {
            membersContainer.innerHTML = `<p class="text-center">No members found in the group.</p>`;
            return;
        }

        // Fetch name, mobile_number, or email for each member and render the group members with checkboxes
        const memberDetails = await Promise.all(
            memberIds.map(async (memberId) => {
                const memberDetailsRef = ref(database, `data/contacts/${currentUserId}/${memberId}`);
                const detailsSnapshot = await get(memberDetailsRef);
                let memberData = detailsSnapshot.val();
                let displayName = '';

                if (memberData) {
                 
                    displayName = `${memberData.firstName || memberData.mobile_number || memberData.email}`; 
                } else {
                    if (currentUserId === memberId) {
                        const userRef = ref(database, `data/users/${currentUserId}`);
                        const userSnapshot = await get(userRef);
                        memberData = userSnapshot.val();
                        
                        displayName = `${memberData.firstName} ${memberData.lastName}`;  // Fallback to memberId if no data is found

                    }
                }

                return { memberId, displayName };
            })
        );

        // Render the group members with checkboxes
        membersContainer.innerHTML = memberDetails
            .map(
                ({ memberId, displayName }) => `
                <div class="list-group-item d-flex align-items-center">
                    <input type="checkbox" id="member-${memberId}" class="form-check-input me-3"
                        onchange="toggleRemoveSelection('${memberId}')">
                    <label for="member-${memberId}" class="d-flex align-items-center">
                        <div>
                            <h6 class="mb-0">${displayName}</h6>
                        </div>
                    </label>
                </div>
            `
            )
            .join('');
    } catch (error) {
        console.error('Error fetching group members:', error);
        membersContainer.innerHTML = `<p class="text-center text-danger">Failed to load members. Please try again.</p>`;
    }
}

let selectedRemoveMembers = []; // Array to hold selected members for removal

function toggleRemoveSelection(memberId) {
    if (selectedRemoveMembers.includes(memberId)) {
        // Remove if already selected
        selectedRemoveMembers = selectedRemoveMembers.filter((id) => id !== memberId);
    } else {
        // Add if not already selected
        selectedRemoveMembers.push(memberId);
    }

   // console.log('Selected Members for Removal:', selectedRemoveMembers); // Debugging output
}

async function removeSelectedMembersFromGroup(groupId) {
    if (selectedRemoveMembers.length === 0) {
        alert('Please select at least one member to remove.');
        return;
    }

    try {
        const groupMembersRef = ref(database, `data/groups/${groupId}/userIds`);

        // Fetch existing members
        const snapshot = await get(groupMembersRef);
        let existingMembers = snapshot.val() || [];

        if (!Array.isArray(existingMembers)) {
            throw new Error("userIds is not an array in the database");
        }

        // Remove selected members
        const updatedMembers = existingMembers.filter(
            (memberId) => !selectedRemoveMembers.includes(memberId)
        );

        // Update the database
        await set(groupMembersRef, updatedMembers);

        alert('Selected members removed successfully!');

        // Clear the selection and refresh the modal
        selectedRemoveMembers = [];
        fetchGroupMembers(groupId);

        // Hide the modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('group-remove'));
        if (modal) modal.hide();
    } catch (error) {
        console.error('Error removing members from group:', error);
        alert('Failed to remove members. Please try again.');
    }
}

const groupRemoveTrigger = document.querySelector('[data-bs-target="#group-remove"]');
if (groupRemoveTrigger) groupRemoveTrigger.addEventListener('click', () => {
    fetchGroupMembers(selectedGroupId); // Ensure `selectedGroupId` is set correctly
});

async function checkAdminAccess(groupId, currentUserId) {
    try {
        const groupRef = ref(database, `data/groups/${groupId}`);
        const snapshot = await get(groupRef);
        const groupData = snapshot.exists() ? snapshot.val() : null;
        const isAdmin = !!groupData && (
            groupData.admin === currentUserId || groupData.createdBy === currentUserId
        );
        const addGroupBtn = document.getElementById("add-group-new");
        const removeGroupBtn = document.getElementById("remove-group-new");
        const groupIconEditWrap = document.getElementById("group-icon-edit-wrap");

        if (addGroupBtn) {
            addGroupBtn.style.display = isAdmin ? "block" : "none";
        }

        if (removeGroupBtn) {
            removeGroupBtn.style.display = isAdmin ? "block" : "none";
        }

        if (groupIconEditWrap) {
            groupIconEditWrap.classList.toggle("d-none", !isAdmin);
        }
       
    } catch (error) {
        console.error("Error checking admin status:", error);
    }
}

const groupIconUploadEl = document.getElementById("group-icon-upload");
if (groupIconUploadEl) {
    groupIconUploadEl.addEventListener("change", async function (e) {
        const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
        if (!file) return;

        const activeGroupId = selectedGroupId || (typeof window !== "undefined" ? window.__dreamchatSelectedGroupId : null);
        if (!activeGroupId || !currentUserId) {
            this.value = "";
            return;
        }

        if (!String(file.type || "").startsWith("image/")) {
            Toastify({
                text: "Please choose a valid image file.",
                duration: 2500,
                gravity: "top",
                position: "right",
                backgroundColor: "#ef4444",
            }).showToast();
            this.value = "";
            return;
        }

        try {
            const groupRef = ref(database, `data/groups/${activeGroupId}`);
            const groupSnap = await get(groupRef);
            if (!groupSnap.exists()) {
                this.value = "";
                return;
            }

            const groupData = groupSnap.val() || {};
            const isAdmin =
                groupData.admin === currentUserId ||
                groupData.createdBy === currentUserId;
            if (!isAdmin) {
                Toastify({
                    text: "Only group admin can change the icon.",
                    duration: 2500,
                    gravity: "top",
                    position: "right",
                    backgroundColor: "#ef4444",
                }).showToast();
                this.value = "";
                return;
            }

            // Upload icon via Laravel backend to avoid Firebase Storage CORS issues
            const csrfToken = document.querySelector('meta[name="csrf-token"]')
                ? document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                : null;
            const iconFormData = new FormData();
            iconFormData.append('image', file);

            const res = await fetch('/api/groups/icon-upload', {
                method: 'POST',
                headers: csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {},
                body: iconFormData,
            });
            if (!res.ok) {
                const txt = await res.text().catch(() => '');
                throw new Error(`Icon upload failed (${res.status}) ${String(txt).slice(0, 120)}`);
            }
            const payload = await res.json();
            const downloadURL = payload && payload.url ? payload.url : '';

            const nowTs = Date.now();
            await update(groupRef, {
                image: downloadURL,
                avatarURL: downloadURL,
                profile_image: downloadURL,
                updatedAt: nowTs,
            });

            const persistedSnap = await get(groupRef);
            const persistedData = persistedSnap.exists() ? persistedSnap.val() : {};
            const finalAvatar = resolveGroupProfileImageUrl(
                withCacheBuster(
                    pickGroupAvatarRaw(persistedData),
                    persistedData.updatedAt || nowTs
                )
            );

            const offcanvasAvatar = document.getElementById("group-avatar");
            if (offcanvasAvatar) offcanvasAvatar.src = finalAvatar;
            const headerAvatar = document.getElementById("group_image");
            if (headerAvatar) headerAvatar.src = finalAvatar;
            const activeSidebarAvatar = document.querySelector(`.chat-list.active .avatar img`);
            if (activeSidebarAvatar) {
                activeSidebarAvatar.src = finalAvatar;
            }

            // Force-refresh all UI binding points that render group icon
            loadGroupDetails(activeGroupId);
            fetchGroupInfo(activeGroupId);
            refreshGroupsList();

            Toastify({
                text: "Group icon updated successfully.",
                duration: 2500,
                gravity: "top",
                position: "right",
                backgroundColor: "#22c55e",
            }).showToast();
        } catch (error) {
            console.error("Failed to update group icon:", error);
            Toastify({
                text: "Failed to update group icon. Please try again.",
                duration: 2500,
                gravity: "top",
                position: "right",
                backgroundColor: "#ef4444",
            }).showToast();
        } finally {
            this.value = "";
        }
    });
}



async function encryptMessage(messageText) {
    // Get CSRF token from meta tag
    const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute("content");

    try {
        // Send POST request to Laravel endpoint
        const response = await fetch('/process-encryption-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
            },
            body: JSON.stringify({ data: messageText }),
        });

        if (!response.ok) {
            throw new Error(`Failed to encrypt data. Status: ${response.status}`);
        }

        // Parse and return encrypted data
        const result = await response.json();
        return result.encryptedData;
    } catch (error) {
        console.error('Encryption error:', error);
        return null; // Return null in case of an error
    }
}

async function decryptlibsodiumMessage(encryptedMessage) {
    const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute("content");

    try {
        const response = await fetch('/decrypt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
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

        return result.decryptedData;
    } catch (error) {
        console.error('Decryption error:', error);
        return null;
    }
}

// --- Group Info Panel: wire up new UI elements ---

const groupMediaAccordionCfg = {
    "group-media-collapse-photos": { type: "photos", attachmentTypes: [2] },
    "group-media-collapse-videos": { type: "videos", attachmentTypes: [1] },
    "group-media-collapse-links": { type: "links", attachmentTypes: [6] },
    "group-media-collapse-docs": { type: "docs", attachmentTypes: [5] },
};

async function loadGroupMediaAccordion(collapseEl, cfg) {
    if (!collapseEl || !cfg || !currentUserId || !selectedGroupId) return;
    const loadingEl = collapseEl.querySelector(".media-loading");
    const emptyEl = collapseEl.querySelector(".media-empty");
    const gridEl = collapseEl.querySelector(".media-photos-grid, .media-videos-grid");
    const listEl = collapseEl.querySelector(".media-links-list, .media-docs-list");

    if (loadingEl) loadingEl.classList.remove("d-none");
    if (emptyEl) emptyEl.classList.add("d-none");
    if (gridEl) gridEl.innerHTML = "";
    if (listEl) listEl.innerHTML = "";

    let messages = [];
    try {
        const snap = await get(ref(database, `data/chats/${selectedGroupId}`));
        if (snap.exists()) {
            snap.forEach((child) => {
                messages.push(child.val());
            });
        }
    } catch (e) {
        /* ignore */
    }

    if (loadingEl) loadingEl.classList.add("d-none");

    const viewerUid = currentUserId;
    const filtered = messages.filter((msg) => {
        if (!groupMessageVisibleForViewer(msg, viewerUid)) return false;
        return cfg.attachmentTypes.includes(Number(msg.attachmentType));
    });

    if (cfg.type === "photos" || cfg.type === "videos") {
        if (!filtered.length) {
            if (emptyEl) emptyEl.classList.remove("d-none");
            return;
        }
        filtered.forEach((msg) => {
            const url = normalizeChatMediaUrl(
                msg.attachment && msg.attachment.url ? msg.attachment.url : msg.attachment
            );
            if (!url) return;
            const col = document.createElement("div");
            col.className = "col-4";
            if (cfg.type === "photos") {
                col.innerHTML = `<a href="${url}" target="_blank" rel="noopener noreferrer"><img src="${url}" class="img-fluid rounded" style="height:80px;width:100%;object-fit:cover;" alt="photo"></a>`;
            } else {
                col.innerHTML = `<video src="${url}" class="img-fluid rounded" style="height:80px;width:100%;object-fit:cover;" controls></video>`;
            }
            if (gridEl) gridEl.appendChild(col);
        });
        return;
    }

    if (cfg.type === "links") {
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
            const reWww = /\bwww\.[a-z0-9][a-z0-9.-]*\.[a-z]{2,}[^\s<>"']*/gi;
            let m;
            while ((m = reHttp.exec(text)) !== null) {
                addLinkRow(m[0]);
            }
            while ((m = reWww.exec(text)) !== null) {
                addLinkRow(m[0]);
            }
        };

        const textMsgs = messages.filter(
            (msg) =>
                groupMessageVisibleForViewer(msg, viewerUid) &&
                Number(msg.attachmentType) === 6 &&
                msg.body
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
            (m) =>
                groupMessageVisibleForViewer(m, viewerUid) &&
                Number(m.attachmentType) === 4 &&
                m.attachment
        );
        for (const msg of mapMsgs) {
            const att = msg.attachment;
            if (att.link) addLinkRow(att.link);
            if (att.url && typeof att.url === "string") {
                const u = att.url;
                if (
                    /maps\.(google|googleapis)\.|goo\.gl|g\.co\/maps/i.test(u) ||
                    /maps\.google\.com|google\.com\/maps/i.test(u)
                ) {
                    addLinkRow(u);
                }
            }
        }

        if (!found && emptyEl) emptyEl.classList.remove("d-none");
        return;
    }

    if (cfg.type === "docs") {
        if (!filtered.length) {
            if (emptyEl) emptyEl.classList.remove("d-none");
            return;
        }
        for (const msg of filtered) {
            let url =
                msg.attachment && msg.attachment.url ? msg.attachment.url : msg.attachment;
            if (!url) {
                try {
                    url = await decryptlibsodiumMessage(msg.body);
                } catch (e) {
                    url = null;
                }
            }
            url = normalizeChatMediaUrl(url);
            if (!url) continue;
            const name =
                (msg.attachment && msg.attachment.name) ||
                msg.fileName ||
                (url && url.split("/").pop()) ||
                "File";
            const item = document.createElement("a");
            item.href = url;
            item.target = "_blank";
            item.rel = "noopener noreferrer";
            item.download = name;
            item.className =
                "list-group-item list-group-item-action px-0 py-2 border-0 d-flex align-items-center gap-2";
            item.innerHTML = `<i class="ti ti-file text-primary"></i><span class="text-truncate" style="font-size:0.82rem;">${name}</span>`;
            if (listEl) listEl.appendChild(item);
        }
    }
}

function closeOtherGroupMediaCollapses(exceptId) {
    Object.keys(groupMediaAccordionCfg).forEach((cid) => {
        if (cid === exceptId) return;
        const el = document.getElementById(cid);
        if (el && el.classList.contains("show") && typeof bootstrap !== "undefined") {
            const inst = bootstrap.Collapse.getInstance(el);
            if (inst) inst.hide();
        }
        const row = document.querySelector(`.group-media-row[data-media-target="${cid}"]`);
        const chevron = row && row.querySelector(".media-chevron i");
        if (chevron) {
            chevron.classList.remove("ti-chevron-down");
            chevron.classList.add("ti-chevron-right");
        }
    });
}

document.querySelectorAll(".group-media-row").forEach(function (row) {
    if (row.dataset.groupMediaWired === "1") return;
    row.dataset.groupMediaWired = "1";
    row.addEventListener("click", function (e) {
        e.preventDefault();
        const targetId = this.dataset.mediaTarget;
        if (!targetId || typeof bootstrap === "undefined") return;
        const collapseEl = document.getElementById(targetId);
        if (!collapseEl) return;
        const cfg = groupMediaAccordionCfg[targetId];
        if (!cfg) return;
        const chevron = this.querySelector(".media-chevron i");
        const isOpen = collapseEl.classList.contains("show");
        let inst = bootstrap.Collapse.getInstance(collapseEl);
        if (!inst) inst = new bootstrap.Collapse(collapseEl, { toggle: false });

        if (isOpen) {
            inst.hide();
            if (chevron) {
                chevron.classList.remove("ti-chevron-down");
                chevron.classList.add("ti-chevron-right");
            }
        } else {
            closeOtherGroupMediaCollapses(targetId);
            inst.show();
            if (chevron) {
                chevron.classList.remove("ti-chevron-right");
                chevron.classList.add("ti-chevron-down");
            }
            loadGroupMediaAccordion(collapseEl, cfg);
        }
    });
});

// Participant search toggle
const participantSearchToggle = document.getElementById("group-participants-search-toggle");
const participantSearchWrap = document.getElementById("group-participants-search-wrap");
const participantSearchInput = document.getElementById("group-participants-search");
if (participantSearchToggle && participantSearchWrap) {
    participantSearchToggle.addEventListener("click", function () {
        participantSearchWrap.classList.toggle("d-none");
        if (!participantSearchWrap.classList.contains("d-none") && participantSearchInput) {
            participantSearchInput.focus();
        }
    });
}
if (participantSearchInput) {
    participantSearchInput.addEventListener("input", function () {
        const query = this.value.trim().toLowerCase();
        const cards = document.querySelectorAll("#members-container .group-member-card");
        cards.forEach(function (card) {
            const name = (card.querySelector("h6") || {}).textContent || "";
            if (!query || name.toLowerCase().includes(query)) {
                card.classList.remove("d-none");
            } else {
                card.classList.add("d-none");
            }
        });
    });
}

const groupOpenFav = document.getElementById("group-open-favourites");
const groupFavCollapse = document.getElementById("group-collapse-favourites");
if (groupOpenFav && groupFavCollapse && groupOpenFav.dataset.favWired !== "1") {
    groupOpenFav.dataset.favWired = "1";
    groupOpenFav.addEventListener("click", function (e) {
        e.preventDefault();
        if (typeof bootstrap === "undefined") return;
        const inst = bootstrap.Collapse.getOrCreateInstance(groupFavCollapse);
        inst.toggle();
    });
    groupFavCollapse.addEventListener("shown.bs.collapse", function () {
        loadGroupFavouritesList(groupFavCollapse);
        const ch = groupOpenFav.querySelector(".group-fav-chevron i");
        if (ch) {
            ch.classList.remove("ti-chevron-right");
            ch.classList.add("ti-chevron-down");
        }
    });
    groupFavCollapse.addEventListener("hidden.bs.collapse", function () {
        const ch = groupOpenFav.querySelector(".group-fav-chevron i");
        if (ch) {
            ch.classList.remove("ti-chevron-down");
            ch.classList.add("ti-chevron-right");
        }
    });
}

function groupMuteDurationMsForRadioId(id) {
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const map = {
        mute1: 30 * minute,
        mute2: hour,
        mute3: day,
        mute4: 7 * day,
        mute5: 30 * day,
        mute6: 365 * day,
    };
    if (id === "mute7") return null;
    return map[id] != null ? map[id] : null;
}

const groupMuteSaveBtn = document.getElementById("group-mute-save-btn");
if (groupMuteSaveBtn) {
    groupMuteSaveBtn.addEventListener("click", function () {
        if (!currentUserId || !selectedGroupId) {
            if (typeof Toastify !== "undefined") {
                Toastify({ text: "Select a group first.", duration: 2500 }).showToast();
            }
            return;
        }
        const form = document.getElementById("group-mute-notification-form");
        const selected = form ? form.querySelector('input[name="mute"]:checked') : null;
        if (!selected) {
            if (typeof Toastify !== "undefined") {
                Toastify({ text: "Choose a mute duration.", duration: 2500 }).showToast();
            }
            return;
        }
        const id = selected.id;
        const payload =
            id === "mute7"
                ? { always: true, updatedAt: Date.now() }
                : { until: Date.now() + (groupMuteDurationMsForRadioId(id) || 0), updatedAt: Date.now() };
        set(
            ref(database, `data/users/${currentUserId}/muted_groups/${selectedGroupId}`),
            payload
        )
            .then(() => {
                if (typeof Toastify !== "undefined") {
                    Toastify({
                        text: "Notifications muted for this group.",
                        duration: 2500,
                        gravity: "top",
                        position: "right",
                        backgroundColor: "#22c55e",
                    }).showToast();
                }
                const modalEl = document.getElementById("mute-notification");
                if (modalEl && bootstrap.Modal) {
                    const m = bootstrap.Modal.getInstance(modalEl);
                    if (m) m.hide();
                }
            })
            .catch(() => {});
    });
}

async function syncGroupDisappearModalFromFirebase() {
    if (!selectedGroupId) return;
    try {
        const snap = await get(ref(database, `data/groups/${selectedGroupId}`));
        const ttl = snap.exists() ? Number(snap.val().disappearingTtlMs) : 0;
        const map = { 86400000: "disappear1", 604800000: "disappear2", 7776000000: "disappear3", 0: "disappear4" };
        const id = map[ttl] != null ? map[ttl] : "disappear4";
        const radio = document.getElementById(id);
        if (radio) radio.checked = true;
    } catch (e) {
        /* ignore */
    }
}

const msgDisappearModal = document.getElementById("msg-disapper");
if (msgDisappearModal) {
    msgDisappearModal.addEventListener("show.bs.modal", function () {
        syncGroupDisappearModalFromFirebase();
    });
}

const groupDisappearSaveBtn = document.getElementById("group-disappear-save-btn");
if (groupDisappearSaveBtn) {
    groupDisappearSaveBtn.addEventListener("click", function () {
        if (!selectedGroupId) return;
        const form = document.getElementById("group-msg-disappear-form");
        const selected = form ? form.querySelector('input[name="group_disappear"]:checked') : null;
        const ttlMs = selected ? Number(selected.value) : 0;
        const groupRef = ref(database, `data/groups/${selectedGroupId}`);
        get(groupRef)
            .then((snap) => {
                if (!snap.exists()) return Promise.reject();
                return update(groupRef, {
                    disappearingTtlMs: ttlMs,
                    disappearingUpdatedAt: Date.now(),
                });
            })
            .then(() => {
                if (typeof Toastify !== "undefined") {
                    Toastify({
                        text: "Disappearing messages setting saved.",
                        duration: 2500,
                        gravity: "top",
                        position: "right",
                        backgroundColor: "#22c55e",
                    }).showToast();
                }
                const modalEl = document.getElementById("msg-disapper");
                if (modalEl && bootstrap.Modal) {
                    const m = bootstrap.Modal.getInstance(modalEl);
                    if (m) m.hide();
                }
            })
            .catch(() => {
                if (typeof Toastify !== "undefined") {
                    Toastify({
                        text: "Could not save setting.",
                        duration: 2500,
                        backgroundColor: "#ef4444",
                    }).showToast();
                }
            });
    });
}

// Group Info panel action buttons
const groupProfileAudioBtn = document.getElementById("group-profile-audio-btn");
const groupProfileVideoBtn = document.getElementById("group-profile-video-btn");
const groupProfileChatBtn = document.getElementById("group-profile-chat-btn");
const groupProfileSearchBtn = document.getElementById("group-profile-search-btn");

if (groupProfileAudioBtn) {
    groupProfileAudioBtn.addEventListener("click", function () {
        const headerBtn = document.getElementById("audio-new-btn-group");
        if (headerBtn) headerBtn.click();
    });
}
if (groupProfileVideoBtn) {
    groupProfileVideoBtn.addEventListener("click", function () {
        const headerBtn = document.getElementById("video-call-new-btn-group");
        if (headerBtn) headerBtn.click();
    });
}
if (groupProfileChatBtn) {
    groupProfileChatBtn.addEventListener("click", function () {
        const offcanvasEl = document.getElementById("contact-profile");
        if (offcanvasEl && typeof bootstrap !== "undefined") {
            const inst = bootstrap.Offcanvas.getInstance(offcanvasEl);
            if (inst) inst.hide();
        }
        const msgInput = document.getElementById("message-input");
        if (msgInput) msgInput.focus();
    });
}
if (groupProfileSearchBtn) {
    groupProfileSearchBtn.addEventListener("click", function () {
        const offcanvasEl = document.getElementById("contact-profile");
        if (offcanvasEl && typeof bootstrap !== "undefined") {
            const inst = bootstrap.Offcanvas.getInstance(offcanvasEl);
            if (inst) inst.hide();
        }
        const searchBtn = document.querySelector(".chat-search-btn");
        if (searchBtn) searchBtn.click();
    });
}

// Member three-dot menu actions
document.addEventListener("click", function (e) {
    const actionEl = e.target.closest("[data-action]");
    if (!actionEl) return;
    const action = actionEl.dataset.action;
    const uid = actionEl.dataset.uid;
    if (!uid) return;

    if (action === "make-admin" && selectedGroupId) {
        const groupRef = ref(database, `data/groups/${selectedGroupId}`);
        get(groupRef).then(function (snap) {
            if (!snap.exists()) return;
            update(groupRef, { admin: uid }).then(function () {
                fetchGroupInfo(selectedGroupId);
                Toastify({ text: "Admin updated.", duration: 2500, gravity: "top", position: "right", backgroundColor: "#22c55e" }).showToast();
            });
        });
    }
    if (action === "remove-member" && selectedGroupId) {
        const groupRef = ref(database, `data/groups/${selectedGroupId}`);
        get(groupRef).then(function (snap) {
            if (!snap.exists()) return;
            const gd = snap.val();
            const updatedMembers = (gd.userIds || []).filter(function (id) { return id !== uid; });
            update(groupRef, { userIds: updatedMembers }).then(function () {
                fetchGroupInfo(selectedGroupId);
                Toastify({ text: "Member removed.", duration: 2500, gravity: "top", position: "right", backgroundColor: "#22c55e" }).showToast();
            });
        });
    }
});

// =========================================================================
//  SIDEBAR THREE-DOT DROPDOWN (Archive, Mute, Exit, Pin, Unread)
// =========================================================================
document.addEventListener("click", async function (e) {
    const actionEl = e.target.closest("[data-sidebar-action]");
    if (!actionEl) return;
    e.preventDefault();
    const action = actionEl.dataset.sidebarAction;
    const gid = actionEl.dataset.gid;
    if (!gid || !currentUserId) return;

    if (action === "pin") {
        await toggleGroupPin(gid);
    } else if (action === "archive") {
        await toggleGroupArchive(gid);
    } else if (action === "mute") {
        await toggleGroupMuteQuick(gid);
    } else if (action === "exit") {
        if (confirm("Are you sure you want to exit this group?")) {
            await exitGroup(gid, currentUserId);
            refreshGroupsList();
            if (selectedGroupId === gid) {
                const chatSection = document.getElementById("middle");
                const welcomeContainer = document.getElementById("welcome-container");
                if (chatSection) chatSection.style.display = "none";
                if (welcomeContainer) welcomeContainer.style.display = "block";
                selectedGroupId = null;
                if (typeof window !== "undefined") window.__dreamchatSelectedGroupId = null;
            }
        }
    } else if (action === "unread") {
        await markGroupUnread(gid);
    }
});

// =========================================================================
//  SIDEBAR RIGHT-CLICK CONTEXT MENU (Archive, Mute, Exit, Pin, Unread)
// =========================================================================
let contextMenuGroupId = null;
const groupCtxMenu = document.getElementById("group-context-menu");

document.addEventListener("contextmenu", function (e) {
    const chatListEl = e.target.closest("#group-list .chat-list");
    if (!chatListEl || !groupCtxMenu) return;
    e.preventDefault();
    contextMenuGroupId = chatListEl.dataset.groupId;

    groupCtxMenu.style.display = "block";
    groupCtxMenu.style.left = e.clientX + "px";
    groupCtxMenu.style.top = e.clientY + "px";

    const rect = groupCtxMenu.getBoundingClientRect();
    if (rect.right > window.innerWidth) groupCtxMenu.style.left = (e.clientX - rect.width) + "px";
    if (rect.bottom > window.innerHeight) groupCtxMenu.style.top = (e.clientY - rect.height) + "px";

    updateContextMenuLabels(contextMenuGroupId);
});

document.addEventListener("click", function () {
    if (groupCtxMenu) groupCtxMenu.style.display = "none";
});

async function updateContextMenuLabels(gid) {
    if (!gid || !currentUserId || !groupCtxMenu) return;
    try {
        const snap = await get(ref(database, `data/groups/${gid}`));
        if (!snap.exists()) return;
        const gd = snap.val();
        const isPinned = gd.pinnedBy && gd.pinnedBy[currentUserId];
        const isArchived = gd.archivedBy && gd.archivedBy[currentUserId];
        const pinEl = groupCtxMenu.querySelector('[data-ctx-action="pin"]');
        const archiveEl = groupCtxMenu.querySelector('[data-ctx-action="archive"]');
        if (pinEl) {
            pinEl.innerHTML = isPinned
                ? '<i class="ti ti-pinned-off me-2"></i>Unpin Group'
                : '<i class="ti ti-pin me-2"></i>Pin Group';
        }
        if (archiveEl) {
            archiveEl.innerHTML = isArchived
                ? '<i class="ti ti-archive-off me-2"></i>Unarchive Group'
                : '<i class="ti ti-archive me-2"></i>Archive Group';
        }
    } catch (e) { /* ignore */ }

    try {
        const muteSnap = await get(ref(database, `data/users/${currentUserId}/muted_groups/${gid}`));
        const isMuted = muteSnap.exists();
        const muteEl = groupCtxMenu.querySelector('[data-ctx-action="mute"]');
        if (muteEl) {
            muteEl.innerHTML = isMuted
                ? '<i class="ti ti-bell me-2"></i>Unmute Notification'
                : '<i class="ti ti-bell-off me-2"></i>Mute Notification';
        }
    } catch (e) { /* ignore */ }
}

if (groupCtxMenu) {
    groupCtxMenu.addEventListener("click", async function (e) {
        e.preventDefault();
        const actionEl = e.target.closest("[data-ctx-action]");
        if (!actionEl || !contextMenuGroupId || !currentUserId) return;
        const action = actionEl.dataset.ctxAction;
        const gid = contextMenuGroupId;
        groupCtxMenu.style.display = "none";

        if (action === "pin") {
            await toggleGroupPin(gid);
        } else if (action === "archive") {
            await toggleGroupArchive(gid);
        } else if (action === "mute") {
            await toggleGroupMuteQuick(gid);
        } else if (action === "exit") {
            if (confirm("Are you sure you want to exit this group?")) {
                await exitGroup(gid, currentUserId);
                refreshGroupsList();
                const chatSection = document.getElementById("middle");
                const welcomeContainer = document.getElementById("welcome-container");
                if (chatSection) chatSection.style.display = "none";
                if (welcomeContainer) welcomeContainer.style.display = "block";
                selectedGroupId = null;
                if (typeof window !== "undefined") window.__dreamchatSelectedGroupId = null;
            }
        } else if (action === "unread") {
            await markGroupUnread(gid);
        }
    });
}

async function toggleGroupPin(gid) {
    const groupRef = ref(database, `data/groups/${gid}`);
    try {
        const snap = await get(groupRef);
        if (!snap.exists()) return;
        const gd = snap.val();
        const pinnedBy = gd.pinnedBy || {};
        if (pinnedBy[currentUserId]) {
            delete pinnedBy[currentUserId];
            await update(groupRef, { pinnedBy: pinnedBy });
            Toastify({ text: "Group unpinned.", duration: 2000, gravity: "top", position: "right", backgroundColor: "#22c55e" }).showToast();
        } else {
            pinnedBy[currentUserId] = true;
            await update(groupRef, { pinnedBy: pinnedBy });
            Toastify({ text: "Group pinned.", duration: 2000, gravity: "top", position: "right", backgroundColor: "#22c55e" }).showToast();
        }
        refreshGroupsList();
    } catch (e) { console.error("Pin error:", e); }
}

async function toggleGroupArchive(gid) {
    const groupRef = ref(database, `data/groups/${gid}`);
    try {
        const snap = await get(groupRef);
        if (!snap.exists()) return;
        const gd = snap.val();
        const archivedBy = gd.archivedBy || {};
        if (archivedBy[currentUserId]) {
            delete archivedBy[currentUserId];
            await update(groupRef, { archivedBy: archivedBy });
            Toastify({ text: "Group unarchived.", duration: 2000, gravity: "top", position: "right", backgroundColor: "#22c55e" }).showToast();
        } else {
            archivedBy[currentUserId] = true;
            await update(groupRef, { archivedBy: archivedBy });
            Toastify({ text: "Group archived.", duration: 2000, gravity: "top", position: "right", backgroundColor: "#22c55e" }).showToast();
        }
        refreshGroupsList();
    } catch (e) { console.error("Archive error:", e); }
}

async function toggleGroupMuteQuick(gid) {
    try {
        const muteRef = ref(database, `data/users/${currentUserId}/muted_groups/${gid}`);
        const snap = await get(muteRef);
        if (snap.exists()) {
            await remove(muteRef);
            Toastify({ text: "Notifications unmuted.", duration: 2000, gravity: "top", position: "right", backgroundColor: "#22c55e" }).showToast();
        } else {
            await set(muteRef, { always: true, updatedAt: Date.now() });
            Toastify({ text: "Notifications muted.", duration: 2000, gravity: "top", position: "right", backgroundColor: "#22c55e" }).showToast();
        }
        refreshGroupsList();
    } catch (e) { console.error("Mute error:", e); }
}

async function markGroupUnread(gid) {
    try {
        const unreadRef = ref(database, `data/users/${currentUserId}/unread_groups/${gid}`);
        await set(unreadRef, { marked: true, updatedAt: Date.now() });
        refreshGroupsList();
        Toastify({ text: "Marked as unread.", duration: 2000, gravity: "top", position: "right", backgroundColor: "#22c55e" }).showToast();
    } catch (e) { console.error("Unread error:", e); }
}

// =========================================================================
//  MESSAGE INFO
// =========================================================================
document.addEventListener("click", async function (e) {
    const infoBtn = e.target.closest(".group-msg-info-btn");
    if (!infoBtn) return;
    e.preventDefault();
    const msgEl = infoBtn.closest(".chats");
    if (!msgEl) return;
    const msgKey = msgEl.dataset.messageKey;
    const groupId = msgEl.dataset.groupId;
    if (!msgKey || !groupId) return;

    try {
        const snap = await get(ref(database, `data/chats/${groupId}/${msgKey}`));
        if (!snap.exists()) return;
        const md = snap.val();

        const senderSnap = await get(ref(database, `data/users/${md.senderId}`));
        const senderData = senderSnap.exists() ? senderSnap.val() : null;
        const senderName = senderData
            ? (senderData.public_display_name || senderData.user_name || [senderData.firstName, senderData.lastName].filter(Boolean).join(" ").trim() || "Unknown")
            : "Unknown";
        const sentTime = new Date(md.timestamp || md.date).toLocaleString();

        const typeMap = { 6: "Text", 2: "Image", 1: "Video", 3: "Audio", 5: "File" };
        const typeLabel = typeMap[md.attachmentType] || "Unknown";

        let preview = "";
        if (md.attachmentType === 6) {
            try { preview = await decryptlibsodiumMessage(md.body); } catch { preview = "Encrypted message"; }
        } else {
            preview = typeLabel + " message";
        }

        document.getElementById("msg-info-content").textContent = preview;
        document.getElementById("msg-info-sender").textContent = senderName;
        document.getElementById("msg-info-time").textContent = sentTime;
        document.getElementById("msg-info-status").textContent = md.delivered ? "Delivered" : "Sent";
        document.getElementById("msg-info-type").textContent = typeLabel;

        const modal = new bootstrap.Modal(document.getElementById("group-message-info"));
        modal.show();
    } catch (err) {
        console.error("Message info error:", err);
    }
});

// =========================================================================
//  EDIT MESSAGE
// =========================================================================
document.addEventListener("click", async function (e) {
    const editBtn = e.target.closest(".group-edit-msg-btn");
    if (!editBtn) return;
    e.preventDefault();
    const msgEl = editBtn.closest(".chats");
    if (!msgEl) return;
    const msgKey = msgEl.dataset.messageKey;
    const groupId = msgEl.dataset.groupId;
    if (!msgKey || !groupId) return;

    try {
        const snap = await get(ref(database, `data/chats/${groupId}/${msgKey}`));
        if (!snap.exists()) return;
        const md = snap.val();
        if (md.senderId !== currentUserId) {
            Toastify({ text: "You can only edit your own messages.", duration: 2500, gravity: "top", position: "right", backgroundColor: "#ef4444" }).showToast();
            return;
        }
        let plainText = "";
        if (md.attachmentType === 6) {
            try { plainText = await decryptlibsodiumMessage(md.body); } catch { plainText = ""; }
        }
        document.getElementById("edit-msg-key").value = msgKey;
        document.getElementById("edit-msg-group-id").value = groupId;
        document.getElementById("edit-msg-text").value = plainText;
        const modal = new bootstrap.Modal(document.getElementById("group-edit-message"));
        modal.show();
    } catch (err) {
        console.error("Edit open error:", err);
    }
});

const saveEditMsgBtn = document.getElementById("save-edit-msg-btn");
if (saveEditMsgBtn) {
    saveEditMsgBtn.addEventListener("click", async function () {
        const msgKey = document.getElementById("edit-msg-key").value;
        const groupId = document.getElementById("edit-msg-group-id").value;
        const newText = document.getElementById("edit-msg-text").value.trim();
        if (!msgKey || !groupId || !newText) return;

        try {
            const encrypted = await encryptMessage(newText);
            const msgRef = ref(database, `data/chats/${groupId}/${msgKey}`);
            await update(msgRef, {
                body: encrypted,
                editedAt: Date.now()
            });

            const msgEl = document.querySelector(`[data-message-key="${msgKey}"]`);
            if (msgEl) {
                const contentDiv = msgEl.querySelector(".message-content > div:last-child");
                if (contentDiv) contentDiv.textContent = newText;
                if (!msgEl.querySelector(".edited-label")) {
                    const editedSpan = document.createElement("span");
                    editedSpan.className = "edited-label text-muted";
                    editedSpan.style.fontSize = "11px";
                    editedSpan.innerHTML = '<i class="ti ti-pencil" style="font-size:10px;"></i> edited';
                    const mc = msgEl.querySelector(".message-content");
                    if (mc) mc.insertBefore(editedSpan, mc.firstChild);
                }
            }

            Toastify({ text: "Message edited.", duration: 2000, gravity: "top", position: "right", backgroundColor: "#22c55e" }).showToast();
            forceCloseBootstrapModal("group-edit-message");
        } catch (err) {
            console.error("Edit save error:", err);
            Toastify({ text: "Could not edit message.", duration: 2500, gravity: "top", position: "right", backgroundColor: "#ef4444" }).showToast();
        }
    });
}

// =========================================================================
//  IMPROVED DELETE: instant DOM removal after Firebase update
// =========================================================================
function deleteForMeImmediate(messageElement, messageKey, groupId) {
    const messageRef = ref(database, `data/chats/${groupId}/${messageKey}`);
    get(messageRef).then((snapshot) => {
        if (!snapshot.exists()) return;
        const messageData = snapshot.val();
        const deletedFor = messageData.deletedFor || [];
        if (!deletedFor.includes(currentUserId)) {
            return update(messageRef, { deletedFor: [...deletedFor, currentUserId] });
        }
    }).then(() => {
        if (messageElement) messageElement.remove();
    }).catch((error) => console.error("Error deleting message:", error));
}

function deleteForEveryoneImmediate(messageKey, messageElement, groupId) {
    const messageRef = ref(database, `data/chats/${groupId}/${messageKey}`);
    remove(messageRef).then(() => {
        if (messageElement) messageElement.remove();
    }).catch((error) => console.error("Error deleting for everyone:", error));
}

// =========================================================================
//  IMPROVED EXIT GROUP: update UI without refresh
// =========================================================================
const origExitGroup = exitGroup;
async function exitGroupWithUI(groupId, userId) {
    await origExitGroup(groupId, userId);
    refreshGroupsList();
    const chatSection = document.getElementById("middle");
    const welcomeContainer = document.getElementById("welcome-container");
    if (chatSection) chatSection.style.display = "none";
    if (welcomeContainer) welcomeContainer.style.display = "block";
    selectedGroupId = null;
    if (typeof window !== "undefined") window.__dreamchatSelectedGroupId = null;
    forceCloseBootstrapModal("group-logout");
}

// Override confirm-exit button with improved version
const confirmExitImproved = document.getElementById("confirm-exit");
if (confirmExitImproved) {
    const newBtn = confirmExitImproved.cloneNode(true);
    confirmExitImproved.parentNode.replaceChild(newBtn, confirmExitImproved);
    newBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        exitGroupWithUI(selectedGroupId, currentUserId);
    });
}

// =========================================================================
//  IMPROVED DELETE GROUP: update UI without refresh
// =========================================================================
function deleteGroupChatWithUI() {
    if (!auth.currentUser || !selectedGroupId) {
        forceCloseBootstrapModal("delete-group");
        return;
    }
    const groupRef = ref(database, `data/groups/${selectedGroupId}`);
    remove(groupRef).then(() => {
        forceCloseBootstrapModal("delete-group");
        const chatSection = document.getElementById("middle");
        if (chatSection) chatSection.style.display = "none";
        const welcomeContainer = document.getElementById("welcome-container");
        if (welcomeContainer) welcomeContainer.style.display = "block";
        selectedGroupId = null;
        if (typeof window !== "undefined") window.__dreamchatSelectedGroupId = null;
        Toastify({ text: "Group deleted.", duration: 2500, gravity: "top", position: "right", backgroundColor: "#22c55e" }).showToast();
    }).catch(() => {
        Toastify({ text: "Error deleting group.", duration: 2500, gravity: "top", position: "right", backgroundColor: "#ef4444" }).showToast();
        forceCloseBootstrapModal("delete-group");
    });
}

// =========================================================================
//  IMPROVED CLEAR MESSAGES: instant UI update
// =========================================================================
function clearGroupMessagesWithUI(gid) {
    if (!gid) {
        forceCloseBootstrapModal("clear-group-chat");
        return;
    }
    const messagesRef = ref(database, `data/chats/${gid}`);
    get(messagesRef).then((snapshot) => {
        if (!snapshot.exists()) return;
        const messages = snapshot.val();
        const updates = {};
        Object.keys(messages).forEach((messageId) => {
            const message = messages[messageId];
            const clearedFor = message.clearedFor || [];
            if (!clearedFor.includes(currentUserId)) {
                updates[`chats/${gid}/${messageId}/clearedFor`] = [...clearedFor, currentUserId];
            }
        });
        return update(ref(database), updates);
    }).then(() => {
        const chatBox = document.getElementById("chat-messages");
        if (chatBox) chatBox.innerHTML = "";
        forceCloseBootstrapModal("clear-group-chat");
        Toastify({ text: "Messages cleared.", duration: 2000, gravity: "top", position: "right", backgroundColor: "#22c55e" }).showToast();
    }).catch((error) => {
        console.error("Error clearing chat:", error);
        forceCloseBootstrapModal("clear-group-chat");
    });
}

// =========================================================================
//  REPORT GROUP: Firebase-backed functionality
// =========================================================================
const reportGroupForm = document.querySelector("#report-group form");
if (reportGroupForm) {
    reportGroupForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        if (!selectedGroupId || !currentUserId) return;
        try {
            const reportRef = ref(database, `data/reports/groups/${selectedGroupId}/${currentUserId}`);
            await set(reportRef, {
                reportedBy: currentUserId,
                groupId: selectedGroupId,
                timestamp: Date.now(),
                blockAndClear: reportGroupForm.querySelector('input[type="checkbox"]')?.checked || false
            });
            Toastify({ text: "Group reported.", duration: 2500, gravity: "top", position: "right", backgroundColor: "#22c55e" }).showToast();
            forceCloseBootstrapModal("report-group");
        } catch (err) {
            console.error("Report error:", err);
            Toastify({ text: "Could not submit report.", duration: 2500, gravity: "top", position: "right", backgroundColor: "#ef4444" }).showToast();
        }
    });
}

// =========================================================================
//  BLOCK GROUP: Firebase-backed functionality
// =========================================================================
const blockUserForm = document.querySelector("#block-user form");
if (blockUserForm) {
    blockUserForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        if (!selectedGroupId || !currentUserId) return;
        try {
            const blockRef = ref(database, `data/users/${currentUserId}/blocked_groups/${selectedGroupId}`);
            await set(blockRef, { blockedAt: Date.now() });
            await exitGroup(selectedGroupId, currentUserId);
            Toastify({ text: "Group blocked.", duration: 2500, gravity: "top", position: "right", backgroundColor: "#22c55e" }).showToast();
            forceCloseBootstrapModal("block-user");
            refreshGroupsList();
            const chatSection = document.getElementById("middle");
            const welcomeContainer = document.getElementById("welcome-container");
            if (chatSection) chatSection.style.display = "none";
            if (welcomeContainer) welcomeContainer.style.display = "block";
            selectedGroupId = null;
            if (typeof window !== "undefined") window.__dreamchatSelectedGroupId = null;
        } catch (err) {
            console.error("Block error:", err);
            Toastify({ text: "Could not block group.", duration: 2500, gravity: "top", position: "right", backgroundColor: "#ef4444" }).showToast();
        }
    });
}


});