/**
 * Global profile avatar helpers: real photo or Tabler ti-user when missing / placeholder.
 * Loaded before firebase *.js modules; exposed as window.DreamChatProfileAvatar.
 */
(function (global) {
    "use strict";

    function escapeAttr(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    function resolveProfileImageUrl(raw) {
        const origin =
            typeof global !== "undefined" &&
            global.location &&
            global.location.origin
                ? global.location.origin
                : "";
        const defaultUrl = origin
            ? origin + "/assets/img/default.png"
            : "assets/img/default.png";
        if (raw == null || !String(raw).trim()) return defaultUrl;
        const s = String(raw).trim();
        if (/^https?:\/\//i.test(s) || s.startsWith("data:") || s.startsWith("blob:"))
            return s;
        if (s.startsWith("//"))
            return (global.location && global.location.protocol
                ? global.location.protocol
                : "https:") + s;
        const path = s.replace(/^\.?\/+/, "");
        return origin ? origin + "/" + path : defaultUrl;
    }

    /** Group chat: empty source => "" (UI uses innerHtmlForAvatar / ti-user). */
    function resolveGroupProfileImageUrl(raw) {
        const origin =
            typeof global !== "undefined" &&
            global.location &&
            global.location.origin
                ? global.location.origin
                : "";
        if (raw == null || !String(raw).trim()) return "";
        const s = String(raw).trim();
        if (/^https?:\/\//i.test(s) || s.startsWith("data:") || s.startsWith("blob:"))
            return s;
        if (s.startsWith("//"))
            return (global.location && global.location.protocol
                ? global.location.protocol
                : "https:") + s;
        const path = s.replace(/^\.?\/+/, "");
        return origin ? origin + "/" + path : "/" + path;
    }

    function hasProfileImageSource(raw) {
        return raw != null && String(raw).trim() !== "";
    }

    function isPlaceholderProfileImageUrl(url) {
        if (!url || !String(url).trim()) return true;
        const s = String(url).toLowerCase();
        return (
            s.indexOf("assets/img/default.png") !== -1 ||
            s.indexOf("/default.png") !== -1 ||
            s.indexOf("avatar-03.jpg") !== -1 ||
            s.indexOf("profiles/avatar-03") !== -1 ||
            s.indexOf("user-placeholder") !== -1 ||
            /\/profiles\/avatar-\d+\.jpe?g(\?|$)/i.test(s) ||
            /assets\/img\/profiles\/avatar-\d+\.jpe?g(\?|$)/i.test(s)
        );
    }

    function userIconPlaceholderHtml() {
        return (
            '<span class="d-inline-flex align-items-center justify-content-center rounded-circle w-100 h-100 avatar-contact-fallback" role="img" aria-label="User">' +
            '<i class="ti ti-user" aria-hidden="true"></i></span>'
        );
    }

    /**
     * Inner HTML for inside a .avatar box: either <img> or ti-user placeholder.
     * @param {string} rawSource - path or URL; empty => icon
     * @param {{ imgClass?: string }} opts
     */
    function innerHtmlForAvatar(rawSource, opts) {
        opts = opts || {};
        const imgClass = opts.imgClass || "rounded-circle";
        const useIcon =
            !hasProfileImageSource(rawSource) ||
            isPlaceholderProfileImageUrl(rawSource);
        if (useIcon) {
            return userIconPlaceholderHtml();
        }
        const resolved = resolveProfileImageUrl(rawSource);
        if (isPlaceholderProfileImageUrl(resolved)) {
            return userIconPlaceholderHtml();
        }
        return (
            '<img src="' +
            escapeAttr(resolved) +
            '" alt="" class="' +
            escapeAttr(imgClass) +
            '" onerror="if(window.DreamChatProfileAvatar)window.DreamChatProfileAvatar.onAvatarImgError(this)" />'
        );
    }

    function onAvatarImgError(imgEl) {
        try {
            if (!imgEl || !imgEl.parentNode) return;
            const parent = imgEl.parentNode;
            imgEl.remove();
            parent.insertAdjacentHTML("beforeend", userIconPlaceholderHtml());
        } catch (e) {
            /* ignore */
        }
    }

    function setAvatarDivImageOrContactIcon(avatarDiv, rawSource) {
        if (!avatarDiv) return;
        avatarDiv.innerHTML = "";
        const useIcon =
            !hasProfileImageSource(rawSource) ||
            isPlaceholderProfileImageUrl(rawSource);
        if (useIcon) {
            const wrap = document.createElement("span");
            wrap.className =
                "d-inline-flex align-items-center justify-content-center rounded-circle w-100 h-100 avatar-contact-fallback";
            wrap.setAttribute("role", "img");
            wrap.setAttribute("aria-label", "User");
            const icon = document.createElement("i");
            icon.className = "ti ti-user";
            icon.setAttribute("aria-hidden", "true");
            wrap.appendChild(icon);
            avatarDiv.appendChild(wrap);
            return;
        }
        const resolved = resolveProfileImageUrl(rawSource);
        if (isPlaceholderProfileImageUrl(resolved)) {
            const wrap = document.createElement("span");
            wrap.className =
                "d-inline-flex align-items-center justify-content-center rounded-circle w-100 h-100 avatar-contact-fallback";
            wrap.setAttribute("role", "img");
            wrap.setAttribute("aria-label", "User");
            const icon = document.createElement("i");
            icon.className = "ti ti-user";
            icon.setAttribute("aria-hidden", "true");
            wrap.appendChild(icon);
            avatarDiv.appendChild(wrap);
            return;
        }
        const img = document.createElement("img");
        img.src = resolved;
        img.classList.add("rounded-circle");
        img.alt = "";
        img.addEventListener(
            "error",
            function onImgErr() {
                img.removeEventListener("error", onImgErr);
                setAvatarDivImageOrContactIcon(avatarDiv, "");
            },
            { once: true }
        );
        avatarDiv.appendChild(img);
    }

    /**
     * When markup is <div class="avatar"><img id="x"></div>, replace img-driven updates with this.
     */
    function applyToAvatarContainerOrImg(el, rawSource) {
        if (!el) return;
        const tag = (el.tagName || "").toUpperCase();
        if (tag === "IMG") {
            const wrap = el.parentElement;
            if (wrap && wrap.classList && wrap.classList.contains("avatar")) {
                el.remove();
                setAvatarDivImageOrContactIcon(wrap, rawSource);
                return;
            }
            if (hasProfileImageSource(rawSource) && !isPlaceholderProfileImageUrl(rawSource)) {
                el.src = resolveProfileImageUrl(rawSource);
                el.onerror = function () {
                    el.onerror = null;
                    el.src = "";
                    el.style.display = "none";
                    if (el.parentNode)
                        el.parentNode.insertAdjacentHTML(
                            "beforeend",
                            userIconPlaceholderHtml()
                        );
                };
            } else {
                el.style.display = "none";
                if (el.parentNode)
                    el.insertAdjacentHTML("afterend", userIconPlaceholderHtml());
            }
            return;
        }
        if (el.classList && el.classList.contains("avatar")) {
            setAvatarDivImageOrContactIcon(el, rawSource);
        }
    }

    /**
     * Update any element id used for profile photos: prefers .avatar div + ti-user; migrates legacy <img id> inside .avatar.
     * Skip id "profileImage" when #imageUpload exists (settings page file preview must stay an <img>).
     */
    function setProfileImageSlotById(id, rawUrl) {
        try {
            if (!id) return;
            if (id === "profileImage" && document.getElementById("imageUpload")) {
                const el = document.getElementById(id);
                if (el && (el.tagName === "IMG" || el.tagName === "img")) {
                    const resolved = resolveProfileImageUrl(rawUrl || "");
                    const useIcon =
                        !hasProfileImageSource(rawUrl) ||
                        isPlaceholderProfileImageUrl(rawUrl) ||
                        isPlaceholderProfileImageUrl(resolved);
                    const wrap = el.closest(".set-pro") || el.parentElement;
                    const phSel = "[data-dc-profile-img-placeholder]";
                    const existingPh = wrap ? wrap.querySelector(phSel) : null;
                    if (useIcon) {
                        el.removeAttribute("src");
                        el.style.display = "none";
                        el.onerror = null;
                        if (wrap && !existingPh) {
                            const ph = document.createElement("span");
                            ph.setAttribute("data-dc-profile-img-placeholder", "1");
                            ph.className =
                                "d-inline-flex align-items-center justify-content-center rounded-circle avatar-contact-fallback";
                            ph.style.cssText =
                                "position:absolute;inset:0.25rem;z-index:0;pointer-events:none;";
                            ph.setAttribute("role", "img");
                            ph.setAttribute("aria-label", "User");
                            ph.innerHTML = '<i class="ti ti-user" aria-hidden="true"></i>';
                            wrap.insertBefore(ph, el);
                        }
                        return;
                    }
                    if (existingPh) existingPh.remove();
                    el.style.display = "";
                    el.src = resolved;
                    el.onerror = function () {
                        this.onerror = null;
                        setProfileImageSlotById("profileImage", "");
                    };
                }
                return;
            }
            const el = document.getElementById(id);
            if (!el) return;
            if (el.classList && el.classList.contains("avatar")) {
                setAvatarDivImageOrContactIcon(el, rawUrl);
                return;
            }
            const tag = (el.tagName || "").toUpperCase();
            if (tag === "IMG") {
                const wrap = el.closest(".avatar");
                if (wrap) {
                    el.removeAttribute("id");
                    wrap.id = id;
                    setAvatarDivImageOrContactIcon(wrap, rawUrl);
                    return;
                }
                const resolved = resolveProfileImageUrl(rawUrl || "");
                if (
                    !hasProfileImageSource(rawUrl) ||
                    isPlaceholderProfileImageUrl(rawUrl) ||
                    isPlaceholderProfileImageUrl(resolved)
                ) {
                    const d = document.createElement("div");
                    d.id = id;
                    d.className =
                        "avatar d-inline-flex align-items-center justify-content-center " +
                        String(el.className || "").trim();
                    el.replaceWith(d);
                    setAvatarDivImageOrContactIcon(d, "");
                    return;
                }
                el.src = resolved;
                el.onerror = function () {
                    onAvatarImgError(el);
                };
            }
        } catch (e) {
            /* ignore */
        }
    }

    global.DreamChatProfileAvatar = {
        resolveProfileImageUrl: resolveProfileImageUrl,
        resolveGroupProfileImageUrl: resolveGroupProfileImageUrl,
        hasProfileImageSource: hasProfileImageSource,
        isPlaceholderProfileImageUrl: isPlaceholderProfileImageUrl,
        setAvatarDivImageOrContactIcon: setAvatarDivImageOrContactIcon,
        innerHtmlForAvatar: innerHtmlForAvatar,
        userIconPlaceholderHtml: userIconPlaceholderHtml,
        onAvatarImgError: onAvatarImgError,
        applyToAvatarContainerOrImg: applyToAvatarContainerOrImg,
        setProfileImageSlotById: setProfileImageSlotById,
    };
})(typeof window !== "undefined" ? window : this);
