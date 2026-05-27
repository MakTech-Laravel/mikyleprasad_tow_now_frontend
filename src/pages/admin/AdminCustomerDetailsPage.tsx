import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Activity,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Eye,
  type LucideIcon,
} from 'lucide-react';
import { request } from '@/api/request';
import Section from '@/components/section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
interface Customer {
  id: number | string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  address?: string;
  created_at?: string;
  avatar_url?: string;
  ride_statistics_customer?: {
    total_rides: number;
    completed_rides: number;
    cancelled_rides: number;
    active_rides: number;
  };
  requested_rides?: {
    id: number;
    pickup_location?: string;
    dropoff_location?: string;
    status: string;
    driver?: {
      name: string;
    };
    review?: {
      rating: number;
      body: string;
    };
    created_at?: string;
  }[];
}

function InfoRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className={cn('flex items-start gap-2 sm:gap-3 border-b border-border py-2 sm:py-3 last:border-0')}>
      <div className={cn('mt-0.5 flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-accent')}>
        <Icon className={cn('h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground')} />
      </div>
      <div className={cn('min-w-0 flex-1')}>
        <p className={cn('text-[9px] sm:text-[10px] font-bold tracking-widest text-muted-foreground uppercase')}>
          {label}
        </p>
        <p className={cn('text-xs sm:text-sm font-semibold text-foreground truncate')}>{value}</p>
      </div>
    </div>
  );
}

