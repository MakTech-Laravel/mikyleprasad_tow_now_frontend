import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Eye, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { CancelRideDialog } from '@/components/rides/CancelRideDialog';
import { EstimatedArrivalModal } from '@/components/rides/EstimatedArrivalModal';
import { getApiErrorMessage } from '@/lib/error.utils';
import StatusBadge from '@/components/ui/status-badge';
import { fetchDriverRides, type DriverRideTab } from '@/api/driverPortal';
import { portalQueryKeys } from '@/api/portalQueryKeys';
import { acceptRide, cancelRideAsDriver, rideUiStatus } from '@/api/rides';
import RideTable, { type RideTableRow } from './RideTable';
import { Button } from '@/components/ui/button';

const PAGE_SIZE = 10;

const TABS = [
  { key: 'pending', label: 'Pending Rides', tableTitle: 'Ride Requests' },
  { key: 'active', label: 'Active Rides', tableTitle: 'Active Rides' },
  { key: 'completed', label: 'Completed Rides', tableTitle: 'Completed Rides' },
] as const;

type BookingTab = (typeof TABS)[number]['key'];

function getTabFromUrl(): BookingTab {
  const params = new URLSearchParams(window.location.search);
  const val = params.get('active-bookings');
  return TABS.some((tab) => tab.key === val) ? (val as BookingTab) : 'pending';
}

function setTabInUrl(tab: BookingTab) {
  const url = new URL(window.location.href);
  url.searchParams.set('active-bookings', tab);
  window.history.pushState({}, '', url.toString());
}

