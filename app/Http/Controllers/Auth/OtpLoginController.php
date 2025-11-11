<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\OtpService;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class OtpLoginController extends Controller
{
    public function __construct(protected OtpService $otpService)
    {
    }

    public function sendLoginOtp(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        $canRequest = $this->otpService->canRequestOtp($request->email, 'login');

        if (!$canRequest['can_request']) {
            throw ValidationException::withMessages([
                'email' => [$canRequest['message']],
            ]);
        }

        $sent = $this->otpService->sendOtp($request->email, 'login');

        if (!$sent) {
            throw ValidationException::withMessages([
                'email' => ['Failed to send OTP. Please try again.'],
            ]);
        }

        $request->session()->put([
            'otp_email' => $request->email,
            'otp_type' => 'login',
        ]);

        return to_route('otp.show');
    }

    public function verifyAndLogin(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'otp' => 'required|string|size:6',
        ]);

        $verified = $this->otpService->verifyOtp(
            $request->email,
            $request->otp,
            'login'
        );

        if (!$verified) {
            throw ValidationException::withMessages([
                'otp' => ['Invalid or expired OTP code.'],
            ]);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            throw ValidationException::withMessages([
                'email' => ['User not found.'],
            ]);
        }

        Auth::login($user, true);

        $request->session()->regenerate();
        $request->session()->forget(['otp_verified', 'otp_verified_email', 'otp_email', 'otp_type']);

        return redirect()->intended(route('dashboard', absolute: false));
    }
}
