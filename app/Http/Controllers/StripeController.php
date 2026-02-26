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

    public function checkout(Request $request)
    {
        $user = Auth::user() ?? User::find($request->session()->get('registered_user_id'));
        if (!$user) {
            return redirect()->route('signup')->withErrors('Please register first.');
        }

        $plan = $request->input('plan', 'monthly');
        if (!in_array($plan, ['monthly', 'yearly'])) {
            $plan = 'monthly';
        }

        try {
            $session = $this->stripe->createCheckoutSession(
                $user,
                $plan,
                route('stripe.success'),
                route('register.payment')
            );

            return redirect($session->url);
        } catch (\Throwable $e) {
            Log::error('Stripe checkout failed', ['error' => $e->getMessage()]);
            return back()->withErrors('Payment system error. Please try again.');
        }
    }

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

            return redirect()->route('register.kyc')->with('success', __('Payment successful! Please verify your identity.'));
        } catch (\Throwable $e) {
            Log::error('Stripe success callback failed', ['error' => $e->getMessage()]);
            return redirect()->route('register.payment')->withErrors('Could not verify payment. Please contact support.');
        }
    }

    public function cancel()
    {
        return redirect()->route('register.payment')->with('info', __('Payment was cancelled. You can try again.'));
    }
}
