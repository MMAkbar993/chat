<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\DiditService;
use App\Services\StripeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class KycController extends Controller
{
    protected DiditService $didit;

    public function __construct(DiditService $didit)
    {
        $this->didit = $didit;
    }

    public function showKycStep(Request $request)
    {
        $user = Auth::user() ?? User::find($request->session()->get('registered_user_id'));
        $kycStatus = $request->query('status');

        // When Didit redirects with status=Approved, render the view so popup can notify opener and close.
        // Do not redirect here; the view handles both popup (postMessage + close) and normal tab (redirect).
        return view('frontend.register-kyc', [
            'user' => $user,
            'kycStatus' => $kycStatus,
        ]);
    }

    public function createSession(Request $request)
    {
        $user = Auth::user() ?? User::find($request->session()->get('registered_user_id'));
        if (!$user) {
            if ($request->wantsJson()) {
                return response()->json(['message' => 'Please register first.'], 422);
            }
            return redirect()->route('signup')->withErrors('Please register first.');
        }

        if ($user->isKycVerified()) {
            if ($request->wantsJson()) {
                return response()->json([
                    'kyc_auto_approved' => true,
                    'subscription_status' => $user->subscription_status,
                ]);
            }
            return redirect()->route('signin')->with('success', __('Your identity is already verified.'));
        }

        // Test mode: auto-approve KYC and create subscription with saved payment method
        if (empty(config('didit.api_key'))) {
            Log::warning('Didit test mode: auto-approving KYC for user ' . $user->id);
            $user->update([
                'kyc_verified_at' => now(),
                'kyc_provider_id' => 'TEST_MODE',
            ]);

            try {
                $stripe = app(StripeService::class);
                $stripe->createSubscriptionFromSavedPayment($user);
            } catch (\Throwable $e) {
                Log::error('Test mode: auto-subscription failed after KYC', ['error' => $e->getMessage()]);
                $user->update(['subscription_status' => 'pending_payment']);
            }

            $user->refresh();

            if ($request->wantsJson()) {
                return response()->json([
                    'kyc_auto_approved' => true,
                    'subscription_status' => $user->subscription_status,
                ]);
            }
            return redirect()->route('signin')
                ->with('success', __('[TEST MODE] Identity verified and subscription activated.'));
        }

        try {
            $result = $this->didit->createVerificationSession($user);
        } catch (\Throwable $e) {
            Log::error('Didit createSession exception', ['error' => $e->getMessage(), 'user_id' => $user->id]);
            $message = 'Identity verification is temporarily unavailable. Please try again later.';
            if ($request->wantsJson()) {
                return response()->json(['message' => __($message)], 503);
            }
            return back()->withErrors($message);
        }

        if (!$result || empty($result['redirectUrl'])) {
            $message = 'Unable to start identity verification. Please try again or contact support.';
            if ($request->wantsJson()) {
                return response()->json(['message' => __($message)], 503);
            }
            return back()->withErrors($message);
        }

        if ($request->wantsJson()) {
            return response()->json(['kyc_url' => $result['redirectUrl']]);
        }

        return redirect($result['redirectUrl']);
    }
}
