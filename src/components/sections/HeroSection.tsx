import { useState } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Phone, DollarSign, Radio, Circle } from 'lucide-react';
import { SvgIcon } from '@/components/svg-icon';
import Map from '@/assets/map.svg';
import Section from '@/components/section';
import { useNavigate } from 'react-router-dom';
import { buildDriverStatsCacheKey, fetchDriverStats } from '@/api/drivers';
import { useNetworkCachedQuery } from '@/hooks/useNetworkCachedQuery';

export default function HeroSection() {
  const navigate = useNavigate();
  const [areaQuery, setAreaQuery] = useState('');

  const statsQuery = useNetworkCachedQuery({
    queryKey: ['driver-stats-home'],
    networkCacheKey: buildDriverStatsCacheKey(),
    queryFn: () => fetchDriverStats(),
    staleTime: 30_000,
  });

  const onlineDrivers = statsQuery.data?.online ?? 0;
  const usingCachedStats = statsQuery.isOfflineFallback;

  const handleSearch = () => {
    const q = areaQuery.trim();
    if (q) navigate(`/find-drivers?search=${encodeURIComponent(q)}`);
    else navigate('/find-drivers');
  };

  return (
    <Section paddingY="lg" applyContainer>
      <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-12">
        {/* ── Left col ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="flex flex-col gap-5 md:gap-6"
        >
          <h1 className="font-montserrat text-3xl leading-tight font-bold text-foreground sm:text-4xl md:text-5xl">
            Find a Tow Truck
            <br />
            Near You
          </h1>

          <p className="max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
            Connect with reliable tow truck drivers across Trinidad. Fast, simple, and trustworthy
            service when you need it most.
          </p>

          {/* Search bar
           * On mobile: full-width stacked — input on top, button below.
           * On sm+:    single row with icon button showing full label.
           */}
          <div className="flex w-full max-w-md flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <MapPin className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Enter your area..."
                className="h-10 pl-9 text-sm"
                value={areaQuery}
                onChange={(e) => setAreaQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
              />
            </div>
            <Button className="h-10 shrink-0 cursor-pointer rounded-xl" onClick={handleSearch}>
              <Search className="h-4 w-4" />
              {/* Show label on sm+, icon-only on tiny screens saves space */}
              <span className="sm:inline">Find Drivers</span>
            </Button>
          </div>

          {/* Feature badges */}
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground sm:gap-4 sm:text-sm">
            <span className="flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5 shrink-0 text-primary" />
              Live progress tracking
            </span>
            <span className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 shrink-0 text-primary" />
              Direct driver contact
            </span>
            <span className="flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 shrink-0 text-primary" />
              Negotiable pricing
            </span>
            {usingCachedStats && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-900">
                Showing cached data
              </span>
            )}
          </div>
        </motion.div>

        {/* ── Right col — map card ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex items-center justify-center"
        >
          <Card className="w-full max-w-sm overflow-hidden border border-border shadow-sm">
            <CardContent className="relative p-0">
              <div className="relative flex h-64 items-center justify-center overflow-hidden bg-background">
                <SvgIcon src={Map} size={600} ariaLabel="Map" />

                {/* Active drivers badge */}
                <div className="absolute top-1/2 left-1/2 z-10 flex h-fit w-fit -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-1 rounded-full bg-background px-5 py-2 text-center shadow-lg sm:px-6">
                  <span className="font-montserrat text-lg leading-none font-bold text-foreground sm:text-xl">
                    {onlineDrivers}
                  </span>
                  <p className="flex items-center gap-1 text-[10px] leading-tight text-muted-foreground">
                    <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                    Drivers Active
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Section>
  );
}
