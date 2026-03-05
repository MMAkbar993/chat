<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Http\Requests\StoreRegistrationRequest;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Http;
use Exception;
use App\Services\EncryptionService;

class RegisteredUserController extends Controller
{
    protected $encryptionService;

    public function __construct(EncryptionService $encryptionService)
    {
        $this->encryptionService = $encryptionService;
    }

    public function login()
    {
        return view('frontend.signin');
    }

    /**
     * Handle login with email + password (Laravel session only).
     */
    public function loginSubmit(Request $request)
    {
        try {
            $email = trim($request->input('email', ''));
            $password = $request->input('password', '');
            if (!$email || !$password) {
                if ($request->wantsJson()) {
                    return response()->json(['message' => 'Email and password are required.'], 400);
                }
                return redirect()->route('login')->withErrors(['email' => __('Email and password are required.')])->withInput($request->only('email'));
            }

            $result = $this->attemptLaravelLogin($email, $password);
            if ($result['success']) {
                if (!empty($result['needs_2fa'])) {
                    if ($request->wantsJson()) {
                        return response()->json(['success' => true, 'needs_2fa' => true, 'redirect' => route('2fa.challenge')]);
                    }
                    return redirect()->route('2fa.challenge');
                }
                if ($request->wantsJson()) {
                    return response()->json(['success' => true, 'redirect' => route('chat')]);
                }
                return redirect()->intended(route('chat'));
            }
            if ($result['json_error']) {
                return $result['json_error'];
            }
            return redirect()->route('login')->withErrors(['email' => $result['message'] ?? __('Invalid credentials.')])->withInput($request->only('email'));
        } catch (\Throwable $e) {
            Log::error('Login failed', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);
            if ($request->expectsJson()) {
                return response()->json(['message' => 'A server error occurred during login. Please try again or contact support.'], 500);
            }
            return redirect()->route('login')
                ->withErrors(['email' => 'A server error occurred. Please try again or contact support.'])
                ->withInput($request->only('email'));
        }
    }

    /**
     * API: Laravel-only login (e.g. for AJAX). Returns success + redirect URL.
     */
    public function loginWithLaravel(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $result = $this->attemptLaravelLogin(
            trim($request->input('email')),
            trim($request->input('password'))
        );

        if ($result['success']) {
            if (!empty($result['needs_2fa'])) {
                return response()->json(['needs_2fa' => true, 'redirect' => route('2fa.challenge')]);
            }
            return response()->json(['success' => true, 'redirect' => route('chat')]);
        }
        if ($result['json_error']) {
            return $result['json_error'];
        }
        return response()->json(['message' => $result['message'] ?? __('Invalid credentials.')], 401);
    }

    /**
     * Attempt Laravel login. Returns ['success' => true] or ['success' => false, 'message' => '...', 'json_error' => Response|null].
     */
    protected function attemptLaravelLogin(string $email, string $password): array
    {
        $user = User::whereRaw('LOWER(email) = ?', [strtolower($email)])->first();
        if (!$user) {
            return ['success' => false, 'message' => __('Invalid credentials.'), 'json_error' => null];
        }

        $passwordValid = Hash::check($password, $user->password);
        if (!$passwordValid) {
            try {
                $decrypted = $this->encryptionService->decryptData($user->password);
                $passwordValid = ($decrypted !== false && $decrypted === $password);
            } catch (\Throwable $e) {
                // Not encrypted or decryption failed
            }
        }
        if (!$passwordValid) {
            return ['success' => false, 'message' => __('Invalid credentials.'), 'json_error' => null];
        }

        Auth::login($user, request()->boolean('remember', false));
        $user->last_login_at = now();
        $user->save();

        if ($user->has2faEnabled() && !request()->session()->get('2fa_verified')) {
            return ['success' => true, 'needs_2fa' => true];
        }
        return ['success' => true];
    }

    // Handle Normal Login
    public function normalLogin(Request $request)
    {
        // Validate the email and password input
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        // Attempt to log in with normal credentials
        if (Auth::attempt($credentials)) {
            // Authentication passed

            // Redirect to the index page after normal login
            return redirect()->route('index'); // assuming 'index' is your route name

        } else {
            return redirect()->back()->withErrors(['message' => 'Invalid email or password']);
        }
    }

    public function signup()
    {
        return view('frontend.signup', [
            'primaryRoles' => config('registration.primary_roles', []),
        ]);
    }

    /**
     * Step 1: Personal info + Role + T&C.
     * Creates user with subscription_status = pending_payment.
     * Flow: Register → Payment (setup, no charge) → KYC → auto-charge on approval.
     */
    public function register(StoreRegistrationRequest $request)
    {
        $nameParts = $this->splitFullName($request->input('full_name'));

        $user = User::create([
            'first_name' => $nameParts[0],
            'last_name' => $nameParts[1],
            'full_name' => $request->input('full_name'),
            'email' => $request->input('email'),
            'user_name' => $request->input('user_name'),
            'password' => Hash::make($request->input('password')),
            'user_type' => 2,
            'mobile_number' => $request->input('mobile_number') ?? '',
            'company_name' => null,
            'company_domain' => null,
            'country' => $request->input('country'),
            'primary_role' => $request->input('primary_role'),
            'other_role_text' => $request->input('primary_role') === 'other' ? $request->input('other_role_text') : null,
            'terms_accepted_at' => now(),
            'subscription_status' => 'pending_payment',
        ]);

        $user->assignRole('user');

        $request->session()->put('registered_user_id', $user->id);

        if ($request->wantsJson()) {
            return response()->json([
                'message' => __('Registration successful.'),
                'user_email' => $user->email,
                'plans' => config('stripe.plans'),
            ], 201);
        }

        return redirect()->route('register.payment')->with('success', __('Registration successful. Please complete payment to continue.'));
    }


