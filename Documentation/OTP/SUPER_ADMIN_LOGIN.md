# Super Admin Login

## Deskripsi
Sistem login khusus untuk Super Admin yang **tidak memerlukan OTP verification**. Super Admin dapat langsung login menggunakan email dan password.

## URL Login
```
/admin/login
```

## Kredensial Default
```
Email: super@admin.com
Password: password
Role: super_admin
```

## Cara Akses

### 1. Langsung via URL
Akses langsung ke: `http://your-domain.com/admin/login`

### 2. Dari Halaman Login Regular
Di halaman login regular (`/login`), terdapat link "Super Admin Login" di bagian bawah.

## Perbedaan dengan Login Regular

| Fitur | Regular Login | Super Admin Login |
|-------|---------------|-------------------|
| OTP Verification | ✅ Required | ❌ Not Required |
| Password Required | ❌ No (OTP only) | ✅ Yes |
| Role Restriction | All roles | super_admin only |
| URL | `/login` | `/admin/login` |
| Remember Me | ❌ No | ✅ Yes |

## File yang Dibuat/Dimodifikasi

### Backend
1. **Controller**: `app/Http/Controllers/Auth/SuperAdminLoginController.php`
   - Method `create()`: Menampilkan halaman login
   - Method `store()`: Memproses login tanpa OTP
   - Validasi role harus `super_admin`

2. **Seeder**: `database/seeders/DatabaseSeeder.php`
   - Membuat user super admin dengan role `super_admin`

3. **Routes**: `routes/auth.php`
   - `GET /admin/login` - Menampilkan form login
   - `POST /admin/login` - Memproses login

### Frontend
1. **Login Page**: `resources/js/pages/auth/admin-login.tsx`
   - Form dengan email dan password
   - Checkbox "Remember Me"
   - Link kembali ke regular login
   - Warning untuk restricted access

2. **Regular Login**: `resources/js/pages/auth/login.tsx`
   - Tambahan link ke super admin login

## Keamanan
- ✅ Hanya user dengan role `super_admin` yang dapat login
- ✅ Password ter-hash menggunakan bcrypt
- ✅ Session regeneration setelah login
- ✅ Activity logging untuk audit trail
- ✅ Validasi credentials di backend

## Cara Membuat Super Admin Baru

### Via Seeder (Development)
Edit `database/seeders/DatabaseSeeder.php`:

```php
User::firstOrCreate(
    ['email' => 'admin@example.com'],
    [
        'name' => 'Admin Name',
        'password' => bcrypt('your-password'),
        'role' => 'super_admin',
        'email_verified_at' => now(),
    ]
);
```

Jalankan seeder:
```bash
php artisan db:seed --class=DatabaseSeeder
```

### Via Tinker (Production)
```bash
php artisan tinker
```

```php
User::create([
    'name' => 'Admin Name',
    'email' => 'admin@example.com',
    'password' => bcrypt('your-secure-password'),
    'role' => 'super_admin',
    'email_verified_at' => now()
]);
```

### Via Database (Manual)
```sql
INSERT INTO users (name, email, password, role, email_verified_at, created_at, updated_at)
VALUES (
    'Admin Name',
    'admin@example.com',
    '$2y$10$...',  -- Use bcrypt hash
    'super_admin',
    NOW(),
    NOW(),
    NOW()
);
```

## Testing

1. **Access Super Admin Login**
   ```
   Navigate to: http://localhost/admin/login
   ```

2. **Login dengan Kredensial**
   - Email: `super@admin.com`
   - Password: `password`
   - Check "Remember me" (optional)

3. **Verify Redirect**
   - Setelah berhasil login, akan redirect ke dashboard
   - Session akan tersimpan

4. **Check Activity Log**
   - Login activity akan tercatat di activity logs

## Troubleshooting

### Error: "These credentials do not match our records"
- Pastikan email yang digunakan adalah `super@admin.com`
- Pastikan role user di database adalah `super_admin`
- Jalankan ulang seeder: `php artisan db:seed --class=DatabaseSeeder`

### Error: "The provided credentials are incorrect"
- Password default adalah `password`
- Pastikan password sudah di-hash dengan bcrypt
- Reset password via tinker jika perlu

### Super Admin Link Tidak Muncul
- Clear cache: `php artisan optimize:clear`
- Rebuild frontend: `npm run build`

### Session Tidak Tersimpan
- Check session configuration di `.env`
- Pastikan `SESSION_DRIVER` sudah dikonfigurasi dengan benar

## Best Practices

1. **Ganti Password Default**
   - Segera ganti password `password` dengan password yang lebih kuat
   - Gunakan minimal 12 karakter dengan kombinasi huruf, angka, dan simbol

2. **Limit Super Admin Accounts**
   - Hanya buat super admin account seperlunya
   - Monitor activity logs untuk super admin

3. **Secure URL**
   - Pertimbangkan mengubah URL `/admin/login` ke sesuatu yang lebih obscure
   - Tambahkan rate limiting untuk mencegah brute force

4. **Regular Audit**
   - Review activity logs super admin secara berkala
   - Monitor failed login attempts
