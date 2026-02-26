@extends('admin.layout')

@section('content')
<div class="container-fluid">
    <div class="login-wrapper">
        <header class="logo-header">
            <a href="#" class="logo-brand">
                <img id="company-logo" src="{{ asset('assets/img/full-logo.png') }}" alt="Logo" class="img-fluid logo-dark">
            </a>
        </header>
        <div class="login-inbox admin-login">
            <div class="log-auth">
                <div class="login-auth-wrap">
                    <div class="login-content-head">
                        <h3>Login</h3>
                    </div>
                </div>
                <form id="loginForm">
                    <div class="form-group">
                        <label class="form-label">Email <span>*</span></label>
                        <div class="input-icon mb-3 position-relative">
                            <input type="email" class="form-control validate-input email-icon" id="email" name="email">
                            <span class="input-icon-addon-admin">
                                <i class="ti ti-mail"></i>
                            </span>
                            <div class="invalid-feedback" id="email-error">
                                @error('email')
                                {{ $message }}
                                @enderror
                            </div>
                            <div class="valid-feedback"></div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Password <span>*</span></label>
                        <div class="pass-group">

                            <input type="password" class="pass-input form-control validate-input pwd-bg-img" id="password" name="password">
                            <span
                                class="ti toggle-password ti-eye-off icon-left  pwd-align"></span>
                            <div class="invalid-feedback" id="password-error">
                                @error('password')
                                {{ $message }}
                                @enderror
                            </div>
                            <div class="valid-feedback"></div>

                        </div>
                    </div>
                    <div class="form-group form-remember d-flex align-items-center justify-content-between">
                        <div class="form-check d-flex align-items-center justify-content-start ps-0">
                            <label class="custom-check mt-0 mb-0">
                                <span class="remember-me">Remember Me</span>
                                <input type="checkbox" name="remeber" id="rememberMe">
                                <span class="checkmark"></span>
                            </label>
                        </div>
                        <span class="forget-pass">
                            <a href="{{ route('admin.forgot-password') }}">
                                Forgot Password?
                            </a>
                        </span>
                    </div>
                    <button type="submit" class="btn btn-primary w-100 btn-size justify-content-center" id="submit_login">Login</button>
                    
                </form>
                <div id="errorMessage" style="color: red;"></div>
            </div>
        </div>
    </div>
</div>
<script type="module" src="{{ asset('assets/js/firebase/firebaseAdminLogin.js') }}" crossorigin="anonymous"></script>
@endsection