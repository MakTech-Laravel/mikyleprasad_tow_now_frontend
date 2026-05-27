import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { PageMeta } from '@/components/seo/PageMeta';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import StarRating from '@/components/star-rating';
import { cn } from '@/lib/utils';

import { fetchReviews } from '@/api/adminPortal';
import { portalQueryKeys } from '@/api/portalQueryKeys';

function PaginationBar({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2 border-t border-border bg-accent/40 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground">
        Showing page {currentPage} of {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1).map((p) => (
          <Button
            key={p}
            variant={p === currentPage ? 'default' : 'ghost'}
            size="icon"
            onClick={() => onPageChange(p)}
            className={cn(
              'h-7 w-7 text-xs',
              p === currentPage && 'bg-primary text-primary-foreground hover:bg-primary/90',
            )}
          >
            {p}
          </Button>
        ))}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function AdminReviewsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsQuery = useQuery({
    queryKey: portalQueryKeys.adminReviews({ page: currentPage }),
    queryFn: () => fetchReviews({ page: currentPage, per_page: 25 }),
  });
  const reviews = reviewsQuery.data?.data ?? [];
  const totalPages = Math.max(1, reviewsQuery.data?.meta?.last_page ?? 1);

  return (
    <>
      <PageMeta
        title="Admin — Reviews"
        description="Review management."
        keywords={['admin', 'reviews']}
      />

      <div className="space-y-6">
        <h1 className="font-montserrat text-2xl font-bold tracking-tight">Review Management</h1>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {reviewsQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">Loading reviews...</p>
            </div>
          ) : reviews.length > 0 ? (
            reviews.map((r, i) => (
              <div
                key={r.id}
                className={cn(
                  'flex gap-4 px-5 py-5 transition-colors hover:bg-accent/30',
                  i < reviews.length - 1 && 'border-b border-border',
                )}
              >
                <div className="w-1 shrink-0 rounded-full bg-primary" />

                <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:gap-6">
                  <div className="shrink-0 sm:w-52">
                    <StarRating rating={r.rating} size="h-4 w-4" />
                    <p className="mt-1.5 text-sm font-semibold">{r.user?.name}</p>
                    <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                      {r.user?.email}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{r.created_at}</p>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                        Driver:
                      </span>
                      <Badge
                        variant="outline"
                        className="border-primary/20 bg-primary/10 text-xs text-foreground"
                      >
                        {r.driver?.name}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">No reviews found.</p>
            </div>
          )}

          <PaginationBar currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      </div>
    </>
  );
}
