<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LanguageKeywords extends Model
{
    use HasFactory;
    protected $table    = 'language_keywords';
    protected $fillable = [
        'language_id',
        'page',
        'label',
        'value',
    ];
    protected $hidden = ['created_at', 'updated_at'];
}
