@extends('frontend.layout')

@section('content')
<div class="container-fluid py-4 py-lg-5">
    <div class="row justify-content-center">
        <div class="col-lg-8 col-xl-7">
            <div class="text-center mb-4">
                <a href="{{ url('/') }}" class="d-inline-block mb-3">
                    <img src="{{ asset('assets/img/full-logo.png') }}" alt="{{ config('app.name') }}" class="img-fluid" style="max-height: 48px;">
                </a>
                <h1 class="h3 mb-2">{{ __('Terms and Conditions') }}</h1>
                <p class="text-muted small mb-0">{{ __('Last updated') }}: {{ \Carbon\Carbon::now()->format('F j, Y') }}</p>
            </div>
            <div class="card shadow-sm border-0">
                <div class="card-body p-4 p-lg-5">
                    <div class="terms-content">
                        <p class="lead">{{ __('By accessing or using our service, you agree to be bound by these Terms and Conditions. Please read them carefully.') }}</p>

                        <h2 class="h5 mt-4 mb-2">1. {{ __('Acceptance of Terms') }}</h2>
                        <p>{{ __('By registering, logging in, or using our platform, you accept these terms. If you do not agree, do not use the service. We may update these terms from time to time; continued use after changes means you accept the updated terms.') }}</p>

                        <h2 class="h5 mt-4 mb-2">2. {{ __('Eligibility') }}</h2>
                        <p>{{ __('You must be at least the minimum age required in your jurisdiction to use this service. By using the service, you represent that you meet this requirement and have the legal capacity to enter into this agreement.') }}</p>

                        <h2 class="h5 mt-4 mb-2">3. {{ __('Account and Security') }}</h2>
                        <p>{{ __('You are responsible for keeping your account credentials secure and for all activity under your account. You must provide accurate information when registering and notify us promptly of any unauthorized use.') }}</p>

                        <h2 class="h5 mt-4 mb-2">4. {{ __('Acceptable Use') }}</h2>
                        <p>{{ __('You agree not to use the service for any illegal purpose or in violation of any laws. You must not harass others, distribute harmful content, spam, or attempt to gain unauthorized access to our systems or other users\' accounts. We may suspend or terminate accounts that violate these rules.') }}</p>

                        <h2 class="h5 mt-4 mb-2">5. {{ __('Intellectual Property') }}</h2>
                        <p>{{ __('The service, including its design, features, and content (excluding user-generated content), is owned by us or our licensors. You may not copy, modify, or distribute our content without permission.') }}</p>

                        <h2 class="h5 mt-4 mb-2">6. {{ __('Payments and Subscriptions') }}</h2>
                        <p>{{ __('If you subscribe to paid features, you agree to the applicable payment terms. Fees are as stated at the time of purchase. Refunds are subject to our refund policy. We may change pricing with notice; continued use after changes constitutes acceptance.') }}</p>

                        <h2 class="h5 mt-4 mb-2">7. {{ __('Disclaimer of Warranties') }}</h2>
                        <p>{{ __('The service is provided "as is" without warranties of any kind. We do not guarantee uninterrupted or error-free service. Your use of the service is at your own risk.') }}</p>

                        <h2 class="h5 mt-4 mb-2">8. {{ __('Limitation of Liability') }}</h2>
                        <p>{{ __('To the fullest extent permitted by law, we are not liable for any indirect, incidental, special, or consequential damages arising from your use of the service. Our total liability shall not exceed the amount you paid us in the twelve months before the claim.') }}</p>

                        <h2 class="h5 mt-4 mb-2">9. {{ __('Termination') }}</h2>
                        <p>{{ __('We may suspend or terminate your access at any time for violation of these terms or for any other reason. You may close your account at any time through account settings.') }}</p>

                        <h2 class="h5 mt-4 mb-2">10. {{ __('Contact') }}</h2>
                        <p>{{ __('For questions about these Terms and Conditions, please contact us using the details provided on our website or in the app.') }}</p>
                    </div>
                </div>
            </div>
            <div class="text-center mt-4">
                <a href="{{ url('/') }}" class="btn btn-primary">{{ __('Back to Home') }}</a>
                <a href="{{ route('privacy') }}" class="btn btn-outline-secondary ms-2">{{ __('Privacy Policy') }}</a>
                @auth
                    <a href="{{ route('settings') }}" class="btn btn-outline-secondary ms-2">{{ __('Settings') }}</a>
                @endauth
            </div>
        </div>
    </div>
</div>
@endsection
