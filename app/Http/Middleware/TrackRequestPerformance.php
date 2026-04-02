<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class TrackRequestPerformance
{
    public function handle(Request $request, Closure $next): Response
    {
        $startedAt = microtime(true);
        $response = $next($request);
        $durationMs = (microtime(true) - $startedAt) * 1000;

        $response->headers->set('Server-Timing', 'app;dur=' . number_format($durationMs, 1, '.', ''));
        $response->headers->set('X-Response-Time-Ms', (string) round($durationMs));

        $slowThreshold = (int) env('SLOW_REQUEST_LOG_MS', 1200);
        if ($durationMs >= $slowThreshold) {
            Log::warning('Slow request detected', [
                'method' => $request->method(),
                'path' => $request->path(),
                'status' => $response->getStatusCode(),
                'duration_ms' => round($durationMs, 2),
                'user_id' => optional($request->user())->id,
            ]);
        }

        return $response;
    }
}
