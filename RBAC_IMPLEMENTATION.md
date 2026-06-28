# Role-Based Access Control (RBAC) Implementation

## Overview
A comprehensive role-based access control system has been implemented to replace the previous simple admin/manager/carer system with a more granular permission matrix.

## New Role Hierarchy

### Roles (by grade)
1. **EYE (Early Years Educator)** - Grade 1
2. **Office Manager** - Grade 2
3. **Senior Staff** - Grade 3
4. **Deputy Manager** - Grade 4
5. **Nursery Manager** - Grade 5

### Admin Status
- **Nursery Manager**: Defaults to `isAdmin: true`
- **All other roles**: Default to `isAdmin: false`
- Any role can be assigned `isAdmin: true` to access the admin panel

## Permission System

### Task Actions
- **View** - Read task information
- **Add** - Create new tasks
- **Edit** - Modify existing tasks
- **Prioritise** - Reorder tasks within own assignments
- **Move** - Reassign tasks to other staff

### Permission Levels
- **Self** - Only on own tasks
- **Below** - On tasks assigned to staff with lower grade
- **Own and Below** - On tasks assigned to own grade and lower
- **All** - On any task

### Default Permissions

| Role | View | Add | Edit | Prioritise | Move |
|------|------|-----|------|-----------|------|
| EYE | Self | Self | Self | Self | Self |
| Office Manager | Self | Self | Self | Self | Self |
| Senior Staff | Own & Below | Self | Own & Below | Own & Below | Self |
| Deputy Manager | All | All | All | All | All |
| Nursery Manager | All | All | All | All | All |

## Implementation Details

### Database Schema Changes
- Added `isAdmin` boolean field to user documents
- Changed `role` from `'admin' | 'manager' | 'carer'` to `'nursery-manager' | 'deputy-manager' | 'senior-staff' | 'office-manager' | 'eye'`
- Supports future `roles` collection for custom role definitions

### User Interface Changes

#### Admin Panel - User Management Tab
- Create users with new role selection
- Toggle `isAdmin` status independently from role
- Manage all users with appropriate actions

#### Admin Panel - Role & Permission Management Tab
- View all roles with their current permission matrix
- Edit permission levels for each action
- Save changes to permission configuration
- Permission matrix displayed as interactive radio button grid

### Components Updated
- **AdminPanel.tsx** - Complete rewrite with two-tab interface
- **App.tsx** - Updated navigation to use `isAdmin` instead of role check
- **AuthContext.tsx** - Updated user creation to use new roles and isAdmin field
- **TaskDashboard.tsx** - Updated permission checks for new roles
- **TaskCard.tsx** - Updated permission checks for reassignment
- **TaskDetail.tsx** - Updated permission checks for notes and editing
- **TaskForm.tsx** - Updated user loading with isAdmin field

### Utilities Added
- **permissions.ts** - Helper functions for permission checking:
  - `canPerformAction()` - Generic permission checker
  - `getUserGrade()` - Get role grade for hierarchy checks
  - `getDefaultPermissionLevel()` - Get default permission for action
  - Specific functions: `canCreateTask()`, `canEditTask()`, `canViewTask()`, `canMoveTask()`, `canPrioritiseTask()`

### Type Definitions Updated
```typescript
type UserRole = 'nursery-manager' | 'deputy-manager' | 'senior-staff' | 'office-manager' | 'eye';

interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  isAdmin: boolean;  // NEW
  createdAt: Date;
  lastLogin?: Date;
}

type PermissionAction = 'view' | 'edit' | 'prioritise' | 'move' | 'add';
type PermissionLevel = 'self' | 'below' | 'own-and-below' | 'all';

interface RoleDefinition {
  id: string;
  name: string;
  grade: number;
  permissions: Record<PermissionAction, PermissionLevel>;
  createdAt: Date;
  updatedAt: Date;
}
```

## Migration Notes

### Existing Users
Current users will need to be migrated:
1. Update `role` field from old values to new role system
2. Add `isAdmin` field (set to `true` for existing admins/managers if needed)
3. Existing "Carer" role maps to "EYE"
4. Existing "Manager" role maps to "Senior Staff" or "Deputy Manager" depending on responsibility
5. Existing "Admin" users should have `isAdmin: true`

### Firestore Security Rules
Current rules should be updated to:
- Check `isAdmin` field for admin operations
- Implement permission-level checks based on role grades
- Reference `roles` collection for custom permission definitions

## Future Enhancements

1. **Custom Role Creation** - Allow admins to create new custom roles
2. **Permission Inheritance** - Set up role templates and inheritance
3. **Audit Logging** - Track who made permission changes and when
4. **Bulk Permission Updates** - Update permissions for multiple roles at once
5. **Permission Simulation** - Preview what users can do with given permissions
6. **Activity Logs** - Show which users have accessed what based on permissions

## Testing Checklist

- [ ] Create users with each role type
- [ ] Verify new users can login with their roles
- [ ] Test permission matrix in admin panel
- [ ] Verify task visibility based on permissions
- [ ] Test task creation/editing/deletion permissions
- [ ] Test task reassignment permissions
- [ ] Verify admin-only features are protected
- [ ] Test role hierarchy (grade-based) permissions
- [ ] Verify isAdmin toggle works independently of role

## Deployment Notes

1. Deploy code changes to production
2. Run data migration script to update existing users (see Migration Notes)
3. Test thoroughly with different user roles
4. Update Firestore security rules if implementing permission enforcement at database level
5. Document new role structure for staff management
