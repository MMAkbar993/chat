 <!-- jQuery -->
 <script src="{{ asset('assets/js/jquery-3.7.1.min.js') }}"></script>

 <!-- Bootstrap Core JS -->
 <script src="{{ asset('assets/js/bootstrap.bundle.min.js') }}"></script>

 <!-- Slimscroll JS -->
 <script src="{{ asset('assets/plugins/slimscroll/jquery.slimscroll.min.js') }}"></script>
 @if (!Route::is('login','register.payment'))
 <!-- Swiper JS -->
 <script src="{{ asset('assets/plugins/swiper/swiper.min.js') }}"></script>

 <!-- FancyBox JS -->
 <script src="{{ asset('assets/plugins/fancybox/jquery.fancybox.min.js') }}"></script>
 <script src="{{ asset('assets/plugins/fancybox/jquery.fancybox.js') }}"></script>

 <!-- Select JS -->
 <script src="{{ asset('assets/plugins/select2/js/select2.min.js') }}"></script>

 <!-- Datetimepicker JS -->
 <script src="{{ asset('assets/js/moment.min.js') }}"></script>
 <script src="{{ asset('assets/js/bootstrap-datetimepicker.min.js') }}"></script>

 <script src="{{ asset('assets/js/crypto-js.min.js') }}"></script>

 <!-- Alert message -->
 <script src="{{ asset('assets/js/sweetalert.js') }}"></script>

 <!-- Recorder (loaded for SPA) -->
 <script src="{{ asset('assets/js/recorder.js') }}"></script>
 <script src="{{ asset('assets/js/MediaStreamRecorder.js') }}"></script>
 <!-- Moment -->
 <script src="{{ asset('assets/plugins/moment/moment.min.js') }}"></script>
 <script src="{{ asset('assets/js/jspdf.umd.min.js') }}"></script>

 <!-- Dropzone JS -->
 <script src="{{ asset('assets/plugins/dropzone/dropzone.min.js') }}"></script>

 @endif
 <!-- Include Axios library -->
 <script src="{{ asset('assets/js/axios.min.js') }}"></script>
 <!-- Custom JS -->
 <script src="{{ asset('assets/js/script.js') }}"></script>

