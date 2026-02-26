<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class EmailSettings extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'id', 'user_id', 'email_settings_name ', 'from_name', 'from_email_address', 'email_password', 'host', 'port', 'active_status', 'created_at', ' updated_at', 'deleted_at'
    ];

    protected $hidden = ['created_at', 'updated_at', 'deleted_at'];

}
