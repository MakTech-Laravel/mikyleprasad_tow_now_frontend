import * as React from 'react';
import { AxiosError } from 'axios';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { request } from '@/api/request';
import {
  applyPassportTokens,
  isTwoFactorChallengeResponse,
  navigateAfterAuth,
  type PassportLoginPayload,
} from '@/auth/completePassportLogin';
import { useAuth } from '@/auth/useAuth';
import InputError from '@/components/input-error';
import Section from '@/components/section';
import { PageMeta } from '@/components/seo/PageMeta';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

const RESEND_WAIT_SECONDS = 60;

type OtpLocationState = {
  email?: string;
  from?: string;
  expiresInMinutes?: number;
};

type OtpResponse = {
  success?: boolean;
  message?: string;
  data?: unknown;
};

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

const formSchema = z.object({
  code: z
    .string()
    .min(1, { message: 'Verification code is required' })
    .regex(/^\d{6}$/, { message: 'Enter the 6-digit code from your email' }),
});

export default function OtpVerificationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const { setToken, setUser, refreshSession } = useAuth();

  const locationState = (location.state as OtpLocationState | null) ?? null;
  const email = locationState?.email ?? params.get('email') ?? '';
  const from = locationState?.from;
  const expiresInMinutes = locationState?.expiresInMinutes;

  const [loading, setLoading] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const [resendSeconds, setResendSeconds] = React.useState(RESEND_WAIT_SECONDS);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
    },
  });

  React.useEffect(() => {
    if (!email) navigate('/login', { replace: true });
  }, [email, navigate]);

  React.useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setTimeout(() => {
      setResendSeconds((seconds) => Math.max(seconds - 1, 0));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const res = await request.post<PassportLoginPayload>('/otp/verify', {
        email,
        code: data.code,
        device_name: 'TowTruckTT Web',
      });

      if (isTwoFactorChallengeResponse(res.data)) {
        toast.message(res.data.message ?? 'Two-factor authentication required.');
        navigate('/two-factor-challenge', {
          replace: true,
          state: {
            twoFactorToken: res.data.data?.two_factor_token,
            from,
            deviceName: 'TowTruckTT Web',
          },
        });
        return;
      }

      const user = applyPassportTokens(res.data, setToken, setUser);
      const fresh = await refreshSession({ silent: true });

      toast.success(res.data.message ?? 'Login successful');
      navigateAfterAuth(navigate, fresh ?? user, from);
    } catch (err) {
      const message = getErrorMessage(err, 'Verification failed. Please try again.');
      console.error(message);
      form.setError('code', { message });
    } finally {
      setLoading(false);
    }
  }

  async function resendCode() {
    if (resendSeconds > 0) return;
    setResending(true);
    try {
      const res = await request.post<OtpResponse>('/otp/resend', { email });
      toast.success(res.data.message ?? 'Verification code sent again.');
      form.clearErrors();
      form.reset({ code: '' });
      setResendSeconds(RESEND_WAIT_SECONDS);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not resend the code. Please try again.'));
    } finally {
      setResending(false);
    }
  }

  return (
    <>
      <PageMeta
        title="Verify code"
        description="Enter the one-time code sent to your email."
        keywords={['otp', 'verification', '2fa']}
      />
      <Section
        applyContainer
        className="w-full"
        containerClassName="min-h-[45vh] flex flex-col items-center justify-center"
      >
        <Card className="w-full max-w-md border-primary bg-input/20">
          <CardHeader>
            <CardTitle className="text-center">Verify your code</CardTitle>
            <CardDescription className="text-center">
              We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>
              {expiresInMinutes ? `, valid for ${expiresInMinutes} minutes.` : '.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <FieldGroup>
                <Field className="gap-2">
                  <FieldLabel htmlFor="code">One-time code</FieldLabel>
                  <Input
                    id="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="000000"
                    maxLength={6}
                    className="rounded-xl bg-background px-3 py-6 text-center font-mono text-lg tracking-[0.3em]"
                    {...form.register('code')}
                    onChange={(event) => {
                      const value = event.target.value.replace(/\D/g, '').slice(0, 6);
                      form.setValue('code', value, { shouldDirty: true, shouldValidate: true });
                    }}
                  />
                  <InputError message={form.formState.errors.code?.message} />
                </Field>
                <Button type="submit" disabled={loading} className="cursor-pointer">
                  {loading ? 'Verifying...' : 'Verify and continue'}
                </Button>
              </FieldGroup>
            </form>

            <div className="space-y-3 text-center text-sm text-muted-foreground">
              <p>
                Did not receive it?{' '}
                <button
                  type="button"
                  onClick={resendCode}
                  disabled={resendSeconds > 0 || resending}
                  className="font-medium text-primary underline-offset-4 hover:underline disabled:pointer-events-none disabled:text-muted-foreground"
                >
                  {resending
                    ? 'Sending...'
                    : resendSeconds > 0
                      ? `Resend in ${resendSeconds}s`
                      : 'Resend code'}
                </button>
              </p>
              <p>
                <Link to="/login" className="underline-offset-4 hover:underline">
                  Cancel and return to sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </Section>
    </>
  );
}
