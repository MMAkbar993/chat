/**
 * Sidebar search: make search work on all tabs (Chats, Contacts, Groups, Calls).
 * Binds once to chatSearchInput, contactSearchInput, groupSearchInput, searchCallInput
 * and filters the visible list in the current sidebar pane.
 */
(function () {
    'use strict';

    function bindInput(id, filterFn) {
        var el = document.getElementById(id);
        if (!el || el.dataset.sidebarSearchBound) return;
        el.dataset.sidebarSearchBound = '1';
        el.addEventListener('input', function () {
            var value = (this.value || '').trim().toLowerCase();
            filterFn(value);
        });
    }

    function filterChatList(value) {
        var wrap = document.getElementById('chat-users-wrap');
        if (!wrap) return;
        var items = wrap.querySelectorAll('.chat-list');
        items.forEach(function (item) {
            var h6 = item.querySelector('h6');
            var name = (h6 && h6.textContent || '').toLowerCase();
            var show = !value || name.indexOf(value) !== -1;
            item.style.display = show ? '' : 'none';
        });
    }

    function filterContactList(value) {
        var container = document.getElementById('chatContainer');
        if (!container) return;
        var sections = container.querySelectorAll('.mb-4');
        var noMatches = document.getElementById('noMatchesMessage');
        var noMessage = document.getElementById('no-message');
        var anyVisible = false;
        sections.forEach(function (section) {
            var rows = section.querySelectorAll('.chat-user-list');
            var sectionVisible = false;
            rows.forEach(function (row) {
                var h6 = row.querySelector('.chat-user-msg h6, h6');
                var name = (h6 && h6.textContent || '').toLowerCase();
                var username = (row.getAttribute('data-username') || '').toLowerCase();
                var show = !value || name.indexOf(value) !== -1 || (username && username.indexOf(value) !== -1);
                row.style.display = show ? '' : 'none';
                if (show) {
                    sectionVisible = true;
                    anyVisible = true;
                }
            });
            section.style.display = sectionVisible ? '' : 'none';
        });
        if (noMatches) noMatches.style.display = (value && !anyVisible) ? 'block' : 'none';
        if (noMessage) noMessage.style.display = (!value && !anyVisible) ? 'block' : 'none';
    }

    function filterGroupList(value) {
        var list = document.getElementById('group-list');
        if (!list) return;
        var items = list.querySelectorAll('.chat-list');
        var noMatches = document.getElementById('noGroupMatchesMessage');
        var anyVisible = false;
        items.forEach(function (item) {
            var h6 = item.querySelector('.chat-user-msg h6, h6');
            var name = (h6 && h6.textContent || '').toLowerCase();
            var show = !value || name.indexOf(value) !== -1;
            item.style.display = show ? '' : 'none';
            if (show) anyVisible = true;
        });
        if (noMatches) noMatches.style.display = (value && !anyVisible) ? 'block' : 'none';
    }

    function filterCallList(value) {
        var callMenu = document.getElementById('call-menu');
        if (!callMenu) return;
        var items = callMenu.querySelectorAll('.chat-list');
        var noMatches = document.getElementById('noCallMatchesModalMessage');
        var anyVisible = false;
        items.forEach(function (item) {
            var h6 = item.querySelector('.chat-user-msg h6, h6');
            var name = (h6 && h6.textContent || '').toLowerCase();
            var show = !value || name.indexOf(value) !== -1;
            item.style.display = show ? '' : 'none';
            if (show) anyVisible = true;
        });
        if (noMatches) noMatches.style.display = (value && !anyVisible) ? 'block' : 'none';
    }

    function init() {
        bindInput('chatSearchInput', filterChatList);
        bindInput('contactSearchInput', filterContactList);
        bindInput('groupSearchInput', filterGroupList);
        bindInput('searchCallInput', filterCallList);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    window.addEventListener('spa-page-applied', function () {
        init();
    });
})();
