<?php

namespace App\Http\Middleware;

use Closure;
use Firebase\Auth\Token\Exception\InvalidToken;
use Kreait\Firebase\Auth as FirebaseAuth;
use Illuminate\Http\Request;
use Kreait\Firebase\Exception\AuthException;

class FirebaseAuthMiddleware
{
    protected $firebaseAuth;

    public function __construct(FirebaseAuth $firebaseAuth)
    {
        $this->firebaseAuth = $firebaseAuth;
    }

    public function handle(Request $request, Closure $next)
    {
        
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json(['error' => 'Token not provided'], 401);
        }

        try {
            // Verify the token
            $verifiedIdToken = $this->firebaseAuth->verifyIdToken($token);
            
            // Get the UID from the verified token
            $uid = $verifiedIdToken->claims()->get('sub'); // Use claims() to access claims

            // Retrieve user data from Firebase (if needed)
            $user = $this->firebaseAuth->getUser($uid);

            // Optionally, store user data in the request for later use
            $request->attributes->set('firebase_user', $user);

        } catch (AuthException $e) {
            return response()->json(['error' => 'Invalid token'], 401);
        }

        return $next($request);
    }
}

