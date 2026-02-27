<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\DiditService;
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
            return redirect()->route('signup')->withErrors('Please register first.');
        }

        if ($user->isKycVerified()) {
            return redirect()->route('signin')->with('success', __('Your identity is already verified.'));
        }

        // Test mode: when Didit API key is not configured, auto-approve
        if (empty(config('didit.api_key'))) {
            Log::warning('Didit test mode: auto-approving KYC for user ' . $user->id);
            $user->update([
                'kyc_verified_at' => now(),
                'kyc_provider_id' => 'TEST_MODE',
            ]);
            return redirect()->route('register.payment')
                ->with('success', __('[TEST MODE] Identity verified automatically. Please complete your payment.'));
        }

        $result = $this->didit->createVerificationSession($user);
        if (!$result || empty($result['redirectUrl'])) {
            return back()->withErrors('Unable to start Didit identity verification. Please try again.');
        }

        return redirect($result['redirectUrl']);
    }
}
