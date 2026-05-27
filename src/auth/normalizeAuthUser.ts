import { normalizeApprovalStatus } from '@/auth/normalizeApprovalStatus';
import type { AuthUser } from '@/auth/types';

export function normalizeAuthUser(user: AuthUser): AuthUser {
  if (user.role !== 'driver') {
    return user;
  }

  const status = normalizeApprovalStatus(user.approval_status);
  if (!status) {
    return user;
  }

  return { ...user, approval_status: status };
}
