import { cn } from '@/lib/utils';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './pagination';

interface DataPaginationProps {
  currentPage: number;
  lastPage: number;
  onPageChange: (page: number) => void;
  total?: number;
  perPage?: number;
  className?: string;
}

export function DataPagination({
  currentPage,
  lastPage,
  onPageChange,
  total,
  perPage,
  className,
}: DataPaginationProps) {
  if (lastPage <= 1) return null;

  const getPages = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];

    if (lastPage <= 7) {
      for (let i = 1; i <= lastPage; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 4) pages.push('ellipsis');

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(lastPage - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);

      if (currentPage < lastPage - 3) pages.push('ellipsis');
      pages.push(lastPage);
    }

    return pages;
  };

  return (
    <div
      className={cn(
        // flex shrink-0 flex-col items-center gap-3 pt-4 sm:flex-row sm:justify-between
        '',
        className,
      )}
    >
      {total && perPage && (
        <p className={cn('text-xs text-muted-foreground')}>
          Showing{' '}
          <span className={cn('font-medium text-foreground')}>
            {(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, total)}
          </span>{' '}
          of <span className={cn('font-medium text-foreground')}>{total}</span>
        </p>
      )}

      <Pagination className="ml-0 w-auto flex justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
              className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>

          {getPages().map((page, idx) =>
            page === 'ellipsis' ? (
              <PaginationItem key={`ellipsis-${idx}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={page}>
                <PaginationLink
                  isActive={page === currentPage}
                  onClick={() => onPageChange(page)}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ),
          )}

          <PaginationItem>
            <PaginationNext
              onClick={() => currentPage < lastPage && onPageChange(currentPage + 1)}
              className={
                currentPage === lastPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
