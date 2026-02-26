@extends('frontend.layout')

@section('content')
    <div class="container-fuild">
        <div class=" w-100 overflow-hidden position-relative flex-wrap d-block vh-100">
            <div class="row">
                <div class="col-lg-6 col-md-12 col-sm-12">
                    <div class="row justify-content-center align-items-center vh-100 overflow-auto flex-wrap login-bg1 ">
                        <div class="col-md-9 mx-auto p-4">
                            <form method="POST" id="login-form" action="{{ route('login') }}">
                                @csrf
                                <div>
                                    <div class=" mx-auto mb-5 text-center">
                                        <img id="company-logo" src="assets/img/full-logo.png" class="img-fluid"
                                            alt="Logo">
                                    </div>
                                    <div class="card">
                                        <div class="card-body">
                                            <div class=" mb-4">
                                                <h2 class="mb-2">{{ __('Welcome!') }}</h2>
                                                <p class="mb-0 fs-16">
                                                    {{ __('Sign in to see what you’ve missed.') }}</p>
                                            </div>
                                            <div class="mb-3 ">
                                                <label class="form-label">{{ __('Email') }}</label>
                                                <div class="input-icon mb-3 position-relative">
                                                    <input type="text" class="form-control validate-input" id="email"
                                                        name="email" value="{{ old('email') }}">
                                                    <span class="input-icon-addon">
                                                        <i class="ti ti-mail"></i>
                                                    </span>
                                                    <div class="invalid-feedback" id="email-error">
                                                        @error('email')
                                                            {{ $message }}
                                                        @enderror
                                                    </div>
                                                    <div class="valid-feedback"></div>
                                                </div>
                                                <label class="form-label">{{ __('Password') }}</label>
                                                <div class="input-icon ">
                                                    <input type="password"
                                                        class="pass-input form-control validate-input @if ($errors->has('password')) is-invalid @elseif(old('password')) is-valid @endif"
                                                        id="password" name="password" value="{{ old('password') }}">
                                                    <span class="ti toggle-password ti-eye-off"></span>
                                                    <div class="invalid-feedback" id="password-error">
                                                        @error('password')
                                                            {{ $message }}
                                                        @enderror
                                                    </div>
                                                    <div class="valid-feedback"></div>
                                                </div>
                                            </div>
                                            <div class="form-wrap form-wrap-checkbox mb-3">
                                                <div class="d-flex align-items-center">
                                                    <div class="form-check form-check-md mb-0">
                                                        <input class="form-check-input mt-0" type="checkbox"
                                                            id="rememberMe">
                                                    </div>
                                                    <p class=" mb-0 ">
                                                        {{ __('Remember Me') }}</p>
                                                </div>
                                                <div class="text-end ">
                                                    <a href="{{ route('forgot-password') }}" class="link-primary">{{ __('Forgot Password?') }}</a>
                                                </div>
                                            </div>
                                            <div class="mb-4">
                                                <button type="submit" id="submit_login"
                                                    class="btn btn-primary w-100 justify-content-center">{{ __('Sign In') }}</button>
                                            </div>

                                        </div>
                                    </div>
                                    <div class="mt-5 text-center">
                                        <p class="mb-0 text-gray-9">
                                            {{ __('Don’t have a account?') }} <a href="{{ route('signup') }}"
                                                class="link-primary">{{ __('Sign Up') }}</a>
                                        </p>
                                    </div>
                                </div>
                               
                            </form>
                        </div>

                    </div>
                </div>
                <div class="col-lg-6 p-0">
                    <div
                        class="d-lg-flex align-items-center justify-content-center position-relative d-lg-block d-none flex-wrap vh-100 overflowy-auto login-bg2 ">
                        <div class="floating-bg">
                            <img src="assets/img/bg/circle-1.png" alt="Img">
                            <img src="assets/img/bg/circle-2.png" alt="Img">
                            <img src="assets/img/bg/emoji-01.svg" alt="Img">
                            <img src="assets/img/bg/emoji-02.svg" alt="Img">
                            <img src="assets/img/bg/emoji-03.svg" alt="Img">
                            <img src="assets/img/bg/emoji-04.svg" alt="Img">
                            <img src="assets/img/bg/right-arrow-01.svg" alt="Img">
                            <img src="assets/img/bg/right-arrow-02.svg" alt="Img">

                        </div>
                        <div class="floating-avatar ">
                            <span class="avatar avatar-xl avatar-rounded border border-white">
                                <img src="assets/img/profiles/avatar-12.jpg" alt="img">
                            </span>
                            <span class="avatar avatar-xl avatar-rounded border border-white">
                                <img src="assets/img/profiles/avatar-01.jpg" alt="img">
                            </span>
                            <span class="avatar avatar-xl avatar-rounded border border-white">
                                <img src="assets/img/profiles/avatar-02.jpg" alt="img">
                            </span>
                            <span class="avatar avatar-xl avatar-rounded border border-white">
                                <img src="assets/img/profiles/avatar-05.jpg" alt="img">
                            </span>
                        </div>
                        <div class="text-center">
                            <img src="assets/img/bg/login-bg-1.svg" class="login-img" alt="Img">
                        </div>
                    </div>
                </div>

            </div>



        </div>
    </div>
    <script type="module" src="assets/js/firebase/firebaseLogin.js" crossorigin="anonymous"></script>
@endsection
