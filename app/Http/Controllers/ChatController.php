<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

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

        $limit = min(max((int) $request->query('limit', 40), 1), 100);

        $lastIds = Chat::query()
            ->selectRaw('MAX(id) as id')
            ->where(function ($q) use ($userId) {
                $q->where('sender_id', $userId)->orWhere('receiver_id', $userId);
            })
            ->groupBy(DB::raw('LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id)'))
            ->orderByRaw('MAX(created_at) DESC')
            ->limit($limit)
            ->pluck('id');

        if ($lastIds->isEmpty()) {
            return response()->json([]);
        }

        $chats = Chat::whereIn('id', $lastIds)->orderBy('created_at', 'desc')->get();
        $otherIds = $chats->map(function ($m) use ($userId) {
            return (int) $m->sender_id === (int) $userId ? (int) $m->receiver_id : (int) $m->sender_id;
        })->unique()->values();
        $usersById = User::whereIn('id', $otherIds)->get()->keyBy('id');

        $list = [];
        foreach ($chats as $m) {
            $otherId = (int) $m->sender_id === (int) $userId ? $m->receiver_id : $m->sender_id;
            $other = $usersById->get((int) $otherId);
            $name = $other ? $other->public_display_name : ('User ' . $otherId);
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
        $limit = min(max((int) $request->query('limit', 80), 1), 200);
        $beforeId = (int) $request->query('before_id', 0);

        $messagesQuery = Chat::where(function ($q) use ($fromUserId, $toUserId) {
            $q->where('sender_id', $fromUserId)->where('receiver_id', $toUserId);
        })->orWhere(function ($q) use ($fromUserId, $toUserId) {
            $q->where('sender_id', $toUserId)->where('receiver_id', $fromUserId);
        });

        if ($beforeId > 0) {
            $messagesQuery->where('id', '<', $beforeId);
        }

        $messages = $messagesQuery
            ->orderBy('id', 'desc')
            ->limit($limit)
            ->get()
            ->reverse()
            ->values()
            ->map(function ($chat) {
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

        // Keep the original filename so that downloads (and right-click "Save as")
        // restore the human-readable name instead of a Laravel-generated hash.
        // Each upload gets its own random sub-directory to avoid collisions.
        [$safeFilename, $fallbackName] = $this->sanitizeUploadFilename(
            $file->getClientOriginalName(),
            $file->getClientOriginalExtension(),
            $file->getMimeType()
        );

        $randomDir = Str::random(40);
        $path = $file->storeAs(
            "chat-uploads/{$subfolder}/{$randomDir}",
            $safeFilename,
            'public'
        );

        // Root-relative URL so the browser always loads from the current host (e.g. 127.0.0.1 vs localhost).
        // A full APP_URL from Storage::url() causes cross-origin audio/video and 0:00 duration when hosts differ.
        // rawurlencode each segment so filenames with spaces/parens survive in the URL.
        $url = '/storage/' . implode('/', array_map('rawurlencode', explode('/', str_replace('\\', '/', $path))));

        $attachmentType = match ($mimeBase) {
            'image' => 2,
            'video' => 1,
            'audio' => 3,
            default => 5,
        };

        return response()->json([
            'url' => $url,
            'path' => $path,
            'name' => $fallbackName,
            'size' => $file->getSize(),
            'mime' => $file->getMimeType(),
            'attachmentType' => $attachmentType,
        ]);
    }

    /**
     * Strip filesystem-unsafe characters from the uploaded filename while keeping it
     * recognizable (preserving spaces, dashes, parens, unicode letters). Falls back to
     * a timestamped name if the input has no usable basename.
     *
     * @return array{0:string,1:string} [storedFilename, displayName]
     */
    private function sanitizeUploadFilename(string $original, string $extension, string $mime): array
    {
        $original = trim($original);
        $basename = pathinfo($original, PATHINFO_FILENAME);
        // Disallow filesystem path separators / wildcards / control chars; keep the rest.
        $clean = preg_replace('/[\/\\\\:*?"<>|\x00-\x1F]/u', '_', $basename ?? '');
        $clean = trim($clean ?? '', " \t\n\r\0\x0B.");
        if ($clean === '' || $clean === '_') {
            $clean = 'file_' . now()->format('YmdHis');
        }
        if (mb_strlen($clean) > 80) {
            $clean = mb_substr($clean, 0, 80);
        }

        $ext = strtolower($extension ?: '');
        if ($ext === '') {
            // Common mime → extension fallback so the file is still openable from the URL.
            $ext = match ($mime) {
                'image/jpeg' => 'jpg',
                'image/png' => 'png',
                'image/gif' => 'gif',
                'image/webp' => 'webp',
                'video/mp4' => 'mp4',
                'video/webm' => 'webm',
                'video/quicktime' => 'mov',
                'audio/mpeg' => 'mp3',
                'audio/ogg' => 'ogg',
                'audio/wav' => 'wav',
                'audio/webm' => 'weba',
                'application/pdf' => 'pdf',
                'text/plain' => 'txt',
                default => '',
            };
        }
        $ext = preg_replace('/[^A-Za-z0-9]/', '', $ext);

        $stored = $clean . ($ext ? '.' . $ext : '');
        $display = $stored;

        return [$stored, $display];
    }
}
