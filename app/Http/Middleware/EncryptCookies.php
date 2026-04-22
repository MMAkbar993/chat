<?php

namespace App\Http\Middleware;

use Illuminate\Cookie\Middleware\EncryptCookies as Middleware;

/**
 * @property array<int, string> $except
 */
class EncryptCookies extends Middleware
{
    protected $except = [
        // Add the names of cookies you want to exclude from encryption
    ];
}

