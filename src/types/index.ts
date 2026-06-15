export type UserRole = 'admin' | 'manager' | 'carer';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
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
