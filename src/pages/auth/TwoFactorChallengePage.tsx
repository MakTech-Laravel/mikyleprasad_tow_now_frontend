import * as React from 'react';
import { AxiosError } from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { request } from '@/api/request';
import {
  applyPassportTokens,
  navigateAfterAuth,
  type PassportLoginPayload,
} from '@/auth/completePassportLogin';
import { useAuth } from '@/auth/useAuth';
import InputError from '@/components/input-error';
import { PageMeta } from '@/components/seo/PageMeta';
import Section from '@/components/section';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

type TwoFactorLocationState = {
  twoFactorToken?: string;
  from?: string;
  deviceName?: string;
};

const totpSchema = z.object({
  code: z
    .string()
    .min(1, { message: 'Authentication code is required' })
    .regex(/^\d{6}$/, { message: 'Enter the 6-digit code from your authenticator app' }),
});

const recoverySchema = z.object({
  recovery_code: z.string().min(1, { message: 'Recovery code is required' }),
});

function getErrorMessage(err: unknown, fallback: string) {
  if (err instanceof AxiosError) {
    const data = err.response?.data;
    if (data && typeof data === 'object' && 'message' in data) {
      const message = (data as { message?: unknown }).message;
      if (typeof message === 'string') return message;
    }
    if (err.response?.status) return `Request failed with status ${err.response.status}.`;
    return 'Network Error. Please check the API CORS settings for this frontend origin.';
  }
  return err instanceof Error ? err.message : fallback;
}

export default function TwoFactorChallengePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setToken, setUser, refreshSession } = useAuth();

  const state = (location.state as TwoFactorLocationState | null) ?? null;
  const twoFactorToken = state?.twoFactorToken ?? '';
  const from = state?.from;
  const deviceName = state?.deviceName ?? 'TowTruckTT Web';

  const [useRecovery, setUseRecovery] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const totpForm = useForm<z.infer<typeof totpSchema>>({
    resolver: zodResolver(totpSchema),
    defaultValues: { code: '' },
  });

  const recoveryForm = useForm<z.infer<typeof recoverySchema>>({
    resolver: zodResolver(recoverySchema),
    defaultValues: { recovery_code: '' },
  });

  React.useEffect(() => {
    if (!twoFactorToken) navigate('/login', { replace: true });
  }, [twoFactorToken, navigate]);

  async function completeChallenge(body: Record<string, string>) {
    setLoading(true);
    try {
      const res = await request.post<PassportLoginPayload>('/two-factor-challenge', {
        two_factor_token: twoFactorToken,
        device_name: deviceName,
        ...body,
      });

      const user = applyPassportTokens(res.data, setToken, setUser);
      const fresh = await refreshSession({ silent: true });
      toast.success(res.data.message ?? 'Login successful');
      navigateAfterAuth(navigate, fresh ?? user, from);
    } catch (err) {
      const message = getErrorMessage(err, 'Verification failed. Please try again.');
      if (useRecovery) {
        recoveryForm.setError('recovery_code', { message });
      } else {
        totpForm.setError('code', { message });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageMeta
        title="Two-factor authentication"
        description="Complete sign-in with your authenticator app or a recovery code."
        keywords={['2fa', 'two-factor', 'authentication']}
      />
      <Section
        applyContainer
        className="w-full"
        containerClassName="min-h-[45vh] flex flex-col items-center justify-center"
      >
        <Card className="w-full max-w-md border-primary bg-input/20">
          <CardHeader>
            <CardTitle className="text-center">Two-factor authentication</CardTitle>
            <CardDescription className="text-center">
              {useRecovery
                ? 'Enter one of your recovery codes.'
                : 'Enter the code from your authenticator app.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {useRecovery ? (
              <form
                onSubmit={recoveryForm.handleSubmit((data) =>
                  completeChallenge({ recovery_code: data.recovery_code }),
                )}
              >
                <FieldGroup>
                  <Field className="gap-2">
                    <FieldLabel htmlFor="recovery_code">Recovery code</FieldLabel>
                    <Input
                      id="recovery_code"
                      autoComplete="off"
                      placeholder="xxxx-xxxx"
                      className="rounded-xl bg-background px-3 py-6"
                      {...recoveryForm.register('recovery_code')}
                    />
                    <InputError message={recoveryForm.formState.errors.recovery_code?.message} />
                  </Field>
                  <Button type="submit" disabled={loading} className="cursor-pointer">
                    {loading ? 'Verifying...' : 'Verify and continue'}
                  </Button>
                </FieldGroup>
              </form>
            ) : (
              <form
                onSubmit={totpForm.handleSubmit((data) => completeChallenge({ code: data.code }))}
              >
                <FieldGroup>
                  <Field className="gap-2">
                    <FieldLabel htmlFor="2fa-code">Authentication code</FieldLabel>
                    <Input
                      id="2fa-code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="000000"
                      maxLength={6}
                      className="rounded-xl bg-background px-3 py-6 text-center font-mono text-lg tracking-[0.3em]"
                      {...totpForm.register('code')}
                      onChange={(event) => {
                        const value = event.target.value.replace(/\D/g, '').slice(0, 6);
                        totpForm.setValue('code', value, { shouldDirty: true, shouldValidate: true });
                      }}
                    />
                    <InputError message={totpForm.formState.errors.code?.message} />
                  </Field>
                  <Button type="submit" disabled={loading} className="cursor-pointer">
                    {loading ? 'Verifying...' : 'Verify and continue'}
                  </Button>
                </FieldGroup>
              </form>
            )}

            <p className="text-center text-sm text-muted-foreground">
              <button
                type="button"
                onClick={() => {
                  setUseRecovery((value) => !value);
                  totpForm.clearErrors();
                  recoveryForm.clearErrors();
                }}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {useRecovery ? 'Use authenticator app instead' : 'Use a recovery code'}
              </button>
            </p>
            <p className="text-center text-sm text-muted-foreground">
              <Link to="/login" className="underline-offset-4 hover:underline">
                Cancel and return to sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </Section>
    </>
  );
}
