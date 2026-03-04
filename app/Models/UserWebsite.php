<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserWebsite extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'website_id',
        'url',
        'verification_token',
        'verified_at',
        'relationship_type',
        'sort_order',
    ];

    protected $casts = [
        'verified_at' => 'datetime',
    ];

    public const RELATIONSHIP_OWNER = 'owner';
    public const RELATIONSHIP_REPRESENTATIVE = 'representative';

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function website()
    {
        return $this->belongsTo(Website::class);
    }

    public function isVerified(): bool
    {
        return $this->verified_at !== null;
    }

    public function isOwner(): bool
    {
        return $this->relationship_type === self::RELATIONSHIP_OWNER;
    }

    public function isRepresentative(): bool
    {
        return $this->relationship_type === self::RELATIONSHIP_REPRESENTATIVE;
    }

    public function getDisplayUrl(): string
    {
        return $this->website?->domain ? 'https://' . $this->website->domain : $this->url;
    }
}
