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
                                        @if($errors->any())
                                            <div class="alert alert-danger">
                                                <ul class="mb-0">
                                                    @foreach($errors->all() as $error)
                                                        <li>{{ $error }}</li>
                                                    @endforeach
                                                </ul>
                                            </div>
                                        @endif
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
                                                    <div class="input-icon mb-3 position-relative">
                                                        <input type="text" class="form-control @error('country') is-invalid @enderror" id="country" name="country" value="{{ old('country') }}" required>
                                                        <span class="input-icon-addon"><i class="ti ti-map-pin"></i></span>
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
                                            <button type="submit" id="submit_button" class="btn btn-primary w-100 justify-content-center">{{ __('Next Step') }} &rarr;</button>
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
<script>
document.addEventListener('DOMContentLoaded', function() {
    var primaryRole = document.getElementById('primary_role');
    var otherWrap = document.getElementById('other_role_wrap');
    if (primaryRole && otherWrap) {
        primaryRole.addEventListener('change', function() {
            otherWrap.style.display = this.value === 'other' ? 'block' : 'none';
        });
    }
});
</script>
@endsection
