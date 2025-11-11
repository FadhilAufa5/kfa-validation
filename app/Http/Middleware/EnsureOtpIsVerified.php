<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureOtpIsVerified
{
    public function handle(Request $request, Closure $next): Response
    {
        $otpVerified = $request->session()->get('otp_verified', false);
        $verifiedEmail = $request->session()->get('otp_verified_email');
        $pendingEmail = $request->session()->get('otp_email');

        if (!$otpVerified || $verifiedEmail !== $pendingEmail) {
            return redirect()->route('otp.show');
        }

        return $next($request);
    }
}
