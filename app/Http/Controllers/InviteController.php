<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

class InviteController extends Controller
{
    /**
     * Send an invitation email to the given address (e.g. to join the app).
     */
    public function send(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => ['required', 'email'],
            'message' => ['nullable', 'string', 'max:1000'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => $validator->errors()->first(),
            ], 422);
        }

        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => __('Unauthorized.')], 401);
        }

        $email = $request->input('email');
        $customMessage = $request->input('message', '');
        $inviterName = trim($user->first_name . ' ' . $user->last_name) ?: $user->user_name ?? $user->email;
        $appName = config('app.name', 'Connect');
        $signupUrl = route('signup');

        $body = __(':name has invited you to join :app.', ['name' => $inviterName, 'app' => $appName]) . "\n\n";
        $body .= __('Sign up here: :url', ['url' => $signupUrl]) . "\n\n";
        if ($customMessage !== '') {
            $body .= __('Message from :name:', ['name' => $inviterName]) . "\n" . $customMessage . "\n";
        }

        try {
            Mail::raw($body, function ($message) use ($email, $inviterName, $appName) {
                $message->to($email)
                    ->subject(__(':name invited you to join :app', ['name' => $inviterName, 'app' => $appName]));
            });
        } catch (\Throwable $e) {
            return response()->json([
                'message' => __('Could not send invitation. Please try again later.'),
            ], 500);
        }

        return response()->json([
            'message' => __('Invitation sent successfully to :email.', ['email' => $email]),
        ], 200);
    }
}
