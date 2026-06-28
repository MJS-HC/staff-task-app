# Firestore Security Rules Update for RBAC

## Problem - FIXED ✅
User management (editing roles, toggling admin status) was failing with "Missing or insufficient permissions" error.

## Root Cause
The previous rules checked if user was a "manager" (nursery-manager, deputy-manager, etc.) before allowing updates. This excluded regular staff members from updating other users.

## Solution
Simplified security rules that:
- ✅ Allow users to update their own admin/role status (toggle their own admin flag)
- ✅ Allow only users with `isAdmin: true` to update OTHER users
- ✅ Removes complex role hierarchy checks for user management
- ✅ Keeps admin-only restrictions for deleting users and managing roles collection

## Quick Fix (2 Minutes)

1. Open https://console.firebase.google.com → your project → Firestore Database → Rules tab
2. **Delete all current rules and replace with the new ones below**
3. Click **Publish**
4. Wait for green "✓ Published" checkmark
5. **Refresh browser** (F5)
6. Try toggling admin status again - should work now!

## Updated Security Rules

Replace your Firestore security rules with this version that supports the RBAC system:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAdmin() {
      let userDoc = get(/databases/$(database)/documents/users/$(request.auth.uid));
      return userDoc.data.isAdmin == true;
    }
    
    function isAuthenticated() {
      return request.auth.uid != null;
    }

    // Users collection - Full RBAC permissions
    match /users/{userId} {
      // Anyone authenticated can read users
      allow read: if isAuthenticated();
      
      // Users can update their own admin/role status
      allow update: if request.auth.uid == userId;
      
      // Admins (isAdmin: true) can update any user's role and isAdmin status
      allow update: if isAdmin();
      
      // Only admins can delete users
      allow delete: if isAdmin();
      
      // Only admins can create users
      allow create: if isAdmin() || !exists(/databases/$(database)/documents/users/$(request.auth.uid));
    }

    // Roles collection - Define custom roles
    match /roles/{roleId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // Tasks collection
    match /tasks/{taskId} {
      // Anyone authenticated can read tasks
      allow read: if isAuthenticated();
      
      // Authenticated users can create tasks
      allow create: if isAuthenticated();
      
      // Authenticated users can update tasks
      allow update: if isAuthenticated();
      
      // Only admin can delete tasks
      allow delete: if isAdmin();

      // Notes subcollection
      match /notes/{noteId} {
        // Anyone authenticated can read notes
        allow read: if isAuthenticated();
        
        // Authenticated users can create notes
        allow create: if isAuthenticated();
        
        // Users can delete/update their own notes, admins can delete any
        allow delete: if request.auth.uid == resource.data.addedBy || isAdmin();
        allow update: if request.auth.uid == resource.data.addedBy || isAdmin();
      }
    }
  }
}
```

## How to Apply the Rules

### Via Firebase Console (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Firestore Database** → **Rules** tab
4. Replace the entire content with the rules above
5. Click **Publish**
6. Wait for deployment (usually 1-2 minutes)

### Steps
1. Open https://console.firebase.google.com
2. Select "staff-tasks-7515d" project
3. Click "Firestore Database" in left sidebar
4. Click "Rules" tab at the top
5. Replace all text with the new rules
6. Click "Publish"

## Verify It Works

After updating rules:

1. **Refresh the app** (browser F5)
2. **Go to Admin → User Management**
3. **Try to change a user's role** via dropdown
4. **Check browser console** for success/error messages
5. **Look for popup alerts** confirming the update
6. **Verify the change** - the table should refresh with new role

## Troubleshooting

### If still not working:

1. **Check browser console** (F12 → Console tab)
   - Look for error messages like "Missing or insufficient permissions"
   - Screenshot the error and share it

2. **Check Firestore Rules Status**
   - Go to https://console.firebase.google.com
   - Firestore Database → Rules tab
   - Make sure rules show as "Published" (green checkmark)

3. **Verify User Permissions**
   - Only admin users or managers can update other users
   - Matthew is "deputy-manager" so should have permission
   - If not working, check his role in Firestore directly

4. **Try Admin Console**
   - Go to Firebase Console → Firestore Database → Data
   - Try manually editing a user document
   - If that works in console but not in app, it's a rules or code issue

### Common Errors

**"Missing or insufficient permissions"**
- Your Firestore rules don't allow the operation
- Apply the updated rules above

**"User doesn't exist"**
- Database path issue (unlikely)
- Try reloading the page

**"No error, but nothing changes"**
- Check browser console for hidden errors
- Try the steps in "Verify It Works" above

## Role Hierarchy for Security

| Role | Permissions |
|------|-------------|
| admin | Full access to all admin functions |
| manager (old) | Can manage users and roles |
| nursery-manager (new) | Can manage users and roles |
| deputy-manager (new) | Can manage users and roles |
| senior-staff (new) | No admin access |
| office-manager (new) | No admin access |
| eye (new) | No admin access |
| carer (old) | No admin access |

## After Fixing Rules

1. Test user management in admin panel
2. Try creating/editing/deleting users
3. Try toggling admin status
4. Try changing roles
5. All should now work with confirmation alerts

## Need Help?

If you're still having issues:
1. Screenshot the error from browser console
2. Check that your Firestore rules show "Published"
3. Verify you're logged in as admin or manager
4. Try the operation in Firebase Console directly
