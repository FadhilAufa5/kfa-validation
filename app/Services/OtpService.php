<?php

namespace App\Services;

use App\Models\EmailOtp;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class OtpService
{
    protected int $otpLength = 6;
    protected int $expiryMinutes = 2; // Changed to 2 minutes
    protected int $maxFailedAttempts = 3; // Max 3 failed attempts per OTP session

    public function generateOtp(string $email, string $type = 'registration', ?string $ipAddress = null): EmailOtp
    {
        $this->cleanupExpiredOtps($email);

        $otp = $this->generateRandomOtp();

        return EmailOtp::create([
            'email' => $email,
            'otp' => $otp,
            'type' => $type,
            'expires_at' => Carbon::now()->addMinutes($this->expiryMinutes),
            'ip_address' => $ipAddress,
        ]);
    }

    public function sendOtp(string $email, string $type = 'registration'): bool
    {
        try {
            $ipAddress = request()->ip();
            $otpRecord = $this->generateOtp($email, $type, $ipAddress);

            Mail::send('emails.otp', ['otp' => $otpRecord->otp, 'type' => $type], function ($message) use ($email) {
                $message->to($email)
                    ->subject('Your OTP Code - ' . config('app.name'));
            });

            Log::info("OTP sent to {$email}", ['type' => $type]);
            return true;
        } catch (\Exception $e) {
            Log::error("Failed to send OTP to {$email}: {$e->getMessage()}");
            return false;
        }
    }

    public function verifyOtp(string $email, string $otp, string $type = 'registration'): bool
    {
        $otpRecord = EmailOtp::where('email', $email)
            ->where('otp', $otp)
            ->where('type', $type)
            ->where('verified', false)
            ->latest()
            ->first();

        if (!$otpRecord) {
            return false;
        }

        if ($otpRecord->isExpired()) {
            return false;
        }

        $otpRecord->update(['verified' => true]);
        return true;
    }

    public function hasRecentOtp(string $email, string $type = 'registration', int $minutes = 1): bool
    {
        return EmailOtp::where('email', $email)
            ->where('type', $type)
            ->where('created_at', '>=', Carbon::now()->subMinutes($minutes))
            ->exists();
    }

    protected function generateRandomOtp(): string
    {
        return str_pad((string) random_int(0, 999999), $this->otpLength, '0', STR_PAD_LEFT);
    }

    protected function cleanupExpiredOtps(string $email): void
    {
        EmailOtp::where('email', $email)
            ->where(function ($query) {
                $query->where('expires_at', '<', Carbon::now())
                    ->orWhere('verified', true);
            })
            ->delete();
    }

    public function getAttemptsCount(string $email, string $type = 'registration'): int
    {
        return EmailOtp::where('email', $email)
            ->where('type', $type)
            ->where('created_at', '>=', Carbon::now()->subHour())
            ->count();
    }

    public function canRequestOtp(string $email, string $type = 'registration'): array
    {
        if ($this->hasRecentOtp($email, $type)) {
            return [
                'can_request' => false,
                'message' => 'Please wait before requesting another OTP',
            ];
        }

        $attempts = $this->getAttemptsCount($email, $type);
        if ($attempts >= 5) {
            return [
                'can_request' => false,
                'message' => 'Maximum OTP requests reached. Please try again later',
            ];
        }

        return [
            'can_request' => true,
            'message' => 'OTP can be requested',
        ];
    }

    /**
     * Increment failed attempts for an OTP record
     */
    public function incrementFailedAttempts(EmailOtp $otpRecord): void
    {
        $otpRecord->increment('failed_attempts');
    }

    /**
     * Check if OTP has reached maximum failed attempts
     */
    public function hasReachedMaxAttempts(string $email, string $type): bool
    {
        $latestOtp = EmailOtp::where('email', $email)
            ->where('type', $type)
            ->where('verified', false)
            ->latest()
            ->first();

        if (!$latestOtp) {
            return false;
        }

        return $latestOtp->failed_attempts >= $this->maxFailedAttempts;
    }

    /**
     * Get remaining attempts
     */
    public function getRemainingAttempts(string $email, string $type): int
    {
        $latestOtp = EmailOtp::where('email', $email)
            ->where('type', $type)
            ->where('verified', false)
            ->latest()
            ->first();

        if (!$latestOtp) {
            return $this->maxFailedAttempts;
        }

        return max(0, $this->maxFailedAttempts - $latestOtp->failed_attempts);
    }

    /**
     * Get latest OTP record
     */
    public function getLatestOtp(string $email, string $type): ?EmailOtp
    {
        return EmailOtp::where('email', $email)
            ->where('type', $type)
            ->where('verified', false)
            ->latest()
            ->first();
    }
}
