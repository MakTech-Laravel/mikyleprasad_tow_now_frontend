import { useQuery } from '@tanstack/react-query';
import { request } from '@/api/request';

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type SiteSettings = {
  site_email?: string;
  site_phone?: string;
  site_address?: string;
  login_type?: 'password' | 'otp';
  otp_code_length?: number;
};

const fetchSiteSettings = async (): Promise<SiteSettings> => {
  const response = await request.get<ApiEnvelope<SiteSettings>>('/site-settings');
  return response.data.data;
};

export function useSiteSettings() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['site-settings'],
    queryFn: fetchSiteSettings,
    staleTime: 0,
    gcTime: 10 * 60 * 1000,
  });

  return {
    siteSettings: data,
    isLoading,
    isError,
    refetch,
  };
}
