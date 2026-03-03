<?php

namespace App\Http\Controllers;

use App\Models\Group;
use App\Models\GroupMember;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class GroupChatController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $groups = Group::whereHas('members', fn ($q) => $q->where('user_id', $user->id))
            ->orWhere('owner_id', $user->id)
            ->with(['owner:id,first_name,last_name,user_name', 'members:id,first_name,last_name,user_name'])
            ->withCount('members')
            ->latest()
            ->get();

        return response()->json($groups);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'image' => 'nullable|image|max:2048',
            'member_ids' => 'required|array|min:1',
            'member_ids.*' => 'exists:users,id',
            'firebase_group_id' => 'nullable|string',
        ]);

        $user = Auth::user();

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('group-images', 'public');
        }

        $group = Group::create([
            'name' => $request->name,
            'description' => $request->description,
            'image' => $imagePath,
            'owner_id' => $user->id,
            'firebase_group_id' => $request->firebase_group_id,
        ]);

        $group->members()->attach($user->id, ['role' => 'admin']);

        $memberIds = collect($request->member_ids)->reject(fn ($id) => $id == $user->id);
        foreach ($memberIds as $memberId) {
            $group->members()->attach($memberId, ['role' => 'member']);
        }

        $group->load('members:id,first_name,last_name,user_name');
        $group->loadCount('members');

        return response()->json($group, 201);
    }

    public function show(Group $group)
    {
        $user = Auth::user();

        if (!$group->isMember($user) && $group->owner_id !== $user->id) {
            return response()->json(['error' => 'Not a member of this group'], 403);
        }

        $group->load([
            'owner:id,first_name,last_name,user_name',
            'members:id,first_name,last_name,user_name,profile_image',
        ]);
        $group->loadCount('members');

        return response()->json($group);
    }

    public function update(Request $request, Group $group)
    {
        $user = Auth::user();

        if (!$group->isAdmin($user)) {
            return response()->json(['error' => 'Only admins can edit the group'], 403);
        }

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'image' => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('image')) {
            if ($group->image) {
                Storage::disk('public')->delete($group->image);
            }
            $group->image = $request->file('image')->store('group-images', 'public');
        }

        $group->fill($request->only(['name', 'description']));
        $group->save();

        return response()->json($group);
    }

    public function destroy(Group $group)
    {
        $user = Auth::user();

        if ($group->owner_id !== $user->id) {
            return response()->json(['error' => 'Only the group owner can delete the group'], 403);
        }

        if ($group->image) {
            Storage::disk('public')->delete($group->image);
        }

        $group->delete();

        return response()->json(['message' => 'Group deleted']);
    }

    public function addMembers(Request $request, Group $group)
    {
        $user = Auth::user();

        if (!$group->isAdmin($user)) {
            return response()->json(['error' => 'Only admins can add members'], 403);
        }

        $request->validate([
            'member_ids' => 'required|array|min:1',
            'member_ids.*' => 'exists:users,id',
        ]);

        $memberIds = collect($request->member_ids)->unique()->values()->all();
        $existingMemberIds = $group->members()->pluck('users.id')->toArray();
        $newIds = array_diff($memberIds, $existingMemberIds);

        if (!empty($newIds)) {
            $attachData = [];
            foreach ($newIds as $id) {
                $attachData[$id] = ['role' => 'member'];
            }
            $group->members()->attach($attachData);
        }

        $group->load('members:id,first_name,last_name,user_name');
        $group->loadCount('members');

        return response()->json($group);
    }

    public function removeMember(Request $request, Group $group)
    {
        $user = Auth::user();
        $memberId = $request->input('user_id');

        if ($memberId == $group->owner_id) {
            return response()->json(['error' => 'Cannot remove the group owner'], 422);
        }

        $isSelf = $memberId == $user->id;
        if (!$isSelf && !$group->isAdmin($user)) {
            return response()->json(['error' => 'Only admins can remove members'], 403);
        }

        $group->members()->detach($memberId);
        $group->loadCount('members');

        return response()->json(['message' => 'Member removed', 'members_count' => $group->members_count]);
    }

    public function promoteAdmin(Request $request, Group $group)
    {
        $user = Auth::user();

        if ($group->owner_id !== $user->id) {
            return response()->json(['error' => 'Only the owner can promote admins'], 403);
        }

        $request->validate(['user_id' => 'required|exists:users,id']);

        GroupMember::where('group_id', $group->id)
            ->where('user_id', $request->user_id)
            ->update(['role' => 'admin']);

        return response()->json(['message' => 'Member promoted to admin']);
    }
}
