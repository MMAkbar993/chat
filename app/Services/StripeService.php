<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserSubscription;
use Illuminate\Support\Facades\Log;
use Stripe\Stripe;
use Stripe\Checkout\Session as CheckoutSession;
use Stripe\Webhook;
use Stripe\Exception\SignatureVerificationException;

class StripeService
{
    public function __construct()
    {
        Stripe::setApiKey(config('stripe.secret'));
    }

    public function createCheckoutSession(User $user, string $plan, string $successUrl, string $cancelUrl): CheckoutSession
    {
        $planConfig = config("stripe.plans.{$plan}");
        if (!$planConfig || empty($planConfig['price_id'])) {
            throw new \InvalidArgumentException("Invalid plan: {$plan}");
        }

        $params = [
            'mode' => 'subscription',
            'line_items' => [[
                'price' => $planConfig['price_id'],
                'quantity' => 1,
            ]],
            'success_url' => $successUrl . '?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url' => $cancelUrl,
            'client_reference_id' => (string) $user->id,
            'customer_email' => $user->email,
            'metadata' => [
                'user_id' => $user->id,
                'plan' => $plan,
            ],
        ];

        return CheckoutSession::create($params);
    }

    public function retrieveSession(string $sessionId): CheckoutSession
    {
        return CheckoutSession::retrieve([
            'id' => $sessionId,
            'expand' => ['subscription', 'customer'],
        ]);
    }

    /**
     * @param string $payload  Raw request body
     * @param string|null $sigHeader  Stripe-Signature header
     * @return \Stripe\Event
     *
     * When STRIPE_WEBHOOK_SECRET is empty the signature check is skipped so you
     * can test locally (e.g. with Stripe CLI --forward-to without a signing secret).
     * In production always set the secret so payloads are verified.
     */
    public function constructWebhookEvent(string $payload, ?string $sigHeader): \Stripe\Event
    {
        $secret = config('stripe.webhook_secret');

        if (!empty($secret) && !str_starts_with($secret, 'whsec_REPLACE')) {
            return Webhook::constructEvent($payload, $sigHeader ?? '', $secret);
        }

        Log::warning('Stripe webhook signature verification SKIPPED – set STRIPE_WEBHOOK_SECRET for production');
        return \Stripe\Event::constructFrom(json_decode($payload, true));
    }

    public function handleCheckoutCompleted(CheckoutSession $session): void
    {
        $userId = $session->metadata->user_id ?? $session->client_reference_id;
        $user = User::find($userId);
        if (!$user) {
            Log::warning('Stripe checkout completed but user not found', ['user_id' => $userId]);
            return;
        }

        $customerId = is_object($session->customer) ? $session->customer->id : $session->customer;
        $subscriptionId = is_object($session->subscription) ? $session->subscription->id : $session->subscription;

        $plan = $session->metadata->plan ?? 'monthly';
        $periodEnd = $plan === 'yearly' ? now()->addYear() : now()->addMonth();
        $planConfig = config("stripe.plans.{$plan}", config('stripe.plans.monthly'));

        UserSubscription::updateOrCreate(
            ['user_id' => $user->id],
            [
                'stripe_customer_id' => $customerId,
                'stripe_subscription_id' => $subscriptionId,
                'stripe_price_id' => $planConfig['price_id'] ?? '',
                'plan' => $plan,
                'status' => 'active',
                'current_period_ends_at' => $periodEnd,
            ]
        );

        $user->update(['subscription_status' => 'pending_kyc']);
    }

    public function handleInvoicePaid(array $invoice): void
    {
        $subscriptionId = $invoice['subscription'] ?? null;
        if (!$subscriptionId) {
            return;
        }

        $sub = UserSubscription::where('stripe_subscription_id', $subscriptionId)->first();
        if ($sub) {
            $periodEnd = $invoice['lines']['data'][0]['period']['end'] ?? null;
            $fallback = $sub->plan === 'yearly' ? now()->addYear() : now()->addMonth();
            $sub->update([
                'status' => 'active',
                'current_period_ends_at' => $periodEnd ? \Carbon\Carbon::createFromTimestamp($periodEnd) : $fallback,
            ]);
            $sub->user?->update(['subscription_status' => $sub->user->isKycVerified() ? 'active' : 'pending_kyc']);
        }
    }

    public function handleSubscriptionDeleted(array $subscription): void
    {
        $subscriptionId = $subscription['id'] ?? null;
        $sub = UserSubscription::where('stripe_subscription_id', $subscriptionId)->first();
        if ($sub) {
            $sub->update(['status' => 'canceled']);
            $sub->user?->update(['subscription_status' => 'canceled']);
        }
    }

    public function handleSubscriptionUpdated(array $subscription): void
    {
        $subscriptionId = $subscription['id'] ?? null;
        $status = $subscription['status'] ?? 'active';
        $sub = UserSubscription::where('stripe_subscription_id', $subscriptionId)->first();
        if ($sub) {
            $mappedStatus = match ($status) {
                'active' => 'active',
                'past_due' => 'past_due',
                'canceled', 'unpaid' => 'canceled',
                default => $status,
            };
            $sub->update(['status' => $mappedStatus]);
            if (in_array($mappedStatus, ['canceled', 'past_due'])) {
                $sub->user?->update(['subscription_status' => $mappedStatus]);
            }
        }
    }
}
