/**
 * True while the initial bearer session probe (/me) is in flight after a page load.
 * Protected API calls that 401 during this window must not clear the session.
 */
let bootstrapDepth = 0;

/** Set true after the first /me probe finishes (success or failure). */
let initialSessionProbeComplete = false;

export function beginAuthBootstrap(): void {
  bootstrapDepth += 1;
}

export function endAuthBootstrap(): void {
  bootstrapDepth = Math.max(0, bootstrapDepth - 1);
}

export function isAuthBootstrapping(): boolean {
  return bootstrapDepth > 0;
}

export function markInitialSessionProbeComplete(): void {
  initialSessionProbeComplete = true;
}

export function hasInitialSessionProbeCompleted(): boolean {
  return initialSessionProbeComplete;
}

export function resetInitialSessionProbeForTests(): void {
  bootstrapDepth = 0;
  initialSessionProbeComplete = false;
}
