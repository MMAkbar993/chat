<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;
use Kreait\Firebase\Factory;

/**
 * Keeps Laravel (MySQL) and Firebase Auth in sync: creates Firebase user on registration
 * and stores firebase_uid on the Laravel user so chat session restore works.
 */
class FirebaseSyncService
{
    protected $auth = null;

    protected function getAuth()
    {
        if ($this->auth !== null) {
            return $this->auth;
        }
        $credentialsPath = storage_path('firebase/firebase_credentials.json');
        if (!is_file($credentialsPath)) {
            Log::warning('Firebase credentials not found', ['path' => $credentialsPath]);
            return null;
        }
        try {
            $firebase = (new Factory)->withServiceAccount($credentialsPath);
            $this->auth = $firebase->createAuth();
            return $this->auth;
        } catch (\Throwable $e) {
            Log::warning('Firebase Auth init failed', ['message' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Create (or link) Firebase user for this Laravel user and set firebase_uid.
     * Call this after creating a new user in MySQL so they can use chat without re-login.
     *
     * @param User $user Laravel user (must have email; first_name/last_name optional)
     * @param string $plainPassword Plain password (used only to create Firebase user)
     * @return bool True if firebase_uid was set, false otherwise (no column, no credentials, or error)
     */
    public function syncFirebaseUidForUser(User $user, string $plainPassword): bool
    {
        if (!Schema::hasColumn($user->getTable(), 'firebase_uid')) {
            return false;
        }
        if (trim($user->email ?? '') === '') {
            return false;
        }
        $auth = $this->getAuth();
        if (!$auth) {
            return false;
        }

        $uid = null;
        try {
            $displayName = trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? ''));
            $created = $auth->createUser([
                'email' => $user->email,
                'emailVerified' => false,
                'password' => $plainPassword,
                'displayName' => $displayName !== '' ? $displayName : ($user->user_name ?? $user->email),
                'disabled' => false,
            ]);
            $uid = $created->uid;
        } catch (\Throwable $e) {
            // Firebase may throw when email already exists (e.g. user signed in with Google before)
            $message = $e->getMessage();
            if (stripos($message, 'email') !== false && (stripos($message, 'exists') !== false || stripos($message, 'already') !== false)) {
                try {
                    $existing = $auth->getUserByEmail($user->email);
                    $uid = $existing->uid;
                } catch (\Throwable $e2) {
                    Log::warning('Firebase getUserByEmail failed after create conflict', [
                        'email' => $user->email,
                        'message' => $e2->getMessage(),
                    ]);
                    return false;
                }
            } else {
                Log::warning('Firebase createUser failed', [
                    'email' => $user->email,
                    'message' => $message,
                ]);
                return false;
            }
        }

        if ($uid !== null) {
            $user->firebase_uid = $uid;
            $user->saveQuietly();
            return true;
        }
        return false;
    }
}
