import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, ShieldCheck, TrendingUp, Truck, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { PageMeta } from '@/components/seo/PageMeta';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { fetchDriver, fetchDrivers } from '@/features/townow-flow/data';
import type { Driver } from '@/features/townow-flow/types';
import Section from '@/components/section';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/useInitials';
import StarRating from '@/components/star-rating';
import TruckImage from '@/assets/truck.png';

export default function DriverProfilePage() {
  const navigate = useNavigate();
  const { driverId } = useParams<{ driverId: string }>();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const getInitials = useInitials();

  console.log(driverId, "hi");

  useEffect(() => {
    const loadDriver = async () => {
      try {
        if (driverId) {
          const driverData = await fetchDriver(Number(driverId));
          if (driverData) {
            setDriver(driverData);
          } else {
            const drivers = await fetchDrivers();
            setDriver(drivers[0] || null);
          }
        } else {
          const drivers = await fetchDrivers();
          setDriver(drivers[0] || null);
        }
      } catch (error) {
        console.error('Failed to load driver:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDriver();
  }, [driverId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!driver) {
    return <div>Driver not found</div>;
  }
  return (
    <>
      <PageMeta
        title="Driver Profile"
        description="View tow driver details and customer feedback."
        keywords={['driver profile', 'tow driver']}
      />

      <Section applyContainer containerClassName="space-y-6">
        <Button
          onClick={() => navigate(-1)}
          variant="link"
          className="cursor-pointer hover:no-underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to drivers
        </Button>

        <Card className="rounded-2xl border-primary/60 bg-white p-2">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-32 w-32 rounded-xl bg-secondary/20">
                  <AvatarImage src={driver.avatar_url} alt={driver.name} />
                  <AvatarFallback className="rounded-lg bg-primary font-montserrat text-lg font-semibold text-white">
                    {getInitials(driver.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-3xl font-bold">{driver.name}</h1>
                  <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <StarRating rating={driver.rating} />
                    {driver.rating} ({driver.reviews} Reviews)
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{driver.experience}</p>
                  <div className="mt-4 flex gap-2">
                    <Link
                      to={`/request-service/${driver.id}`}
                      aria-label={`Request service from ${driver.name}`}
                    >
                      <Button className="w-full cursor-pointer rounded-xl">
                        REQUEST THIS DRIVER
                      </Button>
                    </Link>
                    {/* <Link to={`/messages/${driver.id}`}>
                      <Button variant="outline" className="cursor-pointer">
                        MESSAGE
                      </Button>
                    </Link> */}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="col-span-2 rounded-2xl border-border bg-secondary/5 p-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="size-7" />
                Vehicle Specifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-2 text-sm md:grid-cols-3">
                <div className="space-y-1">
                  <p className="font-semibold text-secondary">Truck Type</p>
                  <p className="font-normal">Flatbed Heavy-Duty</p>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-secondary">Capacity</p>
                  <p className="font-normal">{driver.maxCapacity}</p>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-secondary">Insurance</p>
                  <p className="font-normal">{driver.insurance}</p>
                </div>
              </div>
              <div className="mt-3 aspect-16/5 overflow-hidden rounded-xl bg-muted/40">
                <img src={TruckImage} alt="Truck" className="h-full w-full object-cover" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border bg-input p-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-semibold">
                <ShieldCheck className="size-7" /> Rides Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between rounded-2xl border border-border bg-white p-4 shadow-md">
                <div className="flex-1">
                  <p className="font-medium text-secondary">Total Rides:</p>
                  <p className="font-semibold">122</p>
                </div>
                <div className="rounded-md bg-input p-2">
                  <TrendingUp className="size-6" />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-border bg-white p-4 shadow-md">
                <div className="flex-1">
                  <p className="font-medium text-secondary">Completed Rides:</p>
                  <p className="font-semibold">120</p>
                </div>
                <div className="rounded-md bg-primary/60 p-2">
                  <CheckCircle className="size-6" />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-border bg-white p-4 shadow-md">
                <div className="flex-1">
                  <p className="font-medium text-secondary">Canceled Rides:</p>
                  <p className="font-semibold">12</p>
                </div>
                <div className="rounded-md bg-input p-2">
                  <X className="size-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Section>
      <Section applyContainer containerClassName="space-y-6">
        <Section.Heading title="CUSTOMER FEEDBACK" align="left" className="mb-0" />
        {[
          'Marcus was extremely professional and handled the heavy load with precision.',
          'Reliability is hard to come by, but Marcus delivers every time.',
          'Very knowledgeable about safety protocols and careful handling.',
        ].map((review) => (
          <Card key={review} className="rounded-2xl border-secondary/20 bg-white shadow-none">
            <CardContent className="p-6">
              {/* Top row */}
              <div className="flex items-start justify-between gap-3">
                {/* Avatar + info */}
                <div className="flex items-center justify-between gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={driver.avatar_url} alt={driver.name} />
                    <AvatarFallback className="rounded-lg bg-primary font-montserrat text-lg font-semibold text-white">
                      {getInitials(driver.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <h4 className="text-lg font-semibold">{driver.name}</h4>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-center gap-1">
                  <StarRating
                    rating={driver.rating}
                    fillColor="fill-muted"
                    textColor="text-muted"
                  />
                  <p className="text-xs text-muted-foreground">May 15, 2026</p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-3.5 flex items-center gap-2">
                <p className="text-sm text-muted-foreground italic">"{review}"</p>
              </div>
            </CardContent>
          </Card>
        ))}
        <div className="text-center">
          <Button variant="outline" className="cursor-pointer">
            LOAD MORE REVIEWS
          </Button>
        </div>
      </Section>
    </>
  );
}