export default function AdminCustomerDetailsPage() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<{
    rating: number;
    body: string;
  } | null>(null);

  const [openReviewModal, setOpenReviewModal] = useState(false);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true);
        const response = await request.get(`/admin/customers/${customerId}`);
        setCustomer(response.data.data);
      } catch (error) {
        console.error('Failed to fetch customer:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomer();
  }, [customerId]);

  if (loading) {
    return (
      <Section className={cn('flex items-center justify-center p-20')}>
        <div className={cn('h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent')} />
      </Section>
    );
  }

  if (!customer) return <Section className="p-8">Customer not found.</Section>;

  const stats = [
    {
      label: 'Total Rides',
      value: customer.ride_statistics_customer?.total_rides ?? 0,
      icon: TrendingUp,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Completed',
      value: customer.ride_statistics_customer?.completed_rides ?? 0,
      icon: CheckCircle2,
      color: 'bg-green-50 text-green-600',
    },
    {
      label: 'Cancelled',
      value: customer.ride_statistics_customer?.cancelled_rides ?? 0,
      icon: XCircle,
      color: 'bg-red-50 text-red-600',
    },
    {
      label: 'Active',
      value: customer.ride_statistics_customer?.active_rides ?? 0,
      icon: Activity,
      color: 'bg-amber-50 text-amber-600',
    },
  ];

  return (
   <Section className={cn('space-y-4 p-3 sm:p-4 md:p-6 lg:p-8')}>
    <div className="mx-auto w-full">
      <div className={cn('flex items-center gap-2 sm:gap-3')}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className={cn('h-8 w-8 sm:h-9 sm:w-9')}
        >
          <ArrowLeft className={cn('h-4 w-4 sm:h-5 sm:w-5')} />
        </Button>
        <h1 className={cn('font-montserrat text-lg sm:text-xl md:text-2xl font-bold tracking-tight')}>
          Customer Profile
        </h1>
      </div>

      <div className={cn('grid gap-4 sm:gap-6 lg:grid-cols-3')}>
        {/* Left Column: Basic Info */}
        <div className={cn('space-y-4 sm:space-y-6 lg:col-span-1')}>
          <Card className={cn('overflow-hidden border-border')}>
            <div className={cn('h-16 sm:h-20 bg-gradient-to-r from-primary/20 to-accent')} />
            <CardContent className={cn('relative px-4 pb-4 sm:px-6 sm:pb-6 text-center')}>
              <div className={cn('-mt-8 sm:-mt-10 mb-3 sm:mb-4 flex justify-center')}>
                <Avatar className={cn('h-16 w-16 sm:h-20 sm:w-20 shadow-lg ring-4 ring-background')}>
                  {/* <AvatarFallback
                    className={cn(
                      'bg-secondary',
                      'text-xl',
                      'font-bold',
                      'text-secondary-foreground',
                    )}
                  >
                    {getInitials(customer.name)}
                  </AvatarFallback> */}
                  <img src={customer.avatar_url} alt="" className="h-full w-full object-cover"/>
                </Avatar>
              </div>
              <h2 className={cn('text-lg sm:text-xl font-bold')}>{customer.name}</h2>
              <Badge
                variant="outline"
                className={cn('mt-2 text-[10px] font-bold tracking-wider uppercase', customer.status.toLowerCase() === 'active' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700')}
              >
                {customer.status}
              </Badge>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className={cn('border-b pb-2 sm:pb-3')}>
              <CardTitle
                className={cn('text-xs sm:text-sm font-bold tracking-widest text-muted-foreground uppercase')}
              >
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className={cn('pt-2 px-3 sm:px-6')}>
              <InfoRow icon={Mail} label="Email Address" value={customer.email} />
              <InfoRow icon={Phone} label="Phone Number" value={customer.phone || 'N/A'} />
              <InfoRow icon={MapPin} label="Address" value={customer.address || 'N/A'} />
              <InfoRow
                icon={Calendar}
                label="Member Since"
                value={
                  customer.created_at ? new Date(customer.created_at).toLocaleDateString() : 'N/A'
                }
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Statistics */}
        <div className="lg:col-span-2">
          <div className={cn('mb-4 sm:mb-6 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4')}>
            {stats.map((s) => (
              <Card key={s.label} className="border-border">
                <CardContent
                  className={cn('flex flex-col items-center justify-center space-y-1.5 sm:space-y-2 p-3 sm:p-4 text-center')}
                >
                  <div className={cn('rounded-lg p-1.5 sm:p-2', s.color)}>
                    <s.icon size={16} className="sm:size-8" />
                  </div>
                  <p
                    className={cn('text-[9px] sm:text-[10px] font-bold tracking-widest text-muted-foreground uppercase')}
                  >
                    {s.label}
                  </p>
                  <p className={cn('font-montserrat text-xl sm:text-2xl font-bold')}>{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="">
            <h1 className={cn('text-lg sm:text-xl font-bold')}>Ride History</h1>
            <div className={cn('mt-3 sm:mt-4 overflow-x-auto rounded-xl border border-border')}>
              <table className={cn('w-full text-xs sm:text-sm')}>
                <thead className="bg-muted/50">
                  <tr>
                    <th className={cn('px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold')}>#</th>
                    <th className={cn('px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold')}>Pickup</th>
                    <th className={cn('px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold')}>Drop</th>
                    <th className={cn('px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold hidden sm:table-cell')}>Driver</th>
                    <th className={cn('px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold')}>Status</th>
                    <th className={cn('px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold hidden md:table-cell')}>Date</th>
                    <th className={cn('px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold')}>Review</th>
                  </tr>
                </thead>

                <tbody>
                  {customer.requested_rides?.length ? (
                    customer.requested_rides.map((ride, index) => (
                      <tr key={ride.id} className={cn('border-t border-border')}>
                        <td className={cn('px-2 sm:px-4 py-2 sm:py-3')}>{index + 1}</td>

                        <td className={cn('max-w-30 sm:max-w-45 px-2 sm:px-4 py-2 sm:py-3')}>
                          <p className="truncate text-[10px] sm:text-xs">{ride.pickup_location || 'N/A'}</p>
                        </td>

                        <td className={cn('max-w-30 sm:max-w-45 px-2 sm:px-4 py-2 sm:py-3')}>
                          <p className="truncate text-[10px] sm:text-xs">{ride.dropoff_location || 'N/A'}</p>
                        </td>

                        <td className={cn('px-2 sm:px-4 py-2 sm:py-3 hidden sm:table-cell')}>{ride.driver?.name || 'N/A'}</td>

                        <td className={cn('px-2 sm:px-4 py-2 sm:py-3')}>
                          <Badge
                            variant="outline"
                            className={cn('capitalize text-[10px] sm:text-xs', ride.status === 'completed' ? 'border-green-200 bg-green-50 text-green-700' : ride.status.includes('cancel') ? 'border-red-200 bg-red-50 text-red-700' : 'border-amber-200 bg-amber-50 text-amber-700')}
                          >
                            {ride.status.replaceAll('_', ' ')}
                          </Badge>
                        </td>

                        <td className={cn('px-2 sm:px-4 py-2 sm:py-3 hidden md:table-cell')}>
                          {ride.created_at ? new Date(ride.created_at).toLocaleDateString() : 'N/A'}
                        </td>

                        <td align="center">
                          <button
                            onClick={() => {
                              if (!ride.review) return;

                              setSelectedReview(ride.review);
                              setOpenReviewModal(true);
                            }}
                            disabled={!ride.review}
                            className={cn('flex size-7 sm:size-8 items-center justify-center rounded-lg', ride.review ? 'cursor-pointer bg-accent' : 'cursor-not-allowed bg-muted opacity-50')}
                            aria-label="View"
                          >
                            <Eye className={cn('size-3 sm:size-4 text-muted-foreground')} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className={cn('py-10 text-center text-muted-foreground')}
                      >
                        No ride history found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={openReviewModal} onOpenChange={setOpenReviewModal}>
        <DialogContent className={cn('max-w-[95vw] sm:max-w-md')}>
          <DialogHeader>
            <DialogTitle className={cn('text-base sm:text-lg')}>Review Details</DialogTitle>
          </DialogHeader>

          {selectedReview && (
            <div className="space-y-4">
              <div>
                <p className={cn('mb-1 text-[10px] font-bold tracking-widest text-muted-foreground uppercase')}>
                  Rating
                </p>

                <Badge
                  variant="outline"
                  className={cn('border-yellow-200 bg-yellow-50 text-yellow-700')}
                >
                  {selectedReview.rating}/5
                </Badge>
              </div>

              <div>
                <p className={cn('mb-1 text-[10px] font-bold tracking-widest text-muted-foreground uppercase')}>
                  Review Message
                </p>

                <div
                  className={cn('rounded-xl border border-border bg-accent p-4 text-sm leading-6')}
                >
                  {selectedReview.body || 'No review message provided.'}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </Section>
  );
}
