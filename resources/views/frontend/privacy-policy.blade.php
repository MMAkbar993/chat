@extends('frontend.layout')

@section('content')
<div class="container-fluid py-4 py-lg-5">
    <div class="row justify-content-center">
        <div class="col-lg-8 col-xl-7">
            <div class="text-center mb-4">
                <a href="{{ url('/') }}" class="d-inline-block mb-3">
                    <img src="{{ asset('assets/img/full-logo.png') }}" alt="{{ config('app.name') }}" class="img-fluid" style="max-height: 48px;">
                </a>
                <h1 class="h3 mb-2">{{ __('Privacy Policy') }}</h1>
                <p class="text-muted small mb-0">{{ __('Last updated') }}: {{ \Carbon\Carbon::now()->format('F j, Y') }}</p>
            </div>
            <div class="card shadow-sm border-0">
                <div class="card-body p-4 p-lg-5">
                    <div class="privacy-content">
                        <p class="lead">{{ __('We respect your privacy and are committed to protecting your personal data. This policy explains how we collect, use, and safeguard your information when you use our service.') }}</p>

                        <h2 class="h5 mt-4 mb-2">1. {{ __('Information We Collect') }}</h2>
                        <p>{{ __('We may collect information you provide directly (such as name, email, profile details) when you register, connect social accounts, or contact us. We also collect usage data (e.g. how you use the app) to improve our services.') }}</p>

                        <h2 class="h5 mt-4 mb-2">2. {{ __('How We Use Your Information') }}</h2>
                        <p>{{ __('We use your information to provide and improve our services, authenticate you, process payments, send important notices, and comply with legal obligations. We do not sell your personal data to third parties.') }}</p>

                        <h2 class="h5 mt-4 mb-2">3. {{ __('Social Login & Third-Party Services') }}</h2>
                        <p>{{ __('If you connect accounts (e.g. Facebook, Instagram, Google), we receive limited profile data from those providers in line with their policies and your permissions. We use this only to verify your identity and link your profile.') }}</p>

                        <h2 class="h5 mt-4 mb-2">4. {{ __('Data Security') }}</h2>
                        <p>{{ __('We use industry-standard measures to protect your data (encryption, secure servers, access controls). No method of transmission over the internet is 100% secure; we strive to protect your information to the best of our ability.') }}</p>

                        <h2 class="h5 mt-4 mb-2">5. {{ __('Your Rights') }}</h2>
                        <p>{{ __('Depending on your location, you may have the right to access, correct, delete, or export your data, or to object to certain processing. You can update your profile and preferences in account settings or contact us for requests.') }}</p>

                        <h2 class="h5 mt-4 mb-2">6. {{ __('Cookies and Similar Technologies') }}</h2>
                        <p>{{ __('We use cookies and similar technologies to keep you logged in, remember preferences, and analyze usage. You can manage cookie settings in your browser.') }}</p>

                        <h2 class="h5 mt-4 mb-2">7. {{ __('Changes to This Policy') }}</h2>
                        <p>{{ __('We may update this privacy policy from time to time. We will post the updated policy on this page and update the "Last updated" date. Continued use of the service after changes constitutes acceptance.') }}</p>

                        <h2 class="h5 mt-4 mb-2">8. {{ __('Contact Us') }}</h2>
                        <p>{{ __('If you have questions about this privacy policy or your personal data, please contact us at the email or address provided in our app or website.') }}</p>
                    </div>
                </div>
            </div>
            <div class="text-center mt-4">
                <a href="{{ url('/') }}" class="btn btn-primary">{{ __('Back to Home') }}</a>
                @auth
                    <a href="{{ route('settings') }}" class="btn btn-outline-secondary ms-2">{{ __('Settings') }}</a>
                @endauth
            </div>
        </div>
    </div>
</div>
@endsection
