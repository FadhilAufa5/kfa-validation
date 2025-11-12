# Validation Data Handler Implementation

## Overview
This implementation provides a comprehensive solution for handling empty validation data scenarios with different behaviors for regular users and super admins.

## Features Implemented

### 1. For Regular Users
When validation data (IM Purchases and IM Sales) is empty:
- Users are **automatically redirected** to a maintenance page after login
- The maintenance page displays:
  - Clear explanation of the issue
  - Step-by-step instructions on what to do
  - Contact information for administrators
  - Logout button

### 2. For Super Admin
When validation data is empty:
- Super admins can still access the system normally
- A **popup warning dialog** appears on the dashboard after login
- A **database notification** is created for the super admin
- The dialog shows:
  - Which tables are empty (Pembelian/Penjualan)
  - Current row counts for each table
  - Action button to go to Validation Settings page
  - Dismiss button (won't show again in the current session)

## Files Created/Modified

### New Files Created

1. **Middleware**: `app/Http/Middleware/CheckValidationData.php`
   - Checks if validation data is empty on each request
   - Redirects regular users to maintenance page
   - Allows super admins to proceed normally

2. **Service**: `app/Services/ValidationDataCheckService.php`
   - Provides methods to check validation data status
   - Creates notifications for super admins
   - Centralized validation data checking logic

3. **Notification**: `app/Notifications/ValidationDataEmptyNotification.php`
   - Database notification for super admins
   - Contains information about empty tables
   - Provides action URL to validation settings

4. **React Component**: `resources/js/components/ValidationDataWarningDialog.tsx`
   - Popup warning dialog for super admins
   - Shows table status with badges (Empty/Row count)
   - Persists dismissal in session storage
   - Styled with Tailwind CSS and shadcn/ui components

5. **Maintenance Page**: `resources/js/pages/maintenance.tsx`
   - User-friendly maintenance page
   - Bilingual content (English/Indonesian)
   - Step-by-step instructions
   - Contact information section
   - Logout functionality

6. **Migrations**: 
   - `database/migrations/2025_11_12_090439_create_im_purchases_and_return_table.php`
   - `database/migrations/2025_11_12_090448_create_im_jual_table.php`

### Modified Files

1. **Login Controller**: `app/Http/Controllers/Auth/SuperAdminLoginController.php`
   - Added validation data check after successful login
   - Creates notification if validation data is empty

2. **Dashboard Controller**: `app/Http/Controllers/DashboardController.php`
   - Added validation data status to dashboard props
   - Only for super admin users

3. **Dashboard Page**: `resources/js/pages/dashboard.tsx`
   - Integrated ValidationDataWarningDialog component
   - Shows dialog only for super admins

4. **Bootstrap App**: `bootstrap/app.php`
   - Registered CheckValidationData middleware
   - Added middleware alias: 'check.validation.data'

5. **Routes**: `routes/web.php`
   - Added maintenance route (accessible to authenticated users)
   - Applied 'check.validation.data' middleware to protected routes
   - Validation Settings page excluded from check to allow data upload

## How It Works

### User Flow
```
1. User logs in
2. Middleware checks validation data status
3. If empty:
   → Redirect to /maintenance page
   → Show instructions and contact info
   → User can only logout
4. If not empty:
   → Proceed to dashboard normally
```

### Super Admin Flow
```
1. Super Admin logs in
2. ValidationDataCheckService creates notification
3. Dashboard loads with validation data status
4. If empty:
   → Popup dialog appears
   → Notification created in database
   → Can dismiss (session-based)
   → Can access Validation Settings
5. If not empty:
   → Dashboard loads normally
```

## Middleware Logic

The `CheckValidationData` middleware:
- Runs on all authenticated routes (except maintenance page)
- Checks both `im_purchases_and_return` and `im_jual` tables
- Considers data empty if:
  - Table doesn't exist in `im_data_info`
  - Row count is 0
- Only blocks regular users, not super admins

## Routes Configuration

### Protected Routes
All routes with `check.validation.data` middleware will:
- Check validation data status
- Redirect regular users to maintenance if empty
- Allow super admins to proceed

### Exempt Routes
- `/maintenance` - Maintenance page itself
- `/validation-setting/*` - Allow super admins to upload data
- Auth routes (login, logout, etc.)

## Usage

### For Developers

#### Check validation data status programmatically:
```php
use App\Services\ValidationDataCheckService;

$service = app(ValidationDataCheckService::class);
$status = $service->checkValidationData();

// Returns:
// [
//     'is_pembelian_empty' => bool,
//     'is_penjualan_empty' => bool,
//     'pembelian_count' => int,
//     'penjualan_count' => int,
//     'has_empty_data' => bool,
//     'pembelian_info' => array|null,
//     'penjualan_info' => array|null,
// ]
```

#### Create notification for super admin:
```php
$service->createNotificationForSuperAdmin($superAdminUser);
```

#### Notify all super admins:
```php
$service->notifyAllSuperAdmins();
```

### For Super Admins

1. **When you see the warning dialog:**
   - Click "Go to Validation Settings" to upload data
   - Or click "Dismiss" to close (won't show again this session)

2. **To upload validation data:**
   - Go to Validation Settings page
   - Upload IM Purchases and Return file
   - Upload IM Sales file
   - Users will automatically gain access

3. **Check notifications:**
   - Notification bell in top navigation
   - Database notifications persist until marked as read

## Testing

### Test Scenario 1: Regular User with Empty Data
```bash
1. Clear validation data tables
2. Login as regular user
3. Expected: Redirect to maintenance page
4. Verify: Cannot access dashboard
5. Verify: Can only logout
```

### Test Scenario 2: Super Admin with Empty Data
```bash
1. Clear validation data tables
2. Login as super admin
3. Expected: Access dashboard normally
4. Verify: Warning dialog appears
5. Verify: Notification created
6. Click "Dismiss"
7. Refresh page
8. Expected: Dialog doesn't appear (session)
9. Logout and login again
10. Expected: Dialog appears again
```

### Test Scenario 3: Data Upload
```bash
1. As super admin, upload validation data
2. Verify: Tables populated
3. Login as regular user
4. Expected: Access dashboard normally
5. Verify: No maintenance page
```

## Configuration

### Contact Information
Update contact details in `resources/js/pages/maintenance.tsx`:
```tsx
Email: admin@company.com
Phone: +62 xxx-xxxx-xxxx
```

### Session Storage Key
The dialog dismissal is stored in:
```javascript
sessionStorage.getItem('validation_warning_dismissed')
```

To reset: `sessionStorage.removeItem('validation_warning_dismissed')`

## Database Schema

The implementation uses the existing `im_data_info` table:
- `table_name`: 'im_purchases_and_return' or 'im_jual'
- `row_count`: Number of rows in the table
- `last_updated_at`: Timestamp of last update
- `last_updated_by`: User who updated

## Error Handling

- If `ImDataInfo` model is missing: Assumes data is empty
- If database connection fails: Middleware lets request through
- If notification fails: Logs error but doesn't block login

## Performance Considerations

- Validation data check is cached per request
- Session storage used to prevent repeated dialog shows
- Notification only created once per super admin (checks for existing)
- Middleware runs on every protected route (minimal overhead)

## Future Enhancements

Potential improvements:
1. Add email notifications to super admins
2. Schedule automatic data refresh
3. Add data validation before upload
4. Provide partial access based on which data is available
5. Add data expiry warnings
6. Implement data health checks

## Troubleshooting

### Dialog keeps appearing
- Check session storage in browser dev tools
- Clear `validation_warning_dismissed` key

### Users can access despite empty data
- Verify middleware is registered in `bootstrap/app.php`
- Check route has 'check.validation.data' middleware
- Verify user role is not 'super_admin'

### Notification not created
- Check `notifications` table exists
- Verify user has `Notifiable` trait
- Check logs for errors

### Maintenance page styling issues
- Verify Tailwind CSS is compiled
- Check shadcn/ui components are installed
- Clear browser cache

## Security Considerations

- Middleware checks authentication before validation data
- Super admin role verified before allowing access
- No sensitive data exposed in maintenance page
- Session storage used (not localStorage for security)

## Conclusion

This implementation provides a robust solution for handling empty validation data scenarios with appropriate messaging and access control for different user roles.