<script src="{{ asset('assets/js/toastify.js') }}"></script>
@php
try { $loadAgora = true; } catch (\Throwable $e) { $loadAgora = false; }
@endphp
@if (!Route::is('login','signup','register.payment'))
<script src="{{ asset('assets/js/AgoraRTC_N.js') }}" defer></script>
@endif
 <script>
    const APP_URL = "{{ env('APP_URL', '') }}";
    const APP_ID = "{{ env('AGORA_APP_ID', '') }}";
    const IS_KYC_VERIFIED = {{ (Auth::check() && Auth::user() && Auth::user()->isKycVerified()) ? 'true' : 'false' }};
    const IS_EMAIL_VERIFIED = {{ (Auth::check() && Auth::user() && Auth::user()->email_verified_at) ? 'true' : 'false' }};
    @php
    try {
        $primaryRoles = config('registration.primary_roles', []);
    } catch (\Throwable $e) {
        $primaryRoles = [];
    }
    @endphp
    const PRIMARY_ROLES = @json($primaryRoles);
    window.__FIREBASE_CONFIG__ = @json(config('firebase.frontend'));
    window.FIREBASE_DISABLED = !window.__FIREBASE_CONFIG__ || !window.__FIREBASE_CONFIG__.api_key;
    @if(Auth::check() && Auth::user())
    @php
        $laravelUserJson = 'null';
        try {
            $u = Auth::user();
            $ud = $u->get_user_details;
            $profileImg = '';
            try {
                $profileImg = $u->profile_image_link ?? '';
            } catch (\Throwable $e) {
                $profileImg = '';
            }
            $laravelUserJson = json_encode([
                'id' => $u->id,
                'firstName' => $u->first_name,
                'lastName' => $u->last_name,
                'full_name' => $u->full_name,
                'email' => $u->email,
                'username' => $u->user_name,
                'user_name' => $u->user_name,
                'mobile_number' => $u->mobile_number ?? '',
                'gender' => $u->gender ?? '',
                'country' => $u->country ?? '',
                'profile_image' => $profileImg,
                'image' => $profileImg,
                'created_at' => $u->created_at?->format('Y-m-d H:i:s'),
                'primary_role' => $u->primary_role ?? '',
                'primary_role_label' => (function () use ($u) {
                    $key = $u->primary_role ?? '';
                    if ($key === '') return '';
                    $roles = config('registration.primary_roles', []);
                    $label = $roles[$key] ?? $key;
                    if ($key === 'other' && $u->other_role_text) {
                        $label .= ' (' . $u->other_role_text . ')';
                    }
                    return $label;
                })(),
                'other_role_text' => $u->other_role_text ?? '',
                'about' => $ud ? ($ud->user_about ?? '') : '',
                'facebook' => $ud ? ($ud->facebook ?? '') : '',
                'google' => $ud ? ($ud->google ?? '') : '',
                'twitter' => $ud ? ($ud->twitter ?? '') : '',
                'linkedin' => $ud ? ($ud->linkedin ?? '') : '',
                'youtube' => $ud ? ($ud->youtube ?? '') : '',
                'instagram' => $ud ? ($ud->instagram ?? '') : '',
                'kick' => $ud ? ($ud->kick ?? '') : '',
                'twitch' => $ud ? ($ud->twitch ?? '') : '',
                'facebook_link' => $ud ? ($ud->facebook ?? '') : '',
                'google_link' => $ud ? ($ud->google ?? '') : '',
                'twitter_link' => $ud ? ($ud->twitter ?? '') : '',
                'linkedin_link' => $ud ? ($ud->linkedin ?? '') : '',
                'youtube_link' => $ud ? ($ud->youtube ?? '') : '',
                'instagram_link' => $ud ? ($ud->instagram ?? '') : '',
                'kick_link' => $ud ? ($ud->kick ?? '') : '',
                'twitch_link' => $ud ? ($ud->twitch ?? '') : '',
                'website_url' => (function () use ($u) {
                    $first = $u->websites()->whereNotNull('verified_at')->orderBy('sort_order')->first();
                    return $first ? $first->getDisplayUrl() : '';
                })(),
                'website_urls' => $u->websites()->whereNotNull('verified_at')->orderBy('sort_order')->get()->map(fn ($w) => $w->getDisplayUrl())->values()->all(),
                'profile_display_name' => $u->profile_display_name ?? 'full_name',
            ]);
            $verifiedPlatforms = $u->socialAccounts()->where('oauth_verified', true)->pluck('platform')->toArray();
            $platformToKey = [ 'facebook' => 'facebook_link', 'x' => 'twitter_link', 'linkedin' => 'linkedin_link', 'youtube' => 'youtube_link', 'instagram' => 'instagram_link', 'kick' => 'kick_link', 'twitch' => 'twitch_link' ];
            $socialVerified = [];
            foreach ($platformToKey as $platform => $key) {
                $socialVerified[$key] = in_array($platform, $verifiedPlatforms);
            }
            $fallbackUrls = [ 'facebook' => 'https://www.facebook.com/', 'x' => 'https://x.com/', 'linkedin' => 'https://www.linkedin.com/', 'youtube' => 'https://www.youtube.com/', 'instagram' => 'https://www.instagram.com/', 'kick' => 'https://kick.com/', 'twitch' => 'https://www.twitch.tv/' ];
            $laravelUserArr = json_decode($laravelUserJson, true);
            if ($laravelUserArr) {
                foreach ($platformToKey as $platform => $key) {
                    $baseKey = str_replace('_link', '', $key);
                    if (empty($laravelUserArr[$key]) && in_array($platform, $verifiedPlatforms)) {
                        $acc = $u->socialAccounts()->where('platform', $platform)->where('oauth_verified', true)->first();
                        $url = $acc && $acc->profile_url ? $acc->profile_url : ($fallbackUrls[$platform] ?? 'https://' . $platform . '.com/');
                        $laravelUserArr[$baseKey] = $url;
                        $laravelUserArr[$key] = $url;
                    }
                }
                $laravelUserJson = json_encode($laravelUserArr);
            }
        } catch (\Throwable $e) {
            try {
                $u = Auth::user();
                if ($u) {
                    $laravelUserJson = json_encode([
                        'id' => $u->id,
                        'full_name' => $u->full_name ?? trim(($u->first_name ?? '') . ' ' . ($u->last_name ?? '')),
                        'email' => $u->email,
                    ]);
                } else {
                    $laravelUserJson = 'null';
                }
            } catch (\Throwable $inner) {
                $laravelUserJson = 'null';
            }
            $socialVerified = [];
        }
    @endphp
    window.LARAVEL_USER = {!! $laravelUserJson !!};
    window.LARAVEL_SOCIAL_VERIFIED = @json($socialVerified ?? []);
    @endif
    function capitalizeFirstLetter(val) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}
