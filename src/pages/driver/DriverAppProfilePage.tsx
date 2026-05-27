import Section from '@/components/section';
import { Camera, User, Truck, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { AvatarFallback, AvatarImage } from '@radix-ui/react-avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Link } from 'react-router-dom';
import z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/auth/useAuth';
import { useEffect, useState, useRef } from 'react';
import { FieldLabel } from '@/components/ui/field';
import InputError from '@/components/input-error';
import { request } from '@/api/request';
import { toast } from 'sonner';
import InputPassword from '@/components/input-password';
// auth types
type DriverProfileUser = {
  id: string | number;
  name: string;
  email: string;
  phone: string;
  avatar_url?: string;
  address?: string;
  vehicle?: {
    id: string | number;
    truck_image_url?: string;
    license_plate?: string;
    capacity?: string | number;
    insurance_status?: number;
  };
};

const driverProfileSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email'),
    phone: z.string().min(1, { message: 'Phone number is required' }),
    address: z.string().optional().or(z.literal('')),
    avatar: z.string().optional().or(z.literal('')),

    current_password: z
      .string()
      .optional()
      .or(z.literal('').transform(() => undefined)),
    password: z
      .string()
      .optional()
      .or(z.literal('').transform(() => undefined))
      .refine((val) => !val || val.length >= 6, {
        message: 'Password must be at least 6 characters',
      }),
    password_confirmation: z
      .string()
      .optional()
      .or(z.literal('').transform(() => undefined)),
  })
  .refine(
    (data) => {
      if (data.password && !data.current_password) return false;
      return true;
    },
    { message: 'Current password is required', path: ['current_password'] },
  )
  .refine(
    (data) => {
      if (data.password && data.password !== data.password_confirmation) return false;
      return true;
    },
    { message: 'Passwords do not match', path: ['password_confirmation'] },
  );

