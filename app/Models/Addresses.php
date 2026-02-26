<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Addresses extends Model
{
    use HasFactory;

    protected $fillable = [
        'id', 'address', 'user_id', 'city', 'state', 'country', 'postal_code', 'created_by', 'updated_by'
    ];

    protected $hidden = ['created_by', 'updated_by'];

}
