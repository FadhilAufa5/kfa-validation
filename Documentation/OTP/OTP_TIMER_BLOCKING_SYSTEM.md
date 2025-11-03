# OTP Timer & Blocking System

## Overview
Sistem OTP verification dengan **2 minutes timer** dan **automatic account blocking** setelah 3 kali gagal verifikasi.

---

## Fitur Utama

### **1. OTP Expiry Timer (2 Minutes)**
- ⏱️ OTP berlaku selama **2 menit** sejak dikirim
- ⏰ **Real-time countdown timer** di halaman verifikasi
- 🔴 Timer berubah merah dan berkedip saat tersisa < 30 detik
- ⛔ Input OTP otomatis disabled ketika waktu habis
- 📧 User harus request OTP baru jika expired

### **2. Failed Attempts Tracking (Max 3 Attempts)**
- 🔢 Maksimal **3 kali percobaan** input OTP
- 📊 Real-time counter menampilkan sisa percobaan
- ⚠️ Counter berubah kuning/merah sesuai urgency
- 🔄 Failed attempts di-reset saat request OTP baru
- 📝 Activity log mencatat setiap failed attempt

### **3. Automatic Account Blocking**
- 🚫 Setelah 3x gagal, **akun otomatis dihapus** dari database
- 🔒 User tidak bisa login kembali dengan email yang sama
- 👤 Harus **dibuat ulang oleh admin** via User Management
- 📋 Activity log mencatat alasan blocking
- ⚖️ Berlaku untuk registration & login OTP

---

## Implementasi Backend

### **1. Database Migration**
File: `database/migrations/2025_10_31_050000_add_failed_attempts_to_email_otps_table.php`

```php
Schema::table('email_otps', function (Blueprint $table) {
    $table->integer('failed_attempts')->default(0)->after('verified');
});
```

**Column Details:**
- `failed_attempts`: INT, default 0
- Increment setiap kali user input OTP salah
- Reset ke 0 saat request OTP baru

### **2. EmailOtp Model Update**
File: `app/Models/EmailOtp.php`

```php
protected $fillable = [
    'email',
    'otp',
    'type',
    'expires_at',
    'verified',
    'ip_address',
    'failed_attempts',  // NEW
];

protected $casts = [
    'expires_at' => 'datetime',
    'verified' => 'boolean',
    'failed_attempts' => 'integer',  // NEW
];
```

### **3. OtpService Updates**
File: `app/Services/OtpService.php`

#### **Changed Expiry Time**
```php
protected int $expiryMinutes = 2; // Changed from 5 to 2 minutes
protected int $maxFailedAttempts = 3; // Max 3 failed attempts
```

#### **New Methods**

**incrementFailedAttempts()**
```php
public function incrementFailedAttempts(EmailOtp $otpRecord): void
{
    $otpRecord->increment('failed_attempts');
}
```

**hasReachedMaxAttempts()**
```php
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
```

**getRemainingAttempts()**
```php
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
```

**getLatestOtp()**
```php
public function getLatestOtp(string $email, string $type): ?EmailOtp
{
    return EmailOtp::where('email', $email)
        ->where('type', $type)
        ->where('verified', false)
        ->latest()
        ->first();
}
```

### **4. OtpVerificationController Updates**
File: `app/Http/Controllers/Auth/OtpVerificationController.php`

#### **show() Method - Pass Timer & Attempts Data**
```php
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
```

#### **verify() Method - Block User After 3 Failed Attempts**
```php
public function verify(Request $request): JsonResponse
{
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
        // Increment failed attempts
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
    
    // ... continue with successful verification
}
```

---

## Implementasi Frontend

### File: `resources/js/pages/auth/verify-otp.tsx`

#### **New State Variables**
```tsx
const [timeRemaining, setTimeRemaining] = useState<number>(0);
const [attempts, setAttempts] = useState<number>(remainingAttempts);
```

