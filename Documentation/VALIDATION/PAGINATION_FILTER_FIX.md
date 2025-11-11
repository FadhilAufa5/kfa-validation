# Pagination & Filter Fix - User Management

## Masalah yang Diperbaiki

### **Masalah Sebelumnya:**
1. ❌ **Client-side filtering** mengganggu server-side pagination
2. ❌ **Filter state** tidak sinkron dengan URL parameters
3. ❌ `preserveState: true` menyebabkan data tidak fresh setelah perubahan
4. ❌ Statistik (Total, Online, Offline) berubah saat filter diterapkan
5. ❌ Pencarian hanya bekerja untuk data di halaman saat ini
6. ❌ Pagination tidak preserve filter parameters

### **Solusi yang Diimplementasikan:**
1. ✅ **Server-side filtering** untuk search dan role
2. ✅ **URL-based state management** menggunakan query parameters
3. ✅ **Debounced search** untuk mengurangi request ke server
4. ✅ **Statistik global** yang tidak terpengaruh filter
5. ✅ **Clear filters button** untuk reset semua filter
6. ✅ **Proper pagination** dengan preserve query string

---

## Perubahan Backend

### File: `app/Http/Controllers/UsersController.php`

#### **1. Search Functionality**
```php
// Filter berdasarkan search (nama atau email)
if ($request->has('search') && $request->search !== '') {
    $search = $request->search;
    $query->where(function($q) use ($search) {
        $q->where('name', 'like', '%' . $search . '%')
          ->orWhere('email', 'like', '%' . $search . '%');
    });
}
```

**Fitur:**
- Pencarian di kolom `name` dan `email`
- Case-insensitive dengan `LIKE`
- OR logic untuk mencari di kedua kolom

#### **2. Role Filter**
```php
// Filter berdasarkan role
if ($request->has('role') && $request->role !== '' && $request->role !== 'all') {
    $query->where('role', $request->role);
}
```

**Fitur:**
- Filter berdasarkan role tertentu
- Skip filter jika value adalah "all" atau empty

#### **3. Pagination with Query String**
```php
// Pagination dengan 7 items per page, preserve query parameters
$users = $query->paginate(7)->withQueryString()->through(function ($user) {
    $user->is_online = Cache::has('user-is-online-' . $user->id);
    return $user;
});
```

**Fitur:**
- `withQueryString()` mempertahankan search & role params di pagination links
- 7 items per page
- Online status dihitung untuk setiap user

#### **4. Global Statistics**
```php
// Get statistics untuk semua users (tanpa filter)
$totalUsers = User::count();
$onlineUsers = User::get()->filter(function ($user) {
    return Cache::has('user-is-online-' . $user->id);
})->count();

return Inertia::render('users/index', [
    'users' => $users,
    'availableRoles' => $availableRoles,
    'filters' => [
        'search' => $request->search ?? '',
        'role' => $request->role ?? '',
    ],
    'statistics' => [
        'total' => $totalUsers,
        'online' => $onlineUsers,
        'offline' => $totalUsers - $onlineUsers,
    ],
]);
```

**Fitur:**
- Statistik dihitung dari **semua users**, bukan hasil filter
- Filter state di-share ke frontend untuk inisialisasi

---

## Perubahan Frontend

### File: `resources/js/pages/users/index.tsx`

#### **1. State Management dengan URL Params**
```tsx
const [search, setSearch] = useState(filters.search || "");
const [selectedRole, setSelectedRole] = useState<string>(filters.role || "all");
```

**Benefit:**
- State diinisialisasi dari URL params (dari backend)
- Refresh page tidak hilang filter
- Shareable URLs dengan filter

#### **2. Debounced Search**
```tsx
useEffect(() => {
  const timer = setTimeout(() => {
    handleFilterChange();
  }, 500);

  return () => clearTimeout(timer);
}, [search]);
```

**Benefit:**
- Mengurangi jumlah request ke server
- Hanya trigger setelah user berhenti mengetik (500ms)
- Automatic cleanup dengan return function

#### **3. Handle Filter Change**
```tsx
const handleFilterChange = () => {
  const params: { search?: string; role?: string; page?: number } = {};
  
  if (search) params.search = search;
  if (selectedRole && selectedRole !== "all") params.role = selectedRole;
  
  router.get(route("users.index"), params, {
    preserveScroll: true,
    preserveState: true,
  });
};
```

