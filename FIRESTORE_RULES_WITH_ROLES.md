# Firestore Security Rules - With Dynamic Role Management

## Updated Security Rules

Replace your Firestore security rules with this version that includes role creation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAdmin() {
      let userDoc = get(/databases/$(database)/documents/users/$(request.auth.uid));
      return userDoc.data.isAdmin == true;
    }
    
    function isAuthenticated() {
      return request.auth.uid != null;
    }

    // Users collection - User management
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow update: if request.auth.uid == userId;
      allow update: if isAdmin();
      allow delete: if isAdmin();
      allow create: if isAdmin() || !exists(/databases/$(database)/documents/users/$(request.auth.uid));
    }

    // Roles collection - Dynamic role management
    match /roles/{roleId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
      allow create: if isAdmin();
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }

    // Tasks collection
    match /tasks/{taskId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
      allow delete: if isAdmin();

      // Notes subcollection
      match /notes/{noteId} {
        allow read: if isAuthenticated();
        allow create: if isAuthenticated();
        allow delete: if request.auth.uid == resource.data.addedBy || isAdmin();
        allow update: if request.auth.uid == resource.data.addedBy || isAdmin();
      }
    }
  }
}
```

## How to Apply

1. Open https://console.firebase.google.com
2. Select your project ("staff-tasks-7515d")
3. Go to **Firestore Database** → **Rules** tab
4. Replace entire content with the rules above
5. Click **Publish**
6. Wait for "✓ Published" (green checkmark)

## What Changed

- Added `roles` collection rules
- Admins can create, read, update, and delete roles
- All authenticated users can read roles (needed for dropdowns/displays)
- Users cannot edit roles (admin-only)

## Creating Roles

Roles are now created through the admin panel:
1. Go to **Admin** → **Role & Permission Management** tab
2. Click **+ Create Role**
3. Enter role name (e.g., "Nursery Owner", "Deputy Office Manager")
4. Enter level (1=most junior, higher=more senior)
5. Click **Create Role**

## Role Structure in Firestore

Each role document in the `roles` collection has:
```javascript
{
  name: string,           // Display name
  level: number,          // Hierarchy level (1=most junior)
  permissions: {          // Permission matrix
    view: 'none' | 'self' | 'below' | 'own-and-below' | 'all',
    add: 'none' | 'self' | 'below' | 'own-and-below' | 'all',
    edit: 'none' | 'self' | 'below' | 'own-and-below' | 'all',
    prioritise: 'none' | 'self' | 'below' | 'own-and-below' | 'all',
    move: 'none' | 'self' | 'below' | 'own-and-below' | 'all'
  },
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## Hierarchy Levels

- **Level 1** = Most junior (e.g., EYE - Early Years Educator)
- **Level 2** = Junior management (e.g., Office Manager)
- **Level 3** = Mid management (e.g., Senior Staff)
- **Level 4** = Senior management (e.g., Deputy Manager)
- **Level 5+** = Top management (e.g., Nursery Manager)

Multiple roles can have the same level. Levels don't need to be sequential — you can have roles at levels 1, 2, 5, 6 with no roles at 3 and 4.

## Managing Roles

**To adjust a role's level:**
1. Edit the role document directly in Firestore Console, OR
2. (Future feature) Add edit capability to the admin panel

**To delete a role:**
1. Delete the role document in Firestore Console
2. Note: This leaves a gap in levels (no auto-reallocation)
3. Users assigned to deleted roles will show the role ID (not recommended)

## Testing

After deploying the rules, test that:
- ✅ Admins can create new roles through the admin panel
- ✅ New roles appear in the permission matrix
- ✅ New roles appear in user management role dropdown
- ✅ Non-admins cannot create/edit/delete roles
- ✅ Roles are sorted by level in the UI
- ✅ Level is displayed next to role name
