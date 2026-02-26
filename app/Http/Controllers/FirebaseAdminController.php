<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Kreait\Firebase\Factory;
use App\Models\FirebaseSetting;
use Illuminate\Support\Facades\File;

class FirebaseAdminController extends Controller
{
    protected $auth;

    public function __construct()
    {
        $credentialsPath = storage_path('firebase/firebase_credentials.json');
        // Initialize Firebase Authentication
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
