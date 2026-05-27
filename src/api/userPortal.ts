import { request } from '@/api/request';
import type { RidePayload } from '@/api/rides';
import { unwrapPaginated, type ApiEnvelope, type LaravelPaginated, type RideStats } from '@/api/portalShared';

type UserDashboard = {
  summary: RideStats;
  recent_rides: RidePayload[];
};

export async function fetchUserDashboard(): Promise<UserDashboard> {
  const [statsRes, ridesRes] = await Promise.all([
    request.get<ApiEnvelope<RideStats>>('/user/stats'),
    request.get('/user/rides', {
      params: { page: 1, per_page: 4, sort: 'latest' },
    }),
  ]);

  return {
    summary: statsRes.data.data,
    recent_rides: unwrapPaginated<RidePayload>(ridesRes.data).data,
  };
}

export async function fetchUserRideHistory(params: {
  page?: number;
  per_page?: number;
  q?: string;
  from?: string;
  to?: string;
  status?: string[];
}): Promise<LaravelPaginated<RidePayload>> {
  const res = await request.get('/user/rides', { params });
  return unwrapPaginated<RidePayload>(res.data);
}
