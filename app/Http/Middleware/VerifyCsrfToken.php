<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array
     */
    protected $except = [
        'generate-token',
        'webhooks/stripe',
        'webhooks/didit',
        // Frontend telemetry uses sendBeacon (no custom CSRF headers).
        // Keep this endpoint CSRF-exempt to avoid noisy 419s in console.
        'api/perf-metrics',
    ];
}
