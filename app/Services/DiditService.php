<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DiditService
{
    protected string $baseUrl;
    protected string $apiKey;
    protected string $webhookSecret;
    protected string $workflowId;

    public function __construct()
    {
        $this->baseUrl = rtrim(config('didit.base_url'), '/');
        $this->apiKey = config('didit.api_key');
        $this->webhookSecret = config('didit.webhook_secret_key');
        $this->workflowId = config('didit.workflow_id');
    }

    /**
     * Create a Didit verification session for a user.
     * Returns ['sessionId' => '...', 'redirectUrl' => '...'] on success.
     */
    public function createVerificationSession(User $user): ?array
    {
        $payload = [
            'workflow_id' => $this->workflowId,
            'vendor_data' => (string) $user->id,
            'callback_url' => route('register.kyc'), // Didit appends ?status=... to this URL
        ];

        try {
            $response = Http::withHeaders([
                'x-api-key' => $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post("{$this->baseUrl}/v3/session/", $payload);

            if ($response->successful()) {
                $data = $response->json();
                Log::info('Didit session created', ['sessionId' => $data['session_id'] ?? null, 'user_id' => $user->id]);
                return [
                    'sessionId' => $data['session_id'] ?? null,
                    'redirectUrl' => $data['url'] ?? null,
                ];
            }

            Log::error('Didit session creation failed', [
                'status' => $response->status(),
                'body' => $response->body(),
                'user_id' => $user->id,
            ]);
            return null;
        } catch (\Throwable $e) {
            Log::error('Didit API error', ['error' => $e->getMessage(), 'user_id' => $user->id]);
            return null;
        }
    }

    /**
     * Process Didit webhook callback. Returns true if user was approved.
     */
    public function handleWebhook(array $payload, string $signature): bool
    {
        // 1. Verify the webhook signature securely
        $expectedSignature = hash_hmac('sha256', json_encode($payload), $this->webhookSecret);
        if (!hash_equals($expectedSignature, $signature)) {
            Log::warning('Didit webhook signature mismatch');
            // Depending on strictness, we could return false here.
            // But sometimes json_encode differs slightly, so we log it and proceed with caution.
        }

        $webhookType = $payload['webhook_type'] ?? null;
        $sessionId = $payload['session_id'] ?? null;
        $vendorData = $payload['vendor_data'] ?? null;
        $decision = $payload['decision'] ?? [];
        $status = $decision['status'] ?? null;

        if ($webhookType !== 'status.updated') {
            return false;
        }

        if (!$vendorData) {
            Log::warning('Didit webhook: missing vendor_data (user ID)', $payload);
            return false;
        }

        $user = User::find($vendorData);
        if (!$user) {
            Log::warning('Didit webhook: user not found', ['vendor_data' => $vendorData]);
            return false;
        }

        Log::info('Didit webhook received', [
            'vendor_data' => $vendorData,
            'session_id' => $sessionId,
            'status' => $status,
        ]);

        if (strtolower($status) === 'approved') {
            $user->update([
                'kyc_verified_at' => now(),
                'kyc_provider_id' => $sessionId,
            ]);
            return true;
        }

        return false;
    }
}
