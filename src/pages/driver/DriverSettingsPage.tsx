import { useState } from 'react';
import { Settings2, Eye, EyeOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Section from '@/components/section';

export default function AccountSecurityPage() {
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [emailSummaries, setEmailSummaries] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <Section className="mx-auto w-full space-y-5 px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white shadow-sm">
          <Settings2 size={15} className="text-muted-foreground" />
        </div>
        <h1 className="text-sm font-semibold tracking-tight text-foreground">
          Account &amp; Security
        </h1>
      </div>

      {/* Main Card */}
      <div className="space-y-4 rounded-2xl border border-border bg-white p-7 shadow-sm">
        {/* Current Password */}
        <div className="space-y-1.5">
          <Label
            htmlFor="current-password"
            className="text-xs font-medium tracking-wide text-muted-foreground"
          >
            Current Password
          </Label>
          <div className="relative">
            <Input
              id="current-password"
              type={showCurrentPassword ? 'text' : 'password'}
              defaultValue="••••••••••••••"
              className="h-11 rounded-xl border-border bg-muted/50 pr-10 text-sm"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            >
              {showCurrentPassword ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div className="space-y-1.5">
          <Label
            htmlFor="new-password"
            className="text-xs font-medium tracking-wide text-muted-foreground"
          >
            New Password
          </Label>
          <div className="relative">
            <Input
              id="new-password"
              type={showNewPassword ? 'text' : 'password'}
              placeholder="+1 (555) 012-3456"
              className="h-11 rounded-xl border-border bg-muted/50 pr-10 text-sm"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            >
              {showNewPassword ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>
        </div>

        {/* Confirm New Password */}
        <div className="space-y-1.5">
          <Label
            htmlFor="confirm-password"
            className="text-xs font-medium tracking-wide text-muted-foreground"
          >
            Confirm New Password
          </Label>
          <div className="relative">
            <Input
              id="confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="+1 (555) 012-3456"
              className="h-11 rounded-xl border-border bg-muted/50 pr-10 text-sm"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            >
              {showConfirmPassword ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>
        </div>

        <div className="space-y-4 border-t border-border pt-5">
          <p className="text-[10.5px] font-semibold tracking-widest text-muted-foreground uppercase">
            Notifications
          </p>

          <div className="flex items-center justify-between">
            <Label htmlFor="sms-alerts" className="cursor-pointer text-sm font-normal">
              SMS Load Alerts
            </Label>
            <Switch id="sms-alerts" checked={smsAlerts} onCheckedChange={setSmsAlerts} />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="email-summaries" className="cursor-pointer text-sm font-normal">
              Email Summaries
            </Label>
            <Switch
              id="email-summaries"
              checked={emailSummaries}
              onCheckedChange={setEmailSummaries}
            />
          </div>
        </div>

        <hr className="my-4" />
        <hr className="my-4" />
        
        <div className="flex flex-col gap-4 items-start sm:flex-row sm:items-end sm:justify-between">
          <p className="text-[11.5px] leading-relaxed text-muted-foreground">
            All sensitive information is encrypted. Your compliance status is currently 100%
            compliant. Last profile update: Today at 09:12 AM.
          </p>
          <div className="flex shrink-0 gap-2.5 w-full sm:w-auto">
            <Button variant="outline" size="sm" className="h-9 rounded-lg text-xs flex-1 sm:flex-none">
              Discard Changes
            </Button>
            <Button
              size="sm"
              className="h-9 rounded-lg border-0 bg-yellow-400 text-xs font-semibold text-yellow-950 hover:bg-yellow-500 flex-1 sm:flex-none"
            >
              Save Profile Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
    </Section>
  );
}
