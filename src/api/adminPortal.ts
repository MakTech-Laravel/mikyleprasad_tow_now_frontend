import { request } from '@/api/request';
import type { RidePayload } from '@/api/rides';
import {
  unwrapPaginated,
  type ApiEnvelope,
  type LaravelPaginated,
  type RideStats,
} from '@/api/portalShared';

type PortalUser = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  username?: string | null;
  status?: string;
  approval_status?: string;
  is_suspended?: boolean;
  is_featured?: boolean;
  created_at?: string | null;
};

type AdminDashboard = {
  summary: RideStats;
  recent_rides: RidePayload[];
};

type ContactQueryRow = {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at?: string;
  updated_at?: string;
};

export type Review = {
  id: number;
  rating: number;
  body: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
  driver: {
    id: number;
    name: string;
    email: string;
  };
  created_at?: string;
  updated_at?: string;
};

export async function fetchAdminDashboard(): Promise<AdminDashboard> {
  const [statsRes, ridesRes] = await Promise.all([
    request.get<ApiEnvelope<RideStats>>('/admin/stats'),
    request.get('/admin/rides', {
      params: { page: 1, per_page: 6, sort: 'latest' },
    }),
  ]);

  return {
    summary: statsRes.data.data,
    recent_rides: unwrapPaginated<RidePayload>(ridesRes.data).data,
  };
}

export async function fetchAdminRides(params: {
  page?: number;
  per_page?: number;
  q?: string;
  status?: string[];
  from?: string;
  to?: string;
  sort?: 'latest' | 'oldest';
}): Promise<LaravelPaginated<RidePayload>> {
  const res = await request.get('/admin/rides', { params });
  return unwrapPaginated<RidePayload>(res.data);
}

export async function fetchAdminDrivers(params: {
  page?: number;
  per_page?: number;
  q?: string;
  status?: string;
  approval_status?: string;
  is_suspended?: boolean;
  is_featured?: boolean;
}): Promise<LaravelPaginated<PortalUser>> {
  const res = await request.get<ApiEnvelope<LaravelPaginated<PortalUser>>>('/admin/drivers', {
    params,
  });
  return res.data.data ?? { data: [] };
}

export async function fetchAdminCustomers(params: {
  page?: number;
  per_page?: number;
  q?: string;
  status?: string;
}): Promise<LaravelPaginated<PortalUser>> {
  const res = await request.get<ApiEnvelope<LaravelPaginated<PortalUser>>>('/admin/customers', {
    params,
  });
  return res.data.data ?? { data: [] };
}

export async function fetchAdminContactQueries(params: {
  page?: number;
  per_page?: number;
}): Promise<LaravelPaginated<ContactQueryRow>> {
  const res = await request.get<LaravelPaginated<ContactQueryRow>>('/admin/contact', {
    params,
  });

  return res.data ?? { data: [] };
}

export async function fetchAdminContactQueryDetail(id: number): Promise<ContactQueryRow> {
  const res = await request.get<ApiEnvelope<ContactQueryRow>>(`/admin/contact/${id}`);
  return res.data.data;
}

export async function fetchReviews(params: {
  page?: number;
  per_page?: number;
}): Promise<LaravelPaginated<Review>> {
  const res = await request.get('/admin/reviews', { params });
  return unwrapPaginated<Review>(res.data);
}
