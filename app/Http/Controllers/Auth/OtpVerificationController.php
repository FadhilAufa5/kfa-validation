<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ActivityLogger;
use App\Services\OtpService;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class OtpVerificationController extends Controller
{
    public function __construct(protected OtpService $otpService)
    {
    }

    public function show(Request $request): Response
    {
        $email = $request->session()->get('otp_email');
        $type = $request->session()->get('otp_type', 'registration');
        
        $latestOtp = $this->otpService->getLatestOtp($email, $type);
        
        return Inertia::render('auth/verify-otp', [
            'email' => $email,
            'type' => $type,
            'expiresAt' => $latestOtp?->expires_at?->toIso8601String(),
            'remainingAttempts' => $this->otpService->getRemainingAttempts($email, $type),
        ]);
    }

    public function send(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'type' => 'required|in:registration,login,email_change',
        ]);

        $canRequest = $this->otpService->canRequestOtp(
            $request->email,
            $request->type
        );

        if (!$canRequest['can_request']) {
            throw ValidationException::withMessages([
                'email' => [$canRequest['message']],
            ]);
        }

        $sent = $this->otpService->sendOtp($request->email, $request->type);

        if (!$sent) {
            throw ValidationException::withMessages([
                'email' => ['Failed to send OTP. Please try again.'],
            ]);
        }

        $request->session()->put([
            'otp_email' => $request->email,
            'otp_type' => $request->type,
        ]);

        return response()->json([
            'message' => 'OTP sent successfully',
        ]);
    }

    public function verify(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'otp' => 'required|string|size:6',
            'type' => 'required|in:registration,login,email_change',
        ]);

        // Check if max attempts reached
        if ($this->otpService->hasReachedMaxAttempts($request->email, $request->type)) {
            // Block/delete user if type is registration or login
            if (in_array($request->type, ['registration', 'login'])) {
                $user = User::where('email', $request->email)->first();
                if ($user) {
                    ActivityLogger::log(
                        'delete',
                        "User {$user->name} blocked due to exceeding OTP verification attempts",
                        'User',
                        (string) $user->id,
                        ['reason' => 'exceeded_otp_attempts', 'email' => $request->email]
                    );
                    $user->delete();
                }
            }
            
            $request->session()->forget(['otp_email', 'otp_type']);
            
            throw ValidationException::withMessages([
                'otp' => ['Maximum verification attempts exceeded. Your account has been blocked. Please contact admin to create a new account.'],
            ]);
        }

        $verified = $this->otpService->verifyOtp(
            $request->email,
            $request->otp,
            $request->type
        );

        if (!$verified) {
            // Get the latest OTP record and increment failed attempts
            $latestOtp = $this->otpService->getLatestOtp($request->email, $request->type);
            if ($latestOtp) {
                $this->otpService->incrementFailedAttempts($latestOtp);
            }
            
            $remainingAttempts = $this->otpService->getRemainingAttempts($request->email, $request->type);
            
            throw ValidationException::withMessages([
                'otp' => [
                    $latestOtp && $latestOtp->isExpired() 
                        ? 'OTP code has expired. Please request a new one.'
                        : "Invalid OTP code. {$remainingAttempts} attempt(s) remaining."
                ],
            ]);
        }

        if ($request->type === 'registration') {
            $existingUser = User::where('email', $request->email)->first();

            if ($existingUser) {
                Auth::login($existingUser, true);
            } else {
                $emailName = explode('@', $request->email)[0];
                $user = User::create([
                    'name' => ucfirst($emailName),
                    'email' => $request->email,
                    'password' => bcrypt(str()->random(32)),
                    'email_verified_at' => now(),
                ]);

                event(new Registered($user));
                Auth::login($user, true);
            }

            $request->session()->regenerate();
            $request->session()->forget(['otp_verified', 'otp_verified_email', 'pending_registration', 'otp_email', 'otp_type']);

            return response()->json([
                'message' => 'Welcome! Redirecting to dashboard...',
                'verified' => true,
                'redirect' => route('dashboard'),
            ]);
        }

        if ($request->type === 'login') {
            $user = User::where('email', $request->email)->first();

            if (!$user) {
                throw ValidationException::withMessages([
                    'email' => ['User not found.'],
                ]);
            }

            Auth::login($user, true);

            ActivityLogger::logLogin($user);

            $request->session()->regenerate();
            $request->session()->forget(['otp_verified', 'otp_verified_email', 'otp_email', 'otp_type']);

            return response()->json([
                'message' => 'Login successful!',
                'verified' => true,
                'redirect' => route('dashboard'),
            ]);
        }

        $request->session()->put('otp_verified', true);
        $request->session()->put('otp_verified_email', $request->email);

        return response()->json([
            'message' => 'OTP verified successfully',
            'verified' => true,
        ]);
    }

    public function resend(Request $request): JsonResponse
    {
        $email = $request->session()->get('otp_email');
        $type = $request->session()->get('otp_type', 'registration');

        if (!$email) {
            throw ValidationException::withMessages([
                'email' => ['No pending OTP verification found.'],
            ]);
        }

        $canRequest = $this->otpService->canRequestOtp($email, $type);

        if (!$canRequest['can_request']) {
            throw ValidationException::withMessages([
                'email' => [$canRequest['message']],
            ]);
        }

        $sent = $this->otpService->sendOtp($email, $type);

        if (!$sent) {
            throw ValidationException::withMessages([
                'email' => ['Failed to resend OTP. Please try again.'],
            ]);
        }

        return response()->json([
            'message' => 'OTP resent successfully',
        ]);
    }
}
