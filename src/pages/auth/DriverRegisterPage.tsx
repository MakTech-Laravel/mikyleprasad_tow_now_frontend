import * as React from 'react';
import { AxiosError } from 'axios';
import { ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { request } from '@/api/request';
import FileUpload from '@/components/file-upload';
import InputError from '@/components/input-error';
import { PageMeta } from '@/components/seo/PageMeta';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import InputPassword from '@/components/input-password';
import { Input } from '@/components/ui/input';
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

function getErrorMessage(err: unknown) {
  if (err instanceof AxiosError) {
    const data = err.response?.data;
    if (data && typeof data === 'object' && 'message' in data) {
      const message = (data as { message?: unknown }).message;
      if (typeof message === 'string') return message;
    }
    if (err.response?.status) return `Request failed with status ${err.response.status}.`;
    return 'Network Error. Please check the API CORS settings for this frontend origin.';
  }
  return err instanceof Error ? err.message : 'Driver registration failed. Please try again.';
}

function singleFile(file: File | File[] | null) {
  return Array.isArray(file) ? (file[0] ?? null) : file;
}

// 1. Use z.custom<File | null> to satisfy both RHF's need for `null` defaults
// and Zod's need to validate that a File is eventually provided.
function buildDriverFormSchema(requirePassword: boolean) {
  const base = z.object({
    name: z.string().min(1, { message: 'Full name is required' }),
    email: z
      .string()
      .min(1, { message: 'Email is required' })
      .email({ message: 'Invalid email address' }),
    phone: z.string().min(1, { message: 'Phone number is required' }),
    password: requirePassword
      ? z.string().min(8, { message: 'Password must be at least 8 characters' })
      : z.string().optional(),
    password_confirmation: requirePassword
      ? z.string().min(1, { message: 'Please confirm your password' })
      : z.string().optional(),
    carBrand: z.string().min(1, { message: 'Car brand is required' }),
    carModel: z.string().min(1, { message: 'Car model is required' }),
    carName: z.string().min(1, { message: 'Car name is required' }),
    licensePlate: z.string().min(1, { message: 'License plate is required' }),
    address: z.string().min(1, { message: 'Address is required' }),

    truckImage: z.custom<File | null>((val) => val instanceof File, {
      message: 'Truck image is required',
    }),
    drivingLicenseImage: z.custom<File | null>((val) => val instanceof File, {
      message: 'Driving license image is required',
    }),
    carLegalDocuments: z
      .custom<File | null>((val) => val === null || val instanceof File, {
        message: 'Invalid file',
      })
      .nullable(),
  });

  if (!requirePassword) {
    return base;
  }

  return base.refine((data) => data.password === data.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  });
}

type DriverFieldName = keyof z.infer<ReturnType<typeof buildDriverFormSchema>>;

type DriverField = {
  name: DriverFieldName;
  label: string;
  placeholder: string;
  type?: React.HTMLInputTypeAttribute;
  autoComplete?: string;
  className?: string;
};

const fields: DriverField[] = [
  {
    name: 'name',
    placeholder: 'Enter your full name',
    label: 'Full name',
    className: 'md:col-span-2',
    autoComplete: 'name',
  },
  {
    name: 'email',
    placeholder: 'Enter your email',
    label: 'Email',
    type: 'email',
    autoComplete: 'email',
  },
  {
    name: 'phone',
    placeholder: 'Enter your phone number',
    label: 'Phone Number',
    type: 'tel',
    autoComplete: 'tel',
  },
  { name: 'carName', placeholder: 'Enter your car name', label: 'Car Name' },
  { name: 'carBrand', placeholder: 'Enter your car brand', label: 'Car Brand' },
  { name: 'carModel', placeholder: 'Enter your car model', label: 'Car Model' },
  { name: 'licensePlate', placeholder: 'Enter your license plate', label: 'License Plate' },
  {
    name: 'address',
    placeholder: 'Enter your address',
    label: 'Address',
    className: 'md:col-span-2',
  },
];

