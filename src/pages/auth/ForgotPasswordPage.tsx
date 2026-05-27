import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { AxiosError } from 'axios';

import { request } from '@/api/request';
import InputError from '@/components/input-error';
import { PageMeta } from '@/components/seo/PageMeta';
import Section from '@/components/section';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

const formSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Invalid email address' }),
});

type ForgotResponse = {
  success?: boolean;
  message?: string;
  data?: {
    expires_in_minutes?: number;
    retry_after_seconds?: number;
  };
  code?: string;
};

function getErrorMessage(err: unknown, fallback: string) {
  if (err instanceof AxiosError) {
    const data = err.response?.data;
    if (data && typeof data === 'object' && 'message' in data) {
      const message = (data as { message?: unknown }).message;
      if (typeof message === 'string') return message;
    }
    if (err.response?.status === 429) {
      const retry = (data as ForgotResponse)?.data?.retry_after_seconds;
      if (typeof retry === 'number' && retry > 0) {
        return `Please wait ${retry} seconds before requesting another code.`;
      }
    }
    if (err.response?.status) return `Request failed with status ${err.response.status}.`;
    return 'Network Error. Please check the API CORS settings for this frontend origin.';
  }
  return err instanceof Error ? err.message : fallback;
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const res = await request.post<ForgotResponse>('/forgot-password', {
        email: data.email,
      });

      toast.success(
        res.data.message ??
          'If an account exists for this email, a reset code has been sent.',
      );
      navigate('/reset-password', {
        replace: true,
        state: {
          email: data.email,
          expiresInMinutes: res.data.data?.expires_in_minutes,
        },
      });
    } catch (err) {
      const message = getErrorMessage(err, 'Could not send reset code. Please try again.');
      form.setError('email', { message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageMeta
        title="Forgot password"
        description="Request a password reset code for your TowTruckTT account."
        keywords={['forgot password', 'reset', 'account recovery']}
      />
      <Section
        applyContainer
        className="w-full"
        containerClassName="min-h-[45vh] flex flex-col items-center justify-center"
      >
        <Card className="w-full max-w-md border-primary bg-input/20">
          <CardHeader>
            <CardTitle className="text-center">Forgot your password?</CardTitle>
            <CardDescription className="text-center">
              Enter your email and we&apos;ll send you a one-time code to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <FieldGroup>
                <Field className="gap-2">
                  <FieldLabel htmlFor="forgot-email">Email</FieldLabel>
                  <Input
                    id="forgot-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="rounded-xl bg-background px-3 py-6"
                    {...form.register('email')}
                  />
                  <InputError message={form.formState.errors.email?.message} />
                </Field>
                <Button type="submit" disabled={loading} className="cursor-pointer">
                  {loading ? 'Sending...' : 'Send reset code'}
                </Button>
              </FieldGroup>
            </form>
            <p className="text-center text-sm text-muted-foreground">
              <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
                Back to sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </Section>
    </>
  );
}