export default function DriverAppProfilePage() {
  // const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(driverProfileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: (user as unknown as DriverProfileUser | null)?.address || '',
    },
  });

  // Update form when user loads
  useEffect(() => {
    if (user) {
      reset({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: (user as unknown as DriverProfileUser | null)?.address || '',
      });
    }
  }, [user, reset]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Only allow image files
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed');
      return;
    }

    // Max 2MB
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleDiscard = () => {
    reset({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: (user as unknown as DriverProfileUser | null)?.address || '',
    });
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onSubmit = async (data: z.infer<typeof driverProfileSchema>) => {
    // setLoading(true);

    try {
      const formData = new FormData();

      formData.append('name', data.name);
      formData.append('email', data.email);
      formData.append('phone', data.phone);

      if (data.address) {
        formData.append('address', data.address);
      }

      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      if (data.password && data.current_password) {
        formData.append('current_password', data.current_password);
        formData.append('password', data.password);
        formData.append('password_confirmation', data.password_confirmation ?? '');
      }

      await request.post('/driver/profile/update', formData);

      toast.success('Profile updated successfully');
    } catch (error: any) {
      const response = error?.response;

      if (response?.status === 422) {
        const errors = response.data?.errors;
        if (errors) {
          Object.entries(errors).forEach(([field, messages]) => {
            setError(field as any, {
              type: 'server',
              message: (messages as string[])[0],
            });
          });
        }
        return;
      }

      if (response?.status === 500) {
        const message: string = response.data?.message ?? '';

        if (message.toLowerCase().includes('current password')) {
          setError('current_password', {
            type: 'server',
            message: message,
          });
          return;
        }
      }

      toast.error('Failed to update profile');
    }
  };

  return (
    <Section className="min-h-screen p-4 sm:p-6 lg:p-8">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mx-auto w-full">
          {/* ── Profile Header ── */}
          <div className="mb-6 flex items-center gap-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              <Avatar className="h-10 w-10 rounded-lg lg:h-20 lg:w-20">
                <AvatarImage
                  src={avatarPreview || user?.avatar_url || 'https://github.com/shadcn.png'}
                />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <Input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept="image/*"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="absolute -right-2 -bottom-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg border-2 border-white bg-[#f5c842] shadow"
              >
                <Camera className="h-3 w-3 text-gray-800" />
              </div>
              {avatarFile && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="absolute top-0 -right-2 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-destructive shadow-sm"
                >
                  ×
                </button>
              )}
            </div>

            <div>
              <h1 className="text-xl leading-tight font-bold text-gray-900 sm:text-2xl">
                {user?.name || 'Driver'}
              </h1>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-normal text-muted-foreground">
                  {user?.review_stats?.average_rating || '0.0'} Rating
                </span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">
                  {user?.created_at
                    ? `Member since ${new Date(user.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })}`
                    : ''}
                </span>
              </div>
            </div>
          </div>

          {/* ── Main Content ── */}
          <div className="flex flex-col gap-5 lg:flex-row">
            {/* Personal Information */}
            <div className="flex-1 rounded-2xl bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100">
                  <User className="h-4 w-4 text-gray-500" />
                </div>
                <span className="text-sm font-semibold text-gray-800">Personal Information</span>
              </div>

              <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
                <div className="grid-cols-1">
                  <FieldLabel>Full Name</FieldLabel>
                  <Input {...register('name')} placeholder="Enter your full name" />
                  <InputError message={errors.name?.message} />
                </div>

                <div>
                  <FieldLabel>Email</FieldLabel>
                  <Input {...register('email')} placeholder="Enter your email" />
                  <InputError message={errors.email?.message} />
                </div>

                <div>
                  <p className="mb-1.5 text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
                    Phone Number
                  </p>
                  <Input {...register('phone')} placeholder="Enter your phone number" />
                  <InputError message={errors.phone?.message} />
                </div>

                <div className="">
                  <p className="mb-1.5 text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
                    Residential Address
                  </p>
                  <Input {...register('address')} placeholder="Enter your address" />
                  <InputError message={errors.address?.message} />
                </div>
                <div className="">
                  <p className="mb-1.5 text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
                    Residential Address
                  </p>
                  <InputPassword
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    {...register('current_password')}
                    placeholder="Enter your current password"
                  />
                  <InputError message={errors.current_password?.message} />
                </div>
                <div className="">
                  <p className="mb-1.5 text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
                    Residential Address
                  </p>
                  <InputPassword {...register('password')} placeholder="Enter your new password"  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" />
                  <InputError message={errors.password?.message} />
                </div>
                <div className="">
                  <p className="mb-1.5 text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
                    Residential Address
                  </p>
                  <InputPassword
                    {...register('password_confirmation')}
                    placeholder="Confirm your new password"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  />
                  <InputError message={errors.password_confirmation?.message} />
                </div>
              </div>
            </div>

            {/* Vehicle Details */}
            <Card className="flex-shrink-0 rounded-2xl border-0 bg-primary/5 shadow-sm lg:w-[300px] xl:w-[320px]">
              <CardHeader className="px-5 pt-5 pb-4 sm:px-6">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-200">
                    <Truck className="h-4 w-4 text-gray-500" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-gray-800">
                    Vehicle Details
                  </CardTitle>
                </div>
                <CardDescription className="sr-only">
                  Details and status for the assigned vehicle
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-0 px-5 pb-0 sm:px-6">
                {/* Truck image */}
                <div
                  className="relative mb-4 h-[110px] w-full overflow-hidden rounded-xl"
                  style={{
                    background:
                      'linear-gradient(160deg,#c5dded 0%,#7baec9 35%,#2e7fad 65%,#1a4f6e 100%)',
                  }}
                >
                  <div className="absolute top-3 left-4 h-4 w-14 rounded-full bg-white/30 blur-sm" />
                  <div className="absolute top-2 left-10 h-3 w-10 rounded-full bg-white/20 blur-sm" />
                  <Avatar className="h-auto w-full rounded-xl">
                    <img
                      src={
                        (user as unknown as DriverProfileUser | null)?.vehicle?.truck_image_url ||
                        ''
                      }
                      alt="Truck"
                      className="h-full w-full object-cover"
                    />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                  <span
                    className="absolute bottom-2 left-3 text-[11px] font-bold text-white"
                    style={{ textShadow: '0 1px 6px rgba(0,0,0,0.6)' }}
                  >
                    Volvo FH Electric
                  </span>
                </div>

                {/* Stats rows */}
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs text-muted-foreground">License Plate</span>
                  <span className="text-xs font-bold tracking-wide text-gray-800">
                    {(user as unknown as DriverProfileUser | null)?.vehicle?.license_plate || ''}
                  </span>
                </div>
                <div className="border-t border-gray-100" />

                <div className="flex items-center justify-between py-2">
                  <span className="text-xs text-muted-foreground">Max Capacity</span>
                  <span className="text-xs font-bold text-gray-800">
                    {(user as unknown as DriverProfileUser | null)?.vehicle?.capacity || ''}
                  </span>
                </div>
                <div className="border-t border-gray-100" />

                <div className="flex items-center justify-between py-2">
                  <span className="text-xs text-muted-foreground">Insurance</span>

                  <span
                    className={`rounded-xl px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${
                      (user as unknown as DriverProfileUser | null)?.vehicle?.insurance_status == 1
                        ? 'bg-[#e6f9ee] text-[#1db954]'
                        : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {(user as unknown as DriverProfileUser | null)?.vehicle?.insurance_status == 1
                      ? 'Active'
                      : 'Inactive'}
                  </span>
                </div>
                <div className="border-t border-gray-100" />
              </CardContent>

              <CardFooter className="px-5 pt-3 pb-5 sm:px-6">
                <Link
                  to={`/driver-app/vehicle/${(user as unknown as DriverProfileUser | null)?.vehicle?.id}`}
                  className="w-full rounded-xl border border-border/30 bg-transparent py-2.5 text-center text-sm font-normal text-foreground shadow-none transition-colors"
                >
                  Manage Vehicle
                </Link>
              </CardFooter>
            </Card>
          </div>

          <div className="">
            <h4 className="mt-8 text-lg font-semibold">Change Password</h4>
          </div>

          {/* ── Footer ── */}
          <div className="mt-5 flex flex-col items-start justify-between gap-4 sm:items-center md:flex-row">
            <p className="text-xs leading-relaxed text-gray-400">
              All sensitive information is encrypted. Your compliance status is currently{' '}
              <span className="font-semibold text-gray-600">100% compliant</span>. Last profile
              update <span className="font-semibold text-gray-600">Today at 09:12 AM</span>.
            </p>
            <div className="flex shrink-0 gap-3">
              <Button
                type="button"
                onClick={handleDiscard}
                className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
              >
                Discard Changes
              </Button>
              <Button
                type="submit"
                className="rounded-xl bg-[#f5c842] px-5 py-2.5 text-sm font-bold text-gray-900 shadow-sm transition-colors hover:bg-yellow-300"
              >
                Save Profile Settings
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Section>
  );
}
