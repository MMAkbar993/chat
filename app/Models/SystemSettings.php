<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SystemSettings extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'id', 'user_id', 'system_settings_name', 'application_key', 'authnticate_domain', 'database_url', 'project_id', 'storage_bucket', 'message_id', 'application_id', 'active_status', 'created_at', ' updated_at', 'deleted_at'
    ];

    protected $hidden = ['created_at', 'updated_at', 'deleted_at'];

}
