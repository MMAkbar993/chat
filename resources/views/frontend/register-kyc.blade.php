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
                                    <h2 class="mb-2">{{ __('Step 3: Identity Verification') }}</h2>
                                    <p class="mb-0 fs-16">{{ __('Verify your identity to gain full access to the platform.') }}</p>
                                </div>
                                @if(session('success'))
                                    <div class="alert alert-success">{{ session('success') }}</div>
                                @endif
                                @if($errors->any())
                                    <div class="alert alert-danger">
                                        <ul class="mb-0">
                                            @foreach($errors->all() as $error)
                                                <li>{{ $error }}</li>
                                            @endforeach
                                        </ul>
                                    </div>
                                @endif

                                @if($kycStatus === 'success')
                                    <div class="alert alert-success">
                                        <i class="ti ti-shield-check me-1"></i>
                                        {{ __('Verification submitted successfully! We will process it shortly. You will be notified once approved.') }}
                                    </div>
                                    <div class="mt-3">
                                        <a href="{{ route('signin') }}" class="btn btn-primary w-100 justify-content-center">{{ __('Go to Sign In') }}</a>
                                    </div>
                                @elseif($kycStatus === 'error' || $kycStatus === 'unverified')
                                    <div class="alert alert-warning">
                                        <i class="ti ti-alert-triangle me-1"></i>
                                        {{ __('Verification was not completed. Please try again.') }}
                                    </div>
                                    <form method="POST" action="{{ route('idenfy.create-session') }}">
                                        @csrf
                                        <button type="submit" class="btn btn-primary w-100 justify-content-center">
                                            <i class="ti ti-refresh me-1"></i> {{ __('Retry Verification') }}
                                        </button>
                                    </form>
                                @elseif($user && $user->isKycVerified())
                                    <div class="alert alert-success">
                                        <i class="ti ti-circle-check me-1"></i>
                                        {{ __('Your identity is verified!') }}
                                        <span class="badge bg-success ms-2">{{ __('ID Verified') }}</span>
                                    </div>
                                    <div class="mt-3">
                                        <a href="{{ route('signin') }}" class="btn btn-primary w-100 justify-content-center">{{ __('Go to Sign In') }}</a>
                                    </div>
                                @else
                                    <div class="border rounded p-3 mb-4">
                                        <div class="d-flex align-items-center mb-2">
                                            <i class="ti ti-id fs-24 text-primary me-2"></i>
                                            <h5 class="mb-0">{{ __('KYC Verification') }}</h5>
                                        </div>
                                        <p class="text-muted small mb-0">{{ __('You will be redirected to our verification partner iDenfy. Have your government-issued ID ready.') }}</p>
                                    </div>
                                    <ul class="list-unstyled mb-4">
                                        <li class="mb-2"><i class="ti ti-check text-success me-2"></i>{{ __('Government-issued photo ID (passport, driving license, or national ID)') }}</li>
                                        <li class="mb-2"><i class="ti ti-check text-success me-2"></i>{{ __('Selfie for face matching') }}</li>
                                        <li class="mb-2"><i class="ti ti-check text-success me-2"></i>{{ __('Process takes 2-5 minutes') }}</li>
                                    </ul>
                                    <form method="POST" action="{{ route('idenfy.create-session') }}">
                                        @csrf
                                        <button type="submit" class="btn btn-primary w-100 justify-content-center">
                                            <i class="ti ti-shield-check me-1"></i> {{ __('Start Verification') }}
                                        </button>
                                    </form>
                                @endif

                                <p class="text-muted small text-center mt-3 mb-0">
                                    <i class="ti ti-lock me-1"></i>{{ __('Your data is securely processed by iDenfy') }}
                                </p>
                            </div>
                        </div>
                        <div class="mt-3 text-center">
                            <p class="mb-0 text-gray-9">{{ __('Already have an account?') }} <a href="{{ route('signin') }}" class="link-primary">{{ __('Sign In') }}</a></p>
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
