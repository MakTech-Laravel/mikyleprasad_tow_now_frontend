import Section from '@/components/section';
import type { RideUiStatus } from '@/api/rides';
import { ArrowRight } from 'lucide-react';
import type React from 'react';

export interface RideTableRow {
  id: number;
  requester: string;
  requestedOn: string;
  from: string;
  to: string;
  notes: string;
  status: RideUiStatus;
}

interface RideTableProps {
  rides: RideTableRow[];
  renderStatus: (ride: RideTableRow) => React.ReactNode;
  renderAction: (ride: RideTableRow) => React.ReactNode;
  page: number;
  setPage: (fn: (prev: number) => number) => void;
  total: number;
  perPage: number;
  title?: string;
  isLoading?: boolean;
}

function RideTable({
  rides,
  renderStatus,
  renderAction,
  page,
  setPage,
  total,
  perPage,
  title,
  isLoading,
}: RideTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <Section>
      <div className="overflow-x-auto rounded-lg border border-border/90">
        {title ? <h2 className="p-5 font-inter text-lg font-semibold">{title}</h2> : null}

        <div className="grid min-w-[900px] grid-cols-[18%_16%_18%_28%_10%_10%] border-b border-gray-200 bg-[#2F4D5833] px-4 py-2.5">
          {['Requester', 'Requested On', 'Location', 'Notes', 'Status', 'Action'].map((heading) => (
            <div key={heading} className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
              {heading}
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="min-w-[900px] p-10 text-center text-sm text-gray-400">Loading rides...</div>
        ) : rides.length === 0 ? (
          <div className="min-w-[900px] p-10 text-center text-sm text-gray-400">No rides found.</div>
        ) : (
          rides.map((ride, index) => (
            <div
              key={ride.id}
              className={`grid min-w-[900px] grid-cols-[18%_16%_18%_28%_10%_10%] items-center border-b border-border px-4 py-3.5 transition-colors duration-100 hover:bg-amber-50 ${
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
              }`}
            >
              <div className="text-sm font-medium text-gray-900">{ride.requester}</div>
              <div className="text-xs text-gray-500">{ride.requestedOn}</div>
              <div className="flex flex-col gap-0.5 text-xs text-gray-700">
                <span>{ride.from}</span>
                <span className="flex items-center gap-1 text-gray-500">
                  <ArrowRight className="size-3" />
                  {ride.to}
                </span>
              </div>
              <div className="pr-2 text-[11.5px] leading-relaxed text-gray-500">{ride.notes}</div>
              <div>{renderStatus(ride)}</div>
              <div>{renderAction(ride)}</div>
            </div>
          ))
        )}

        <div className="flex min-w-[900px] items-center justify-between px-4 py-4">
          <span className="text-xs text-gray-400">
            Showing {total === 0 ? 0 : Math.min((page - 1) * perPage + 1, total)} to{' '}
            {Math.min(page * perPage, total)} of {total} results
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className={`rounded-md border px-3.5 py-1.5 text-sm font-medium transition-colors duration-150 ${
                page === 1
                  ? 'cursor-not-allowed border-gray-200 bg-white text-gray-300'
                  : 'cursor-pointer border-gray-200 bg-white text-gray-700 hover:border-gray-400'
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className={`rounded-md border px-3.5 py-1.5 text-sm font-medium transition-colors duration-150 ${
                page === totalPages
                  ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-300'
                  : 'cursor-pointer border-gray-200 bg-white text-gray-700 hover:border-gray-400'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </Section>
  );
}

export default RideTable;
