import { SendHorizonal } from 'lucide-react';

import Section from '@/components/section';
import { PageMeta } from '@/components/seo/PageMeta';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import InputError from '@/components/input-error';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import contactImage from '@/assets/contact.png';
import { toast } from 'sonner';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { buildSiteContactItems } from '@/lib/siteContact';
import { request } from '@/api/request';



export default function ContactPage() {
  const formSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    subject: z.string().min(1, 'Subject is required'),
    message: z.string().min(5, 'Message is required'),
  });
  
  const { siteSettings, isLoading } = useSiteSettings();
  const contactChannels = buildSiteContactItems(siteSettings);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
  });


  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    // setLoading(true);
    try {
      
      const formData = new FormData();
  
      formData.append('name', data.name);
      formData.append('email', data.email);
      formData.append('subject', data.subject);
      formData.append('message', data.message);

      await request.post('/contact-queries', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
  
      toast.success('Message sent successfully');
      reset();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to send message');
    } finally {
      // setLoading(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Contact us"
        description="Get in touch with TowTruckTT for support, partnerships, or general questions."
        keywords={['contact', 'support', 'tow truck', 'Trinidad']}
      />

      <Section applyContainer containerClassName="space-y-6">
        <Badge className="bg-primary/30">CONNECT WITH US</Badge>

        <Section.Heading
          title="We'd love to hear from you!"
          subtitle="Our industrial fleet and support teams are ready to assist you. Whether it's a scheduled transport or an emergency dispatch, we're your reliable logistics partner in Trinidad & Tobago."
          align="left"
          className="m-0"
        />

        <div className="grid gap-8 lg:grid-cols-5">
          <Card className="h-fit rounded-2xl border-border bg-white lg:col-span-3">
            <CardContent className="space-y-4 p-6">
              <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contact-name">Name</Label>
                    <Input id="contact-name" placeholder="Your name" {...register('name')} />
                    <InputError message={errors.name?.message} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-email">Email</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      placeholder="you@example.com"
                      {...register('email')}
                    />
                    <InputError message={errors.email?.message} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-subject">Subject</Label>
                  <Input
                    id="contact-subject"
                    placeholder="How can we help?"
                    {...register('subject')}
                  />
                  <InputError message={errors.subject?.message} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-message">Message</Label>
                  <Textarea
                    id="contact-message"
                    className="min-h-[140px] resize-y"
                    placeholder="Write your message..."
                    {...register('message')}
                  />
                  <InputError message={errors.message?.message} />
                </div>
                <Button type="submit" className="w-full">
                  Send message <SendHorizonal className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
          <div className="space-y-4 lg:col-span-2">
            <Card className="h-fit rounded-2xl border-border bg-card-foreground/5">
              <CardContent className="space-y-2 p-6">
                {isLoading
                  ? ['email', 'phone', 'address'].map((id) => (
                      <div key={id} className="flex flex-row items-center gap-4">
                        <div className="h-11 w-11 animate-pulse rounded-lg bg-white/60" />
                        <div className="flex flex-1 flex-col gap-2">
                          <span className="h-4 w-16 animate-pulse rounded bg-muted" />
                          <span className="h-4 w-36 animate-pulse rounded bg-muted" />
                        </div>
                      </div>
                    ))
                  : contactChannels.map(({ id, icon: Icon, title, label, href }) => (
                  <div key={id} className="flex flex-row items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{title}</CardTitle>
                      {href ? (
                        <a
                          href={href}
                          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                        >
                          {label}
                        </a>
                      ) : (
                        <CardDescription className="text-foreground/80">{label}</CardDescription>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <div className="relative aspect-16/7 overflow-hidden rounded-2xl">
              <img
                src={contactImage}
                alt="Contact"
                className="h-full w-full object-cover object-center"
              />
              <div className="absolute bottom-2 left-5 z-1 flex items-center gap-2 rounded-lg bg-black/5 p-2 font-semibold text-white backdrop-blur-sm">
                <span className="block h-3 w-3 rounded-full bg-primary"></span>
                <span>Our HQ, Trinidad</span>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
