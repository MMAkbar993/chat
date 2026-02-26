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
                            <h3>Reset Password</h3>
                            <p>Your new password must be different from previous used
                                passwords.</p>
                        </div>
                    </div>
                    <form action="{{ route('admin.reset-password-success') }}">
                        <div class="form-group">
                            <label class="form-label"> New Password <span>*</span></label>
                            <div class="pass-group" id="passwordInput">
                                <input type="password" class="form-control pass-input">
                                <span class="toggle-password fa-solid fa-eye"></span>
                            </div>
                            <div class="password-strength" id="passwordStrength">
                                <span id="poor"></span>
                                <span id="weak"></span>
                                <span id="strong"></span>
                                <span id="heavy"></span>
                            </div>
                            <div id="passwordInfo"></div>
                        </div>
                        <div class="form-group reset-group">
                            <label class="form-label">Confirm Password <span>*</span></label>
                            <div class="pass-group">
                                <input type="password" class="form-control pass-inputs">
                                <span class="toggle-passwords fa-solid fa-eye"></span>
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary w-100 btn-size justify-content-center">Save
                            Changes</button>
                    </form>
                </div>
            </div>
        </div>
    </div>
@endsection
