<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $user->full_name ?? ($user->first_name . ' ' . $user->last_name) }} – {{ config('app.name') }}</title>
    <link rel="stylesheet" href="{{ asset('assets/css/bootstrap.min.css') }}">
    <link rel="stylesheet" href="{{ asset('assets/icons/tabler-icons/tabler-icons.css') }}">
    <link rel="stylesheet" href="{{ asset('assets/css/style.css') }}">
    @php $details = $user->get_user_details; @endphp
    <meta property="og:title" content="{{ $user->full_name ?? ($user->first_name . ' ' . $user->last_name) }}">
    <meta property="og:description" content="{{ $details->user_about ?? ($user->full_name ?? config('app.name')) }}">
</head>
<body class="public-profile-page">
    <div class="container py-5">
        <div class="row justify-content-center">
            <div class="col-lg-8 col-xl-6">
                <div class="card shadow-sm border-0">
                    <div class="card-body py-5">

                        {{-- Name (with Verified Badge) --}}
                        <div class="text-center mb-4">
                            <div class="avatar avatar-xxl mx-auto mb-3">
                                @if($user->profile_image_link)
                                    <img src="{{ $user->profile_image_link }}" class="rounded-circle" alt="{{ $user->full_name }}">
                                @else
                                    <span class="avatar avatar-xxl rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style="font-size:2rem;">
                                        {{ strtoupper(substr($user->first_name ?? $user->user_name ?? 'U', 0, 1)) }}{{ strtoupper(substr($user->last_name ?? '', 0, 1)) }}
                                    </span>
                                @endif
                            </div>
                            <h3 class="mb-0 d-flex align-items-center justify-content-center flex-wrap gap-1">
                                {{ $user->full_name ?? ($user->first_name . ' ' . $user->last_name) }}
                                @if($user->isKycVerified())
                                    <span class="badge bg-success-transparent text-success badge-sm ms-1" title="{{ __('ID Verified') }}">
                                        <i class="ti ti-shield-check me-1"></i>{{ __('Verified') }}
                                    </span>
                                @endif
                            </h3>
                        </div>

                        {{-- Bio --}}
                        @if($details && $details->user_about)
                            <div class="mb-4">
                                <h6 class="text-muted text-uppercase small mb-2">{{ __('Bio') }}</h6>
                                <p class="mb-0">{{ $details->user_about }}</p>
                            </div>
                        @endif

                        {{-- Location --}}
                        @if($user->country || ($details && $details->location))
                            <div class="mb-4">
                                <h6 class="text-muted text-uppercase small mb-2">{{ __('Location') }}</h6>
                                <p class="mb-0"><i class="ti ti-map-pin me-1"></i>{{ $user->country ?? $details->location }}</p>
                            </div>
                        @endif

                        {{-- Website --}}
                        @php $websites = $user->websites->where('verified_at', '!=', null); @endphp
                        @if($websites->count())
                            <div class="mb-4">
                                <h6 class="text-muted text-uppercase small mb-2">{{ __('Website') }}</h6>
                                @foreach($websites as $website)
                                    <div class="d-flex align-items-center mb-2">
                                        <i class="ti ti-circle-check text-success me-2" title="{{ __('Verified') }}"></i>
                                        <a href="{{ $website->getDisplayUrl() }}" target="_blank" rel="noopener">{{ $website->getDisplayUrl() }}</a>
                                        <span class="badge bg-success-transparent text-success badge-sm ms-2">{{ __('Verified') }}</span>
                                    </div>
                                @endforeach
                            </div>
                        @endif

                        {{-- Social Channels (with Verified Badge) --}}
                        @php
                            $socialPlatforms = [
                                'facebook' => ['detail' => optional($details)->facebook, 'label' => 'Facebook', 'icon' => 'ti-brand-facebook', 'fallback' => 'https://www.facebook.com/'],
                                'twitter' => ['detail' => optional($details)->twitter, 'label' => 'Twitter', 'icon' => 'ti-brand-twitter', 'fallback' => 'https://x.com/'],
                                'linkedin' => ['detail' => optional($details)->linkedin, 'label' => 'LinkedIn', 'icon' => 'ti-brand-linkedin', 'fallback' => 'https://www.linkedin.com/'],
                                'instagram' => ['detail' => optional($details)->instagram, 'label' => 'Instagram', 'icon' => 'ti-brand-instagram', 'fallback' => 'https://www.instagram.com/'],
                                'youtube' => ['detail' => optional($details)->youtube, 'label' => 'YouTube', 'icon' => 'ti-brand-youtube', 'fallback' => 'https://www.youtube.com/'],
                                'kick' => ['detail' => optional($details)->kick, 'label' => 'Kick', 'icon' => 'ti-device-gamepad-2', 'fallback' => 'https://kick.com/'],
                                'twitch' => ['detail' => optional($details)->twitch, 'label' => 'Twitch', 'icon' => 'ti-brand-twitch', 'fallback' => 'https://www.twitch.tv/'],
                            ];
                            $platformToOauth = ['twitter' => 'x'];
                            $verifiedSocialPlatforms = $user->socialAccounts()->where('oauth_verified', true)->pluck('platform')->toArray();
                        @endphp
                        @php
                            $hasAnySocial = false;
                            foreach ($socialPlatforms as $detailKey => $cfg) {
                                $oauthPlatform = $platformToOauth[$detailKey] ?? $detailKey;
                                $url = $cfg['detail'];
                                if (empty($url)) {
                                    $acc = $user->socialAccounts()->where('platform', $oauthPlatform)->where('oauth_verified', true)->first();
                                    $url = $acc && $acc->profile_url ? $acc->profile_url : ($acc ? $cfg['fallback'] : null);
                                }
                                if ($url) { $hasAnySocial = true; break; }
                            }
                        @endphp
                        @if($hasAnySocial)
                            <div class="mb-4">
                                <h6 class="text-muted text-uppercase small mb-3">{{ __('Social Channels') }}</h6>
                                <div class="d-flex flex-wrap gap-2">
                                    @foreach($socialPlatforms as $detailKey => $cfg)
                                        @php
                                            $oauthPlatform = $platformToOauth[$detailKey] ?? $detailKey;
                                            $url = $cfg['detail'];
                                            if (empty($url)) {
                                                $acc = $user->socialAccounts()->where('platform', $oauthPlatform)->where('oauth_verified', true)->first();
                                                $url = $acc && $acc->profile_url ? $acc->profile_url : ($acc ? $cfg['fallback'] : null);
                                            }
                                            $isVerified = in_array($oauthPlatform, $verifiedSocialPlatforms) || in_array($detailKey, $verifiedSocialPlatforms);
                                        @endphp
                                        @if($url)
                                            <a href="{{ $url }}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-primary d-inline-flex align-items-center">
                                                <i class="ti {{ $cfg['icon'] }} me-1"></i>{{ $cfg['label'] }}
                                                @if($isVerified)
                                                    <span class="badge bg-success-transparent text-success badge-sm ms-1"><i class="ti ti-circle-check"></i> {{ __('Verified') }}</span>
                                                @endif
                                            </a>
                                        @endif
                                    @endforeach
                                </div>
                            </div>
                        @endif

                        {{-- Join Date --}}
                        @if($user->created_at)
                            <div class="mb-4">
                                <h6 class="text-muted text-uppercase small mb-2">{{ __('Join Date') }}</h6>
                                <p class="mb-0"><i class="ti ti-calendar-event me-1"></i>{{ $user->created_at->format('F j, Y') }}</p>
                            </div>
                        @endif

                    </div>

                    <div class="card-body border-top text-center">
                        @auth
                            <a href="{{ route('contact') }}" class="btn btn-primary">
                                <i class="ti ti-user-plus me-1"></i>{{ __('Add as Contact') }}
                            </a>
                        @else
                            <a href="{{ route('login') }}" class="btn btn-primary">
                                <i class="ti ti-login me-1"></i>{{ __('Sign in to connect') }}
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
