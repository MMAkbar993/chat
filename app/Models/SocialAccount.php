<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SocialAccount extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'platform',
        'platform_user_id',
        'username',
        'profile_url',
        'oauth_verified',
        'oauth_data',
    ];

    protected $casts = [
        'oauth_verified' => 'boolean',
        'oauth_data' => 'array',
    ];

    public const PLATFORM_YOUTUBE = 'youtube';
    public const PLATFORM_INSTAGRAM = 'instagram';
    public const PLATFORM_X = 'x';
    public const PLATFORM_TWITCH = 'twitch';
    public const PLATFORM_KICK = 'kick';

    public static function supportedPlatforms(): array
    {
        return [
            self::PLATFORM_YOUTUBE,
            self::PLATFORM_INSTAGRAM,
            self::PLATFORM_X,
            self::PLATFORM_TWITCH,
            self::PLATFORM_KICK,
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function isVerified(): bool
    {
        return $this->oauth_verified;
    }
}