#### **Props Interface Update**
```tsx
interface VerifyOtpProps {
    email: string;
    type: 'registration' | 'login' | 'email_change';
    expiresAt?: string;           // NEW: ISO timestamp dari backend
    remainingAttempts: number;     // NEW: Sisa percobaan
}
```

#### **Timer Countdown Effect**
```tsx
// Calculate time remaining until OTP expires
useEffect(() => {
    if (!expiresAt) return;

    const calculateTimeRemaining = () => {
        const now = new Date().getTime();
        const expiry = new Date(expiresAt).getTime();
        const diff = Math.max(0, Math.floor((expiry - now) / 1000));
        setTimeRemaining(diff);

        if (diff === 0) {
            setError('OTP has expired. Please request a new one.');
        }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
}, [expiresAt]);
```

#### **Format Time Helper**
```tsx
const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};
```

#### **Timer & Attempts Display UI**
```tsx
{/* Timer and Attempts Display */}
<div className="flex items-center justify-between gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-900">
    {/* Timer */}
    <div className="flex items-center gap-2">
        <Clock className={`w-5 h-5 ${timeRemaining < 30 ? 'text-red-600 animate-pulse' : 'text-blue-600'}`} />
        <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Time Remaining</p>
            <p className={`text-lg font-bold ${timeRemaining < 30 ? 'text-red-600' : 'text-blue-600'}`}>
                {formatTime(timeRemaining)}
            </p>
        </div>
    </div>
    
    {/* Attempts Counter */}
    <div className="flex items-center gap-2">
        <AlertTriangle className={`w-5 h-5 ${attempts <= 1 ? 'text-red-600' : 'text-yellow-600'}`} />
        <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Attempts Left</p>
            <p className={`text-lg font-bold ${attempts <= 1 ? 'text-red-600' : 'text-yellow-600'}`}>
                {attempts} / 3
            </p>
        </div>
    </div>
</div>
```

#### **Disable Input When Timer Expires**
```tsx
<InputOTP
    maxLength={OTP_MAX_LENGTH}
    value={otp}
    onChange={(value) => {
        setOtp(value);
        setError('');
    }}
    disabled={processing || timeRemaining === 0}  // Disabled saat expired
    pattern={REGEXP_ONLY_DIGITS}
    onComplete={handleVerify}
>
    ...
</InputOTP>
```

#### **Handle Failed Attempts**
```tsx
try {
    const response = await axios.post('/otp/verify', {
        email,
        otp,
        type,
    });
    // Handle success...
} catch (err: any) {
    const errorMessage = 
        err.response?.data?.errors?.otp?.[0] ||
        err.response?.data?.message ||
        'Verification failed. Please try again.';
    setError(errorMessage);
    toast.error(errorMessage);
    
    // Decrement attempts on failure
    if (attempts > 0) {
        setAttempts(attempts - 1);
    }
    
    // Clear OTP input
    setOtp('');
}
```

#### **Warning Notice**
```tsx
<div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
    <p className="font-medium">⚠️ Important Security Notice:</p>
    <ul className="mt-1 list-inside list-disc space-y-1 text-xs">
        <li><strong>OTP expires in 2 minutes</strong></li>
        <li><strong>3 failed attempts will block your account</strong></li>
        <li>Account must be recreated by admin if blocked</li>
        <li>Check your spam folder if not received</li>
        <li>Do not share this code with anyone</li>
    </ul>
</div>
```

---

## Cara Kerja

### **Flow: Normal Verification**
```
1. User request OTP
2. OTP dikirim dengan expires_at = now + 2 minutes
3. User akses halaman verify-otp
4. Frontend menampilkan timer countdown (2:00 → 0:00)
5. User input OTP sebelum expired
6. Verification berhasil → Login/Register
```

### **Flow: Failed Verification (Within Time)**
```
1. User input OTP salah
2. Backend increment failed_attempts di database
3. Frontend decrement local attempts counter
4. Error message: "Invalid OTP code. 2 attempt(s) remaining."
5. User bisa coba lagi (maks 3x total)
```