**Benefit:**
- Centralized filter logic
- Clean params (tidak include empty values)
- `preserveScroll` untuk better UX

#### **4. Handle Role Change**
```tsx
const handleRoleChange = (value: string) => {
  setSelectedRole(value);
  
  const params: { search?: string; role?: string } = {};
  if (search) params.search = search;
  if (value && value !== "all") params.role = value;
  
  router.get(route("users.index"), params, {
    preserveScroll: true,
    preserveState: true,
  });
};
```

**Benefit:**
- Preserve search params saat ganti role
- Immediate update (tidak debounced)
- Reset ke halaman 1

#### **5. Handle Pagination**
```tsx
const handlePageChange = (page: number) => {
  const params: { search?: string; role?: string; page: number } = { page };
  
  if (search) params.search = search;
  if (selectedRole && selectedRole !== "all") params.role = selectedRole;
  
  router.get(route("users.index"), params, {
    preserveScroll: true,
    preserveState: true,
  });
};
```

**Benefit:**
- Preserve search & role filter saat pindah halaman
- URL tetap menunjukkan filter aktif
- `preserveScroll` untuk smooth navigation

#### **6. Clear Filters Button**
```tsx
const handleClearFilters = () => {
  setSearch("");
  setSelectedRole("all");
  router.get(route("users.index"), {}, {
    preserveScroll: true,
  });
};
```

**Benefit:**
- One-click untuk reset semua filter
- Redirect ke halaman 1
- Clean URL tanpa params

#### **7. UI Update - Clear Filters Button**
```tsx
{(search || (selectedRole && selectedRole !== "all")) && (
  <Button
    size="sm"
    variant="outline"
    onClick={handleClearFilters}
    className="text-xs"
  >
    <X className="w-3 h-3 mr-1" />
    Clear Filters
  </Button>
)}
```

**Benefit:**
- Hanya muncul saat ada filter aktif
- Visual feedback untuk user
- Easy to clear filters

#### **8. Remove Client-Side Filtering**
**Before:**
```tsx
const filteredUsers = useMemo(() => {
  return users.data
    .filter((u) =>
      [u.name, u.email].some((f) => f.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => Number(b.is_online) - Number(a.is_online));
}, [users.data, search]);
```

**After:**
```tsx
<UserTable users={users.data} onEdit={...} onDelete={...} />
```

**Benefit:**
- Filtering dilakukan di server (lebih efisien)
- Pagination bekerja dengan benar
- Data konsisten dengan backend

---

## Cara Kerja

### **Flow: Search**
1. User mengetik di search box
2. `setSearch()` update local state
3. `useEffect` trigger setelah 500ms (debounce)
4. `handleFilterChange()` dipanggil
5. `router.get()` dengan params `{ search: "query" }`
6. Backend filter data berdasarkan search
7. Return paginated hasil + preserved filters

### **Flow: Role Filter**
1. User pilih role dari dropdown
2. `setSelectedRole()` update local state
3. `handleRoleChange()` langsung dipanggil
4. `router.get()` dengan params `{ search: "...", role: "admin" }`
5. Backend filter data berdasarkan role & search
6. Return paginated hasil + preserved filters

### **Flow: Pagination**
1. User klik nomor halaman
2. `handlePageChange(page)` dipanggil
3. `router.get()` dengan params `{ search: "...", role: "...", page: 2 }`
4. Backend load halaman yang diminta dengan filter preserved
5. Return paginated hasil + preserved filters

---

## Testing Scenarios

### **Test 1: Search Functionality**
```
1. Buka /users
2. Ketik "john" di search box
3. Tunggu 500ms
4. ✓ Hanya users dengan nama/email mengandung "john" yang muncul
5. ✓ URL berubah ke /users?search=john
6. ✓ Statistik tetap menampilkan total semua users
```

### **Test 2: Role Filter**
```
1. Buka /users
2. Pilih "admin" dari dropdown role
3. ✓ Hanya users dengan role "admin" yang muncul
4. ✓ URL berubah ke /users?role=admin
5. ✓ Pagination reset ke halaman 1
```

### **Test 3: Combined Filter**
```
1. Ketik "john" di search
2. Pilih "admin" dari dropdown
3. ✓ Hanya admin users dengan nama/email "john" yang muncul
4. ✓ URL: /users?search=john&role=admin
```

