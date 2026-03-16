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
                      ->orWhere('email', 'like', "%{$query}%")
                      ->orWhere('first_name', 'like', "%{$query}%")
                      ->orWhere('last_name', 'like', "%{$query}%")
                      ->orWhere('full_name', 'like', "%{$query}%")
                      ->orWhere('company_name', 'like', "%{$query}%");
                })
                ->select([
                    'id',
                    'first_name',
                    'last_name',
                    'full_name',
                    'user_name',
                    'email',
                    'firebase_uid',
                    'company_name',
                    'primary_role',
                    'country',
                    'profile_image',
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
                        'email' => $user->email,
                        'firebase_uid' => $user->firebase_uid ?? null,
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

    /**
     * Public profile data by email (for chat Contact Info).
     * GET /api/public-profile-by-email?email=
     */
    public function publicProfileByEmail(Request $request)
    {
        $email = $request->query('email');
        if (!is_string($email) || !strlen(trim($email))) {
            return response()->json(['error' => 'Email required'], 400);
        }
        $user = User::where('email', trim($email))
            ->with(['get_user_details', 'websites', 'socialAccounts'])
            ->first();
        if (!$user) {
            return response()->json([
                'display_name' => '',
                'bio' => '',
                'location' => '',
                'websites' => [],
                'join_date' => null,
                'dob' => null,
                'kyc_verified' => false,
                'social_verified' => false,
                'social_links' => [],
            ]);
        }
        $details = $user->get_user_details;
        $verifiedPlatforms = $user->socialAccounts()->where('oauth_verified', true)->pluck('platform')->toArray();
        $websites = $user->websites->filter(fn ($w) => $w->isVerified())->map(fn ($w) => [
            'url' => $w->getDisplayUrl(),
        ])->values()->all();

        $platformToDetail = [
            'facebook' => optional($details)->facebook,
            'x' => optional($details)->twitter,
            'twitter' => optional($details)->twitter,
            'instagram' => optional($details)->instagram,
            'linkedin' => optional($details)->linkedin,
            'youtube' => optional($details)->youtube,
            'kick' => optional($details)->kick,
            'twitch' => optional($details)->twitch,
        ];
        $socialLinks = [];
        foreach (['facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'kick', 'twitch'] as $key) {
            $url = $platformToDetail[$key] ?? null;
            if (empty($url)) {
                $oauthKey = $key === 'twitter' ? 'x' : $key;
                $acc = $user->socialAccounts()->where('platform', $oauthKey)->where('oauth_verified', true)->first();
                $url = $acc && $acc->profile_url ? $acc->profile_url : ($acc ? ('https://' . ($key === 'twitter' ? 'x.com' : $key . '.com')) : null);
            }
            $socialLinks[$key] = $url ?: '';
        }

        return response()->json([
            'display_name' => $user->public_display_name,
            'bio' => $details->user_about ?? '',
            'location' => $user->country ?? $details->location ?? '',
            'websites' => $websites,
            'join_date' => $user->created_at?->format('F j, Y'),
            'dob' => $user->dob ? \Carbon\Carbon::parse($user->dob)->format('d F Y') : null,
            'kyc_verified' => $user->isKycVerified(),
            'social_verified' => count($verifiedPlatforms) > 0,
            'social_platforms' => $verifiedPlatforms,
            'social_links' => $socialLinks,
        ]);
    }
}
