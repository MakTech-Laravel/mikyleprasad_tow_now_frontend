import { isAxiosError } from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { PageMeta } from '@/components/seo/PageMeta';
import Section from '@/components/section';
import { cn } from '@/lib/utils';
import { request } from '@/api/request';
import { unwrapPaginated } from '@/api/portalShared';
import { DataPagination } from '@/components/ui/data-pagination';
import { DriverTable } from './DriverTable';
import { toast } from 'sonner';

// ── Types ─────────────────────────────────────────────────

type TabKey = 'pending' | 'all' | 'suspended' | 'featured_drivers' | 'rejected';

type AdminDriverRow = {
  id: string | number;
  name: string;
  username?: string;
  email: string;
  phone?: string;
  address?: string;
  approval_status?: string;
  avatar_url?: string | null;
  ride_statistics?: {
    total_rides?: number;
    completed_rides?: number;
    cancelled_rides?: number;
    active_rides?: number;
  };
  driverId: string;
};

type PaginationMeta = {
  currentPage: number;
  lastPage: number;
  total: number;
  perPage: number;
};

const TABS: { label: string; tab: TabKey }[] = [
  { label: 'Pending Drivers', tab: 'pending' },
  { label: 'All Drivers', tab: 'all' },
  { label: 'Featured Drivers', tab: 'featured_drivers' },
  { label: 'Suspended', tab: 'suspended' },
  { label: 'Rejected', tab: 'rejected' },
];

function normalizeAdminDrivers(rows: AdminDriverRow[]): AdminDriverRow[] {
  return rows.map((driver) => ({
    ...driver,
    id: String(driver.id),
    driverId: driver.username ?? String(driver.id),
  }));
}

export default function AdminDriversPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as TabKey) ?? 'pending';

  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<PaginationMeta>({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 15,
  });

  const fetchDrivers = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setLoading(true);
        const params = new URLSearchParams(searchParams);
        if (!params.get('tab')) params.set('tab', 'pending');
        if (!params.get('sort')) params.set('sort', 'latest');

        const response = await request.get(`/admin/drivers?${params.toString()}`, {
          signal,
          timeout: 30_000,
        });
        const paginated = unwrapPaginated<AdminDriverRow>(response.data);
        setDrivers(normalizeAdminDrivers(paginated.data ?? []) as never[]);
        setMeta({
          currentPage: paginated.meta?.current_page ?? 1,
          lastPage: paginated.meta?.last_page ?? 1,
          total: paginated.meta?.total ?? 0,
          perPage: paginated.meta?.per_page ?? 15,
        });
      } catch (error) {
        if (isAxiosError(error) && (error.code === 'ERR_CANCELED' || error.name === 'CanceledError')) {
          return;
        }
        console.error(error);
        toast.error('Failed to load drivers. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [searchParams],
  );

  useEffect(() => {
    const controller = new AbortController();
    void fetchDrivers(controller.signal);
    return () => controller.abort();
  }, [fetchDrivers]);

  const handleApprove = async (driverId: string) => {
    try {
      await request.post(`/admin/drivers/${driverId}/accept`);
      void fetchDrivers();
      toast.success('Driver approved successfully.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to approve driver.');
    }
  };

  const handleReject = async (driverId: string) => {
    try {
      await request.post(`/admin/drivers/${driverId}/reject`);
      void fetchDrivers();
      toast.success('Driver rejected successfully.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to reject driver.');
    }
  };

  const handleSuspend = async (driverId: string) => {
    try {
      await request.post(`/admin/drivers/${driverId}/suspend`);
      void fetchDrivers();
      toast.success('Driver suspended successfully.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to suspend driver.');
    }
  };
  const handleUnsuspend = async (driverId: string) => {
    try {
      await request.post(`/admin/drivers/${driverId}/unsuspend`);
      void fetchDrivers();
      toast.success('Driver unsuspended successfully.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to unsuspend driver.');
    }
  };

  const handleFeatured = async (driverId: string) => {
    try {
      await request.post(`/admin/drivers/${driverId}/featured`);
      void fetchDrivers();
      toast.success('Driver featured successfully.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to feature driver.');
    }
  };

  const handleUnfeature = async (driverId: string) => {
    try {
      await request.post(`/admin/drivers/${driverId}/unfeatured`);
      void fetchDrivers();
      toast.success('Driver unfeatured successfully.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to unfeature driver.');
    }
  };

  const handleTabSwitch = (tab: TabKey) => {
    setSearchParams({ tab, sort: 'latest', page: '1' });
  };

  const handlePageChange = (page: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(page));
      return next;
    });
  };

  function renderTable() {
    switch (activeTab) {
      case 'pending':
        return (
          <DriverTable
            variant="pending"
            drivers={drivers}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        );
      case 'all':
        return (
          <DriverTable
            variant="active"
            drivers={drivers}
            onSuspend={handleSuspend}
            onFeatured={handleFeatured}
            onUnsuspend={handleUnsuspend}
            onUnfeature={handleUnfeature}
          />
        );
      case 'featured_drivers':
        return <DriverTable variant="featured" drivers={drivers} onUnfeature={handleUnfeature} />;
      case 'suspended':
        return <DriverTable variant="suspended" drivers={drivers} onUnsuspend={handleUnsuspend} />;
      case 'rejected':
        return <DriverTable variant="rejected" drivers={drivers} onApprove={handleApprove} />;
      default:
        return null;
    }
  }

  return (
    <>
      <PageMeta
        title="Admin — Drivers"
        description="Manage driver accounts."
        keywords={['admin', 'drivers']}
      />

      <Section className={cn('space-y-6 p-0')} paddingY="none" animated={false}>
        <Section.Heading
          title="Driver Management"
          subtitle="Approve, monitor, and coordinate your regional delivery network."
          align="left"
          animated={false}
          className="mb-4"
        />

        <div className={cn('flex items-center gap-2 border-b border-border mt-8')}>
          {TABS.map((item) => (
            <button
              key={item.tab}
              onClick={() => handleTabSwitch(item.tab)}
              className={cn(
                'rounded-none border-b-2 border-transparent bg-transparent px-1 pb-3 text-xs font-semibold tracking-widest text-muted-foreground uppercase transition-colors',
                activeTab === item.tab && 'border-primary text-foreground',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className={cn('py-10 text-center text-sm text-muted-foreground')}>Loading...</p>
        ) : (
          <>
            {renderTable()}
            <DataPagination {...meta} onPageChange={handlePageChange} />
          </>
        )}
      </Section>
    </>
  );
}
