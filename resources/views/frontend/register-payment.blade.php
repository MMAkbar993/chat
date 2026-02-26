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

                        @if(session('success'))
                            <div class="alert alert-success">{{ session('success') }}</div>
                        @endif
                        @if(session('info'))
                            <div class="alert alert-info">{{ session('info') }}</div>
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

                        <div class="mb-4">
                            <h2 class="mb-2">{{ __('Step 2: Choose Your Plan') }}</h2>
                            <p class="mb-0 fs-16">{{ __('Select a subscription plan to access the platform.') }}</p>
                        </div>

                        <form method="POST" action="{{ route('stripe.checkout') }}" id="plan-form">
                            @csrf
                            <input type="hidden" name="plan" id="selected-plan" value="monthly">

                            <div class="row g-3 mb-4">
                                @foreach($plans as $key => $plan)
                                <div class="col-sm-6">
                                    <div class="card plan-card border-2 h-100 {{ $key === 'monthly' ? 'border-primary' : '' }}"
                                         data-plan="{{ $key }}"
                                         style="cursor:pointer; transition: all 0.2s ease;">
                                        <div class="card-body text-center p-4">
                                            @if(!empty($plan['badge']))
                                                <span class="badge bg-success mb-2">{{ $plan['badge'] }}</span>
                                            @else
                                                <span class="badge bg-transparent mb-2">&nbsp;</span>
                                            @endif

                                            <h5 class="mb-1">{{ $plan['label'] }}</h5>

                                            <div class="my-3">
                                                <span class="fs-28 fw-bold">&euro;{{ $plan['amount'] }}</span>
                                                <span class="text-muted"> / {{ $plan['interval'] }}</span>
                                            </div>

                                            <p class="text-muted small mb-0">
                                                {{ __('Automatic renewal. Cancel anytime.') }}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                @endforeach
                            </div>

                            <button type="submit" class="btn btn-primary w-100 justify-content-center">
                                <i class="ti ti-lock me-1"></i> {{ __('Subscribe with Stripe') }}
                            </button>
                        </form>

                        <p class="text-muted small text-center mt-3 mb-0">
                            <i class="ti ti-shield-check me-1"></i>{{ __('Secure payment powered by Stripe') }}
                        </p>

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

<style>
.plan-card {
    border: 2px solid #dee2e6;
    border-radius: 12px;
}
.plan-card.border-primary {
    border-color: var(--bs-primary) !important;
    box-shadow: 0 0 0 1px var(--bs-primary);
}
.plan-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
</style>

<script>
document.addEventListener('DOMContentLoaded', function () {
    const cards = document.querySelectorAll('.plan-card');
    const input = document.getElementById('selected-plan');

    cards.forEach(function (card) {
        card.addEventListener('click', function () {
            cards.forEach(function (c) { c.classList.remove('border-primary'); });
            card.classList.add('border-primary');
            input.value = card.dataset.plan;
        });
    });
});
</script>
@endsection