### **Flow: OTP Expired**
```
1. Timer countdown mencapai 0:00
2. Frontend disable input OTP
3. Frontend menampilkan error: "OTP has expired"
4. User klik "Resend OTP"
5. Generate OTP baru dengan timer reset
```

### **Flow: Account Blocking (3x Failed)**
```
1. User sudah 2x salah input OTP
2. User input OTP salah lagi (attempt ke-3)
3. Backend check: failed_attempts >= 3
4. Backend delete user dari database
5. Backend log activity: "User blocked due to exceeding OTP verification attempts"
6. Frontend error: "Maximum verification attempts exceeded. Your account has been blocked."
7. User tidak bisa login, harus contact admin
8. Admin create user baru via User Management
```

---

## Testing Scenarios

### **Test 1: Normal OTP Verification**
```
1. Request OTP
2. Check email dan copy kode
3. Input OTP dengan benar
4. ✓ Verification berhasil
5. ✓ Timer tidak mencapai 0
6. ✓ Attempts masih tersisa
```

### **Test 2: OTP Expiry**
```
1. Request OTP
2. Tunggu 2 menit (timer habis)
3. ✓ Input OTP disabled
4. ✓ Error message muncul
5. Klik Resend OTP
6. ✓ Timer reset ke 2:00
7. ✓ Attempts reset ke 3
```

### **Test 3: Failed Attempts**
```
1. Request OTP
2. Input kode salah (attempt 1)
3. ✓ Error: "Invalid OTP code. 2 attempt(s) remaining."
4. ✓ Attempts counter: 2 / 3
5. Input kode salah lagi (attempt 2)
6. ✓ Error: "Invalid OTP code. 1 attempt(s) remaining."
7. ✓ Attempts counter: 1 / 3 (merah)
```

### **Test 4: Account Blocking**
```
1. Request OTP
2. Input kode salah 3x berturut-turut
3. ✓ Error: "Maximum verification attempts exceeded. Your account has been blocked."
4. ✓ User dihapus dari database
5. ✓ Activity log mencatat blocking
6. Try login lagi dengan email yang sama
7. ✓ Error: "User not found" atau similar
8. Admin create user baru
9. ✓ User bisa request OTP lagi
```

### **Test 5: Timer Warning (< 30 seconds)**
```
1. Request OTP
2. Tunggu 1:30 menit
3. ✓ Timer berubah merah
4. ✓ Timer berkedip (animate-pulse)
5. ✓ Visual urgency terlihat jelas
```

### **Test 6: Multiple Resend**
```
1. Request OTP
2. Klik Resend sebelum expired
3. ✓ Timer reset ke 2:00
4. ✓ Failed attempts reset ke 0
5. ✓ OTP lama tidak valid
6. ✓ Hanya OTP baru yang bisa dipakai
```

---

## Database Schema

### **email_otps Table**
```sql
CREATE TABLE email_otps (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    type ENUM('registration', 'login', 'email_change') DEFAULT 'registration',
    expires_at TIMESTAMP NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    ip_address VARCHAR(45) NULL,
    failed_attempts INT DEFAULT 0,  -- NEW
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    INDEX idx_email (email)
);
```

---

## Error Messages

### **Backend Error Messages**
```
1. "Invalid OTP code. X attempt(s) remaining."
   → OTP salah, masih ada sisa percobaan

2. "OTP code has expired. Please request a new one."
   → OTP sudah lewat 2 menit

3. "Maximum verification attempts exceeded. Your account has been blocked. Please contact admin to create a new account."
   → 3x gagal, akun diblock
```

### **Frontend Error Messages**
```
1. "OTP has expired. Please request a new one."
   → Timer countdown habis

2. "Please enter a valid 6-digit OTP"
   → Input OTP tidak lengkap 6 digit

3. "Verification failed. Please try again."
   → Generic error saat API call gagal
```

---

## Security Features

