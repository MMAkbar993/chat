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
     * Search users by username, name, or email.
     * GET /api/users/search?q=xxx
     */
    public function search(Request $request)
    {
        try {
            $request->validate([
                'q' => 'required|string|min:4|max:100',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['users' => [], 'message' => 'Enter at least 4 characters to search users.'], 422);
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
                    'email', 'company_name', 'primary_role', 'country', 'profile_image', 'kyc_verified_at',
                    'profile_display_name',
                ];
                if ($hasFirebaseUid) {
                    $selectColumns[] = 'firebase_uid';
                }

                $queryLike = '%' . str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $queryLower) . '%';

                return User::where(function ($q) use ($queryLike) {
                    $q->whereRaw('LOWER(user_name) LIKE ?', [$queryLike])
                        ->orWhereRaw('LOWER(first_name) LIKE ?', [$queryLike])
                        ->orWhereRaw('LOWER(last_name) LIKE ?', [$queryLike])
                        ->orWhereRaw('LOWER(full_name) LIKE ?', [$queryLike])
                        ->orWhereRaw('LOWER(email) LIKE ?', [$queryLike]);
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
                            'email' => $user->email,
                            'display_name' => $user->public_display_name,
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
                'profile_loaded' => false,
                'display_name' => '',
                'primary_role' => '',
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

        return response()->json($this->buildPublicProfilePayload($user));
    }

    /**
     * Public profile data by username or mobile_number (for chat Contact Info).
     * GET /api/public-profile-by-username?username=
     */
    public function publicProfileByUsername(Request $request)
    {
        $username = $request->query('username');
        $username = is_string($username) ? trim($username) : '';

        if ($username === '') {
            return response()->json(['error' => 'Username required'], 400);
        }

        $user = User::query()
            ->where('user_name', $username)
            ->orWhere('mobile_number', $username)
            ->with(['get_user_details', 'websites', 'socialAccounts'])
            ->first();

        if (!$user) {
            return response()->json([
                'profile_loaded' => false,
                'display_name' => $username,
                'primary_role' => '',
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
        return response()->json($this->buildPublicProfilePayload($user));
    }

    /**
     * Public profile data by Firebase UID (for contact modal when email/username is missing).
     * GET /api/public-profile-by-firebase-uid?uid=
     */
    public function publicProfileByFirebaseUid(Request $request)
    {
        $uid = $request->query('uid');
        $uid = is_string($uid) ? trim($uid) : '';

        if ($uid === '') {
            return response()->json(['error' => 'UID required'], 400);
        }

        $user = User::where('firebase_uid', $uid)
            ->with(['get_user_details', 'websites', 'socialAccounts'])
            ->first();

        if (!$user) {
            return response()->json([
                'profile_loaded' => false,
                'display_name' => '',
                'primary_role' => '',
                'bio' => '',
                'location' => '',
                'websites' => [],
                'join_date' => null,
                'dob' => null,
                'kyc_verified' => false,
                'social_verified' => false,
                'social_platforms' => [],
                'social_links' => [],
            ]);
        }
        return response()->json($this->buildPublicProfilePayload($user));
    }

    private function buildPublicProfilePayload(User $user): array
    {
        $details = $user->get_user_details;
        $socialAccounts = $user->socialAccounts ?? collect();
        $verifiedPlatforms = $socialAccounts
            ->where('oauth_verified', true)
            ->pluck('platform')
            ->filter()
            ->values()
            ->all();

        $verifiedByPlatform = $socialAccounts
            ->where('oauth_verified', true)
            ->keyBy(function ($account) {
                return strtolower((string) $account->platform);
            });

        $websites = $user->websites->filter(fn ($w) => $w->isVerified())->map(fn ($w) => [
            'url' => $w->getDisplayUrl(),
        ])->values()->all();

        $platformToDetail = [
            'facebook' => optional($details)->facebook,
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
                $acc = $verifiedByPlatform->get($oauthKey);
                $url = $acc && $acc->profile_url ? $acc->profile_url : ($acc ? ('https://' . ($key === 'twitter' ? 'x.com' : $key . '.com')) : null);
            }
            $socialLinks[$key] = $url ?: '';
        }

        return [
            'profile_loaded' => true,
            'display_name' => $user->public_display_name,
            'primary_role' => $user->primary_role ? trim((string) $user->primary_role) : '',
            'primary_role_label' => $user->primaryRoleDisplayLabel(),
            'other_role_text' => $user->other_role_text ?? '',
            'bio' => $details->user_about ?? '',
            'location' => $user->country ?? $details->location ?? '',
            'websites' => $websites,
            'join_date' => $user->created_at?->format('F j, Y'),
            'dob' => $user->dob ? \Carbon\Carbon::parse($user->dob)->format('d F Y') : null,
            'kyc_verified' => $user->isKycVerified(),
            'social_verified' => count($verifiedPlatforms) > 0,
            'social_platforms' => $verifiedPlatforms,
            'social_links' => $socialLinks,
        ];
    }

    /**
     * Batch-resolve profile image URLs from Laravel for contacts missing Firebase avatars.
     * POST /api/users/contact-avatars (auth required)
     * Body: { "firebase_uids": [], "emails": [], "usernames": [] }
     */
    public function contactAvatarsBatch(Request $request)
    {
        if (! auth()->check()) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $firebaseUids = array_values(array_unique(array_filter(array_map('strval', (array) $request->input('firebase_uids', [])))));
        $emails = array_values(array_unique(array_filter(array_map('strval', (array) $request->input('emails', [])))));
        $usernames = array_values(array_unique(array_filter(array_map('strval', (array) $request->input('usernames', [])))));

        $firebaseUids = array_values(array_filter($firebaseUids, function ($u) {
            $u = trim($u);

            return strlen($u) > 0 && strlen($u) < 130 && strpos($u, 'pending_') !== 0;
        }));
        $firebaseUids = array_slice($firebaseUids, 0, 60);
        $emails = array_slice(array_map(function ($e) {
            return mb_strtolower(trim($e));
        }, $emails), 0, 60);
        $usernames = array_slice($usernames, 0, 60);

        $byUid = [];
        $byEmail = [];
        $byUsername = [];
        $nameByUid = [];
        $nameByEmail = [];
        $nameByUsername = [];
        $roleByUid = [];
        $roleByEmail = [];
        $roleByUsername = [];

        $table = (new User)->getTable();
        $hasFb = Schema::hasColumn($table, 'firebase_uid');

        $displayNameFromUser = static function ($u) {
            return $u->public_display_name;
        };

        if ($hasFb && count($firebaseUids) > 0) {
            User::whereIn('firebase_uid', $firebaseUids)
                ->get(['firebase_uid', 'profile_image', 'primary_role', 'other_role_text', 'first_name', 'last_name', 'full_name', 'user_name', 'profile_display_name', 'kyc_verified_at'])
                ->each(function ($u) use (&$byUid, &$nameByUid, &$roleByUid, $displayNameFromUser) {
                    if (! empty($u->firebase_uid)) {
                        $byUid[$u->firebase_uid] = $u->profile_image_link;
                        $dn = $displayNameFromUser($u);
                        if ($dn !== '') {
                            $nameByUid[$u->firebase_uid] = $dn;
                        }
                        $roleLabel = $u->primaryRoleDisplayLabel();
                        if ($roleLabel !== '') {
                            $roleByUid[$u->firebase_uid] = $roleLabel;
                        }
                    }
                });
        }

        if (count($emails) > 0) {
            User::where(function ($q) use ($emails) {
                foreach ($emails as $i => $le) {
                    if ($i === 0) {
                        $q->whereRaw('LOWER(email) = ?', [$le]);
                    } else {
                        $q->orWhereRaw('LOWER(email) = ?', [$le]);
                    }
                }
            })->get(['email', 'profile_image', 'primary_role', 'other_role_text', 'first_name', 'last_name', 'full_name', 'user_name', 'profile_display_name', 'kyc_verified_at'])->each(function ($u) use (&$byEmail, &$nameByEmail, &$roleByEmail, $displayNameFromUser) {
                $byEmail[mb_strtolower($u->email)] = $u->profile_image_link;
                $dn = $displayNameFromUser($u);
                if ($dn !== '') {
                    $nameByEmail[mb_strtolower($u->email)] = $dn;
                }
                $roleLabel = $u->primaryRoleDisplayLabel();
                if ($roleLabel !== '') {
                    $roleByEmail[mb_strtolower($u->email)] = $roleLabel;
                }
            });
        }

        if (count($usernames) > 0) {
            $normalizedUsernames = array_values(array_unique(array_filter(array_map(static function ($un) {
                return mb_strtolower(trim((string) $un));
            }, $usernames))));

            if (count($normalizedUsernames) > 0) {
                User::whereIn('user_name', $normalizedUsernames)
                    ->orWhereRaw('LOWER(user_name) in (' . implode(',', array_fill(0, count($normalizedUsernames), '?')) . ')', $normalizedUsernames)
                    ->get(['user_name', 'profile_image', 'primary_role', 'other_role_text', 'first_name', 'last_name', 'full_name', 'profile_display_name', 'kyc_verified_at'])
                    ->each(function ($user) use (&$byUsername, &$nameByUsername, &$roleByUsername, $displayNameFromUser) {
                        if (! $user->user_name) {
                            return;
                        }
                        $key = mb_strtolower($user->user_name);
                        $byUsername[$key] = $user->profile_image_link;
                        $dn = $displayNameFromUser($user);
                        if ($dn !== '') {
                            $nameByUsername[$key] = $dn;
                        }
                        $roleLabel = $user->primaryRoleDisplayLabel();
                        if ($roleLabel !== '') {
                            $roleByUsername[$key] = $roleLabel;
                        }
                    });
            }
        }

        return response()->json([
            'by_uid' => $byUid,
            'by_email' => $byEmail,
            'by_username' => $byUsername,
            'name_by_uid' => $nameByUid,
            'name_by_email' => $nameByEmail,
            'name_by_username' => $nameByUsername,
            'role_by_uid' => $roleByUid,
            'role_by_email' => $roleByEmail,
            'role_by_username' => $roleByUsername,
        ]);
    }
}
