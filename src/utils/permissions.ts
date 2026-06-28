import type { User, UserRole, PermissionAction, PermissionLevel } from '../types';

const ROLE_GRADES: Record<UserRole, number> = {
  'eye': 1,
  'office-manager': 2,
  'senior-staff': 3,
  'deputy-manager': 4,
  'nursery-manager': 5,
  'carer': 1,
  'manager': 4,
  'admin': 5,
};

const DEFAULT_PERMISSIONS: Record<UserRole, Record<PermissionAction, PermissionLevel>> = {
  'eye': { view: 'self', add: 'self', edit: 'self', prioritise: 'self', move: 'self' },
  'office-manager': { view: 'self', add: 'self', edit: 'self', prioritise: 'self', move: 'self' },
  'senior-staff': { view: 'own-and-below', add: 'self', edit: 'own-and-below', prioritise: 'own-and-below', move: 'self' },
  'deputy-manager': { view: 'all', add: 'all', edit: 'all', prioritise: 'all', move: 'all' },
  'nursery-manager': { view: 'all', add: 'all', edit: 'all', prioritise: 'all', move: 'all' },
  'carer': { view: 'self', add: 'self', edit: 'self', prioritise: 'self', move: 'self' },
  'manager': { view: 'all', add: 'all', edit: 'all', prioritise: 'all', move: 'all' },
  'admin': { view: 'all', add: 'all', edit: 'all', prioritise: 'all', move: 'all' },
};

export function getUserGrade(role: UserRole): number {
  return ROLE_GRADES[role];
}

export function getDefaultPermissionLevel(role: UserRole, action: PermissionAction): PermissionLevel {
  return DEFAULT_PERMISSIONS[role][action];
}

export function canPerformAction(
  currentUser: User,
  targetUser: User | null,
  action: PermissionAction,
  userPermissions?: Record<PermissionAction, PermissionLevel>
): boolean {
  // Admins can do anything
  if (currentUser.isAdmin) {
    return true;
  }

  const permissionLevel = userPermissions?.[action] ?? getDefaultPermissionLevel(currentUser.role, action);

  // Self: only on own tasks
  if (permissionLevel === 'self') {
    return targetUser?.id === currentUser.id;
  }

  // All: on all users' tasks
  if (permissionLevel === 'all') {
    return true;
  }

  if (!targetUser) return false;

  const currentGrade = getUserGrade(currentUser.role);
  const targetGrade = getUserGrade(targetUser.role);

  // Below: on users with lower grade
  if (permissionLevel === 'below') {
    return targetGrade < currentGrade;
  }

  // Own and below: on users with same grade or lower
  if (permissionLevel === 'own-and-below') {
    return targetGrade <= currentGrade;
  }

  return false;
}

export function canCreateTask(currentUser: User, userPermissions?: Record<PermissionAction, PermissionLevel>): boolean {
  const permissionLevel = userPermissions?.add ?? getDefaultPermissionLevel(currentUser.role, 'add');
  return permissionLevel !== undefined;
}

export function canEditTask(
  currentUser: User,
  taskOwnerId: string,
  userPermissions?: Record<PermissionAction, PermissionLevel>
): boolean {
  if (currentUser.isAdmin) return true;

  const permissionLevel = userPermissions?.edit ?? getDefaultPermissionLevel(currentUser.role, 'edit');

  if (permissionLevel === 'self') {
    return taskOwnerId === currentUser.id;
  }

  if (permissionLevel === 'all') {
    return true;
  }

  // For 'below' and 'own-and-below', we need to know the owner's role
  // This would require a more complex check with role information
  return false;
}

export function canViewTask(
  currentUser: User,
  taskOwnerId: string,
  userPermissions?: Record<PermissionAction, PermissionLevel>
): boolean {
  if (currentUser.isAdmin) return true;

  const permissionLevel = userPermissions?.view ?? getDefaultPermissionLevel(currentUser.role, 'view');

  if (permissionLevel === 'self') {
    return taskOwnerId === currentUser.id;
  }

  if (permissionLevel === 'all') {
    return true;
  }

  return false;
}

export function canMoveTask(
  currentUser: User,
  taskOwnerId: string,
  userPermissions?: Record<PermissionAction, PermissionLevel>
): boolean {
  if (currentUser.isAdmin) return true;

  const permissionLevel = userPermissions?.move ?? getDefaultPermissionLevel(currentUser.role, 'move');

  if (permissionLevel === 'self') {
    return taskOwnerId === currentUser.id;
  }

  if (permissionLevel === 'all') {
    return true;
  }

  return false;
}

export function canPrioritiseTask(
  currentUser: User,
  taskOwnerId: string,
  userPermissions?: Record<PermissionAction, PermissionLevel>
): boolean {
  if (currentUser.isAdmin) return true;

  const permissionLevel = userPermissions?.prioritise ?? getDefaultPermissionLevel(currentUser.role, 'prioritise');

  if (permissionLevel === 'self') {
    return taskOwnerId === currentUser.id;
  }

  if (permissionLevel === 'all') {
    return true;
  }

  return false;
}
