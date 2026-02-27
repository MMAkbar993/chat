/**
 * SPA Navigation for DreamsChat
 * Intercepts sidebar nav clicks and loads content dynamically without page reload.
 */
(function ($) {
    'use strict';

    var ROUTE_TAB_MAP = {
        '/chat': 'chat-menu',
        '/index': 'chat-menu',
        '/contact': 'contact-menu',
        '/group-chat': 'group-menu',
        '/user-status': 'status-menu',
        '/calls': 'call-menu',
        '/profile': 'profile-menu',
        '/settings': 'setting-menu'
    };

    var SPA_ROUTES = Object.keys(ROUTE_TAB_MAP);
    var isNavigating = false;
    var loadedModules = {};

    function getPathname(url) {
        try {
            return new URL(url, window.location.origin).pathname.replace(/\/$/, '') || '/';
        } catch (e) {
            return null;
        }
    }

    function isSpaRoute(url) {
        var pathname = getPathname(url);
        return pathname && SPA_ROUTES.indexOf(pathname) !== -1;
    }

    function switchSidebarTab(pathname) {
        var tabId = ROUTE_TAB_MAP[pathname];
        if (!tabId) return;

        $('.sidebar-menu .main-menu .nav li a').removeClass('active');
        $('.sidebar-menu .main-menu .nav li a').each(function () {
            var href = $(this).attr('href');
            if (href) {
                var linkPath = getPathname(href);
                if (linkPath === pathname || (pathname === '/index' && linkPath === '/chat')) {
                    $(this).addClass('active');
                }
            }
        });

        $('.sidebar-group > .tab-content > .tab-pane').removeClass('active show');
        $('#' + tabId).addClass('active show');
    }



    function reinitPlugins() {
        if ($.fn.slimScroll) {
            var $scrolls = $('#spa-page-content .slimscroll');
            if ($scrolls.length > 0) {
                $scrolls.slimScroll({
                    height: 'auto',
                    width: '100%',
                    position: 'right',
                    size: '7px',
                    color: '#ccc',
                    wheelStep: 10,
                    touchScrollStep: 100
                });
                var wHeight = $(window).height();
                $scrolls.height(wHeight);
            }
        }

        $('[data-bs-toggle="tooltip"]').each(function () {
            var existing = bootstrap.Tooltip.getInstance(this);
            if (!existing) {
                new bootstrap.Tooltip(this);
            }
        });

        if ($.fn.datetimepicker) {
            $('#spa-page-content .datetimepicker').datetimepicker({ format: 'DD-MM-YYYY' });
        }

        if ($.fn.select2) {
            $('#spa-page-content select.select2').select2();
        }

        rebindDomHandlers();
    }

    function rebindDomHandlers() {
        $('#spa-page-content .chat-close').off('click.spa').on('click.spa', function () {
            $(".chat").removeClass('show');
        });

        $("#spa-page-content .left_sides").off('click.spa').on('click.spa', function () {
            if ($(window).width() <= 991) {
                $('.sidebar-group').removeClass('hide-left-sidebar');
                $('.sidebar-menu').removeClass('d-none');
            }
        });

        $("#spa-page-content .chat-user-list").off('click.spa').on('click.spa', function () {
            if ($(window).width() <= 767) {
                $('.left-sidebar').addClass('hide-left-sidebar');
                $('.sidebar-menu').addClass('d-none');
            }
        });

        $(".user-list-item:not(body.status-page .user-list-item, body.voice-call-page .user-list-item)").off('click.spa').on('click.spa', function () {
            if ($(window).width() < 992) {
                $('.left-sidebar').addClass('hide-left-sidebar');
                $('.chat').addClass('show-chatbar');
            }
        });

        $(".group-left-setting").off('click.spa').on('click.spa', function () {
            $('.right_side_group').addClass('show-right-sidebar').removeClass('hide-right-sidebar');
            $('.right-side-contact').addClass('hide-right-sidebar');
            $('.chat-options').addClass('chat-small');
        });

        $(".remove-group-message").off('click.spa').on('click.spa', function () {
            $('.right_side_group').addClass('hide-right-sidebar').removeClass('show-right-sidebar');
            $('.chat-options').removeClass('chat-small');
        });

        $('#spa-page-content .toggle-password').off('click.spa').on('click.spa', function () {
            var input = $(this).siblings('.pass-input');
            if (input.attr("type") === "password") {
                input.attr("type", "text");
                $(this).removeClass("ti-eye-off").addClass("ti-eye");
            } else {
                input.attr("type", "password");
                $(this).removeClass("ti-eye").addClass("ti-eye-off");
            }
        });

        $('#spa-page-content .mute-bt').off('click.spa').on('click.spa', function () {
            $(this).toggleClass("active");
        });

        $('#spa-page-content .mute-video').off('click.spa').on('click.spa', function () {
            $(this).toggleClass("active");
            $(".mini-video-view").toggleClass("active");
        });
    }

    function executeInlineScripts(container) {
        if (!container) return;
        var scripts = container.querySelectorAll('script:not([type="module"])');
        for (var i = 0; i < scripts.length; i++) {
            var oldScript = scripts[i];
            if (oldScript.src) continue;
            try {
                var fn = new Function(oldScript.textContent);
                fn();
            } catch (e) {
                console.warn('SPA: inline script error:', e);
            }
        }
    }

    function resolveUrl(src) {
        if (!src) return null;
        if (src.indexOf('://') !== -1) return src;
        var a = document.createElement('a');
        a.href = src;
        return a.href;
    }

    function loadModuleScripts(container) {
        if (!container) return;
        var moduleScripts = container.querySelectorAll('script[type="module"]');
        for (var i = 0; i < moduleScripts.length; i++) {
            var ms = moduleScripts[i];
            var rawSrc = ms.getAttribute('src');
            if (rawSrc) {
                var resolved = resolveUrl(rawSrc);
                var key = resolved.split('?')[0];
                if (!loadedModules[key]) {
                    loadedModules[key] = true;
                    var newScript = document.createElement('script');
                    newScript.type = 'module';
                    newScript.src = resolved;
                    newScript.crossOrigin = 'anonymous';
                    document.body.appendChild(newScript);
                }
            } else if (ms.textContent.trim()) {
                var newInlineModule = document.createElement('script');
                newInlineModule.type = 'module';
                newInlineModule.textContent = ms.textContent;
                document.body.appendChild(newInlineModule);
            }
        }
    }

    function dismissOpenModals() {
        $('.modal.show').each(function () {
            var modal = bootstrap.Modal.getInstance(this);
            if (modal) modal.hide();
        });
        $('.modal-backdrop').remove();
        $('body').removeClass('modal-open').css({ overflow: '', paddingRight: '' });
    }

    function navigateTo(url, pushState) {
        if (isNavigating) return;
        if (typeof pushState === 'undefined') pushState = true;

        var pathname = getPathname(url);
        if (!pathname || !isSpaRoute(url)) return;

        if (getPathname(window.location.href) === pathname) return;

        isNavigating = true;

        dismissOpenModals();
        switchSidebarTab(pathname);

        $.ajax({
            url: url,
            type: 'GET',
            headers: { 'X-SPA-Request': '1' },
            success: function (html) {
                var parser = new DOMParser();
                var doc = parser.parseFromString(html, 'text/html');

                var newPageContent = doc.getElementById('spa-page-content');
                var currentPageContent = document.getElementById('spa-page-content');
                if (newPageContent && currentPageContent) {
                    currentPageContent.innerHTML = newPageContent.innerHTML;
                    executeInlineScripts(currentPageContent);
                    loadModuleScripts(newPageContent);
                }

                var newPageModals = doc.getElementById('spa-page-modals');
                var currentPageModals = document.getElementById('spa-page-modals');
                if (newPageModals && currentPageModals) {
                    currentPageModals.innerHTML = newPageModals.innerHTML;
                    executeInlineScripts(currentPageModals);
                    loadModuleScripts(newPageModals);
                }

                reinitPlugins();

                if (pushState) {
                    history.pushState({ spa: true }, '', url);
                }

                $(window).trigger('resize');

                isNavigating = false;
            },
            error: function () {
                console.warn('SPA: AJAX failed, falling back to full navigation');
                window.location.href = url;
                isNavigating = false;
            }
        });
    }

    $(document).on('click', '.sidebar-menu .main-menu .nav li a[href]', function (e) {
        var href = $(this).attr('href');
        if (href && isSpaRoute(href)) {
            e.preventDefault();
            e.stopPropagation();
            navigateTo(href);
        }
    });

    window.addEventListener('popstate', function () {
        if (isSpaRoute(window.location.href)) {
            navigateTo(window.location.href, false);
        } else {
            window.location.reload();
        }
    });

    history.replaceState({ spa: true }, '', window.location.href);

    document.querySelectorAll('script[type="module"][src]').forEach(function (s) {
        var resolved = resolveUrl(s.getAttribute('src'));
        var key = resolved.split('?')[0];
        loadedModules[key] = true;
    });

})(jQuery);
