<?php
namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use Socialite;
use JWTAuth;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;

class SocialLoginController extends Controller
{
    private $encryptionService;

    public function __construct()
    {
        $this->encryptionService = new \App\Services\EncryptionService; // Assuming you have created this service
    }

    // Redirect to Google
    public function redirectToGoogle()
    {
        return Socialite::driver('google')->stateless()->redirect();
    }

    // Handle Google callback
    public function handleGoogleCallback()
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
            return $this->loginOrRegister($googleUser, 'google');
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // Redirect to Facebook
    public function redirectToFacebook()
    {
        return Socialite::driver('facebook')->stateless()->redirect();
    }

    // Handle Facebook callback
    public function handleFacebookCallback()
    {
        try {
            $facebookUser = Socialite::driver('facebook')->stateless()->user();
            return $this->loginOrRegister($facebookUser, 'facebook');
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // Common function for both Google and Facebook login
    private function loginOrRegister($socialUser, $provider)
    {
        // Find user by provider ID (Google ID or Facebook ID)
        $user = User::where('provider_id', $socialUser->getId())
                    ->where('provider', $provider)
                    ->first();

        // If user does not exist, create a new one
        if (!$user) {
            $user = new User();
            $user->name = $socialUser->getName(); // Ensure this is populated correctly
            $user->email = $socialUser->getEmail();
            $user->provider_id = $socialUser->getId();
            $user->provider = $provider;

            // Encrypt a random password using libsodium (since social login doesn't use passwords)
            $encryptedPassword = $this->encryptionService->encryptData(Str::random(16));
            $user->password = $encryptedPassword;

            $user->save();
        }

        // Authenticate the user by generating a JWT token
        $jwt_token = [
            'user_id' => $user->id,
        ];

        $myTTL = 60 * 720; // Token time to live
        JWTAuth::factory()->setTTL($myTTL);
        $valid_token = JWTAuth::claims($jwt_token)->fromUser($user);

        if (!$valid_token) {
            return response()->json(['error' => 'Empty token'], 400);
        }

        // Update last login
        $user->last_login_at = now();
        $user->save();

        // Return success response with token
        return response()->json([
            'token' => $valid_token,
            'user' => $user,
        ], 200);
    }
}
