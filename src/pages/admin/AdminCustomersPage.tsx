import { useState, useEffect, useCallback } from 'react';
import { Search, Eye, Pencil } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { toast } from 'sonner';

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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import InputPassword from '@/components/input-password';

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

function EditCustomerDialog({
  customer,
  open,
  onOpenChange,
  onUpdated,
}: {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}) {
  const [form, setForm] = useState(() => ({
    name: customer?.name ?? '',
    email: customer?.email ?? '',
    phone: customer?.phone ?? '',
    address: customer?.address ?? '',
    password: '',
  }));
  const [saving, setSaving] = useState(false);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!customer) return;

    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Name and email are required.');
      return;
    }

    if (form.password && form.password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    try {
      setSaving(true);
      await request.patch(`/admin/customers/${customer.id}`, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        ...(form.password ? { password: form.password } : {}),
      });

      toast.success('Customer updated successfully.');
      onOpenChange(false);
      onUpdated();
    } catch (error: unknown) {
      const validationErrors = isAxiosError<{
        errors?: Record<string, string[]>;
      }>(error)
        ? error.response?.data?.errors
        : undefined;
      const firstMessage = validationErrors
        ? (Object.values(validationErrors).flat()[0] as string | undefined)
        : undefined;

      toast.error(firstMessage ?? 'Failed to update customer.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Customer</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Update customer information or enter a new password.
          </p>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="customer-name">Full Name</Label>
              <Input
                id="customer-name"
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customer-email">Email Address</Label>
              <Input
                id="customer-email"
                type="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customer-phone">Phone Number</Label>
              <Input
                id="customer-phone"
                value={form.phone}
                onChange={(event) => updateField('phone', event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customer-address">Address</Label>
              <Input
                id="customer-address"
                value={form.address}
                onChange={(event) => updateField('address', event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="customer-password">New Password</Label>
            <InputPassword
              id="customer-password"
              value={form.password}
              onChange={(event) => updateField('password', event.target.value)}
              placeholder="Leave blank to keep the current password"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Page component ────────────────────────────────────────────────────────────

export default function AdminCustomersPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [accountType, setAccountType] = useState(searchParams.get('status') ?? 'all');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [customerBeingEdited, setCustomerBeingEdited] = useState<Customer | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
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
    // Fetching is the effect's external synchronization; state updates occur after the request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    // Search params are intentionally updated only when the debounced input changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handlePageChange = (page: number) => {
    const params = Object.fromEntries(searchParams.entries());
    params.page = String(page);
    setSearchParams(params);
  };

  const handleEdit = (customer: Customer) => {
    setCustomerBeingEdited(customer);
    setIsEditDialogOpen(true);
  };

  const handleEditDialogOpenChange = (open: boolean) => {
    setIsEditDialogOpen(open);
    if (!open) setCustomerBeingEdited(null);
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
            <p
              className={cn(
                'mb-1.5',
                'text-xs',
                'font-semibold',
                'tracking-widest',
                'text-muted-foreground',
                'uppercase',
              )}
            >
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
                className={cn(
                  'absolute',
                  'top-1/2',
                  'right-1.5',
                  'h-7',
                  'w-7',
                  '-translate-y-1/2',
                  'rounded-md',
                )}
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
            <p
              className={cn(
                'mb-1.5',
                'text-xs',
                'font-semibold',
                'tracking-widest',
                'text-muted-foreground',
                'uppercase',
              )}
            >
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
                    <TableHead
                      className={cn('text-xs', 'font-semibold', 'tracking-wider', 'uppercase')}
                    >
                      Customer Name
                    </TableHead>
                    <TableHead
                      className={cn('text-xs', 'font-semibold', 'tracking-wider', 'uppercase')}
                    >
                      Email Address
                    </TableHead>
                    <TableHead
                      className={cn('text-xs', 'font-semibold', 'tracking-wider', 'uppercase')}
                    >
                      Total Rides
                    </TableHead>
                    <TableHead
                      className={cn('text-xs', 'font-semibold', 'tracking-wider', 'uppercase')}
                    >
                      Status
                    </TableHead>
                    <TableHead
                      className={cn(
                        'text-right',
                        'text-xs',
                        'font-semibold',
                        'tracking-wider',
                        'uppercase',
                      )}
                    >
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
                              <AvatarFallback
                                className={cn(
                                  'bg-muted',
                                  'text-xs',
                                  'font-semibold',
                                  'text-foreground',
                                )}
                              >
                                {getInitialsFromName(c.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className={cn('text-sm', 'font-semibold')}>{c.name ?? '—'}</span>
                          </div>
                        </TableCell>
                        <TableCell className={cn('text-sm', 'text-muted-foreground')}>
                          {c.email ?? '—'}
                        </TableCell>
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
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              className="size-8 cursor-pointer rounded-lg"
                              aria-label="Edit customer"
                              onClick={() => handleEdit(c)}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <button
                              onClick={() => navigate(`/admin/customers/detail/${c.id}`)}
                              className={cn(
                                'flex',
                                'size-8',
                                'cursor-pointer',
                                'items-center',
                                'justify-center',
                                'rounded-lg',
                                'bg-accent',
                              )}
                              aria-label="View"
                            >
                              <Eye className={cn('size-4', 'text-muted-foreground')} />
                            </button>
                          </div>
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

        <EditCustomerDialog
          key={customerBeingEdited?.id ?? 'no-customer'}
          customer={customerBeingEdited}
          open={isEditDialogOpen}
          onOpenChange={handleEditDialogOpenChange}
          onUpdated={() => void fetchCustomers()}
        />
      </Section>
    </>
  );
}
