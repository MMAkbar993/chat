<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Group;
use App\Models\Chat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Role;

class AdminController extends Controller
{
    /**
     * Dashboard: counts and recent users/groups from database.
     */
    public function index()
    {
        $totalUsers = User::where('user_type', '!=', 1)->count();
        $totalGroups = Schema::hasTable('groups') ? Group::count() : 0;
        $totalChats = Schema::hasTable('chats') ? Chat::count() : 0;
        $totalStatus = 0;

        $recentUsers = User::where('user_type', '!=', 1)
            ->orderByDesc('created_at')
            ->limit(5)
            ->get(['id', 'first_name', 'last_name', 'email', 'country', 'created_at', 'last_login_at']);

        $recentGroups = collect([]);
        if (Schema::hasTable('groups')) {
            $recentGroups = Group::withCount('members')
                ->with('owner:id,first_name,last_name')
                ->orderByDesc('created_at')
                ->limit(5)
                ->get();
        }

        return view('admin.index', compact(
            'totalUsers',
            'totalGroups',
            'totalChats',
            'totalStatus',
            'recentUsers',
            'recentGroups'
        ));
    }

    /**
     * Users list page.
     */
    public function users()
    {
        return view('admin.users');
    }

    /**
     * API: List users (for DataTables / admin users page).
     */
    public function usersData(Request $request)
    {
        $page = max((int) $request->query('page', 1), 1);
        $perPage = min(max((int) $request->query('per_page', 25), 5), 100);
        $offset = ($page - 1) * $perPage;
        $hasBlockedColumn = Schema::hasColumn('users', 'is_blocked');

        $query = User::where('user_type', '!=', 1)
            ->orderByRaw('COALESCE(last_name, first_name) ASC');

        $total = (clone $query)->count();
        $users = $query
            ->skip($offset)
            ->take($perPage)
            ->get()
            ->map(function ($user, $index) use ($offset, $hasBlockedColumn) {
            $isBlocked = $hasBlockedColumn ? (bool) ($user->is_blocked ?? false) : false;
            return [
                'id' => $user->id,
                'sno' => $offset + $index + 1,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'name' => trim($user->first_name . ' ' . $user->last_name) ?: $user->full_name ?? '-',
                'email' => $user->email,
                'mobile_number' => $user->mobile_number ?? '-',
                'country' => $user->country ?? '-',
                'reg_date' => $user->created_at?->format('M d, Y') ?? '-',
                'last_seen' => $user->last_login_at ? $user->last_login_at->format('M d, Y H:i') : '-',
                'profile_image_link' => $user->profile_image_link ?? '',
                'is_blocked' => $isBlocked,
            ];
        });

        return response()->json([
            'data' => $users,
            'meta' => [
                'page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'last_page' => (int) ceil(max($total, 1) / $perPage),
            ],
        ]);
    }

    /**
     * API: Create user (admin add user).
     */
    public function storeUser(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'email' => 'required|email|unique:users,email',
            'mobile_number' => 'nullable|string|max:21',
            'country' => 'nullable|string|max:100',
            'password' => 'nullable|string|min:8',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $user = User::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name ?? '',
            'full_name' => trim($request->first_name . ' ' . ($request->last_name ?? '')),
            'email' => $request->email,
            'user_name' => $request->email,
            'password' => Hash::make($request->password ?? 'password123'),
            'user_type' => 2,
            'mobile_number' => $request->mobile_number ?? '',
            'country' => $request->country ?? '',
        ]);

        if (Role::where('name', 'user')->exists()) {
            $user->assignRole('user');
        }

        return response()->json(['success' => true, 'message' => __('User created successfully.'), 'user' => ['id' => $user->id]]);
    }

    /**
     * API: Update user.
     */
    public function updateUser(Request $request, $id)
    {
        $user = User::where('user_type', '!=', 1)->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'email' => 'required|email|unique:users,email,' . $id,
            'mobile_number' => 'nullable|string|max:21',
            'country' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $user->update([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name ?? '',
            'full_name' => trim($request->first_name . ' ' . ($request->last_name ?? '')),
            'email' => $request->email,
            'mobile_number' => $request->mobile_number ?? '',
            'country' => $request->country ?? '',
        ]);

        return response()->json(['success' => true, 'message' => __('User updated successfully.')]);
    }

    /**
     * API: Delete user.
     */
    public function destroyUser($id)
    {
        $user = User::where('user_type', '!=', 1)->findOrFail($id);
        $user->delete();
        return response()->json(['success' => true, 'message' => __('User deleted successfully.')]);
    }

    /**
     * API: Block/Unblock user.
     */
    public function blockUser(Request $request, $id)
    {
        $user = User::where('user_type', '!=', 1)->findOrFail($id);
        if (!Schema::hasColumn('users', 'is_blocked')) {
            return response()->json(['success' => false, 'message' => __('Block feature is not available. Run: php artisan migrate.')], 400);
        }
        $user->is_blocked = !$user->is_blocked;
        $user->save();
        return response()->json(['success' => true, 'message' => $user->is_blocked ? __('User blocked successfully.') : __('User unblocked successfully.'), 'is_blocked' => $user->is_blocked]);
    }

    /**
     * API: Get single user (for edit modal).
     */
    public function getUser($id)
    {
        $user = User::where('user_type', '!=', 1)->findOrFail($id);
        return response()->json([
            'id' => $user->id,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'email' => $user->email,
            'mobile_number' => $user->mobile_number ?? '',
            'country' => $user->country ?? '',
        ]);
    }

    /**
     * Groups page with data from DB.
     */
    public function groups()
    {
        if (!Schema::hasTable('groups')) {
            return view('admin.group', ['groups' => collect([])]);
        }
        $groups = Group::withCount('members')->with('owner:id,first_name,last_name')->orderByDesc('created_at')->get();
        return view('admin.group', compact('groups'));
    }
}
