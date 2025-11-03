# 🔐 Login dengan OTP (Passwordless Authentication)

## ✅ Status: COMPLETED

Sistem login menggunakan OTP (tanpa password) telah berhasil diimplementasikan.

## 🎯 Flow Login dengan OTP

```
┌─────────────────────────────────────────────────────────────┐
│  1. User buka halaman LOGIN (/login)                        │
│     - Pilih metode: "Password" atau "OTP"                    │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  2. User pilih tab "OTP"                                     │
│     - Form hanya menampilkan input Email                     │
│     - Button: "Send OTP to Email"                            │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  3. User input email dan klik "Send OTP"                    │
│     - System validasi email harus terdaftar                  │
│     - OTP 6 digit dikirim ke email                           │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  4. User diarahkan ke halaman /verify-otp                   │
│     - Tampilan sama seperti registrasi OTP                   │
│     - Input OTP 6 digit                                      │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  5. User memasukkan OTP dari email                          │
│     - Auto-submit saat 6 digit terisi                        │
│     - Validasi real-time                                     │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  6. System verify OTP & login user                          │
│     ✓ OTP valid → Login user otomatis                        │
│     ✓ Session dibuat dengan remember = true                  │
│     ✓ Redirect ke dashboard                                  │
│     ✗ OTP invalid/expired → Show error                       │
└─────────────────────────────────────────────────────────────┘
```

## 📋 Perbandingan 2 Metode Login

| Aspek | Login dengan Password | Login dengan OTP |
|-------|----------------------|------------------|
| **Input** | Email + Password | Email saja |
| **Security** | Perlu remember password | Tidak perlu remember password |
| **Proses** | Direct login | Kirim OTP → Verify → Login |
| **Use Case** | Login rutin | Login sesekali / lupa password |
| **Remember Me** | Optional checkbox | Auto enabled |

## 🔧 Technical Implementation

### Backend Routes

```php
// routes/auth.php

// Login dengan password (existing)
Route::post('login', [AuthenticatedSessionController::class, 'store'])
    ->name('login.store');

// Login dengan OTP (new)
Route::post('login/otp', [AuthenticatedSessionController::class, 'sendOtp'])
    ->middleware('throttle:5,1')
    ->name('login.otp');
```

### Controller Methods

**AuthenticatedSessionController.php:**

```php
public function sendOtp(Request $request): RedirectResponse
{
    // 1. Validate email harus terdaftar
    $request->validate([
        'email' => 'required|email|exists:users,email',
    ]);

    // 2. Check rate limiting
    $canRequest = $this->otpService->canRequestOtp($request->email, 'login');
    
    // 3. Send OTP ke email
    $sent = $this->otpService->sendOtp($request->email, 'login');
    
    // 4. Simpan session dan redirect ke verify page
    $request->session()->put([
        'otp_email' => $request->email,
        'otp_type' => 'login',
    ]);

    return to_route('otp.show');
}
```

**OtpVerificationController.php:**

```php
public function verify(Request $request): JsonResponse
{
    // ... validasi OTP ...

    if ($request->type === 'login') {
        $user = User::where('email', $request->email)->first();
        
        // Login user dengan remember = true
        Auth::login($user, true);
        
        $request->session()->regenerate();
        $request->session()->forget([...]);

        return response()->json([
            'message' => 'Login successful!',
            'verified' => true,
            'redirect' => route('dashboard'),
        ]);
    }
    
    // ... handle other types ...
}
```

### Frontend (Login Page)

**Key Features:**

1. **Tab Switcher** - Toggle antara Password dan OTP
2. **Conditional Forms** - Show/hide form berdasarkan tab aktif
3. **Dynamic Description** - Update description sesuai method

```tsx
const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');

// Tab buttons
<Button
    variant={loginMethod === 'password' ? 'default' : 'outline'}
    onClick={() => setLoginMethod('password')}
>
    Password
</Button>
<Button
    variant={loginMethod === 'otp' ? 'default' : 'outline'}
    onClick={() => setLoginMethod('otp')}
>
    OTP
</Button>

// Conditional rendering
{loginMethod === 'password' ? (
    // Form login password (existing)
) : (
    // Form login OTP (new)
)}
```

## 🎨 UI/UX Features

### Login Page
- ✅ Toggle button di atas form (Password / OTP)
- ✅ Dynamic title & description
- ✅ OTP form hanya tampil email input
- ✅ Clear CTA: "Send OTP to Email"
- ✅ Helper text: "We'll send a 6-digit code to your email"

### OTP Verification Page (Shared)
- ✅ 6-digit OTP input
- ✅ Auto-submit on complete
- ✅ Resend button dengan countdown
- ✅ Loading states
- ✅ Error messages
- ✅ Success toast notifications

## 🔒 Security Features

### Rate Limiting
- **Send OTP**: Max 5 requests per minute
- **Verify OTP**: Max 10 attempts per minute
- **Resend OTP**: Max 3 requests per minute
- **Max OTP Generation**: 3 attempts per hour per email

