import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { request } from '@/api/request';
import { PageMeta } from '@/components/seo/PageMeta';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import InputPassword from '@/components/input-password';
import { Input } from '@/components/ui/input';
import InputError from '@/components/input-error';
import { AxiosError } from 'axios';
import Section from '@/components/section';
import {
  applyPassportTokens,
  navigateAfterAuth,
  type PassportLoginPayload,
} from '@/auth/completePassportLogin';
import { useAuth } from '@/auth/useAuth';
import { useLoginType } from '@/hooks/useLoginType';

type RegisterResponse = PassportLoginPayload & {
  data?: PassportLoginPayload['data'] & {
    expires_in_minutes?: number;
  };
};

function getErrorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data;
    if (data && typeof data === 'object' && 'message' in data) {
      const message = (data as { message?: unknown }).message;
      if (typeof message === 'string') return message;
    }
    if (err.response?.status) return `Request failed with status ${err.response.status}.`;
    return 'Network Error. Please check the API CORS settings for this frontend origin.';
  }
  return err instanceof Error ? err.message : 'User registration failed. Please try again.';
}

function buildFormSchema(requirePassword: boolean) {
  const base = z.object({
    email: z
      .string()
      .min(1, { message: 'Email is required' })
      .email({ message: 'Invalid email address' }),
    password: requirePassword
      ? z.string().min(8, { message: 'Password must be at least 8 characters' })
      : z.string().optional(),
    password_confirmation: requirePassword
      ? z.string().min(1, { message: 'Please confirm your password' })
      : z.string().optional(),
  });

  if (!requirePassword) {
    return base;
  }

  return base.refine((data) => data.password === data.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  });
}

export default function UserRegisterPage() {
  const navigate = useNavigate();
  const { setToken, setUser, refreshSession } = useAuth();
  const { loginType } = useLoginType();
  const requirePassword = loginType === 'password';

  const form = useForm<z.infer<ReturnType<typeof buildFormSchema>>>({
    resolver: zodResolver(buildFormSchema(requirePassword)),
    defaultValues: {
      email: '',
      password: '',
      password_confirmation: '',
    },
  });

  async function onSubmit(data: z.infer<ReturnType<typeof buildFormSchema>>) {
    try {
      const payload: Record<string, string> = {
        email: data.email,
        role: 'user',
      };

      if (requirePassword && data.password) {
        payload.password = data.password;
        payload.password_confirmation = data.password_confirmation ?? '';
      }

      const res = await request.post<RegisterResponse>('/register', payload);

      if (requirePassword && res.data.data?.access_token) {
        const user = applyPassportTokens(res.data, setToken, setUser);
        const fresh = await refreshSession({ silent: true });
        toast.success(res.data.message ?? 'Account created successfully.');
        navigateAfterAuth(navigate, fresh ?? user);
        return;
      }

      toast.success(res.data.message ?? 'Verification code sent to your email.');
      navigate('/register-verify-otp', {
        replace: true,
        state: {
          email: data.email,
          expiresInMinutes: res.data.data?.expires_in_minutes,
          role: 'user',
        },
      });
    } catch (err) {
      const message = getErrorMessage(err);
      console.error(message);
      form.setError('email', { message });
    }
  }

  const loading = form.formState.isSubmitting;

  return (
    <>
      <PageMeta
        title="Create account"
        description="Register as a TowTruckTT user."
        keywords={['register', 'sign up', 'account']}
      />
      <Section
        applyContainer
        containerClassName="min-h-[45vh] flex flex-col items-center justify-center"
      >
        <Card className="w-full max-w-md border-primary bg-input/20 p-4">
          <CardHeader>
            <CardTitle className="text-center">Create your account</CardTitle>
            <CardDescription className="text-center">
              {requirePassword
                ? 'Enter your email and password. We will send a verification code to confirm your email.'
                : 'Enter your email to receive a verification code.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <FieldGroup>
                <Field className="gap-2">
                  <FieldLabel htmlFor="reg-email">Email</FieldLabel>
                  <Input
                    id="reg-email"
                    autoComplete="email"
                    type="email"
                    placeholder="you@example.com"
                    className="rounded-xl bg-background px-3 py-6"
                    {...form.register('email')}
                  />
                  <InputError message={form.formState.errors.email?.message} />
                </Field>
                {requirePassword ? (
                  <>
                    <Field className="gap-2">
                      <FieldLabel htmlFor="reg-password">Password</FieldLabel>
                      <InputPassword
                        id="reg-password"
                        autoComplete="new-password"
                        placeholder="••••••••"
                        {...form.register('password')}
                      />
                      <InputError message={form.formState.errors.password?.message} />
                    </Field>
                    <Field className="gap-2">
                      <FieldLabel htmlFor="reg-password-confirm">Confirm password</FieldLabel>
                      <InputPassword
                        id="reg-password-confirm"
                        autoComplete="new-password"
                        placeholder="••••••••"
                        {...form.register('password_confirmation')}
                      />
                      <InputError message={form.formState.errors.password_confirmation?.message} />
                    </Field>
                  </>
                ) : null}
                <Button type="submit" disabled={loading} className="cursor-pointer">
                  {loading ? 'Creating account...' : 'Continue'}
                </Button>
              </FieldGroup>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Want to drive?{' '}
              <Link
                to="/register?role=driver"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Register as driver
              </Link>
            </p>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Login
              </Link>
            </p>
          </CardContent>
        </Card>
      </Section>
    </>
  );
}
