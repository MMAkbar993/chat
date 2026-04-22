@extends('frontend.layout')

@section('content')
<div class="container-fuild">
    <div class=" w-100 overflow-hidden position-relative flex-wrap d-block vh-100">
        <div class="row">
            <div class="col-lg-6 col-md-12 col-sm-12">
                <div class="row justify-content-center align-items-center vh-100 overflow-auto flex-wrap login-bg1 ">
                    <div class="col-md-9 mx-auto p-4">
                        <form id="registrationForm" method="POST" action="{{ route('register') }}">
                            @csrf
                            <div>
                                <div class=" mx-auto mb-5 text-center">
                                    <img id="company-logo" src="{{ asset('assets/img/full-logo.png') }}" class="img-fluid" alt="Logo">
                                </div>
                                <div class="card">
                                    <div class="card-body">
                                        <div class=" mb-4">
                                            <h2 class="mb-2">{{ __('Register') }}</h2>
                                            <p class="mb-0 fs-16">{{ __('Personal Information & Primary Role') }}</p>
                                        </div>
                                        <div id="server-errors">
                                            @if($errors->any())
                                                <div class="alert alert-danger">
                                                    <ul class="mb-0">
                                                        @foreach($errors->all() as $error)
                                                            <li>{{ $error }}</li>
                                                        @endforeach
                                                    </ul>
                                                </div>
                                            @endif
                                        </div>
                                        <div class="row">
                                            <div class="col-md-12">
                                                <div class="mb-3">
                                                    <label class="form-label">{{ __('Full Name (Legal name only)') }} <span class="text-danger">*</span></label>
                                                    <div class="input-icon mb-3 position-relative">
                                                        <input type="text" class="form-control @error('full_name') is-invalid @enderror" id="full_name" name="full_name" value="{{ old('full_name') }}" required>
                                                        <span class="input-icon-addon"><i class="ti ti-user"></i></span>
                                                        @error('full_name')<div class="invalid-feedback">{{ $message }}</div>@enderror
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="col-md-12">
                                                <div class="mb-3">
                                                    <label class="form-label">{{ __('Username') }} <span class="text-danger">*</span></label>
                                                    <div class="input-icon mb-3 position-relative">
                                                        <input type="text" class="form-control @error('user_name') is-invalid @enderror" id="user_name" name="user_name" value="{{ old('user_name') }}" required>
                                                        <span class="input-icon-addon"><i class="ti ti-user"></i></span>
                                                        @error('user_name')<div class="invalid-feedback">{{ $message }}</div>@enderror
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="col-md-12">
                                                <div class="mb-3">
                                                    <label class="form-label">{{ __('Country') }} <span class="text-danger">*</span></label>
                                                    <div class="mb-3 position-relative">
                                                        <select class="form-control select2-country @error('country') is-invalid @enderror" id="country" name="country" required>
                                                            <option value="">{{ __('Select Country') }}</option>
                                                            @foreach(config('countries', []) as $code => $name)
                                                                <option value="{{ $name }}" data-code="{{ strtolower($code) }}" {{ old('country') == $name ? 'selected' : '' }}>{{ $name }}</option>
                                                            @endforeach
                                                        </select>
                                                        @error('country')<div class="invalid-feedback">{{ $message }}</div>@enderror
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="col-md-12">
                                                <div class="mb-3">
                                                    <label class="form-label">{{ __('Email Address') }} <span class="text-danger">*</span></label>
                                                    <div class="input-icon mb-3 position-relative">
                                                        <input type="email" class="form-control @error('email') is-invalid @enderror" id="email" name="email" value="{{ old('email') }}" required>
                                                        <span class="input-icon-addon"><i class="ti ti-mail"></i></span>
                                                        @error('email')<div class="invalid-feedback">{{ $message }}</div>@enderror
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="col-md-12">
                                                <div class="mb-3">
                                                    <label class="form-label">{{ __('Primary Role') }} <span class="text-danger">*</span></label>
                                                    <select class="form-select @error('primary_role') is-invalid @enderror" id="primary_role" name="primary_role" required>
                                                        <option value="">{{ __('Select role') }}</option>
                                                        @foreach($primaryRoles ?? [] as $key => $label)
                                                            <option value="{{ $key }}" {{ old('primary_role') == $key ? 'selected' : '' }}>{{ $label }}</option>
                                                        @endforeach
                                                    </select>
                                                    @error('primary_role')<div class="invalid-feedback">{{ $message }}</div>@enderror
                                                </div>
                                            </div>
                                            <div class="col-md-12" id="other_role_wrap" style="{{ old('primary_role') === 'other' ? '' : 'display:none;' }}">
                                                <div class="mb-3">
                                                    <label class="form-label">{{ __('Other (please specify)') }}</label>
                                                    <input type="text" class="form-control @error('other_role_text') is-invalid @enderror" id="other_role_text" name="other_role_text" value="{{ old('other_role_text') }}" placeholder="{{ __('Describe your role') }}">
                                                    @error('other_role_text')<div class="invalid-feedback">{{ $message }}</div>@enderror
                                                </div>
                                            </div>
                                            <div class="col-md-12">
                                                <div class="mb-3">
                                                    <label class="form-label">{{ __('Phone Number') }}</label>
                                                    <div class="input-icon mb-3 position-relative">
                                                        <input type="text" class="form-control @error('mobile_number') is-invalid @enderror" id="mobile_number" name="mobile_number" value="{{ old('mobile_number') }}" maxlength="21">
                                                        <span class="input-icon-addon"><i class="ti ti-phone"></i></span>
                                                        @error('mobile_number')<div class="invalid-feedback">{{ $message }}</div>@enderror
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="col-md-12">
                                                <div class="mb-3">
                                                    <label class="form-label">{{ __('Password') }} <span class="text-danger">*</span></label>
                                                    <div class="input-icon">
                                                        <input type="password" class="form-control @error('password') is-invalid @enderror" id="password" name="password" required>
                                                        <span class="ti toggle-password ti-eye-off"></span>
                                                        @error('password')<div class="invalid-feedback">{{ $message }}</div>@enderror
                                                    </div>
                                                    <small class="text-muted">{{ __('Min 8 characters') }}</small>
                                                </div>
                                            </div>
                                            <div class="col-md-12">
                                                <div class="mb-3">
                                                    <label class="form-label">{{ __('Confirm Password') }} <span class="text-danger">*</span></label>
                                                    <div class="input-icon">
                                                        <input type="password" class="form-control" id="password_confirmation" name="password_confirmation" required>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="form-wrap form-wrap-checkbox mb-3 d-block">
                                            <div class="d-flex align-items-center">
                                                <div class="form-check form-check-md mb-0">
                                                    <input class="form-check-input mt-0 @error('terms') is-invalid @enderror" type="checkbox" id="terms" name="terms" value="1" {{ old('terms') ? 'checked' : '' }}>
                                                </div>
                                                <p class="mb-0">
                                                    {{ __('I agree to') }}
                                                    <a href="#" target="_blank" class="link-primary">{{ __('Terms & Conditions') }}</a>
                                                </p>
                                            </div>
                                            @error('terms')<div class="invalid-feedback d-block">{{ $message }}</div>@enderror
                                        </div>
                                        <p class="small text-muted">{{ __('2FA can be set up under Settings once logged in.') }}</p>
                                        <div class="mb-4">
                                            <button type="submit" id="submit_button" class="btn btn-primary w-100 justify-content-center">
                                                <span class="btn-text">{{ __('Next Step (Payment Details)') }} &rarr;</span>
                                                <span class="btn-spinner d-none"><span class="spinner-border spinner-border-sm me-2"></span>{{ __('Registering...') }}</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div class="mt-5 text-center">
                                    <p class="mb-0 text-gray-9">{{ __('Already have an account?') }} <a href="{{ route('signin') }}" class="link-primary">{{ __('Sign In') }}</a></p>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <div class="col-lg-6 p-0">
                <div class="d-lg-flex align-items-center justify-content-center position-relative d-lg-block d-none flex-wrap vh-100 overflowy-auto login-bg2 ">
                    <div class="floating-bg">
                        <img src="{{ asset('assets/img/bg/circle-1.png') }}" alt="Img">
                        <img src="{{ asset('assets/img/bg/circle-2.png') }}" alt="Img">
                        <img src="{{ asset('assets/img/bg/emoji-01.svg') }}" alt="Img">
                        <img src="{{ asset('assets/img/bg/emoji-02.svg') }}" alt="Img">
                        <img src="{{ asset('assets/img/bg/emoji-03.svg') }}" alt="Img">
                        <img src="{{ asset('assets/img/bg/emoji-04.svg') }}" alt="Img">
                        <img src="{{ asset('assets/img/bg/right-arrow-01.svg') }}" alt="Img">
                        <img src="{{ asset('assets/img/bg/right-arrow-02.svg') }}" alt="Img">
                    </div>
                    <div class="floating-avatar ">
                        <span class="avatar avatar-xl avatar-rounded border border-white">
                            <img src="{{ asset('assets/img/profiles/avatar-12.jpg') }}" alt="img">
                        </span>
                        <span class="avatar avatar-xl avatar-rounded border border-white">
                            <img src="{{ asset('assets/img/profiles/avatar-01.jpg') }}" alt="img">
                        </span>
                        <span class="avatar avatar-xl avatar-rounded border border-white">
                            <img src="{{ asset('assets/img/profiles/avatar-02.jpg') }}" alt="img">
                        </span>
                        <span class="avatar avatar-xl avatar-rounded border border-white">
                            <img src="{{ asset('assets/img/profiles/avatar-05.jpg') }}" alt="img">
                        </span>
                    </div>
                    <div class="text-center">
                        <img src="{{ asset('assets/img/bg/login-bg-1.svg') }}" class="login-img" alt="Img">
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

