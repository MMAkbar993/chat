<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LanguageSettings extends Model
{
    use HasFactory;
    protected $table    = 'language_settings';
    protected $fillable = [
        'user_id',
        'language_name',
        'code',
        'active_status',
    ];
    protected $hidden = ['created_at', 'updated_at'];
}
