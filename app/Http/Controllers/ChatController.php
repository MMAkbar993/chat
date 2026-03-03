<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Kreait\Firebase\Factory;

class ChatController extends Controller
{
    protected $firebaseDatabase;

    const MAX_FILE_SIZE_MB = 25;

    const ALLOWED_MIMES = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm', 'video/quicktime',
        'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/zip',
        'text/plain',
    ];

    public function __construct()
    {
        $credentialsPath = storage_path('firebase/firebase_credentials.json');

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
        return view('frontend.chat', ['selectedUserId' => $id]);
    }

    /**
     * Upload a chat attachment (image, video, audio, document) to Laravel storage.
     * Returns the public URL so the client can reference it in a Firebase message.
     */
    public function uploadFile(Request $request)
    {
        $request->validate([
            'file' => [
                'required',
                'file',
                'max:' . (self::MAX_FILE_SIZE_MB * 1024),
            ],
        ]);

        $file = $request->file('file');

        if (!in_array($file->getMimeType(), self::ALLOWED_MIMES)) {
            return response()->json([
                'error' => 'File type not allowed.',
                'allowed' => self::ALLOWED_MIMES,
            ], 422);
        }

        $mimeBase = explode('/', $file->getMimeType())[0];
        $subfolder = match ($mimeBase) {
            'image' => 'images',
            'video' => 'videos',
            'audio' => 'audio',
            default => 'files',
        };

        $path = $file->store("chat-uploads/{$subfolder}", 'public');
        $url = Storage::disk('public')->url($path);

        $attachmentType = match ($mimeBase) {
            'image' => 2,
            'video' => 1,
            'audio' => 3,
            default => 5,
        };

        return response()->json([
            'url' => $url,
            'path' => $path,
            'name' => $file->getClientOriginalName(),
            'size' => $file->getSize(),
            'mime' => $file->getMimeType(),
            'attachmentType' => $attachmentType,
        ]);
    }
}
