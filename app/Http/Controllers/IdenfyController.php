<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\IdenfyService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class IdenfyController extends Controller
{
    protected IdenfyService $idenfy;

    public function __construct(IdenfyService $idenfy)
    {
        $this->idenfy = $idenfy;
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

        // Test mode: when iDenfy API key is not configured, auto-approve
        if (empty(config('idenfy.api_key'))) {
            Log::warning('iDenfy test mode: auto-approving KYC for user ' . $user->id);
            $user->update([
                'kyc_verified_at' => now(),
                'kyc_provider_id' => 'TEST_MODE',
            ]);
            return redirect()->route('register.payment')
                ->with('success', __('[TEST MODE] Identity verified automatically. Please complete your payment.'));
        }

        $result = $this->idenfy->createVerificationSession($user);
        if (!$result || !$result['redirectUrl']) {
            return back()->withErrors('Unable to start identity verification. Please try again.');
        }

        return redirect($result['redirectUrl']);
    }
}