{{-- ===== Onboarding Overlay (Payment + KYC flow) ===== --}}
<div id="onboarding-overlay" class="onboarding-overlay d-none">
    <div class="onboarding-card">
        {{-- Step indicator --}}
        <div class="onboarding-steps mb-4">
            <div class="step-item" id="step-payment">
                <span class="step-num">1</span>
                <span class="step-label">{{ __('Payment') }}</span>
            </div>
            <div class="step-divider"></div>
            <div class="step-item" id="step-kyc">
                <span class="step-num">2</span>
                <span class="step-label">{{ __('KYC Verification') }}</span>
            </div>
        </div>

        {{-- ===== STEP 1: Plan Selection + Payment ===== --}}
        <div id="payment-section">
            {{-- Plan selection --}}
            <div id="payment-plan-select" class="text-center">
                <h4 class="mb-2">{{ __('Choose Your Plan') }}</h4>
                <div class="alert alert-info py-2 px-3 d-inline-block mb-4" style="font-size:14px;">
                    <i class="ti ti-info-circle me-1"></i>{{ __("Don't worry — you won't be charged until your identity is verified.") }}
                </div>
                <div class="row g-3 mb-4" id="plan-cards"></div>
                <button type="button" id="proceed-to-stripe-btn" class="btn btn-primary w-100" disabled>
                    <i class="ti ti-lock me-1"></i>
                    <span class="btn-text">{{ __('Enter Payment Details') }}</span>
                </button>
            </div>

            {{-- Waiting for Stripe popup --}}
            <div id="payment-pending" class="text-center d-none">
                <div class="mb-3">
                    <i class="ti ti-credit-card onboarding-icon text-primary"></i>
                </div>
                <h4 class="mb-2">{{ __('Enter Payment Details') }}</h4>
                <p class="text-muted mb-3">{{ __('Complete your card details in the secure payment window.') }}</p>
                <div class="alert alert-info py-2 px-3 mb-3" style="font-size:14px;">
                    <i class="ti ti-info-circle me-1"></i>{{ __("You won't be charged until your KYC is approved.") }}
                </div>
                <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                <span class="text-muted">{{ __('Waiting for payment details...') }}</span>
                <div class="mt-3">
                    <button type="button" id="open-payment-btn" class="btn btn-outline-primary btn-sm">
                        <i class="ti ti-external-link me-1"></i>{{ __('Re-open payment window') }}
                    </button>
                </div>
            </div>

            {{-- Payment details saved --}}
            <div id="payment-saved" class="text-center d-none">
                <div class="mb-3">
                    <i class="ti ti-circle-check onboarding-icon text-success"></i>
                </div>
                <h4 class="mb-2 text-success">{{ __('Payment Details Saved!') }}</h4>
                <p class="text-muted mb-0">{{ __('Your card is on file. Proceeding to identity verification...') }}</p>
            </div>

            {{-- Payment cancelled --}}
            <div id="payment-cancelled" class="text-center d-none">
                <div class="mb-3">
                    <i class="ti ti-alert-circle onboarding-icon text-warning"></i>
                </div>
                <h4 class="mb-2">{{ __('Payment Cancelled') }}</h4>
                <p class="text-muted mb-3">{{ __("No worries! You can try again whenever you're ready.") }}</p>
                <button type="button" id="retry-payment-btn" class="btn btn-primary">
                    <i class="ti ti-refresh me-1"></i>{{ __('Try Again') }}
                </button>
            </div>
        </div>

        {{-- ===== STEP 2: KYC Verification ===== --}}
        <div id="kyc-section" class="d-none">
            <div id="kyc-pending" class="text-center">
                <div class="mb-3">
                    <i class="ti ti-shield-check onboarding-icon text-primary"></i>
                </div>
                <h4 class="mb-2">{{ __('Identity Verification') }}</h4>
                <p class="text-muted mb-4">{{ __('Complete your identity verification. A new window will open with our verification partner.') }}</p>
                <ul class="list-unstyled text-start mb-4 mx-auto" style="max-width: 320px;">
                    <li class="mb-2"><i class="ti ti-check text-success me-2"></i>{{ __('Government-issued photo ID') }}</li>
                    <li class="mb-2"><i class="ti ti-check text-success me-2"></i>{{ __('Selfie for face matching') }}</li>
                    <li class="mb-2"><i class="ti ti-check text-success me-2"></i>{{ __('Process takes 2-5 minutes') }}</li>
                </ul>
                <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                <span class="text-muted">{{ __('Waiting for verification to complete...') }}</span>
                <div class="mt-3">
                    <button type="button" id="open-kyc-btn" class="btn btn-outline-primary btn-sm">
                        <i class="ti ti-external-link me-1"></i>{{ __('Re-open verification window') }}
                    </button>
                </div>
            </div>

            <div id="kyc-verified" class="text-center d-none">
                <div class="mb-3">
                    <i class="ti ti-circle-check onboarding-icon text-success"></i>
                </div>
                <h4 class="mb-2 text-success">{{ __('Identity Verified!') }}</h4>
                <p class="text-muted mb-0">{{ __('Your card has been charged and your account is now active. Redirecting...') }}</p>
            </div>
        </div>

        <p class="text-muted small text-center mt-4 mb-0">
            <i class="ti ti-lock me-1"></i>{{ __('Your data is securely processed') }}
        </p>
    </div>
