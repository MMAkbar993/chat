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
try { $loadAgora = config('calls.provider') !== 'meet'; } catch (\Throwable $e) { $loadAgora = false; }
@endphp
@if (!Route::is('login','signup','register.payment') && $loadAgora)
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
    @php
    try {
        $fc = [
            'apiKey' => env('FIREBASE_API_KEY'),
            'authDomain' => env('FIREBASE_AUTH_DOMAIN'),
            'databaseURL' => env('FIREBASE_DATABASE_URL'),
            'projectId' => env('FIREBASE_PROJECT_ID'),
            'storageBucket' => env('FIREBASE_STORAGE_BUCKET'),
            'messagingSenderId' => env('FIREBASE_MESSAGING_SENDER_ID'),
            'appId' => env('FIREBASE_APP_ID'),
            'measurementId' => env('FIREBASE_MEASUREMENT_ID'),
        ];
    } catch (\Throwable $e) {
        $fc = ['apiKey' => null, 'authDomain' => null, 'databaseURL' => null, 'projectId' => null, 'storageBucket' => null, 'messagingSenderId' => null, 'appId' => null, 'measurementId' => null];
    }
    @endphp
    window.__FIREBASE_CONFIG__ = @json($fc);
    @php
        $firebaseDisabled = empty($fc['apiKey'] ?? null);
    @endphp
    window.FIREBASE_DISABLED = {{ $firebaseDisabled ? 'true' : 'false' }};
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
                'about' => $ud ? ($ud->user_about ?? '') : '',
                'facebook' => $ud ? ($ud->facebook ?? '') : '',
                'google' => $ud ? ($ud->google ?? '') : '',
                'twitter' => $ud ? ($ud->twitter ?? '') : '',
                'linkedin' => $ud ? ($ud->linkedin ?? '') : '',
                'youtube' => $ud ? ($ud->youtube ?? '') : '',
                'facebook_link' => $ud ? ($ud->facebook ?? '') : '',
                'google_link' => $ud ? ($ud->google ?? '') : '',
                'twitter_link' => $ud ? ($ud->twitter ?? '') : '',
                'linkedin_link' => $ud ? ($ud->linkedin ?? '') : '',
                'youtube_link' => $ud ? ($ud->youtube ?? '') : '',
            ]);
            $verifiedPlatforms = $u->socialAccounts()->where('oauth_verified', true)->pluck('platform')->toArray();
            $platformToKey = [ 'facebook' => 'facebook_link', 'x' => 'twitter_link', 'linkedin' => 'linkedin_link', 'youtube' => 'youtube_link', 'instagram' => 'instagram_link', 'kick' => 'kick_link', 'twitch' => 'twitch_link' ];
            $socialVerified = [];
            foreach ($platformToKey as $platform => $key) {
                $socialVerified[$key] = in_array($platform, $verifiedPlatforms);
            }
        } catch (\Throwable $e) {
            $laravelUserJson = 'null';
            $socialVerified = [];
        }
    @endphp
    window.LARAVEL_USER = {!! $laravelUserJson !!};
    window.LARAVEL_SOCIAL_VERIFIED = @json($socialVerified ?? []);
    @endif
    function capitalizeFirstLetter(val) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}