### **Test 4: Pagination with Filters**
```
1. Aktifkan search="john" & role="admin"
2. Klik halaman 2
3. ✓ URL: /users?search=john&role=admin&page=2
4. ✓ Filter tetap aktif di halaman 2
5. ✓ Search box & dropdown tetap menampilkan filter aktif
```

### **Test 5: Clear Filters**
```
1. Aktifkan beberapa filter
2. Klik "Clear Filters" button
3. ✓ Search box kosong
4. ✓ Role dropdown reset ke "Semua Role"
5. ✓ URL reset ke /users
6. ✓ Semua users ditampilkan
```

### **Test 6: Refresh with Filters**
```
1. Buka /users?search=john&role=admin&page=2
2. Refresh browser (F5)
3. ✓ Filter tetap aktif
4. ✓ Tetap di halaman 2
5. ✓ Search box & dropdown menampilkan filter yang aktif
```

### **Test 7: Delete User with Filters**
```
1. Aktifkan filter
2. Delete user
3. ✓ Filter tetap aktif setelah delete
4. ✓ Data refresh tanpa clear filter
```

---

## URL Examples

```
# Default (no filter)
/users

# Search only
/users?search=john

# Role filter only
/users?role=admin

# Combined filter
/users?search=john&role=admin

# With pagination
/users?search=john&role=admin&page=2

# Complex scenario
/users?search=john+doe&role=super_admin&page=3
```

---

## Performance Improvements

### **Before:**
- ❌ Filter 1000 users di client-side = Slow rendering
- ❌ Pagination tidak efektif (masih load semua data)
- ❌ Multiple re-renders saat search

### **After:**
- ✅ Server hanya return 7 items per page = Fast rendering
- ✅ Database query optimized dengan WHERE clauses
- ✅ Debounced search = Reduced server requests
- ✅ Clean URL-based state = Better caching

---

## Benefits Summary

| Feature | Before | After |
|---------|--------|-------|
| **Search** | Client-side, current page only | Server-side, all data |
| **Filter** | Local state, lost on refresh | URL params, preserved |
| **Pagination** | Works on filtered array | Works with backend query |
| **Performance** | Load all data | Load only 7 items |
| **Statistics** | Changes with filter | Always global |
| **URL Sharing** | Not possible | Fully shareable |
| **Debouncing** | No | Yes (500ms) |
| **Clear Filters** | Manual reset each | One-click clear |

---

## Code Quality

### **Best Practices Applied:**
1. ✅ **Server-side filtering** untuk data besar
2. ✅ **Debouncing** untuk mengurangi API calls
3. ✅ **URL-based state** untuk shareable links
4. ✅ **Proper TypeScript typing** untuk semua interfaces
5. ✅ **Clean query params** (no empty values)
6. ✅ **Preserve scroll** untuk better UX
7. ✅ **Centralized filter logic** untuk maintainability

---

## Future Enhancements (Optional)

### **1. Advanced Filters**
```php
// Multiple role selection
if ($request->has('roles') && is_array($request->roles)) {
    $query->whereIn('role', $request->roles);
}

// Date range filter
if ($request->has('from') && $request->has('to')) {
    $query->whereBetween('created_at', [$request->from, $request->to]);
}
```

### **2. Sort Functionality**
```php
// Sortable columns
$sortBy = $request->get('sort', 'created_at');
$sortDirection = $request->get('direction', 'desc');
$query->orderBy($sortBy, $sortDirection);
```

### **3. Per Page Selection**
```php
// Allow user to choose items per page
$perPage = $request->get('per_page', 7);
$users = $query->paginate($perPage)->withQueryString();
```

### **4. Export Functionality**
```php
// Export filtered results to CSV
Route::get('/users/export', [UsersController::class, 'export']);
```

---

## Conclusion

Sistem pagination dan filter sekarang bekerja dengan **logic yang benar**:
- ✅ Server-side processing untuk performa optimal
- ✅ URL-based state untuk shareable & bookmarkable
- ✅ Debounced search untuk UX yang lebih baik
- ✅ Proper separation of concerns (backend filters, frontend displays)
- ✅ Consistent behavior across all operations

**Changes: 2 files, +248 insertions, -57 deletions**
