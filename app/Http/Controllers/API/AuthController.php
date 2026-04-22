<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Services\EncryptionService;
use App\Models\User;
use Illuminate\Http\JsonResponse;  // Add this import for return type

class AuthController extends Controller
{
    // Specify the type of the $encryptionService property
    protected EncryptionService $encryptionService;

    // Constructor with type hinting for the $encryptionService parameter
    public function __construct(EncryptionService $encryptionService)
    {
        $this->encryptionService = $encryptionService;
    }

    // Add return type JsonResponse
    public function register(Request $request): JsonResponse
    {
        $validatedData = $request->validate([
            'email' => 'required|email',
            'password' => 'required|min:8'
        ]);

        $encryptedData = $this->encryptionService->encryptData($validatedData['password']);
        
        User::create([
            'name' => "test",
            'email' => $validatedData['email'],
            'password' => $encryptedData // Save encrypted password
        ]);

        return response()->json(['message' => 'User registered successfully']);
    }

    // Add return type JsonResponse
    public function login(Request $request): JsonResponse
    {
        $validatedData = $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        $user = User::where('email', $validatedData['email'])->first();

        if ($user) {
            // Update the last login time
            $user->last_login_at = now();
            $user->save();
            return response()->json(['message' => 'Login successful']);
        } else {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }
    }

    // Add return type JsonResponse
    public function logout(Request $request): JsonResponse
    {
        return response()->json(['message' => 'Successfully logged out']);
    }
}
