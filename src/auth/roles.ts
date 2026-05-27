import { env, type RoleMode } from '@/config/env';
import { type AuthUser } from '@/auth/types';

export type Role = string;

export function getUserRoles(user: AuthUser | null, mode: RoleMode = env.roleMode): Role[] {
  if (!user) return [];

  if (mode === 'multi') {
    const roles = Array.isArray(user.roles) ? user.roles : [];
    if (roles.length > 0) return roles;
    if (typeof user.role === 'string' && user.role) return [user.role];
    return [];
  }

  if (typeof user.role === 'string' && user.role) return [user.role];
  if (Array.isArray(user.roles) && user.roles.length > 0) return [user.roles[0]!];
  return [];
}

export function hasAnyRole(user: AuthUser | null, required: Role | Role[]) {
  const requiredList = Array.isArray(required) ? required : [required];
  const roles = getUserRoles(user);
  return requiredList.some((r) => roles.includes(r));
}

export const roleDashboards: Record<string, string> = {
  admin: '/admin',
  user: '/dashboard',
  driver: '/driver-app',
};

/** List page base path for in-app notifications (bell link). */
export const roleNotificationPaths: Record<string, string> = {
  admin: '/admin/notifications',
  user: '/notifications',
  driver: '/driver-app/notifications',
};

export function notificationsBasePathForUser(user: AuthUser | null): string {
  const roles = getUserRoles(user);
  const order = ['admin', 'driver', 'user'];
  for (const r of order) {
    if (roles.includes(r) && roleNotificationPaths[r]) return roleNotificationPaths[r];
  }
  return '/notifications';
}
