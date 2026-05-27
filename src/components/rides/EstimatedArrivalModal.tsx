import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const PRESET_MINUTES = [10, 15, 20, 30, 45, 60] as const;

type BaseProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending?: boolean;
};

type AcceptProps = BaseProps & {
  mode: 'accept';
  onConfirm: (minutes: number) => void;
};

type UpdateEtaProps = BaseProps & {
  mode: 'updateEta';
  onConfirm: (minutes: number, reason: string) => void;
  defaultReason?: string;
};

export type EstimatedArrivalModalProps = AcceptProps | UpdateEtaProps;

export function EstimatedArrivalModal(props: EstimatedArrivalModalProps) {
  const { open, onOpenChange, isPending = false } = props;
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [customMinutes, setCustomMinutes] = useState('');
  const [reason, setReason] = useState(
    props.mode === 'updateEta' ? (props.defaultReason ?? 'Traffic delay') : '',
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setSelectedPreset(null);
      setCustomMinutes('');
      if (props.mode === 'updateEta') {
        setReason(props.defaultReason ?? 'Traffic delay');
      } else {
        setReason('');
      }
    }
    onOpenChange(nextOpen);
  };

  const effectiveMinutes =
    customMinutes.trim() !== ''
      ? Number(customMinutes)
      : selectedPreset !== null
        ? selectedPreset
        : NaN;

  const handleConfirm = () => {
    if (!Number.isFinite(effectiveMinutes) || effectiveMinutes <= 0) {
      return;
    }
    if (props.mode === 'updateEta' && !reason.trim()) {
      return;
    }
    if (props.mode === 'accept') {
      props.onConfirm(Math.round(effectiveMinutes));
    } else {
      props.onConfirm(Math.round(effectiveMinutes), reason.trim());
    }
    handleOpenChange(false);
  };

  const showReason = props.mode === 'updateEta';
  const confirmDisabled =
    isPending ||
    !Number.isFinite(effectiveMinutes) ||
    effectiveMinutes <= 0 ||
    (showReason && !reason.trim());

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Estimated Arrival Time</DialogTitle>
          <DialogDescription>
            This will be shown to the customer. Choose a realistic timeframe.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Quick select</Label>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {PRESET_MINUTES.map((m) => {
                const selected = selectedPreset === m && customMinutes === '';
                return (
                  <Button
                    key={m}
                    type="button"
                    size="sm"
                    variant={selected ? 'default' : 'outline'}
                    disabled={isPending}
                    className="min-w-18 flex-1/4 cursor-pointer rounded-lg"
                    onClick={() => {
                      setSelectedPreset(m);
                      setCustomMinutes('');
                    }}
                  >
                    {m} min
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="eta-custom">Custom (minutes)</Label>
            <Input
              id="eta-custom"
              type="number"
              min={1}
              step={1}
              placeholder="e.g. 45"
              value={customMinutes}
              disabled={isPending}
              onChange={(e) => {
                setCustomMinutes(e.target.value);
                setSelectedPreset(null);
              }}
            />
          </div>

          {showReason ? (
            <div className="grid gap-2">
              <Label htmlFor="eta-reason">Reason for update</Label>
              <Input
                id="eta-reason"
                placeholder="Traffic delay"
                value={reason}
                disabled={isPending}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          ) : null}
        </div>

        <DialogFooter className="">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
            className="cursor-pointer flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="cursor-pointer flex-1"
            disabled={confirmDisabled}
            onClick={handleConfirm}
          >
            {isPending ? 'Saving…' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