</script>@if (!Route::is('login','signup','register.payment','signin'))
<!-- Populate profile from Laravel when Firebase is disabled -->
<script>
(function() {
    function setText(id, text) {
        var el = document.getElementById(id);
        if (el) el.innerText = text || '—';
    }
    /** Set element to a clickable link if value is a URL, otherwise plain text. Safe against XSS. */
    function setLinkOrText(id, value) {
        var el = document.getElementById(id);
        if (!el) return;
        var url = (value || '').toString().trim();
        if (url && (url.indexOf('http://') === 0 || url.indexOf('https://') === 0)) {
            el.innerHTML = '';
            var a = document.createElement('a');
            a.href = url;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.className = 'text-primary text-break';
            a.textContent = url.length > 50 ? url.substring(0, 47) + '…' : url;
            a.title = url;
            el.appendChild(a);
        } else {
            el.textContent = url || '—';
        }
    }
    function setImg(id, src) {
        var el = document.getElementById(id);
        if (el && el.tagName === 'IMG' && src) el.src = src;
    }
    function setInputValue(id, value) {
        var el = document.getElementById(id);
        if (el && value !== undefined && value !== null) el.value = value;
    }
    function applyLaravelProfile(forceApply) {
        if (typeof window.LARAVEL_USER === 'undefined' || !window.LARAVEL_USER) return;
        if (!forceApply && !window.FIREBASE_DISABLED) return;
        // #region agent log
        try {
            fetch('http://127.0.0.1:7865/ingest/d139c47a-6c4a-40c5-bdee-2cb2437ea702',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3be6ca'},body:JSON.stringify({sessionId:'3be6ca',location:'script.blade:applyLaravelProfile',message:'applyLaravelProfile applying',data:{forceApply:!!forceApply,FIREBASE_DISABLED:!!window.FIREBASE_DISABLED},timestamp:Date.now(),hypothesisId:'H4'})}).catch(function(){});
        } catch(e) {}
        // #endregion
        var u = window.LARAVEL_USER;
        var fullName = (u.firstName || '') + ' ' + (u.lastName || '').trim() || u.full_name || 'No Name';
        var defaultImg = (typeof APP_URL !== 'undefined' ? APP_URL : '') + '/assets/img/profiles/avatar-03.jpg';
        if (defaultImg.indexOf('/') === 0) defaultImg = defaultImg.slice(1);
        if (!defaultImg.match(/^https?:\/\//)) defaultImg = (window.location.origin || '') + '/' + defaultImg.replace(/^\//,'');
        var imgUrl = u.profile_image || u.image || defaultImg;
        setText('profile-name', fullName);
        setText('profile-info-name', fullName);
        setText('profile-info-chat-name', fullName + ' 😊');
        setText('profile-info-email', u.email || '—');
        setText('profile-info-phone', u.mobile_number || '—');
        setText('profile-info-country', u.country || '—');
        setText('profile-info-about', u.about || '—');
        setText('profile-info-bio', u.about || '—');
        setText('profile-info-gender', u.gender || '—');
        setText('profile-info-join-date', u.created_at || '—');
        setText('profile-info-role', u.primary_role_label || u.primary_role || '—');
        setLinkOrText('profile-info-facebook', u.facebook_link || u.facebook);
        setLinkOrText('profile-info-twitter', u.twitter_link || u.twitter);
        setLinkOrText('profile-info-linkedin', u.linkedin_link || u.linkedin);
        setLinkOrText('profile-info-website', u.website_url || u.website_urls?.[0] || '');
        setLinkOrText('profile-info-youtube', u.youtube_link || u.youtube);
        setLinkOrText('profile-info-instagram', u.instagram_link || u.instagram);
        setLinkOrText('profile-info-kick', u.kick_link || u.kick);
        setLinkOrText('profile-info-twitch', u.twitch_link || u.twitch);
        setImg('profileImage', imgUrl);
        setImg('profileImageProfile', imgUrl);
        setImg('profileImageChat', imgUrl);
        setImg('ProfileImageSidebar', imgUrl);
        setInputValue('firstName', u.firstName);
        setInputValue('lastName', u.lastName);
        setInputValue('email', u.email);
        setInputValue('user_name', u.user_name || u.username);
        setInputValue('mobile_number', u.mobile_number);
        setInputValue('gender', u.gender);
        setInputValue('edit-kick', u.kick_link || u.kick);
        setInputValue('edit-twitch', u.twitch_link || u.twitch);
        setInputValue('edit-instagram', u.instagram_link || u.instagram);
        setInputValue('profile_display_name', u.profile_display_name || 'full_name');
        if (document.getElementById('user-id')) document.getElementById('user-id').innerText = 'Logged in as: ' + u.id;
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyLaravelProfile);
    } else {
        applyLaravelProfile();
    }
    setTimeout(applyLaravelProfile, 500);
    // Delayed fallback when Firebase is enabled but never populates profile (e.g. init failed or no Firebase user)
    setTimeout(function() { applyLaravelProfile(true); }, 1500);
})();

/* Save settings (profile + image + social) via Laravel/MySQL. Runs when user is logged in (LARAVEL_USER). */
(function() {
    if (typeof window.LARAVEL_USER === 'undefined' || !window.LARAVEL_USER) return;
    var saveUrl = '{{ route("profile-settings.save") }}';
    function getToken() {
        var m = document.querySelector('meta[name="csrf-token"]');
        if (m) return m.getAttribute('content');
        var i = document.querySelector('input[name="_token"]');
        return i ? i.value : '';
    }
    function buildFormData() {
        var form = new FormData();
        form.append('_token', getToken());
        var ids = ['user_name','mobile_number','gender','dob','country','about','primary_role','other_role_text'];
        if (typeof IS_KYC_VERIFIED !== 'undefined' && IS_KYC_VERIFIED) {
            ids.push('profile_display_name');
        }
        if (typeof IS_KYC_VERIFIED === 'undefined' || !IS_KYC_VERIFIED) {
            ids = ['firstName','lastName'].concat(ids);
        }
        ids.push('email');
        ids = ids.filter(function(id, i, a) { return a.indexOf(id) === i; });
        ids.forEach(function(id) {
            var el = document.getElementById(id);
            if (el && el.value !== undefined) form.append(id, el.value || '');
        });
        var imageInput = document.getElementById('imageUpload');
        if (imageInput && imageInput.files && imageInput.files[0]) form.append('profile_image', imageInput.files[0]);
        return form;
    }
    function saveSettings(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        var btn = e.target;
        if (btn && btn.classList) btn.classList.add('disabled');
        var errEl = document.getElementById('socialVerifyError');
        if (errEl) { errEl.classList.add('d-none'); errEl.textContent = ''; }
        var formData = buildFormData();
        fetch(saveUrl, {
            method: 'POST',
            body: formData,
            headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' }
        }).then(function(r) { return r.json().then(function(data) { return { ok: r.ok, status: r.status, data: data }; }).catch(function() { return { ok: false, status: r.status, data: { message: 'Request failed' } }; }); })
          .then(function(result) {
              if (btn && btn.classList) btn.classList.remove('disabled');
              if (result.ok) {
                  if (typeof Toastify !== 'undefined') {
                      Toastify({ text: result.data.message || 'Profile updated successfully.', duration: 3000, gravity: 'top', position: 'right', style: { background: '#28a745' } }).showToast();
                  } else { alert(result.data.message || 'Profile updated successfully.'); }
                  if (result.data.profile_image && window.LARAVEL_USER) {
                      window.LARAVEL_USER.profile_image = result.data.profile_image;
                      window.LARAVEL_USER.image = result.data.profile_image;
                  }
                  if (typeof applyLaravelProfile === 'function') applyLaravelProfile();
                  window.location.reload();
              } else {
                  var msg = result.data && result.data.message ? result.data.message : (result.status === 404 ? 'Settings save URL not found. Run: php artisan route:clear' : 'Failed to save.');
                  if (typeof Toastify !== 'undefined') {
                      Toastify({ text: msg, duration: 3000, gravity: 'top', position: 'right', style: { background: '#dc3545' } }).showToast();
                  } else { alert(msg); }
              }
          })
          .catch(function(err) {
              if (btn && btn.classList) btn.classList.remove('disabled');
              if (typeof Toastify !== 'undefined') {
                  Toastify({ text: 'Failed to save settings.', duration: 3000, gravity: 'top', position: 'right', style: { background: '#dc3545' } }).showToast();
              } else { alert('Failed to save settings.'); }
          });
    }
    function bindWhenReady() {
        var saveProfile = document.getElementById('saveProfileBtn');
        var saveSocial = document.getElementById('saveSocialLinksBtn');
        if (saveProfile && !saveProfile.dataset.laravelBound) {
            saveProfile.dataset.laravelBound = '1';
            saveProfile.addEventListener('click', saveSettings, true);
        }
        if (saveSocial && !saveSocial.dataset.laravelBound) {
            saveSocial.dataset.laravelBound = '1';
            saveSocial.addEventListener('click', saveSettings, true);
        }
        var uploadIcon = document.getElementById('uploadIcon');
        var imageUpload = document.getElementById('imageUpload');
        if (uploadIcon && imageUpload && !uploadIcon.dataset.laravelBound) {
            uploadIcon.dataset.laravelBound = '1';
            uploadIcon.addEventListener('click', function() { imageUpload.click(); });
        }
        if (imageUpload && !imageUpload.dataset.laravelPreviewBound) {
            imageUpload.dataset.laravelPreviewBound = '1';
            imageUpload.addEventListener('change', function(ev) {
                var file = ev.target.files[0];
                if (!file) return;
                var allowed = ['image/svg+xml','image/jpeg','image/png','image/jpg','image/gif'];
                if (allowed.indexOf(file.type) === -1) {
                    if (typeof Toastify !== 'undefined') Toastify({ text: 'Use SVG, JPG, JPEG, PNG or GIF.', duration: 3000, gravity: 'top', position: 'right', style: { background: '#dc3545' } }).showToast();
                    return;
                }
                var reader = new FileReader();
                reader.onload = function(e) {
                    var img = document.getElementById('profileImage');
                    if (img) img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            });
        }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindWhenReady);
    } else {
        bindWhenReady();
    }
    setTimeout(bindWhenReady, 800);
})();
</script>
{{-- Apply chat background from Settings when on chat page --}}
<script>
(function() {
    try {
        var path = (window.location.pathname || '').replace(/\/+/g, '/');
        if (path.indexOf('/chat') !== 0 && path !== '/chat') return;
        var url = localStorage.getItem('chat_background_url');
        if (url) {
            var el = document.getElementById('chat-area') || document.getElementById('middle');
            if (el) {
                el.style.backgroundImage = 'url(' + url.replace(/"/g, '%22') + ')';
                el.style.backgroundSize = 'cover';
                el.style.backgroundPosition = 'center';
            }
        }
    } catch (e) {}
})();
</script>
{{-- Contact details "Chat" button: go to chat with selected user when Firebase disabled --}}
<script>
(function() {
    if (typeof window.FIREBASE_DISABLED === 'undefined' || !window.FIREBASE_DISABLED) return;
    document.addEventListener('click', function(e) {
        if (!e.target.closest('#chat-button')) return;
        var editId = document.getElementById('edit-user-id');
        var userId = editId && editId.value ? editId.value : '';
        if (userId) {
            try { localStorage.setItem('selectedUserId', userId); } catch (err) {}
            e.preventDefault();
            e.stopPropagation();
            window.location.href = (typeof APP_URL !== 'undefined' && APP_URL ? APP_URL : window.location.origin) + '/chat';
        }
    }, true);
})();
</script>
<!-- Laravel data loaders: contacts, chat list, groups when Firebase disabled -->
<script src="{{ asset('assets/js/laravel-data-loaders.js') }}"></script>
<script src="{{ asset('assets/js/sidebar-search.js') }}"></script>
{{-- Enable Notifications button (Settings): request browser permission; works when firebaseSettings.js is not loaded --}}
<script>
(function() {
    function showToast(text, isError) {
        if (typeof Toastify !== 'undefined') {
            Toastify({ text: text, duration: 3000, gravity: 'top', position: 'right', style: { background: isError ? '#dc3545' : '#28a745' } }).showToast();
        } else {
            alert(text);
        }
    }
    document.addEventListener('click', function(e) {
        var btn = e.target.closest('#notificationButton');
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        if (!('Notification' in window)) {
            showToast('{{ __("This browser does not support notifications.") }}', true);
            return;
        }
        if (Notification.permission === 'granted') {
            showToast('{{ __("Notifications are already enabled.") }}', false);
            return;
        }
        Notification.requestPermission().then(function(permission) {
            if (permission === 'granted') {
                showToast('{{ __("Notifications enabled.") }}', false);
            } else {
                showToast('{{ __("Notification permission denied.") }}', false);
            }
        }).catch(function() {
            showToast('{{ __("Could not request notification permission.") }}', true);
        });
    }, true);
})();
</script>
{{-- "Add contact" button: ensure modal opens (SPA may replace #spa-page-modals so target must exist) --}}
<script>
(function() {
    var contactUrl = '{{ route("contact") }}';
    document.addEventListener('click', function(e) {
        var trigger = e.target.closest('a[data-bs-target="#add-contact"], [data-bs-target="#add-contact"]');
        if (!trigger) return;
        var modalEl = document.getElementById('add-contact');
        if (modalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            e.preventDefault();
            e.stopPropagation();
            var modal = bootstrap.Modal.getOrCreateInstance(modalEl);
            modal.show();
        } else if (contactUrl) {
            e.preventDefault();
            window.location.href = contactUrl;
        }
    }, true);
})();
</script>
{{-- "New chat" (+) and "Invite Others": ensure modals open; fallback to chat page if not in DOM --}}
<script>
(function() {
    var chatUrl = '{{ route("chat") }}';
    document.addEventListener('click', function(e) {
        var trigger = e.target.closest('a[data-bs-target="#new-chat"], [data-bs-target="#new-chat"], a[data-bs-target="#invite-contact"], [data-bs-target="#invite-contact"]');
        if (!trigger) return;
        var targetId = trigger.getAttribute('data-bs-target');
        if (!targetId || targetId.indexOf('#') !== 0) return;
        var modalId = targetId.slice(1);
        var modalEl = document.getElementById(modalId);
        if (modalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            e.preventDefault();
            e.stopPropagation();
            var modal = bootstrap.Modal.getOrCreateInstance(modalEl);
            modal.show();
        } else if (chatUrl) {
            e.preventDefault();
            window.location.href = chatUrl;
        }
    }, true);
})();
</script>
{{-- Invite form (chat page): send invitation via API when Firebase disabled --}}
<script>
(function() {
    if (typeof window.FIREBASE_DISABLED === 'undefined' || !window.FIREBASE_DISABLED) return;
    var inviteUrl = '{{ route("invite.send") }}';
    var csrfToken = document.querySelector('meta[name="csrf-token"]') && document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    document.addEventListener('submit', function(e) {
        if (e.target && e.target.id === 'inviteFormChat') {
            e.preventDefault();
            e.stopPropagation();
            var input = document.getElementById('inviteInput');
            var email = input ? input.value.trim() : '';
            if (!email) {
                if (typeof Toastify !== 'undefined') {
                    Toastify({ text: '{{ __("Please enter an email address.") }}', duration: 3000, gravity: 'top', position: 'right', style: { background: '#dc3545' } }).showToast();
                } else { alert('Please enter an email address.'); }
                return;
            }
            var btn = document.getElementById('sendInviteButton');
            if (btn) { btn.disabled = true; btn.textContent = '{{ __("Sending...") }}'; }
            fetch(inviteUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken || '', 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
                body: JSON.stringify({ email: email, message: '' })
            }).then(function(r) { return r.json().then(function(data) { return { ok: r.ok, status: r.status, data: data }; }).catch(function() { return { ok: false, data: { message: 'Request failed' } }; }); })
              .then(function(result) {
                  if (btn) { btn.disabled = false; btn.textContent = '{{ __("Send Invitation") }}'; }
                  if (result.ok && result.data && result.data.message) {
                      if (typeof Toastify !== 'undefined') {
                          Toastify({ text: result.data.message, duration: 3000, gravity: 'top', position: 'right', style: { background: '#28a745' } }).showToast();
                      } else { alert(result.data.message); }
                      e.target.reset();
                      var modalEl = document.getElementById('invite-contact');
                      if (modalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                          var modal = bootstrap.Modal.getInstance(modalEl);
                          if (modal) modal.hide();
                      }
                  } else {
                      var msg = (result.data && result.data.message) ? result.data.message : '{{ __("Could not send invitation.") }}';
                      if (typeof Toastify !== 'undefined') {
                          Toastify({ text: msg, duration: 3000, gravity: 'top', position: 'right', style: { background: '#dc3545' } }).showToast();
                      } else { alert(msg); }
                  }
              })
              .catch(function() {
                  if (btn) { btn.disabled = false; btn.textContent = '{{ __("Send Invitation") }}'; }
                  if (typeof Toastify !== 'undefined') {
                      Toastify({ text: '{{ __("Could not send invitation. Please try again.") }}', duration: 3000, gravity: 'top', position: 'right', style: { background: '#dc3545' } }).showToast();
                  } else { alert('Could not send invitation.'); }
              });
        }
    }, true);
})();
</script>
{{-- Add Contact form submit when Firebase is disabled (Laravel/MySQL contacts) --}}
<script>
(function() {
    if (typeof window.FIREBASE_DISABLED === 'undefined' || !window.FIREBASE_DISABLED) return;
    var contactsUrl = '{{ route("contacts.store") }}';
    var csrfToken = document.querySelector('meta[name="csrf-token"]') && document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    function getEl(id) { return document.getElementById(id); }
    function showToast(msg, isError) {
        if (typeof Toastify !== 'undefined') {
            Toastify({ text: msg, duration: 3000, gravity: 'top', position: 'right', style: { background: isError ? '#dc3545' : '#28a745' } }).showToast();
        } else { alert(msg); }
    }
    function handleAddContactSubmit(e) {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        var form = getEl('register-form');
        var btn = getEl('submit-contact-button');
        if (!form || !btn) return;
        var firstName = (getEl('first_name') && getEl('first_name').value) || '';
        var lastName = (getEl('last_name') && getEl('last_name').value) || '';
        var email = (getEl('email_new') && getEl('email_new').value) || '';
        var mobile = (getEl('mobile_number_new') && getEl('mobile_number_new').value) || '';
        var emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        var phonePattern = /^[0-9]{10,21}$/;
        if (!firstName.trim()) { showToast('First name is required.', true); return; }
        if (!lastName.trim()) { showToast('Last name is required.', true); return; }
        if (!email.trim()) { showToast('Email is required.', true); return; }
        if (!emailPattern.test(email)) { showToast('Enter a valid email.', true); return; }
        if (!mobile.trim()) { showToast('Mobile number is required.', true); return; }
        if (!phonePattern.test(mobile)) { showToast('Enter a valid mobile number (10–21 digits).', true); return; }
        btn.disabled = true;
        btn.textContent = 'Processing...';
        var body = new FormData();
        body.append('_token', csrfToken || '');
        body.append('first_name', firstName.trim());
        body.append('last_name', lastName.trim());
        body.append('email', email.trim());
        body.append('mobile_number', mobile.trim());
        fetch(contactsUrl, {
            method: 'POST',
            body: body,
            headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' },
            credentials: 'same-origin'
        }).then(function(r) { return r.json().then(function(data) { return { ok: r.ok, status: r.status, data: data }; }).catch(function() { return { ok: false, status: r.status, data: { message: 'Request failed' } }; }); })
          .then(function(result) {
              btn.disabled = false;
              btn.textContent = 'Add Contact';
              if (result.ok) {
                  showToast(result.data.message || 'Contact added successfully.', false);
                  form.reset();
                  var modalEl = document.getElementById('add-contact');
                  if (modalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                      var modal = bootstrap.Modal.getInstance(modalEl);
                      if (modal) modal.hide();
                  }
              } else {
                  showToast(result.data.message || 'Could not add contact.', true);
              }
          })
          .catch(function() {
              btn.disabled = false;
              btn.textContent = 'Add Contact';
              showToast('Could not add contact. Please try again.', true);
          });
    }
    document.addEventListener('click', function(e) {
        if (e.target.closest('#submit-contact-button')) {
            var form = getEl('register-form');
            if (form && form.closest('#add-contact')) {
                e.preventDefault();
                e.stopPropagation();
                handleAddContactSubmit(e);
            }
        }
    }, true);
    document.addEventListener('submit', function(e) {
        if (e.target && e.target.id === 'register-form' && e.target.closest('#add-contact')) {
            e.preventDefault();
            e.stopPropagation();
            handleAddContactSubmit(e);
        }
    }, true);
})();
</script>
{{-- "+ Group" button: open New Group modal when Firebase disabled (firebaseGroupChat.js may not load) --}}
<script>
(function() {
    if (typeof window.FIREBASE_DISABLED === 'undefined' || !window.FIREBASE_DISABLED) return;
    document.addEventListener('click', function(e) {
        var btn = e.target.closest('#group-add-btn');
        if (!btn) return;
        var modalEl = document.getElementById('new-group');
        if (modalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            e.preventDefault();
            e.stopPropagation();
            var modal = bootstrap.Modal.getOrCreateInstance(modalEl);
            modal.show();
        }
    }, true);
})();
</script>
{{-- Laravel-only logout when Firebase is disabled: destroy session then redirect --}}
<script>
(function() {
    if (typeof window.FIREBASE_DISABLED === 'undefined' || !window.FIREBASE_DISABLED) return;
    var logoutUrl = '{{ route("logout.post") }}';
    var loginUrl = '{{ route("login") }}';
    var csrfToken = document.querySelector('meta[name="csrf-token"]') && document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    function doLogout(e) {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        var btn = e && e.target ? e.target.closest('a, button') : null;
        if (btn) btn.style.pointerEvents = 'none';
        fetch(logoutUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken || '', 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            credentials: 'same-origin'
        }).then(function() { window.location.href = loginUrl; }).catch(function() { window.location.href = loginUrl; });
    }
    function bindLogout() {
        ['logout-button', 'profile-logout-button', 'setting-logout-button'].forEach(function(id) {
            var el = document.getElementById(id);
            if (el && !el.dataset.laravelLogoutBound) {
                el.dataset.laravelLogoutBound = '1';
                el.addEventListener('click', doLogout, true);
            }
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindLogout);
    else bindLogout();
    setTimeout(bindLogout, 500);
})();
</script>
{{-- Laravel chat: when on /chat with selectedUserId (localStorage or ?user=), show chat panel and load messages --}}
<script>
(function() {
    if (typeof window.FIREBASE_DISABLED === 'undefined' || !window.FIREBASE_DISABLED) return;
    var chatPath = '{{ route("chat") }}';
    function getPathname() {
        return (window.location.pathname || '').replace(/\/+/g, '/');
    }
    function isChatPage(path) {
        path = path || getPathname();
        var pathNorm = chatPath.replace(/^https?:\/\/[^/]+/, '');
        return path === '/chat' || path === pathNorm || path.indexOf('/chat') !== -1;
    }
    var baseUrl = typeof APP_URL !== 'undefined' && APP_URL ? APP_URL : (window.location.origin || '');
    if (baseUrl.slice(-1) === '/') baseUrl = baseUrl.slice(0, -1);

    function run(attempt) {
        attempt = attempt || 0;
        console.log("[Fallback Chat] run() attempt:", attempt);
        var currentUserId = typeof window.LARAVEL_USER !== 'undefined' && window.LARAVEL_USER ? window.LARAVEL_USER.id : null;
        var selectedId = null;
        try { selectedId = localStorage.getItem('selectedUserId'); } catch (e) {}
        var params = typeof URLSearchParams !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        var userFromUrl = params ? params.get('user') : null;
        console.log("[Fallback Chat] LocalStorage ID:", selectedId, "URL ID:", userFromUrl);
        if (userFromUrl) selectedId = userFromUrl;
        
        console.log("[Fallback Chat] Using selectedId:", selectedId, "currentUserId:", currentUserId);
        if (!selectedId || !currentUserId) {
            if (selectedId && !currentUserId && attempt < 5) {
                currentUserId = typeof window.LARAVEL_USER !== 'undefined' && window.LARAVEL_USER ? window.LARAVEL_USER.id : null;
                setTimeout(function() { run(attempt + 1); }, 200);
            }
            return;
        }
        var welcome = document.getElementById('welcome-container');
        var middle = document.getElementById('middle');
        var chatBox = document.getElementById('chat-box');
        var chatForm = document.getElementById('message-form');
        console.log("[Fallback Chat] Elements found:", { welcome: !!welcome, middle: !!middle, chatBox: !!chatBox, chatForm: !!chatForm });
        if (!middle || !chatBox) {
            console.log("[Fallback Chat] Retrying, attempt:", attempt);
            if (attempt < 10) setTimeout(function() { run(attempt + 1); }, 150);
            return;
        }
        console.log("[Fallback Chat] Modifying DOM styles");
        if (welcome) welcome.style.setProperty('display', 'none', 'important');
        middle.style.setProperty('display', 'flex', 'important');
        middle.classList.add('show', 'show-chatbar');
        
        // Also force parent .chat and sibling .left-sidebar toggles (for mobile/tablet layouts)
        var chatParent = document.querySelector('.chat');
        if (chatParent) chatParent.classList.add('show-chatbar', 'show');
        
        var leftSidebar = document.querySelector('.left-sidebar');
        if (leftSidebar) leftSidebar.classList.add('hide-left-sidebar');
        
        var sidebarMenu = document.querySelector('.sidebar-menu');
        if (sidebarMenu && window.innerWidth <= 991) sidebarMenu.classList.add('d-none');
        
        var fallbackH6 = middle.querySelector('.chat-header h6');
        if (fallbackH6) fallbackH6.textContent = 'User ' + selectedId;
        var fallbackAvatar = middle.querySelector('.chat-header .avatar img');
        if (fallbackAvatar) fallbackAvatar.src = baseUrl + '/assets/img/profiles/avatar-06.jpg';
        if (chatForm) {
            chatForm.onsubmit = function(e) {
                e.preventDefault();
                var input = document.getElementById('message-input') || chatForm.querySelector('input[type="text"], textarea');
                var text = input ? input.value.trim() : '';
                if (!text) return false;
                var toId = selectedId;
                var token = document.querySelector('meta[name="csrf-token"]') && document.querySelector('meta[name="csrf-token"]').getAttribute('content');
                fetch(baseUrl + '/api/chat/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': token || '', 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    credentials: 'same-origin',
                    body: JSON.stringify({ from_user_id: currentUserId, to_user_id: toId, message: text })
                }).then(function(r) { return r.json(); }).then(function() {
                    if (input) input.value = '';
                    var div = document.createElement('div');
                    div.className = 'chats right';
                    div.innerHTML = '<div class="chat-content"><div class="chat-profile-name"><h6>You</h6><span>' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '</span></div><div class="chat-info"><p class="mb-0">' + text.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</p></div></div>';
                    if (chatBox) { chatBox.appendChild(div); chatBox.scrollTop = chatBox.scrollHeight; }
                }).catch(function() {});
                return false;
            };
        }
        fetch(baseUrl + '/api/chat-list', { method: 'GET', headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }, credentials: 'same-origin' })
            .then(function(r) { return r.json(); })
            .then(function(list) {
                var other = null;
                if (Array.isArray(list)) other = list.find(function(item) { return String(item.other_user_id) === String(selectedId); });
                var name = other ? (other.display_name || 'User') : ('User ' + selectedId);
                var img = (other && other.other_user && other.other_user.profile_image_link) ? other.other_user.profile_image_link : (baseUrl + '/assets/img/profiles/avatar-06.jpg');
                var h6 = middle.querySelector('.chat-header h6');
                if (h6) h6.textContent = name;
                var avatar = middle.querySelector('.chat-header .avatar img');
                if (avatar) avatar.src = img;
                return fetch(baseUrl + '/api/chat-messages/' + selectedId, { method: 'GET', headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }, credentials: 'same-origin' });
            })
            .then(function(r) { return r && r.json ? r.json() : []; })
            .then(function(messages) {
                if (!Array.isArray(messages)) return;
                chatBox.innerHTML = '';
                messages.forEach(function(m) {
                    var isOut = Number(m.from) === Number(currentUserId);
                    var div = document.createElement('div');
                    div.className = isOut ? 'chats right' : 'chats';
                    var time = m.timestamp ? new Date(m.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                    div.innerHTML = '<div class="chat-content"><div class="chat-profile-name"><h6>' + (isOut ? 'You' : 'Them') + '</h6><span>' + time + '</span></div><div class="chat-info"><p class="mb-0">' + (m.text || '').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</p></div></div>';
                    chatBox.appendChild(div);
                });
                if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
            })
            .catch(function() {
                if (chatBox) chatBox.innerHTML = '<p class="text-muted text-center py-3 mb-0">Could not load conversation.</p>';
            });
    }

    function tryRun() {
        if (!isChatPage()) return;
        run(0);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tryRun);
    else tryRun();
    setTimeout(tryRun, 300);
    setTimeout(tryRun, 800);
    if (isChatPage() && typeof URLSearchParams !== 'undefined') {
        var params = new URLSearchParams(window.location.search);
        if (params.get('user')) setTimeout(tryRun, 1200);
    }
    window.addEventListener('spa-page-applied', function(e) {
        var path = e && e.detail && e.detail.pathname ? e.detail.pathname : getPathname();
        if (path === '/chat' || path === '/index') tryRun();
    });
})();
</script>
@endif
{{-- Firebase JS modules (only when Firebase is enabled and user is logged in) --}}
@if (!Route::is('login','signup','register.payment','signin'))
@if (config('firebase.frontend.api_key'))
<script type="module" src="{{ asset('assets/js/firebase/firebaseChat.js') }}"></script>
<script type="module" src="{{ asset('assets/js/firebase/firebaseContact.js') }}"></script>
<script type="module" src="{{ asset('assets/js/firebase/firebaseGroupChat.js') }}"></script>
<script type="module" src="{{ asset('assets/js/firebase/firebaseSidebar.js') }}"></script>
<script type="module" src="{{ asset('assets/js/firebase/firebaseCalls.js') }}"></script>
@endif
@endif
<!-- SPA Navigation -->
<script src="{{ asset('assets/js/spa-navigation.js') }}"></script>

