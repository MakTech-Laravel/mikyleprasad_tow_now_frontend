import { DRIVER_ONBOARDING_PATH } from '@/auth/completePassportLogin';
import { normalizeApprovalStatus } from '@/auth/normalizeApprovalStatus';

const EVENT_NAME = 'townow:driver-approval-required';
const STATUS_EVENT = 'townow:driver-approval-status';

let redirectScheduled = false;
let redirectCooldownUntil = 0;

export function patchDriverApprovalStatus(status: unknown): void {
  if (typeof window === 'undefined') {
    return;
  }

  const normalized = normalizeApprovalStatus(status);
  if (normalized !== 'pending' && normalized !== 'rejected') {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(STATUS_EVENT, {
      detail: normalized,
    }),
  );
}

export function onDriverApprovalStatusPatch(
  listener: (status: 'pending' | 'rejected') => void,
): () => void {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handler = (event: Event) => {
    const detail = (event as CustomEvent<'pending' | 'rejected'>).detail;
    if (detail === 'pending' || detail === 'rejected') {
      listener(detail);
    }
  };

  window.addEventListener(STATUS_EVENT, handler);
  return () => window.removeEventListener(STATUS_EVENT, handler);
}

export function emitDriverApprovalRequired(approvalStatus?: unknown): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (window.location.pathname.startsWith(DRIVER_ONBOARDING_PATH)) {
    return;
  }

  const now = Date.now();
  if (redirectScheduled || now < redirectCooldownUntil) {
    return;
  }

  redirectScheduled = true;
  redirectCooldownUntil = now + 3_000;

  if (approvalStatus !== undefined) {
    patchDriverApprovalStatus(approvalStatus);
  }

  window.dispatchEvent(new CustomEvent(EVENT_NAME));

  window.setTimeout(() => {
    redirectScheduled = false;
  }, 100);
}

export function onDriverApprovalRequired(listener: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}
