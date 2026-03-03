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

        $result = $this->didit->createVerificationSession($user);
        if (!$result || empty($result['redirectUrl'])) {
            if ($request->wantsJson()) {
                return response()->json(['message' => 'Unable to start identity verification.'], 500);
            }
            return back()->withErrors('Unable to start Didit identity verification. Please try again.');
        }

        if ($request->wantsJson()) {
            return response()->json(['kyc_url' => $result['redirectUrl']]);
        }

        return redirect($result['redirectUrl']);
    }
}
