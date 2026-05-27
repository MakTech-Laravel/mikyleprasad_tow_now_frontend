import { useAuth } from '@/auth/useAuth';
import { PageMeta } from '@/components/seo/PageMeta';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import z from 'zod';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { request } from '@/api/request';
import { Camera, User } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { queryClient } from '@/lib/queryClient';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import InputPassword from '@/components/input-password';
import InputError from '@/components/input-error';

const settingsSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email'),
    phone: z.string().min(1, { message: 'Phone number is required' }),

    site_email: z.string().email('Invalid email'),
    site_phone: z.string().min(1, { message: 'Phone number is required' }),
    site_address: z.string().min(1, 'Address is required'),

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

export default function AdminSettingsPage() {
  // const [loading, setLoading] = useState(false);

  // ── Avatar state ──────────────────────────────────────────────
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const { siteSettings } = useSiteSettings();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',

      site_email: '',
      site_phone: '',
      site_address: '',
    },
  });

  // Update form when siteSettings loads
  useEffect(() => {
    if (siteSettings) {
      reset({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        site_email: siteSettings.site_email || '',
        site_phone: siteSettings.site_phone || '',
        site_address: siteSettings.site_address || '',
      });
    }
  }, [siteSettings, user, reset]);

  // ── Avatar handlers ───────────────────────────────────────────
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDiscard = () => {
    reset({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      site_email: siteSettings?.site_email || '',
      site_phone: siteSettings?.site_phone || '',
      site_address: siteSettings?.site_address || '',
    });
    handleRemoveAvatar();
  };

  const onSubmit = async (data: z.infer<typeof settingsSchema>) => {
    // setLoading(true);
    try {
      const formData = new FormData();

      formData.append('name', data.name);
      formData.append('email', data.email);
      formData.append('phone', data.phone);
      formData.append('site_email', data.site_email);
      formData.append('site_phone', data.site_phone);
      formData.append('site_address', data.site_address);

      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      if (data.password && data.current_password) {
        formData.append('current_password', data.current_password);
        formData.append('password', data.password);
        formData.append('password_confirmation', data.password_confirmation ?? '');
      }

      await request.post('/admin/profile/update', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      await queryClient.invalidateQueries({ queryKey: ['site-settings'] });

      toast.success('Settings updated successfully');
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

  // ── Current avatar src ────────────────────────────────────────
  const avatarSrc = avatarPreview || user?.avatar_url || null;

  return (
    <>
      <PageMeta
        title="Admin — Settings"
        description="Platform configuration."
        keywords={['admin', 'settings']}
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-6">
          {/* Page header */}
          <div>
            <h1 className="font-montserrat text-2xl font-bold tracking-tight">Admin Settings</h1>
            <p className="text-sm text-muted-foreground">
              Configure system-wide parameters and operational controls.
            </p>
          </div>

          {/* Three-column card grid */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Avater card */}
            <Card className="border-border bg-accent/40">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">Profile Avatar</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-1">
                {/* Avatar preview */}
                <div className="relative">
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-muted">
                    {avatarSrc ? (
                      <img src={avatarSrc} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-10 w-10 text-muted-foreground" />
                    )}
                  </div>

                  {/* Camera button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute right-0 bottom-0 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:bg-accent"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />

                {/* Name & email preview */}
                <div className="text-center">
                  <p className="text-sm font-medium">{user?.name || 'Admin'}</p>
                  <p className="text-xs text-muted-foreground">{user?.email || ''}</p>
                </div>

                {/* Buttons */}
                <div className="flex w-full flex-col gap-2">
                  {/* <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="mr-1.5 h-3.5 w-3.5" />
                    {avatarFile ? 'Change Photo' : 'Upload Photo'}
                  </Button> */}

                  {avatarFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mx-auto max-w-xs cursor-pointer border border-red-500 text-xs text-red-500 hover:bg-red-50 hover:text-red-600"
                      onClick={handleRemoveAvatar}
                    >
                      Remove Photo
                    </Button>
                  )}
                </div>

                <p className="text-center text-xs text-muted-foreground">
                  JPG, PNG or WebP. Max 2MB.
                </p>
              </CardContent>
            </Card>
            {/* ── Admin Profile Management ── */}
            <Card className="border-border bg-accent/40">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">Admin Profile Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="first-name"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Full Name
                    </Label>
                    <Input id="first-name" {...register('name')} className="bg-background" />
                    {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="profile-phone"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Phone Number
                    </Label>
                    <Input id="profile-phone" {...register('phone')} className="bg-background" />
                    {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="profile-email"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Email Address
                    </Label>
                    <Input
                      id="profile-email"
                      type="email"
                      {...register('email')}
                      className="bg-background"
                    />
                    {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-accent/40 p-6">
              <h4 className="text-lg font-semibold">Change Password</h4>
              <FieldGroup className="mt-4 gap-2">
                <Field className="gap-1">
                  <FieldLabel>Current Password</FieldLabel>
                  <InputPassword
                    {...register('current_password')}
                    placeholder="Enter your current password"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  />
                  <InputError message={errors.current_password?.message} />
                </Field>
                <Field className="gap-1">
                  <FieldLabel>New Password</FieldLabel>
                  <InputPassword
                    {...register('password')}
                    placeholder="Enter your new password"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  />
                  <InputError message={errors.password?.message} />
                </Field>
                <Field className="gap-1">
                  <FieldLabel>Confirm New Password</FieldLabel>
                  <InputPassword
                    {...register('password_confirmation')}
                    placeholder="Confirm your new password"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  />
                  <InputError message={errors.password_confirmation?.message} />
                </Field>
              </FieldGroup>
            </Card>

            {/* ── Admin Content Management ── */}
            <Card className="border-border bg-accent/40">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">Admin Content Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="content-email"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Email Address
                    </Label>
                    <Input
                      id="content-email"
                      type="email"
                      {...register('site_email')}
                      className="bg-background"
                    />
                    {errors.site_email && (
                      <p className="text-xs text-red-500">{errors.site_email.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="content-phone"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Phone Number
                    </Label>
                    <Input
                      id="content-phone"
                      {...register('site_phone')}
                      className="bg-background"
                    />
                    {errors.site_phone && (
                      <p className="text-xs text-red-500">{errors.site_phone.message}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="content-location"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Location
                  </Label>
                  <Input
                    id="content-location"
                    {...register('site_address')}
                    className="bg-background"
                  />
                  {errors.site_address && (
                    <p className="text-xs text-red-500">{errors.site_address.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleDiscard}
              className="min-w-[140px] cursor-pointer"
            >
              Discard Changes
            </Button>
            <Button
              type="submit"
              className="min-w-[180px] cursor-pointer bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Save Global Settings
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}
