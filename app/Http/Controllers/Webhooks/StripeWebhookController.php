<?php

namespace App\Http\Controllers\Webhooks;

use App\Http\Controllers\Controller;
use App\Services\StripeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class StripeWebhookController extends Controller
{
    protected StripeService $stripe;

    public function __construct(StripeService $stripe)
    {
        $this->stripe = $stripe;
    }

    public function handle(Request $request)
    {
        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');

        try {
            $event = $this->stripe->constructWebhookEvent($payload, $sigHeader);
        } catch (\Stripe\Exception\SignatureVerificationException $e) {
            Log::warning('Stripe webhook signature verification failed', ['error' => $e->getMessage()]);
            return response('Invalid signature', 400);
        } catch (\Throwable $e) {
            Log::error('Stripe webhook parse error', ['error' => $e->getMessage()]);
            return response('Webhook error', 400);
        }

        Log::info('Stripe webhook received', ['type' => $event->type]);

        match ($event->type) {
            'checkout.session.completed' => $this->stripe->handleCheckoutCompleted($event->data->object),
            'invoice.paid' => $this->stripe->handleInvoicePaid($event->data->object->toArray()),
            'customer.subscription.updated' => $this->stripe->handleSubscriptionUpdated($event->data->object->toArray()),
            'customer.subscription.deleted' => $this->stripe->handleSubscriptionDeleted($event->data->object->toArray()),
            default => Log::info('Unhandled Stripe event', ['type' => $event->type]),
        };

        return response('OK', 200);
    }
}
