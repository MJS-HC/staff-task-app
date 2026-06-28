# RBAC System Migration Guide

## Overview
This guide explains how to migrate existing users from the old role system to the new RBAC system.

## Old vs New Roles

| Old Role | Recommended New Role | isAdmin |
|----------|----------------------|---------|
| admin | nursery-manager | true |
| manager | deputy-manager | true |
| carer | eye | false |

## Temporary Backward Compatibility

**The system is currently backwards compatible!** The admin link will show for:
- Users with `isAdmin: true` (new system)
- Users with role `admin` (old system)
- Users with role `manager` (old system)

This gives you time to migrate users without breaking anything.

---

## How to Migrate Users (Two Options)

### Option 1: Manual Migration via Admin Panel (Recommended)

1. **Log in to the admin panel** (still accessible with old roles)
2. Go to **User Management** tab
3. For each user, change their role to the new system:
   - Old `carer` → New `eye`
   - Old `manager` → New `deputy-manager` or `senior-staff`
   - Old `admin` → New `nursery-manager`
4. Toggle the **Admin** column to set `isAdmin` status:
   - Old `admin` users → Toggle Admin to **Yes**
   - Old `manager` users → Toggle Admin to **Yes** (or **No** if they shouldn't be admin)
   - Old `carer` users → Keep as **No**

### Option 2: Direct Firestore Update (Advanced)

If you have direct Firestore access, update each user document:

```javascript
// For each user document in /users/{userId}

// Old admin user → new Nursery Manager with admin
{
  username: "username",
  email: "user@example.com",
  role: "nursery-manager",      // Changed from "admin"
  isAdmin: true,                 // NEW field
  createdAt: Timestamp,
  lastLogin: Timestamp
}

// Old manager user → new Deputy Manager with admin
{
  username: "username",
  email: "user@example.com",
  role: "deputy-manager",        // Changed from "manager"
  isAdmin: true,                 // NEW field
  createdAt: Timestamp,
  lastLogin: Timestamp
}

// Old carer user → new EYE without admin
{
  username: "username",
  email: "user@example.com",
  role: "eye",                   // Changed from "carer"
  isAdmin: false,                // NEW field
  createdAt: Timestamp,
  lastLogin: Timestamp
}
```

### Option 3: Use Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project → Firestore Database
3. Navigate to `users` collection
4. Click each user document
5. Edit the fields:
   - Update `role` to new value
   - Add `isAdmin` field (Boolean)
6. Save changes

---

## Migration Checklist

- [ ] List all current users and their roles
- [ ] Decide on new role assignments for each user
- [ ] Decide on admin status for each user
- [ ] Update users one by one (via admin panel recommended)
- [ ] Test that users can still log in after migration
- [ ] Verify admin link appears for admin users
- [ ] Test permission matrix in admin panel
- [ ] Test task visibility/permissions for different roles
- [ ] Remove old role references from code (optional, after testing)

---

## After Migration

Once all users are migrated and working, you can:

1. **Remove backward compatibility** (optional):
   ```typescript
   // Before (in App.tsx):
   {(user.isAdmin || user.role === 'admin' || user.role === 'manager') && ...}
   
   // After:
   {user.isAdmin && ...}
   ```

2. **Update security rules** to enforce the new permission system

3. **Update documentation** for staff about new roles

---

## Testing Migration

After migrating a few users, test by:

1. **Log in as each user** with new role
2. **Verify permissions work** based on new role
3. **Check admin access** - should see Admin link if `isAdmin: true`
4. **Test permission matrix** - should show correct defaults for new role
5. **Verify task visibility** - should follow new permission levels

---

## Rollback Plan

If something goes wrong during migration:

1. You can revert users back to old roles (undo the changes)
2. The code supports both old and new systems simultaneously
3. Test thoroughly with a few users first before migrating everyone

---

## Questions?

Refer to `RBAC_IMPLEMENTATION.md` for detailed information about the new system.
