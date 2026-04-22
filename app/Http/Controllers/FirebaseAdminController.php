<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Kreait\Firebase\Factory;
use App\Models\FirebaseSetting;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;

class FirebaseAdminController extends Controller
{
    protected $auth;

    /** @var string|null Set when credentials project_id does not match FIREBASE_PROJECT_ID (causes 400 on signInWithCustomToken) */
    protected $credentialsProjectMismatch = null;

    public function __construct()
    {
        $credentialsPath = storage_path('firebase/firebase_credentials.json');
        $expectedProjectId = config('firebase.frontend.project_id') ?? env('FIREBASE_PROJECT_ID');
        if ($expectedProjectId && is_file($credentialsPath)) {
            $credentials = json_decode(File::get($credentialsPath), true);
            $credProjectId = $credentials['project_id'] ?? null;
            if ($credProjectId !== null && $credProjectId !== $expectedProjectId) {
                $this->credentialsProjectMismatch = "Credentials are for project \"{$credProjectId}\" but .env FIREBASE_PROJECT_ID is \"{$expectedProjectId}\". Replace storage/firebase/firebase_credentials.json with the service account key for {$expectedProjectId} (Firebase Console → Project Settings → Service accounts).";
            }
        }
        $firebase = (new Factory)->withServiceAccount($credentialsPath);
        $this->auth = $firebase->createAuth();
    }

    public function createUser(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
            'firstName' => 'nullable|string',
            'lastName' => 'nullable|string',
            'mobile_number' => 'nullable|unique:users,mobile_number',
            'country' => 'nullable|string',
        ]);

        try {
            // Create a new user in Firebase Authentication
            $userProperties = [
                'email' => $data['email'],
                'emailVerified' => false,
                'password' => $data['password'],
                'displayName' => trim($data['firstName'] . ' ' . $data['lastName']), // Use trim to avoid leading/trailing spaces
                'disabled' => false,
            ];

            $createdUser = $this->auth->createUser($userProperties);

            return response()->json([
                'status' => 'success',
                'message' => 'User created successfully',
                'uid' => $createdUser->uid,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function saveSettings(Request $request)
    {
        // Validate the incoming request
        $data = $request->validate([
            'application_key' => 'required|string',
            'authnticate_domain' => 'required|string',
            'database_url' => 'required|string',
            'project_id' => 'required|string',
            'storage_bucket' => 'required|string',
            'message_id' => 'required|string',
            'application_id' => 'required|string',
        ]);

        // Check if a record with id = 1 exists
        $firebaseSetting = FirebaseSetting::find(1);

        if ($firebaseSetting) {
            // If record with id 1 exists, update it
            $firebaseSetting->update($data);
            $message = 'Settings updated successfully.';
        } else {
            // If record with id 1 does not exist, create a new record
            FirebaseSetting::create($data);
            $message = 'Settings saved successfully.';
        }

        return response()->json(['success' => true, 'message' => $message]);
    }

    public function showSettings()
    {
        // Get the settings data with id 1 if it exists

        $firebaseSetting = [
            'application_key' =>'AIzaSyBYiaLcIIiFkdKzumpFtOj44mqujGBvSHg',
            'authnticate_domain' => 'dreams-chat-ef2a3.firebaseapp.com',
            'database_url' => 'https://dreams-chat-ef2a3-default-rtdb.firebaseio.com',
            'project_id' => 'dreams-chat-ef2a3',
            'storage_bucket' => 'dreams-chat-ef2a3.appspot.com',
            'message_id' => '796333020052',
            'application_id' => '1:796333020052:web:94311f4f858a35ab0f7581',
        ];
    
        // Return the settings as JSON
        return response()->json($firebaseSetting);

    }

    public function updateFirebaseConfig(Request $request)
    {
        // Validate incoming request data
        $validated = $request->validate([
            'FIREBASE_API_KEY' => 'required|string',
            'FIREBASE_AUTH_DOMAIN' => 'required|string',
            'FIREBASE_DATABASE_URL' => 'required|string',
            'FIREBASE_PROJECT_ID' => 'required|string',
            'FIREBASE_STORAGE_BUCKET' => 'required|string',
            'FIREBASE_MESSAGING_SENDER_ID' => 'required|string',
            'FIREBASE_APP_ID' => 'required|string',
        ]);

        // Prepare .env file path
        $envPath = base_path('.env');

        // Update the .env file with the new values
        foreach ($validated as $key => $value) {
            $this->updateEnvFile($envPath, $key, $value);
        }

        return response()->json(['message' => 'Firebase config updated successfully.']);
    }

    /**
     * Return a Firebase custom token for the authenticated user so the frontend can
     * restore the chat session (sign in to Firebase) without re-entering password.
     * Requires auth middleware. Returns 401 if not logged in, 400 if user has no firebase_uid.
     */
    public function restoreChatSession(Request $request)
    {
        if ($this->credentialsProjectMismatch !== null) {
            return response()->json([
                'error' => 'firebase_project_mismatch',
                'message' => $this->credentialsProjectMismatch,
            ], 500);
        }
        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'not_authenticated'], 401);
        }
        if (!Schema::hasColumn($user->getTable(), 'firebase_uid')) {
            return response()->json(['error' => 'no_firebase_uid'], 400);
        }
        $firebaseUid = $user->firebase_uid ?? '';
        if ($firebaseUid === '') {
            // Lazy-link: if user has email, try to find existing Firebase user by email and set firebase_uid
            $email = $user->email ?? '';
            if ($email !== '') {
                try {
                    $firebaseUser = $this->auth->getUserByEmail($email);
                    $firebaseUid = $firebaseUser->uid;
                    $user->firebase_uid = $firebaseUid;
                    $user->saveQuietly();
                } catch (\Throwable $e) {
                    // No Firebase user for this email; return 400 so frontend can prompt re-login or setup
                    return response()->json([
                        'error' => 'no_firebase_uid',
                        'message' => 'Account not linked to chat. Please log out and log in again.',
                    ], 400);
                }
            }
            if ($firebaseUid === '') {
                return response()->json([
                    'error' => 'no_firebase_uid',
                    'message' => 'Account not linked to chat. Please log out and log in again.',
                ], 400);
            }
        }
        try {
            $customToken = $this->auth->createCustomToken($firebaseUid);
            $tokenString = is_string($customToken) ? $customToken : $customToken->toString();
            return response()->json(['firebase_custom_token' => $tokenString]);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'token_failed', 'message' => $e->getMessage()], 500);
        }
    }

    // Helper function to update the .env file
    private function updateEnvFile($envPath, $key, $value)
    {
        // Read .env file
        $envContents = File::get($envPath);

        // Check if the key exists in the .env file
        if (strpos($envContents, "{$key}=") !== false) {
            // Replace existing value
            $envContents = preg_replace("/^{$key}=[^\n]*/m", "{$key}={$value}", $envContents);
        } else {
            // Add new key-value pair
            $envContents .= "\n{$key}={$value}";
        }

        // Write updated content back to the .env file
        File::put($envPath, $envContents);
    }
}
