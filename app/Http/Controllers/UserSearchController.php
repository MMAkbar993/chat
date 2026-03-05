<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class UserSearchController extends Controller
{
    /**
     * Search users by username or name.
     * GET /api/users/search?q=xxx
     */
    public function search(Request $request)
    {
        $request->validate([
            'q' => 'required|string|min:2|max:100',
        ]);

        $query = strtolower(trim($request->input('q')));
        $cacheKey = 'user_search:' . md5($query);

        $users = Cache::remember($cacheKey, 60, function () use ($query) {
            return User::where(function ($q) use ($query) {
                    $q->where('user_name', 'like', "%{$query}%")
                      ->orWhere('first_name', 'like', "%{$query}%")
                      ->orWhere('last_name', 'like', "%{$query}%")
                      ->orWhere('full_name', 'like', "%{$query}%")
                      ->orWhere('company_name', 'like', "%{$query}%");
                })
                ->select([
                    'id', 'first_name', 'last_name', 'full_name', 'user_name', 'email',
                    'company_name', 'primary_role', 'country', 'profile_image',
                    'kyc_verified_at',
                ])
                ->limit(20)
                ->get()
                ->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'first_name' => $user->first_name,
                        'last_name' => $user->last_name,
                        'full_name' => $user->full_name,
                        'user_name' => $user->user_name,
                        'company_name' => $user->company_name,
                        'primary_role' => $user->primary_role,
                        'country' => $user->country,
                        'profile_image' => $user->profile_image_link,
                        'kyc_verified' => $user->isKycVerified(),
                    ];
                });
        });

        return response()->json(['users' => $users]);
    }

    /**
     * Public profile page by username.
     * GET /u/{username}
     */
    public function publicProfile(string $username)
    {
        $user = Cache::remember('public_profile:' . strtolower($username), 300, function () use ($username) {
            return User::where('user_name', $username)
                ->with(['get_user_details', 'websites.website', 'socialAccounts'])
                ->first();
        });

        if (!$user) {
            abort(404, 'User not found');
        }

        return view('frontend.public-profile', compact('user'));
    }
}
