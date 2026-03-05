<?php

namespace App\Models;


use Laravel\Passport\HasApiTokens;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\Storage;
use Illuminate\Database\Eloquent\SoftDeletes;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable, SoftDeletes, Notifiable, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'first_name', 'last_name', 'full_name', 'email', 'user_name', 'password', 'user_type', 'api_token', 'gender', 'dob', 'mobile_number', 'profile_image', 'provider', 'provider_id', 'last_login_at',
        'company_name', 'company_domain', 'country', 'primary_role', 'other_role_text', 'terms_accepted_at', 'kyc_verified_at', 'kyc_provider_id', 'subscription_status',
        'two_factor_secret', 'two_factor_enabled_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'remember_token', 'created_by', 'updated_by', ' deleted_by', ' created_at', 'updated_at', 'deleted_at', 'profile_image',
        'two_factor_secret',
    ];

    protected $appends = ['profile_image_link'];

    public function getProfileImageLinkAttribute() {
        if (empty($this->profile_image)) {
            return '';
        }
        $path = 'image/profile/' . $this->profile_image;
        $oldPath = 'public/image/profile/' . $this->profile_image;
        $disk = Storage::disk('public');
        if ($disk->exists($path)) {
            return request()->getSchemeAndHttpHost() . '/storage/' . $path;
        }
        if ($disk->exists($oldPath)) {
            return request()->getSchemeAndHttpHost() . '/storage/' . $oldPath;
        }
        return '';
    }


    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'terms_accepted_at' => 'datetime',
            'kyc_verified_at' => 'datetime',
            'two_factor_enabled_at' => 'datetime',
            'two_factor_secret' => 'encrypted',
            // 'password' => 'hashed',
        ];
    }

    public function has2faEnabled(): bool
    {
        return $this->two_factor_enabled_at !== null && $this->two_factor_secret !== null;
    }

    public function subscription()
    {
        return $this->hasOne(\App\Models\UserSubscription::class);
    }

    public function isKycVerified(): bool
    {
        return $this->kyc_verified_at !== null;
    }

    public function isSubscriptionActive(): bool
    {
        return $this->subscription_status === 'active';
    }

    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [];
    }

    public function get_user_address() {
        return $this->hasOne(Addresses::class, 'user_id', 'id');
    }

    public function get_user_details() {
        return $this->hasOne(UserDetails::class, 'user_id', 'id');
    }

    public function websites()
    {
        return $this->hasMany(UserWebsite::class)->orderBy('sort_order');
    }

    public function ownedWebsites()
    {
        return $this->hasMany(Website::class, 'admin_user_id');
    }

    public function socialAccounts()
    {
        return $this->hasMany(SocialAccount::class);
    }

    public function groups()
    {
        return $this->belongsToMany(Group::class, 'group_members')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function ownedGroups()
    {
        return $this->hasMany(Group::class, 'owner_id');
    }
}
