import { useEffect, useState } from 'react';
import { Trash2, MessageSquare } from 'lucide-react';
import { Card } from '@/components/ui/card';
import Section from '@/components/section';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { request } from '@/api/request';
import StarRating from '@/components/star-rating';
import { unwrapPaginated } from '@/api/portalShared';
import { DataPagination } from '@/components/ui/data-pagination';
import { useAuth } from '@/auth/useAuth';

type Review = {
  id: number;
  rating: number;
  body: string;
  created_at: string;

  user?: {
    name: string;
  };

  driver?: {
    name: string;
  };
};

type PaginationMeta = {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
};

export default function ReviewManagement() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [meta, setMeta] = useState<PaginationMeta>({
    currentPage: 1,
    lastPage: 1,
    perPage: 15,
    total: 0,
  });

  const {user} = useAuth();

  const fetchReviews = async (page = 1) => {
    try {
      setIsLoading(true);
      const res = await request.get('/driver/reviews', {
        params: { page },
      });
      const paginated = unwrapPaginated<Review>(res.data);
      setReviews(paginated.data ?? []);
      setMeta({
        currentPage: paginated.meta?.current_page ?? 1,
        lastPage: paginated.meta?.last_page ?? 1,
        perPage: paginated.meta?.per_page ?? 15,
        total: paginated.meta?.total ?? 0,
      });
      console.log(paginated.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handlePageChange = (page: number) => {
    fetchReviews(page);
  };

  return (
    <Section className="p-8 font-inter">
      <div className="mx-auto w-full">
        <Section.Heading title="Review Management" align="left" />

        {!isLoading && (
          <div className="grid grid-cols-1 gap-4">
            {(reviews ?? []).map((item) => (
              <Card
                key={item.id}
                className="flex w-full flex-col gap-3 rounded-xl border-0 bg-[#FFFFFF]/30 px-4 py-4 shadow-sm sm:flex-row sm:items-start sm:gap-4 sm:px-5"
              >
                {/* Top row on mobile: Stars + Actions side by side */}
                <div className="flex items-start justify-between sm:hidden">
                  {/* Stars */}
                  <div className="flex items-center gap-0.5">
                    <StarRating rating={item.rating} size="h-4 w-4" />
                  </div>

                  {/* Actions — top-right on mobile */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 border-gray-200 px-2.5 text-xs font-medium text-[#2F4D58] hover:bg-gray-50"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Reply
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 border-gray-200 px-2.5 text-xs font-medium text-[#2F4D58] hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Left Section */}
                <div className="flex min-w-[130px] flex-col gap-1">
                  <div className="hidden items-center gap-0.5 sm:flex">
                    <StarRating rating={item.rating} size="h-4 w-4" />
                  </div>

                  {/* Name */}
                  <p className="mt-0.5 text-sm leading-tight font-semibold text-gray-900">
                    {item.user?.name || 'Marcus Sterling'}
                  </p>

                  {/* Role */}
                  <p className="text-xs font-medium tracking-wide text-gray-400 uppercase">
                    Customer
                  </p>

                  {/* Date */}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(item.created_at)
                      .toLocaleString('en-US', {
                        month: 'short',
                        day: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })
                      .replace(',', ' •')}
                  </p>
                </div>

                {/* Divider — horizontal on mobile, vertical on desktop */}
                <Separator orientation="horizontal" className="bg-primary/30 sm:hidden" />
                <Separator
                  orientation="vertical"
                  className="mx-3 hidden h-auto self-stretch bg-primary/30 sm:block"
                />

                {/* Middle Section — Driver badge + Review text */}
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                      Driver:
                    </span>
                    <Badge
                      variant="outline"
                      className="rounded-lg border-none bg-primary/30 px-3 py-0.5 text-xs font-medium text-gray-700"
                    >
                      {user?.name || 'Unknown Driver'}
                    </Badge>
                  </div>

                  <p className="text-sm leading-relaxed text-[#2F4D58]">{item.body}</p>
                </div>

                {/* Right Section — Actions (desktop only) */}
                <div className="hidden shrink-0 flex-col gap-2 sm:flex">
                  {/* <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1.5 border-gray-200 text-xs font-medium text-[#2F4D58] hover:bg-gray-50"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Reply
                  </Button> */}
                  {/* <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1.5 border-gray-200 text-xs font-medium text-[#2F4D58] hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button> */}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      {/* Pagination */}
      <div className="mt-4">
        {!isLoading && <DataPagination {...meta} onPageChange={handlePageChange} />}
      </div>
    </Section>
  );
}