### **1. Time-Based Expiry**
- ✅ OTP hanya valid 2 menit
- ✅ Mencegah brute force attack
- ✅ Mengurangi window of opportunity untuk attacker

### **2. Attempt Limiting**
- ✅ Maksimal 3 percobaan per OTP session
- ✅ Account blocking otomatis
- ✅ Attacker tidak bisa unlimited brute force

### **3. Activity Logging**
- ✅ Semua blocking tercatat di activity log
- ✅ Admin bisa audit siapa yang di-block
- ✅ Reason: "exceeded_otp_attempts"

### **4. Automatic Cleanup**
- ✅ Expired OTP otomatis terhapus
- ✅ Verified OTP tidak bisa dipakai ulang
- ✅ Database tetap clean

### **5. Rate Limiting**
- ✅ Max 5 OTP request per jam per email
- ✅ Cooldown 60 detik between resend
- ✅ Mencegah OTP spam

---

## Admin Actions

### **When User is Blocked:**

1. **View Activity Log**
   ```
   /activity-logs → Filter by "delete" action
   Reason: "exceeded_otp_attempts"
   ```

2. **Create New User**
   ```
   /users → Click "Tambah User"
   Fill: Name, Email (same email ok), Role, Password
   ✓ User bisa request OTP lagi
   ```

3. **Check Blocking History**
   ```sql
   SELECT * FROM activity_logs 
   WHERE action = 'delete' 
   AND details LIKE '%exceeded_otp_attempts%'
   ORDER BY created_at DESC;
   ```

---

## Visual States

### **Timer Colors:**
- 🟦 **Blue** (2:00 - 0:31): Normal
- 🔴 **Red + Pulse** (0:30 - 0:00): Urgent

### **Attempts Colors:**
- 🟡 **Yellow** (3 atau 2 attempts): Warning
- 🔴 **Red** (1 attempt): Critical

### **Input States:**
- ✅ **Enabled**: Timer > 0, dapat input
- ⛔ **Disabled**: Timer = 0, tidak bisa input

---

## Files Changed Summary

### **Backend:**
- ✅ `database/migrations/2025_10_31_050000_add_failed_attempts_to_email_otps_table.php` (NEW)
- ✅ `app/Models/EmailOtp.php` (UPDATED)
- ✅ `app/Services/OtpService.php` (UPDATED)
- ✅ `app/Http/Controllers/Auth/OtpVerificationController.php` (UPDATED)

### **Frontend:**
- ✅ `resources/js/pages/auth/verify-otp.tsx` (UPDATED)

### **Total Changes:**
- **5 files** modified/created
- **Migration**: Add 1 column
- **Service**: Add 4 new methods
- **Controller**: Add blocking logic
- **Frontend**: Add timer & attempts UI

---

## Benefits

### **User Experience:**
✅ **Visual feedback** dengan timer dan attempts counter  
✅ **Clear warnings** sebelum account di-block  
✅ **Smooth UX** dengan disable state saat expired  
✅ **Informative error messages** untuk setiap kondisi  

### **Security:**
✅ **Brute force protection** dengan attempt limiting  
✅ **Time-based expiry** mengurangi attack window  
✅ **Automatic blocking** untuk suspicious activity  
✅ **Activity logging** untuk audit trail  

### **Admin Control:**
✅ **Full visibility** via activity logs  
✅ **Easy recovery** via User Management  
✅ **Audit capability** untuk blocked accounts  
✅ **Clean database** dengan automatic cleanup  

---

## Conclusion

Sistem OTP sekarang memiliki:
- ⏱️ **2 minutes timer** dengan real-time countdown
- 🔢 **3 failed attempts** maximum
- 🚫 **Automatic account blocking** setelah 3x gagal
- 📊 **Visual indicators** untuk timer & attempts
- 🔒 **Enhanced security** dengan multi-layer protection
- 📝 **Complete audit trail** via activity logs

**Migration ran successfully ✓**  
**Build completed ✓**  
**Ready for testing ✓**
