export type UserRole = 'nursery-manager' | 'deputy-manager' | 'senior-staff' | 'office-manager' | 'eye' | 'admin' | 'manager' | 'carer';

export type PermissionAction = 'view' | 'edit' | 'prioritise' | 'move' | 'add';
export type PermissionLevel = 'none' | 'self' | 'below' | 'own-and-below' | 'all';

export interface Permission {
  action: PermissionAction;
  level: PermissionLevel;
}

export interface RoleDefinition {
  id: string;
  name: string;
  grade: number;
  permissions: Record<PermissionAction, PermissionLevel>;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  isAdmin: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

export interface InterimDeadline {
  id: string;
  dueDate: Date;
  description: string;
}

export interface TaskNote {
  id: string;
  text: string;
  addedBy: string;
  addedByName?: string;
  createdAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  responsibleId: string;
  responsibleName?: string;
  supportId?: string;
  supportName?: string;
  allocatedById: string;
  allocatedByName?: string;
  deadline: Date;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
  interimDeadlines: InterimDeadline[];
  notes: TaskNote[];
}
