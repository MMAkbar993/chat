<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $user->full_name ?? ($user->first_name . ' ' . $user->last_name) }} – {{ config('app.name') }}</title>
    <link rel="stylesheet" href="{{ asset('assets/css/bootstrap.min.css') }}">
    <link rel="stylesheet" href="{{ asset('assets/icons/tabler-icons/tabler-icons.css') }}">
    <link rel="stylesheet" href="{{ asset('assets/css/style.css') }}">
    <meta property="og:title" content="{{ $user->full_name ?? ($user->first_name . ' ' . $user->last_name) }}">
    <meta property="og:description" content="{{ $user->primary_role ?? 'Member' }} at {{ config('app.name') }}">
</head>
<body class="public-profile-page">
    <div class="container py-5">
        <div class="row justify-content-center">
            <div class="col-lg-8 col-xl-6">
                <div class="card shadow-sm border-0">
                    <div class="card-body text-center py-5">
                        <div class="avatar avatar-xxl mx-auto mb-3">
                            @if($user->profile_image_link)
                                <img src="{{ $user->profile_image_link }}" class="rounded-circle" alt="{{ $user->user_name }}">
                            @else
                                <span class="avatar avatar-xxl rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style="font-size:2rem;">
                                    {{ strtoupper(substr($user->first_name ?? $user->user_name, 0, 1)) }}{{ strtoupper(substr($user->last_name ?? '', 0, 1)) }}
                                </span>
                            @endif
                        </div>

                        <h3 class="mb-1">
                            {{ $user->full_name ?? ($user->first_name . ' ' . $user->last_name) }}
                            @if($user->isKycVerified())
                                <span class="badge bg-success-transparent text-success badge-xs ms-1" title="ID Verified">
                                    <i class="ti ti-shield-check"></i>
                                </span>
                            @endif
                        </h3>

                        <p class="text-muted mb-1">{{ '@' . $user->user_name }}</p>

                        @if($user->primary_role)
                            <span class="badge bg-primary-transparent text-primary mb-2">{{ $user->primary_role }}</span>
                        @endif

                        @if($user->company_name)
                            <p class="mb-1"><i class="ti ti-building me-1"></i>{{ $user->company_name }}</p>
                        @endif

                        @if($user->country)
                            <p class="text-muted mb-3"><i class="ti ti-map-pin me-1"></i>{{ $user->country }}</p>
                        @endif

                        @php $details = $user->get_user_details; @endphp

                        @if($details && $details->user_about)
                            <div class="border-top pt-3 mt-3">
                                <p class="text-start">{{ $details->user_about }}</p>
                            </div>
                        @endif
                    </div>

                    @if($details)
                    <div class="card-body border-top">
                        <h6 class="mb-3">Social Links</h6>
                        <div class="d-flex flex-wrap gap-2">
                            @if($details->facebook)
                                <a href="{{ $details->facebook }}" target="_blank" class="btn btn-sm btn-outline-primary">
                                    <i class="ti ti-brand-facebook me-1"></i>Facebook
                                </a>
                            @endif
                            @if($details->linkedin)
                                <a href="{{ $details->linkedin }}" target="_blank" class="btn btn-sm btn-outline-primary">
                                    <i class="ti ti-brand-linkedin me-1"></i>LinkedIn
                                </a>
                            @endif
                            @if($details->instagram)
                                <a href="{{ $details->instagram }}" target="_blank" class="btn btn-sm btn-outline-primary">
                                    <i class="ti ti-brand-instagram me-1"></i>Instagram
                                </a>
                            @endif
                            @if($details->youtube)
                                <a href="{{ $details->youtube }}" target="_blank" class="btn btn-sm btn-outline-primary">
                                    <i class="ti ti-brand-youtube me-1"></i>YouTube
                                </a>
                            @endif
                            @if($details->kick)
                                <a href="{{ $details->kick }}" target="_blank" class="btn btn-sm btn-outline-primary">
                                    <i class="ti ti-device-gamepad-2 me-1"></i>Kick
                                </a>
                            @endif
                            @if($details->twitch)
                                <a href="{{ $details->twitch }}" target="_blank" class="btn btn-sm btn-outline-primary">
                                    <i class="ti ti-brand-twitch me-1"></i>Twitch
                                </a>
                            @endif
                        </div>
                    </div>
                    @endif

                    @php $websites = $user->websites->where('verified_at', '!=', null); @endphp
                    @if($websites->count())
                    <div class="card-body border-top">
                        <h6 class="mb-3">Verified Websites</h6>
                        @foreach($websites as $website)
                            <div class="d-flex align-items-center mb-2">
                                <i class="ti ti-circle-check text-success me-2"></i>
                                <a href="{{ $website->getDisplayUrl() }}" target="_blank" rel="noopener">{{ $website->getDisplayUrl() }}</a>
                            </div>
                        @endforeach
                    </div>
                    @endif

                    @php $verifiedSocial = $user->socialAccounts ?? collect(); @endphp
                    @if($verifiedSocial->count())
                    <div class="card-body border-top">
                        <h6 class="mb-3">Verified Social Accounts</h6>
                        <div class="d-flex flex-wrap gap-2">
                            @foreach($verifiedSocial as $account)
                                <a href="{{ $account->profile_url ?? '#' }}" target="_blank" class="btn btn-sm btn-outline-success">
                                    <i class="ti ti-circle-check text-success me-1"></i>
                                    {{ ucfirst($account->platform) }}: {{ $account->username ?? $account->platform }}
                                </a>
                            @endforeach
                        </div>
                    </div>
                    @endif

                    <div class="card-body border-top text-center">
                        @auth
                            <a href="{{ route('contact') }}" class="btn btn-primary">
                                <i class="ti ti-user-plus me-1"></i>Add as Contact
                            </a>
                        @else
                            <a href="{{ route('login') }}" class="btn btn-primary">
                                <i class="ti ti-login me-1"></i>Sign in to connect
                            </a>
                        @endauth
                    </div>
                </div>

                <div class="text-center mt-3">
                    <a href="{{ url('/') }}" class="text-muted">
                        <img src="{{ asset('assets/img/logo.svg') }}" alt="Logo" height="30" class="me-1">
                        {{ config('app.name') }}
                    </a>
                </div>
            </div>
        </div>
    </div>

    <script src="{{ asset('assets/js/bootstrap.bundle.min.js') }}"></script>
</body>
</html>
