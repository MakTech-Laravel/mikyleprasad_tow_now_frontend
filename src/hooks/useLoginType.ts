import { useSiteSettings } from '@/hooks/useSiteSettings';

export type LoginType = 'password' | 'otp';

function loginTypeFromEnv(): LoginType {
  const raw = (import.meta.env.VITE_LOGIN_TYPE as string | undefined)?.toLowerCase();
  return raw === 'otp' ? 'otp' : 'password';
}

export function useLoginType(): { loginType: LoginType; isLoading: boolean } {
  const { siteSettings, isLoading } = useSiteSettings();
  const fromApi = siteSettings?.login_type;

  if (fromApi === 'password' || fromApi === 'otp') {
    return { loginType: fromApi, isLoading };
  }

  return { loginType: loginTypeFromEnv(), isLoading };
}
