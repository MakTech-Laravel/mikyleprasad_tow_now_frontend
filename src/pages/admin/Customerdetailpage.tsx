import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Star,
  Shield,
  Activity,
} from 'lucide-react';

import { PageMeta } from '@/components/seo/PageMeta';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

type RideStatus = 'Completed' | 'Cancelled' | 'Active' | 'Pending';

interface RideHistoryItem {
  id: string;
  driver: string;
  driverInitials: string;
  from: string;
  to: string;
  date: string;
  amount: string;
  status: RideStatus;
  rating: number | null;
}

interface StatItem {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  accent: string;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const customer = {
  id: 'USR-1042',
  name: 'Marcus Thorne',
  email: 'marcus.thorne@gmail.com',
  phone: '+1 (555) 012-9932',
  address: '4120 Elm Street, Austin, TX 78701',
  joinDate: 'March 12, 2022',
  lastActive: '2 minutes ago',
  status: 'Active' as const,
  accountType: 'Premium',
  totalSpent: '$4,280.00',
  initials: 'MT',
};

const stats: StatItem[] = [
  { label: 'Total Rides',      value: '142',     sub: '+8 this month',  icon: TrendingUp,   accent: 'bg-primary/10 text-primary'     },
  { label: 'Completed',        value: '136',     sub: '95.7% rate',     icon: CheckCircle2, accent: 'bg-green-100 text-green-700'     },
  { label: 'Cancelled',        value: '6',       sub: '4.3% rate',      icon: XCircle,      accent: 'bg-red-100 text-red-500'         },
  { label: 'Avg. Trip Time',   value: '34 min',  sub: 'Per ride',       icon: Clock,        accent: 'bg-secondary/10 text-secondary'  },
];

const rideHistory: RideHistoryItem[] = [
  { id: '#FF-8021', driver: 'Elena Rodriguez', driverInitials: 'ER', from: 'Austin Hub, TX',   to: 'Dallas Hub, TX',    date: 'May 27, 2024', amount: '$148.00', status: 'Completed', rating: 5   },
  { id: '#FF-7994', driver: 'James Lee',       driverInitials: 'JL', from: 'Dallas Hub, TX',   to: 'Houston Hub, TX',   date: 'May 22, 2024', amount: '$210.50', status: 'Completed', rating: 4   },
  { id: '#FF-7950', driver: 'Sophia Chen',     driverInitials: 'SC', from: 'Houston Hub, TX',  to: 'San Antonio, TX',   date: 'May 18, 2024', amount: '$96.00',  status: 'Cancelled', rating: null},
  { id: '#FF-4C6B', driver: 'Carlos Ramirez',  driverInitials: 'CR', from: 'Austin Hub, TX',   to: 'San Antonio, TX',   date: 'May 10, 2024', amount: '$82.00',  status: 'Completed', rating: 5   },
  { id: '#FF-3A11', driver: 'Liam Johnson',    driverInitials: 'LJ', from: 'San Antonio, TX',  to: 'Corpus Christi, TX',date: 'Apr 29, 2024', amount: '$175.00', status: 'Completed', rating: 4   },
  { id: '#FF-2D88', driver: 'Elena Rodriguez', driverInitials: 'ER', from: 'Austin Hub, TX',   to: 'Waco Hub, TX',      date: 'Apr 20, 2024', amount: '$64.00',  status: 'Completed', rating: 5   },
  { id: '#FF-1F78', driver: 'Noah Park',       driverInitials: 'NP', from: 'Waco Hub, TX',     to: 'Dallas Hub, TX',    date: 'Apr 11, 2024', amount: '$112.00', status: 'Completed', rating: 3   },
  { id: '#FF-0E55', driver: 'Sophia Chen',     driverInitials: 'SC', from: 'Dallas Hub, TX',   to: 'Fort Worth, TX',    date: 'Apr 02, 2024', amount: '$58.00',  status: 'Cancelled', rating: null},
];

const statusStyles: Record<RideStatus, string> = {
  Completed: 'bg-primary text-primary-foreground',
  Cancelled:  'bg-red-100 text-red-600 border border-red-200',
  Active:     'bg-secondary/10 text-secondary border border-secondary/20',
  Pending:    'bg-muted text-muted-foreground border border-border',
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'h-3 w-3',
            i < rating ? 'fill-primary text-primary' : 'fill-muted text-muted',
          )}
        />
      ))}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent border border-border">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

