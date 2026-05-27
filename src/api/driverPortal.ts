import { request } from '@/api/request';
import type { RidePayload } from '@/api/rides';
import { unwrapPaginated, type ApiEnvelope, type LaravelPaginated, type RideStats } from '@/api/portalShared';

type DriverDashboard = {
  summary: RideStats;
  recent_rides: RidePayload[];
};

export type DriverRideTab = 'pending' | 'active' | 'history';

export async function fetchDriverDashboard(): Promise<DriverDashboard> {
  const [statsRes, ridesRes] = await Promise.all([
    request.get<ApiEnvelope<RideStats>>('/driver/stats'),
    request.get('/driver/rides', {
      params: { tab: 'history', page: 1, per_page: 6, sort: 'latest' },
    }),
  ]);

  return {
    summary: statsRes.data.data,
    recent_rides: unwrapPaginated<RidePayload>(ridesRes.data).data,
  };
}

export async function fetchDriverRides(params: {
  tab: DriverRideTab;
  page?: number;
  per_page?: number;
  q?: string;
  status?: string[];
  from?: string;
  to?: string;
  sort?: 'latest' | 'oldest';
}): Promise<LaravelPaginated<RidePayload>> {
  const res = await request.get('/driver/rides', { params });
  return unwrapPaginated<RidePayload>(res.data);
}
