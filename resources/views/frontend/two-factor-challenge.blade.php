@extends('frontend.layout')

@section('content')
<div class="container-fuild">
    <div class="w-100 overflow-hidden position-relative flex-wrap d-block vh-100">
        <div class="row">
            <div class="col-lg-6 col-md-12 col-sm-12">
                <div class="row justify-content-center align-items-center vh-100 overflow-auto flex-wrap login-bg1">
                    <div class="col-md-9 mx-auto p-4">
                        <div class="mx-auto mb-5 text-center">
                            <img id="company-logo" src="{{ asset('assets/img/full-logo.png') }}" class="img-fluid" alt="Logo">
                        </div>
                        <div class="card">
                            <div class="card-body">
                                <div class="mb-4">
                                    <h2 class="mb-2">{{ __('Two-Factor Authentication') }}</h2>
                                    <p class="mb-0 fs-16">{{ __('Enter the 6-digit code from your authenticator app to continue.') }}</p>
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
                                <form method="POST" action="{{ route('2fa.verify-challenge') }}">
                                    @csrf
                                    <div class="mb-3">
                                        <label class="form-label">{{ __('Verification Code') }} <span class="text-danger">*</span></label>
                                        <input type="text" class="form-control text-center fs-20 @error('code') is-invalid @enderror" name="code" placeholder="000000" maxlength="6" inputmode="numeric" pattern="[0-9]{6}" autofocus required>
                                        @error('code')<div class="invalid-feedback">{{ $message }}</div>@enderror
                                    </div>
                                    <button type="submit" class="btn btn-primary w-100 justify-content-center">
                                        <i class="ti ti-shield-check me-1"></i> {{ __('Verify') }}
                                    </button>
                                </form>
                                <div class="mt-3 text-center">
                                    <a href="{{ route('logout') }}" class="text-muted">{{ __('Sign out') }}</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-lg-6 p-0">
                <div class="d-lg-flex align-items-center justify-content-center position-relative d-lg-block d-none flex-wrap vh-100 overflowy-auto login-bg2">
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
                    <div class="text-center">
                        <img src="{{ asset('assets/img/bg/login-bg-1.svg') }}" class="login-img" alt="Img">
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
