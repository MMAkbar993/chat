<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureOnboarded
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (!$user) {
            return $next($request);
        }

        $status = $user->subscription_status;

        // Step 2: need to enter payment details (setup mode, no charge)
        if ($status === 'pending_payment') {
            if (!$request->routeIs('register.payment', 'stripe.*', 'logout')) {
                return redirect()->route('register.payment');
            }
        }

        // Step 3: payment details saved, awaiting KYC verification
        if ($status === 'pending_kyc') {
            if (!$request->routeIs('register.kyc', 'didit.*', 'logout')) {
                return redirect()->route('register.kyc');
            }
        }

        return $next($request);
    }
}
