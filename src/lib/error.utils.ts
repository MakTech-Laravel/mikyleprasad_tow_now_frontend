import { AxiosError } from 'axios';

import { logger } from '@/lib/logger';

export type NormalizedError = {
  name: string;
  message: string;
  stack?: string;
  cause?: unknown;
};

export function normalizeError(error: unknown): NormalizedError {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: (error as Error & { cause?: unknown }).cause,
    };
  }
  if (typeof error === 'string') {
    return { name: 'Error', message: error };
  }
  return {
    name: 'UnknownError',
    message: 'An unknown error occurred.',
    cause: error,
  };
}

export function getErrorMessage(error: unknown) {
  return normalizeError(error).message;
}

/** Laravel `sendResponse` / validation errors from axios responses. */
export function getApiErrorMessage(error: unknown): string | null {
  if (error instanceof AxiosError) {
    const data = error.response?.data;
    if (data && typeof data === 'object') {
      if ('message' in data && typeof (data as { message?: unknown }).message === 'string') {
        return (data as { message: string }).message;
      }
      if ('errors' in data && data.errors && typeof data.errors === 'object') {
        const errors = data.errors as Record<string, string[]>;
        const first = Object.values(errors).flat()[0];
        if (first) return first;
      }
    }
    if (error.response?.status) {
      return `Request failed with status ${error.response.status}.`;
    }
    return 'Network error. Please try again.';
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return null;
}

export function getErrorStack(error: unknown) {
  return normalizeError(error).stack;
}

export function logError(error: unknown, context = 'AppError') {
  const normalized = normalizeError(error);
  logger.group(`[${context}] ${normalized.name}`, () => {
    logger.error(normalized.message);
    if (normalized.stack) logger.debug(normalized.stack);
    if (normalized.cause !== undefined) logger.debug('cause:', normalized.cause);
  });
}
