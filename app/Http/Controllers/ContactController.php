<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserContact;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ContactController extends Controller
{
    /**
     * Store a new contact (add by email). Requires the contact to be an existing user.
     */
    public function store(Request $request)
    {
        $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email'],
            'mobile_number' => ['nullable', 'string', 'max:21'],
        ]);

        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => __('Unauthorized.')], 401);
        }

        $email = $request->input('email');
        $contactUser = User::whereRaw('LOWER(email) = ?', [strtolower($email)])->first();

        if (!$contactUser) {
            return response()->json([
                'message' => __('No user found with this email. They must register first.'),
            ], 422);
        }

        if ((int) $contactUser->id === (int) $user->id) {
            return response()->json([
                'message' => __("You can't add yourself to contacts."),
            ], 422);
        }

        $exists = UserContact::where('user_id', $user->id)
            ->where('contact_user_id', $contactUser->id)
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => __('This contact is already in your list.'),
            ], 422);
        }

        UserContact::create([
            'user_id' => $user->id,
            'contact_user_id' => $contactUser->id,
            'first_name' => $request->input('first_name'),
            'last_name' => $request->input('last_name'),
            'email' => $contactUser->email,
            'mobile_number' => $request->input('mobile_number') ?: $contactUser->mobile_number,
        ]);

        return response()->json([
            'message' => __('Contact added successfully.'),
        ], 201);
    }

    /**
     * List contacts for the current user (Laravel/MySQL replacement for Firebase data/contacts).
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => __('Unauthorized.')], 401);
        }

        $contacts = UserContact::where('user_id', $user->id)
            ->with('contactUser')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function (UserContact $uc) {
                $c = $uc->contactUser;
                $img = $c && $c->profile_image_link ? $c->profile_image_link : (request()->getSchemeAndHttpHost() . '/assets/img/profiles/avatar-03.jpg');
                return [
                    'uid' => (string) $uc->contact_user_id,
                    'user_id' => $uc->contact_user_id,
                    'firstName' => $uc->first_name ?: ($c ? $c->first_name : ''),
                    'lastName' => $uc->last_name ?: ($c ? $c->last_name : ''),
                    'userName' => $c ? ($c->user_name ?? '') : '',
                    'email' => $uc->email ?: ($c ? $c->email : ''),
                    'mobile_number' => $uc->mobile_number ?: ($c ? $c->mobile_number : ''),
                    'image' => $img,
                ];
            });

        return response()->json($contacts);
    }
}
