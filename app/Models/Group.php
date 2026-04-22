<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Group extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'image',
        'owner_id',
        'firebase_group_id',
    ];

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function members()
    {
        return $this->belongsToMany(User::class, 'group_members')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function admins()
    {
        return $this->members()->wherePivot('role', 'admin');
    }

    private array $memberRoleCache = [];

    public function isAdmin(User $user): bool
    {
        if ($this->owner_id === $user->id) {
            return true;
        }
        $this->loadMemberRoleCache($user);
        return ($this->memberRoleCache[$user->id] ?? null) === 'admin';
    }

    public function isMember(User $user): bool
    {
        if ($this->owner_id === $user->id) {
            return true;
        }
        $this->loadMemberRoleCache($user);
        return $this->memberRoleCache[$user->id] !== false;
    }

    private function loadMemberRoleCache(User $user): void
    {
        if (!array_key_exists($user->id, $this->memberRoleCache)) {
            $row = $this->members()->where('user_id', $user->id)->first();
            $this->memberRoleCache[$user->id] = $row ? $row->pivot->role : false;
        }
    }
}
