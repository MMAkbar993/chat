<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserDetails extends Model
{
    use HasFactory;

    protected $fillable = [
        'id', 'user_id', 'user_about', 'active_status', 'friends_status', 'deactivate_account', 'facebook', 'google', 'twitter', 'linkedin', 'youtube', 'location',
    ];

    protected $hidden = ['created_at', 'updated_at'];

}
