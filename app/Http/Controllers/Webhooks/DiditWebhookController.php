<?php

namespace App\Http\Controllers\Webhooks;

use App\Http\Controllers\Controller;
use App\Services\DiditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class DiditWebhookController extends Controller
{
    protected DiditService $didit;

    public function __construct(DiditService $didit)
    {
        $this->didit = $didit;
    }

    public function handle(Request $request)
    {
        $payload = $request->all();
        $signature = $request->header('X-Signature') ?? '';

        Log::info('Didit webhook payload received', ['keys' => array_keys($payload)]);

        $approved = $this->didit->handleWebhook($payload, $signature);

        return response()->json([
            'status' => $approved ? 'approved' : 'received',
        ], 200);
    }
}