</div>

<style>
.onboarding-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
}
.onboarding-overlay.d-none { display: none !important; }
.onboarding-card {
    background: #fff;
    border-radius: 16px;
    padding: 40px 36px;
    max-width: 520px;
    width: 100%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
    animation: slideUp 0.3s ease;
    max-height: 90vh;
    overflow-y: auto;
}
@keyframes slideUp {
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
}
.onboarding-steps {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
}
.step-item {
    display: flex;
    align-items: center;
    gap: 8px;
    opacity: 0.4;
    transition: opacity 0.3s;
}
.step-item.active { opacity: 1; }
.step-item.completed { opacity: 0.7; }
.step-item.completed .step-num {
    background: #198754;
    color: #fff;
}
.step-num {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #e9ecef;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 600;
    transition: all 0.3s;
}
.step-item.active .step-num {
    background: var(--bs-primary, #6c5ce7);
    color: #fff;
}
.step-label { font-size: 14px; font-weight: 500; }
.step-divider { width: 40px; height: 2px; background: #dee2e6; }
.onboarding-icon { font-size: 56px; }
.plan-card-choice {
    border: 2px solid #dee2e6;
    border-radius: 12px;
    padding: 20px 16px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: center;
}
.plan-card-choice:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.plan-card-choice.selected {
    border-color: var(--bs-primary, #6c5ce7) !important;
    box-shadow: 0 0 0 1px var(--bs-primary, #6c5ce7);
}
</style>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // === Role "other" toggle ===
    var primaryRole = document.getElementById('primary_role');
    var otherWrap = document.getElementById('other_role_wrap');
    if (primaryRole && otherWrap) {
        primaryRole.addEventListener('change', function() {
            otherWrap.style.display = this.value === 'other' ? 'block' : 'none';
        });
    }

    // === Select2 for country ===
    if (typeof jQuery !== 'undefined' && $.fn.select2) {
        var flagFallback = { aq: 'gb', eh: 'ma', eu: 'fr', 'gb-eng': 'gb', 'gb-nir': 'gb', 'gb-sct': 'gb', 'gb-wls': 'gb', hm: 'au', mf: 'fr', sj: 'no' };
        function formatCountry(state) {
            if (!state.id) return state.text;
            var code = $(state.element).data('code');
            if (!code) return state.text;
            var flagCode = flagFallback[code] || code;
            return $('<span><i class="flag flag-' + flagCode + ' me-2"></i> ' + state.text + '</span>');
        }
        $('.select2-country').select2({ templateResult: formatCountry, templateSelection: formatCountry, width: '100%' });
    }

    // ===== State =====
    var csrfToken = document.querySelector('meta[name="csrf-token"]').content;
    var stripePopup = null;
    var kycPopup = null;
    var pollInterval = null;
    var selectedPlan = 'monthly';
    var stripeCheckoutUrl = '';
    var plansData = {};

    var overlay = document.getElementById('onboarding-overlay');
    var stepPayment = document.getElementById('step-payment');
    var stepKyc = document.getElementById('step-kyc');

    function showOverlay() { overlay.classList.remove('d-none'); }
    function setActiveStep(step) {
        stepPayment.classList.remove('active', 'completed');
        stepKyc.classList.remove('active', 'completed');
        if (step === 'payment') {
            stepPayment.classList.add('active');
        } else if (step === 'kyc') {
            stepPayment.classList.add('completed');
            stepKyc.classList.add('active');
        } else if (step === 'done') {
            stepPayment.classList.add('completed');
            stepKyc.classList.add('completed');
        }
    }

    function showSection(sectionId) {
        ['payment-plan-select','payment-pending','payment-saved','payment-cancelled'].forEach(function(id) {
            document.getElementById(id).classList.add('d-none');
        });
        document.getElementById(sectionId).classList.remove('d-none');
    }

    // === Build plan cards dynamically ===
    function renderPlanCards(plans) {
        plansData = plans;
        var container = document.getElementById('plan-cards');
        container.innerHTML = '';
        var first = true;
        for (var key in plans) {
            var p = plans[key];
            var col = document.createElement('div');
            col.className = 'col-sm-6';
            var badge = p.badge ? '<span class="badge bg-success mb-2">' + p.badge + '</span>' : '<span class="badge bg-transparent mb-2">&nbsp;</span>';
            col.innerHTML = '<div class="plan-card-choice' + (first ? ' selected' : '') + '" data-plan="' + key + '">'
                + badge
                + '<h5 class="mb-1">' + p.label + '</h5>'
                + '<div class="my-2"><span class="fs-4 fw-bold">&euro;' + p.amount + '</span><span class="text-muted"> / ' + p.interval + '</span></div>'
                + '<p class="text-muted small mb-0">Auto-renewal. Cancel anytime.</p>'
                + '</div>';
            container.appendChild(col);
            if (first) { selectedPlan = key; first = false; }
        }
        document.getElementById('proceed-to-stripe-btn').disabled = false;

        container.querySelectorAll('.plan-card-choice').forEach(function(card) {
            card.addEventListener('click', function() {
                container.querySelectorAll('.plan-card-choice').forEach(function(c) { c.classList.remove('selected'); });
                card.classList.add('selected');
                selectedPlan = card.dataset.plan;
            });
        });
    }

    // === AJAX Registration ===
    document.getElementById('registrationForm').addEventListener('submit', function(e) {
        e.preventDefault();
        var form = this;
        var btn = document.getElementById('submit_button');
        btn.querySelector('.btn-text').classList.add('d-none');
        btn.querySelector('.btn-spinner').classList.remove('d-none');
        btn.disabled = true;

        document.getElementById('server-errors').innerHTML = '';
        form.querySelectorAll('.is-invalid').forEach(function(el) { el.classList.remove('is-invalid'); });

        fetch(form.action, {
            method: 'POST',
            headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json', 'X-CSRF-TOKEN': csrfToken },
            body: new FormData(form)
        })
        .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, status: r.status, data: d }; }); })
        .then(function(result) {
            btn.querySelector('.btn-text').classList.remove('d-none');
            btn.querySelector('.btn-spinner').classList.add('d-none');
            btn.disabled = false;

            if (!result.ok) {
                if (result.data.errors) {
                    var html = '<div class="alert alert-danger"><ul class="mb-0">';
                    for (var field in result.data.errors) {
                        result.data.errors[field].forEach(function(msg) { html += '<li>' + msg + '</li>'; });
                        var input = form.querySelector('[name="' + field + '"]');
                        if (input) input.classList.add('is-invalid');
                    }
                    html += '</ul></div>';
                    document.getElementById('server-errors').innerHTML = html;
                } else if (result.data.message) {
                    document.getElementById('server-errors').innerHTML = '<div class="alert alert-danger">' + result.data.message + '</div>';
                }
                return;
            }

            // Registration success → show overlay with plan selection
            if (result.data.plans) {
                renderPlanCards(result.data.plans);
            }
            showOverlay();
            setActiveStep('payment');
        })
        .catch(function() {
            btn.querySelector('.btn-text').classList.remove('d-none');
            btn.querySelector('.btn-spinner').classList.add('d-none');
            btn.disabled = false;
            document.getElementById('server-errors').innerHTML = '<div class="alert alert-danger">An unexpected error occurred. Please try again.</div>';
        });
    });

    // === Proceed to Stripe (setup mode) ===
    document.getElementById('proceed-to-stripe-btn').addEventListener('click', function() {
        initiateStripeSetup();
    });

    function initiateStripeSetup() {
        showSection('payment-pending');

        fetch('{{ route("stripe.checkout") }}', {
            method: 'POST',
            headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken },
            body: JSON.stringify({ plan: selectedPlan, popup: true })
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (data.checkout_url) {
                stripeCheckoutUrl = data.checkout_url;
                openStripePopup(data.checkout_url);
            } else {
                showSection('payment-plan-select');
                alert(data.message || 'Could not start payment. Please try again.');
            }
        })
        .catch(function() {
            showSection('payment-plan-select');
            alert('Payment system error. Please try again.');
        });
    }

    function openStripePopup(url) {
        if (stripePopup && !stripePopup.closed) stripePopup.close();
        var w = 600, h = 700;
        var left = (screen.width - w) / 2, top = (screen.height - h) / 2;
        stripePopup = window.open(url, 'stripe_payment', 'width=' + w + ',height=' + h + ',left=' + left + ',top=' + top + ',scrollbars=yes');
    }

    document.getElementById('open-payment-btn').addEventListener('click', function() {
        if (stripeCheckoutUrl) openStripePopup(stripeCheckoutUrl);
        else initiateStripeSetup();
    });

    document.getElementById('retry-payment-btn').addEventListener('click', function() {
        stripeCheckoutUrl = '';
        showSection('payment-plan-select');
    });

    // === Listen for Stripe and KYC popup messages ===
    window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'stripe-success') {
            onPaymentDetailsSaved();
        } else if (event.data && event.data.type === 'stripe-cancelled') {
            onPaymentCancelled();
        } else if (event.data && event.data.type === 'kyc-approved') {
            onKycApproved();
        }
    });

    function onPaymentDetailsSaved() {
        if (stripePopup && !stripePopup.closed) stripePopup.close();
        showSection('payment-saved');

        setTimeout(function() {
            startKycStep();
        }, 1500);
    }

    function onPaymentCancelled() {
        if (pollInterval) clearInterval(pollInterval);
        showSection('payment-cancelled');
    }

    // === KYC Step ===
    function startKycStep() {
        setActiveStep('kyc');
        document.getElementById('payment-section').classList.add('d-none');
        document.getElementById('kyc-section').classList.remove('d-none');
        document.getElementById('kyc-pending').classList.remove('d-none');
        document.getElementById('kyc-verified').classList.add('d-none');

        // Create Didit session
        fetch('{{ route("didit.create-session") }}', {
            method: 'POST',
            headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json', 'X-CSRF-TOKEN': csrfToken }
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (data.kyc_auto_approved) {
                // Test mode: KYC auto-approved (and subscription may already be created)
                onKycApproved();
            } else if (data.kyc_url) {
                openKycPopup(data.kyc_url);
                startStatusPolling();
            } else {
                alert(data.message || 'Unable to start verification.');
            }
        })
        .catch(function() {
            alert('Unable to start identity verification. Please try again.');
        });
    }

    function openKycPopup(url) {
        if (kycPopup && !kycPopup.closed) kycPopup.close();
        var w = 700, h = 800;
        var left = (screen.width - w) / 2, top = (screen.height - h) / 2;
        kycPopup = window.open(url, 'kyc_verification', 'width=' + w + ',height=' + h + ',left=' + left + ',top=' + top + ',scrollbars=yes');
    }

    document.getElementById('open-kyc-btn').addEventListener('click', function() {
        fetch('{{ route("didit.create-session") }}', {
            method: 'POST',
            headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json', 'X-CSRF-TOKEN': csrfToken }
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (data.kyc_url) openKycPopup(data.kyc_url);
            else if (data.kyc_auto_approved) onKycApproved();
        })
        .catch(function() {});
    });

    function startStatusPolling() {
        if (pollInterval) clearInterval(pollInterval);
        pollInterval = setInterval(function() {
            fetch('{{ route("registration.status") }}', {
                headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
            })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.subscription_status === 'active') {
                    clearInterval(pollInterval);
                    onKycApproved();
                } else if (data.kyc_verified && data.subscription_status !== 'active') {
                    // KYC done but subscription creation might be in progress
                    document.getElementById('kyc-pending').querySelector('.text-muted:last-of-type')
                        && (document.getElementById('kyc-pending').querySelector('span.text-muted').textContent = '{{ __("Verified! Processing your subscription...") }}');
                }
            })
            .catch(function() {});
        }, 3000);
    }

    function onKycApproved() {
        if (pollInterval) clearInterval(pollInterval);
        if (kycPopup && !kycPopup.closed) kycPopup.close();

        document.getElementById('kyc-pending').classList.add('d-none');
        document.getElementById('kyc-verified').classList.remove('d-none');
        setActiveStep('done');

        window.location.href = '{{ route("signin") }}';
    }
});
</script>
@endsection
