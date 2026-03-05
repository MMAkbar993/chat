<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\SocialAccount;
use App\Services\EncryptionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
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
            $socialite = Socialite::driver($driver)->stateless();
            // Facebook driver is used for both Facebook and Instagram; each has its own callback URL
            if ($driver === 'facebook') {
                $socialite->redirectUrl(url("/connect/{$platform}/callback"));
            }
            // Google driver is used for YouTube; use the correct callback URL for this platform
            if ($driver === 'google') {
                $socialite->redirectUrl(url("/connect/{$platform}/callback"));
            }
            return $socialite->redirect();
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
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

            $socialUser = Socialite::driver($driver)->stateless()->user();

            SocialAccount::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'platform' => $platform,
                ],
                [
                    'platform_user_id' => $socialUser->getId(),
                    'username' => $socialUser->getNickname() ?? $socialUser->getName(),
                    'profile_url' => $socialUser->getAvatar(),
                    'oauth_verified' => true,
                    'oauth_data' => [
                        'name' => $socialUser->getName(),
                        'email' => $socialUser->getEmail(),
                    ],
                ]
            );

            return redirect()->route('settings')->with('success', ucfirst($platform) . ' account connected successfully.');
        } catch (\Exception $e) {
            return redirect()->route('settings')->with('error', $e->getMessage());
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

            $account->delete();
            return send_success_response([], 'Account disconnected.');
        } catch (\Exception $e) {
            return send_exception_response($e->getMessage());
        }
    }

    protected function getDriverForPlatform(string $platform): ?string
    {
        return match ($platform) {
            'youtube' => 'google',
            'instagram' => 'facebook',
            'x' => 'twitter',
            'twitch' => 'twitch',
            'kick' => 'kick',
            'facebook' => 'facebook',
            'linkedin' => 'linkedin',
            default => null,
        };
    }
}
