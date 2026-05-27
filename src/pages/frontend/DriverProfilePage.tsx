import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Search, ShieldCheck, TrendingUp, Truck, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

import { PageMeta } from '@/components/seo/PageMeta';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { fetchDriver } from '@/features/townow-flow/data';
import type { Driver } from '@/features/townow-flow/types';
import Section from '@/components/section';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/useInitials';
import StarRating from '@/components/star-rating';
import Loading from '@/components/loading';

// ─── Empty state ──────────────────────────────────────────────────────────────

function DriverNotFound() {
  const navigate = useNavigate();

  return (
    <>
      <PageMeta
        title="Driver not found"
        description="The driver you are looking for does not exist."
        keywords={['driver not found', 'tow driver']}
      />

      <Section applyContainer containerClassName="flex min-h-[60vh] items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="flex max-w-md flex-col items-center text-center"
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4, ease: 'easeOut' }}
            className="mb-6 flex size-24 items-center justify-center rounded-3xl bg-input"
          >
            <div className="relative">
              <Truck className="size-10 text-muted-foreground/60" />
              <div className="absolute -right-2 -bottom-1 flex size-5 items-center justify-center rounded-full bg-destructive/90">
                <Search className="size-3 text-white" />
              </div>
            </div>
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="space-y-2"
          >
            <h2 className="font-montserrat text-2xl font-bold text-foreground">Driver Not Found</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We couldn't find the driver you're looking for. They may have been removed or the link
              might be incorrect.
            </p>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <Button variant="outline" className="cursor-pointer" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
            <Button asChild className="cursor-pointer">
              <Link to="/find-drivers">Browse All Drivers</Link>
            </Button>
          </motion.div>
        </motion.div>
      </Section>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DriverProfilePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const getInitials = useInitials();

  useEffect(() => {
    const loadDriver = async () => {
      // No id in URL → nothing to load, show not-found immediately
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        const driverData = await fetchDriver(Number(id));
        setDriver(driverData ?? null);
      } catch (error) {
        console.error('Failed to load driver:', error);
        setDriver(null);
      } finally {
        setLoading(false);
      }
    };

    void loadDriver();
  }, [id]);

  if (loading) {
    return <Loading message="Loading driver profile..." />;
  }

  if (!driver) {
    return <DriverNotFound />;
  }

  const reviews = driver.review_list ?? [];
  const totalRides = driver.totalRides ?? 0;
  const completedRides = driver.completedRides ?? 0;
  const canceledRides = driver.canceledRides ?? 0;

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
          <CardContent className="p-2 sm:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-24 w-24 rounded-xl bg-secondary/20 sm:h-32 sm:w-32">
                  <AvatarImage src={driver.avatar_url} alt={driver.name} />
                  <AvatarFallback className="rounded-lg bg-primary font-montserrat text-lg font-semibold text-white">
                    {driver.initials || getInitials(driver.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-xl font-bold sm:text-3xl">{driver.name}</h1>
                  <div className="mt-1 items-center gap-1 text-sm text-muted-foreground sm:flex">
                    <StarRating rating={driver.rating} />
                    <p>
                      {driver.rating} ({driver.reviews} Reviews)
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{driver.experience}</p>
                  <div className="mt-4 flex gap-2">
                    <Link
                      to={`/request-service/${driver.id}`}
                      aria-label={`Request service from ${driver.name}`}
                    >
                      <Button className="w-full cursor-pointer rounded-xl px-1.5 py-2 text-xs sm:px-4 sm:py-3 sm:text-base">
                        REQUEST THIS DRIVER
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 md:gap-4">
          <Card className="col-span-2 rounded-2xl border-border bg-secondary/5">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2">
                <Truck className="size-7" />
                Vehicle Specifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-4 sm:p-6">
              <div className="grid gap-2 text-sm md:grid-cols-3">
                <div className="space-y-1">
                  <p className="font-semibold text-secondary">Truck Type</p>
                  <p className="font-normal">{driver.vehicle}</p>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-secondary">Capacity</p>
                  <p className="font-normal">{driver.maxCapacity}</p>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-secondary">Insurance</p>
                  <p className="font-normal">
                    {Number(driver.insurance) === 1 ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>
              <div className="mt-3 aspect-16/5 overflow-hidden rounded-xl bg-muted/40">
                <img src={driver.truck_image_url} alt="Truck" className="h-full w-full object-cover" />
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4 rounded-2xl border-border bg-input p-2 md:mt-0">
            <CardHeader className="p-2 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-xl font-semibold">
                <ShieldCheck className="size-7" /> Rides Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-2 sm:p-6">
              <div className="flex items-center justify-between rounded-2xl border border-border bg-white p-4 shadow-md">
                <div className="flex-1">
                  <p className="font-medium text-secondary">Total Rides:</p>
                  <p className="font-semibold">{totalRides}</p>
                </div>
                <div className="rounded-md bg-input p-2">
                  <TrendingUp className="size-6" />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-border bg-white p-4 shadow-md">
                <div className="flex-1">
                  <p className="font-medium text-secondary">Completed Rides:</p>
                  <p className="font-semibold">{completedRides}</p>
                </div>
                <div className="rounded-md bg-primary/60 p-2">
                  <CheckCircle className="size-6" />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-border bg-white p-4 shadow-md">
                <div className="flex-1">
                  <p className="font-medium text-secondary">Canceled Rides:</p>
                  <p className="font-semibold">{canceledRides}</p>
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

        {reviews.length > 0 ? (
          reviews.map((review) => {
            const reviewerName = review.user?.name ?? 'Verified Customer';
            const reviewerInitials =
              reviewerName
                .split(' ')
                .slice(0, 2)
                .map((w) => w[0]?.toUpperCase() ?? '')
                .join('') || 'CU';

            return (
              <Card
                key={review.id}
                className="rounded-2xl border-secondary/20 bg-white shadow-none"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={review.user?.avatar_url} alt={reviewerName} />
                        <AvatarFallback className="rounded-lg bg-secondary font-montserrat text-lg font-semibold text-white">
                          {reviewerInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <h4 className="text-lg font-semibold">{reviewerName}</h4>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-center gap-1">
                      <StarRating rating={driver.rating} />
                      <p className="text-xs text-muted-foreground">{review.created_at}</p>
                    </div>
                  </div>

                  <div className="mt-3.5">
                    <p className="text-sm text-muted-foreground italic">"{review.body}"</p>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="rounded-2xl border-secondary/20 bg-white shadow-none">
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-full bg-muted p-4">
                  <StarRating rating={0} />
                </div>
                <h3 className="text-lg font-semibold text-muted-foreground">No Reviews Yet</h3>
                <p className="max-w-md text-sm text-muted-foreground">
                  Be the first to share your experience with {driver.name}. Your feedback helps
                  others make informed decisions.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {reviews.length > 0 && (
          <div className="text-center">
            <Button variant="outline" className="cursor-pointer">
              LOAD MORE REVIEWS
            </Button>
          </div>
        )}
      </Section>
    </>
  );
}
