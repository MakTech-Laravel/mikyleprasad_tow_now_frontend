import { Link } from 'react-router-dom';
import { CheckCircle2, Clock3, DollarSign, Home, MapPin, Star } from 'lucide-react';

import { PageMeta } from '@/components/seo/PageMeta';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Section from '@/components/section';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/useInitials';
import { useRideFromUrl } from '@/features/rides/useRideFromUrl';

export default function ServiceCompletedPage() {
  const { ride } = useRideFromUrl();
  const driver = ride?.driver;
  const getInitials = useInitials();
  return (
    <>
      <PageMeta
        title="Service Completed"
        description="Your tow service has been completed."
        keywords={['service completed']}
      />

      {/* <section className="container mx-auto max-w-3xl space-y-6 py-8 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
        <h1 className="text-5xl font-bold">Service Completed!</h1>
        <p className="text-muted-foreground">Your vehicle has been safely delivered</p>

        <Card className="rounded-2xl border-border p-4 text-left">
          <h2 className="mb-3 text-xl font-semibold">Service Summary</h2>
          <p className="font-semibold">{driver.name}</p>
          <p className="text-sm text-muted-foreground">{driver.location}</p>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <div className="rounded-xl bg-primary/12 p-3 text-center">
              <p className="text-sm text-muted-foreground">Total Time</p>
              <p className="text-3xl font-bold">45 min</p>
            </div>
            <div className="rounded-xl bg-primary/12 p-3 text-center">
              <p className="text-sm text-muted-foreground">Final Cost</p>
              <p className="text-3xl font-bold">Negotiated</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-border bg-primary/12 p-5">
          <Star className="mx-auto h-6 w-6 text-primary" />
          <p className="mt-2 text-3xl font-bold">How was your experience?</p>
          <p className="text-sm text-muted-foreground">
            Your feedback helps other users make better decisions
          </p>
          <Button asChild className="mt-3">
            <Link to="/rate-experience">Leave a Review</Link>
          </Button>
        </Card>

        <div className="grid gap-2 md:grid-cols-2">
          <Button asChild variant="outline">
            <Link to="/">Back to Home</Link>
          </Button>
          <Button asChild>
            <Link to="/request-service">Book Another Service</Link>
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Thank you for using TowTruckTT! We hope to serve you again soon.
        </p>
      </section> */}

      <Section applyContainer containerClassName="space-y-6 max-w-3xl">
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
              <div className="flex flex-1 items-start gap-2">
                <MapPin className="mt-1 size-6 text-muted-foreground" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-muted-foreground">From:</p>
                  <p className="text-sm font-semibold">{ride?.pickup_location ?? '-'}</p>
                </div>
              </div>
              <div className="flex flex-1 items-start gap-2">
                <MapPin className="mt-1 size-6 text-primary" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-muted-foreground">To:</p>
                  <p className="text-sm font-semibold">{ride?.dropoff_location ?? '-'}</p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-5">
              <Card className="border-border50 flex-1 rounded-xl border bg-input/20">
                <CardContent className="flex flex-col items-center justify-center space-y-2 p-6">
                  <Clock3 className="size-9 text-secondary" />
                  <p className="text-sm text-muted-foreground">Total Time</p>
                  <p className="text-3xl font-bold">
                    {ride?.total_ride_minutes ? `${ride.total_ride_minutes} min` : '-'}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border50 flex-1 rounded-xl border bg-input/20">
                <CardContent className="flex flex-col items-center justify-center space-y-2 p-6">
                  <DollarSign className="size-9 text-secondary" />
                  <p className="text-sm text-muted-foreground">Final Cost</p>
                  <p className="text-3xl font-bold">Negotiated</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-input bg-input/20 text-left text-sm text-muted-foreground">
          <CardContent className="flex flex-col items-center justify-center space-y-2 p-6">
            <Star className="size-10 text-primary" />
            <h4 className="mt-4 text-2xl font-semibold text-secondary">How was your experience?</h4>
            <p className="mb-4 text-sm text-muted-foreground">
              Your feedback helps other users make better decisions
            </p>
            <Link to="/rate-experience">
              <Button className="cursor-pointer">
                <Star className="size-4" /> Leave a Review
              </Button>
            </Link>
          </CardContent>
        </Card>

        <div className="mt-3 flex w-full items-center justify-center gap-2">
          <Link to="/">
            <Button variant="outline" className="cursor-pointer">
              <Home className="size-4" /> Back to Home
            </Button>
          </Link>
          <Link to={`/request-service/${driver?.id}`}>
            <Button className="cursor-pointer">Book Another Service</Button>
          </Link>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Thank you for using TowTruckTT! We hope to serve you again soon.
        </p>
      </Section>
    </>
  );
}
