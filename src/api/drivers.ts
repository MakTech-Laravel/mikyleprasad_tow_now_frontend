import { request } from '@/api/request';
import type { Driver } from '@/features/townow-flow/types';
import { getNetworkCache, setNetworkCache } from '@/lib/networkCache';

type DriverStats = {
  total: number;
  online: number;
  featured: number;
  fromCache?: boolean;
};

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export async function fetchDriverById(driverId: string | number): Promise<Driver> {
  const res = await request.get<ApiEnvelope<Driver>>(`/drivers/${driverId}`);
  return res.data.data;
}

export function buildDriverStatsCacheKey(): string {
  const conn = (navigator as Navigator & { connection?: { effectiveType?: string; downlink?: number } })
    .connection;
  const lowBandwidth =
    conn?.effectiveType === 'slow-2g' ||
    conn?.effectiveType === '2g' ||
    (typeof conn?.downlink === 'number' && conn.downlink > 0 && conn.downlink < 0.5);
  return `driver-stats:${lowBandwidth ? 'lite' : 'full'}`;
}

function isLowBandwidthConnection(): boolean {
  const conn = (navigator as Navigator & { connection?: { effectiveType?: string; downlink?: number } })
    .connection;
  return (
    conn?.effectiveType === 'slow-2g' ||
    conn?.effectiveType === '2g' ||
    (typeof conn?.downlink === 'number' && conn.downlink > 0 && conn.downlink < 0.5)
  );
}

export async function fetchDriverStats(): Promise<DriverStats> {
  const cacheKey = buildDriverStatsCacheKey();
  const lowBandwidth = isLowBandwidthConnection();
  try {
    const res = await request.get<ApiEnvelope<DriverStats>>('/drivers/stats', {
      params: lowBandwidth ? { lite: 1 } : undefined,
    });
    await setNetworkCache(cacheKey, res.data.data, 5 * 60_000);
    return res.data.data;
  } catch (error) {
    const cached = await getNetworkCache<DriverStats>(cacheKey);
    if (cached) return { ...cached, fromCache: true };
    throw error;
  }
}
