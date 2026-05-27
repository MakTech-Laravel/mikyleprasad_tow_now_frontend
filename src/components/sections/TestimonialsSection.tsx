import { useCallback, useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import StarRating from '@/components/star-rating';
import Section from '@/components/section';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { request } from '@/api/request';

type Review = {
  id: number;
  name: string;
  location: string;
  date: string;
  rating: number;
  body: string;
  initials: string;
  created_at: string;
  user?: {
    name: string;
    email: string;
    avatar_url: string;
  };
};

// ─── Config ───────────────────────────────────────────────────────────────────

/** Milliseconds between auto-slides. Change this to adjust speed. */
const AUTO_SLIDE_DELAY = 3500;

// ─── Data ─────────────────────────────────────────────────────────────────────

// const TESTIMONIALS = [
//   {
//     rating: ,
//     text: '',
//     initials: 'SJ',
//     name: 'Sarah Johnson',
//     location: 'Port of Spain',
//     date: 'March 2026',
//   },
// ];

const SCROLL_THRESHOLD = 1;

// ─── Testimonial Card ─────────────────────────────────────────────────────────

function TestimonialCard({ t }: { t: Review }) {
  return (
    <Card className="h-full rounded-2xl border-border bg-background shadow-xs">
      <CardContent className="flex h-full flex-col gap-4 p-5">
        <StarRating rating={t.rating} />
        <p className="flex-1 text-sm leading-relaxed text-foreground">{t.body}</p>
        <div className="mt-auto flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={t.user?.avatar_url || ''} />
            <AvatarFallback className="bg-muted text-xs font-semibold text-foreground">
              {t.initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-foreground">{t.user?.name || t.name}</p>
            <p className="text-xs text-muted-foreground">
               {/* {t.location} • */}
              {new Date(t.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Carousel wrapper ─────────────────────────────────────────────────────────

function TestimonialsCarousel({
  reviews,
  delay = AUTO_SLIDE_DELAY,
}: {
  reviews: Review[];
  delay?: number;
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  // const [canNext, setCanNext] = useState(true);

  // Pause auto-slide on hover or focus inside the carousel
  const isPaused = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Sync Embla state ───────────────────────────────────────────────────────
  const syncState = useCallback((embla: CarouselApi) => {
    if (!embla) return;
    setCurrent(embla.selectedScrollSnap());
    setCount(embla.scrollSnapList().length);
    setCanPrev(embla.canScrollPrev());
    // setCanNext(embla.canScrollNext());
  }, []);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => syncState(api);
    const onReInit = () => syncState(api);
    const raf = requestAnimationFrame(() => {
      syncState(api);
    });
    api.on('select', onSelect);
    api.on('reInit', onReInit);
    return () => {
      cancelAnimationFrame(raf);
      api.off('select', onSelect);
      api.off('reInit', onReInit);
    };
  }, [api, syncState]);

  // ── Auto-slide ─────────────────────────────────────────────────────────────
  const scheduleNext = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (!api || isPaused.current) return;
      // Loop: if at last snap, go back to first
      if (api.canScrollNext()) {
        api.scrollNext();
      } else {
        api.scrollTo(0);
      }
    }, delay);
  }, [api, delay]);

  // Start auto-slide once api is ready; restart after each slide change
  useEffect(() => {
    if (!api) return;
    scheduleNext();
    api.on('select', scheduleNext);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      api.off('select', scheduleNext);
    };
  }, [api, scheduleNext]);

  // Pause / resume helpers
  const pause = () => {
    isPaused.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
  };
  const resume = () => {
    isPaused.current = false;
    scheduleNext();
  };

  // Manual nav — pause briefly so user can read, then resume
  const manualNav = (fn: () => void) => {
    pause();
    fn();
    // Resume after 2× delay so the user has time to read
    setTimeout(resume, delay * 2);
  };

  return (
    <div
      className="relative px-8 md:px-10"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
    >
      {/* ── Floating left arrow ──────────────────────────────────────────── */}
      <Button
        variant="outline"
        size="icon"
        aria-label="Previous testimonial"
        onClick={() => manualNav(() => api?.scrollPrev())}
        className={cn(
          'absolute top-1/2 left-0 z-10 h-8 w-8 -translate-y-1/2 rounded-full shadow-md transition-all duration-200',
          !canPrev && 'pointer-events-none scale-90 opacity-30',
        )}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* ── Carousel ─────────────────────────────────────────────────────── */}
      <Carousel
        setApi={setApi}
        opts={{
          align: 'start',
          loop: false, // We handle loop manually so dots stay accurate
          dragFree: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4 px-1 py-2">
          {reviews.map((t, i) => (
            <CarouselItem key={i} className="basis-[85%] pl-4 sm:basis-1/2 lg:basis-1/4">
              <TestimonialCard t={t} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* ── Floating right arrow ─────────────────────────────────────────── */}
      <Button
        variant="outline"
        size="icon"
        aria-label="Next testimonial"
        onClick={() =>
          manualNav(() => (api?.canScrollNext() ? api.scrollNext() : api?.scrollTo(0)))
        }
        className="absolute top-1/2 right-0 z-10 h-8 w-8 -translate-y-1/2 rounded-full shadow-md transition-all duration-200"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* ── Progress bar + dots ───────────────────────────────────────────── */}
      <div className="mt-6 flex flex-col items-center gap-3">
        {/* Dot paginator */}
        <div className="flex items-center gap-2">
          {Array.from({ length: count }).map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => manualNav(() => api?.scrollTo(i))}
              className={cn(
                'h-1.5 cursor-pointer rounded-full transition-all duration-300',
                i === current ? 'w-6 bg-primary' : 'w-1.5 bg-border hover:bg-muted-foreground',
              )}
            />
          ))}
        </div>

        {/* Auto-slide progress bar */}
        {/* <ProgressBar
          key={current} // reset animation on every slide change
          duration={delay}
          paused={isPaused}
        /> */}
      </div>
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
// A thin animated bar that fills over `duration` ms, resets on each slide.

// function ProgressBar({ duration, paused }: { duration: number; paused: React.RefObject<boolean> }) {
//   const barRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     const el = barRef.current;
//     if (!el) return;

//     let start: number | null = null;
//     let rafId: number;
//     let pausedAt: number | null = null;
//     let elapsed = 0;

//     const tick = (ts: number) => {
//       if (paused.current) {
//         // Freeze elapsed while paused
//         if (pausedAt === null) pausedAt = ts;
//         rafId = requestAnimationFrame(tick);
//         return;
//       }
//       if (pausedAt !== null) {
//         // Offset start by paused duration
//         start = start! + (ts - pausedAt);
//         pausedAt = null;
//       }
//       if (start === null) start = ts;
//       elapsed = ts - start;
//       const pct = Math.min((elapsed / duration) * 100, 100);
//       el.style.width = `${pct}%`;
//       if (pct < 100) rafId = requestAnimationFrame(tick);
//     };

//     rafId = requestAnimationFrame(tick);
//     return () => cancelAnimationFrame(rafId);
//   }, [duration, paused]);

//   return (
//     <div className="h-0.5 w-32 overflow-hidden rounded-full bg-border">
//       <div
//         ref={barRef}
//         className="h-full w-0 rounded-full bg-primary/60"
//         style={{ willChange: 'width' }}
//       />
//     </div>
//   );
// }

// ─── Section ──────────────────────────────────────────────────────────────────

export default function TestimonialsSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const isCarousel = reviews.length > SCROLL_THRESHOLD;

  const fetchReviews = async () => {
    try {
      setLoading(true);

      const res = await request.get('/reviews');

      console.log(res.data);

      setReviews(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Section variant="alternate">
        <div className="container py-10 text-center">Loading...</div>
      </Section>
    );
  }

  if (!reviews.length) {
    return null;
  }

  return (
    <Section variant="alternate">
      <div className="container">
        <Section.Heading title="What Our Users Say" subtitle="Real experiences from real people" />

        {isCarousel ? (
          <TestimonialsCarousel reviews={reviews} delay={AUTO_SLIDE_DELAY} />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {reviews.map((t) => (
              <TestimonialCard key={t.id} t={t} />
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}
