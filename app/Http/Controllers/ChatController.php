<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Kreait\Firebase\Factory;

class ChatController extends Controller
{
    protected $firebaseDatabase;

    public function __construct()
    {
        
        $credentialsPath = storage_path('firebase/firebase_credentials.json');

        // Check if the file exists at the specified path
        if (!file_exists($credentialsPath)) {
            throw new \Exception("Firebase credentials file not found at path: {$credentialsPath}");
        }

        $credentials = json_decode(file_get_contents($credentialsPath), true);
        if ($credentials === null) {
            throw new \Exception("Invalid JSON in Firebase credentials file.");
        }
        
        $this->firebaseDatabase = (new Factory)
            ->withServiceAccount($credentials)
            ->withDatabaseUri("https://dreams-chat-ef2a3-default-rtdb.firebaseio.com")
            ->createDatabase();
    }

    // API to send message
    public function sendMessage(Request $request)
    {
        $message = [
            'from' => $request->from_user_id,
            'to' => $request->to_user_id,
            'text' => $request->message,
            'timestamp' => now()->timestamp,
        ];

        $this->firebaseDatabase->getReference('messages')->push($message);

        return response()->json(['message' => 'Message sent successfully']);
    }

    // API to get messages between two users
    public function getMessages($userId, Request $request)
    {
        $fromUserId = auth()->user()->id;
        $toUserId = $userId;

        $messages = $this->firebaseDatabase->getReference('messages')
            ->orderByChild('from')
            ->equalTo($fromUserId)
            ->getValue();

        return response()->json($messages);
    }
    public function showChat($id)
    {
        // Pass the selected user ID to the view
        return view('frontend.chat', ['selectedUserId' => $id]);
    }
}
