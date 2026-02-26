@extends('admin.layout')

@section('content')
    <div class="container-fluid">
        <div class="login-wrapper">
            <header class="logo-header">
                <a href="{{ route('admin.index') }}" class="logo-brand">
                    <img src="{{ asset('assets/img/full-logo.png') }}" alt="Logo" class="img-fluid logo-dark">
                </a>
            </header>
            <div class="login-inbox">
                <div class="log-auth">
                    <div class="login-auth-wrap">
                        <div class="login-content-head">
                            <h3>Forgot Password</h3>
                            <p>Enter your email to get a password reset link</p>
                        </div>
                    </div>
                    <form id="forgot-password-admin-form">
                        <div class="form-group">
                            <label class="form-label">Email <span>*</span></label>
                            <input class="form-control validate-input" id="email" name="email" type="text">
                            <div class="invalid-feedback" id="emailError">
                                @error('email')
                                    {{ $message }}
                                @enderror
                            </div>
                            <div class="valid-feedback"></div>
                        </div>
                        <button type="submit" class="btn btn-primary w-100 btn-size justify-content-center mb-3" id="send-admin-email">Reset
                            Password</button>
                        <div class="bottom-text">
                            <p>Remember your password? <a href="{{ route('admin.login') }}">Login</a></p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
    <script type="module" src="{{ asset('assets/js/firebase/firebaseAdminForgotPassword.js') }}" crossorigin="anonymous"></script>
@endsection
<script>
    const APP_URL = "{{ env('APP_URL') }}";
</script>