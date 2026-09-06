export type SystemRoleType =
  | 'PATIENT'
  | 'DONOR'
  | 'RECEPTIONIST'
  | 'MANAGER'
  | 'AUDITOR';

export interface User {
  id: string;
  cpf: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  passwordHash: string;
  isActive: boolean;
  isTwoFactorEnabled: boolean;
  failedLoginAttemptsCount: number;
  lockedUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: SystemRoleType;
  description: string;
  isCustom: boolean;
}

export interface RolePermission {
  id: string;
  roleId: string;
  permissionCode: string;
}

export interface UserRole {
  userId: string;
  roleId: string;
  assignedAt: string;
}
