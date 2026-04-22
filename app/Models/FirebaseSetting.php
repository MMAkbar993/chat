<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FirebaseSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'application_key',
        'authnticate_domain',
        'database_url',
        'project_id',
        'storage_bucket',
        'message_id',
        'application_id',
    ];
}
