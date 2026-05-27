import { useState, useEffect, useCallback } from 'react';
import { Search, Eye } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { PageMeta } from '@/components/seo/PageMeta';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import Section from '@/components/section';
import { request } from '@/api/request';
import { useDebounce } from '@/hooks/useDebounce';
import { DataPagination } from '@/components/ui/data-pagination';
import { unwrapPaginated } from '@/api/portalShared';
import { getInitialsFromName } from '@/hooks/useInitials';

// ── Types ────────────────────────────────────────────────────────────────────

interface Customer {
  id: number | string;
  name?: string | null;
  email?: string | null;
  phone?: string;
  rides?: number;
  status: string;
  lastActive?: string;
  address?: string;
  avatar_url?: string;
  ride_statistics?: {
    total_rides: number;
    completed_rides: number;
    cancelled_rides: number;
    active_rides: number;
  };
}

type PaginationMeta = {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
};

// ── Page component ────────────────────────────────────────────────────────────

export default function AdminCustomersPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [accountType, setAccountType] = useState(searchParams.get('status') ?? 'all');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<PaginationMeta>({
    currentPage: 1,
    lastPage: 1,
    perPage: 15,
    total: 0,
  });

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await request.get('/admin/customers?' + searchParams.toString());
      const paginated = unwrapPaginated<Customer>(response.data);

      setCustomers(paginated.data ?? []);
      setMeta({
        currentPage: paginated.meta?.current_page ?? 1,
        lastPage: paginated.meta?.last_page ?? 1,
        perPage: paginated.meta?.per_page ?? 15,
        total: paginated.meta?.total ?? 0,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries());
    if (debouncedSearch) {
      params.q = debouncedSearch;
    } else {
      delete params.q;
    }
    params.page = '1';
    setSearchParams(params);
  }, [debouncedSearch]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handlePageChange = (page: number) => {
    const params = Object.fromEntries(searchParams.entries());
    params.page = String(page);
    setSearchParams(params);
  };

  const navigate = useNavigate();

  return (
    <>
      <PageMeta
        title="Admin — Customers"
        description="Customer Management"
        keywords={['admin', 'customers']}
      />

      <Section className={cn('space-y-6', 'p-0')}>
        <Section.Heading title="Customer Management" className="mb-0" align="left" />

        {/* Search + filter row */}
        <div className={cn('flex', 'flex-col', 'gap-4', 'sm:flex-row', 'sm:items-end')}>
          <div className="flex-1">
            <p className={cn('mb-1.5', 'text-xs', 'font-semibold', 'tracking-widest', 'text-muted-foreground', 'uppercase')}>
              Quick Search
            </p>
            <div className="relative">
              <Button
                size="icon"
                onClick={() => {
                  const params = Object.fromEntries(searchParams.entries());
                  if (search) params.q = search;
                  else delete params.q;
                  params.page = '1';
                  setSearchParams(params);
                }}
                className={cn('absolute', 'top-1/2', 'right-1.5', 'h-7', 'w-7', '-translate-y-1/2', 'rounded-md')}
              >
                <Search className={cn('h-3.5', 'w-3.5')} />
              </Button>
              <Input
                className={cn('pr-12', 'pl-10')}
                placeholder="Search by Name, Email, Phone, or Address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="sm:w-44">
            <p className={cn('mb-1.5', 'text-xs', 'font-semibold', 'tracking-widest', 'text-muted-foreground', 'uppercase')}>
              Account Type
            </p>
            <Select
              value={accountType}
              onValueChange={(val) => {
                setAccountType(val);
                const params = Object.fromEntries(searchParams.entries());
                if (val === 'all') delete params.status;
                else params.status = val;
                params.page = '1';
                setSearchParams(params);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <Card className={cn('overflow-hidden', 'border-border')}>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className={cn('bg-accent/60', 'hover:bg-accent/60')}>
                    <TableHead className={cn('text-xs', 'font-semibold', 'tracking-wider', 'uppercase')}>
                      Customer Name
                    </TableHead>
                    <TableHead className={cn('text-xs', 'font-semibold', 'tracking-wider', 'uppercase')}>
                      Email Address
                    </TableHead>
                    <TableHead className={cn('text-xs', 'font-semibold', 'tracking-wider', 'uppercase')}>
                      Total Rides
                    </TableHead>
                    <TableHead className={cn('text-xs', 'font-semibold', 'tracking-wider', 'uppercase')}>
                      Status
                    </TableHead>
                    <TableHead className={cn('text-right', 'text-xs', 'font-semibold', 'tracking-wider', 'uppercase')}>
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className={cn('py-10', 'text-center', 'text-sm', 'text-muted-foreground')}
                      >
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : customers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className={cn('py-10', 'text-center', 'text-sm', 'text-muted-foreground')}
                      >
                        No customers found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    customers.map((c) => (
                      <TableRow key={c.id} className={cn('border-border', 'hover:bg-accent/80')}>
                        <TableCell>
                          <div className={cn('flex', 'items-center', 'gap-3')}>
                            <Avatar className={cn('h-9', 'w-9')}>
                              <AvatarImage src={c.avatar_url || ''} alt={c.name ?? 'Customer'} />
                              <AvatarFallback className={cn('bg-muted', 'text-xs', 'font-semibold', 'text-foreground')}>
                                {getInitialsFromName(c.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className={cn('text-sm', 'font-semibold')}>{c.name ?? '—'}</span>
                          </div>
                        </TableCell>
                        <TableCell className={cn('text-sm', 'text-muted-foreground')}>{c.email ?? '—'}</TableCell>
                        <TableCell className={cn('font-semibold', 'tabular-nums')}>
                          {c.ride_statistics?.total_rides ?? c.rides ?? 0}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs font-medium',
                              c.status?.toLowerCase() === 'active'
                                ? 'border-primary/20 bg-primary/20 text-primary'
                                : 'border-destructive/20 bg-destructive/20 text-destructive',
                            )}
                          >
                            {c.status ?? 'unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell align="right">
                          <button
                            onClick={() => navigate(`/admin/customers/detail/${c.id}`)}
                            className={cn('flex', 'size-8', 'cursor-pointer', 'items-center', 'justify-center', 'rounded-lg', 'bg-accent')}
                            aria-label="View"
                          >
                            <Eye className={cn('size-4', 'text-muted-foreground')} />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        {!loading && <DataPagination {...meta} onPageChange={handlePageChange} />}
      </Section>
    </>
  );
}
