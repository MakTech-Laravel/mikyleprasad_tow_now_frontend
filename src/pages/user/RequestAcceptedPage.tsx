import { Link } from 'react-router-dom';
import { CheckCircle2, Clock3, DollarSign, MapPin, MessageCircle, Phone } from 'lucide-react';

import { PageMeta } from '@/components/seo/PageMeta';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Section from '@/components/section';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/useInitials';
import { useRideFromUrl } from '@/features/rides/useRideFromUrl';

export default function RequestAcceptedPage() {
  const { ride, conversationId } = useRideFromUrl();
  const driver = ride?.driver;
  const getInitials = useInitials();

  return (
    <>
      <PageMeta
        title="Request Accepted"
        description="The selected driver accepted your request."
        keywords={['request accepted']}
      />

      <Section applyContainer containerClassName="space-y-6 max-w-5xl">
        <div className="flex items-center justify-center">
          <span className="inline-flex items-center justify-center rounded-full bg-green-500 p-4">
            <CheckCircle2 className="mx-auto h-16 w-16 text-white" />
          </span>
        </div>
        <Section.Heading
          title="Request Accepted!"
          subtitle="Your driver is preparing to help you"
          className="mb-0"
        />
        <Card className="rounded-2xl border-input bg-white">
          <CardContent className="p-6">
            <div className="flex items-start gap-3 border-b border-input pb-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src="" alt={driver?.name ?? ''} />
                <AvatarFallback className="rounded-lg bg-primary font-montserrat text-2xl font-semibold text-secondary">
                  {getInitials(driver?.name ?? 'DR')}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-2xl font-semibold">{driver?.name ?? 'Loading...'}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm text-muted-foreground">Available now</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="size-4" /> <span>{driver?.address ?? '-'}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-5">
              <Card className="flex-1 rounded-xl border border-border50 bg-input/20">
                <CardContent className="flex flex-col items-center justify-center space-y-2 p-6">
                  <Clock3 className="size-9 text-secondary" />
                  <p className="text-sm text-muted-foreground">Estimated Arrival</p>
                  <p className="text-3xl font-bold">{ride?.eta_minutes ? `${ride.eta_minutes} min` : '-'}</p>
                </CardContent>
              </Card>
              <Card className="flex-1 rounded-xl border border-border50 bg-input/20">
                <CardContent className="flex flex-col items-center justify-center space-y-2 p-6">
                  <DollarSign className="size-9 text-secondary" />
                  <p className="text-sm text-muted-foreground">Pricing</p>
                  <p className="text-3xl font-bold">Negotiable</p>
                </CardContent>
              </Card>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <h4 className="text-lg font-semibold">Service Details</h4>
              <div className="flex items-start gap-2">
                <MapPin className="mt-1 size-5" />
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-muted">Pickup:</span>
                  <span>{ride?.pickup_location ?? '-'}</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="mt-1 size-5 text-primary" />
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-muted">Drop-off:</span>
                  <span>{ride?.dropoff_location ?? '-'}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-2">
              <a href={`tel:${driver?.phone ?? ''}`} className="flex-1">
                <Button variant="outline" size="lg" className="w-full cursor-pointer rounded-full">
                  <Phone className="size-4" />
                  Call Driver
                </Button>
              </a>
              <Link to={conversationId ? `/messages/${conversationId}` : '#'} className="flex-1">
                <Button variant="outline" size="lg" className="w-full cursor-pointer rounded-full">
                  <MessageCircle className="size-4 -rotate-90" />
                  Send Message
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-primary/12 p-4 text-left text-sm text-muted-foreground">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-secondary">
              Important Reminders
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {[
              'Confirm the final price with your driver before service begins.',
              'Be ready at your pickup location when the driver arrives.',
              'Keep valuables with you during the tow.',
            ].map((item) => (
              <p key={item} className="flex items-start gap-2">
                <span className="mt-2 inline-block h-1.5 w-1.5 rounded-full bg-muted"></span> {item}
              </p>
            ))}
          </CardContent>
        </Card>

        <Link to={ride ? `/tracking-service?rideId=${ride.id}` : '/tracking-service'}>
          <Button size="lg" className="w-full cursor-pointer rounded-xl">
            Track Service
          </Button>
        </Link>
      </Section>
    </>
  );
}
