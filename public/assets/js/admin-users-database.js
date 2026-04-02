/**
 * Admin Users page - load and manage users from Laravel database API.
 */
(function () {
    'use strict';
    var usersApi = '/admin/api/users';
    var csrfToken = document.querySelector('meta[name="csrf-token"]') ? document.querySelector('meta[name="csrf-token"]').getAttribute('content') : null;
    var usersState = { page: 1, perPage: 25, lastPage: 1, total: 0 };

    function getHeaders(method) {
        var h = { 'Accept': 'application/json', 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' };
        if (csrfToken) h['X-CSRF-TOKEN'] = csrfToken;
        var t = document.querySelector('input[name="_token"]');
        if (t && method !== 'GET') h['X-CSRF-TOKEN'] = h['X-CSRF-TOKEN'] || t.value;
        return h;
    }

    function escapeHtml(s) {
        if (s == null || s === undefined) return '-';
        var div = document.createElement('div');
        div.textContent = String(s);
        return div.innerHTML;
    }

    function renderUsersTable(users) {
        var tbody = document.querySelector('#usersTable tbody');
        if (!tbody) return;
        if (typeof $ !== 'undefined' && $.fn.DataTable && $.fn.dataTable.isDataTable('#usersTable')) {
            $('#usersTable').DataTable().destroy();
        }
        var defaultAvatar = (typeof defaultAvatar !== 'undefined' ? window.defaultAvatar : null) || '/assets/img/profiles/avatar-03.jpg';
        tbody.innerHTML = '';
        users.forEach(function (user) {
            var blockText = user.is_blocked ? 'Unblock' : 'Block';
            var imgSrc = user.profile_image_link || defaultAvatar;
            var row = document.createElement('tr');
            row.setAttribute('data-user-id', user.id);
            row.innerHTML = '<td>' + user.sno + '</td><td><div class="d-flex align-items-center"><a href="#" class="avatar avatar-md"><img src="' + imgSrc + '" class="img-fluid rounded-circle" alt="img" onerror="this.src=\'' + defaultAvatar + '\'"></a><div class="ms-2 profile-name"><p class="text-dark mb-0">' + (escapeHtml(user.name) || '-') + '</p></div></div></td><td>' + escapeHtml(user.email) + '</td><td>' + escapeHtml(user.mobile_number) + '</td><td>' + escapeHtml(user.reg_date) + '</td><td>' + escapeHtml(user.country) + '</td><td>' + escapeHtml(user.last_seen) + '</td><td><div class="d-flex align-items-center"><div class="dropdowns"><a href="#" class="btn btn-white btn-icon btn-sm d-flex align-items-center justify-content-center rounded-circle p-0" data-bs-toggle="dropdown"><i class="ti ti-dots-vertical fs-14"></i></a><ul class="dropdown-menu dropdown-menu-right p-3"><li><a class="dropdown-item rounded-1 edit-user-button" href="#" data-user-id="' + user.id + '" data-bs-toggle="modal" data-bs-target="#edit_user"><i class="ti ti-edit me-2"></i>Edit</a></li><li><a class="dropdown-item rounded-1 block-user-button" href="#" data-block-id="' + user.id + '" data-block-status="' + (user.is_blocked ? 'true' : 'false') + '" data-bs-toggle="modal" data-bs-target="#block_user"><i class="ti ti-ban me-2"></i>' + blockText + '</a></li><li><a class="dropdown-item rounded-1 delete-user-btn" href="#" data-id="' + user.id + '" data-bs-toggle="modal" data-bs-target="#delete-user"><i class="ti ti-trash me-2"></i>Delete</a></li></ul></div></div></td>';
            tbody.appendChild(row);
        });
        if (typeof $ !== 'undefined' && $.fn.DataTable && document.getElementById('usersTable')) {
            if ($.fn.dataTable.isDataTable('#usersTable')) $('#usersTable').DataTable().destroy();
            $('#usersTable').DataTable({ pageLength: 10, lengthMenu: [5, 10, 20, 50], searching: true, ordering: true, columnDefs: [{ orderable: false, targets: 0 }] });
        }
        bindRowEvents();
    }

    function bindRowEvents() {
        document.querySelectorAll('.edit-user-button').forEach(function (btn) {
            btn.onclick = function (e) {
                e.preventDefault();
                var id = this.getAttribute('data-user-id');
                fetch(usersApi + '/' + id, { method: 'GET', headers: getHeaders('GET'), credentials: 'same-origin' }).then(function (r) { return r.json(); }).then(function (user) {
                    document.getElementById('uid').value = user.id;
                    document.getElementById('editUserFirstName').value = user.first_name || '';
                    document.getElementById('editUserLastName').value = user.last_name || '';
                    document.getElementById('editUserEmail').value = user.email || '';
                    document.getElementById('editUserMobile').value = user.mobile_number || '';
                    document.getElementById('editCountry').value = user.country || '';
                });
            };
        });
        document.querySelectorAll('.delete-user-btn').forEach(function (btn) {
            btn.onclick = function (e) { e.preventDefault(); document.getElementById('deleteUserId').value = this.getAttribute('data-id'); };
        });
        document.querySelectorAll('.block-user-button').forEach(function (btn) {
            btn.onclick = function (e) {
                e.preventDefault();
                var id = this.getAttribute('data-block-id');
                var isBlocked = this.getAttribute('data-block-status') === 'true';
                var title = document.getElementById('block-user-label');
                var desc = document.querySelector('#block_user .description');
                var confirmBtn = document.getElementById('confirmBlockUserBtn');
                if (confirmBtn) { confirmBtn.setAttribute('data-block-id', id); confirmBtn.setAttribute('data-block-status', isBlocked ? 'true' : 'false'); }
                if (title) title.textContent = isBlocked ? 'Unblock User' : 'Block User';
                if (desc) desc.textContent = isBlocked ? 'Unblocking this user will allow them to call you and send you messages again.' : 'Blocked contacts will no longer be able to call you or send you messages.';
                if (confirmBtn) confirmBtn.textContent = isBlocked ? 'Unblock' : 'Block';
            };
        });
    }

    function renderPagination(meta) {
        var host = document.querySelector('#usersTable') ? document.querySelector('#usersTable').closest('.card-body') : null;
        if (!host) return;
        var pager = document.getElementById('users-table-pagination');
        if (!pager) {
            pager = document.createElement('div');
            pager.id = 'users-table-pagination';
            pager.className = 'd-flex justify-content-between align-items-center p-3 border-top';
            host.appendChild(pager);
        }
        pager.innerHTML = '';
        var summary = document.createElement('div');
        summary.className = 'small text-muted';
        summary.textContent = 'Showing page ' + usersState.page + ' of ' + usersState.lastPage + ' (' + usersState.total + ' users)';
        var actions = document.createElement('div');
        actions.className = 'd-flex gap-2';
        var prev = document.createElement('button');
        prev.className = 'btn btn-sm btn-outline-secondary';
        prev.textContent = 'Previous';
        prev.disabled = usersState.page <= 1;
        prev.addEventListener('click', function () {
            if (usersState.page <= 1) return;
            usersState.page -= 1;
            fetchUsers();
        });
        var next = document.createElement('button');
        next.className = 'btn btn-sm btn-outline-secondary';
        next.textContent = 'Next';
        next.disabled = usersState.page >= usersState.lastPage;
        next.addEventListener('click', function () {
            if (usersState.page >= usersState.lastPage) return;
            usersState.page += 1;
            fetchUsers();
        });
        actions.appendChild(prev);
        actions.appendChild(next);
        pager.appendChild(summary);
        pager.appendChild(actions);
    }

    function fetchUsers() {
        var url = usersApi + '?page=' + encodeURIComponent(usersState.page) + '&per_page=' + encodeURIComponent(usersState.perPage);
        fetch(url, { method: 'GET', headers: getHeaders('GET'), credentials: 'same-origin' }).then(function (r) { return r.json(); }).then(function (data) {
            var meta = data.meta || {};
            usersState.page = Number(meta.page || usersState.page || 1);
            usersState.perPage = Number(meta.per_page || usersState.perPage);
            usersState.lastPage = Number(meta.last_page || 1);
            usersState.total = Number(meta.total || 0);
            renderUsersTable(data.data || []);
            renderPagination(meta);
        }).catch(function () {
            if (typeof Toastify !== 'undefined') Toastify({ text: 'Failed to load users', duration: 3000, gravity: 'top', position: 'right', backgroundColor: 'red' }).showToast();
        });
    }

    function confirmDelete(e) {
        e.preventDefault();
        var id = document.getElementById('deleteUserId').value;
        if (!id) return;
        fetch(usersApi + '/' + id, { method: 'DELETE', headers: getHeaders('DELETE'), credentials: 'same-origin' }).then(function (r) { return r.json(); }).then(function (data) {
            if (data.success) { var m = document.getElementById('delete-user'); if (typeof bootstrap !== 'undefined' && m) { var x = bootstrap.Modal.getInstance(m); if (x) x.hide(); } fetchUsers(); if (typeof Toastify !== 'undefined') Toastify({ text: data.message || 'Deleted', duration: 3000, gravity: 'top', position: 'right' }).showToast(); }
        });
    }

    function confirmBlock(e) {
        e.preventDefault();
        var btn = document.getElementById('confirmBlockUserBtn');
        var id = btn && btn.getAttribute('data-block-id');
        if (!id) return;
        fetch(usersApi + '/' + id + '/block', { method: 'POST', headers: getHeaders('POST'), credentials: 'same-origin', body: '{}' }).then(function (r) { return r.json(); }).then(function (data) {
            if (data.success) { var m = document.getElementById('block_user'); if (typeof bootstrap !== 'undefined' && m) { var x = bootstrap.Modal.getInstance(m); if (x) x.hide(); } fetchUsers(); if (typeof Toastify !== 'undefined') Toastify({ text: data.message || 'Done', duration: 3000, gravity: 'top', position: 'right' }).showToast(); }
        });
    }

    function saveEdit(e) {
        e.preventDefault();
        var id = document.getElementById('uid').value;
        var payload = { first_name: document.getElementById('editUserFirstName').value, last_name: document.getElementById('editUserLastName').value, email: document.getElementById('editUserEmail').value, mobile_number: document.getElementById('editUserMobile').value, country: document.getElementById('editCountry').value };
        fetch(usersApi + '/' + id, { method: 'PUT', headers: getHeaders('PUT'), credentials: 'same-origin', body: JSON.stringify(payload) }).then(function (r) { return r.json(); }).then(function (data) {
            if (data.success) { var m = document.getElementById('edit_user'); if (typeof bootstrap !== 'undefined' && m) { var x = bootstrap.Modal.getInstance(m); if (x) x.hide(); } fetchUsers(); if (typeof Toastify !== 'undefined') Toastify({ text: data.message || 'Saved', duration: 3000, gravity: 'top', position: 'right' }).showToast(); }
            else { var msg = (data.errors && Object.keys(data.errors).map(function (k) { return data.errors[k].join(' '); }).join(' ')) || data.message || 'Error'; if (typeof Toastify !== 'undefined') Toastify({ text: msg, duration: 4000, gravity: 'top', position: 'right', backgroundColor: 'red' }).showToast(); }
        });
    }

    function addUser(e) {
        e.preventDefault();
        var payload = { first_name: document.getElementById('first_name').value, last_name: document.getElementById('last_name').value, email: document.getElementById('email').value, mobile_number: document.getElementById('mobile_number').value, country: document.getElementById('country').value };
        fetch(usersApi, { method: 'POST', headers: getHeaders('POST'), credentials: 'same-origin', body: JSON.stringify(payload) }).then(function (r) { return r.json(); }).then(function (data) {
            if (data.success) { var m = document.getElementById('add_user'); if (typeof bootstrap !== 'undefined' && m) { var x = bootstrap.Modal.getInstance(m); if (x) x.hide(); } var f = document.getElementById('add_user_admin'); if (f) f.reset(); fetchUsers(); if (typeof Toastify !== 'undefined') Toastify({ text: data.message || 'User added', duration: 3000, gravity: 'top', position: 'right' }).showToast(); }
            else { var msg = (data.errors && Object.keys(data.errors).map(function (k) { return data.errors[k].join(' '); }).join(' ')) || data.message || 'Error'; if (typeof Toastify !== 'undefined') Toastify({ text: msg, duration: 4000, gravity: 'top', position: 'right', backgroundColor: 'red' }).showToast(); }
        });
    }

    function init() {
        if (!document.querySelector('#usersTable')) return;
        fetchUsers();
        var f = document.getElementById('deleteUserForm'); if (f) f.addEventListener('submit', confirmDelete);
        var b = document.getElementById('confirmDeleteUserBtn'); if (b) b.addEventListener('click', function (ev) { ev.preventDefault(); confirmDelete(ev); });
        var bf = document.getElementById('blockUserForm'); if (bf) bf.addEventListener('submit', confirmBlock);
        var bb = document.getElementById('confirmBlockUserBtn'); if (bb) bb.addEventListener('click', function (ev) { ev.preventDefault(); confirmBlock(ev); });
        var ef = document.getElementById('editUserForm'); if (ef) ef.addEventListener('submit', saveEdit);
        var af = document.getElementById('add_user_admin'); if (af) af.addEventListener('submit', addUser);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
