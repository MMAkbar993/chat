<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use App\Models\User;
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

    /**
     * Get chat list (conversations with last message) for Laravel when Firebase is disabled.
     */
    public function chatList(Request $request)
    {
        $userId = Auth::id();
        if (!$userId) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $chats = Chat::where('sender_id', $userId)
            ->orWhere('receiver_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();

        $seen = [];
        $list = [];
        foreach ($chats as $m) {
            $otherId = (int) $m->sender_id === (int) $userId ? $m->receiver_id : $m->sender_id;
            if (isset($seen[$otherId])) {
                continue;
            }
            $seen[$otherId] = true;
            $other = User::find($otherId);
            $name = $other ? trim(($other->first_name ?? '') . ' ' . ($other->last_name ?? '')) : ('User ' . $otherId);
            if ($name === '' && $other) {
                $name = $other->user_name ?? $other->email ?? ('User ' . $otherId);
            }
            $list[] = [
                'other_user_id' => $otherId,
                'other_user' => $other ? [
                    'id' => $other->id,
                    'first_name' => $other->first_name,
                    'last_name' => $other->last_name,
                    'user_name' => $other->user_name,
                    'email' => $other->email,
                    'profile_image_link' => $other->profile_image_link ?? null,
                ] : null,
                'display_name' => $name,
                'last_message' => $m->message,
                'last_at' => $m->created_at->toIso8601String(),
                'timestamp' => $m->created_at->timestamp,
            ];
        }

        return response()->json($list);
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

    /**
     * Delete all chat messages for the current user (both sent and received).
     * Used by Settings > Chat > Delete All Chat.
     */
    public function deleteAllChats(Request $request)
    {
        $userId = Auth::id();
        if (!$userId) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $deleted = Chat::where('sender_id', $userId)->orWhere('receiver_id', $userId)->delete();

        return response()->json([
            'message' => __('All chats have been deleted.'),
            'deleted' => $deleted,
        ]);
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
        // Root-relative URL so the browser always loads from the current host (e.g. 127.0.0.1 vs localhost).
        // A full APP_URL from Storage::url() causes cross-origin audio/video and 0:00 duration when hosts differ.
        $url = '/storage/' . str_replace('\\', '/', $path);

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
