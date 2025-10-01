# Admin Authentication System

## Overview

The admin authentication system protects all `/admin` routes and only allows authorized admin users to access the admin dashboard.

## How It Works

### 1. Admin List
Admin users are defined in `lib/auth/admin.ts` by their email addresses:

```typescript
const ADMIN_EMAILS = [
  "dave@northventus.com",
  // Add more admin emails here
]
```

### 2. Client-Side Protection
- The `AuthContext` now includes an `isAdmin` boolean flag
- The `AdminGuard` component wraps the admin layout and:
  - Shows a loading spinner while checking authentication
  - Redirects non-admin users to the home page
  - Shows an "Access Denied" message if accessed directly

### 3. UI Integration
- Admin users see a gold **Admin** button in the header (both desktop and mobile)
- Non-admin users don't see this button at all
- The button uses a Shield icon and gold color for visibility

## Adding New Admin Users

1. Open `lib/auth/admin.ts`
2. Add the user's email to the `ADMIN_EMAILS` array:

```typescript
const ADMIN_EMAILS = [
  "dave@northventus.com",
  "newadmin@example.com",  // Add here
]
```

3. The user must have an account in Supabase Auth with that exact email address
4. Changes take effect immediately - the user just needs to refresh their browser

## Security Features

- ✅ **Client-side guard**: Prevents UI rendering for non-admin users
- ✅ **Context-based**: Admin status checked at auth level
- ✅ **Automatic redirect**: Non-admins are sent to home page
- ✅ **Visual indicator**: Gold admin button only visible to admins

## Future Enhancements (Optional)

Consider these improvements for production:

1. **Server-side API protection**: Add admin checks to `/api/admin/*` routes
2. **Database-backed roles**: Move admin list to a database table
3. **Environment variable**: Use `ADMIN_EMAILS` env var for easier deployment
4. **Audit logging**: Track admin actions in the database
5. **Role levels**: Add different admin permission levels (admin, super-admin, etc.)

## Testing

1. **As admin**: Log in with `dave@northventus.com` and verify you can access `/admin`
2. **As non-admin**: Log in with any other account and verify:
   - No admin button appears in header
   - Direct navigation to `/admin` redirects to home
   - "Access Denied" message appears briefly before redirect

## Files Modified

- `lib/auth/admin.ts` - Admin email list and checking functions
- `lib/auth/auth-context.tsx` - Added `isAdmin` to auth context
- `lib/supabase/server-client.ts` - Server-side Supabase client helper
- `components/admin/admin-guard.tsx` - Client-side protection component
- `components/header.tsx` - Added admin button for admin users
- `app/admin/layout.tsx` - Wrapped layout with AdminGuard
