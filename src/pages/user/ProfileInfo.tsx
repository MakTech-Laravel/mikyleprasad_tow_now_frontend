import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import Section from '@/components/section';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useInitials } from '@/hooks/useInitials';
import { Camera } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import InputError from '@/components/input-error';
import { useAuth } from '@/auth/useAuth';
import { request } from '@/api/request';
import InputPassword from '@/components/input-password';

export default function ProfileInfo() {
  // const [loading, setLoading] = useState(false);
  const getInitials = useInitials();
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const formSchema = z
    .object({
      avatar: z.instanceof(File).nullable().optional(),
      name: z.string().min(1, { message: 'Name is required' }),
      email: z.string().email({ message: 'Invalid email address' }),
      phone: z.string().min(1, { message: 'Phone number is required' }),

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

  const { user } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      avatar: null,
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
  });

  const avatarFile = form.watch('avatar');

  useEffect(() => {
    if (!(avatarFile instanceof File)) {
      setAvatarPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(avatarFile);
    setAvatarPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [avatarFile]);

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;
    form.setValue('avatar', selectedFile, { shouldDirty: true, shouldTouch: true });
    event.target.value = '';
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    // setLoading(true);
    try {
      const formData = new FormData();

      if (data.avatar instanceof File) {
        formData.append('avatar', data.avatar);
      }

      if (data.name) formData.append('name', data.name);
      if (data.email) formData.append('email', data.email);
      if (data.phone) formData.append('phone', data.phone);

      if (data.password && data.current_password) {
        formData.append('current_password', data.current_password);
        formData.append('password', data.password);
        formData.append('password_confirmation', data.password_confirmation ?? '');
      }

      await request.post('/user/profile/update', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Profile updated successfully');
    } catch (error: any) {
      const response = error?.response;

      if (response?.status === 422) {
        const errors = response.data?.errors;
        if (errors) {
          Object.entries(errors).forEach(([field, messages]) => {
            form.setError(field as any, {
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
          form.setError('current_password', {
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
    <Section className="p-0">
      <Card>
        <CardContent className="p-6">
          <h4 className="mb-4 text-lg font-semibold">Edit Profile</h4>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="relative w-fit">
              <Avatar className="h-24 w-24">
                <AvatarImage
                  src={avatarPreviewUrl ?? user?.avatar_url ?? undefined}
                  alt={user?.name || 'User'}
                />
                <AvatarFallback className="rounded-lg bg-primary font-montserrat text-lg font-semibold text-white">
                  {getInitials(user?.name || 'User')}
                </AvatarFallback>
              </Avatar>

              <Button
                variant="outline"
                size="icon"
                type="button"
                className="absolute -right-2 -bottom-2 cursor-pointer rounded-full"
                onClick={() => avatarInputRef.current?.click()}
              >
                <Camera className="size-4" />
              </Button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            <FieldGroup className="mt-4 gap-2">
              <Field className="gap-1">
                <FieldLabel>Full Name</FieldLabel>
                <Input {...form.register('name')} placeholder="Enter your full name" />
                <InputError message={form.formState.errors.name?.message} />
              </Field>
              <Field className="gap-1">
                <FieldLabel>Phone Number</FieldLabel>
                <Input {...form.register('phone')} placeholder="Enter your phone number" />
                <InputError message={form.formState.errors.phone?.message} />
              </Field>
              <Field className="gap-1">
                <FieldLabel>Email</FieldLabel>
                <Input {...form.register('email')} placeholder="Enter your email address" />
                <InputError message={form.formState.errors.email?.message} />
              </Field>
            </FieldGroup>

            <div className="">
              <h4 className="mt-8 text-lg font-semibold">Change Password</h4>
              <FieldGroup className="mt-4 gap-2">
                <Field className="gap-1">
                  <FieldLabel>Current Password</FieldLabel>
                  <InputPassword
                    {...form.register('current_password')}
                    placeholder="Enter your current password"
                  />
                  <InputError message={form.formState.errors.current_password?.message} />
                </Field>
                <Field className="gap-1">
                  <FieldLabel>New Password</FieldLabel>
                  <InputPassword
                    {...form.register('password')}
                    placeholder="Enter your new password"
                  />
                  <InputError message={form.formState.errors.password?.message} />
                </Field>
                <Field className="gap-1">
                  <FieldLabel>Confirm New Password</FieldLabel>
                  <InputPassword
                    {...form.register('password_confirmation')}
                    placeholder="Confirm your new password"
                  />
                  <InputError message={form.formState.errors.password_confirmation?.message} />
                </Field>
              </FieldGroup>
            </div>
            <Button type="submit" className="mt-4 cursor-pointer">
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </Section>
  );
}
