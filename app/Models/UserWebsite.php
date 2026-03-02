<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserWebsite extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'url',
        'verification_token',
        'verified_at',
        'sort_order',
    ];

    protected $casts = [
        'verified_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function isVerified(): bool
    {
        return $this->verified_at !== null;
    }
}
