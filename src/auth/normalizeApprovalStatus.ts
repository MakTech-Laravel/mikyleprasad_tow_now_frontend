/** Normalize API / cached approval_status (string or enum-shaped object). */
export function normalizeApprovalStatus(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value.toLowerCase();
  }

  if (value && typeof value === 'object' && 'value' in value) {
    const inner = (value as { value?: unknown }).value;
    if (typeof inner === 'string') {
      return inner.toLowerCase();
    }
  }

  return undefined;
}
