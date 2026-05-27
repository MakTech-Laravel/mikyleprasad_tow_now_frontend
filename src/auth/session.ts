import { isAxiosError } from 'axios';

import { api } from '@/api/client';
import { extractUserFromAuthPayload } from '@/api/laravelResponse';
import { env } from '@/config/env';
import { normalizeAuthUser } from '@/auth/normalizeAuthUser';
import { type AuthUser } from '@/auth/types';

const ME_RETRY_DELAYS_MS = [0, 400, 900];

/** GET current user — Laravel Passport Bearer or cookie session. */
export async function fetchCurrentUser(): Promise<AuthUser | null> {
  for (let attempt = 0; attempt < ME_RETRY_DELAYS_MS.length; attempt++) {
    const delay = ME_RETRY_DELAYS_MS[attempt]!;
    if (delay > 0) {
      await new Promise((resolve) => window.setTimeout(resolve, delay));
    }

    try {
      const res = await api.get<unknown>(env.authMePath, {
        skipAuthRedirect: true,
      });
      const user = extractUserFromAuthPayload(res.data);
      return user ? normalizeAuthUser(user) : null;
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 401) {
        return null;
      }
      if (attempt === ME_RETRY_DELAYS_MS.length - 1) {
        return null;
      }
    }
  }

  return null;
}
