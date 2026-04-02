<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PerformanceMetricController extends Controller
{
    /**
     * Browsers and crawlers may GET this URL; ingestion is POST-only (store).
     */
    public function info(): JsonResponse
    {
        return response()->json([
            'message' => 'Submit performance samples with POST.',
            'endpoint' => 'POST /api/perf-metrics',
            'fields' => ['type' => 'required', 'path' => 'optional', 'duration_ms' => 'optional', 'meta' => 'optional'],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'type' => 'required|string|max:50',
            'path' => 'nullable|string|max:255',
            'duration_ms' => 'nullable|numeric|min:0|max:600000',
            'meta' => 'nullable|array',
        ]);

        Log::info('Frontend performance metric', [
            'type' => $payload['type'],
            'path' => $payload['path'] ?? $request->path(),
            'duration_ms' => isset($payload['duration_ms']) ? round((float) $payload['duration_ms'], 2) : null,
            'meta' => $payload['meta'] ?? [],
            'user_id' => optional($request->user())->id,
        ]);

        return response()->json(['ok' => true]);
    }
}
