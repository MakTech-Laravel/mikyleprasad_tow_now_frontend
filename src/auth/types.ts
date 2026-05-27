export type AuthUser = {
  id: number;
  avatar_url?: string | null;
  name?: string;
  rating: number;
  username?: string;
  email?: string;
  role?: string;
  roles?: string[];
  phone?: string;
  approval_status?: string;
  is_suspended?: boolean;
  created_at: string;

  review_stats?: {
    total_reviews: number;
    average_rating: number | null;
  };
};
