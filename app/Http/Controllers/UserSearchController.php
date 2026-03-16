<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;

class UserSearchController extends Controller
{
    /**
     * Search users by username or email.
     * GET /api/users/search?q=xxx
     */
    public function search(Request $request)
    {
        try {
            $request->validate([
                'q' => 'required|string|min:4|max:100',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['users' => [], 'message' => 'Enter at least 4 characters with exact spelling.'], 422);
        }

        $query = trim($request->input('q'));
        $queryLower = mb_strtolower($query);
        $cacheKey = 'user_search:' . md5($queryLower);

        try {
            $users = Cache::remember($cacheKey, 60, function () use ($query, $queryLower) {
                $userTable = (new User)->getTable();
                $hasFirebaseUid = Schema::hasColumn($userTable, 'firebase_uid');
                $selectColumns = [
                    'id', 'first_name', 'last_name', 'full_name', 'user_name',
                    'company_name', 'primary_role', 'country', 'profile_image', 'kyc_verified_at',
                ];
                if ($hasFirebaseUid) {
                    $selectColumns[] = 'firebase_uid';
                }

                return User::where(function ($q) use ($queryLower) {
                    $q->whereRaw('LOWER(user_name) = ?', [$queryLower])
                        ->orWhereRaw('LOWER(first_name) = ?', [$queryLower])
                        ->orWhereRaw('LOWER(last_name) = ?', [$queryLower])
                        ->orWhereRaw('LOWER(full_name) = ?', [$queryLower]);
                })
                    ->select($selectColumns)
                    ->limit(20)
                    ->get()
                    ->map(function ($user) use ($hasFirebaseUid) {
                        $row = [
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
                            'firebase_uid' => $hasFirebaseUid ? ($user->firebase_uid ?? null) : null,
                        ];
                        return $row;
                    });
            });

            return response()->json(['users' => $users]);
        } catch (\Throwable $e) {
            Log::error('User search failed', ['message' => $e->getMessage(), 'query' => $query, 'trace' => $e->getTraceAsString()]);
            return response()->json(['users' => [], 'message' => 'Search is temporarily unavailable.'], 500);
        }
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
