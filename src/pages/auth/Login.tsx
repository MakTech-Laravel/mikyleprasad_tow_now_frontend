import * as React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { AxiosError } from 'axios';

import { request } from '@/api/request';
import {
  applyPassportTokens,
  isTwoFactorChallengeResponse,
  navigateAfterAuth,
  type PassportLoginPayload,
} from '@/auth/completePassportLogin';
import { useAuth } from '@/auth/useAuth';
import InputError from '@/components/input-error';
import { PageMeta } from '@/components/seo/PageMeta';
import Section from '@/components/section';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import InputPassword from '@/components/input-password';
import { Input } from '@/components/ui/input';
import { useLoginType } from '@/hooks/useLoginType';
const DEVICE_NAME = 'TowTruckTT Web';

const emailSchema = z
  .string()
  .min(1, { message: 'Email is required' })
  .email({ message: 'Invalid email address' });

const otpFormSchema = z.object({
  email: emailSchema,
});

const passwordFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: 'Password is required' }),
});

type OtpLoginResponse = {
  success?: boolean;
  message?: string;
  data?: {
    expires_in_minutes?: number;
  };
};

function getErrorMessage(err: unknown) {
  if (err instanceof AxiosError) {
    const data = err.response?.data;
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
    if (err.response?.status) return `Request failed with status ${err.response.status}.`;
    return 'Network Error. Please check the API CORS settings for this frontend origin.';
  }
  return err instanceof Error ? err.message : 'Login failed. Please try again.';
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginType } = useLoginType();
  const { setToken, setUser, refreshSession } = useAuth();

  const [loading, setLoading] = React.useState(false);
  const fromState = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
  const fromQuery = new URLSearchParams(location.search).get('next');
  const from = fromState ?? fromQuery ?? undefined;

  const otpForm = useForm<z.infer<typeof otpFormSchema>>({
    resolver: zodResolver(otpFormSchema),
    defaultValues: { email: '' },
  });

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onOtpSubmit(data: z.infer<typeof otpFormSchema>) {
    setLoading(true);
    try {
      const res = await request.post<OtpLoginResponse>('/login', {
        email: data.email,
        device_name: DEVICE_NAME,
      });

      toast.success(res.data.message ?? 'Verification code sent to your email.');
      navigate('/verify-otp', {
        replace: true,
        state: {
          email: data.email,
          from,
          expiresInMinutes: res.data.data?.expires_in_minutes,
        },
      });
    } catch (err) {
      const message = getErrorMessage(err);
      otpForm.setError('email', { message });
    } finally {
      setLoading(false);
    }
  }

  async function onPasswordSubmit(data: z.infer<typeof passwordFormSchema>) {
    setLoading(true);
    try {
      const res = await request.post<PassportLoginPayload>('/login', {
        email: data.email,
        password: data.password,
        device_name: DEVICE_NAME,
      });

      const body = res.data;

      if (isTwoFactorChallengeResponse(body)) {
        toast.message(res.data.message ?? 'Two-factor authentication required.');
        navigate('/two-factor-challenge', {
          replace: true,
          state: {
            twoFactorToken: body.data?.two_factor_token,
            from,
            deviceName: DEVICE_NAME,
          },
        });
        return;
      }

      const user = applyPassportTokens(body, setToken, setUser);
      const fresh = await refreshSession({ silent: true });
      toast.success(res.data.message ?? 'Login successful');
      navigateAfterAuth(navigate, fresh ?? user, from);
    } catch (err) {
      const message = getErrorMessage(err);
      if (err instanceof AxiosError && err.response?.status === 401) {
        passwordForm.setError('password', { message });
      } else if (err instanceof AxiosError && err.response?.status === 403) {
        passwordForm.setError('email', { message });
      } else {
        passwordForm.setError('root', { message });
      }
    } finally {
      setLoading(false);
    }
  }

  const isPasswordMode = loginType === 'password';

  const canResetPassword = false;

  return (
    <>
      <PageMeta
        title="Sign in"
        description="Sign in to your account to access the dashboard and protected areas."
        keywords={['login', 'sign in', 'authentication', 'account']}
      />
      <Section
        applyContainer
        className="w-full"
        containerClassName="min-h-[45vh] flex flex-col items-center justify-center "
      >
        <Card className="w-full max-w-md border-primary bg-input/20">
          <CardHeader>
            <CardTitle className="text-center">Login to your account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isPasswordMode ? (
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
                <FieldGroup>
                  <Field className="gap-2">
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      id="email"
                      autoComplete="email"
                      type="email"
                      placeholder="you@example.com"
                      className="rounded-xl bg-background px-3 py-6"
                      {...passwordForm.register('email')}
                    />
                    <InputError message={passwordForm.formState.errors.email?.message} />
                  </Field>
                  <Field className="gap-2">
                    <div className="flex items-center justify-between">
                      <FieldLabel htmlFor="password">Password</FieldLabel>
                      {canResetPassword && (
                        <Link
                          to="/forgot-password"
                          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                        >
                          Forgot password?
                        </Link>
                      )}
                    </div>
                    <InputPassword
                      id="password"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      {...passwordForm.register('password')}
                    />
                    <InputError message={passwordForm.formState.errors.password?.message} />
                  </Field>
                  <InputError message={passwordForm.formState.errors.root?.message} />
                  <Button type="submit" disabled={loading} className="cursor-pointer">
                    {loading ? 'Signing in...' : 'Sign in'}
                  </Button>
                </FieldGroup>
              </form>
            ) : (
              <form onSubmit={otpForm.handleSubmit(onOtpSubmit)}>
                <FieldGroup>
                  <Field className="gap-2">
                    <FieldLabel htmlFor="email-otp">Email</FieldLabel>
                    <Input
                      id="email-otp"
                      autoComplete="email"
                      type="email"
                      placeholder="you@example.com"
                      className="rounded-xl bg-background px-3 py-6"
                      {...otpForm.register('email')}
                    />
                    <InputError message={otpForm.formState.errors.email?.message} />
                  </Field>
                  <Button type="submit" disabled={loading} className="cursor-pointer">
                    {loading ? 'Sending code...' : 'Continue with email'}
                  </Button>
                </FieldGroup>
              </form>
            )}
            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link
                to="/select-operator"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </Section>
    </>
  );
}
