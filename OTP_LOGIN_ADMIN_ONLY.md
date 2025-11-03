# OTP Login - Admin Created Users Only

## Overview
Sistem OTP login yang telah dimodifikasi untuk **hanya mengizinkan user yang sudah terdaftar di database** untuk login menggunakan OTP. User harus dibuat oleh admin terlebih dahulu sebelum bisa menggunakan sistem.

## Key Features
1. ✅ **No Auto-Registration** - Email yang belum terdaftar tidak bisa login
2. ✅ **Passwordless Login** - User login hanya dengan OTP tanpa password
3. ✅ **Admin-Created Users** - Hanya user yang dibuat admin yang bisa akses
4. ✅ **Email Verification via OTP** - Verifikasi identitas melalui kode 6 digit

## How It Works

### For Users (Login Process)
1. User membuka halaman login
2. User memasukkan email yang sudah terdaftar
3. Sistem mengecek apakah email ada di database:
   - ✅ **Jika ADA** → Kirim OTP ke email
   - ❌ **Jika TIDAK** → Tampilkan error: "Email not registered. Please contact admin to create your account."
4. User memasukkan kode OTP 6 digit dari email
5. Sistem verifikasi OTP dan login user

### For Admins (Creating Users)
Admin perlu membuat user baru melalui:
- Database seeder
- Manual registration (dengan flag `created_by_admin = true`)
- Admin panel (jika ada)

## Technical Implementation

### 1. Database Schema
Ditambahkan kolom `created_by_admin` pada tabel `users`:

```php
// Migration: 2025_10_30_080852_add_created_by_admin_to_users_table.php
Schema::table('users', function (Blueprint $table) {
    $table->boolean('created_by_admin')->default(false)->after('email_verified_at');
});
```

### 2. User Model
Updated `app/Models/User.php`:

```php
protected $fillable = [
    'name',
    'email',
    'password',
    'role',
    'email_verified_at',
    'created_by_admin', // NEW
];
```

### 3. Authentication Controller
Modified `app/Http/Controllers/Auth/AuthenticatedSessionController.php`:

**Key Changes:**
- Validasi email dengan `exists:users,email` untuk memastikan user terdaftar
- Remove auto-registration logic
- Hanya support `type = 'login'`

```php
public function sendOtp(Request $request): RedirectResponse
{
    $request->validate([
        'email' => 'required|email|exists:users,email', // Must exist in DB
    ]);

    $user = User::where('email', $request->email)->first();

    if (!$user) {
        throw ValidationException::withMessages([
            'email' => ['Email not registered. Please contact admin to create your account.'],
        ]);
    }

    // Send OTP only for login
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
```

### 4. Frontend (Login Page)
Updated `resources/js/pages/auth/login.tsx`:

**Old Message:**
```
- New users will be registered automatically
- Existing users will be logged in
```

**New Message:**
```
- Enter your registered email address
- We'll send a 6-digit code to your email
- Enter the code to login without password
- Contact admin if you don't have an account yet
```

## How to Create Users as Admin

### Method 1: Database Seeder
```php
// database/seeders/UserSeeder.php
use App\Models\User;
use Illuminate\Support\Facades\Hash;

User::create([
    'name' => 'John Doe',
    'email' => 'john@example.com',
    'password' => Hash::make('temporary-password'), // Optional
    'role' => 'user',
    'created_by_admin' => true,
    'email_verified_at' => now(),
]);
```

### Method 2: Tinker
```bash
php artisan tinker
```

```php
User::create([
    'name' => 'Jane Smith',
    'email' => 'jane@example.com',
    'password' => bcrypt('password'), // Optional
    'role' => 'user',
    'created_by_admin' => true,
    'email_verified_at' => now(),
]);
```

### Method 3: Admin Panel (Future Enhancement)
Buat form admin untuk create user baru dengan:
- Name
- Email
- Role
- Auto set `created_by_admin = true`
- Auto set `email_verified_at = now()`

## Routes