function PaginationBar() {
  return (
    <div className="flex flex-col gap-2 border-t border-border px-5 py-3 bg-accent/40 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground">Showing 1–8 of 142 rides</p>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7"><ChevronLeft className="h-4 w-4" /></Button>
        {[1, 2, 3].map((p) => (
          <Button key={p} variant={p === 1 ? 'default' : 'ghost'} size="icon"
            className={cn('h-7 w-7 text-xs', p === 1 && 'bg-primary text-primary-foreground')}>
            {p}
          </Button>
        ))}
        <span className="px-1 text-xs text-muted-foreground">…</span>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-xs">18</Button>
        <Button variant="ghost" size="icon" className="h-7 w-7"><ChevronRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

// ── Page component ─────────────────────────────────────────────────────────────

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  void id; // will be used for API fetch

  return (
    <>
      <PageMeta
        title={`Customer — ${customer.name}`}
        description="Customer profile detail."
        keywords={['admin', 'customer', 'detail']}
      />

      <div className="space-y-6">

        {/* ── Back + page header ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <Link to="/admin/customers"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div>
              <h1 className="font-montserrat text-2xl font-bold tracking-tight">Customer Profile</h1>
              <p className="text-xs text-muted-foreground">ID: {customer.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">Suspend Account</Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ── Profile hero card ── */}
        <Card className="border-border overflow-hidden">
          {/* Top accent strip */}
          <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-accent" />
          <CardContent className="px-6 pb-6">
            {/* Avatar overlapping strip */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between -mt-10">
              <div className="flex items-end gap-4">
                <Avatar className="h-20 w-20 ring-4 ring-background shadow-lg">
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-xl font-bold font-montserrat">
                    {customer.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="mb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-montserrat text-xl font-bold">{customer.name}</h2>
                    <Badge className="bg-primary/15 text-foreground border-primary/20 text-xs font-medium">
                      {customer.accountType}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-green-200 bg-green-50 text-green-700 text-xs"
                    >
                      ● {customer.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Last active: {customer.lastActive}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <Button size="sm" variant="outline" className="gap-2">
                  <Mail className="h-3.5 w-3.5" />
                  Message
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Stats row ── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label} className="border-border">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', s.accent)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      {s.label}
                    </p>
                    <p className="font-montserrat text-xl font-bold tabular-nums">{s.value}</p>
                    {s.sub && <p className="text-xs text-muted-foreground">{s.sub}</p>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ── Two-column detail + activity ── */}
        <div className="grid gap-4 lg:grid-cols-3">

          {/* Contact info card */}
          <Card className="border-border lg:col-span-1">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <InfoRow icon={Mail}     label="Email Address" value={customer.email}   />
              <InfoRow icon={Phone}    label="Phone Number"  value={customer.phone}   />
              <InfoRow icon={MapPin}   label="Address"       value={customer.address} />
              <InfoRow icon={Calendar} label="Member Since"  value={customer.joinDate} />
              <InfoRow icon={Activity} label="Total Spent"   value={customer.totalSpent} />
            </CardContent>
          </Card>

          {/* Spending trend placeholder */}
          <Card className="border-border lg:col-span-2">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                Monthly Ride Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {/* Simple bar chart using divs */}
              <div className="flex h-36 items-end gap-2">
                {[8, 14, 11, 18, 12, 20, 16, 22, 17, 24, 19, 15].map((h, i) => {
                  const months = ['Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May'];
                  const maxH = 24;
                  return (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1">
                      <div
                        className={cn(
                          'w-full rounded-t-md transition-all',
                          i === 11 ? 'bg-primary' : 'bg-primary/25',
                        )}
                        style={{ height: `${(h / maxH) * 100}%` }}
                      />
                      <span className="text-[10px] text-muted-foreground">{months[i]}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <p className="text-xs text-muted-foreground">Peak month: <span className="font-semibold text-foreground">March (24 rides)</span></p>
                <p className="text-xs text-muted-foreground">Avg: <span className="font-semibold text-foreground">16.3/mo</span></p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Ride history table ── */}
        <Card className="border-border overflow-hidden">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-sm font-semibold">Ride History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-accent/60 hover:bg-accent/60">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Ride ID</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Driver</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Route</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Date</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Amount</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Rating</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rideHistory.map((r) => (
                    <TableRow key={r.id} className="border-border">
                      <TableCell className="font-mono text-sm font-semibold">
                        <Link to={`/admin/rides/${r.id}`} className="hover:text-primary transition-colors">
                          {r.id}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                              {r.driverInitials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{r.driver}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {r.from}
                        <span className="mx-1.5 text-foreground">→</span>
                        {r.to}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{r.date}</TableCell>
                      <TableCell className="font-semibold tabular-nums">{r.amount}</TableCell>
                      <TableCell>
                        {r.rating !== null ? (
                          <StarDisplay rating={r.rating} />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('text-xs font-medium', statusStyles[r.status])}>
                          {r.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <PaginationBar />
          </CardContent>
        </Card>

      </div>
    </>
  );
}