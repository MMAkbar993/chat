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
                    var editId = document.getElementById('edit-user-id');
                    if (editId) editId.value = uid;
                    var h6 = document.querySelector('#contact-details h6');
                    if (h6) h6.textContent = (data.firstName || '') + ' ' + (data.lastName || '').trim() || data.userName || data.email || 'Contact';
                    var avatar = document.querySelector('#contact-details .avatar img');
                    if (avatar) avatar.src = data.image || (baseUrl + '/assets/img/profiles/avatar-03.jpg');
                    var phone = document.querySelector('#contact-details .fw-medium.fs-14.mb-2[data-field="phone"]');
                    if (phone) phone.textContent = data.mobile_number || 'N/A';
                    var emailEl = document.querySelector('#contact-details .fw-medium.fs-14.mb-2[data-field="email"]');
                    if (emailEl) emailEl.textContent = data.email || 'N/A';
                    var kycBadge = document.querySelector('#contact-details .contact-kyc-badge');
                    if (kycBadge && data.email) {
                        kycBadge.style.display = 'none';
                        fetch(baseUrl + '/api/kyc-status?email=' + encodeURIComponent(data.email))
                            .then(function (r) { return r.json(); })
                            .then(function (d) { kycBadge.style.display = d.verified ? 'inline-flex' : 'none'; })
                            .catch(function () {});
                    }
                });
            });
        }).catch(function () {
            container.innerHTML = '<p id="no-message">Failed to load contacts.</p>';
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
                    window.location.href = baseUrl + '/chat';
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
})();
