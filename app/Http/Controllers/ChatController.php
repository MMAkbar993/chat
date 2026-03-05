<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class ChatController extends Controller
{
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

    public function sendMessage(Request $request)
    {
        $request->validate([
            'from_user_id' => 'required',
            'to_user_id' => 'required',
            'message' => 'required|string',
        ]);

        $userId = Auth::id();
        if ((int) $request->from_user_id !== (int) $userId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        Chat::create([
            'sender_id' => $request->from_user_id,
            'receiver_id' => $request->to_user_id,
            'message' => $request->message,
        ]);

        return response()->json(['message' => 'Message sent successfully']);
    }

    public function getMessages($userId, Request $request)
    {
        $fromUserId = Auth::id();
        $toUserId = (int) $userId;

        $messages = Chat::where(function ($q) use ($fromUserId, $toUserId) {
            $q->where('sender_id', $fromUserId)->where('receiver_id', $toUserId);
        })->orWhere(function ($q) use ($fromUserId, $toUserId) {
            $q->where('sender_id', $toUserId)->where('receiver_id', $fromUserId);
        })->orderBy('created_at')->get()->map(function ($chat) {
            return [
                'id' => $chat->id,
                'from' => $chat->sender_id,
                'to' => $chat->receiver_id,
                'text' => $chat->message,
                'timestamp' => $chat->created_at->timestamp,
            ];
        });

        return response()->json($messages);
    }

    public function showChat($id)
    {
        return view('frontend.chat', ['selectedUserId' => $id]);
    }

    /**
     * Upload a chat attachment (image, video, audio, document) to Laravel storage.
     * Returns the public URL so the client can reference it in a message.
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
