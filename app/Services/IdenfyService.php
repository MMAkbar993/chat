<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class IdenfyService
{
    protected string $baseUrl;
    protected string $apiKey;
    protected string $apiSecret;

    public function __construct()
    {
        $this->baseUrl = rtrim(config('idenfy.base_url'), '/');
        $this->apiKey = config('idenfy.api_key');
        $this->apiSecret = config('idenfy.api_secret');
    }

    /**
     * Create an iDenfy verification token/session for a user.
     * Returns ['authToken' => '...', 'scanRef' => '...', 'redirectUrl' => '...'] on success.
     */
    public function createVerificationSession(User $user): ?array
    {
        $nameParts = preg_split('/\s+/', trim($user->full_name ?? $user->first_name . ' ' . $user->last_name), 2);

        $payload = [
            'clientId' => (string) $user->id,
            'firstName' => $nameParts[0] ?? '',
            'lastName' => $nameParts[1] ?? '',
            'successUrl' => route('register.kyc') . '?status=success',
            'errorUrl' => route('register.kyc') . '?status=error',
            'unverifiedUrl' => route('register.kyc') . '?status=unverified',
            'callbackUrl' => config('idenfy.callback_url'),
            'locale' => 'en',
        ];

        try {
            $response = Http::withBasicAuth($this->apiKey, $this->apiSecret)
                ->post("{$this->baseUrl}/api/v2/token", $payload);

            if ($response->successful()) {
                $data = $response->json();
                Log::info('iDenfy session created', ['scanRef' => $data['scanRef'] ?? null, 'user_id' => $user->id]);
                return [
                    'authToken' => $data['authToken'] ?? null,
                    'scanRef' => $data['scanRef'] ?? null,
                    'redirectUrl' => "https://ivs.idenfy.com/api/v2/redirect?authToken=" . ($data['authToken'] ?? ''),
                ];
            }

            Log::error('iDenfy token creation failed', [
                'status' => $response->status(),
                'body' => $response->body(),
                'user_id' => $user->id,
            ]);
            return null;
        } catch (\Throwable $e) {
            Log::error('iDenfy API error', ['error' => $e->getMessage(), 'user_id' => $user->id]);
            return null;
        }
    }

    /**
     * Process iDenfy webhook callback. Returns true if user was approved.
     */
    public function handleWebhook(array $payload): bool
    {
        $clientId = $payload['clientId'] ?? null;
        $scanRef = $payload['scanRef'] ?? null;
        $status = $payload['status'] ?? [];
        $overall = $status['overall'] ?? null;

        if (!$clientId) {
            Log::warning('iDenfy webhook: missing clientId', $payload);
            return false;
        }

        $user = User::find($clientId);
        if (!$user) {
            Log::warning('iDenfy webhook: user not found', ['clientId' => $clientId]);
            return false;
        }

        Log::info('iDenfy webhook received', [
            'clientId' => $clientId,
            'scanRef' => $scanRef,
            'overall' => $overall,
        ]);

        if ($overall === 'APPROVED') {
            $user->update([
                'kyc_verified_at' => now(),
                'kyc_provider_id' => $scanRef,
                'subscription_status' => 'active',
            ]);
            return true;
        }

        return false;
    }
}