export default function DriverRegisterPage() {
  const navigate = useNavigate();
  const { setToken, setUser, refreshSession } = useAuth();
  const { loginType } = useLoginType();
  const requirePassword = loginType === 'password';
  const formSchema = React.useMemo(() => buildDriverFormSchema(requirePassword), [requirePassword]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      password_confirmation: '',
      carBrand: '',
      carModel: '',
      carName: '',
      licensePlate: '',
      address: '',
      truckImage: null,
      drivingLicenseImage: null,
      carLegalDocuments: null,
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    const formData = new FormData();
    formData.append('role', 'driver');
    formData.append('name', data.name);
    formData.append('email', data.email);
    formData.append('phone', data.phone);
    formData.append('brand', data.carBrand);
    formData.append('model', data.carModel);
    formData.append('car_name', data.carName);
    formData.append('license_plate', data.licensePlate);
    formData.append('address', data.address);

    if (requirePassword && data.password) {
      formData.append('password', data.password);
      formData.append('password_confirmation', data.password_confirmation ?? '');
    }

    formData.append('truck_image', data.truckImage as File);
    formData.append('driving_license_image', data.drivingLicenseImage as File);
    if (data.carLegalDocuments instanceof File) {
      formData.append('legal_documents', data.carLegalDocuments);
    }
    // --- To always send legal documents (required), use instead: ---
    // formData.append('legal_documents', data.carLegalDocuments as File);

    try {
      const res = await request.post<RegisterResponse>('/register', formData);

      if (requirePassword && res.data.data?.access_token) {
        const user = applyPassportTokens(res.data, setToken, setUser);
        const fresh = await refreshSession({ silent: true });
        toast.success(res.data.message ?? 'Driver account created successfully.');
        navigateAfterAuth(navigate, fresh ?? user);
        return;
      }

      toast.success(res.data.message ?? 'Driver account created. Verify your email to continue.');
      navigate('/register-verify-otp', {
        replace: true,
        state: {
          email: data.email,
          expiresInMinutes: res.data.data?.expires_in_minutes,
          role: 'driver',
        },
      });
    } catch (err) {
      const message = getErrorMessage(err);
      console.error(message);
      form.setError('root', { message });
    }
  }

  const loading = form.formState.isSubmitting;

  return (
    <>
      <PageMeta
        title="Driver registration"
        description="Apply to drive with TowTruckTT."
        keywords={['driver', 'register', 'tow truck']}
      />
      <Section className="w-full" applyContainer containerClassName="max-w-5xl">
        <Card className="w-full border-primary bg-input/20">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome to TowTruckTT</CardTitle>
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Login
              </Link>
            </p>
          </CardHeader>
          <CardContent>
            <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-6 md:grid-cols-2">
                {fields.map((field) => (
                  <Field key={field.name} className={field.className}>
                    <FieldLabel htmlFor={`driver-${field.name}`}>
                      {field.label}
                      <span className="text-primary">*</span>
                    </FieldLabel>
                    <Input
                      placeholder={field.placeholder}
                      id={`driver-${field.name}`}
                      type={field.type ?? 'text'}
                      autoComplete={field.autoComplete}
                      className="rounded-xl bg-background px-3 py-6"
                      {...form.register(field.name)}
                    />
                    <InputError message={form.formState.errors[field.name]?.message} />
                  </Field>
                ))}
              </div>

              {requirePassword ? (
                <div className="grid gap-6 md:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="driver-password">
                      Password <span className="text-primary">*</span>
                    </FieldLabel>
                    <InputPassword
                      id="driver-password"
                      autoComplete="new-password"
                      placeholder="••••••••"
                      {...form.register('password')}
                    />
                    <InputError message={form.formState.errors.password?.message} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="driver-password-confirm">
                      Confirm password <span className="text-primary">*</span>
                    </FieldLabel>
                    <InputPassword
                      id="driver-password-confirm"
                      autoComplete="new-password"
                      placeholder="••••••••"
                      {...form.register('password_confirmation')}
                    />
                    <InputError message={form.formState.errors.password_confirmation?.message} />
                  </Field>
                </div>
              ) : null}

              <div className="grid gap-5 md:grid-cols-3">
                <Field>
                  <FieldLabel>
                    Truck Image <span className="text-primary">*</span>
                  </FieldLabel>
                  <FileUpload
                    value={form.watch('truckImage')}
                    onChange={(file) => {
                      form.setValue('truckImage', singleFile(file), { shouldValidate: true });
                    }}
                    accept="image/png,image/jpeg,image/webp"
                    maxSize={5}
                    innerClassName="min-h-44"
                    error={form.formState.errors.truckImage?.message}
                    required
                    label="Upload Truck Image"
                    description="Upload a clear image of your truck's front view."
                  />
                </Field>

                <Field>
                  <FieldLabel>
                    Driving License Image <span className="text-primary">*</span>
                  </FieldLabel>
                  <FileUpload
                    value={form.watch('drivingLicenseImage')}
                    onChange={(file) => {
                      form.setValue('drivingLicenseImage', singleFile(file), {
                        shouldValidate: true,
                      });
                    }}
                    accept="image/png,image/jpeg,image/webp"
                    maxSize={5}
                    innerClassName="min-h-44"
                    error={form.formState.errors.drivingLicenseImage?.message}
                    required
                    label="Upload Driving License Image"
                    description="Upload a clear image of your driving license."
                  />
                </Field>

                <Field>
                  <FieldLabel>
                    Car legal documents <span className="text-muted-foreground">(optional)</span>
                    {/* Required marker — uncomment when car legal documents are required again: */}
                    {/* <span className="text-primary">*</span> */}
                  </FieldLabel>
                  {/* required — add prop `required` on FileUpload when car legal documents are required again */}
                  <FileUpload
                    value={form.watch('carLegalDocuments')}
                    onChange={(file) => {
                      form.setValue('carLegalDocuments', singleFile(file), {
                        shouldValidate: true,
                      });
                    }}
                    accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    maxSize={10}
                    innerClassName="min-h-44"
                    error={form.formState.errors.carLegalDocuments?.message}
                    label="Upload Car Legal Documents"
                    description="Optional: registration documents for your vehicle (image or PDF)."
                  />
                </Field>
              </div>

              <InputError message={form.formState.errors.root?.message} />

              <p className="text-sm text-muted-foreground">
                By creating an account, you agree to the{' '}
                <Link to="/terms" className="text-primary underline-offset-4 hover:underline">
                  Terms of use
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-primary underline-offset-4 hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>

              <Button type="submit" disabled={loading} className="h-12 px-6">
                {loading ? 'Submitting...' : 'Next'}
                <ArrowRight className="size-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </Section>
    </>
  );
}
