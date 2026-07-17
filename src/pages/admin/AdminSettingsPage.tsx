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
import { useSiteSettings, type SiteSettings } from '@/hooks/useSiteSettings';
import { queryClient } from '@/lib/queryClient';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import InputPassword from '@/components/input-password';
import InputError from '@/components/input-error';
import { isAxiosError } from 'axios';
import type { AuthUser } from '@/auth/types';

type AdminSettingsUpdateData = {
  admin: {
    id: number;
    name: string;
    email: string;
    phone: string;
    avatar_url?: string | null;
  };
  site_setting: SiteSettings | null;
};

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

const settingsSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required'),
    email: z.string().trim().email('Invalid email'),
    phone: z.string().trim().min(1, { message: 'Phone number is required' }),

    site_email: z.union([z.literal(''), z.string().trim().email('Invalid email')]),
    site_phone: z.string(),
    site_address: z.string(),

    password: z
      .string()
      .optional()
      .or(z.literal('').transform(() => undefined))
      .refine((val) => !val || val.length >= 6, {
        message: 'Password must be at least 6 characters',
      }),
  })
  .superRefine((data, context) => {
    const siteValues = [data.site_email, data.site_phone, data.site_address].map((value) =>
      value.trim(),
    );
    const hasAnySiteValue = siteValues.some(Boolean);

    if (!hasAnySiteValue) return;

    (['site_email', 'site_phone', 'site_address'] as const).forEach((field, index) => {
      if (!siteValues[index]) {
        context.addIssue({
          code: 'custom',
          path: [field],
          message: 'Required when updating site information',
        });
      }
    });
  });

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function AdminSettingsPage() {
  // const [loading, setLoading] = useState(false);

  // ── Avatar state ──────────────────────────────────────────────
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user, setUser } = useAuth();
  const { siteSettings } = useSiteSettings();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm<SettingsFormValues>({
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

  const onSubmit = async (data: SettingsFormValues) => {
    // setLoading(true);
    try {
      const formData = new FormData();

      formData.append('name', data.name);
      formData.append('email', data.email);
      formData.append('phone', data.phone);
      const hasSiteData = [data.site_email, data.site_phone, data.site_address].some((value) =>
        value.trim(),
      );

      if (hasSiteData) {
        formData.append('site_email', data.site_email.trim());
        formData.append('site_phone', data.site_phone.trim());
        formData.append('site_address', data.site_address.trim());
      }

      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      if (data.password) {
        formData.append('password', data.password);
      }

      const response = await request.post<ApiEnvelope<AdminSettingsUpdateData>>(
        '/admin/profile/update',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      );
      const updated = response.data.data;
      const updatedSiteSettings = updated.site_setting ?? {
        site_email: data.site_email,
        site_phone: data.site_phone,
        site_address: data.site_address,
      };

      if (user) {
        setUser({
          ...user,
          ...updated.admin,
        } satisfies AuthUser);
      }
      queryClient.setQueryData<SiteSettings>(['site-settings'], (current) => ({
        ...current,
        ...updatedSiteSettings,
      }));
      reset({
        name: updated.admin.name,
        email: updated.admin.email,
        phone: updated.admin.phone ?? '',
        site_email: updatedSiteSettings.site_email ?? '',
        site_phone: updatedSiteSettings.site_phone ?? '',
        site_address: updatedSiteSettings.site_address ?? '',
        password: undefined,
      });
      setAvatarFile(null);
      setAvatarPreview(null);

      toast.success('Settings updated successfully');
    } catch (error: unknown) {
      const response = isAxiosError<{
        errors?: Record<string, string[]>;
      }>(error)
        ? error.response
        : undefined;

      if (response?.status === 422) {
        const errors = response.data?.errors;
        if (errors) {
          Object.entries(errors).forEach(([field, messages]) => {
            setError(field as keyof SettingsFormValues, {
              type: 'server',
              message: (messages as string[])[0],
            });
          });
        }
        return;
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
                    <Input
                      id="profile-phone"
                      type="tel"
                      autoComplete="tel"
                      {...register('phone')}
                      onChange={(event) => {
                        setValue('phone', event.target.value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                        if (event.target.value.trim()) clearErrors('phone');
                      }}
                      className="bg-background"
                    />
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
                  <FieldLabel>New Password</FieldLabel>
                  <InputPassword
                    {...register('password')}
                    placeholder="Enter your new password"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  />
                  <InputError message={errors.password?.message} />
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
