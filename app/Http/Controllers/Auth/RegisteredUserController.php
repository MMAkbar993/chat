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
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Http;
use Exception;
use App\Services\EncryptionService;
use App\Services\FirebaseService;
use Kreait\Firebase\Auth as FirebaseAuth;
use Kreait\Firebase\Factory;
use Kreait\Firebase\Database;
use Psy\Readline\Hoa\Console;

class RegisteredUserController extends Controller
{
    protected $encryptionService;
    protected $firebase;

    public function __construct(EncryptionService $encryptionService, FirebaseService $firebase)
    {
        $this->encryptionService = $encryptionService;
        $this->firebase = $firebase;
    }

    public function getDatabase()
    {
        return $this->firebase->getDatabase();
    }

    public function index()
    {
        $auth = $this->firebase->getAuth();
        return redirect()->route('login')->with('message', 'Firebase initialized successfully');
    }


    public function login()
    {
        return view('frontend.signin');
    }


    // Handle Firebase Login
    public function loginSubmit(Request $request)
    {
        $firebaseToken = $request->input('firebase_token');
        if ($firebaseToken) {
            return $this->firebaseLogin($firebaseToken);
        }

        // Fallback: form submitted with email+password (e.g. when Firebase JS fails to load)
        $email = trim($request->input('email', ''));
        $password = $request->input('password', '');
        if ($email && $password) {
            $result = $this->attemptLaravelLogin($email, $password);
            if ($result['success']) {
                return response()->view('auth.login-complete', [
                    'customToken' => $result['token'],
                    'firebaseConfig' => [
                        'apiKey' => env('FIREBASE_API_KEY'),
                        'authDomain' => env('FIREBASE_AUTH_DOMAIN'),
                        'databaseURL' => env('FIREBASE_DATABASE_URL'),
                        'projectId' => env('FIREBASE_PROJECT_ID'),
                        'storageBucket' => env('FIREBASE_STORAGE_BUCKET'),
                        'messagingSenderId' => env('FIREBASE_MESSAGING_SENDER_ID'),
                        'appId' => env('FIREBASE_APP_ID'),
                    ],
                    'chatUrl' => route('chat'),
                ]);
            }
            if ($result['json_error']) {
                return $result['json_error'];
            }
            return redirect()->route('login')->withErrors(['email' => $result['message'] ?? 'Invalid credentials.'])->withInput($request->only('email'));
        }

        return response()->json(['message' => 'Firebase token is required'], 400);
    }

    /**
     * Fallback login for users who exist in Laravel but not in Firebase (e.g. registered via new form before sync).
     * Verifies Laravel credentials, creates Firebase user if needed, returns a Firebase custom token so the client can sign in.
     * The frontend .env FIREBASE_PROJECT_ID must match the project_id in config/firebase_credentials.json or the token will be rejected (400).
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
            return response()->json(['firebase_custom_token' => $result['token']]);
        }
        if ($result['json_error']) {
            return $result['json_error'];
        }
        return response()->json(['message' => $result['message'] ?? 'Invalid credentials.'], 401);
    }

    /**
     * Attempt Laravel + Firebase login. Returns ['success' => true, 'token' => '...'] or
     * ['success' => false, 'message' => '...', 'json_error' => Response|null].
     */
    protected function attemptLaravelLogin(string $email, string $password): array
    {
        $user = User::whereRaw('LOWER(email) = ?', [strtolower($email)])->first();
        if (!$user) {
            return ['success' => false, 'message' => 'Invalid credentials.'];
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
            return ['success' => false, 'message' => 'Invalid credentials.'];
        }

        $credentialsPath = env('FIREBASE_CREDENTIALS')
            ? base_path(env('FIREBASE_CREDENTIALS'))
            : base_path('config/firebase_credentials.json');
        $credentialsPathLabel = env('FIREBASE_CREDENTIALS') ?: 'config/firebase_credentials.json';
        $envProjectId = env('FIREBASE_PROJECT_ID');
        if (file_exists($credentialsPath)) {
            $credentials = json_decode(file_get_contents($credentialsPath), true);
            $credentialsProjectId = $credentials['project_id'] ?? null;
            if ($credentialsProjectId && $envProjectId && $credentialsProjectId !== $envProjectId) {
                Log::warning('Firebase project mismatch', [
                    'credentials_project' => $credentialsProjectId,
                    'env_project' => $envProjectId,
                ]);
                return [
                    'success' => false,
                    'message' => 'Firebase project mismatch.',
                    'json_error' => response()->json([
                        'message' => 'Firebase project mismatch. Backend uses project "' . $credentialsProjectId . '" (' . $credentialsPathLabel . ') but .env has FIREBASE_PROJECT_ID="' . $envProjectId . '". Use one project: replace ' . $credentialsPathLabel . ' with the service account for "' . $envProjectId . '" (Firebase Console → Project settings → Service accounts → Generate new private key), or set all .env FIREBASE_* to the values for "' . $credentialsProjectId . '".',
                    ], 503),
                ];
            }
        }

        $firebaseUid = $this->firebase->createAuthUser($user->email, $password, $user->full_name ?? trim($user->first_name . ' ' . $user->last_name));
        if ($firebaseUid === null) {
            return [
                'success' => false,
                'message' => 'Unable to sign in.',
                'json_error' => response()->json(['message' => 'Unable to sign in. Please try again later.'], 503),
            ];
        }

        $nameParts = [$user->first_name ?? '', $user->last_name ?? ''];
        $this->firebase->syncUserToRealtimeDatabase($firebaseUid, [
            'firstName' => $nameParts[0],
            'lastName' => $nameParts[1] ?? '',
            'email' => $user->email,
            'mobile_number' => $user->mobile_number ?? '',
            'username' => $user->user_name ?? $user->email,
            'uid' => $firebaseUid,
            'id' => $firebaseUid,
            'image' => '',
            'name' => $user->mobile_number ?: ($user->user_name ?? $user->email),
            'nameToDisplay' => $user->full_name ?? trim($user->first_name . ' ' . $user->last_name),
            'profileName' => $user->user_name ?? $user->email,
            'online' => false,
            'selected' => false,
            'osType' => 'web',
            'typing' => '',
            'deviceToken' => '',
            'status' => 'Hey I am available',
            'timestamp' => time(),
        ]);

        try {
            $customToken = $this->firebase->createCustomToken($firebaseUid);
            $tokenString = is_string($customToken) ? trim($customToken) : trim($customToken->toString());
            return ['success' => true, 'token' => $tokenString];
        } catch (\Throwable $e) {
            Log::error('Firebase createCustomToken failed', ['uid' => $firebaseUid, 'message' => $e->getMessage()]);
            return [
                'success' => false,
                'message' => 'Could not create sign-in token.',
                'json_error' => response()->json(['message' => 'Could not create sign-in token. Check Firebase credentials and that FIREBASE_PROJECT_ID in .env matches config/firebase_credentials.json project_id.'], 503),
            ];
        }
    }

