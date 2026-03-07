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
            return $socialite->redirect();
        } catch (\Throwable $e) {
            $msg = $e->getMessage();
            Log::error('Social connect redirect failed', [
                'platform' => $platform,
                'message' => $msg,
                'exception' => get_class($e),
                'trace' => $e->getTraceAsString(),
            ]);
            if (str_contains($msg, 'Driver [kick] not supported') || str_contains($msg, 'not supported')) {
                return response()->json(['error' => 'Kick OAuth driver is not registered. Run: php artisan config:clear and ensure KICK_CLIENT_ID, KICK_CLIENT_SECRET, KICK_REDIRECT_URI are set in .env.'], 400);
            }
            // Return redirect for popup UX: show settings with error instead of raw 500
            return redirect()->route('settings')->with('error', __('Social verification failed. Please check OAuth settings in .env (client_id, client_secret, redirect URI) and try again.'));
        }
    }

    /**
     * Return a 400 JSON or redirect with platform-specific "not configured" message.
     */
    protected function platformConfigError(string $platform): \Illuminate\Http\JsonResponse|\Illuminate\Http\RedirectResponse
    {
        $messages = [
            'instagram' => 'Instagram OAuth is not configured. Set INSTAGRAM_CLIENT_ID, INSTAGRAM_CLIENT_SECRET, and INSTAGRAM_REDIRECT_URI in .env (see docs/WEBSITE_SOCIAL_VERIFICATION.md).',
            'youtube'   => 'YouTube uses Google OAuth. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI in .env. In Google Cloud Console add the exact redirect URI.',
            'facebook'  => 'Facebook OAuth is not configured. Set FACEBOOK_CLIENT_ID, FACEBOOK_CLIENT_SECRET, FACEBOOK_REDIRECT_URI in .env and whitelist the redirect URI in the Facebook App.',
            'linkedin'  => 'LinkedIn OAuth is not configured. Set LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, LINKEDIN_REDIRECT_URI in .env (redirect must match exactly in LinkedIn Developer Portal).',
            'x'         => 'X (Twitter) OAuth is not configured. Set TWITTER_CLIENT_ID, TWITTER_CLIENT_SECRET, TWITTER_REDIRECT_URI in .env (OAuth 2.0).',
            'kick'      => 'Kick OAuth is not configured. Set KICK_CLIENT_ID, KICK_CLIENT_SECRET, KICK_REDIRECT_URI in .env and run php artisan config:clear.',
            'twitch'    => 'Twitch OAuth is not configured. Set TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET, TWITCH_REDIRECT_URI in .env.',
        ];
        $message = $messages[strtolower($platform)] ?? 'Platform OAuth is not configured. Set client_id and client_secret in .env and config/services.php.';
        return response()->json(['error' => $message], 400);
    }

    public function callback(Request $request, string $platform): \Illuminate\Http\RedirectResponse|\Illuminate\Http\JsonResponse
    {
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

            // Never use avatar URL as profile_url; profile_url is the public profile page only
            SocialAccount::updateOrCreate(
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
            return response('<script>window.opener ? (window.opener.location.reload(), window.close()) : (window.location.href="'.route('settings').'");</script>');
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
            session()->flash('error', $userMessage);
            return response('<script>window.opener ? (window.opener.location.reload(), window.close()) : (window.location.href="'.route('settings').'");</script>');
        }
    }

    public function disconnect(Request $request, int $id): \Illuminate\Http\JsonResponse
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
                    Log::warning('Social disconnect: could not clear user_details', ['user_id' => $user->id, 'platform' => $platform, 'message' => $e->getMessage()]);
                }
            }

            $userName = $user->user_name ?? '';
            if ($userName !== '') {
                Cache::forget('public_profile:' . strtolower($userName));
            }
            return send_success_response([], 'Account disconnected.');
        } catch (\Throwable $e) {
            Log::error('Social disconnect failed', ['id' => $id, 'message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
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
     * OAuth access token. LinkedIn OpenID often does not return vanityName; GET /v2/me can return it
     * if the token has the right scopes (e.g. r_basicprofile). If the API call fails or vanityName
     * is missing, returns null so the caller keeps the fallback URL.
     */
    protected function fetchLinkedInProfileUrl($socialUser): ?string
    {
        $token = $socialUser->token ?? null;
        if (!$token) {
            return null;
        }
        try {
            $response = Http::withToken($token)
                ->get('https://api.linkedin.com/v2/me', [
                    'projection' => '(id,vanityName,localizedFirstName,localizedLastName)',
                ]);
            if (!$response->successful()) {
                return null;
            }
            $data = $response->json();
            $vanity = $data['vanityName'] ?? null;
            if ($vanity !== null && $vanity !== '') {
                return 'https://www.linkedin.com/in/' . trim($vanity);
            }
        } catch (\Throwable $e) {
            Log::debug('LinkedIn v2/me failed', ['message' => $e->getMessage()]);
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
     */
    protected function getDriverConfig(string $driver, string $platform): ?array
    {
        $config = config("services.{$driver}");
        if (!is_array($config)) {
            return null;
        }
        $callbackUrl = url("/connect/{$platform}/callback");
        return [
            'client_id' => $config['client_id'] ?? null,
            'client_secret' => $config['client_secret'] ?? null,
            'redirect' => $config['redirect'] ?? $callbackUrl,
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