</script>
@if (!Route::is('login','signup','register.payment','signin'))
<!-- Populate profile from Laravel when Firebase is disabled -->
<script>
(function() {
    function setText(id, text) {
        var el = document.getElementById(id);
        if (el) el.innerText = text || '—';
    }
    function setImg(id, src) {
        var el = document.getElementById(id);
        if (el && el.tagName === 'IMG' && src) el.src = src;
    }
    function setInputValue(id, value) {
        var el = document.getElementById(id);
        if (el && value !== undefined && value !== null) el.value = value;
    }
    function applyLaravelProfile() {
        if (typeof window.LARAVEL_USER === 'undefined' || !window.LARAVEL_USER || !window.FIREBASE_DISABLED) return;
        var u = window.LARAVEL_USER;
        var fullName = (u.firstName || '') + ' ' + (u.lastName || '').trim() || u.full_name || 'No Name';
        var defaultImg = (typeof APP_URL !== 'undefined' ? APP_URL : '') + '/assets/img/profiles/avatar-03.jpg';
        if (defaultImg.indexOf('/') === 0) defaultImg = defaultImg.slice(1);
        if (!defaultImg.match(/^https?:\/\//)) defaultImg = (window.location.origin || '') + '/' + defaultImg.replace(/^\//,'');
        var imgUrl = u.profile_image || u.image || defaultImg;
        setText('profile-name', fullName);
        setText('profile-info-name', fullName);
        setText('profile-info-chat-name', fullName);
        setText('profile-info-email', u.email || '—');
        setText('profile-info-phone', u.mobile_number || '—');
        setText('profile-info-country', u.country || '—');
        setText('profile-info-about', u.about || '—');
        setText('profile-info-bio', u.about || '—');
        setText('profile-info-gender', u.gender || '—');
        setText('profile-info-join-date', u.created_at || '—');
        setText('profile-info-role', u.primary_role || '—');
        setText('profile-info-facebook', u.facebook_link || u.facebook || '—');
        setText('profile-info-twitter', u.twitter_link || u.twitter || '—');
        setText('profile-info-linkedin', u.linkedin_link || u.linkedin || '—');
        setText('profile-info-google', u.google_link || u.google || '—');
        setText('profile-info-youtube', u.youtube_link || u.youtube || '—');
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
        if (document.getElementById('user-id')) document.getElementById('user-id').innerText = 'Logged in as: ' + u.id;
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyLaravelProfile);
    } else {
        applyLaravelProfile();
    }
    setTimeout(applyLaravelProfile, 500);
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
        var ids = ['user_name','mobile_number','gender','dob','country','about','primary_role','other_role_text','facebook_link','instagram_link','twitter_link','linkedin_link','youtube_link','kick_link','twitch_link'];
        if (typeof IS_KYC_VERIFIED === 'undefined' || !IS_KYC_VERIFIED) {
            ids = ['firstName','lastName'].concat(ids);
        }
        ids.push('email');
        ids = ids.filter(function(id, i, a) {
            if (id === 'email' && (typeof IS_EMAIL_VERIFIED !== 'undefined' && IS_EMAIL_VERIFIED)) return false;
            return a.indexOf(id) === i;
        });
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
        var socialIds = ['facebook_link','instagram_link','twitter_link','linkedin_link','youtube_link','kick_link','twitch_link'];
        var verified = typeof window.LARAVEL_SOCIAL_VERIFIED !== 'undefined' ? window.LARAVEL_SOCIAL_VERIFIED : {};
        var labels = { facebook_link:'Facebook', instagram_link:'Instagram', twitter_link:'Twitter/X', linkedin_link:'LinkedIn', youtube_link:'YouTube', kick_link:'Kick', twitch_link:'Twitch' };
        var unverified = [];
        for (var i = 0; i < socialIds.length; i++) {
            var id = socialIds[i];
            var el = document.getElementById(id);
            if (el && el.value && String(el.value).trim() !== '' && !verified[id]) {
                unverified.push(labels[id] || id);
            }
        }
        if (unverified.length > 0) {
            if (btn && btn.classList) btn.classList.remove('disabled');
            var msg = 'You must verify your social profile before continuing. Connect and verify: ' + unverified.join(', ');
            if (errEl) { errEl.textContent = msg; errEl.classList.remove('d-none'); }
            if (typeof Toastify !== 'undefined') Toastify({ text: msg, duration: 4000, gravity: 'top', position: 'right', style: { background: '#dc3545' } }).showToast();
            return;
        }
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
@if (!Route::is('login','signup','register.payment'))
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
@endif
<!-- SPA Navigation -->
<script src="{{ asset('assets/js/spa-navigation.js') }}"></script>
@endif
