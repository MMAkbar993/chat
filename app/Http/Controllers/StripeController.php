<?php

namespace App\Http\Controllers;

use App\Services\StripeService;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class StripeController extends Controller
{
    protected StripeService $stripe;

    public function __construct(StripeService $stripe)
    {
        $this->stripe = $stripe;
    }

    /**
     * Setup-mode checkout: collects card details without charging.
     * The user will only be charged when KYC is approved.
     */
    public function checkout(Request $request)
    {
        $user = Auth::user() ?? User::find($request->session()->get('registered_user_id'));
        if (!$user) {
            if ($request->wantsJson()) {
                return response()->json(['message' => 'Please register first.'], 422);
            }
            return redirect()->route('signup')->withErrors('Please register first.');
        }

        $plan = $request->input('plan', 'monthly');
        if (!in_array($plan, ['monthly', 'yearly'])) {
            $plan = 'monthly';
        }

        $isPopup = $request->boolean('popup', false);

        try {
            $successUrl = $isPopup
                ? route('stripe.success', ['popup' => 1])
                : route('stripe.success');
            $cancelUrl = $isPopup
                ? route('stripe.cancel', ['popup' => 1])
                : route('register.payment');

            $session = $this->stripe->createSetupCheckoutSession(
                $user,
                $plan,
                $successUrl,
                $cancelUrl
            );

            if ($request->wantsJson()) {
                return response()->json(['checkout_url' => $session->url]);
            }

            return redirect($session->url);
        } catch (\Throwable $e) {
            Log::error('Stripe checkout failed', ['error' => $e->getMessage()]);
            if ($request->wantsJson()) {
                return response()->json(['message' => 'Payment system error. Please try again.'], 500);
            }
            return back()->withErrors('Payment system error. Please try again.');
        }
    }

    /**
     * After Stripe setup checkout completes: saves payment method, moves user to KYC step.
     */
    public function success(Request $request)
    {
        $sessionId = $request->query('session_id');
        if (!$sessionId) {
            return redirect()->route('register.payment')->withErrors('Invalid payment session.');
        }

        try {
            $session = $this->stripe->retrieveSession($sessionId);
            $this->stripe->handleCheckoutCompleted($session);

            $userId = $session->metadata->user_id ?? $session->client_reference_id;
            $request->session()->put('registered_user_id', $userId);

            if ($request->boolean('popup')) {
                return view('frontend.stripe-success-popup');
            }

            return redirect()->route('register.kyc')->with('success', __('Payment details saved! Please complete identity verification.'));
        } catch (\Throwable $e) {
            Log::error('Stripe success callback failed', ['error' => $e->getMessage()]);
            return redirect()->route('register.payment')->withErrors('Could not verify payment. Please contact support.');
        }
    }

    public function cancel(Request $request)
    {
        if ($request->boolean('popup')) {
            return view('frontend.stripe-cancel-popup');
        }
        return redirect()->route('register.payment')->with('info', __('Payment was cancelled. You can try again.'));
    }
}
