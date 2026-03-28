import { initializeFirebase } from './firebase-user.js';
import { initializeApp, setLogLevel } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    sendPasswordResetEmail,
    signInWithCustomToken,
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

    // Monitor the user's authentication state (chat session)
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUserId = user.uid;
        } else {
            currentUserId = null; // signed out or session expired
        }
    });

    // Proactively restore Firebase session from Laravel when we have no Firebase user (e.g. page refresh with Laravel session)
    setTimeout(function tryRestoreChatSession() {
        if (auth.currentUser || currentUserId) return;
        const baseUrl = (typeof window !== "undefined" && window.location && window.location.origin) ? window.location.origin : "";
        fetch(baseUrl + "/api/restore-chat-session", { method: "GET", credentials: "include" })
            .then(function (r) { return r.json().then(function (data) { return { ok: r.ok, data: data }; }); })
            .then(function (result) {
                if (result.ok && result.data && result.data.firebase_custom_token) {
                    return signInWithCustomToken(auth, result.data.firebase_custom_token).then(function () {
                        initContactList(); // Refresh contact list after session restore
                    });
                }
            })
            .catch(function () {});
    }, 1500);

    // Initialize Firebase Database reference
    const usersRef = ref(database, "data/users"); // Correct Firebase reference to the "users" node

    /** Avatar URL for <img src> — handles http(s), data:, relative Laravel paths from any route. */
    function resolveProfileImageUrl(raw) {
        const origin = (typeof window !== "undefined" && window.location && window.location.origin) ? window.location.origin : "";
        const defaultPath = "/assets/img/profiles/avatar-03.jpg";
        if (raw == null || !String(raw).trim()) {
            return origin ? origin + defaultPath : defaultPath.replace(/^\//, "assets/img/profiles/avatar-03.jpg");
        }
        const s = String(raw).trim();
        if (/^https?:\/\//i.test(s) || s.startsWith("data:") || s.startsWith("blob:")) return s;
        if (s.startsWith("//")) return (typeof window !== "undefined" && window.location && window.location.protocol ? window.location.protocol : "https:") + s;
        const path = s.replace(/^\.?\/+/, "");
        return origin ? origin + "/" + path : s;
    }

    /** Load profile_image URLs from Laravel for contacts with no Firebase/local avatar (auth + CSRF). */
    async function fetchLaravelContactAvatars(payload) {
        const origin = (typeof window !== "undefined" && window.location && window.location.origin) ? window.location.origin : "";
        const token = typeof document !== "undefined" && document.querySelector('meta[name="csrf-token"]') ? document.querySelector('meta[name="csrf-token"]').getAttribute("content") : "";
        if (!origin || !token) return null;
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
                body: JSON.stringify(payload),
            });
            if (!r.ok) return null;
            return await r.json();
        } catch (e) {
            return null;
        }
    }

    function applyLaravelAvatarMap(user, byUid, byEmail, byUsername) {
        if (!user) return;
        const uid = user.uid;
        let url = "";
        if (uid && String(uid).indexOf("pending_") !== 0 && byUid && byUid[uid]) url = byUid[uid];
        if (!url && user.email && byEmail) {
            const e = String(user.email).trim().toLowerCase();
            if (e && byEmail[e]) url = byEmail[e];
        }
        if (!url && user.userName && byUsername) {
            const un = String(user.userName).trim().toLowerCase();
            if (un && byUsername[un]) url = byUsername[un];
        }
        if (url && String(url).trim()) {
            user.image = resolveProfileImageUrl(String(url).trim());
        }
    }

    function applyLaravelRoleMap(user, roleByUid, roleByEmail, roleByUsername) {
        if (!user) return;
        let r = "";
        if (user.uid && String(user.uid).indexOf("pending_") !== 0 && roleByUid && roleByUid[user.uid]) {
            r = roleByUid[user.uid];
        }
        if (!r && user.email && String(user.email).trim() && roleByEmail) {
            const e = String(user.email).trim().toLowerCase();
            if (roleByEmail[e]) r = roleByEmail[e];
        }
        if (!r && user.userName && String(user.userName).trim() && roleByUsername) {
            const k = String(user.userName).trim().toLowerCase();
            if (roleByUsername[k]) r = roleByUsername[k];
        }
        if (r) user.primaryRole = r;
    }

    async function enrichContactListAvatarsFromLaravel(usersArray) {
        const need = usersArray.filter(function (u) {
            return u && u._needsLaravelAvatar;
        });
        usersArray.forEach(function (u) {
            if (u) delete u._needsLaravelAvatar;
        });
        if (!usersArray.length) return;
        const firebase_uids = [];
        const seenUid = new Set();
        const emails = [];
        const seenEmail = new Set();
        const usernames = [];
        const seenUser = new Set();
        usersArray.forEach(function (u) {
            if (!u) return;
            if (u.uid && String(u.uid).indexOf("pending_") !== 0 && !seenUid.has(u.uid)) {
                seenUid.add(u.uid);
                firebase_uids.push(u.uid);
            }
            if (u.email && String(u.email).trim()) {
                const e = String(u.email).trim().toLowerCase();
                if (!seenEmail.has(e)) {
                    seenEmail.add(e);
                    emails.push(e);
                }
            }
            if (u.userName && String(u.userName).trim()) {
                const un = String(u.userName).trim();
                if (!seenUser.has(un)) {
                    seenUser.add(un);
                    usernames.push(un);
                }
            }
        });
        const data = await fetchLaravelContactAvatars({
            firebase_uids: firebase_uids.slice(0, 60),
            emails: emails.slice(0, 60),
            usernames: usernames.slice(0, 60),
        });
        if (!data) return;
        const roleByUid = data.role_by_uid || {};
        const roleByEmail = data.role_by_email || {};
        const roleByUsername = data.role_by_username || {};
        usersArray.forEach(function (u) {
            applyLaravelRoleMap(u, roleByUid, roleByEmail, roleByUsername);
        });
        if (!need.length) return;
        const byUid = data.by_uid || {};
        const byEmail = data.by_email || {};
        const byUsername = data.by_username || {};
        need.forEach(function (u) {
            applyLaravelAvatarMap(u, byUid, byEmail, byUsername);
        });
    }

    function displayUsers(searchTerm = '') {
        const uid = currentUserId || (typeof getCurrentFirebaseUid === 'function' ? getCurrentFirebaseUid() : null);
        if (!uid) return;
        const contactsRef = ref(database, `data/contacts/${uid}`);
        get(contactsRef).then(async snapshot => {
            if (snapshot.exists()) {
                const contacts = snapshot.val(); // Get all contacts
                const contactIds = Object.keys(contacts); // Get the contact user IDs
    
                const usersArrayRaw = await Promise.all(
                    contactIds.map(async (userId) => {
                        const contact = contacts[userId] || {}; // Get contact data safely
                        try {
                            const userRef = ref(database, `data/users/${userId}`); // Correct Firebase reference
                            const snapshot = await get(userRef); // Fetch user details
                            let userData = {};
                            if (snapshot.exists()) {
                                userData = snapshot.val(); // Get user details
                            }
                            const rawAvatar =
                                contact.profile_image ||
                                userData.profile_image ||
                                userData.image ||
                                userData.profileImage ||
                                userData.photoURL ||
                                userData.avatar ||
                                "";
                            const prLocal =
                                (contact.primary_role && String(contact.primary_role).trim()) ||
                                (userData.primary_role && String(userData.primary_role).trim()) ||
                                "";
                            return {
                                uid: userId,
                                firstName: contact.firstName || userData.firstName || "",
                                lastName: contact.lastName || userData.lastName ||  "",
                                userName: userData.username || userData.userName || userData.profileName || contact.user_name || "",
                                image: resolveProfileImageUrl(rawAvatar),
                                _needsLaravelAvatar: !rawAvatar,
                                primaryRole: prLocal,
                                mobile_number: contact.mobile_number || userData.mobile_number ||  "",
                                email: contact.email || userData.email ||  "",
                            };
                        } catch (error) {
                            console.error(`Error fetching user data for ${userId}:`, error);
                            return null;
                        }
                    })
                );
                let usersArray = usersArrayRaw.filter(function (user) { return user != null; });
                await enrichContactListAvatarsFromLaravel(usersArray);

                // Sort users alphabetically by first name; "Others" = anyone without both first and last name (so no one is dropped)
                const validUsersArray = usersArray.filter(user => user.firstName && user.lastName);
                const othersArray = usersArray.filter(user => !(user.firstName && user.lastName));
                // Sort valid users alphabetically by first name
                validUsersArray.sort((a, b) => a.firstName.localeCompare(b.firstName));
    
                const searchLower = searchTerm.toLowerCase();
                const filteredUsersArray = validUsersArray.filter(user =>
                    (user.firstName && user.firstName.toLowerCase().includes(searchLower)) ||
                    (user.lastName && user.lastName.toLowerCase().includes(searchLower)) ||
                    (user.userName && user.userName.toLowerCase().includes(searchLower))
                );
                const filteredOthersArray = othersArray.filter(user =>
                    !searchLower ||
                    (user.email && user.email.toLowerCase().includes(searchLower)) ||
                    (user.userName && user.userName.toLowerCase().includes(searchLower)) ||
                    (user.firstName && user.firstName.toLowerCase().includes(searchLower)) ||
                    (user.lastName && user.lastName.toLowerCase().includes(searchLower))
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
    
                // Include the 'Others' category (includes pending contacts)
                if (filteredOthersArray.length > 0) {
                    groupedUsers['Others'] = filteredOthersArray;
                }
    
                const containers = getContactListContainers();
                if (containers.length === 0) return;
                containers.forEach(function (c) { c.innerHTML = ''; });

                // Build the full HTML once
                let fullHtml = '';
                Object.keys(groupedUsers).forEach(letter => {
                    const group = groupedUsers[letter];
                    let groupHtml = `
                    <div class="mb-4">
                        <h6 class="mb-2">${letter}</h6>
                        <div class="chat-list">
                    `;
                    group.forEach(user => {
                        const contact = contacts[user.uid] || {};
                        const displayName = (contact.firstName || user.firstName || user.userName || user.mobile_number || user.email) + ' ' + (contact.lastName || user.lastName || '').trim();
                        const listLabel = displayName.trim() || user.email || user.userName || "Unknown";
                        const imgSrcSafe = String(user.image || "").replace(/"/g, "&quot;");
                        const roleEsc = user.primaryRole
                            ? String(user.primaryRole).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;")
                            : "";
                        const roleLine = roleEsc ? `<p class="text-muted small mb-0">${roleEsc}</p>` : "";
                        groupHtml += `
                        <a href="javascript:void(0);" data-bs-toggle="modal" data-bs-target="#contact-details" class="chat-user-list"
                            data-user-id="${user.uid}" data-username="${(user.userName || '').replace(/"/g, '&quot;')}">
                            <div class="avatar avatar-lg me-2">
                                <img src="${imgSrcSafe}" class="rounded-circle" alt="image">
                            </div>
                            <div class="chat-user-info">
                                <div class="chat-user-msg">
                                    <h6>${listLabel}</h6>
                                    ${roleLine}
                                </div>
                            </div>
                        </a>
                    `;
                    });
                    groupHtml += '</div></div>';
                    fullHtml += groupHtml;
                });

                containers.forEach(function (c) { c.innerHTML = fullHtml; });

                // Bind only inside contact list containers — not document-wide (All Chats rows also use .chat-user-list with data-user-id on .chat-list parent).
                containers.forEach(function (c) {
                    c.querySelectorAll('.chat-user-list').forEach(function (item) {
                        item.addEventListener('click', function () {
                            const row = this.closest('.chat-list');
                            const userId = this.getAttribute('data-user-id') || (row ? row.getAttribute('data-user-id') : null);
                            const modal = document.getElementById('contact-details');
                            const modalInput = modal ? modal.querySelector('input[id="contact-detail-user-id"]') : null;
                            if (modalInput) modalInput.value = userId || '';
                            fetchUserData(userId);
                        });
                    });
                });
            } else {
                const msg = '<p id="no-message">No Contacts Found!</p>';
                getContactListContainers().forEach(function (el) { el.innerHTML = msg; });
            }
        }).catch(error => {
            console.error("Error fetching contacts: ", error);
            const msg = '<p id="no-message">No Contacts Found!</p>';
            try {
                getContactListContainers().forEach(function (el) { el.innerHTML = msg; });
            } catch (e) { console.error(e); }
        });
    }

    function getContactListContainers() {
        /* Only the sidebar list (#chatContainer) and explicit [data-contact-list] hooks — never #chat-container in spa-page-content (that sat beside welcome and duplicated the full list on /contact). */
        const byId = [document.getElementById('chatContainer')];
        const byAttr = Array.prototype.slice.call(document.querySelectorAll('[data-contact-list]'));
        const seen = new Set();
        return byId.concat(byAttr).filter(function (el) {
            if (!el || seen.has(el)) return false;
            if (el.id === 'chat-container') return false;
            seen.add(el);
            return true;
        });
    }
    
    function contactDetailValuePresent(val) {
        if (val === null || val === undefined) return false;
        const s = String(val).trim();
        return s !== "" && s !== "—";
    }
    function updateContactSocialCardVisibility() {
        const card = document.getElementById("contact-details-social-card");
        if (!card) return;
        const keys = ["facebook", "twitter", "instagram", "linkedin", "youtube", "kick", "twitch"];
        let any = false;
        keys.forEach(function (k) {
            const row = card.querySelector('[data-contact-row="' + k + '"]');
            if (row && row.style.display !== "none") any = true;
        });
        card.style.display = any ? "" : "none";
    }
    function setContactDetailRow(field, value, asLink) {
        const modal = document.getElementById("contact-details");
        if (!modal) return;
        const row = modal.querySelector('[data-contact-row="' + field + '"]');
        const el = modal.querySelector('.fw-medium.fs-14.mb-2[data-field="' + field + '"]');
        if (field === "local_time") {
            if (el) el.textContent = value != null ? String(value) : "—";
            if (row) row.style.display = "";
            return;
        }
        if (!contactDetailValuePresent(value)) {
            if (row) row.style.display = "none";
            return;
        }
        if (row) row.style.display = "";
        if (!el) return;
        if (asLink && value && (String(value).indexOf("http") === 0 || String(value).indexOf("www") === 0)) {
            const href = String(value).indexOf("http") === 0 ? value : "https://" + value;
            el.innerHTML = '<a href="' + href.replace(/"/g, "&quot;") + '" target="_blank" rel="noopener">' + String(value).replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</a>";
        } else {
            el.textContent = String(value);
        }
    }
    function setContactDetailRowIfPresent(field, value, asLink) {
        if (value === null || value === undefined) return;
        if (typeof value === "string" && value.trim() === "") return;
        setContactDetailRow(field, value, asLink);
    }
    function setContactDetailRoleSubtitle(contactData, userData, pub) {
        const el = document.getElementById("contact-detail-title");
        if (!el) return;
        let r = "";
        if (pub && pub.primary_role != null && String(pub.primary_role).trim()) {
            r = String(pub.primary_role).trim();
        } else if (contactData && contactData.primary_role && String(contactData.primary_role).trim()) {
            r = String(contactData.primary_role).trim();
        } else if (userData && userData.primary_role && String(userData.primary_role).trim()) {
            r = String(userData.primary_role).trim();
        }
        if (r) {
            el.textContent = r;
            el.style.display = "";
        } else {
            el.textContent = "";
            el.style.display = "none";
        }
    }

    // Fetch user data from Firebase using user ID and display it in the modal
    function fetchUserData(userId) {
        const uid = userId != null ? String(userId).trim() : '';
        if (!currentUserId || !uid) {
            return;
        }

        const contactRef = ref(database, `data/contacts/${currentUserId}/${uid}`); // Reference to the contact data

        // Fetch contact data from Firebase
        get(contactRef).then(async snapshot => {
            if (snapshot.exists()) {
                const userRef = ref(database, `data/users/${uid}`); // Correct Firebase reference
                const snapshot = await get(userRef); // Fetch user details
                let userData = {};
                if (snapshot.exists()) {
                    userData = snapshot.val(); // Get user details
                }
                const snapshotContact = await get(contactRef);
                const contactData = snapshotContact.val();
                // Update modal content with fetched data (set both modal input and legacy id for compatibility)
                const modalInput = document.getElementById('contact-details')?.querySelector('input[id="contact-detail-user-id"]');
                if (modalInput) modalInput.value = uid;
                const legacyEl = document.getElementById("edit-contact-user-id");
                if (legacyEl) legacyEl.value = uid;
                // Name: contact first, then userData fallback; then mobile/email/userName
                const firstName = (contactData.firstName || userData.firstName || "").trim();
                const lastName = (contactData.lastName || userData.lastName || "").trim();
                const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
                const displayName = fullName || contactData.mobile_number || contactData.email || userData.userName || userData.mobile_number || userData.email || "—";
                const nameEl = document.getElementById("contact-detail-name") || document.querySelector("#contact-details .modal-body h6");
                if (nameEl) nameEl.textContent = displayName;
                const contactDetailNameEl = document.getElementById("contact-detail-name");
                if (contactDetailNameEl) contactDetailNameEl.textContent = displayName;
                setContactDetailRoleSubtitle(contactData, userData, null);
                // Profile image: contact + Firebase, then Laravel for older contacts without stored photo
                var avatarImgEl = document.querySelector('#contact-details .avatar img');
                var rawAvatar = (contactData && contactData.profile_image) || (userData && (userData.profile_image || userData.image || userData.profileImage || userData.photoURL || userData.avatar)) || '';
                if (!rawAvatar) {
                    const fbUids = uid && String(uid).indexOf('pending_') !== 0 ? [uid] : [];
                    const emailList = [];
                    const unList = [];
                    if (contactData && contactData.email && String(contactData.email).trim()) emailList.push(String(contactData.email).trim().toLowerCase());
                    if (userData && userData.email && String(userData.email).trim()) {
                        const em = String(userData.email).trim().toLowerCase();
                        if (emailList.indexOf(em) < 0) emailList.push(em);
                    }
                    if (contactData && contactData.user_name && String(contactData.user_name).trim()) unList.push(String(contactData.user_name).trim());
                    if (userData && (userData.userName || userData.username)) {
                        const un = String(userData.userName || userData.username).trim();
                        if (un && unList.indexOf(un) < 0) unList.push(un);
                    }
                    const laravelMap = await fetchLaravelContactAvatars({
                        firebase_uids: fbUids,
                        emails: emailList,
                        usernames: unList,
                    });
                    if (laravelMap) {
                        const bu = laravelMap.by_uid || {};
                        const be = laravelMap.by_email || {};
                        const buser = laravelMap.by_username || {};
                        if (fbUids.length && bu[uid]) rawAvatar = bu[uid];
                        if (!rawAvatar && emailList.length) {
                            for (let i = 0; i < emailList.length && !rawAvatar; i++) {
                                if (be[emailList[i]]) rawAvatar = be[emailList[i]];
                            }
                        }
                        if (!rawAvatar && unList.length) {
                            for (let j = 0; j < unList.length && !rawAvatar; j++) {
                                const k = String(unList[j]).toLowerCase();
                                if (buser[k]) rawAvatar = buser[k];
                            }
                        }
                    }
                }
                var chosenAvatar = resolveProfileImageUrl(rawAvatar);
                if (avatarImgEl) avatarImgEl.src = chosenAvatar;
                const phoneVal = contactData.mobile_number || userData.mobile_number || "N/A";
                const emailVal = contactData.email || userData.email || "N/A";
                const phoneEl = document.querySelector('#contact-details .fw-medium.fs-14.mb-2[data-field="phone"]');
                if (phoneEl) phoneEl.textContent = phoneVal;
                const emailEl = document.querySelector('#contact-details .fw-medium.fs-14.mb-2[data-field="email"]');
                if (emailEl) emailEl.textContent = emailVal;

                const now = new Date();
                const localTimeStr = now.getHours() + ':' + (now.getMinutes() < 10 ? '0' : '') + now.getMinutes() + ' ' + (now.getHours() >= 12 ? 'PM' : 'AM');
                setContactDetailRow("local_time", localTimeStr);

                const defaultDob = contactData?.dob || userData?.dob || '';
                const defaultBio =
                    contactData?.about || contactData?.bio || userData?.about || userData?.bio || userData?.user_about || '';
                const defaultLocation =
                    contactData?.location || contactData?.country || userData?.country || userData?.location || '';
                const defaultJoin =
                    userData?.join_date || userData?.created_at || userData?.timestamp || contactData?.join_date || contactData?.created_at || '';
                const defaultWebsite =
                    (userData?.websites && userData.websites[0] && userData.websites[0].url ? userData.websites[0].url : '') ||
                    userData?.website_url || userData?.website_link ||
                    contactData?.website_url || contactData?.website_link || '';

                setContactDetailRowIfPresent("dob", defaultDob);
                setContactDetailRowIfPresent("bio", defaultBio);
                setContactDetailRowIfPresent("location", defaultLocation);
                setContactDetailRowIfPresent("join_date", defaultJoin);
                setContactDetailRowIfPresent("website", defaultWebsite, true);

                const getDefaultSocial = function (k) {
                    return (
                        contactData?.[k + '_link'] ||
                        contactData?.[k] ||
                        userData?.[k + '_link'] ||
                        userData?.[k] ||
                        userData?.social_links?.[k] ||
                        (userData?.social_links && userData.social_links[k]) ||
                        ''
                    );
                };

                ["facebook", "twitter", "instagram", "linkedin", "youtube", "kick", "twitch"].forEach(function (k) {
                    setContactDetailRowIfPresent(k, getDefaultSocial(k), true);
                });
                updateContactSocialCardVisibility();

                function applyPubProfileToModal(pub) {
                    if (!pub || pub.profile_loaded !== true) return;
                    const h6El = document.getElementById("contact-detail-name");
                    if (pub.display_name && h6El) h6El.textContent = pub.display_name;
                    const subEl = document.getElementById("contact-detail-title");
                    if (subEl) {
                        const r = pub.primary_role && String(pub.primary_role).trim() ? String(pub.primary_role).trim() : "";
                        if (r) {
                            subEl.textContent = r;
                            subEl.style.display = "";
                        } else {
                            subEl.textContent = "";
                            subEl.style.display = "none";
                        }
                    }
                    setContactDetailRowIfPresent("dob", pub.dob);
                    setContactDetailRowIfPresent("bio", pub.bio);
                    setContactDetailRowIfPresent("location", pub.location);
                    setContactDetailRowIfPresent("join_date", pub.join_date);

                    const socialKeys = ["facebook", "twitter", "instagram", "linkedin", "youtube", "kick", "twitch"];
                    if (pub.websites && pub.websites.length > 0 && pub.websites[0].url) {
                        setContactDetailRow("website", pub.websites[0].url, true);
                    } else {
                        setContactDetailRow("website", "");
                    }
                    if (pub.social_links) {
                        socialKeys.forEach(function (k) {
                            const v = pub.social_links[k];
                            if (v && String(v).trim()) setContactDetailRow(k, v, true);
                            else setContactDetailRow(k, "");
                        });
                    }
                    updateContactSocialCardVisibility();
                }

                const contactEmail = (contactData && contactData.email) || (userData && userData.email);
                const contactUsername =
                    (contactData && (contactData.userName || contactData.username || contactData.user_name)) ||
                    (userData && (userData.userName || userData.username || userData.user_name)) ||
                    (contactData && contactData.mobile_number) ||
                    (userData && userData.mobile_number);

                // API enrichment (only overwrite when values are present)
                if (contactEmail && String(contactEmail).trim() !== "") {
                    fetch("/api/public-profile-by-email?email=" + encodeURIComponent(contactEmail))
                        .then(function (r) { return r.json(); })
                        .then(function (pub) {
                            if (!pub) return;
                            applyPubProfileToModal(pub);
                        })
                        .catch(function () {});
                } else if (contactUsername && String(contactUsername).trim() !== "") {
                    fetch("/api/public-profile-by-username?username=" + encodeURIComponent(contactUsername))
                        .then(function (r) { return r.json(); })
                        .then(function (pub) {
                            if (!pub) return;
                            applyPubProfileToModal(pub);
                        })
                        .catch(function () {});
                } else {
                    fetch("/api/public-profile-by-firebase-uid?uid=" + encodeURIComponent(uid))
                        .then(function (r) { return r.json(); })
                        .then(function (pub) {
                            if (!pub) return;
                            applyPubProfileToModal(pub);
                        })
                        .catch(function () {});
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

    /** Prefer current browser origin so /contact on 127.0.0.1:8000 does not redirect to a mismatched APP_URL (e.g. localhost). */
    function chatAppBaseUrl() {
        if (typeof window !== "undefined" && window.location && window.location.origin) {
            return String(window.location.origin).replace(/\/$/, "");
        }
        if (typeof APP_URL !== "undefined" && APP_URL) {
            return String(APP_URL).replace(/\/$/, "");
        }
        return "";
    }

    function handleVoiceCallClick() {
        const modal = document.getElementById('contact-details');
        const modalInput = modal ? modal.querySelector('input[id="contact-detail-user-id"]') : null;
        const userId = (modalInput && modalInput.value) ? modalInput.value.trim() : (document.getElementById('edit-contact-user-id')?.value || '').trim();
        if (!currentUserId || !userId) return;

        const modalEl = document.getElementById('contact-details');
        if (modalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const m = bootstrap.Modal.getInstance(modalEl);
            if (m) m.hide();
        }
        const callBtn = document.getElementById('audio-call-btn') || document.getElementById('audio-new-btn-group');
        if (callBtn) {
            try { localStorage.setItem('selectedUserId', userId); } catch (e) {}
            callBtn.click();
        } else {
            const baseUrl = chatAppBaseUrl();
            window.location.href = baseUrl + '/chat?user=' + encodeURIComponent(userId) + '&call=voice';
        }
    }

    function handleVideoCallClick() {
        const modal = document.getElementById('contact-details');
        const modalInput = modal ? modal.querySelector('input[id="contact-detail-user-id"]') : null;
        const userId = (modalInput && modalInput.value) ? modalInput.value.trim() : (document.getElementById('edit-contact-user-id')?.value || '').trim();
        if (!currentUserId || !userId) return;

        const modalEl = document.getElementById('contact-details');
        if (modalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const m = bootstrap.Modal.getInstance(modalEl);
            if (m) m.hide();
        }
        const callBtn = document.getElementById('video-call-new-btn') || document.getElementById('video-call-new-btn-group');
        if (callBtn) {
            try { localStorage.setItem('selectedUserId', userId); } catch (e) {}
            callBtn.click();
        } else {
            const baseUrl = chatAppBaseUrl();
            window.location.href = baseUrl + '/chat?user=' + encodeURIComponent(userId) + '&call=video';
        }
    }

    function handleChatButtonClick() {
        const modal = document.getElementById("contact-details");
        const modalInput = modal ? modal.querySelector('input[id="contact-detail-user-id"]') : null;
        const userId = (modalInput && modalInput.value) ? modalInput.value.trim() : (document.getElementById("edit-contact-user-id")?.value || '').trim();
        if (!userId) {
            Toastify({
                text: "Please select a contact first.",
                duration: 3000,
                gravity: "top",
                position: "right",
                backgroundColor: "#ff6b6b",
            }).showToast();
            return;
        }
        const baseUrl = chatAppBaseUrl();
        if (!baseUrl) {
            Toastify({
                text: "Cannot open chat (missing site URL).",
                duration: 3000,
                gravity: "top",
                position: "right",
                backgroundColor: "#ff6b6b",
            }).showToast();
            return;
        }
        const modalEl = document.getElementById('contact-details');
        if (modalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const m = bootstrap.Modal.getInstance(modalEl);
            if (m) m.hide();
        }
        try { localStorage.setItem('selectedUserId', userId); } catch (e) {}
        try { sessionStorage.setItem('dreamchat_active_peer', String(userId)); } catch (e) {}
        // Navigate immediately — a blocking RTDB get() here could hang (rules/network) and never assign location.href.
        window.location.href = baseUrl + '/chat?user=' + encodeURIComponent(userId);
    }
    
    

    // Load contacts on page load and when auth state is ready
    function initContactList() {
        if (currentUserId) displayUsers();
    }
    initContactList();
    onAuthStateChanged(auth, function () { initContactList(); });
    // Retry after a delay in case Firebase auth restores late (e.g. restore-chat-session)
    setTimeout(initContactList, 800);
    setTimeout(initContactList, 2500);

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

        if (!auth.currentUser) {
            if (typeof Swal !== "undefined") {
                Swal.fire({ title: "", width: 400, text: "Please sign in to add contacts.", icon: "warning" });
            } else { alert("Please sign in to add contacts."); }
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

                                    // Add logged-in user to the existing user's contact list with the mobile_number
                                    const newUserContactsRef = ref(
                                        database,
                                        "data/contacts/" + existingUserId + "/" + loggedInUserId
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
                                displayUsers();
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
                                displayUsers();
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


    // Search by username or email - add contact from API results (event delegation so it works when modal is injected by SPA)
    let addContactSearchTimeout;
    document.addEventListener("input", function (e) {
        if (e.target.id !== "add-contact-username-search") return;
        const addContactSearchResults = document.getElementById("add-contact-search-results");
        if (!addContactSearchResults) return;
        const q = (e.target.value || "").trim();
        clearTimeout(addContactSearchTimeout);
        if (q.length < 4) {
            addContactSearchResults.style.display = "none";
            addContactSearchResults.innerHTML = "";
            return;
        }
        addContactSearchTimeout = setTimeout(() => {
            fetch(`/api/users/search?q=${encodeURIComponent(q)}`, { credentials: "same-origin", headers: { "Accept": "application/json", "X-Requested-With": "XMLHttpRequest" } })
                .then(r => {
                    if (!r.ok) throw new Error("Search failed");
                    return r.json();
                })
                .then(data => {
                    const users = data.users || [];
                    addContactSearchResults.innerHTML = "";
                    if (users.length === 0) {
                        addContactSearchResults.innerHTML = '<p class="text-muted small mb-0 p-2">No users found.</p>';
                    } else {
                        users.forEach(u => {
                            const div = document.createElement("div");
                            div.className = "d-flex align-items-center justify-content-between p-2 border-bottom";
                            const displayName = u.full_name || [u.first_name, u.last_name].filter(Boolean).join(" ") || u.user_name || "User";
                            const safe = (v) => (v != null ? String(v).replace(/"/g, "&quot;").replace(/</g, "&lt;") : "");
                            const avatarSrc = safe(resolveProfileImageUrl(u.profile_image || ""));
                            const profileEnc = encodeURIComponent(u.profile_image || "");
                            const roleEnc = encodeURIComponent(u.primary_role != null ? String(u.primary_role) : "");
                            div.innerHTML = `
                                <div class="d-flex align-items-center">
                                    <img src="${avatarSrc}" class="rounded-circle me-2" width="32" height="32" alt="">
                                    <div>
                                        <strong>${displayName.replace(/</g, "&lt;")}</strong>
                                        <br><small class="text-muted">@${(u.user_name || "").replace(/</g, "&lt;")}</small>
                                    </div>
                                </div>
                                <button type="button" class="btn btn-sm btn-primary add-contact-from-search" data-uid="${safe(u.firebase_uid)}" data-name="${safe(displayName)}" data-username="${safe(u.user_name)}" data-first-name="${safe(u.first_name)}" data-last-name="${safe(u.last_name)}" data-profile-image="${profileEnc}" data-primary-role="${roleEnc}">Add</button>
                            `;
                            addContactSearchResults.appendChild(div);
                        });
                        // Buttons are in the DOM; click is handled via delegation below
                    }
                    addContactSearchResults.style.display = "block";
                })
                .catch(() => {
                    addContactSearchResults.innerHTML = '<p class="text-danger small mb-0 p-2">Search failed.</p>';
                    addContactSearchResults.style.display = "block";
                });
        }, 300);
    });

    function getCurrentFirebaseUid() {
        return auth.currentUser?.uid || currentUserId;
    }

    function ensureSignedInThenAdd(btn, retryCount) {
        retryCount = retryCount || 0;
        const uid = getCurrentFirebaseUid();
        if (uid) {
            let dataUid = (btn.getAttribute("data-uid") || "").trim();
            const name = (btn.getAttribute("data-name") || "").trim();
            const username = (btn.getAttribute("data-username") || "").trim();
            const email = (btn.getAttribute("data-email") || "").trim();
            const firstNameFromApi = (btn.getAttribute("data-first-name") || "").trim();
            const lastNameFromApi = (btn.getAttribute("data-last-name") || "").trim();
            let profileImageFromSearch = "";
            try {
                const enc = btn.getAttribute("data-profile-image") || "";
                if (enc) profileImageFromSearch = decodeURIComponent(enc);
            } catch (e) { profileImageFromSearch = btn.getAttribute("data-profile-image") || ""; }
            let primaryRoleFromSearch = "";
            try {
                const re = btn.getAttribute("data-primary-role") || "";
                if (re) primaryRoleFromSearch = decodeURIComponent(re);
            } catch (e2) { primaryRoleFromSearch = btn.getAttribute("data-primary-role") || ""; }
            if (!dataUid && !email && !username && !name) {
                if (typeof Swal !== "undefined") Swal.fire({ text: "Cannot add: no user info.", icon: "info", width: 400 });
                return;
            }
            (dataUid ? Promise.resolve(dataUid) : resolveEmailOrUsernameToFirebaseUid(email, username))
                .then(resolvedUid => {
                    if (resolvedUid === uid) {
                        Swal.fire({ text: "You can't add yourself to contacts.", icon: "info", width: 400 });
                        return;
                    }
                    if (resolvedUid) {
                        addContactFromSearch(resolvedUid, name, username, email, firstNameFromApi, lastNameFromApi, profileImageFromSearch, primaryRoleFromSearch);
                    } else {
                        addPendingContact(email, username, name, profileImageFromSearch, primaryRoleFromSearch);
                    }
                })
                .catch(err => {
                    if (typeof Swal !== "undefined") Swal.fire({ text: err && err.message ? err.message : "Could not add contact.", icon: "error", width: 400 });
                    else alert("Could not add contact.");
                });
            return;
        }
        if (retryCount < 2) {
            setTimeout(function () { ensureSignedInThenAdd(btn, retryCount + 1); }, 600);
            return;
        }
        // Try to restore Firebase session from Laravel (no re-login)
        const baseUrl = (typeof window !== "undefined" && window.location && window.location.origin) ? window.location.origin : "";
        fetch(baseUrl + "/api/restore-chat-session", { method: "GET", credentials: "include" })
            .then(function (r) { return r.json().then(function (data) { return { ok: r.ok, data: data }; }); })
            .then(function (result) {
                if (result.ok && result.data && result.data.firebase_custom_token) {
                    return signInWithCustomToken(auth, result.data.firebase_custom_token).then(function () {
                        // Auth state will update; retry add once
                        setTimeout(function () { ensureSignedInThenAdd(btn, 0); }, 800);
                    });
                }
                showChatSessionInactiveMessage();
            })
            .catch(function () {
                showChatSessionInactiveMessage();
            });
    }

    function showChatSessionInactiveMessage() {
        if (typeof Swal !== "undefined") {
            Swal.fire({
                text: "Your chat session is not active. To add contacts, please sign out and sign in again from the login page.",
                icon: "warning",
                width: 420
            });
        } else {
            alert("Your chat session is not active. Please sign out and sign in again from the login page to add contacts.");
        }
    }

    // Event delegation: handle Add button click so it works even when results are re-rendered or modal is injected by SPA
    document.addEventListener("click", function (e) {
        const btn = e.target.closest(".add-contact-from-search");
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        ensureSignedInThenAdd(btn);
    });

    /** Resolve Firebase UID from email or username when API did not return firebase_uid (e.g. Laravel user not yet linked). */
    function resolveEmailOrUsernameToFirebaseUid(email, username) {
        if (!email && !username) return Promise.resolve(null);
        const usersRef = ref(database, "data/users");
        return get(usersRef)
            .then(snapshot => {
                if (!snapshot.exists()) return null;
                const emailLower = (email || "").toLowerCase().trim();
                const usernameLower = (username || "").toLowerCase().trim();
                let found = null;
                snapshot.forEach(child => {
                    if (found) return;
                    const d = child.val();
                    if (!d) return;
                    const uEmail = (d.email || "").toLowerCase().trim();
                    const uName = (d.username || d.userName || "").toLowerCase().trim();
                    if (emailLower && uEmail === emailLower) found = child.key;
                    else if (usernameLower && uName === usernameLower) found = child.key;
                });
                return found;
            })
            .catch(() => null);
    }

    /** Parse displayName into first/last (first word vs rest) for contact save fallback. */
    function parseDisplayName(displayName) {
        const s = (displayName || "").trim();
        if (!s) return { firstName: "", lastName: "" };
        const idx = s.indexOf(" ");
        if (idx <= 0) return { firstName: s, lastName: "" };
        return { firstName: s.substring(0, idx).trim(), lastName: s.substring(idx + 1).trim() };
    }

    /** Add a contact when we have no Firebase UID (pending contact). They appear in the list; chat works once they sign in. */
    function addPendingContact(email, username, displayName, profileImageUrl, primaryRole) {
        const loggedInUserId = getCurrentFirebaseUid();
        if (!loggedInUserId) {
            if (typeof Swal !== "undefined") Swal.fire({ text: "Your chat session is not active. Please sign out and sign in again from the login page.", icon: "warning", width: 420 });
            return;
        }
        const emailOrUsername = (email || username || (displayName || "").trim() || "").trim() || "unknown";
        const keySuffix = typeof btoa !== "undefined"
            ? btoa(emailOrUsername).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "").substring(0, 100)
            : "pending_" + emailOrUsername.replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 80);
        const syntheticKey = "pending_" + keySuffix;
        const contactRef = ref(database, `data/contacts/${loggedInUserId}/${syntheticKey}`);
        const contactsRef = ref(database, `data/contacts/${loggedInUserId}`);
        get(contactsRef).then(snap => {
            if (snap.exists()) {
                const contacts = snap.val();
                const already = Object.keys(contacts).some(k => {
                    const c = contacts[k] || {};
                    const cEmail = (c.email || "").toLowerCase().trim();
                    const cUser = (c.user_name || "").toLowerCase().trim();
                    const e = (email || "").toLowerCase().trim();
                    const u = (username || "").toLowerCase().trim();
                    return (e && cEmail === e) || (u && cUser === u);
                });
                if (already) {
                    Swal.fire({ text: "Contact already in your list!", icon: "info", width: 400 });
                    return;
                }
            }
            const pendingFirstName = (displayName || username || email || "Pending").trim();
            const pendingPayload = {
                contact_id: syntheticKey,
                email: (email || "").trim(),
                user_name: (username || "").trim(),
                pending: true,
                firstName: pendingFirstName,
                lastName: "",
            };
            if (profileImageUrl && String(profileImageUrl).trim()) {
                pendingPayload.profile_image = String(profileImageUrl).trim();
            }
            if (primaryRole && String(primaryRole).trim()) {
                pendingPayload.primary_role = String(primaryRole).trim();
            }
            set(contactRef, pendingPayload).then(() => {
                const inputEl = document.getElementById("add-contact-username-search");
                const resultsEl = document.getElementById("add-contact-search-results");
                if (inputEl) inputEl.value = "";
                if (resultsEl) { resultsEl.style.display = "none"; resultsEl.innerHTML = ""; }
                const addContactModal = document.getElementById("add-contact");
                if (addContactModal) bootstrap.Modal.getOrCreateInstance(addContactModal).hide();
                displayUsers();
                Swal.fire({ text: "Contact added! They will appear in your list; you can chat once they sign in to the app.", icon: "success", width: 420 });
            }).catch(err => Swal.fire({ text: err.message || "Failed to add", icon: "error", width: 400 }));
        });
    }

    function addContactFromSearch(firebaseUid, displayName, username, emailFromApi, firstNameFromApi, lastNameFromApi, profileImageFromLaravel, primaryRoleFromLaravel) {
        const loggedInUserId = getCurrentFirebaseUid();
        if (!loggedInUserId) {
            if (typeof Swal !== "undefined") Swal.fire({ text: "Your chat session is not active. Please sign out and sign in again from the login page.", icon: "warning", width: 420 });
            return;
        }
        if (!firebaseUid) return;
        const contactRef = ref(database, `data/contacts/${loggedInUserId}/${firebaseUid}`);
        get(contactRef).then(snap => {
            if (snap.exists()) {
                Swal.fire({ text: "Contact already in your list!", icon: "info", width: 400 });
                return;
            }
            get(ref(database, `data/users/${firebaseUid}`)).then(userSnap => {
                const userData = userSnap.exists() ? userSnap.val() : {};
                const email = userData.email || emailFromApi || "";
                const parsed = parseDisplayName(displayName);
                const firstName = (firstNameFromApi && firstNameFromApi.trim()) || (userData.firstName && userData.firstName.trim()) || parsed.firstName || "";
                const lastName = (lastNameFromApi && lastNameFromApi.trim()) || (userData.lastName && userData.lastName.trim()) || parsed.lastName || "";
                const contactPayload = {
                    contact_id: firebaseUid,
                    email: email,
                    firstName: firstName,
                    lastName: lastName,
                    mobile_number: userData.mobile_number || "",
                };
                const laravelImg = (profileImageFromLaravel && String(profileImageFromLaravel).trim()) ? String(profileImageFromLaravel).trim() : "";
                const firebaseImg = userData.image || userData.profile_image || userData.profileImage || userData.photoURL || "";
                if (laravelImg) {
                    contactPayload.profile_image = laravelImg;
                } else if (firebaseImg) {
                    contactPayload.profile_image = firebaseImg;
                }
                const pr = primaryRoleFromLaravel && String(primaryRoleFromLaravel).trim() ? String(primaryRoleFromLaravel).trim() : "";
                if (pr) contactPayload.primary_role = pr;
                set(contactRef, contactPayload).then(() => {
                    const inputEl = document.getElementById("add-contact-username-search");
                    const resultsEl = document.getElementById("add-contact-search-results");
                    if (inputEl) inputEl.value = "";
                    if (resultsEl) { resultsEl.style.display = "none"; resultsEl.innerHTML = ""; }
                    const addContactModal = document.getElementById("add-contact");
                    if (addContactModal) bootstrap.Modal.getOrCreateInstance(addContactModal).hide();
                    displayUsers();
                    Swal.fire({ text: "Contact added!", icon: "success", width: 400 });
                }).catch(err => Swal.fire({ text: err.message || "Failed to add", icon: "error", width: 400 }));
            });
        });
    }

    // Add contact is now only via search results (no register-form)



    //edit contact

    // Fetch user data from Firebase when edit modal is opened
    const editContactModal = document.getElementById('edit-contact');
    if (editContactModal) {
        editContactModal.addEventListener('show.bs.modal', function (event) {
            const userId = document.getElementById("contact-detail-user-id")?.value || "";
            const editUserInput = document.querySelector('#edit-contact .modal-body #edit-contact-user-id');
            if (editUserInput) editUserInput.value = userId; // Set the user ID for edit modal
            fetchUserDataForEdit(userId);
        });
    }
    let otherUserId = "";
    let isUserContactBlocked = false;
    const blockContactUserModal = document.getElementById('block-contact-user');
    if (blockContactUserModal) {
        blockContactUserModal.addEventListener('show.bs.modal', function (event) {
            const userId = document.getElementById("contact-detail-user-id")?.value || "";
            const otherUserId = userId;
            isUserContactBlocked = localStorage.getItem("isUserContactBlocked") === "true";
            if (isUserContactBlocked) {
                document.getElementById("blockContactUserLabel").textContent = "Unblock";
            } else {
                document.getElementById("blockContactUserLabel").textContent = "Block";
            }
            const blockUserInput = document.querySelector('#block-contact-user .modal-body #block-contact-user-id');
            if (blockUserInput) blockUserInput.value = userId; // Set the user ID for block modal
            // blockUser(userId);
        });
    }
    const blockContactUserDropdownBtn = document.getElementById("blockContactUserDropdownBtn");
    if (blockContactUserDropdownBtn) {
        blockContactUserDropdownBtn.addEventListener("click", function (event) {
            const userId = document.getElementById("contact-detail-user-id")?.value || "";
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
    }
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
            const editUserInput = document.getElementById('edit-contact-user-id');
            if (editUserInput) editUserInput.value = userId; // Set the user ID
            $('#edit-contact').modal('show'); // Open the edit modal
        });
    });

    // Function to handle edit form submission and update user data in Firebase
    function handleEditFormSubmit(event) {
        event.preventDefault(); // Prevent the form from reloading the page
        const loggedInUserId = currentUserId;
        const userId = document.getElementById('edit-contact-user-id')?.value || "";
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
                                    displayUsers();
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
    if (Editform) Editform.addEventListener("submit", handleEditFormSubmit);



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

    const confirmBlockContactUserBtn = document.getElementById("confirmBlockContactUserBtn");
    if (confirmBlockContactUserBtn) confirmBlockContactUserBtn.addEventListener("click", function (event) {
        event.preventDefault(); // Prevent default form submission
        const otherUserId = document.getElementById("block-contact-user-id")?.value || "";
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
    const confirmUnblockContactBtn = document.getElementById("confirmUnblockContactBtn");
    if (confirmUnblockContactBtn) confirmUnblockContactBtn.addEventListener("click", function () {
        const otherUserIdEl = document.getElementById("block-contact-user-id");
        if (otherUserIdEl && otherUserIdEl.value) {
            unblockUser(otherUserIdEl.value);
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
    if (deleteContactBtn) deleteContactBtn.addEventListener('click', function (event) {
        event.preventDefault(); // Prevent form submission
        const contactId = document.getElementById("contact-detail-user-id")?.value || "";
        if (!contactId) {
            Toastify({
                text: "Contact not found. Please reopen contact details.",
                duration: 3000,
                gravity: "top",
                position: "right",
                backgroundColor: "#ff6b6b",
            }).showToast();
            return;
        }

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
                displayUsers();
            })
            .catch((error) => {
                // Handle error, show an alert or message to the user
            });
    });
}); 