    protected function firebaseLogin($firebaseToken)
{
    try {
        Log::info('Received Firebase token', ['token' => $firebaseToken]);

        // Retrieve the Firebase Auth instance from the FirebaseService
        $firebaseAuth = $this->firebase->getAuth();

        // Verify the Firebase token
        $verifiedIdToken = $firebaseAuth->verifyIdToken($firebaseToken);
        
        // Instead of toArray(), you can access claims like this:
        $claims = $verifiedIdToken->claims();

        // Log specific claims for debugging
        Log::info('Verified token claims', [
            'uid' => $claims->get('sub'), // User ID
            'email' => $claims->get('email'), // Email
            'issuedAt' => $claims->get('iat'), // Issued at
            'expiresAt' => $claims->get('exp'), // Expiration
            'issuer' => $claims->get('iss'), // Issuer
            'audience' => $claims->get('aud') // Audience
        ]);

        $uid = $claims->get('sub'); // Get the user ID
        $firebaseUser = $firebaseAuth->getUser($uid);
        
        // Save device info to the database
        $this->saveDeviceInfo($uid, $firebaseUser);

        return redirect()->route('chat')->with('success', 'Login successful!');
    } catch (\Exception $exception) {
        Log::error('Firebase token verification failed', [
            'error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString()
        ]);
        return response()->json(['message' => 'Invalid Firebase token'], 401);
    }
}

    // protected function firebaseLogin($firebaseToken)
    // {
    //     try {
    //         Log::info('Received Firebase token', ['token' => $firebaseToken]);
    //         // Retrieve the Firebase Auth instance from the FirebaseService
    //         $firebaseAuth = $this->firebase->getAuth();
    
    //         // Verify the Firebase token
    //         $verifiedIdToken = $firebaseAuth->verifyIdToken($firebaseToken);
    //         $uid = $verifiedIdToken->claims()->get('sub');
    //         $firebaseUser = $firebaseAuth->getUser($uid);
            
    //         // Save device info to the database
    //         $this->saveDeviceInfo($uid, $firebaseUser);

    //         return redirect()->route('chat')->with('success', 'Login successful!');
    
    //         // Return user details in the response
    //         // return response()->json([
    //         //     'message' => 'Login successful',
    //         //     'user' => [
    //         //         'id' => $firebaseUser->uid, // Firebase UID
    //         //         'name' => $firebaseUser->displayName, // User's display name
    //         //         'email' => $firebaseUser->email, // User's email
    //         //         'photo_url' => $firebaseUser->photoUrl // User's photo URL if available
    //         //     ]
    //         // ], 200);
            
    //     } catch (\Exception | \Throwable $exception) {
    //         return response()->json(['message' => 'Invalid Firebase token'], 401);
    //     }
    // }
    
