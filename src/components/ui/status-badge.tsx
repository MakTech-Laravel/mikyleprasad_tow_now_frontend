import type { RideUiStatus } from '@/api/rides';
import { rideUiStatusLabel } from '@/api/rides';

interface StatusBadgeProps {
  status: RideUiStatus | string;
}

const styles: Record<RideUiStatus, { className: string }> = {
  pending: { className: 'bg-amber-100 text-amber-800 border border-amber-200' },
  active: { className: 'bg-primary/15 text-primary border border-primary/25' },
  arrived: { className: 'bg-amber-100 text-amber-900 border border-amber-200' },
  picked_up: { className: 'bg-sky-100 text-sky-900 border border-sky-200' },
  awaiting_confirmation: { className: 'bg-violet-100 text-violet-900 border border-violet-200' },
  completed: { className: 'bg-gray-100 text-gray-700 border border-gray-300' },
  cancelled: { className: 'bg-red-100 text-red-700 border border-red-200' },
  expired: { className: 'bg-red-100 text-red-700 border border-red-200' },
};

function StatusBadge({ status }: StatusBadgeProps) {
  const key = status as RideUiStatus;
  const known = key in styles;
  const s = known ? styles[key] : styles.pending;
  const label = known ? rideUiStatusLabel(key) : status;

  return (
    <span
      className={`${s.className} rounded-full px-3.5 py-0.5 text-xs font-medium whitespace-nowrap inline-block`}
    >
      {label}
    </span>
  );
}

export default StatusBadge;
