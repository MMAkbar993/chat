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
                    <div class="success-pass d-flex align-items-center justify-content-center mb-2">
                        <img src="{{ asset('assets/img/success.png') }}" alt="Success" class="img-fluid">
                    </div>
                    <div class="login-auth-wrap">
                        <div class="login-content-head">
                            <h3>Reset Password Success</h3>
                            <p class="text-center">Your new password has been successfully saved.<br>
                                Now you can login with your new password</p>
                        </div>
                    </div>
                    <a href="{{ route('admin.login') }}" class="btn btn-primary w-100 btn-size justify-content-center">Login</a>
                </div>
            </div>
        </div>
    </div>
@endsection
