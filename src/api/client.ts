import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import axiosRetry from 'axios-retry';

import { getXsrfTokenFromCookie } from '@/auth/csrf';
import { getGuestToken } from '@/auth/guestToken';
import { performTokenRefresh } from '@/auth/performTokenRefresh';
import { getAccessToken, getRefreshToken, setAccessToken, setRefreshToken } from '@/auth/token';
import { isAuthBootstrapping } from '@/auth/authBootstrap';
import { emitAuthRequired, isGuestAuthPath } from '@/auth/sessionEvents';
import { emitDriverApprovalRequired } from '@/auth/driverApprovalRedirect';
import { normalizeApprovalStatus } from '@/auth/normalizeApprovalStatus';
import { env } from '@/config/env';

function shouldLog() {
  return env.isDev;
}

function normalizePath(p: string) {
  return p.replace(/^\/+/, '').replace(/\/+$/, '');
}

function isAuthRefreshRequest(config: InternalAxiosRequestConfig): boolean {
  if (!env.refreshTokenEnabled || !env.authRefreshPath) return false;
  const u = config.url ?? '';
  const ref = normalizePath(env.authRefreshPath);
  const cur = normalizePath(u);
  return cur === ref || cur.endsWith(ref);
}

function requestAuthRequiredRedirect(): void {
  const next = window.location.pathname + window.location.search;
  emitAuthRequired(next);
}

export const api: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-App-Version': import.meta.env.VITE_APP_VERSION ?? '1',
  },
  // Base timeout; slow networks get a larger timeout in request interceptor.
  timeout: 10_000,
  withCredentials: env.authStrategy === 'http_only_cookie',
});

axiosRetry(api, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) =>
    axiosRetry.isNetworkOrIdempotentRequestError(error) ||
    error.code === 'ECONNABORTED' ||
    error.response?.status === 503 ||
    error.response?.status === 429,
});

api.interceptors.request.use((config) => {
  config.headers = config.headers ?? {};

  // Let the browser set multipart boundary; default JSON Content-Type breaks FormData uploads.
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  const conn = (navigator as Navigator & { connection?: { effectiveType?: string; downlink?: number } })
    .connection;
  if (conn) {
    const slow =
      conn.effectiveType === '2g' ||
      (typeof conn.downlink === 'number' && conn.downlink > 0 && conn.downlink < 0.5);
    if (slow) {
      config.headers['X-Low-Bandwidth'] = '1';
      // 2G can easily exceed 10s for first-byte under congestion.
      config.timeout = Math.max(config.timeout ?? 0, 30_000);
    }
  }

  // Attach Passport bearer whenever present (even if VITE_AUTH_STRATEGY is cookie-first).
  const bearer = getAccessToken();
  if (bearer) {
    config.headers.Authorization = `Bearer ${bearer}`;
  }

  if (!config.headers.Authorization) {
    const guestToken = getGuestToken();
    if (guestToken) {
      config.headers['X-Guest-Token'] = guestToken;
    }
  }

  const method = config.method?.toLowerCase() ?? 'get';
  if (['post', 'put', 'patch', 'delete'].includes(method)) {
    const xsrf = getXsrfTokenFromCookie();
    if (xsrf) {
      config.headers['X-XSRF-TOKEN'] = xsrf;
    }
  }

  if (shouldLog()) {
    console.debug('[api] request', {
      method: config.method,
      url: config.baseURL ? `${config.baseURL}${config.url ?? ''}` : config.url,
      params: config.params,
      auth: env.authStrategy,
    });
  }

  return config;
});

api.interceptors.response.use(
  (res) => {
    if (shouldLog()) {
      console.debug('[api] response', {
        status: res.status,
        url: res.config.url,
      });
    }
    return res;
  },
  async (err: AxiosError) => {
    if (shouldLog()) {
      console.debug('[api] error', {
        status: err.response?.status,
        url: err.config?.url,
        message: err.message,
      });
    }

    const config = err.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (err.response?.status === 403 && typeof window !== 'undefined') {
      const body = err.response.data;
      const rawApproval =
        body &&
        typeof body === 'object' &&
        'data' in body &&
        body.data &&
        typeof body.data === 'object' &&
        'approval_status' in body.data
          ? (body.data as { approval_status?: unknown }).approval_status
          : null;
      const approvalStatus = normalizeApprovalStatus(rawApproval);

      if (approvalStatus === 'pending' || approvalStatus === 'rejected') {
        emitDriverApprovalRequired(approvalStatus);
        return Promise.reject(err);
      }
    }

    if (err.response?.status !== 401 || !config) {
      return Promise.reject(err);
    }

    // Session probes / login page — never clear tokens or redirect here
    if (config.skipAuthRedirect) {
      return Promise.reject(err);
    }

    if (typeof window !== 'undefined' && isGuestAuthPath(window.location.pathname)) {
      return Promise.reject(err);
    }

    // Wait for /me bootstrap — parallel 401s must not clear session or ping-pong login.
    if (isAuthBootstrapping()) {
      return Promise.reject(err);
    }

    // Refresh endpoint failed — cannot recover
    if (isAuthRefreshRequest(config)) {
      requestAuthRequiredRedirect();
      return Promise.reject(err);
    }

    // Optional: one retry after successful token refresh
    if (env.refreshTokenEnabled && getRefreshToken() && !config._retry) {
      try {
        const tokens = await performTokenRefresh();
        if (tokens?.accessToken) {
          setAccessToken(tokens.accessToken);
          if (tokens.refreshToken) {
            setRefreshToken(tokens.refreshToken);
          }
          config.headers = config.headers ?? {};
          config.headers.Authorization = `Bearer ${tokens.accessToken}`;
          config._retry = true;
          return api(config);
        }
      } catch {
        requestAuthRequiredRedirect();
        return Promise.reject(err);
      }
    }

    requestAuthRequiredRedirect();
    return Promise.reject(err);
  },
);
