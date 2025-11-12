import { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '@/components/ui/input-otp';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { toast } from 'sonner';
import { Clock } from 'lucide-react';

const OTP_MAX_LENGTH = 6;
const RESEND_COOLDOWN = 60;

interface VerifyOtpProps {
    email: string;
    type: 'registration' | 'login' | 'email_change';
    expiresAt?: string;
    remainingAttempts: number;
}

export default function VerifyOtp({ email, type, expiresAt }: VerifyOtpProps) {
    const [otp, setOtp] = useState<string>('');
    const [processing, setProcessing] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [resendCooldown, setResendCooldown] = useState<number>(0);
    const [timeRemaining, setTimeRemaining] = useState<number>(0);
    const [otpExpiresAt, setOtpExpiresAt] = useState<string | undefined>(expiresAt);

    // Calculate time remaining until OTP expires
    useEffect(() => {
        if (!otpExpiresAt) return;

        const calculateTimeRemaining = () => {
            const now = new Date().getTime();
            const expiry = new Date(otpExpiresAt).getTime();
            const diff = Math.max(0, Math.floor((expiry - now) / 1000));
            setTimeRemaining(diff);

            if (diff === 0) {
                setError('OTP has expired. Please request a new one.');
            }
        };

        calculateTimeRemaining();
        const interval = setInterval(calculateTimeRemaining, 1000);

        return () => clearInterval(interval);
    }, [otpExpiresAt]);

    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => {
                setResendCooldown(resendCooldown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleVerify = async () => {
        if (otp.length !== OTP_MAX_LENGTH) {
            setError('Please enter a valid 6-digit OTP');
            return;
        }

        setProcessing(true);
        setError('');

        try {
            const response = await axios.post('/otp/verify', {
                email,
                otp,
                type,
            });

            if (response.data.verified) {
                toast.success(response.data.message || 'Email verified successfully!');
                
                if (response.data.redirect) {
                    setTimeout(() => {
                        window.location.href = response.data.redirect;
                    }, 1000);
                } else if (type === 'login') {
                    router.visit('/dashboard');
                } else if (type === 'email_change') {
                    router.visit('/settings/profile');
                }
            }
        } catch (err: any) {
            const errorMessage =
                err.response?.data?.errors?.otp?.[0] ||
                err.response?.data?.message ||
                'Verification failed. Please try again.';
            setError(errorMessage);
            toast.error(errorMessage);
            
        
            setOtp('');
        } finally {
            setProcessing(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;

        setProcessing(true);
        setError('');

        try {
            const response = await axios.post('/otp/resend');
            toast.success('OTP resent successfully!');
            setResendCooldown(RESEND_COOLDOWN);
            setOtp('');
            
            // Reset the expiration timer with the new OTP expiration time
            if (response.data.expires_at) {
                setOtpExpiresAt(response.data.expires_at);
            } else {
                // If server doesn't return new expiration, set it to 2 minutes from now
                const newExpiry = new Date();
                newExpiry.setMinutes(newExpiry.getMinutes() + 2);
                setOtpExpiresAt(newExpiry.toISOString());
            }
        } catch (err: any) {
            const errorMessage =
                err.response?.data?.errors?.email?.[0] ||
                err.response?.data?.message ||
                'Failed to resend OTP. Please try again.';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setProcessing(false);
        }
    };

    const getTitle = () => {
        switch (type) {
            case 'registration':
                return 'Verify Your Email';
            case 'login':
                return 'Email Verification Required';
            case 'email_change':
                return 'Verify New Email';
            default:
                return 'Email Verification';
        }
    };

    const getDescription = () => {
        return `We've sent a 6-digit verification code to ${email}. Please enter it below.`;
    };

    return (
        <AuthLayout title={getTitle()} description={getDescription()}>
            <Head title="Verify OTP" />

            <div className="space-y-6">
                {/* Timer Display */}
                {otpExpiresAt && (
                    <div className="flex items-center justify-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-900">
                        <Clock className={`w-6 h-6 ${timeRemaining < 30 ? 'text-red-600 animate-pulse' : 'text-blue-600'}`} />
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">OTP Expires In</p>
                            <p className={`text-2xl font-bold ${timeRemaining < 30 ? 'text-red-600' : 'text-blue-600'}`}>
                                {formatTime(timeRemaining)}
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="flex w-full items-center justify-center">
                        <InputOTP
                            maxLength={OTP_MAX_LENGTH}
                            value={otp}
                            onChange={(value) => {
                                setOtp(value);
                                setError('');
                            }}
                            disabled={processing || timeRemaining === 0}
                            pattern={REGEXP_ONLY_DIGITS}
                            onComplete={handleVerify}
                        >
                            <InputOTPGroup>
                                {Array.from(
                                    { length: OTP_MAX_LENGTH },
                                    (_, index) => (
                                        <InputOTPSlot key={index} index={index} />
                                    )
                                )}
                            </InputOTPGroup>
                        </InputOTP>
                    </div>

                    {error && (
                        <InputError message={error} className="text-center" />
                    )}

                    <Button
                        type="button"
                        className="w-full"
                        disabled={processing || otp.length !== OTP_MAX_LENGTH || timeRemaining === 0}
                        onClick={handleVerify}
                    >
                        {processing && <Spinner />}
                        Verify OTP
                    </Button>

                    <div className="flex flex-col items-center space-y-2 text-sm text-muted-foreground">
                        <p>Didn't receive the code?</p>
                        <button
                            type="button"
                            className="cursor-pointer text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current disabled:cursor-not-allowed disabled:opacity-50 dark:decoration-neutral-500"
                            onClick={handleResend}
                            disabled={processing || resendCooldown > 0}
                        >
                            {resendCooldown > 0
                                ? `Resend in ${resendCooldown}s`
                                : 'Resend OTP'}
                        </button>
                    </div>

                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-900/20 dark:text-red-200">
                        <p className="font-medium">⚠️ Important Security Notice:</p>
                        <ul className="mt-1 list-inside list-disc space-y-1 text-xs">
                            <li><strong>OTP expires in 2 minutes</strong></li>
                            <li><strong>3 failed attempts will block your account</strong></li>
                            <li>Account must be recreated by admin if blocked</li>
                            <li>Check your spam folder if not received</li>
                            <li>Do not share this code with anyone</li>
                        </ul>
                    </div>
                </div>
            </div>
        </AuthLayout>
    );
}
