<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Website extends Model
{
    use HasFactory;

    protected $fillable = [
        'domain',
        'admin_user_id',
        'verified_at',
    ];

    protected $casts = [
        'verified_at' => 'datetime',
    ];

    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_user_id');
    }

    public function representatives()
    {
        return $this->hasMany(WebsiteRepresentative::class);
    }

    public function userWebsites()
    {
        return $this->hasMany(UserWebsite::class);
    }

    public function pendingRepresentationRequests()
    {
        return $this->representatives()->where('status', 'pending');
    }

    public function approvedRepresentatives()
    {
        return $this->representatives()->where('status', 'approved');
    }
}