### Authentication Routes (in `routes/auth.php`)
```php
Route::middleware('guest')->group(function () {
    Route::get('login', [AuthenticatedSessionController::class, 'create'])
        ->name('login');
    
    Route::post('login/otp', [AuthenticatedSessionController::class, 'sendOtp'])
        ->middleware('throttle:5,1')
        ->name('login.otp');
    
    Route::get('verify-otp', [OtpVerificationController::class, 'show'])
        ->name('otp.show');
    
    Route::post('otp/verify', [OtpVerificationController::class, 'verify'])
        ->middleware('throttle:10,1')
        ->name('otp.verify');
    
    Route::post('otp/resend', [OtpVerificationController::class, 'resend'])
        ->middleware('throttle:3,1')
        ->name('otp.resend');
});
```

## Security Features

1. **Rate Limiting:**
   - Send OTP: 5 attempts per minute
   - Verify OTP: 10 attempts per minute
   - Resend OTP: 3 attempts per minute

2. **Email Validation:**
   - Must be valid email format
   - Must exist in `users` table
   - Case-insensitive lookup

3. **OTP Expiration:**
   - OTP valid for limited time (configured in OtpService)
   - Old OTPs automatically invalidated

4. **Session Security:**
   - OTP email stored in session
   - Session regenerated after successful login
   - Temporary session data cleaned after login

## Testing the Flow

### Test Case 1: Registered User Login ✅
```
1. Navigate to /login
2. Enter registered email: "user@example.com"
3. Click "Continue with Email"
4. Check email for 6-digit OTP
5. Enter OTP code
6. Successfully logged in → Redirected to dashboard
```

### Test Case 2: Unregistered User Login ❌
```
1. Navigate to /login
2. Enter unregistered email: "newuser@example.com"
3. Click "Continue with Email"
4. See error: "Email not registered. Please contact admin to create your account."
5. Cannot proceed without admin creating account
```

### Test Case 3: Invalid OTP ❌
```
1. Login with registered email
2. Receive OTP in email
3. Enter wrong OTP code
4. See error: "Invalid or expired OTP code."
5. Can request new OTP
```

## Error Messages

| Scenario | Error Message |
|----------|--------------|
| Email not registered | "Email not registered. Please contact admin to create your account." |
| Invalid OTP | "Invalid or expired OTP code." |
| Failed to send OTP | "Failed to send OTP. Please try again." |
| Too many requests | "Too many attempts. Please try again later." |

## Differences from Previous Implementation

| Feature | Before | After |
|---------|--------|-------|
| Auto-registration | ✅ Enabled | ❌ Disabled |
| Login method | OTP or Password | OTP only |
| User creation | Self-registration | Admin-created only |
| Email validation | Basic format check | Must exist in DB |
| Registration flow | Automatic on OTP | Not allowed |

## Migration Commands

```bash
# Run the migration
php artisan migrate

# Rollback if needed
php artisan migrate:rollback --step=1
```

## Environment Requirements

Ensure `.env` has email configuration:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=your-email@gmail.com
MAIL_FROM_NAME="${APP_NAME}"
```

## Next Steps / Future Enhancements

1. **Admin Panel:**
   - Create admin dashboard for user management
   - Add/edit/delete users
   - View user login history

2. **Bulk User Import:**
   - CSV upload for bulk user creation
   - Email notification to new users

3. **User Roles & Permissions:**
   - Define roles (admin, manager, user)
   - Role-based access control

4. **Audit Log:**
   - Track user creation by admin
   - Log all login attempts
   - Monitor OTP requests

## Files Modified

1. `app/Http/Controllers/Auth/AuthenticatedSessionController.php` - OTP logic
2. `app/Models/User.php` - Added `created_by_admin` to fillable
3. `resources/js/pages/auth/login.tsx` - Updated UI messages
4. `database/migrations/2025_10_30_080852_add_created_by_admin_to_users_table.php` - New column

## Summary

Sistem sekarang telah dikonfigurasi untuk:
- ✅ Hanya user terdaftar yang bisa login
- ✅ Login menggunakan OTP tanpa password
- ✅ Admin yang create user baru
- ✅ Clear error message untuk user belum terdaftar
- ✅ Session management yang aman
- ✅ Rate limiting untuk security
