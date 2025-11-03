# Setup OTP Email Verification

Sistem validasi Gmail dengan OTP telah berhasil dibuat dan terintegrasi dengan sistem autentikasi yang sudah ada.

## 📋 Komponen yang Dibuat

### 1. Database
- **Migration**: `2025_10_30_064547_create_email_otps_table.php`
- **Model**: `EmailOtp.php`

### 2. Backend
- **Service**: `app/Services/OtpService.php` - Handle generate dan verify OTP
- **Controller**: `app/Http/Controllers/Auth/OtpVerificationController.php`
- **Middleware**: `app/Http/Middleware/EnsureOtpIsVerified.php`

### 3. Frontend
- **Component**: `resources/js/pages/auth/verify-otp.tsx`

### 4. Email Template
- **View**: `resources/views/emails/otp.blade.php`

### 5. Routes
Routes ditambahkan di `routes/auth.php`:
- `GET /verify-otp` - Halaman verifikasi OTP
- `POST /otp/send` - Kirim OTP (throttle: 5/minute)
- `POST /otp/verify` - Verifikasi OTP (throttle: 10/minute)
- `POST /otp/resend` - Resend OTP (throttle: 3/minute)

## 🚀 Cara Setup

### 1. Jalankan Migration
```bash
php artisan migrate
```

### 2. Konfigurasi Email di .env
Untuk production, gunakan SMTP Gmail:
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

**Catatan**: Untuk Gmail, gunakan App Password, bukan password biasa.
Cara buat App Password: https://support.google.com/accounts/answer/185833

Untuk development/testing, gunakan Mailtrap atau log:
```env
MAIL_MAILER=log
```

### 3. Install Dependencies Frontend (jika belum)
```bash
npm install
npm run build
# atau
npm run dev
```

## 🔧 Fitur Sistem OTP

### Keamanan
- ✅ OTP 6 digit random
- ✅ Expire dalam 5 menit
- ✅ Rate limiting (prevent spam)
- ✅ Auto cleanup OTP expired
- ✅ Maximum 3 attempts per jam
- ✅ Cooldown 60 detik untuk resend
- ✅ IP address tracking

### Tipe OTP
- `registration` - Untuk registrasi user baru
- `login` - Untuk login verification
- `email_change` - Untuk ubah email

### Flow Registrasi dengan OTP
1. User mengisi form registrasi (name, email, password)
2. System kirim OTP ke email user
3. User redirect ke halaman verify OTP
4. User input 6 digit OTP dari email
5. Setelah OTP verified, akun otomatis dibuat
6. User diarahkan ke halaman login
7. User login dengan email dan password yang sudah dibuat

## 🎯 Cara Menggunakan

### Di Controller Lain
```php
use App\Services\OtpService;

class YourController extends Controller
{
    public function __construct(protected OtpService $otpService)
    {
    }

    public function sendOtp(Request $request)
    {
        // Check apakah bisa request OTP
        $canRequest = $this->otpService->canRequestOtp(
            $request->email, 
            'login'
        );

        if (!$canRequest['can_request']) {
            return response()->json([
                'error' => $canRequest['message']
            ], 429);
        }

        // Kirim OTP
        $sent = $this->otpService->sendOtp(
            $request->email, 
            'login'
        );

        if ($sent) {
            return response()->json([
                'message' => 'OTP sent successfully'
            ]);
        }
    }

    public function verifyOtp(Request $request)
    {
        $verified = $this->otpService->verifyOtp(
            $request->email,
            $request->otp,
            'login'
        );

        if ($verified) {
            // OTP valid, lanjutkan proses
            return response()->json([
                'message' => 'Verified'
            ]);
        }
    }
}
```

### Di Frontend (React/TypeScript)
```typescript
import axios from 'axios';

// Send OTP
const sendOtp = async (email: string) => {
    try {
        await axios.post('/otp/send', {
            email,
            type: 'registration'
        });
        // Redirect ke verify page
        router.visit('/verify-otp');
    } catch (error) {
        console.error('Failed to send OTP', error);
    }
};

// Verify OTP
const verifyOtp = async (email: string, otp: string) => {
    try {
        const response = await axios.post('/otp/verify', {
            email,
            otp,
            type: 'registration'
        });
        if (response.data.verified) {
            // Success
        }
    } catch (error) {
        console.error('Verification failed', error);
    }
};
```

## 🧪 Testing

### Manual Testing dengan Log Mailer
1. Set `.env`: `MAIL_MAILER=log`
2. Register user baru
3. Check `storage/logs/laravel.log` untuk OTP code
4. Input OTP di halaman verification

### Dengan Real Email
1. Configure Gmail SMTP di `.env`
2. Register dengan email valid
3. Check inbox untuk OTP
4. Complete verification

## 📝 Customization

### Mengubah Durasi Expiry OTP
Edit `app/Services/OtpService.php`:
```php
protected int $expiryMinutes = 5; // Ubah sesuai kebutuhan
```

### Mengubah Panjang OTP
```php
protected int $otpLength = 6; // Ubah sesuai kebutuhan
```

### Mengubah Maximum Attempts
```php
protected int $maxAttempts = 3; // Ubah sesuai kebutuhan
```

## 🔐 Best Practices

1. **Production**: Selalu gunakan SMTP email provider yang reliable (Gmail, SendGrid, Mailgun, AWS SES)
2. **Security**: Jangan log OTP di production
3. **Monitoring**: Monitor failed OTP attempts untuk detect abuse
4. **Cleanup**: Jalankan periodic cleanup untuk expired OTP (bisa pakai scheduled job)
5. **User Experience**: Berikan clear feedback ke user tentang status OTP

## 🐛 Troubleshooting

### OTP tidak terkirim
- Check konfigurasi email di `.env`
- Verify Gmail App Password
- Check `storage/logs/laravel.log` untuk error
- Test dengan `MAIL_MAILER=log` terlebih dahulu

### OTP expired terlalu cepat
- Increase `expiryMinutes` di `OtpService`
- Check server timezone

### Rate limit error
- Tunggu sesuai cooldown period
- Atau adjust throttle di routes

## 📧 Support

Jika ada issue atau pertanyaan, silakan buat ticket atau hubungi development team.
