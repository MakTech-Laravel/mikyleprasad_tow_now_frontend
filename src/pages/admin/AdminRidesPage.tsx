import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { PageMeta } from '@/components/seo/PageMeta';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { fetchAdminRides } from '@/api/adminPortal';
import { portalQueryKeys } from '@/api/portalQueryKeys';
import { rideUiStatus, rideUiStatusLabel, type RidePayload, type RideUiStatus } from '@/api/rides';

interface Ride {
  id: number;
  driver: string;
  vehicle: string;
  vehicleColor: string;
  route: string;
  time: string;
  uiStatus: RideUiStatus;
  payload: RidePayload;
  avatar_url: string;
}

const statusStyles: Record<RideUiStatus, string> = {
  pending: 'bg-amber-100 text-amber-700 border-transparent',
  active: 'bg-card text-foreground border border-border',
  arrived: 'bg-amber-100 text-amber-800 border-transparent',
  picked_up: 'bg-sky-100 text-sky-800 border-transparent',
  awaiting_confirmation: 'bg-violet-100 text-violet-800 border-transparent',
  completed: 'bg-primary text-primary-foreground border-transparent',
  cancelled: 'bg-red-100 text-red-700 border-transparent',
  expired: 'bg-red-100 text-red-700 border-transparent',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function PaginationBar({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2 border-t border-border bg-accent/40 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground">
        Showing page {currentPage} of {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1).map((p) => (
          <Button
            key={p}
            variant={p === currentPage ? 'default' : 'ghost'}
            size="icon"
            onClick={() => onPageChange(p)}
            className={cn(
              'h-7 w-7 text-xs',
              p === currentPage && 'bg-primary text-primary-foreground hover:bg-primary/90',
            )}
          >
            {p}
          </Button>
        ))}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function AdminRidesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const ridesQuery = useQuery({
    queryKey: portalQueryKeys.adminRides({ page: currentPage }),
    queryFn: () => fetchAdminRides({ page: currentPage, per_page: 25, sort: 'latest' }),
  });
  const rows: Ride[] = (ridesQuery.data?.data ?? []).map((r) => ({
    id: r.id,
    driver: r.driver?.name ?? 'Driver',
    avatar_url: r.driver?.avatar_url ?? '',
    vehicle: 'Tow Vehicle',
    vehicleColor: 'bg-[#22C55E]',
    route: `${r.pickup_location} -> ${r.dropoff_location}`,
    time: `${r.eta_minutes ?? '--'} MIN`,
    uiStatus: rideUiStatus(r),
    payload: r,
  }));
  const totalPages = Math.max(1, ridesQuery.data?.meta?.last_page ?? 1);

  return (
    <>
      <PageMeta
        title="Admin - Rides"
        description="Monitor all rides system-wide."
        keywords={['admin', 'rides']}
      />

      <div className="space-y-6">
        <div>
          <h1 className="font-montserrat text-2xl font-bold tracking-tight">Rides</h1>
          <p className="text-sm text-muted-foreground">All non-system-cancelled rides are shown here.</p>
        </div>

        <Card className="overflow-hidden border-none shadow-none">
          <CardContent className="p-0">
            <div className="overflow-x-auto bg-accent/40">
              <Table className="border-separate border-spacing-y-3">
                <TableHeader>
                  <TableRow className="border-border bg-accent/60 hover:bg-accent/60">
                    <TableHead className="text-xs font-semibold tracking-wider uppercase">
                      Driver Detail
                    </TableHead>
                    <TableHead className="text-xs font-semibold tracking-wider uppercase">
                      Route
                    </TableHead>
                    <TableHead className="text-xs font-semibold tracking-wider uppercase">
                      Time
                    </TableHead>
                    <TableHead className="text-xs font-semibold tracking-wider uppercase">
                      Status
                    </TableHead>
                    <TableHead className="text-xs font-semibold tracking-wider uppercase">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ridesQuery.isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                        Loading rides...
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {rows.map((r) => (
                    <TableRow key={r.id} className="rounded-full border-border bg-muted/20 hover:bg-accent/20">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 rounded-full">
                            <AvatarImage src={r.avatar_url || undefined} alt={r.driver} />
                            <AvatarFallback className="bg-secondary/80 text-xs font-semibold text-secondary-foreground">
                              {getInitials(r.driver)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-semibold">{r.driver}</p>
                            <div className="flex items-center gap-1.5">
                              <span className={cn('h-2 w-2 rounded-full', r.vehicleColor)} />
                              <span className="text-xs text-muted-foreground">{r.vehicle}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[320px] truncate text-sm font-medium">{r.route}</TableCell>
                      <TableCell className="text-sm font-semibold tabular-nums">{r.time}</TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            'rounded-full px-3 py-0.5 text-xs font-medium',
                            statusStyles[r.uiStatus],
                          )}
                        >
                          {rideUiStatusLabel(r.uiStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Link
                            to={`/admin/rides/detail/${r.id}`}
                            className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg"
                            aria-label="View"
                          >
                            <Eye className="size-4 text-muted-foreground" />
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!ridesQuery.isLoading && rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                        No rides found.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
            <PaginationBar currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