    protected function saveDeviceInfo($uid, $firebaseUser)
    {
        if (!$this->firebase->hasDatabase()) {
            return;
        }
        try {
            $deviceInfo = [
                'device_name' => $this->getUserDeviceInfo(),
                'last_used' => now()->toDateTimeString()
            ];
            $this->firebase->getDatabase()->getReference("users/{$uid}/devices")->push($deviceInfo);
            Log::info('Device info saved', [$deviceInfo]);
        } catch (\Throwable $e) {
            Log::warning('Firebase device info save failed', ['uid' => $uid, 'message' => $e->getMessage()]);
        }
    }
    

protected function getUserDeviceInfo()
{
    // You can retrieve the device information using user-agent or other methods
    return request()->userAgent(); // This will return the user-agent string
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
     * Step 1: Personal info + Role + T&C (Affiliate Roulette).
     * Creates user with subscription_status = pending_payment; redirects to Step 2 (payment).
     */
    public function register(StoreRegistrationRequest $request)
    {
        $companyDomain = $this->extractDomain($request->input('company_website', ''));

        $nameParts = $this->splitFullName($request->input('full_name'));

        $user = User::create([
            'first_name' => $nameParts[0],
            'last_name' => $nameParts[1],
            'full_name' => $request->input('full_name'),
            'email' => $request->input('email'),
            'user_name' => $request->input('user_name'),
            'password' => Hash::make($request->input('password')),
            'user_type' => 2, // frontendUser
            'mobile_number' => $request->input('mobile_number', ''),
            'company_name' => $request->input('company_name'),
            'company_domain' => $companyDomain,
            'country' => $request->input('country'),
            'primary_role' => $request->input('primary_role'),
            'other_role_text' => $request->input('primary_role') === 'other' ? $request->input('other_role_text') : null,
            'terms_accepted_at' => now(),
            'subscription_status' => 'pending_payment',
        ]);

        $user->assignRole('user');

        // Sync to Firebase Auth + RTDB so the user can sign in with Firebase (email/password) on the login page
        $password = $request->input('password');
        $firebaseUid = $this->firebase->createAuthUser($user->email, $password, $user->full_name ?? $user->first_name . ' ' . $user->last_name);
        if ($firebaseUid !== null) {
            $this->firebase->syncUserToRealtimeDatabase($firebaseUid, [
                'firstName' => $nameParts[0],
                'lastName' => $nameParts[1] ?? '',
                'email' => $user->email,
                'mobile_number' => $user->mobile_number ?? '',
                'username' => $user->user_name,
                'uid' => $firebaseUid,
                'id' => $firebaseUid,
                'image' => '',
                'name' => $user->mobile_number ?: $user->user_name,
                'nameToDisplay' => $user->full_name ?? ($user->first_name . ' ' . $user->last_name),
                'profileName' => $user->user_name,
                'online' => false,
                'selected' => false,
                'osType' => 'web',
                'typing' => '',
                'deviceToken' => '',
                'status' => 'Hey I am available',
                'timestamp' => time(),
            ]);
        }

        $request->session()->put('registered_user_id', $user->id);

        if ($request->wantsJson()) {
            return response()->json([
                'message' => __('Registration successful. Please complete payment.'),
                'redirect' => route('register.payment'),
            ], 201);
        }

        return redirect()->route('register.payment')->with('success', __('Registration successful. Please complete payment to continue.'));
    }

    protected function extractDomain(string $url): ?string
    {
        if ($url === '') {
            return null;
        }
        if (! preg_match('#^https?://#i', $url)) {
            $url = 'https://' . $url;
        }
        $host = parse_url($url, PHP_URL_HOST);
        return is_string($host) ? strtolower($host) : null;
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
                    Auth::login($user);
                } else {
                    $user = User::create([
                        'user_name' => $socialUser->getName(),
                        'email' => $socialUser->getEmail(),
                        'facebook_id' => $socialUser->getId(),
                    ]);
                    Auth::login($user);
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
                    Auth::login($user);
                } else {
                    $user = User::create([
                        'user_name' => $socialUser->getName(),
                        'email' => $socialUser->getEmail(),
                        'google_id' => $socialUser->getId(),
                    ]);
                    Auth::login($user);
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

            if (!$token) {
                return redirect()->back()->withErrors('Logout failed: No token provided.');
            }

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $token,
                'Accept' => 'application/json',
            ])->post(url('/api/logout'));

            if ($response->successful()) {
                $request->session()->flush();
                return redirect()->route('signin')->with('success', 'Successfully logged out');
            } else {
                $errorMessage = $response->json()['message'] ?? 'Logout failed. Please try again.';
                return redirect()->back()->withErrors($errorMessage);
            }
        } catch (\Exception $exception) {
            Log::error('Logout Exception:', ['message' => $exception->getMessage()]);
            return redirect()->back()->withErrors('Logout failed: ' . $exception->getMessage());
        }
    }
}
