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

        if ($status === 'pending_payment') {
            if (!$request->routeIs('register.payment', 'stripe.*', 'logout')) {
                return redirect()->route('register.payment');
            }
        }

        if ($status === 'pending_kyc' || ($status !== 'canceled' && !$user->isKycVerified() && $status !== 'pending_payment')) {
            if (!$request->routeIs('register.kyc', 'idenfy.*', 'register.payment', 'stripe.*', 'logout')) {
                return redirect()->route('register.kyc');
            }
        }

        return $next($request);
    }
}
