export type Driver = {
  id: number;
  initials: string;
  name: string;
  rating: number;
  reviews: number;
  location: string;
  status: 'Online' | 'Offline';
  responseTime: string;
  pricing: string;
  vehicle: string;
  licensePlate: string;
  maxCapacity: string;
  truck_image_url: string;
  insurance: 'ACTIVE' | 'EXPIRED';
  experience: string;
  phoneNumber?: string;
  avatar_url?: string;
  review: DriverReview[];
  totalRides?: number;
  completedRides?: number;
  canceledRides?: number;
  review_list: DriverReview[];
};

export type ReviewTag =
  | 'Professional'
  | 'On Time'
  | 'Careful Handling'
  | 'Fair Pricing'
  | 'Friendly'
  | 'Clean Vehicle';

export type MessageItem = {
  id: number;
  side: 'left' | 'right';
  text: string;
  time: string;
};

export type TrackingStep = {
  id: number;
  label: string;
  status: 'done' | 'active' | 'pending';
};

export type LiveUpdate = {
  id: number;
  text: string;
  time: string;
  active?: boolean;
};

export type DriverReview = {
  id: number;
  rating: number;
  body: string;
  created_at: string;
  user?: {
    name?: string;
    avatar_url?: string;
  };
};
