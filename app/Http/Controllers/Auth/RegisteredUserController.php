<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\OtpService;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    public function __construct(protected OtpService $otpService)
    {
    }

    /**
     * Show the registration page.
     */
    public function create(): Response
    {
        return Inertia::render('auth/register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $sent = $this->otpService->sendOtp($request->email, 'registration');
        
        if (!$sent) {
            throw ValidationException::withMessages([
                'email' => ['Failed to send verification code. Please try again.'],
            ]);
        }

        $request->session()->put([
            'pending_registration' => [
                'name' => $request->name,
                'email' => $request->email,
                'password' => $request->password,
            ],
            'otp_email' => $request->email,
            'otp_type' => 'registration',
        ]);

        return to_route('otp.show');
    }
}
