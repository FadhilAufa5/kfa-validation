<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ActivityLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class SuperAdminLoginController extends Controller
{
    /**
     * Show the super admin login page.
     */
    public function create(): Response
    {
        return Inertia::render('auth/admin-login');
    }

    /**
     * Handle super admin login without OTP.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        // Check if user exists and has super_admin role
        if (!$user || $user->role !== 'super_admin') {
            throw ValidationException::withMessages([
                'email' => ['These credentials do not match our records or you are not authorized.'],
            ]);
        }

        // Verify password
        if (!Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Login the user
        Auth::login($user, $request->boolean('remember'));

        $request->session()->regenerate();

        // Log the activity
        ActivityLogger::logLogin($user);

        return redirect()->intended(route('dashboard', absolute: false));
    }
}
