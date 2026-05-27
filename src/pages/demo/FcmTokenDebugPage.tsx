/** FIREBASE-DISABLED — routes removed; restore via docs/FIREBASE_DISABLE_AND_RESTORE.md */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageMeta } from '@/components/seo/PageMeta';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Section from '@/components/section';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ShieldCheck,
  Copy,
  Send,
  RefreshCw,
  Terminal,
  Info,
  Settings2,
} from 'lucide-react';

import {
  requestFcmDeviceToken,
  fcmEnvStatus,
  isFcmMessagingSupported,
} from '@/services/fcm.service';
import { updateFcmToken } from '@/api/rides';

export default function FcmTokenDebugPage() {
  const env = useMemo(() => fcmEnvStatus(), []);
  const [messagingSupported, setMessagingSupported] = useState<boolean | null>(null);
  const [token, setToken] = useState<string | null>(() =>
    typeof localStorage !== 'undefined' ? localStorage.getItem('fcm_token') : null,
  );
  const [log, setLog] = useState<string>('');
  const [busy, setBusy] = useState(false);

  const embeddedApiKeyLen = useMemo(
    () => String(import.meta.env.VITE_FIREBASE_API_KEY ?? '').trim().length,
    [],
  );

  useEffect(() => {
    let cancelled = false;
    void isFcmMessagingSupported().then((ok) => {
      if (!cancelled) setMessagingSupported(ok);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const appendLog = useCallback((line: string) => {
    setLog((prev) => `${prev}${prev ? '\n' : ''}${new Date().toLocaleTimeString()} → ${line}`);
  }, []);

  const handleGenerate = useCallback(async () => {
    setBusy(true);
    setLog('');
    try {
      const t = await requestFcmDeviceToken();
      setToken(t);
      localStorage.setItem('fcm_token', t);
      appendLog(`Token generated (${t.substring(0, 8)}...)`);
      toast.success('FCM token generated');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      appendLog(`Error: ${msg}`);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }, [appendLog]);

  const handleCopy = useCallback(async () => {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Clipboard copy failed');
    }
  }, [token]);

  const handleRegisterApi = useCallback(async () => {
    if (!token) return;
    setBusy(true);
    try {
      await updateFcmToken(token);
      appendLog('Successfully registered with backend API.');
      toast.success('Token synced with server');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      appendLog(`API Error: ${msg}`);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }, [appendLog, token]);

  const StatusBadge = ({ condition, label }: { condition: boolean; label: string }) => (
    <div className="flex items-center justify-between py-1">
      <span className="text-muted-foreground">{label}</span>
      <Badge
        variant={condition ? 'outline' : 'secondary'}
        className={condition ? 'border-emerald-500/50 bg-emerald-50/50 text-emerald-600' : ''}
      >
        {condition ? 'Configured' : 'Missing'}
      </Badge>
    </div>
  );

  return (
    <>
      <PageMeta title="FCM Debugger" description="Firebase Cloud Messaging test bench" />

      <Section applyContainer containerClassName="max-w-4xl space-y-8 py-12">
        {/* Header Section */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">FCM Test Bench</h1>
            <p className="flex items-center gap-2 text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Internal Debugging & Push Notification Validation
            </p>
          </div>
          <Badge variant="secondary" className="w-fit font-mono">
            Vite Mode: {import.meta.env.MODE}
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Environment Column */}
          <Card className="border-muted/60 shadow-sm md:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Settings2 className="h-4 w-4" /> Environment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between border-b border-dashed py-1">
                <span className="text-muted-foreground">Supported</span>
                {messagingSupported === null ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  <Badge variant={messagingSupported ? 'default' : 'secondary'}>
                    {String(messagingSupported)}
                  </Badge>
                )}
              </div>

              <StatusBadge label="API Key" condition={env.hasApiKey} />
              <StatusBadge label="VAPID Key" condition={env.hasVapidKey} />
              <StatusBadge label="Project ID" condition={env.hasProjectId} />

              <div className="flex items-center justify-between pt-2 font-mono text-xs text-muted-foreground">
                <span>Key Length:</span>
                <span>{embeddedApiKeyLen} chars</span>
              </div>

              {embeddedApiKeyLen === 0 && env.hasVapidKey && (
                <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-800">
                  <Info className="mb-1 h-3 w-3" />
                  VITE_FIREBASE_API_KEY is empty. Check your OS environment variables for overrides.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action & Result Column */}
          <div className="space-y-6 md:col-span-2">
            <Card className="overflow-hidden border-primary/10 shadow-md">
              <div className="h-1 bg-primary/20" />
              <CardHeader>
                <CardTitle className="text-lg">Token Management</CardTitle>
                <CardDescription>
                  Request a new browser token and sync it with your account.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      Device Token
                    </label>
                    {token && (
                      <Badge variant="secondary" className="text-[10px] font-normal">
                        Active Session
                      </Badge>
                    )}
                  </div>
                  <div className="group relative">
                    <textarea
                      readOnly
                      className="min-h-[100px] w-full resize-none rounded-xl border-muted bg-muted/20 p-4 font-mono text-xs transition-all focus:ring-1 focus:ring-primary"
                      value={token ?? ''}
                      placeholder="No token generated yet..."
                    />
                    {token && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-2 right-2 h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={handleCopy}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    className="flex-1 gap-2 shadow-sm"
                    onClick={() => void handleGenerate()}
                    disabled={busy}
                  >
                    {busy ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="h-4 w-4" />
                    )}
                    Generate Token
                  </Button>

                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => void handleRegisterApi()}
                    disabled={!token || busy}
                  >
                    <Send className="h-4 w-4" />
                    Sync to API
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Logs Section */}
            {log && (
              <Card className="border-none bg-slate-950 text-slate-50 shadow-2xl">
                <CardHeader className="border-b border-slate-800 py-3">
                  <CardTitle className="flex items-center gap-2 font-mono text-xs text-slate-400">
                    <Terminal className="h-3 w-3" /> System Logs
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <pre className="scrollbar-thin scrollbar-thumb-slate-700 max-h-40 overflow-auto p-4 font-mono text-[11px] leading-relaxed">
                    {log}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <Separator className="opacity-50" />

            <p className="text-center text-[11px] text-muted-foreground italic">
              This page is intended for developer use only. Ensure this route is gated or removed in public
              production builds.{' '}
              <Link to="/demo/fcm-send" className="text-primary underline-offset-4 hover:underline">
                Open send-to-token demo
              </Link>
            </p>
      </Section>
    </>
  );
}
