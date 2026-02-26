<?php

namespace App\Services;

// Add the required 'use' statements for Auth and Database
use Kreait\Firebase\Auth as FirebaseAuth;
use Kreait\Firebase\Database;
// ---

use Illuminate\Support\Facades\Log;
use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification;
use Kreait\Firebase\Exception\FirebaseException;
use Kreait\Firebase\Exception\Auth\EmailExists;
use Kreait\Firebase\Exception\MessagingException;

class FirebaseService
{
    /**
     * @var \Kreait\Firebase\Messaging
     */
    protected $messaging;

    /**
     * @var \Kreait\Firebase\Auth  <-- ADD THIS PROPERTY
     */
    protected $auth;

    /**
     * @var \Kreait\Firebase\Database  <-- ADD THIS PROPERTY
     */
    protected $database;

    /**
     * FirebaseService constructor.
     * Credentials: use FIREBASE_CREDENTIALS path from .env, or fall back to config/firebase_credentials.json.
     * For Option A (single project): put your project's service account JSON at storage/firebase/firebase_credentials.json and set FIREBASE_CREDENTIALS=storage/firebase/firebase_credentials.json in .env.
     */
    public function __construct()
    {
        $credentialsPath = env('FIREBASE_CREDENTIALS')
            ? base_path(env('FIREBASE_CREDENTIALS'))
            : base_path('config/firebase_credentials.json');

        if (!file_exists($credentialsPath)) {
            throw new \RuntimeException('Firebase credentials file not found: ' . $credentialsPath . '. Set FIREBASE_CREDENTIALS in .env or add config/firebase_credentials.json');
        }

        $factory = (new Factory)
            ->withServiceAccount($credentialsPath)
            ->withDatabaseUri(env('FIREBASE_DATABASE_URL'));

        $this->messaging = $factory->createMessaging();
        $this->auth = $factory->createAuth();
        $this->database = $factory->createDatabase();
    }
    
    // --- ADD THE TWO MISSING GETTER METHODS ---

    /**
     * Get the Firebase Auth instance.
     *
     * @return \Kreait\Firebase\Auth
     */
    public function getAuth(): FirebaseAuth
    {
        return $this->auth;
    }

    /**
     * Get the Firebase Realtime Database instance.
     *
     * @return \Kreait\Firebase\Database
     */
    public function getDatabase(): Database
    {
        return $this->database;
    }
    
    // --- YOUR EXISTING sendNotification METHOD (NO CHANGES NEEDED) ---

    /**
     * Send a notification with a data payload.
     *
     * @param string $deviceToken The recipient's device token.
     * @param string $title The notification title.
     * @param string $body The notification body.
     * @param array $data The custom data payload.
     * @param string|null $imageUrl Optional image URL for the notification.
     * @return array The result from Firebase.
     * @throws MessagingException|\Kreait\Firebase\Exception\FirebaseException
     */
    public function sendNotification(string $deviceToken, string $title, string $body, array $data = [], ?string $imageUrl = null): array
    {
        $notification = Notification::create($title, $body, $imageUrl);

        $message = CloudMessage::withTarget('token', $deviceToken)
            ->withNotification($notification)
            ->withData($data);

        return $this->messaging->send($message);
    }

    /**
     * Create a Firebase Auth user with email and password (so they can sign in with signInWithEmailAndPassword on the client).
     * Returns the Firebase UID or null on failure.
     */
    public function createAuthUser(string $email, string $password, ?string $displayName = null): ?string
    {
        try {
            $properties = [
                'email' => $email,
                'password' => $password,
                'emailVerified' => false,
            ];
            if ($displayName !== null && $displayName !== '') {
                $properties['displayName'] = $displayName;
            }
            $userRecord = $this->auth->createUser($properties);
            return $userRecord->uid;
        } catch (EmailExists $e) {
            Log::warning('Firebase Auth: email already exists', ['email' => $email]);
            $userRecord = $this->auth->getUserByEmail($email);
            return $userRecord->uid;
        } catch (\Throwable $e) {
            Log::error('Firebase Auth createUser failed', ['email' => $email, 'message' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Create a custom token for the given Firebase UID so the client can sign in with signInWithCustomToken.
     */
    public function createCustomToken(string $uid, array $claims = []): string
    {
        $token = $this->auth->createCustomToken($uid, $claims);
        return $token->toString();
    }

    /**
     * Write user data to Firebase Realtime Database at data/users/{uid} so the chat app finds them on login.
     */
    public function syncUserToRealtimeDatabase(string $uid, array $data): void
    {
        try {
            $ref = $this->database->getReference('data/users/' . $uid);
            $ref->set($data);
        } catch (\Throwable $e) {
            Log::error('Firebase RTDB sync failed', ['uid' => $uid, 'message' => $e->getMessage()]);
        }
    }
}