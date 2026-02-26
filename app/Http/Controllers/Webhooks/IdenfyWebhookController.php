<?php

namespace App\Http\Controllers\Webhooks;

use App\Http\Controllers\Controller;
use App\Services\IdenfyService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class IdenfyWebhookController extends Controller
{
    protected IdenfyService $idenfy;

    public function __construct(IdenfyService $idenfy)
    {
        $this->idenfy = $idenfy;
    }

    public function handle(Request $request)
    {
        $payload = $request->all();

        Log::info('iDenfy webhook payload received', ['keys' => array_keys($payload)]);

        $approved = $this->idenfy->handleWebhook($payload);

        return response()->json([
            'status' => $approved ? 'approved' : 'received',
        ], 200);
    }
}
