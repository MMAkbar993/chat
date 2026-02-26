<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Kreait\Firebase\Factory;
use Illuminate\Support\Facades\File;

class AgoraController extends Controller
{
    protected $auth;


    public function updateAgoraConfig(Request $request)
    {
        // Validate incoming request data
        $validated = $request->validate([
            'AGORA_APP_ID' => 'required|string',
            'AGORA_APP_CERTIFICATE' => 'required|string',
        ]);

        // Prepare .env file path
        $envPath = base_path('.env');

        // Update the .env file with the new values
        foreach ($validated as $key => $value) {
            $this->updateEnvFile($envPath, $key, $value);
        }

        return response()->json(['message' => 'Agora config updated successfully.']);
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
