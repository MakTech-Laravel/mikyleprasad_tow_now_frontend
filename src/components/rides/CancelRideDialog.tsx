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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const REASON_MAX_LENGTH = 500;

export type CancelRideDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending?: boolean;
  onConfirm: (reason?: string) => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
};

export function CancelRideDialog({
  open,
  onOpenChange,
  isPending = false,
  onConfirm,
  title = 'Cancel ride',
  description = 'This action cannot be undone. You may optionally share a reason.',
  confirmLabel = 'Cancel ride',
}: CancelRideDialogProps) {
  const [reason, setReason] = useState('');

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setReason('');
    }
    onOpenChange(nextOpen);
  };

  const handleConfirm = () => {
    const trimmed = reason.trim();
    onConfirm(trimmed.length > 0 ? trimmed : undefined);
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 py-2">
          <Label htmlFor="cancel-reason">Reason (optional)</Label>
          <Textarea
            id="cancel-reason"
            placeholder="e.g. Unable to reach pickup location"
            value={reason}
            maxLength={REASON_MAX_LENGTH}
            disabled={isPending}
            rows={3}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            className="cursor-pointer flex-1"
            onClick={() => handleOpenChange(false)}
          >
            Keep ride
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            className="cursor-pointer flex-1"
            onClick={handleConfirm}
          >
            {isPending ? 'Cancelling…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
