import { Ban, Check, Eye, MapPin, RotateCcw, Star, StarOff, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

import { getInitialsFromName } from '@/hooks/useInitials';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
// import StarRating from '@/components/star-rating';

// ── Types ─────────────────────────────────────────────────────────────────────

type DriverVariant = 'pending' | 'active' | 'featured' | 'suspended' | 'rejected';

interface BaseDriver {
  id: string;
  name: string;
  driverId: string;
  email: string;
  phone: string;
  location: string;
  address: string;
  approval_status: string;
  rating: number;
  avatar_url: string;
  is_suspended?: boolean;
  is_featured?: boolean; 
}

interface PendingDriver extends BaseDriver {
  variant: 'pending';
}

interface FullDriver extends BaseDriver {
  variant: 'active' | 'featured' | 'suspended' | 'featured_drivers';
  approval_status: 'ACTIVE' | 'FEATURED' | 'SUSPENDED';
  rating: number;
  completedRides: number;
  cancelledRides: number;
  totalRating: number;
  avatar_url: string;
  ride_statistics: {
    total_rides: number;
    completed_rides: number;
    cancelled_rides: number;
    active_rides: number;
  };
  vehicle?: {
    name?: string;
    model?: string;
    license_plate?: string;
    brand?: string;
  };
}

type Driver = PendingDriver | FullDriver;

// ── Helpers ───────────────────────────────────────────────────────────────────

function isPending(driver: Driver): driver is PendingDriver {
  return driver.variant === 'pending';
}

// ── Column config ─────────────────────────────────────────────────────────────

interface ColumnConfig {
  showStats: boolean;
  showRating: boolean;
  showRestore: boolean;
  showApproveReject: boolean;
  actionLabel: string;
  paginationLabel: string;
  showApproveOnly: boolean;
  showSuspend: boolean;
  showFeatured: boolean;
  showUnfeature: boolean;
}

const VARIANT_CONFIG: Record<DriverVariant, ColumnConfig> = {
  pending: {
    showStats: false,
    showRating: false,
    showRestore: false,
    showApproveReject: true,
    showApproveOnly: false,
    showSuspend: false,
    showFeatured: false,
    showUnfeature: false,
    actionLabel: 'Verification Actions',
    paginationLabel: 'Pending Applications',
  },
  active: {
    showStats: true,
    showRating: true,
    showRestore: false,
    showApproveReject: false,
    showApproveOnly: false,
    showSuspend: true,
    showFeatured: true,
    showUnfeature: false,
    actionLabel: 'Action',
    paginationLabel: 'Active Drivers',
  },
  featured: {
    showStats: true,
    showRating: true,
    showRestore: false,
    showApproveReject: false,
    showApproveOnly: false,
    showSuspend: false,
    showFeatured: false,
    showUnfeature: true,
    actionLabel: 'Action',
    paginationLabel: 'Featured Drivers',
  },
  suspended: {
    showStats: true,
    showRating: true,
    showRestore: true,
    showApproveReject: false,
    showApproveOnly: false,
    showSuspend: false,
    showFeatured: false,
    showUnfeature: false,
    actionLabel: 'Action',
    paginationLabel: 'Suspended Drivers',
  },
  rejected: {
    showStats: false,
    showRating: false,
    showRestore: false,
    showApproveReject: false,
    showApproveOnly: true,
    showSuspend: false,
    showFeatured: false,
    showUnfeature: false,
    actionLabel: 'Action',
    paginationLabel: 'Rejected Drivers',
  },
};

// ── Driver Details Modal ──────────────────────────────────────────────────────

function DriverDetailsModal({
  driver,
  open,
  onOpenChange,
}: {
  driver: Driver | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!driver) return null;

  const isFullDriver = !isPending(driver);
  const stats = isFullDriver ? (driver as FullDriver).ride_statistics : null;
  const vehicle = isFullDriver ? (driver as FullDriver).vehicle : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Driver Details</DialogTitle>
          <p className="text-sm text-muted-foreground">ID: {driver.driverId}</p>
        </DialogHeader>

        <div className="space-y-5">
          {/* Profile */}
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14 rounded-xl">
              <AvatarImage src={driver.avatar_url || ''} alt={driver.name} />
              {/* <AvatarFallback className="rounded-xl bg-muted text-base font-semibold">
                {getInitialsFromName(driver.name)}
              </AvatarFallback> */}
            </Avatar>

            <div>
              <p className="text-base font-semibold text-foreground">{driver.name}</p>
              <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                {driver.approval_status}
              </p>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <p className="mb-2 text-xs font-semibold tracking-widest text-primary uppercase">
              Contact Information
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-3 rounded-lg bg-accent/60 px-3 py-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-background">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-muted-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Mobile Phone</p>
                  <p className="text-sm font-semibold text-foreground">{driver.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg bg-accent/60 px-3 py-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-background">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-muted-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-semibold text-foreground">{driver.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg bg-accent/60 px-3 py-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-background">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="text-sm font-semibold text-foreground">{driver.address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Info — only for full drivers */}
          {isFullDriver && vehicle && (
            <div>
              <p className="mb-2 text-xs font-semibold tracking-widest text-primary uppercase">
                License & Vehicle Info
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Car Name', value: vehicle.name },
                  { label: 'Car Model', value: vehicle.model },
                  { label: 'License Plate', value: vehicle.license_plate },
                  { label: 'Car Brand', value: vehicle.brand },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg bg-accent/60 px-3 py-2.5">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-semibold text-foreground">{item.value ?? '—'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ride Summary — only for full drivers */}
          {isFullDriver && stats && (
            <div>
              <p className="mb-2 text-sm font-semibold text-foreground">Ride Summary</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Total Rides', value: stats.total_rides ?? 0 },
                  { label: 'Completed Rides', value: stats.completed_rides ?? 0 },
                  { label: 'Cancelled Rides', value: stats.cancelled_rides ?? 0 },
                  { label: 'Active Rides', value: stats.active_rides ?? 0 },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg bg-accent/60 px-3 py-2.5">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-xl font-semibold text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Action buttons ────────────────────────────────────────────────────────────

function ActionButtons({
driver,
  config,
  onApprove,
  onReject,
  onSuspend,
  onFeatured,
  onUnfeature,
  onUnsuspend
}: {
  driver: Driver;
  config: ColumnConfig;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onSuspend?: (id: string) => void;
  onFeatured?: (id: string) => void;
  onUnfeature?: (id: string) => void;
  onUnsuspend?: (id: string) => void;
  onView: (driver: Driver) => void;
}) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-end gap-2">
      {config.showApproveReject && (
        <>
          <Button size="icon" className="size-8 cursor-pointer rounded-lg" onClick={() => onApprove?.(driver.id)}>
            <Check className="size-4" />
          </Button>
          <Button size="icon" variant="outline" className="size-8 cursor-pointer rounded-lg bg-destructive/10 text-destructive" onClick={() => onReject?.(driver.id)}>
            <X className="size-4 text-destructive" />
          </Button>
        </>
      )}

      {config.showApproveOnly && (
        <Button size="icon" className="size-8 cursor-pointer rounded-lg" onClick={() => onApprove?.(driver.id)}>
          <Check className="size-4" />
        </Button>
      )}

      {config.showRestore && (
        <Button size="icon" className="size-8 cursor-pointer rounded-lg" onClick={() => onUnsuspend?.(driver.id)}>
          <RotateCcw className="size-4" />
        </Button>
      )}
      {config.showSuspend && (
        driver.is_suspended ? (
          <Button
            size="icon"
            className="size-8 cursor-pointer rounded-lg"
            aria-label="Unsuspend"
            onClick={() => onUnsuspend?.(driver.id)}
          >
            <RotateCcw className="size-4" />
          </Button>
        ) : (
          <Button
            size="icon"
            variant="outline"
            className="size-8 cursor-pointer rounded-lg bg-destructive/10"
            aria-label="Suspend"
            onClick={() => onSuspend?.(driver.id)}
          >
            <Ban className="size-4 text-destructive" />
          </Button>
        )
      )}

      {config.showFeatured && (
        driver.is_featured ? (
          <Button
            size="icon"
            variant="outline"
            className="size-8 cursor-pointer rounded-lg text-muted-foreground"
            aria-label="Unfeature"
            onClick={() => onUnfeature?.(driver.id)}
          >
            <StarOff className="size-4" />
          </Button>
        ) : (
          <Button
            size="icon"
            variant="outline"
            className="size-8 cursor-pointer rounded-lg text-yellow-600"
            aria-label="Featured"
            onClick={() => onFeatured?.(driver.id)}
          >
            <Star className="size-4 text-yellow-600" />
          </Button>
        )
      )}

      {config.showUnfeature && (
        <Button size="icon" variant="outline" className="size-8 cursor-pointer rounded-lg text-muted-foreground" onClick={() => onUnfeature?.(driver.id)}>
          <StarOff className="size-4" />
        </Button>
      )}

      <button onClick={() => navigate(`/admin/drivers/detail/${driver.id}`)} className="flex size-8 cursor-pointer items-center justify-center rounded-lg bg-accent">
        <Eye className="size-4 text-muted-foreground" />
      </button>
    </div>
  );
}

// ── Driver row ────────────────────────────────────────────────────────────────

function DriverRow({
  driver,
  config,
  onApprove,
  onReject,
  onSuspend,
  onFeatured,
  onUnfeature,
  onUnsuspend,
  onView,
}: {
  driver: Driver;
  config: ColumnConfig;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onSuspend?: (id: string) => void;
  onFeatured?: (id: string) => void;
  onUnfeature?: (id: string) => void;
  onUnsuspend?: (id: string) => void;
  onView: (driver: Driver) => void;
}) {
  const isFullDriver = !isPending(driver);

  return (
    <TableRow className="border-border hover:bg-accent/80">
      {/* Identity */}
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            {/* <img src={driver.avatar_url || ''} alt={driver.name} className="h-10 w-10 rounded-full" /> */}
            <Avatar className="h-10 w-10">
              <AvatarImage src={driver.avatar_url || ''} alt={driver.name} />
              <AvatarFallback className="bg-muted text-xs font-semibold text-foreground">
                {getInitialsFromName(driver.name)}
              </AvatarFallback>
            </Avatar>
            {isFullDriver && (
              <span className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-1 ring-background" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold">{driver.name}</p>
            <p className="text-xs text-muted-foreground">ID: {driver.driverId}</p>
          </div>
        </div>
      </TableCell>

      {/* Contact */}
      <TableCell>
        <p className="text-sm">{driver.email}</p>
        <p className="text-xs text-muted-foreground">{driver.phone}</p>
      </TableCell>

      {/* Location */}
      <TableCell>
        <div className="flex items-center gap-1.5 text-sm">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          {driver.address}
        </div>
      </TableCell>

      {/* Stats */}
      {config.showStats && (
        <>
          <TableCell className="font-medium tabular-nums">
            {isFullDriver ? ((driver as FullDriver).ride_statistics?.completed_rides ?? 0) : '—'}
          </TableCell>
          <TableCell className="font-medium tabular-nums">
            {isFullDriver ? ((driver as FullDriver).ride_statistics?.cancelled_rides ?? 0) : '—'}
          </TableCell>
          <TableCell className="font-medium tabular-nums">
            {isFullDriver ? ((driver as FullDriver).ride_statistics?.total_rides ?? 0) : '—'}
          </TableCell>
        </>
      )}

      {/* Status */}
      <TableCell>
        <Badge
          variant="outline"
          className="border-primary/20 bg-primary/10 text-xs font-medium tracking-wide text-foreground uppercase"
        >
          {driver.approval_status}
        </Badge>
      </TableCell>

      {/* Actions */}
      <TableCell align="right">
        <ActionButtons
          driver={driver}
          config={config}
          onApprove={onApprove}
          onReject={onReject}
          onSuspend={onSuspend}
          onFeatured={onFeatured}
          onUnfeature={onUnfeature}
          onUnsuspend={onUnsuspend}
          onView={onView}
        />
      </TableCell>
    </TableRow>
  );
}

// ── Main table ────────────────────────────────────────────────────────────────

interface DriverTableProps {
  drivers: Driver[];
  variant: DriverVariant;
  onApprove?: (driverId: string) => void;
  onReject?: (driverId: string) => void;
  onSuspend?: (driverId: string) => void;
  onFeatured?: (driverId: string) => void;
  onUnfeature?: (driverId: string) => void;
  onUnsuspend?: (driverId: string) => void;
}

export function DriverTable({ drivers, variant, onApprove, onReject, onSuspend, onFeatured, onUnfeature, onUnsuspend }: DriverTableProps) {
  const config = VARIANT_CONFIG[variant];

  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleView = (driver: Driver) => {
    setSelectedDriver(driver);
    setIsModalOpen(true);
  };

  return (
    <>
      <Card className="overflow-hidden border-border">
        <CardContent className="p-0">
          <div className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-accent/60 hover:bg-accent/60">
                  <TableHead className="text-xs font-semibold tracking-wider uppercase">
                    {variant === 'pending' ? 'Driver Identity' : 'Driver'}
                  </TableHead>
                  <TableHead className="text-xs font-semibold tracking-wider uppercase">
                    {variant === 'pending' ? 'Contact Information' : 'Contact'}
                  </TableHead>
                  <TableHead className="text-xs font-semibold tracking-wider uppercase">
                    {variant === 'pending' ? 'Hub Location' : 'Location'}
                  </TableHead>

                  {config.showStats && (
                    <>
                      <TableHead className="text-xs font-semibold tracking-wider uppercase">
                        Completed Rides
                      </TableHead>
                      <TableHead className="text-xs font-semibold tracking-wider uppercase">
                        Cancelled Rides
                      </TableHead>
                      <TableHead className="text-xs font-semibold tracking-wider uppercase">
                        Total Rides
                      </TableHead>
                    </>
                  )}

                  <TableHead className="text-xs font-semibold tracking-wider uppercase">
                    {variant === 'pending' ? 'App Status' : 'Status'}
                  </TableHead>
                  <TableHead className="text-right text-xs font-semibold tracking-wider uppercase">
                    {config.actionLabel}
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {drivers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={config.showStats ? 8 : 5}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No drivers found.
                    </TableCell>
                  </TableRow>
                ) : (
                  drivers.map((driver) => (
                    <DriverRow
                      key={driver.id}
                      driver={driver}
                      config={config}
                      onApprove={onApprove}
                      onReject={onReject}
                      onSuspend={onSuspend}
                      onFeatured={onFeatured}
                      onUnfeature={onUnfeature}
                      onUnsuspend={onUnsuspend}
                      onView={handleView}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Driver Details Modal */}
      <DriverDetailsModal
        driver={selectedDriver}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  );
}