export default function DriverDashboardBookingsPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [acceptRideId, setAcceptRideId] = useState<number | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelRideId, setCancelRideId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<BookingTab>(getTabFromUrl);
  const [pages, setPages] = useState<Record<BookingTab, number>>({
    pending: 1,
    active: 1,
    completed: 1,
  });
  const queryClient = useQueryClient();
  const activePage = pages[activeTab];
  const activeTabConfig = TABS.find((tab) => tab.key === activeTab) ?? TABS[0];
  const tabParam: DriverRideTab = activeTab === 'completed' ? 'history' : activeTab;

  useLayoutEffect(() => {
    pageRef.current?.scrollIntoView({ block: 'start' });
  }, []);

  const ridesQuery = useQuery({
    queryKey: portalQueryKeys.driverRides({ tab: tabParam, page: activePage, per_page: PAGE_SIZE }),
    queryFn: () =>
      fetchDriverRides({
        tab: tabParam,
        page: activePage,
        per_page: PAGE_SIZE,
        sort: 'latest',
      }),
  });

  const refreshDriverRides = async () => {
    await queryClient.invalidateQueries({ queryKey: ['driver', 'rides'] });
    await queryClient.invalidateQueries({ queryKey: portalQueryKeys.driverDashboard });
  };

  const acceptMutation = useMutation({
    mutationFn: ({ rideId, etaMinutes }: { rideId: number; etaMinutes: number }) =>
      acceptRide(rideId, etaMinutes),
    onSuccess: async () => {
      toast.success('Ride accepted.');
      await refreshDriverRides();
    },
    onError: () => toast.error('Could not accept ride.'),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ rideId, reason }: { rideId: number; reason?: string }) =>
      cancelRideAsDriver(rideId, reason),
    onSuccess: async () => {
      toast.success('Ride cancelled.');
      setCancelDialogOpen(false);
      setCancelRideId(null);
      await refreshDriverRides();
    },
    onError: (err) => toast.error(getApiErrorMessage(err) ?? 'Could not cancel ride.'),
  });

  const rows: RideTableRow[] = (ridesQuery.data?.data ?? []).map((ride) => ({
    id: ride.id,
    requester: ride.user?.name ?? 'Unknown',
    requestedOn: ride.created_at ? new Date(ride.created_at).toLocaleString() : '--',
    from: ride.pickup_location,
    to: ride.dropoff_location,
    notes: ride.notes ?? '-',
    status: rideUiStatus(ride),
  }));
  const total = ridesQuery.data?.meta?.total ?? rows.length;

  useEffect(() => {
    const onPop = () => setActiveTab(getTabFromUrl());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const switchTab = useCallback((key: BookingTab) => {
    setActiveTab(key);
    setTabInUrl(key);
    pageRef.current?.scrollIntoView({ block: 'start' });
  }, []);

  const setPage = (tab: BookingTab) => (fn: (prev: number) => number) =>
    setPages((prev) => ({ ...prev, [tab]: fn(prev[tab]) }));

  const openAcceptModal = (rideId: number) => {
    setAcceptRideId(rideId);
    setAcceptModalOpen(true);
  };

  const confirmAcceptRide = (etaMinutes: number) => {
    if (acceptRideId == null) return;
    acceptMutation.mutate({ rideId: acceptRideId, etaMinutes });
    setAcceptRideId(null);
  };

  const openCancelDialog = (rideId: number) => {
    setCancelRideId(rideId);
    setCancelDialogOpen(true);
  };

  const confirmCancelRide = (reason?: string) => {
    if (cancelRideId == null) return;
    cancelMutation.mutate({ rideId: cancelRideId, reason });
  };

  const renderAction = (ride: RideTableRow) => {
    if (activeTab === 'pending') {
      return (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            disabled={acceptMutation.isPending || cancelMutation.isPending}
            onClick={() => openAcceptModal(ride.id)}
            size="icon"
            className="size-8 cursor-pointer rounded-lg"
            aria-label="Accept ride"
          >
            <Check className="size-6 text-teal-50" />
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={acceptMutation.isPending || cancelMutation.isPending}
            onClick={() => openCancelDialog(ride.id)}
            size="icon"
            className="size-8 cursor-pointer rounded-lg"
            aria-label="Cancel ride"
          >
            <X className="size-6 text-red-50" />
          </Button>

          <Link to={`/driver-app/rides/detail/${ride.id}`} className="">
            <Button
              variant="outline"
              size="icon"
              className="size-8 cursor-pointer rounded-lg bg-primary/20"
            >
              <Eye className="size-6" />
            </Button>
          </Link>
        </div>
      );
    }

    return (
      <Link to={`/driver-app/rides/detail/${ride.id}`} >
        <Button className="cursor-pointer rounded-xl">
          {activeTab === 'active' ? 'Track Service' : 'See Details'}
        </Button>
      </Link>
    );
  };

  return (
    <>
      <EstimatedArrivalModal
        open={acceptModalOpen}
        onOpenChange={(open) => {
          setAcceptModalOpen(open);
          if (!open) setAcceptRideId(null);
        }}
        mode="accept"
        isPending={acceptMutation.isPending}
        onConfirm={confirmAcceptRide}
      />
      <CancelRideDialog
        open={cancelDialogOpen}
        onOpenChange={(open) => {
          setCancelDialogOpen(open);
          if (!open) setCancelRideId(null);
        }}
        isPending={cancelMutation.isPending}
        onConfirm={confirmCancelRide}
        title="Cancel ride request"
        description="The customer will be notified. You may optionally share a reason."
        confirmLabel="Cancel ride"
      />
      <div
        ref={pageRef}
        className="bg-[#FDFCF8] p-0 font-[DM_Sans,Segoe_UI,-apple-system,BlinkMacSystemFont,sans-serif]"
      >
        <div className="border-b border-gray-200 bg-white pl-6">
          <div className="flex">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => switchTab(tab.key)}
                  className={`-mb-px cursor-pointer border-0 border-b-2 bg-transparent px-5 py-[14px] text-[13.5px] tracking-[0.01em] transition-colors duration-150 ${
                    isActive
                      ? 'border-amber-600 font-semibold text-amber-600'
                      : 'border-transparent font-normal text-gray-500 hover:text-amber-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-6 py-7">
          <RideTable
            rides={rows}
            title={activeTabConfig.tableTitle}
            renderStatus={(ride) => <StatusBadge status={ride.status} />}
            renderAction={renderAction}
            page={activePage}
            setPage={setPage(activeTab)}
            total={total}
            perPage={PAGE_SIZE}
            isLoading={ridesQuery.isLoading}
          />
        </div>
      </div>
    </>
  );
}