### OTP Validation
- ✅ 6-digit random code
- ✅ Expires in 5 minutes
- ✅ One-time use only
- ✅ IP address tracking
- ✅ Auto cleanup expired OTPs

### Session Security
- ✅ Session regeneration after login
- ✅ CSRF protection
- ✅ Secure session storage

## 📖 User Guide

### Cara Login dengan OTP

1. **Buka halaman login**
   ```
   https://your-app.com/login
   ```

2. **Pilih tab "OTP"**
   - Klik button "OTP" di bagian atas form

3. **Masukkan email**
   - Email harus sudah terdaftar di sistem
   - Klik "Send OTP to Email"

4. **Check email**
   - Buka inbox email Anda
   - Cari email dengan subject "Your OTP Code"
   - Copy 6-digit OTP code

5. **Input OTP**
   - Masukkan 6 digit code
   - Auto-submit atau klik "Verify OTP"

6. **Login berhasil**
   - Otomatis redirect ke dashboard
   - Session tetap login (remember me)

### Troubleshooting

**❌ Email tidak ditemukan:**
- Pastikan email sudah terdaftar
- Lakukan registrasi terlebih dahulu di `/register`

**❌ OTP tidak terkirim:**
- Check spam folder
- Check email configuration di `.env`
- Request ulang OTP (tunggu cooldown 60 detik)

**❌ OTP expired:**
- OTP berlaku 5 menit
- Request OTP baru

**❌ OTP invalid:**
- Pastikan input 6 digit benar
- Perhatikan urutan angka
- Jangan ada spasi

**❌ Too many attempts:**
- Tunggu 1 jam sebelum request lagi
- Atau gunakan login dengan password

## 🧪 Testing Guide

### Manual Testing

**Test Login dengan OTP:**

1. Setup environment
   ```env
   MAIL_MAILER=log
   ```

2. Pastikan ada user di database
   ```sql
   SELECT * FROM users WHERE email = 'test@example.com';
   ```

3. Buka `/login` dan pilih tab "OTP"

4. Input email yang terdaftar

5. Check `storage/logs/laravel.log` untuk OTP code
   ```
   [2025-10-30 14:00:00] local.INFO: OTP sent to test@example.com {"type":"login"}
   ```

6. Copy OTP dari email template di log

7. Input OTP di verification page

8. Should redirect to dashboard dengan logged in

### Test Cases

**✅ Happy Path:**
- Email valid & terdaftar → OTP terkirim
- OTP valid & belum expired → Login success
- Redirect to dashboard

**❌ Error Cases:**
- Email tidak terdaftar → Error: "The selected email is invalid"
- OTP salah → Error: "Invalid or expired OTP code"
- OTP expired (>5 min) → Error: "Invalid or expired OTP code"
- Request OTP terlalu sering → Error: "Please wait before requesting another OTP"

## 📊 Database Schema

OTP records disimpan di table `email_otps`:

```sql
CREATE TABLE email_otps (
    id BIGINT PRIMARY KEY,
    email VARCHAR(255),
    otp VARCHAR(6),
    type ENUM('registration', 'login', 'email_change'),
    expires_at TIMESTAMP,
    verified BOOLEAN DEFAULT FALSE,
    ip_address VARCHAR(45),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Example record untuk login OTP:**

| email | otp | type | verified | expires_at |
|-------|-----|------|----------|------------|
| user@test.com | 123456 | login | false | 2025-10-30 14:05:00 |

## 🎯 Use Cases

**Kapan menggunakan Login dengan OTP:**

✅ **Recommended:**
- User lupa password
- Login dari device baru / public computer
- Security-conscious users
- Temporary access needed
- Testing/debugging account

❌ **Not Recommended:**
- Daily/frequent login (gunakan password)
- Slow/unreliable email delivery
- User tidak akses email

## 🔄 Integration dengan Features Lain

### Two-Factor Authentication (2FA)
OTP Login berbeda dengan 2FA:
- **OTP Login**: Menggantikan password sepenuhnya
- **2FA**: Tambahan keamanan setelah login password

### Password Reset
OTP Login bisa jadi alternatif forgot password:
- User tidak perlu reset password
- Langsung login dengan OTP

### Email Verification
Sama-sama menggunakan email OTP tapi berbeda type:
- **Registration**: `type = 'registration'`
- **Login**: `type = 'login'`

## 📈 Benefits

### For Users:
✅ Tidak perlu mengingat password
✅ Lebih cepat dari forgot password flow
✅ Lebih aman dari password yang mudah ditebak
✅ Tidak khawatir password bocor

### For System:
✅ Mengurangi support tickets password reset
✅ Meningkatkan security
✅ Audit trail lebih baik (IP tracking)
✅ Flexible authentication options

---

**Created:** 2025-10-30  
**Status:** Production Ready  
**Version:** 1.0.0