    protected function splitFullName(string $fullName): array
    {
        $parts = preg_split('/\s+/', trim($fullName), 2);
        return [
            $parts[0] ?? '',
            $parts[1] ?? '',
        ];
    }

    /**
     * Step 2: Payment (placeholder until Stripe is integrated).
     */
    public function registerPaymentStep()
    {
        return view('frontend.register-payment', [
            'plans' => config('stripe.plans'),
        ]);
    }

    public function registerSubmit(Request $request)
    {    
        $fullName = $request->first_name . ' ' . $request->last_name;    
        $rules = [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'user_name' => 'required|string|max:255|unique:users',
            'mobile_number' => 'required|unique:users',
            'terms' => 'accepted',
        ];
        $request->merge(['name' => $fullName]);
        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            Log::info('Try Register Inside');

            $dataToEncrypt = [
                'name' => $fullName,
                'email' => $request->email,
                'user_name' => $request->user_name,
                'mobile_number' => $request->mobile_number,
                'password' => $request->password,
            ];

            $encryptedData = $this->encryptionService->encryptData(json_encode($dataToEncrypt));

            Log::info('Encrypted Data: ', [$encryptedData]);

            $response = Http::withHeaders([
                'Accept' => 'application/json'
            ])->post(url('/api/register'), [
                'values' => $encryptedData,
            ]);
    
            Log::info('API Response Status: ' . $response->status());
            Log::info('API Response Body: ' . $response->body());
    
            if ($response->successful()) {
                Log::info('Try Register Success');
                return redirect()->route('signin')->with('success', 'Registration successful!');
            } else {
                Log::info('Try Register Error');
                return back()->withErrors(['error' => $response->json()['message'] ?? 'Registration failed']);
            }
        } catch (\Exception $e) {
            Log::info('Try Register Catch Error');
            Log::error('Exception Message:', ['message' => $e->getMessage()]);
            return back()->withErrors(['error' => 'Unable to register. Please try again later.']);
        }
    }  

    public function redirectToFacebook()
    {
        return Socialite::driver('facebook')->redirect();
    }

    public function handleFacebookCallback()
    {
        try {
            $socialUser = Socialite::driver('facebook')->user();

            $response = Http::post(url('/api/login/facebook/callback'), [
                'name' => $socialUser->getName(),
                'email' => $socialUser->getEmail(),
                'facebook_id' => $socialUser->getId(),
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $user = User::where('email', $socialUser->getEmail())->first();

                if ($user) {
                    Auth::login($user, true);
                } else {
                    $user = User::create([
                        'user_name' => $socialUser->getName(),
                        'email' => $socialUser->getEmail(),
                        'facebook_id' => $socialUser->getId(),
                    ]);
                    Auth::login($user, true);
                }

                return redirect()->route('index')->with('success', 'Login successful!');
            } else {
                return redirect()->route('signin')->withErrors(['error' => $response->json()['message'] ?? 'Login failed']);
            }
        } catch (\Exception $e) {
            return redirect()->route('signin')->withErrors(['error' => 'Login failed: ' . $e->getMessage()]);
        }
    }

    public function redirectToGoogle()
    {
        return Socialite::driver('google')->redirect();
    }

    public function handleGoogleCallback()
    {
        try {
            $socialUser = Socialite::driver('google')->user();

            $response = Http::post(url('/api/login/google/callback'), [
                'name' => $socialUser->getName(),
                'email' => $socialUser->getEmail(),
                'google_id' => $socialUser->getId(),
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $user = User::where('email', $socialUser->getEmail())->first();

                if ($user) {
                    Auth::login($user, true);
                } else {
                    $user = User::create([
                        'user_name' => $socialUser->getName(),
                        'email' => $socialUser->getEmail(),
                        'google_id' => $socialUser->getId(),
                    ]);
                    Auth::login($user, true);
                }

                return redirect()->route('index')->with('success', 'Login successful!');
            } else {
                return redirect()->route('signin')->withErrors(['error' => $response->json()['message'] ?? 'Login failed']);
            }
        } catch (\Exception $e) {
            return redirect()->route('signin')->withErrors(['error' => 'Login failed: ' . $e->getMessage()]);
        }
    }

    public function logoutSubmit(Request $request)
    {
        try {
            $token = $request->session()->get('jwt_token');

            if ($token) {
                $response = Http::withHeaders([
                    'Authorization' => 'Bearer ' . $token,
                    'Accept' => 'application/json',
                ])->post(url('/api/logout'));
                // Continue to flush session even if API call fails (user may not have JWT)
            }

            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            if ($request->expectsJson()) {
                return response()->json(['message' => 'Successfully logged out']);
            }
            return redirect()->route('login')->with('success', 'Successfully logged out');
        } catch (\Exception $exception) {
            Log::error('Logout Exception:', ['message' => $exception->getMessage()]);
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Logout failed'], 500);
            }
            return redirect()->route('login')->withErrors('Logout failed. Please try again.');
        }
    }
}
