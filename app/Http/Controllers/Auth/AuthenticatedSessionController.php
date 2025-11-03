<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\User;
use App\Services\ActivityLogger;
use App\Services\OtpService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Fortify\Features;

class AuthenticatedSessionController extends Controller
{
    public function __construct(protected OtpService $otpService)
    {
    }
    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/login', [
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $user = $request->validateCredentials();

        if (Features::enabled(Features::twoFactorAuthentication()) && $user->hasEnabledTwoFactorAuthentication()) {
            $request->session()->put([
                'login.id' => $user->getKey(),
                'login.remember' => $request->boolean('remember'),
            ]);

            return to_route('two-factor.login');
        }

        Auth::login($user, $request->boolean('remember'));

        $request->session()->regenerate();

        ActivityLogger::logLogin($user);

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Send OTP for passwordless login.
     */
    public function sendOtp(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            throw ValidationException::withMessages([
                'email' => ['Email not registered. Please contact admin to create your account.'],
            ]);
        }

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

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $user = Auth::user();
        
        Auth::guard('web')->logout();

        if ($user) {
            ActivityLogger::logLogout($user);
        }

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
