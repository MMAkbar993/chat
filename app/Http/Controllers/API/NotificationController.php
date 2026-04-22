<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class NotificationController extends Controller
{
    /**
     * Push notifications are disabled (Firebase removed). Returns 501.
     */
    public function send(Request $request)
    {
        return response()->json([
            'success' => false,
            'message' => 'Push notifications are not configured. Use MySQL-only mode without Firebase.',
        ], 501);
    }

    /**
     * Call notifications disabled. Returns 501.
     */
    public function sendCallNotification(Request $request)
    {
        return response()->json([
            'success' => false,
            'message' => 'Push notifications are not configured. Use MySQL-only mode without Firebase.',
        ], 501);
    }
}
