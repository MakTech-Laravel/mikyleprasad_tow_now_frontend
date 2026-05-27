import * as React from 'react';
import { AxiosError } from 'axios';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { request } from '@/api/request';
import InputError from '@/components/input-error';
import { PageMeta } from '@/components/seo/PageMeta';
import Section from '@/components/section';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import InputPassword from '@/components/input-password';
import { Input } from '@/components/ui/input';
import { useSiteSettings } from '@/hooks/useSiteSettings';

type ResetLocationState = {
  email?: string;
  expiresInMinutes?: number;
};

type ResetResponse = {
  success?: boolean;
  message?: string;
};

function getErrorMessage(err: unknown, fallback: string) {
  if (err instanceof AxiosError) {
    const data = err.response?.data;
    if (data && typeof data === 'object' && 'message' in data) {
      const message = (data as { message?: unknown }).message;
      if (typeof message === 'string') return message;
    }
    if (data && typeof data === 'object' && 'errors' in data) {
      const errors = (data as { errors?: Record<string, string[]> }).errors;
      if (errors) {
        const first = Object.values(errors).flat()[0];
        if (first) return first;
      }
    }
    if (err.response?.status) return `Request failed with status ${err.response.status}.`;
    return 'Network Error. Please check the API CORS settings for this frontend origin.';
  }
  return err instanceof Error ? err.message : fallback;
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const { siteSettings } = useSiteSettings();

  const otpLength = siteSettings?.otp_code_length ?? 6;
  const locationState = (location.state as ResetLocationState | null) ?? null;
  const email = locationState?.email ?? params.get('email') ?? '';
  const expiresInMinutes = locationState?.expiresInMinutes;

  const formSchema = React.useMemo(
    () =>
      z
        .object({
          code: z
            .string()
            .min(1, { message: 'Verification code is required' })
            .regex(new RegExp(`^\\d{${otpLength}}$`), {
              message: `Enter the ${otpLength}-digit code from your email`,
            }),
          password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
          password_confirmation: z.string().min(1, { message: 'Please confirm your password' }),
        })
        .refine((data) => data.password === data.password_confirmation, {
          message: 'Passwords do not match',
          path: ['password_confirmation'],
        }),
    [otpLength],
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
      password: '',
      password_confirmation: '',
    },
  });

  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!email) navigate('/forgot-password', { replace: true });
  }, [email, navigate]);

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const res = await request.post<ResetResponse>('/reset-password', {
        email,
        code: data.code,
        password: data.password,
        password_confirmation: data.password_confirmation,
      });

      toast.success(res.data.message ?? 'Password updated. You can sign in now.');
      navigate('/login', { replace: true });
    } catch (err) {
      const message = getErrorMessage(err, 'Could not reset password. Please try again.');
      form.setError('code', { message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageMeta
        title="Reset password"
        description="Enter the code from your email and choose a new password."
        keywords={['reset password', 'recovery']}
      />
      <Section
        applyContainer
        className="w-full"
        containerClassName="min-h-[45vh] flex flex-col items-center justify-center"
      >
        <Card className="w-full max-w-md border-primary bg-input/20">
          <CardHeader>
            <CardTitle className="text-center">Reset your password</CardTitle>
            <CardDescription className="text-center">
              Enter the code sent to{' '}
              <span className="font-medium text-foreground">{email}</span>
              {expiresInMinutes ? `, valid for ${expiresInMinutes} minutes.` : '.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <FieldGroup>
                <Field className="gap-2">
                  <FieldLabel htmlFor="reset-code">Reset code</FieldLabel>
                  <Input
                    id="reset-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder={'0'.repeat(otpLength)}
                    maxLength={otpLength}
                    className="rounded-xl bg-background px-3 py-6 text-center font-mono text-lg tracking-[0.3em]"
                    {...form.register('code')}
                    onChange={(event) => {
                      const value = event.target.value.replace(/\D/g, '').slice(0, otpLength);
                      form.setValue('code', value, { shouldDirty: true, shouldValidate: true });
                    }}
                  />
                  <InputError message={form.formState.errors.code?.message} />
                </Field>
                <Field className="gap-2">
                  <FieldLabel htmlFor="reset-password">New password</FieldLabel>
                  <InputPassword
                    id="reset-password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    {...form.register('password')}
                  />
                  <InputError message={form.formState.errors.password?.message} />
                </Field>
                <Field className="gap-2">
                  <FieldLabel htmlFor="reset-password-confirm">Confirm password</FieldLabel>
                  <InputPassword
                    id="reset-password-confirm"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    {...form.register('password_confirmation')}
                  />
                  <InputError message={form.formState.errors.password_confirmation?.message} />
                </Field>
                <Button type="submit" disabled={loading} className="cursor-pointer">
                  {loading ? 'Updating...' : 'Update password'}
                </Button>
              </FieldGroup>
            </form>
            <p className="text-center text-sm text-muted-foreground">
              <Link
                to="/forgot-password"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Request a new code
              </Link>
              {' · '}
              <Link to="/login" className="underline-offset-4 hover:underline">
                Back to sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </Section>
    </>
  );
}
