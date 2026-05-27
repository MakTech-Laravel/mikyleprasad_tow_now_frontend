import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Star } from 'lucide-react';

import { PageMeta } from '@/components/seo/PageMeta';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import Section from '@/components/section';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/useInitials';
import { request } from '@/api/request';
// import { fetchDriver } from '@/features/townow-flow/data';
import type { Driver } from '@/features/townow-flow/types';

const formSchema = z.object({
  rating: z.number().min(1, 'Please select a rating'),
  review: z
    .string()
    .min(10, 'Review must be at least 10 characters')
    .max(500, 'Review must be less than 500 characters')
    .optional()
    .or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

export default function RateExperiencePage() {
  const { rideId } = useParams<{ rideId: string }>();
  const navigate = useNavigate();
  const getInitials = useInitials();

  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredStar, setHoveredStar] = useState(0);

  useEffect(() => {
    const loadDriver = async () => {
      try {
        const res = await request.get(`/user/rides/${rideId}`);
        const ride = res.data.data || res.data;

        setDriver(ride.driver);
      } catch (error) {
        console.error('Failed to load ride:', error);
      } finally {
        setLoading(false);
      }
    };

    if (rideId) loadDriver();
  }, [rideId]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rating: 0,
      review: '',
    },
  });

  const selectedRating = watch('rating');
  const reviewText = watch('review') ?? '';

  const onSubmit = async (data: FormValues) => {
    try {
      await request.post(`/user/reviews/${rideId}`, {
        rating: data.rating,
        review: data.review ?? '',
      });

      toast.success('Review submitted successfully', {
        description: 'Thank you for your feedback!',
      });
      navigate('/review-submitted');
    } catch {
      toast.error('Failed to submit review. Please try again.');
    }
  };

  return (
    <>
      <PageMeta
        title="Rate Your Experience"
        description="Submit a review for your completed tow service."
        keywords={['review', 'rate service']}
      />

      <Section applyContainer containerClassName="space-y-6 max-w-5xl">
        <Section.Heading
          title="Rate Your Experience"
          subtitle="Help others by sharing your experience with this driver"
          align="left"
          className="mb-0"
        />

        {loading ? (
          <Card className="rounded-2xl border-secondary/20 bg-white shadow-sm">
            <CardContent className="flex items-center justify-center p-6">
              <p className="text-muted-foreground">Loading driver information...</p>
            </CardContent>
          </Card>
        ) : driver ? (
          <Card className="rounded-2xl border-secondary/20 bg-white shadow-sm">
            <CardContent className="flex items-center gap-4 p-6">
              <Avatar className="h-12 w-12">
                <AvatarImage src={driver?.avatar_url} alt={driver?.name} />
                <AvatarFallback className="rounded-lg bg-primary font-montserrat text-lg font-semibold text-white">
                  {getInitials(driver?.name || '')}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{driver?.name}</p>
                <p className="text-sm text-muted-foreground">{driver?.location}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-2xl border-secondary/20 bg-white shadow-sm">
            <CardContent className="flex items-center justify-center p-6">
              <p className="text-muted-foreground">Driver not found</p>
            </CardContent>
          </Card>
        )}

        {driver && (
          <Card className="rounded-2xl border-secondary/20 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                How would you rate this service?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)}>

                <div className="flex items-center justify-center gap-2">
                  {Array.from({ length: 5 }, (_, index) => {
                    const starValue = index + 1;
                    const isFilled = starValue <= (hoveredStar || selectedRating);

                    return (
                      <button
                        key={index}
                        type="button"
                        className="rounded-full border border-border p-2 transition-colors"
                        onClick={() => setValue('rating', starValue, { shouldValidate: true })}
                        onMouseEnter={() => setHoveredStar(starValue)}
                        onMouseLeave={() => setHoveredStar(0)}
                        aria-label={`Rate ${starValue} out of 5`}
                      >
                        <Star
                          className="h-6 w-6 transition-colors"
                          fill={isFilled ? 'currentColor' : 'none'}
                          stroke="currentColor"
                          strokeWidth={isFilled ? 0 : 1.5}
                          style={{ color: isFilled ? '#f59e0b' : undefined }}
                        />
                      </button>
                    );
                  })}
                </div>

                <InputError message={errors.rating?.message} />

                <p className="mt-5 text-sm font-medium">Share your experience (Optional)</p>
                <Textarea
                  className="mt-2 min-h-24"
                  placeholder="Tell us about your experience with this driver..."
                  {...register('review')}
                />
                <InputError message={errors.review?.message} />

                <p className="mt-1 text-xs text-muted-foreground">
                  {reviewText.length} / 500 characters
                </p>

                <div className="mt-4 rounded-xl bg-primary/15 p-3 text-center text-sm text-muted-foreground">
                  Your review will be publicly visible and will help other users make informed
                  decisions.
                </div>

                <div className="mt-4 grid gap-2 md:grid-cols-2">
                  <Button variant="outline" type="button" onClick={() => navigate(-1)}>
                    Skip for Now
                  </Button>

                  <Button type="submit">Submit Review</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </Section>
    </>
  );
}
