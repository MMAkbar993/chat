<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserSubscription;
use Illuminate\Support\Facades\Log;
use Stripe\Stripe;
use Stripe\Checkout\Session as CheckoutSession;
use Stripe\SetupIntent;
use Stripe\Subscription;
use Stripe\Webhook;
use Stripe\Exception\SignatureVerificationException;

class StripeService
{
    public function __construct()
    {
        Stripe::setApiKey(config('stripe.secret'));
    }

    /**
     * Setup-mode checkout: collects card details without charging.
     * The actual subscription is created later (after KYC approval).
     */
    public function createSetupCheckoutSession(User $user, string $plan, string $successUrl, string $cancelUrl): CheckoutSession
    {
        $separator = str_contains($successUrl, '?') ? '&' : '?';

        return CheckoutSession::create([
            'mode' => 'setup',
            'currency' => 'eur',
            'success_url' => $successUrl . $separator . 'session_id={CHECKOUT_SESSION_ID}',
            'cancel_url' => $cancelUrl,
            'client_reference_id' => (string) $user->id,
            'customer_email' => $user->email,
            'metadata' => [
                'user_id' => $user->id,
                'plan' => $plan,
            ],
        ]);
    }

    /**
     * Standard subscription-mode checkout (kept for direct payment flows).
     */
    public function createCheckoutSession(User $user, string $plan, string $successUrl, string $cancelUrl): CheckoutSession
    {
        $planConfig = config("stripe.plans.{$plan}");
        if (!$planConfig || empty($planConfig['price_id'])) {
            throw new \InvalidArgumentException("Invalid plan: {$plan}");
        }

        $separator = str_contains($successUrl, '?') ? '&' : '?';

        return CheckoutSession::create([
            'mode' => 'subscription',
            'line_items' => [[
                'price' => $planConfig['price_id'],
                'quantity' => 1,
            ]],
            'success_url' => $successUrl . $separator . 'session_id={CHECKOUT_SESSION_ID}',
            'cancel_url' => $cancelUrl,
            'client_reference_id' => (string) $user->id,
            'customer_email' => $user->email,
            'metadata' => [
                'user_id' => $user->id,
                'plan' => $plan,
            ],
        ]);
    }

    public function retrieveSession(string $sessionId): CheckoutSession
    {
        return CheckoutSession::retrieve([
            'id' => $sessionId,
            'expand' => ['subscription', 'customer', 'setup_intent'],
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

        if ($session->mode === 'setup') {
            $this->handleSetupCheckoutCompleted($session, $user);
        } else {
            $this->handleSubscriptionCheckoutCompleted($session, $user);
        }
    }

    /**
     * Setup mode: store customer + payment method for later subscription creation.
     */
    protected function handleSetupCheckoutCompleted(CheckoutSession $session, User $user): void
    {
        $customerId = is_object($session->customer) ? $session->customer->id : $session->customer;

        $paymentMethodId = null;
        $setupIntent = $session->setup_intent;
        if (is_object($setupIntent)) {
            $paymentMethodId = is_object($setupIntent->payment_method)
                ? $setupIntent->payment_method->id
                : $setupIntent->payment_method;
        } elseif (is_string($setupIntent)) {
            $si = SetupIntent::retrieve($setupIntent);
            $paymentMethodId = $si->payment_method;
        }

        $plan = $session->metadata->plan ?? 'monthly';

        UserSubscription::updateOrCreate(
            ['user_id' => $user->id],
            [
                'stripe_customer_id' => $customerId,
                'stripe_payment_method_id' => $paymentMethodId,
                'plan' => $plan,
                'status' => 'pending_kyc',
            ]
        );

        $user->update(['subscription_status' => 'pending_kyc']);

        Log::info('Setup checkout completed – payment method saved, awaiting KYC', [
            'user_id' => $user->id,
            'customer' => $customerId,
        ]);
    }

    /**
     * Subscription mode: immediate subscription (fallback / direct flow).
     */
    protected function handleSubscriptionCheckoutCompleted(CheckoutSession $session, User $user): void
    {
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

        $user->update(['subscription_status' => 'active']);
    }

    /**
     * Called after KYC approval: create the real Stripe subscription using
     * the payment method that was saved during the setup checkout.
     *
     * @return bool true if subscription was successfully created
     */
    public function createSubscriptionFromSavedPayment(User $user): bool
    {
        $sub = UserSubscription::where('user_id', $user->id)->first();
        if (!$sub || !$sub->stripe_customer_id || !$sub->stripe_payment_method_id) {
            Log::warning('Cannot create subscription: missing saved payment data', ['user_id' => $user->id]);
            return false;
        }

        $planConfig = config("stripe.plans.{$sub->plan}", config('stripe.plans.monthly'));
        if (empty($planConfig['price_id'])) {
            Log::error('Cannot create subscription: invalid plan config', ['plan' => $sub->plan]);
            return false;
        }

        $subscription = Subscription::create([
            'customer' => $sub->stripe_customer_id,
            'items' => [['price' => $planConfig['price_id']]],
            'default_payment_method' => $sub->stripe_payment_method_id,
        ]);

        $periodEnd = $sub->plan === 'yearly' ? now()->addYear() : now()->addMonth();

        $sub->update([
            'stripe_subscription_id' => $subscription->id,
            'stripe_price_id' => $planConfig['price_id'],
            'status' => 'active',
            'current_period_ends_at' => $periodEnd,
        ]);

        $user->update(['subscription_status' => 'active']);

        Log::info('Subscription created from saved payment method', [
            'user_id' => $user->id,
            'subscription_id' => $subscription->id,
        ]);

        return true;
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
            $sub->user?->update(['subscription_status' => 'active']);
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
