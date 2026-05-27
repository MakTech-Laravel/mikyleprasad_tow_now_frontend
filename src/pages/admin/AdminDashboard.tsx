import { Link } from 'react-router-dom';
import { Activity, CheckCircle, Clock, Wifi } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { PageMeta } from '@/components/seo/PageMeta';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import Section from '@/components/section';
import { Badge } from '@/components/ui/badge';
import { fetchAdminDashboard } from '@/api/adminPortal';
import { portalQueryKeys } from '@/api/portalQueryKeys';
import { rideUiStatus, rideUiStatusLabel, type RideUiStatus } from '@/api/rides';
import { useAuth } from '@/auth/useAuth';

// ── Types ────────────────────────────────────────────────────────────────────

interface KpiItem {
  label: string;
  value: string;
  trend: string;
  up: boolean;
  icon: React.ElementType;
  to: string;
}

interface LatestRide {
  id: string;
  customer: string;
  initials: string;
  driver: string;
  from: string;
  to: string;
  uiStatus: RideUiStatus;
}

// ── Mock data ────────────────────────────────────────────────────────────────

const statusStyles: Record<RideUiStatus, string> = {
  pending: 'bg-primary/10 text-primary',
  active: 'bg-secondary/10 text-secondary',
  arrived: 'bg-amber-100 text-amber-800',
  picked_up: 'bg-sky-100 text-sky-800',
  awaiting_confirmation: 'bg-violet-100 text-violet-800',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  expired: 'bg-red-100 text-red-700',
};

// ── Component ────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { sessionStatus, user } = useAuth();

  const dashboardQuery = useQuery({
    queryKey: portalQueryKeys.adminDashboard,
    queryFn: fetchAdminDashboard,
    enabled: sessionStatus === 'authenticated' && Boolean(user),
  });
  const summary = dashboardQuery.data?.summary;
  const kpis: KpiItem[] = [
    {
      label: 'Total Rides',
      value: String(summary?.total ?? 0),
      trend: '--',
      up: true,
      icon: Activity,
      to: '/admin/rides',
    },
    {
      label: 'Pending Rides',
      value: String(summary?.pending ?? 0),
      trend: '--',
      up: true,
      icon: Clock,
      to: '/admin/rides',
    },
    {
      label: 'Active Rides',
      value: String(summary?.active ?? 0),
      trend: '--',
      up: true,
      icon: Wifi,
      to: '/admin/rides',
    },
    {
      label: 'Completed Rides',
      value: String(summary?.completed ?? 0),
      trend: '--',
      up: true,
      icon: CheckCircle,
      to: '/admin/rides',
    },
  ];
  const rides: LatestRide[] = (dashboardQuery.data?.recent_rides ?? []).map((ride) => ({
    id: `#${ride.id}`,
    customer: ride.user?.name ?? 'Customer',
    initials: (ride.user?.name ?? 'CU').slice(0, 2).toUpperCase(),
    driver: ride.driver?.name ?? 'Driver',
    from: ride.pickup_location,
    to: ride.dropoff_location,
    uiStatus: rideUiStatus(ride),
  }));

  return (
    <>
      <PageMeta
        title="Admin — Dashboard"
        description="TowTruckTT administrator dashboard."
        keywords={['admin', 'dashboard']}
      />

      <Section className="space-y-6 p-0">
        <Section.Heading
          title="Dashboard Overview"
          subtitle="Real-time logistics monitoring & fleet health."
          align="left"
          className="mb-0"
        />

        {/* KPI cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => {
            const Icon = k.icon;
            return (
              <Card key={k.label} className="border-border">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <span className="inline-flex items-center justify-center rounded-lg bg-green-50 p-2">
                      <Icon className="size-5" />
                    </span>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-semibold',
                        k.up ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600',
                      )}
                    >
                      {k.trend}
                    </span>
                  </div>
                  <p className="mt-3 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                    {k.label}
                  </p>
                  <p className="font-montserrat text-3xl font-bold tabular-nums">{k.value}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Latest Rides */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="font-montserrat text-base font-semibold">Latest Rides</h2>
            <Button
              asChild
              variant="link"
              size="sm"
              className="gap-1 p-0 font-medium text-foreground"
            >
              <Link to="/admin/rides">View All →</Link>
            </Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-accent/60 hover:bg-accent/60">
                  <TableHead className="text-xs font-semibold tracking-wider uppercase">
                    Ride ID
                  </TableHead>
                  <TableHead className="text-xs font-semibold tracking-wider uppercase">
                    Customer
                  </TableHead>
                  <TableHead className="text-xs font-semibold tracking-wider uppercase">
                    Driver
                  </TableHead>
                  <TableHead className="text-xs font-semibold tracking-wider uppercase">
                    Route
                  </TableHead>
                  <TableHead
                    className="text-right text-xs font-semibold tracking-wider uppercase"
                    align="right"
                  >
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rides.map((r) => (
                  <TableRow key={r.id} className="border-border">
                    <TableCell className="font-mono text-sm font-semibold">{r.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-secondary text-xs font-semibold text-secondary-foreground">
                            {r.initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{r.customer}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{r.driver}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <span>{r.from}</span>
                      <span className="mx-1 text-foreground">→</span>
                      <span>{r.to}</span>
                    </TableCell>
                    <TableCell align="right">
                      {/* <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                          statusStyles[r.status],
                        )}
                      > */}
                      <Badge
                        variant="outline"
                        className={cn('text-xs font-medium', statusStyles[r.uiStatus])}
                      >
                        {rideUiStatusLabel(r.uiStatus)}
                      </Badge>
                      {/* </span> */}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </Section>
    </>
  );
}
