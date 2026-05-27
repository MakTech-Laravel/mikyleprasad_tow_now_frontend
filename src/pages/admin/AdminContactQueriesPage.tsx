import { useState } from 'react';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchAdminContactQueries, fetchAdminContactQueryDetail } from '@/api/adminPortal';
import { portalQueryKeys } from '@/api/portalQueryKeys';

import { PageMeta } from '@/components/seo/PageMeta';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { ContactQuery } from '@/types';

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

export default function AdminContactQueriesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const contactQueriesQuery = useQuery({
    queryKey: portalQueryKeys.adminContactQueries({ page: currentPage }),
    queryFn: () => fetchAdminContactQueries({ page: currentPage, per_page: 15 }),
  });
  const contactQueries = contactQueriesQuery.data?.data ?? [];
  const totalPages = Math.max(1, contactQueriesQuery.data?.meta?.last_page ?? 1);
  const loading = contactQueriesQuery.isLoading;
  const [selectedQuery, setSelectedQuery] = useState<ContactQuery | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const handleViewDetails = async (queryId: number) => {
    try {
      setLoadingDetails(true);
      const details = await fetchAdminContactQueryDetail(queryId);
      setSelectedQuery(details);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch contact query details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Admin - Contact Queries"
        description="Manage user contact queries and leads."
        keywords={['admin', 'contact', 'queries', 'leads']}
      />

      <div className="space-y-6">
        <div>
          <h1 className="font-montserrat text-[34px] font-extrabold tracking-tight text-[#151000]">
            User Leads Management
          </h1>
          <p className="text-sm text-[#2F4D58]">Monitor all customer leads.</p>
        </div>

        <Card className="overflow-hidden rounded-xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto bg-[#F5F0E6]">
              <Table className="border-separate border-spacing-y-0">
                <TableHeader>
                  <TableRow className="border-b border-[#DDD8C8] bg-[#EDE8DA] hover:bg-[#EDE8DA]">
                    <TableHead className="px-5 py-3.5 text-xs font-bold uppercase tracking-[0.09em] text-[#8C8070]">
                      Customer Name
                    </TableHead>
                    <TableHead className="px-5 py-3.5 text-xs font-bold uppercase tracking-[0.09em] text-[#8C8070]">
                      Email
                    </TableHead>
                    <TableHead className="px-5 py-3.5 text-xs font-bold uppercase tracking-[0.09em] text-[#8C8070]">
                      Subject
                    </TableHead>
                    <TableHead className="px-5 py-3.5 text-xs font-bold uppercase tracking-[0.09em] text-[#8C8070]">
                      Message
                    </TableHead>
                    <TableHead className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-[0.09em] text-[#8C8070]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="px-5 py-8 text-center text-[#8C8070]">
                        Loading contact queries...
                      </TableCell>
                    </TableRow>
                  ) : contactQueries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="px-5 py-8 text-center text-[#8C8070]">
                        No contact queries found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    contactQueries.map((query) => (
                      <TableRow
                        key={query.id}
                        className={cn(
                          'border-b border-[#E8E2D4] transition-colors hover:bg-[#EAE4D2] bg-[#EFEEEA80]',
                        )}
                      >
                        <TableCell className="px-5 py-4">
                          <span className="text-[14px] font-bold text-[#1E1C14]">
                            {query.name}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <span className="text-[13.5px] text-[#5C5548]">{query.email}</span>
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          <span className="text-[13.5px] text-[#5C5548]">{query.subject}</span>
                        </TableCell>
                        <TableCell className="max-w-xs px-5 py-4">
                          <span className="block truncate text-[13px] text-[#8A8070]">
                            {query.message}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg bg-[#DDD8C4] text-[#5C5040] hover:bg-[#C8C0A8] cursor-pointer"
                              aria-label="View details"
                              onClick={() => handleViewDetails(query.id)}
                              disabled={loadingDetails}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <PaginationBar
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </CardContent>
        </Card>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          className={cn(
            'flex max-h-[min(90dvh,100%)] w-[calc(100%-1.5rem)] max-w-2xl flex-col gap-0 overflow-hidden',
            'border-[#DDD8C8] bg-[#F5F0E6] p-4 sm:w-full sm:p-6',
          )}
        >
          <DialogHeader className="shrink-0 pr-8 text-left">
            <DialogTitle className="text-xl font-bold text-[#151000] sm:text-2xl">
              Lead Details
            </DialogTitle>
          </DialogHeader>

          {selectedQuery && (
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pr-1">
              <div className="grid grid-cols-1 gap-4 sm:gap-5">
                <div>
                  <h3 className="mb-1 text-xs font-semibold tracking-wider text-[#8C8070] uppercase sm:text-sm">
                    Customer Name
                  </h3>
                  <p className="text-base font-semibold break-words text-[#151000] sm:text-xl">
                    {selectedQuery.name}
                  </p>
                </div>

                <div>
                  <h3 className="mb-1 text-xs font-semibold tracking-wider text-[#8C8070] uppercase sm:text-sm">
                    Customer Email
                  </h3>
                  <p className="text-base font-semibold break-all text-[#151000] sm:break-words sm:text-xl">
                    {selectedQuery.email}
                  </p>
                </div>

                <div>
                  <h3 className="mb-1 text-xs font-semibold tracking-wider text-[#8C8070] uppercase sm:text-sm">
                    Subject
                  </h3>
                  <p className="text-base font-semibold break-words text-[#151000] sm:text-xl">
                    {selectedQuery.subject}
                  </p>
                </div>

                <div>
                  <h3 className="mb-1 text-xs font-semibold tracking-wider text-[#8C8070] uppercase sm:text-sm">
                    Message
                  </h3>
                  <p className="max-h-[40vh] overflow-y-auto rounded-lg bg-[#d3d3cc81] p-3 text-sm leading-relaxed font-normal break-words whitespace-pre-wrap text-[#151000] sm:max-h-none sm:p-4 sm:text-base">
                    {selectedQuery.message}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
