import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getErrorMessage, getErrorStack } from '@/lib/error.utils';
import { isDebugLike } from '@/lib/env';

export function RouteErrorBoundary() {
  const error = useRouteError();

  const title = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText || 'Something went wrong'}`
    : 'Something went wrong';

  const message = isRouteErrorResponse(error)
    ? typeof error.data === 'string'
      ? error.data
      : 'An unexpected error occurred'
    : getErrorMessage(error);

  const stack = !isRouteErrorResponse(error) ? getErrorStack(error) : undefined;

  return (
    <div
      className="mx-auto flex min-h-dvh max-w-3xl items-center justify-center px-4 py-12"
      role="alert"
      aria-live="assertive"
    >
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>An unexpected error occurred</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isDebugLike ? (
            <div className="space-y-2">
              <div className="rounded-md border bg-muted p-3 text-sm">{message}</div>
              {stack ? (
                <pre className="max-h-60 overflow-auto rounded-md border bg-muted p-3 text-xs">
                  {stack}
                </pre>
              ) : null}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => window.location.reload()}>
              Reload Page
            </Button>
            <Button asChild variant="outline" type="button">
              <Link to="/">Go Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
