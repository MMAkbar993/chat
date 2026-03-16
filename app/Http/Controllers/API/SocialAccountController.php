<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\SocialAccount;
use App\Models\UserDetails;
use App\Services\EncryptionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Cache;
use Laravel\Socialite\Facades\Socialite;

class SocialAccountController extends Controller
{
    protected EncryptionService $encryptionService;

    public function __construct(EncryptionService $encryptionService)
    {
        $this->encryptionService = $encryptionService;
    }

    public function index(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return send_bad_request_response('User not found');
            }

            $accounts = $user->socialAccounts()->get()->map(fn ($a) => [
                'id' => $a->id,
                'platform' => $a->platform,
                'username' => $a->username,
                'profile_url' => $a->profile_url,
                'oauth_verified' => $a->oauth_verified,
            ]);

            $result = json_encode(['social_accounts' => $accounts]);
            $data = $this->encryptionService->encryptData($result);
            return send_success_response(['data' => $data], 'Social accounts fetched.');
        } catch (\Exception $e) {
            return send_exception_response($e->getMessage());
        }
    }

    public function redirect(string $platform): \Illuminate\Http\RedirectResponse|\Illuminate\Http\JsonResponse
    {
        try {
            $platform = strtolower($platform);
            if (!in_array($platform, SocialAccount::supportedPlatforms())) {
                return response()->json(['error' => 'Unsupported platform'], 400);
            }

            try {
                $driver = $this->getDriverForPlatform($platform);
                if (!$driver) {
                    return response()->json(['error' => 'Platform not configured'], 400);
                }

                $callbackUrl = url("/connect/{$platform}/callback");
                $config = $this->getDriverConfig($driver, $platform);
                if (!$config || empty($config['client_id'])) {
                    return $this->platformConfigError($platform);
                }
                // Use explicit redirect from config when set (e.g. LINKEDIN_REDIRECT_URI) so it matches the provider's console exactly
                $redirectUrl = !empty($config['redirect']) ? $config['redirect'] : $callbackUrl;

                $socialite = Socialite::driver($driver)->stateless();
                $socialite->redirectUrl($redirectUrl);
                $this->applyDriverConfig($socialite, $config, $redirectUrl);
                if ($platform === 'youtube' && method_exists($socialite, 'scopes')) {
                    $socialite->scopes(['openid', 'profile', 'email', 'https://www.googleapis.com/auth/youtube.readonly']);
                }
                return $socialite->redirect();
            } catch (\Throwable $e) {
                $msg = $e->getMessage();
                Log::error('Social connect redirect failed', [
                    'platform' => $platform,
                    'message' => $msg,
                    'exception' => get_class($e),
                    'trace' => $e->getTraceAsString(),
                ]);
                if (str_contains($msg, 'not supported')) {
                    return $this->platformConfigError($platform);
                }
                // Return redirect for popup UX: show settings with error instead of raw 500
                return redirect()->route('settings')->with('error', __('Social verification failed. Please check OAuth settings in .env (client_id, client_secret, redirect URI) and try again.'));
            }
        } catch (\Throwable $e) {
            Log::error('Social connect redirect outer failed', ['platform' => $platform ?? 'unknown', 'message' => $e->getMessage()]);
            return redirect()->route('settings')->with('error', __('Social verification failed. Please try again.'));
        }
    }

    /**
     * Return a 400 JSON or redirect with platform-specific "not configured" message.
     * When the request expects HTML (e.g. popup), redirect to an error page so the user sees a clear message instead of "Failed to load resource".
     */
    protected function platformConfigError(string $platform): \Illuminate\Http\JsonResponse|\Illuminate\Http\RedirectResponse
    {
        $messages = [
            'instagram' => 'Instagram OAuth is not configured. In .env set INSTAGRAM_CLIENT_ID and INSTAGRAM_CLIENT_SECRET from your Meta app (Instagram Basic Display or Graph API). Optional: INSTAGRAM_REDIRECT_URI (defaults to APP_URL/connect/instagram/callback). See docs/WEBSITE_SOCIAL_VERIFICATION.md.',
            'youtube'   => 'YouTube uses Google OAuth. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI in .env. In Google Cloud Console add the exact redirect URI.',
            'facebook'  => 'Facebook OAuth is not configured. Set FACEBOOK_CLIENT_ID, FACEBOOK_CLIENT_SECRET, FACEBOOK_REDIRECT_URI in .env and whitelist the redirect URI in the Facebook App.',
            'linkedin'  => 'LinkedIn OAuth is not configured. Set LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, LINKEDIN_REDIRECT_URI in .env (redirect must match exactly in LinkedIn Developer Portal).',
            'x'         => 'X (Twitter) OAuth is not configured. Set TWITTER_CLIENT_ID, TWITTER_CLIENT_SECRET, TWITTER_REDIRECT_URI in .env (OAuth 2.0).',
            'kick'      => 'Kick OAuth is not configured. Set KICK_CLIENT_ID, KICK_CLIENT_SECRET, KICK_REDIRECT_URI in .env and run php artisan config:clear.',
            'twitch'    => 'Twitch OAuth is not configured. Set TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET, TWITCH_REDIRECT_URI in .env.',
        ];
        $message = $messages[strtolower($platform)] ?? 'Platform OAuth is not configured. Set client_id and client_secret in .env and config/services.php.';
        // When opened in a popup or normal navigation, redirect to error page so user sees a clear message instead of "Failed to load resource" (400 JSON).
        if (request()->expectsJson() === false) {
            return redirect()->route('social.connect.error')->with('social_connect_error', $message);
        }
        return response()->json(['error' => $message], 400);
    }

    public function callback(Request $request, string $platform): \Illuminate\Http\RedirectResponse|\Illuminate\Http\JsonResponse|\Illuminate\Http\Response
    {
        $settingsUrl = url()->route('settings');
        // On error: postMessage to opener so it can show a toast, then close the popup.
        // Do NOT call opener.location.reload() — that would cause a full page refresh.
        $closeWithError = function(string $errorMsg) use ($settingsUrl): \Illuminate\Http\Response {
            $msgJs = json_encode($errorMsg);
            $settingsUrlJs = json_encode($settingsUrl);
            return response('<script>
(function() {
    var payload = { type: "social-connect-error", message: ' . $msgJs . ' };
    try {
        if (window.opener && !window.opener.closed) {
            window.opener.postMessage(payload, "*");
        }
    } catch (e) {}
    try { window.close(); } catch (z) {}
    // Only navigate if the popup is still open (window.close() was blocked)
    setTimeout(function() {
        try {
            if (!window.closed) { window.location.href = ' . $settingsUrlJs . '; }
        } catch (e) { window.location.href = ' . $settingsUrlJs . '; }
    }, 300);
})();
</script>');
        };
        try {
            $platform = strtolower($platform);
            if (!in_array($platform, SocialAccount::supportedPlatforms())) {
                return redirect()->route('settings')->with('error', 'Unsupported platform');
            }

            try {
            $user = Auth::user();
            if (!$user) {
                return redirect()->route('settings')->with('error', 'You must be logged in to connect accounts.');
            }

            $driver = $this->getDriverForPlatform($platform);
            if (!$driver) {
                return redirect()->route('settings')->with('error', 'Platform not configured');
            }

            $callbackUrl = url("/connect/{$platform}/callback");
            $config = $this->getDriverConfig($driver, $platform);
            if (!$config || empty($config['client_id'])) {
                return redirect()->route('settings')->with('error', 'Platform OAuth is not configured. Set client_id and client_secret in .env.');
            }
            $redirectUrl = !empty($config['redirect']) ? $config['redirect'] : $callbackUrl;

            $socialite = Socialite::driver($driver)->stateless()->redirectUrl($redirectUrl);
            $this->applyDriverConfig($socialite, $config, $redirectUrl);
            $socialUser = $socialite->user();

            $profileUrl = $this->buildProfileUrl($platform, $socialUser);

            // For LinkedIn: try to get public profile URL (vanityName) via API when OpenID didn't return it
            if ($platform === 'linkedin' && (!$profileUrl || $profileUrl === 'https://www.linkedin.com/')) {
                $profileUrl = $this->fetchLinkedInProfileUrl($socialUser) ?? $profileUrl;
            }

            // For YouTube: Google OAuth often doesn't return channel handle; fetch channel URL from YouTube Data API
            if ($platform === 'youtube' && (!$profileUrl || $profileUrl === 'https://www.youtube.com/' || trim($profileUrl ?? '') === '')) {
                $profileUrl = $this->fetchYouTubeChannelUrl($socialUser) ?? $profileUrl;
            }

            // Never use avatar URL as profile_url; profile_url is the public profile page only
            $account = SocialAccount::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'platform' => $platform,
                ],
                [
                    'platform_user_id' => $socialUser->getId(),
                    'username' => $socialUser->getNickname() ?? $socialUser->getName(),
                    'profile_url' => $profileUrl,
                    'oauth_verified' => true,
                    'oauth_data' => [
                        'name' => $socialUser->getName(),
                        'email' => $socialUser->getEmail(),
                        'avatar' => $socialUser->getAvatar(),
                    ],
                ]
            );

            // Update user_details with the new profile URL for backward compatibility.
            // For LinkedIn, do not store the generic "https://www.linkedin.com/" so the user can
            // enter their real profile URL (e.g. https://www.linkedin.com/in/username) in settings.
            if ($profileUrl) {
                $details = $user->get_user_details;
                if (!$details) {
                    $details = new UserDetails(['user_id' => $user->id]);
                }

                $dbKey = match ($platform) {
                    'x' => 'twitter',
                    default => $platform
                };

                if (in_array($dbKey, ['facebook', 'twitter', 'linkedin', 'youtube', 'instagram', 'kick', 'twitch'])) {
                    $isGenericLinkedIn = ($dbKey === 'linkedin' && $profileUrl === 'https://www.linkedin.com/');
                    if (!$isGenericLinkedIn) {
                        $details->$dbKey = $profileUrl;
                    }
                    $details->save();
                }
            }

            session()->flash('success', ucfirst($platform) . ' account connected successfully.');
            Cache::forget('public_profile:' . strtolower($user->user_name));
            $accountId = (int) $account->id;
            $platformJs = json_encode($platform);
            $settingsUrlJs = json_encode($settingsUrl);
            // Clear any previous connect error so the opener doesn't show it after reload or in existing DOM
            session()->forget('error');
            return response('<script>
(function() {
    var payload = { type: "social-connected", platform: ' . $platformJs . ', accountId: ' . $accountId . ' };
    try {
        if (window.opener && !window.opener.closed) {
            window.opener.postMessage(payload, "*");
        }
    } catch (e) {}
    try { window.close(); } catch (z) {}
    // Only navigate to settings if the popup could not close itself
    setTimeout(function() {
        try {
            if (!window.closed) { window.location.href = ' . $settingsUrlJs . '; }
        } catch (e) { window.location.href = ' . $settingsUrlJs . '; }
    }, 300);
})();
</script>');
        } catch (\Throwable $e) {
            $msg = $e->getMessage();
            Log::error('Social connect callback failed', [
                'platform' => $platform,
                'message' => $msg,
                'exception' => get_class($e),
                'trace' => $e->getTraceAsString(),
            ]);
            $userMessage = __('Could not connect account. Please try again.');
            if (str_contains($msg, 'redirect_uri_mismatch') || str_contains($msg, 'redirect_uri')) {
                $userMessage = __('Redirect URI mismatch. Set the exact callback URL in .env and in the provider’s developer console (see docs/WEBSITE_SOCIAL_VERIFICATION.md).');
            }
            if (str_contains($msg, 'invalid_grant') || str_contains($msg, 'access_denied')) {
                $userMessage = __('Access was denied or the authorization expired. Try connecting again.');
            }
            return $closeWithError($userMessage);
        }
        } catch (\Throwable $outer) {
            Log::error('Social connect callback outer failed', ['platform' => $platform ?? 'unknown', 'message' => $outer->getMessage()]);
            return $closeWithError(__('Could not connect account. Please try again.'));
        }
    }

    public function disconnect(Request $request, $id): \Illuminate\Http\JsonResponse
    {
        $id = is_numeric($id) ? (int) $id : 0;
        if ($id < 1) {
            return send_bad_request_response(__('Invalid account id.'));
        }

        try {
            $user = Auth::user();
            if (!$user) {
                return send_bad_request_response(__('User not found.'));
            }

            $account = $user->socialAccounts()->find($id);
            if (!$account) {
                return send_bad_request_response(__('Social account not found.'));
            }

            $platform = $account->platform;
            $account->delete();

            // Clear the corresponding link in user_details so the profile no longer shows it
            $dbKey = $platform === 'x' ? 'twitter' : $platform;
            if (in_array($dbKey, ['facebook', 'twitter', 'linkedin', 'youtube', 'instagram', 'kick', 'twitch'])) {
                try {
                    $details = $user->get_user_details;
                    if ($details && in_array($dbKey, $details->getFillable())) {
                        $details->$dbKey = null;
                        $details->save();
                    }
                } catch (\Throwable $e) {
                    try {
                        Log::warning('Social disconnect: could not clear user_details', ['user_id' => $user->id, 'platform' => $platform, 'message' => $e->getMessage()]);
                    } catch (\Throwable $logEx) {
                        // ignore log failure
                    }
                }
            }

            try {
                $userName = $user->user_name ?? '';
                if ($userName !== '') {
                    Cache::forget('public_profile:' . strtolower($userName));
                }
            } catch (\Throwable $e) {
                // Ignore cache failure
            }

            return send_success_response(['platform' => (string) $platform], __('Account disconnected.'));
        } catch (\Throwable $e) {
            try {
                Log::error('Social disconnect failed', ['id' => $id, 'message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            } catch (\Throwable $logEx) {
                // ignore log failure
            }
            return send_success_response(['error' => true], __('Could not disconnect account. Please try again.'));
        }
    }

    /**
     * Update a connected social account's profile URL (e.g. when LinkedIn doesn't return vanity name).
     * Syncs to user_details for display. Validates URL format per platform.
     */
    public function updateProfileUrl(Request $request, int $id): \Illuminate\Http\JsonResponse
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return send_bad_request_response('User not found');
            }

            $account = $user->socialAccounts()->find($id);
            if (!$account) {
                return send_bad_request_response('Social account not found');
            }

            $url = $request->input('profile_url');
            if ($url !== null) {
                $url = trim((string) $url);
            }
            if ($url === '') {
                $url = null;
            }

            if ($url !== null) {
                if (!preg_match('#^https?://#i', $url)) {
                    return send_bad_request_response('Profile URL must start with http:// or https://');
                }
                $platform = strtolower($account->platform);
                if ($platform === 'linkedin' && !preg_match('#^https?://(www\.)?linkedin\.com/in/#i', $url)) {
                    return send_bad_request_response('LinkedIn profile URL must be like https://www.linkedin.com/in/yourname');
                }
            }

            $account->profile_url = $url;
            $account->save();

            $dbKey = $account->platform === 'x' ? 'twitter' : $account->platform;
            if (in_array($dbKey, ['facebook', 'twitter', 'linkedin', 'youtube', 'instagram', 'kick', 'twitch'])) {
                $details = $user->get_user_details;
                if (!$details) {
                    $details = new UserDetails(['user_id' => $user->id]);
                }
                $details->$dbKey = $url;
                $details->save();
            }

            $userName = $user->user_name ?? '';
            if ($userName !== '') {
                Cache::forget('public_profile:' . strtolower($userName));
            }

            return send_success_response([], __('Profile URL updated.'));
        } catch (\Throwable $e) {
            Log::error('Social update profile URL failed', ['id' => $id, 'message' => $e->getMessage()]);
            return send_exception_response($e->getMessage());
        }
    }

    /**
     * Save LinkedIn profile URL only (no OAuth connect). LinkedIn does not provide profile URL
     * from OAuth, so we offer a simple URL field + Save. Creates/updates user_details.linkedin and
     * optionally a SocialAccount row with oauth_verified=false for consistency.
     */
    public function saveLinkedInProfileUrl(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return send_bad_request_response('User not found');
            }

            $url = $request->input('profile_url');
            if ($url !== null) {
                $url = trim((string) $url);
            }
            if ($url === '') {
                $url = null;
            }

            if ($url !== null) {
                if (!preg_match('#^https?://#i', $url)) {
                    return send_bad_request_response('Profile URL must start with http:// or https://');
                }
                if (!preg_match('#^https?://(www\.)?linkedin\.com/in/#i', $url)) {
                    return send_bad_request_response('LinkedIn profile URL must be like https://www.linkedin.com/in/yourname');
                }
            }

            $details = $user->get_user_details;
            if (!$details) {
                $details = new UserDetails(['user_id' => $user->id]);
            }
            $details->linkedin = $url;
            $details->save();

            SocialAccount::updateOrCreate(
                ['user_id' => $user->id, 'platform' => 'linkedin'],
                [
                    'platform_user_id' => 'manual',
                    'username' => null,
                    'profile_url' => $url,
                    'oauth_verified' => false,
                    'oauth_data' => null,
                ]
            );

            $userName = $user->user_name ?? '';
            if ($userName !== '') {
                Cache::forget('public_profile:' . strtolower($userName));
            }

            return send_success_response([], __('Profile URL updated.'));
        } catch (\Throwable $e) {
            Log::error('Save LinkedIn profile URL failed', ['message' => $e->getMessage()]);
            return send_exception_response($e->getMessage());
        }
    }

    protected function buildProfileUrl(string $platform, $socialUser): ?string
    {
        $nickname = $socialUser->getNickname();
        $id = $socialUser->getId();
        
        return match (strtolower($platform)) {
            'x', 'twitter' => $nickname ? "https://x.com/{$nickname}" : null,
            'facebook' => "https://facebook.com/{$id}",
            'instagram' => $nickname ? "https://instagram.com/{$nickname}" : null,
            'linkedin' => $nickname ? "https://www.linkedin.com/in/{$nickname}" : ($id ? 'https://www.linkedin.com/' : null),
            'youtube' => $nickname ? "https://youtube.com/@{$nickname}" : null,
            'twitch' => $nickname ? "https://twitch.tv/{$nickname}" : null,
            'kick' => $nickname ? "https://kick.com/{$nickname}" : null,
            default => null,
        };
    }

    /**
     * Try to get LinkedIn public profile URL (https://www.linkedin.com/in/{vanityName}) using the
     * OAuth access token. Tries OpenID userinfo first, then v2/me. LinkedIn often does not return
     * vanity name with standard OpenID scopes, so the manual "LinkedIn profile URL" field in
     * Settings is the reliable way for users to set their profile link.
     */
    protected function fetchLinkedInProfileUrl($socialUser): ?string
    {
        $token = $socialUser->token ?? null;
        if (!$token) {
            return null;
        }

        // Try OpenID Connect userinfo (may include profile URL in some configurations)
        try {
            $userinfo = Http::withToken($token)->get('https://api.linkedin.com/v2/userinfo');
            if ($userinfo->successful()) {
                $data = $userinfo->json();
                foreach (['profile', 'url', 'profile_url', 'vanityName', 'linkedin_url'] as $key) {
                    $val = $data[$key] ?? null;
                    if (is_string($val) && $val !== '' && preg_match('#linkedin\.com/in/[a-zA-Z0-9_-]+#', $val)) {
                        return strpos($val, 'http') === 0 ? $val : 'https://www.linkedin.com/in/' . trim($val);
                    }
                }
                $vanity = $data['vanityName'] ?? null;
                if (is_string($vanity) && $vanity !== '') {
                    return 'https://www.linkedin.com/in/' . trim($vanity);
                }
            }
        } catch (\Throwable $e) {
            Log::debug('LinkedIn userinfo failed', ['message' => $e->getMessage()]);
        }

        // Try legacy v2/me (requires r_basicprofile; often not granted)
        try {
            $response = Http::withToken($token)
                ->get('https://api.linkedin.com/v2/me', [
                    'projection' => '(id,vanityName,localizedFirstName,localizedLastName)',
                ]);
            if ($response->successful()) {
                $data = $response->json();
                $vanity = $data['vanityName'] ?? null;
                if ($vanity !== null && $vanity !== '') {
                    return 'https://www.linkedin.com/in/' . trim($vanity);
                }
            }
        } catch (\Throwable $e) {
            Log::debug('LinkedIn v2/me failed', ['message' => $e->getMessage()]);
        }

        return null;
    }

    /**
     * Fetch YouTube channel URL using the Google access token and YouTube Data API v3.
     * Requires the Google OAuth consent to include the YouTube scope (e.g. https://www.googleapis.com/auth/youtube.readonly).
     * Returns https://youtube.com/@customUrl or https://www.youtube.com/channel/CHANNEL_ID.
     */
    protected function fetchYouTubeChannelUrl($socialUser): ?string
    {
        $token = $socialUser->token ?? null;
        if (!$token) {
            return null;
        }
        try {
            $response = Http::withToken($token)
                ->get('https://www.googleapis.com/youtube/v3/channels', [
                    'part' => 'id,snippet',
                    'mine' => 'true',
                ]);
            if (!$response->successful()) {
                return null;
            }
            $data = $response->json();
            $items = $data['items'] ?? [];
            if (empty($items)) {
                return null;
            }
            $channel = $items[0];
            $channelId = $channel['id'] ?? null;
            $customUrl = $channel['snippet']['customUrl'] ?? null;
            if ($customUrl !== null && $customUrl !== '') {
                return 'https://www.youtube.com/' . ltrim($customUrl, '/');
            }
            if ($channelId !== null && $channelId !== '') {
                return 'https://www.youtube.com/channel/' . $channelId;
            }
        } catch (\Throwable $e) {
            Log::debug('YouTube channels list failed', ['message' => $e->getMessage()]);
        }
        return null;
    }

    protected function getDriverForPlatform(string $platform): ?string
    {
        return match ($platform) {
            'youtube' => 'google',
            'instagram' => 'instagram',
            'x' => 'twitter',
            'twitch' => 'twitch',
            'kick' => 'kick',
            'facebook' => 'facebook',
            'linkedin' => 'linkedin',
            default => null,
        };
    }

    /**
     * Get OAuth config for the given driver. Uses driver name for config key.
     * Falls back to env() when config is cached and missing credentials (e.g. server .env updated but config:clear not run).
     */
    protected function getDriverConfig(string $driver, string $platform): ?array
    {
        $config = config("services.{$driver}");
        if (!is_array($config)) {
            return null;
        }
        $callbackUrl = url("/connect/{$platform}/callback");
        $clientId = $config['client_id'] ?? null;
        $clientSecret = $config['client_secret'] ?? null;
        $redirect = $config['redirect'] ?? $callbackUrl;
        // Fallback to env() when config cache is stale (server .env has values but config was cached without them)
        $envMap = [
            'google'    => ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REDIRECT_URI'],
            'facebook'  => ['FACEBOOK_CLIENT_ID', 'FACEBOOK_CLIENT_SECRET', 'FACEBOOK_REDIRECT_URI'],
            'instagram' => ['INSTAGRAM_CLIENT_ID', 'INSTAGRAM_CLIENT_SECRET', 'INSTAGRAM_REDIRECT_URI'],
            'twitter'   => ['TWITTER_CLIENT_ID', 'TWITTER_CLIENT_SECRET', 'TWITTER_REDIRECT_URI'],
            'twitch'    => ['TWITCH_CLIENT_ID', 'TWITCH_CLIENT_SECRET', 'TWITCH_REDIRECT_URI'],
            'kick'      => ['KICK_CLIENT_ID', 'KICK_CLIENT_SECRET', 'KICK_REDIRECT_URI'],
            'linkedin'  => ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET', 'LINKEDIN_REDIRECT_URI'],
        ];
        if (isset($envMap[$driver]) && (empty($clientId) || empty($clientSecret))) {
            [$idKey, $secretKey, $redirectKey] = $envMap[$driver];
            $clientId = $clientId ?: env($idKey);
            $clientSecret = $clientSecret ?: env($secretKey);
            $redirect = $redirect ?: env($redirectKey) ?: $callbackUrl;
        }
        return [
            'client_id' => $clientId,
            'client_secret' => $clientSecret,
            'redirect' => $redirect ?: $callbackUrl,
        ];
    }

    /**
     * Apply client_id, client_secret, and redirect to the Socialite driver so providers
     * that rely on these (e.g. LinkedIn, Twitch, Kick) receive them. Laravel Socialite's
     * built-in providers (Facebook, Google, Twitter) read from config and do not have
     * setClientId/setClientSecret, so we only call these when the driver supports them.
     */
    protected function applyDriverConfig($socialite, array $config, string $callbackUrl): void
    {
        if (!empty($config['client_id']) && method_exists($socialite, 'setClientId')) {
            $socialite->setClientId($config['client_id']);
        }
        if (!empty($config['client_secret']) && method_exists($socialite, 'setClientSecret')) {
            $socialite->setClientSecret($config['client_secret']);
        }
        // redirectUrl() is already called before this; only call setRedirectUrl if the driver supports it
        if (method_exists($socialite, 'setRedirectUrl')) {
            $socialite->setRedirectUrl($callbackUrl);
        }
    }
}
