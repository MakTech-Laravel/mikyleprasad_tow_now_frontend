import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageMeta } from '@/components/seo/PageMeta';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Section from '@/components/section';
import { toast } from 'sonner';
import { AlertCircle, Info, Send } from 'lucide-react';

import { sendTestPushToToken } from '@/api/notifications';
import { getAccessToken } from '@/auth/token';

export default function FcmSendDemoPage() {
  const [fcmToken, setFcmToken] = useState(() =>
    typeof localStorage !== 'undefined' ? localStorage.getItem('fcm_token') ?? '' : '',
  );
  const [title, setTitle] = useState('TowTruckTT test push');
  const [body, setBody] = useState('Hello from the demo push sender.');
  const [lastMessageId, setLastMessageId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const hasAuth = Boolean(getAccessToken()?.trim());

  const handleSend = useCallback(async () => {
    const trimmed = fcmToken.trim();
    if (trimmed.length < 10) {
      toast.error('Paste a valid FCM device token (min 10 characters).');
      return;
    }
    if (!hasAuth) {
      toast.error('Sign in first — the API requires an authenticated user.');
      return;
    }

    setBusy(true);
    setLastMessageId(null);
    try {
      const res = await sendTestPushToToken({
        fcm_token: trimmed,
        title: title.trim() || undefined,
        body: body.trim() || undefined,
      });
      setLastMessageId(res.fcm_message_id);
      toast.success('Push queued/sent via server');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }, [body, fcmToken, hasAuth, title]);

  return (
    <>
      <PageMeta
        title="FCM send demo"
        description="Send a test device notification through the Laravel API"
      />

      <Section applyContainer containerClassName="max-w-2xl space-y-8 py-12">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Send test push (demo)</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            You cannot send FCM from the browser alone with your service account — that would expose
            server secrets. This page calls{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">POST /api/v1/notifications/test-push-token</code>{' '}
            (same guard as test-broadcast: local/testing, or{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">NOTIFICATIONS_ALLOW_TEST_BROADCAST_ROUTE</code>
            ).
          </p>
        </div>

        {!hasAuth && (
          <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="space-y-2">
              <p className="font-medium">Authentication required</p>
              <p className="text-amber-900/90">
                Log in, then return here. The backend associates the send with your account for auditing.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link to={`/login?next=${encodeURIComponent('/demo/fcm-send')}`}>Go to login</Link>
              </Button>
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Device token</CardTitle>
            <CardDescription>
              Paste an FCM registration token (e.g. from{' '}
              <Link to="/demo/fcm-token" className="text-primary underline-offset-4 hover:underline">
                FCM test bench
              </Link>
              ).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fcm-token">FCM token</Label>
              <textarea
                id="fcm-token"
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-[120px] w-full rounded-md border px-3 py-2 font-mono text-xs shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                value={fcmToken}
                onChange={(ev) => setFcmToken(ev.target.value)}
                placeholder="Paste FCM token…"
                spellCheck={false}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="push-title">Title</Label>
                <Input
                  id="push-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={255}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="push-body">Body</Label>
                <Input
                  id="push-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  maxLength={2000}
                />
              </div>
            </div>
            <Button className="gap-2" onClick={() => void handleSend()} disabled={busy || !hasAuth}>
              <Send className="h-4 w-4" />
              {busy ? 'Sending…' : 'Send'}
            </Button>
            {lastMessageId && (
              <p className="text-muted-foreground font-mono text-xs">
                FCM message id: <span className="text-foreground">{lastMessageId}</span>
              </p>
            )}
          </CardContent>
        </Card>

        <div className="text-muted-foreground flex gap-2 text-xs">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Production: keep this route disabled; run a queue worker for normal in-app notifications (
            <code className="rounded bg-muted px-1">notifications</code>,{' '}
            <code className="rounded bg-muted px-1">default</code>).
          </p>
        </div>
      </Section>
    </>
  );
}
