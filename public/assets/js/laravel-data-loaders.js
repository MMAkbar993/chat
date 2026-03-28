/**
 * Laravel data loaders: contacts, chat list, and groups when FIREBASE_DISABLED.
 * Runs on DOMContentLoaded and on spa-page-applied (pathname in detail).
 */
(function () {
    if (typeof window.FIREBASE_DISABLED === 'undefined' || !window.FIREBASE_DISABLED) return;

    var baseUrl = typeof APP_URL !== 'undefined' && APP_URL ? APP_URL : (window.location.origin || '');
    if (baseUrl && baseUrl.slice(-1) === '/') baseUrl = baseUrl.slice(0, -1);

    function getPathname(url) {
        if (!url) return '';
        try {
            var a = document.createElement('a');
            a.href = url;
            return (a.pathname || '/').replace(/\/+/g, '/');
        } catch (e) {
            return '';
        }
    }

    // --- Contacts ---
    window.__laravelContacts = window.__laravelContacts || {};
    function loadContacts() {
        var container = document.getElementById('chatContainer');
        if (!container) return;
        fetch(baseUrl + '/contacts', {
            method: 'GET',
            headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            credentials: 'same-origin'
        }).then(function (r) { return r.json(); }).then(function (contacts) {
            if (!Array.isArray(contacts)) return;
            window.__laravelContacts = {};
            contacts.forEach(function (c) { window.__laravelContacts[c.uid] = c; });

            var byLetter = {};
            var others = [];
            contacts.forEach(function (c) {
                var first = (c.firstName || '').trim();
                var last = (c.lastName || '').trim();
                var name = (first + ' ' + last).trim() || c.userName || c.email || 'Unknown';
                if (!first && !last) others.push({ c: c, name: name });
                else {
                    var letter = (first.charAt(0) || name.charAt(0)).toUpperCase();
                    if (!byLetter[letter]) byLetter[letter] = [];
                    byLetter[letter].push({ c: c, name: name });
                }
            });
            Object.keys(byLetter).sort().forEach(function (l) {
                byLetter[l].sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); });
            });

            var html = '';
            Object.keys(byLetter).sort().forEach(function (letter) {
                html += '<div class="mb-4"><h6 class="mb-2">' + escapeHtml(letter) + '</h6><div class="chat-list">';
                byLetter[letter].forEach(function (item) {
                    var c = item.c;
                    var name = item.name;
                    var img = c.image || baseUrl + '/assets/img/profiles/avatar-03.jpg';
                    if (img && img.indexOf('/') === 0) img = baseUrl + img;
                    var username = (c.userName || '').replace(/"/g, '&quot;');
                    html += '<a href="javascript:void(0);" data-bs-toggle="modal" data-bs-target="#contact-details" class="chat-user-list" data-user-id="' + escapeAttr(c.uid) + '" data-username="' + escapeAttr(username) + '">';
                    html += '<div class="avatar avatar-lg me-2"><img src="' + escapeAttr(img) + '" class="rounded-circle" alt="image"></div>';
                    html += '<div class="chat-user-info"><div class="chat-user-msg"><h6>' + escapeHtml(name) + '</h6></div></div></a>';
                });
                html += '</div></div>';
            });
            if (others.length) {
                html += '<div class="mb-4"><h6 class="mb-2">Others</h6><div class="chat-list">';
                others.forEach(function (item) {
                    var c = item.c;
                    var name = item.name;
                    var img = c.image || baseUrl + '/assets/img/profiles/avatar-03.jpg';
                    if (img && img.indexOf('/') === 0) img = baseUrl + img;
                    var username = (c.userName || '').replace(/"/g, '&quot;');
                    html += '<a href="javascript:void(0);" data-bs-toggle="modal" data-bs-target="#contact-details" class="chat-user-list" data-user-id="' + escapeAttr(c.uid) + '" data-username="' + escapeAttr(username) + '">';
                    html += '<div class="avatar avatar-lg me-2"><img src="' + escapeAttr(img) + '" class="rounded-circle" alt="image"></div>';
                    html += '<div class="chat-user-info"><div class="chat-user-msg"><h6>' + escapeHtml(name) + '</h6></div></div></a>';
                });
                html += '</div></div>';
            }
            container.innerHTML = html || '<p id="no-message">No Contacts Found!</p>';

            container.querySelectorAll('.chat-user-list').forEach(function (el) {
                el.addEventListener('click', function () {
                    var uid = this.getAttribute('data-user-id');
                    var data = window.__laravelContacts[uid];
                    if (!data) return;
                    var modal = document.getElementById('contact-details');
                    var cdHidden = modal ? modal.querySelector('input[id="contact-detail-user-id"]') : document.getElementById('contact-detail-user-id');
                    if (cdHidden) cdHidden.value = uid;
                    var modalInput = modal ? modal.querySelector('input[id="edit-user-id"]') : null;
                    if (modalInput) modalInput.value = uid;
                    var editId = document.getElementById('edit-user-id');
                    if (editId) editId.value = uid;
                    var nameEl = document.getElementById('contact-detail-name') || document.querySelector('#contact-details h6');
                    var displayName = (data.firstName || '') + ' ' + (data.lastName || '').trim() || data.userName || data.email || 'Contact';
                    if (nameEl) nameEl.textContent = displayName;
                    var titleEl = document.getElementById('contact-detail-title');
                    if (titleEl) titleEl.textContent = data.primary_role || data.userName || '';
                    var avatar = document.getElementById('contact-detail-avatar') || document.querySelector('#contact-details .avatar img');
                    if (avatar) avatar.src = data.image || (baseUrl + '/assets/img/profiles/avatar-03.jpg');
                    var phoneEl = document.querySelector('#contact-details .fw-medium.fs-14.mb-2[data-field="phone"]');
                    if (phoneEl) phoneEl.textContent = data.mobile_number || '—';
                    var emailEl = document.querySelector('#contact-details .fw-medium.fs-14.mb-2[data-field="email"]');
                    if (emailEl) emailEl.textContent = data.email || '—';
                    var contactUsername = data.userName || data.user_name || '';
                    if (data.email) {
                        fetch(baseUrl + '/api/public-profile-by-email?email=' + encodeURIComponent(data.email))
                            .then(function (r) { return r.json(); })
                            .then(function (pub) {
                                if (!pub) return;
                                if (pub.display_name && nameEl) nameEl.textContent = pub.display_name;
                                var setField = function (field, value, asLink) {
                                    var el = document.querySelector('#contact-details .fw-medium.fs-14.mb-2[data-field="' + field + '"]');
                                    if (!el) return;
                                    if (asLink && value && (value.indexOf('http') === 0 || value.indexOf('www') === 0)) {
                                        var href = value.indexOf('http') === 0 ? value : 'https://' + value;
                                        el.innerHTML = '<a href="' + escapeAttr(href) + '" target="_blank" rel="noopener">' + escapeHtml(value) + '</a>';
                                    } else {
                                        el.textContent = value || '—';
                                    }
                                };
                                var now = new Date();
                                var localTime = now.getHours() + ':' + (now.getMinutes() < 10 ? '0' : '') + now.getMinutes() + ' ' + (now.getHours() >= 12 ? 'PM' : 'AM');
                                setField('local_time', localTime);
                                setField('dob', pub.dob);
                                setField('bio', pub.bio);
                                setField('location', pub.location);
                                setField('join_date', pub.join_date);
                                if (pub.websites && pub.websites.length > 0) {
                                    setField('website', pub.websites[0].url, true);
                                } else {
                                    setField('website', '');
                                }
                                var socialKeys = ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'kick', 'twitch'];
                                if (pub.social_links) {
                                    socialKeys.forEach(function (k) {
                                        setField(k, pub.social_links[k], true);
                                    });
                                }
                            })
                            .catch(function () {});
                    } else if (contactUsername) {
                        fetch(baseUrl + '/api/public-profile-by-username?username=' + encodeURIComponent(contactUsername))
                            .then(function (r) { return r.json(); })
                            .then(function (pub) {
                                if (!pub) return;
                                if (pub.display_name && nameEl) nameEl.textContent = pub.display_name;
                                var setField = function (field, value, asLink) {
                                    var el = document.querySelector('#contact-details .fw-medium.fs-14.mb-2[data-field="' + field + '"]');
                                    if (!el) return;
                                    if (asLink && value && (value.indexOf('http') === 0 || value.indexOf('www') === 0)) {
                                        var href = value.indexOf('http') === 0 ? value : 'https://' + value;
                                        el.innerHTML = '<a href="' + escapeAttr(href) + '" target="_blank" rel="noopener">' + escapeHtml(value) + '</a>';
                                    } else {
                                        el.textContent = value || '—';
                                    }
                                };
                                var now = new Date();
                                var localTime = now.getHours() + ':' + (now.getMinutes() < 10 ? '0' : '') + now.getMinutes() + ' ' + (now.getHours() >= 12 ? 'PM' : 'AM');
                                setField('local_time', localTime);
                                setField('dob', pub.dob);
                                setField('bio', pub.bio);
                                setField('location', pub.location);
                                setField('join_date', pub.join_date);
                                if (pub.websites && pub.websites.length > 0) {
                                    setField('website', pub.websites[0].url, true);
                                } else {
                                    setField('website', '');
                                }
                                var socialKeys = ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'kick', 'twitch'];
                                if (pub.social_links) {
                                    socialKeys.forEach(function (k) {
                                        setField(k, pub.social_links[k], true);
                                    });
                                }
                            })
                            .catch(function () {});
                    } else {
                        ['local_time', 'dob', 'website', 'bio', 'location', 'join_date', 'facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'kick', 'twitch'].forEach(function (field) {
                            var el = document.querySelector('#contact-details .fw-medium.fs-14.mb-2[data-field="' + field + '"]');
                            if (el) el.textContent = '—';
                        });
                    }
                    var chatBtn = document.getElementById('contact-detail-chat-btn');
                    var voiceBtn = document.getElementById('contact-detail-voice-btn');
                    var videoBtn = document.getElementById('contact-detail-video-btn');
                    var currentUserId = (typeof window.LARAVEL_USER !== 'undefined' && window.LARAVEL_USER && window.LARAVEL_USER.id) ? String(window.LARAVEL_USER.id) : '';
                    function closeContactDetailModal() {
                        var modalEl = document.getElementById('contact-details');
                        if (modalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                            var m = bootstrap.Modal.getInstance(modalEl);
                            if (m) m.hide();
                        }
                    }
                    var goToChat = function (e) {
                        if (e) { e.preventDefault(); e.stopPropagation(); }
                        try { localStorage.setItem('selectedUserId', uid); } catch (err) {}
                        closeContactDetailModal();
                        window.location.href = baseUrl + '/chat?user=' + encodeURIComponent(uid);
                    };
                    var goToVoiceCall = function (e) {
                        if (e) { e.preventDefault(); e.stopPropagation(); }
                        if (!currentUserId || !uid) return;
                        closeContactDetailModal();
                        var callBtn = document.getElementById('audio-call-btn') || document.getElementById('audio-new-btn-group');
                        if (callBtn) {
                            try { localStorage.setItem('selectedUserId', uid); } catch (err) {}
                            callBtn.click();
                        } else {
                            window.location.href = baseUrl + '/chat?user=' + encodeURIComponent(uid) + '&call=voice';
                        }
                    };
                    var goToVideoCall = function (e) {
                        if (e) { e.preventDefault(); e.stopPropagation(); }
                        if (!currentUserId || !uid) return;
                        closeContactDetailModal();
                        var callBtn = document.getElementById('video-call-new-btn') || document.getElementById('video-call-new-btn-group');
                        if (callBtn) {
                            try { localStorage.setItem('selectedUserId', uid); } catch (err) {}
                            callBtn.click();
                        } else {
                            window.location.href = baseUrl + '/chat?user=' + encodeURIComponent(uid) + '&call=video';
                        }
                    };
                    if (chatBtn) { chatBtn.onclick = goToChat; chatBtn.href = 'javascript:void(0);'; }
                    if (voiceBtn) { voiceBtn.onclick = goToVoiceCall; voiceBtn.href = 'javascript:void(0);'; }
                    if (videoBtn) { videoBtn.onclick = goToVideoCall; videoBtn.href = 'javascript:void(0);'; }
                    var oldChatBtn = document.getElementById('chat-button');
                    if (oldChatBtn) { oldChatBtn.onclick = goToChat; oldChatBtn.href = 'javascript:void(0);'; }
                });
            });
        }).catch(function () {
            container.innerHTML = '<p id="no-message">Failed to load contacts.</p>';
        });
    }

    // --- New Chat modal: populate contacts when modal is shown (so + New Chat shows contacts) ---
    // Uses event delegation so it works after SPA navigation (new #new-chat has no listener otherwise).
    function populateNewChatModal(container, modalEl) {
        var mainContainer = container || document.getElementById('main-container');
        if (!mainContainer) return;
        var modalToClose = modalEl || document.getElementById('new-chat');
        var contacts = window.__laravelContacts;
        if (!contacts || Object.keys(contacts).length === 0) {
            mainContainer.innerHTML = '<p class="text-muted text-center py-3">No contacts yet. Add contacts from the Contacts page or use Invite Others.</p>';
            return;
        }
        var list = Object.keys(contacts).map(function (uid) {
            var c = contacts[uid];
            var first = (c.firstName || '').trim();
            var last = (c.lastName || '').trim();
            var name = (first + ' ' + last).trim() || c.userName || c.email || 'Unknown';
            return { uid: uid, c: c, name: name };
        });
        list.sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); });
        var html = '';
        list.forEach(function (item) {
            var img = item.c.image || baseUrl + '/assets/img/profiles/avatar-03.jpg';
            if (img && img.indexOf('/') === 0 && img.indexOf('//') !== 0) img = baseUrl + img;
            html += '<div class="contact-user d-flex align-items-center mb-2 p-2 rounded" data-user-id="' + escapeAttr(item.uid) + '" style="cursor:pointer;">';
            html += '<div class="avatar avatar-lg me-2"><img src="' + escapeAttr(img) + '" class="rounded-circle" alt=""></div>';
            html += '<div class="user-details"><h6 class="user-title mb-0">' + escapeHtml(item.name) + '</h6></div></div>';
        });
        mainContainer.innerHTML = html;
        mainContainer.querySelectorAll('.contact-user[data-user-id]').forEach(function (el) {
            el.addEventListener('click', function () {
                var uid = this.getAttribute('data-user-id');
                try { localStorage.setItem('selectedUserId', uid); } catch (e) {}
                if (modalToClose && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                    var modal = bootstrap.Modal.getInstance(modalToClose);
                    if (modal) modal.hide();
                }
                window.location.href = baseUrl + '/chat?user=' + encodeURIComponent(uid);
            });
        });
    }

    document.addEventListener('show.bs.modal', function (e) {
        if (e.target.id !== 'new-chat') return;
        var mainContainer = e.target.querySelector('#main-container');
        if (!mainContainer) return;
        if (Object.keys(window.__laravelContacts || {}).length === 0) {
            fetch(baseUrl + '/contacts', { method: 'GET', headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }, credentials: 'same-origin' })
                .then(function (r) { return r.json(); })
                .then(function (contacts) {
                    if (Array.isArray(contacts)) {
                        window.__laravelContacts = {};
                        contacts.forEach(function (c) { window.__laravelContacts[c.uid] = c; });
                    }
                    populateNewChatModal(mainContainer, e.target);
                })
                .catch(function () {
                    mainContainer.innerHTML = '<p class="text-danger text-center py-3">Failed to load contacts.</p>';
                });
        } else {
            populateNewChatModal(mainContainer, e.target);
        }
    });

    // --- Add Members modal (group-chat): populate #users-list when modal is shown ---
    function populateAddMembersModal() {
        var usersList = document.getElementById('users-list');
        if (!usersList) return;
        var contacts = window.__laravelContacts;
        if (!contacts || Object.keys(contacts).length === 0) {
            usersList.innerHTML = '<p class="text-muted text-center py-3">No contacts yet. Add contacts from the Contacts page or use Invite Others.</p>';
            return;
        }
        var list = Object.keys(contacts).map(function (uid) {
            var c = contacts[uid];
            var first = (c.firstName || '').trim();
            var last = (c.lastName || '').trim();
            var name = (first + ' ' + last).trim() || c.userName || c.email || 'Unknown';
            return { uid: uid, c: c, name: name };
        });
        list.sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); });
        var html = '';
        list.forEach(function (item) {
            var img = item.c.image || baseUrl + '/assets/img/profiles/avatar-03.jpg';
            if (img && img.indexOf('/') === 0 && img.indexOf('//') !== 0) img = baseUrl + img;
            var displayName = item.name;
            if (displayName && displayName.charAt(0)) displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
            html += '<div class="contact-user">';
            html += '<div class="d-flex align-items-center justify-content-between">';
            html += '<div class="d-flex align-items-center">';
            html += '<div class="avatar avatar-lg"><img src="' + escapeAttr(img) + '" class="rounded-circle" alt="image"></div>';
            html += '<div class="ms-2"><h6>' + escapeHtml(displayName) + '</h6><p></p></div>';
            html += '</div>';
            html += '<div class="form-check"><input class="form-check-input" type="checkbox" name="contact" value="' + escapeAttr(item.uid) + '"></div>';
            html += '</div></div>';
        });
        usersList.innerHTML = html;
    }

    var addGroupModalEl = document.getElementById('add-group');
    if (addGroupModalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        addGroupModalEl.addEventListener('show.bs.modal', function () {
            if (Object.keys(window.__laravelContacts || {}).length === 0) {
                fetch(baseUrl + '/contacts', { method: 'GET', headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }, credentials: 'same-origin' })
                    .then(function (r) { return r.json(); })
                    .then(function (contacts) {
                        if (Array.isArray(contacts)) {
                            window.__laravelContacts = {};
                            contacts.forEach(function (c) { window.__laravelContacts[c.uid] = c; });
                        }
                        populateAddMembersModal();
                    })
                    .catch(function () {
                        var ul = document.getElementById('users-list');
                        if (ul) ul.innerHTML = '<p class="text-danger text-center py-3">Failed to load contacts.</p>';
                    });
            } else {
                populateAddMembersModal();
            }
        });
    }

    // Add Members modal search: filter #users-list by name when Laravel populated the list
    var groupContactSearchInput = document.getElementById('groupcontactSearchInput');
    if (groupContactSearchInput && !groupContactSearchInput.dataset.laravelSearchBound) {
        groupContactSearchInput.dataset.laravelSearchBound = '1';
        groupContactSearchInput.addEventListener('input', function () {
            var usersList = document.getElementById('users-list');
            if (!usersList) return;
            var searchValue = (this.value || '').toLowerCase().trim();
            var contactUsers = usersList.querySelectorAll('.contact-user');
            var anyVisible = false;
            contactUsers.forEach(function (el) {
                var h6 = el.querySelector('.ms-2 h6');
                var name = h6 ? (h6.textContent || '').toLowerCase() : '';
                var show = !searchValue || name.indexOf(searchValue) !== -1;
                el.style.display = show ? '' : 'none';
                if (show) anyVisible = true;
            });
            var noMsg = document.getElementById('noGroupMatchesModalMessage');
            if (noMsg) noMsg.style.display = anyVisible ? 'none' : 'block';
        });
    }

    // --- Chat list ---
    function formatChatTime(isoOrTimestamp) {
        if (!isoOrTimestamp) return '';
        var date = new Date(isoOrTimestamp);
        var now = new Date();
        var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        var yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        if (date >= today) {
            var h = date.getHours();
            var m = date.getMinutes();
            var am = h >= 12 ? 'PM' : 'AM';
            h = h % 12 || 12;
            return h + ':' + (m < 10 ? '0' : '') + m + ' ' + am;
        }
        if (date >= yesterday) return 'Yesterday';
        return date.getMonth() + 1 + '/' + date.getDate() + '/' + String(date.getFullYear()).slice(2);
    }

    function loadChatList() {
        var wrap = document.getElementById('chat-users-wrap');
        if (!wrap) return;
        fetch(baseUrl + '/api/chat-list', {
            method: 'GET',
            headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            credentials: 'same-origin'
        }).then(function (r) { return r.json(); }).then(function (list) {
            if (!Array.isArray(list)) return;
            var html = '';
            list.forEach(function (item) {
                var uid = item.other_user_id;
                var name = item.display_name || ('User ' + uid);
                var lastMsg = (item.last_message || '').trim() || 'No messages';
                if (lastMsg.length > 35) lastMsg = lastMsg.slice(0, 32) + '...';
                var img = (item.other_user && item.other_user.profile_image_link) ? item.other_user.profile_image_link : (baseUrl + '/assets/img/profiles/avatar-03.jpg');
                if (img && img.indexOf('/') === 0 && img.indexOf('//') !== 0) img = baseUrl + img;
                var time = formatChatTime(item.last_at || item.timestamp);
                html += '<div class="chat-list" data-user-id="' + escapeAttr(String(uid)) + '">';
                html += '<a href="#" class="chat-user-list">';
                html += '<div class="avatar avatar-lg me-2"><img src="' + escapeAttr(img) + '" class="rounded-circle" alt="image"></div>';
                html += '<div class="chat-user-info"><div class="chat-user-msg"><h6>' + escapeHtml(name) + '</h6><p>' + escapeHtml(lastMsg) + '</p></div>';
                html += '<div class="chat-user-time"><span class="time">' + escapeHtml(time) + '</span><div class="chat-pin"></div></div></div></a></div>';
            });
            wrap.innerHTML = html || '<div class="chat-list"><p class="text-muted small p-2">No chats yet.</p></div>';
            wrap.querySelectorAll('.chat-list[data-user-id]').forEach(function (el) {
                var userId = el.getAttribute('data-user-id');
                el.querySelector('.chat-user-list').addEventListener('click', function (e) {
                    e.preventDefault();
                    try {
                        if (typeof localStorage !== 'undefined') localStorage.setItem('selectedUserId', userId);
                    } catch (err) {}
                    window.location.href = baseUrl + '/chat?user=' + encodeURIComponent(userId);
                });
            });
        }).catch(function () {
            wrap.innerHTML = '<div class="chat-list"><p class="text-muted small p-2">Failed to load chats.</p></div>';
        });
    }

    // --- Groups ---
    function formatGroupTime(timestamp) {
        if (!timestamp) return '';
        var date = new Date(timestamp);
        var now = new Date();
        var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        var yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        if (date >= today) {
            var h = date.getHours();
            var m = date.getMinutes();
            var am = h >= 12 ? 'PM' : 'AM';
            h = h % 12 || 12;
            return h + ':' + (m < 10 ? '0' : '') + m + ' ' + am;
        }
        if (date >= yesterday) return 'Yesterday';
        return date.getMonth() + 1 + '/' + date.getDate();
    }

    function loadGroups() {
        var listEl = document.getElementById('group-list');
        if (!listEl) return;
        fetch(baseUrl + '/api/groups', {
            method: 'GET',
            headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            credentials: 'same-origin'
        }).then(function (r) { return r.json(); }).then(function (groups) {
            if (!Array.isArray(groups)) return;
            var html = '';
            groups.forEach(function (group) {
                var gid = group.id;
                var name = group.name || 'Group';
                var img = group.image;
                if (img && img.indexOf('http') !== 0) img = baseUrl + (img.indexOf('/') === 0 ? '' : '/storage/') + img;
                if (!img) img = baseUrl + '/assets/img/profiles/avatar-03.jpg';
                var updated = group.updated_at || group.created_at;
                var time = formatGroupTime(updated);
                var lastMsg = (group.latest_message && group.latest_message.body) ? group.latest_message.body : '';
                if (lastMsg.length > 35) lastMsg = lastMsg.slice(0, 32) + '...';
                html += '<div class="chat-list" data-group-id="' + escapeAttr(String(gid)) + '">';
                html += '<a href="#" class="chat-user-list">';
                html += '<div class="avatar avatar-lg me-2"><img src="' + escapeAttr(img) + '" class="rounded-circle" alt="image"></div>';
                html += '<div class="chat-user-info"><div class="chat-user-msg"><h6>' + escapeHtml(name) + '</h6><p>' + escapeHtml(lastMsg) + '</p></div>';
                html += '<div class="chat-user-time"><span class="time">' + escapeHtml(time) + '</span><div class="chat-pin"></div></div></div></a></div>';
            });
            listEl.innerHTML = html || '';
            listEl.querySelectorAll('.chat-list[data-group-id]').forEach(function (el) {
                var gid = el.getAttribute('data-group-id');
                el.querySelector('.chat-user-list').addEventListener('click', function (e) {
                    e.preventDefault();
                    if (typeof selectedGroupId !== 'undefined') selectedGroupId = gid;
                    try {
                        if (typeof localStorage !== 'undefined') localStorage.setItem('selectedGroupId', gid);
                    } catch (err) {}
                    if (typeof loadGroupMessages === 'function') loadGroupMessages(gid);
                    if (typeof loadGroupDetails === 'function') loadGroupDetails(gid);
                    else window.location.href = baseUrl + '/group-chat?group=' + encodeURIComponent(gid);
                });
            });
        }).catch(function () {
            listEl.innerHTML = '<p class="text-muted small p-2">Failed to load groups.</p>';
        });
    }

    function escapeHtml(s) {
        if (s == null) return '';
        var div = document.createElement('div');
        div.textContent = s;
        return div.innerHTML;
    }
    function escapeAttr(s) {
        if (s == null) return '';
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function runForPathname(pathname) {
        if (!pathname) pathname = getPathname(window.location.href);
        // Run all loaders so sidebar tabs have data when user switches
        loadContacts();
        loadChatList();
        loadGroups();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            runForPathname();
        });
    } else {
        runForPathname();
    }
    window.addEventListener('spa-page-applied', function (e) {
        var pathname = (e && e.detail && e.detail.pathname) ? e.detail.pathname : getPathname(window.location.href);
        runForPathname(pathname);
    });

    // Contact Detail Chat button: delegated handler so it works even when modal was opened without list-click binding
    document.addEventListener('click', function (e) {
        var btn = e.target.closest('#contact-detail-chat-btn, #chat-button');
        if (!btn) return;
        var modal = btn.closest('#contact-details');
        if (!modal) modal = document.getElementById('contact-details');
        var editInput = modal ? modal.querySelector('input#edit-user-id') : null;
        var userId = editInput && editInput.value ? editInput.value.trim() : '';
        if (!userId) {
            var cdIn = modal ? modal.querySelector('input#contact-detail-user-id') : null;
            userId = cdIn && cdIn.value ? String(cdIn.value).trim() : '';
        }
        if (!userId) return;
        e.preventDefault();
        e.stopPropagation();
        try { localStorage.setItem('selectedUserId', userId); } catch (err) {}
        if (modal && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            var m = bootstrap.Modal.getInstance(modal);
            if (m) m.hide();
        }
        window.location.href = baseUrl + '/chat?user=' + encodeURIComponent(userId);
    }, true);

    // Chat list: delegated handler so clicking a chat opens conversation with that person
    document.addEventListener('click', function (e) {
        var link = e.target.closest('.chat-user-list');
        if (!link) return;
        var listEl = link.closest('.chat-list[data-user-id]');
        if (!listEl) return;
        if (!listEl.closest('#chat-users-wrap')) return;
        var userId = listEl.getAttribute('data-user-id');
        if (!userId) return;
        e.preventDefault();
        e.stopPropagation();
        try { localStorage.setItem('selectedUserId', userId); } catch (err) {}
        window.location.href = baseUrl + '/chat?user=' + encodeURIComponent(userId);
    }, true);
})();
