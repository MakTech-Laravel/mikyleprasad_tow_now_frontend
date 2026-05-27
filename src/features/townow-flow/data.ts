import type {
  Driver,
  LiveUpdate,
  MessageItem,
  ReviewTag,
  TrackingStep,
} from '@/features/townow-flow/types';
import { api } from '@/api/client';

/**
 * Fetch drivers from API
 */
export async function fetchDrivers(): Promise<Driver[]> {
  try {
    const response = await api.get('/drivers/find');
    const drivers = response.data.data || response.data;
    return drivers || [];
  } catch (error) {
    console.error('Failed to fetch drivers:', error);
    return [];
  }
}

/**
 * Fetch a specific driver by ID from the API
 */
export async function fetchDriver(id: number): Promise<Driver | null> {
  try {
    const response = await api.get(`/drivers/${id}`);
    const driver = response.data.data || response.data;
    return driver || null;
  } catch (error) {
    console.error(`Failed to fetch driver ${id}:`, error);
    return null;
  }
}

export const reviewTags: ReviewTag[] = [
  'Professional',
  'On Time',
  'Careful Handling',
  'Fair Pricing',
  'Friendly',
  'Clean Vehicle',
];

export const messages: MessageItem[] = [
  { id: 1, side: 'left', text: "Hi! I'm on my way to pick up your vehicle", time: '10:30 AM' },
  { id: 2, side: 'right', text: 'Great! How long will it take?', time: '10:31 AM' },
  {
    id: 3,
    side: 'left',
    text: "I'll be there in about 10 minutes. Traffic is light",
    time: '10:32 AM',
  },
  { id: 4, side: 'right', text: "Perfect, I'll be waiting outside", time: '10:33 AM' },
  { id: 5, side: 'left', text: "I'm 5 minutes away from your location", time: '10:37 AM' },
];

export const trackingSteps: TrackingStep[] = [
  { id: 1, label: 'Request Received', status: 'done' },
  { id: 2, label: 'En Route', status: 'active' },
  { id: 3, label: 'Arrived', status: 'pending' },
  { id: 4, label: 'Completed', status: 'pending' },
];

export const liveUpdates: LiveUpdate[] = [
  { id: 1, text: 'Request received and accepted', time: '2:35 PM' },
  { id: 2, text: 'Driver is on the way to your location', time: '2:38 PM' },
  { id: 3, text: 'Driver is nearby your location', time: '2:45 PM' },
  {
    id: 4,
    text: 'Driver is en route to your location...',
    time: 'Updating in real-time',
    active: true,
  },
];

export const termsSections: { title: string; contents: string[] }[] = [
  {
    title: 'Platform Role',
    contents: [
      'towtrucktt.com is an independent digital directory and facilitator. We connect users with third-party tow truck operators. We do not provide towing services or employ drivers.',
      'We are not responsible for the privacy practices of third-party service providers.',
    ] as const,
  },
  {
    title: 'User Responsibilities',
    contents: [
      'By using the platform, you agree to provide accurate information, communicate respectfully with drivers, verify driver credentials independently, and agree on pricing directly with service providers.',
      'You are responsible for maintaining account security and all activity performed under your account.',
    ] as const,
  },
  {
    title: 'Driver Responsibility',
    contents: [
      'All services are provided by independent operators. towtrucktt.com is not responsible for service quality, delays, damages, or pricing disputes.',
      'We are not responsible for the privacy practices of third-party service providers.',
    ] as const,
  },
  {
    title: 'Payments',
    contents: [
      'All payments are handled directly between users and drivers. We do not process or manage payments.',
      'We are not responsible for the privacy practices of third-party service providers.',
    ] as const,
  },
  {
    title: 'Limitation of Liability',
    contents: [
      'towtrucktt.com is not liable for any loss, damage, or issue arising from services provided by third-party operators.',
      'We are not responsible for the privacy practices of third-party service providers.',
    ] as const,
  },
  {
    title: 'Account Usage',
    contents: [
      'You are responsible for maintaining account security and all activity performed under your account.',
      'We are not responsible for the privacy practices of third-party service providers.',
    ] as const,
  },
  {
    title: 'Suspension or Termination',
    contents: [
      'We reserve the right to suspend or terminate accounts that violate these terms.',
      'We are not responsible for the privacy practices of third-party service providers.',
    ] as const,
  },
  {
    title: 'Modifications',
    contents: [
      'We may update these Terms at any time. Continued use of the platform means you accept the updated terms.',
      'We are not responsible for the privacy practices of third-party service providers.',
    ] as const,
  },
  {
    title: 'Governing Law',
    contents: [
      'These terms are governed by the laws of Trinidad and Tobago.',
      'We are not responsible for the privacy practices of third-party service providers.',
    ] as const,
  },
  {
    title: 'Contact',
    contents: [
      'For inquiries, contact us at: dummy@mail.com',
      'We are not responsible for the privacy practices of third-party service providers.',
    ] as const,
  },
] as const;

// export const privacySections = [
//   [
//     'Information We Collect',
//     'We may collect the following types of information\: Personal information (name, phone number, email address\) Usage data (pages visited, actions taken on the platform\) Communication data (messages between users and drivers)',
//   ],
//   [
//     'How We Use Your Information',
//     'We use information to connect you with drivers, facilitate service requests, improve platform experience, and send request-related notifications.',
//   ],
//   [
//     'Sharing of Information',
//     'We may share data with independent drivers and service providers required for hosting and notifications. We do not sell personal data to third parties.',
//   ],
//   [
//     'Third-Party Services',
//     'Our platform connects you with independent service providers. We are not responsible for third-party data handling after data is shared.',
//   ],
//   [
//     'Data Security',
//     'We use reasonable measures to protect data, but no system is completely secure.',
//   ],
//   [
//     'Cookies & Tracking',
//     'Cookies may be used to improve user experience and analyze usage patterns.',
//   ],
//   [
//     'Changes to This Policy',
//     'This Privacy Policy may be updated from time to time. Continued platform use means acceptance of updates.',
//   ],
//   ['Contact Us', 'If you have questions, contact us at: dummy@mail.com'],
// ] as const;

export const privacySections = [
  {
    title: 'Information We Collect',
    contents: [
      'Personal information (name, phone number, email address)',
      'Usage data (pages visited, actions taken on the platform)',
      'Communication data (messages between users and drivers)',
    ] as const,
  },
  {
    title: 'How We Use Your Information',
    contents: [
      'We use information to connect you with drivers, facilitate service requests, improve platform experience, and send request-related notifications.',
      'We may also use your information to send you marketing communications, but you can opt out of these at any time.',
    ] as const,
  },
  {
    title: 'Sharing of Information',
    contents: [
      'We may share data with independent drivers and service providers required for hosting and notifications. We do not sell personal data to third parties.',
      'We may also share your information with third-party service providers who help us operate the platform and provide services to you.',
    ] as const,
  },
  {
    title: 'Third-Party Services',
    contents: [
      'Our platform connects you with independent service providers. We are not responsible for third-party data handling after data is shared.',
      'We are not responsible for the privacy practices of third-party service providers.',
    ] as const,
  },
  {
    title: 'Data Security',
    contents: [
      'We use reasonable measures to protect data, but no system is completely secure.',
      'We do not guarantee the security of your information.',
    ] as const,
  },
  {
    title: 'Cookies & Tracking',
    contents: [
      'Cookies may be used to improve user experience and analyze usage patterns.',
      'You can disable cookies in your browser settings.',
    ] as const,
  },
  {
    title: 'Changes to This Policy',
    contents: [
      'This Privacy Policy may be updated from time to time. Continued platform use means acceptance of updates.',
      'We will notify you of any changes to this Privacy Policy.',
    ] as const,
  },
  {
    title: 'Contact Us',
    contents: [
      'If you have questions, contact us at: dummy@mail.com',
      'You can also contact us by phone at: 868-789-0123',
      'You can also contact us by email at: dummy@mail.com',
      'You can also contact us by mail at: 123 Main St, Anytown, USA',
      'You can also contact us by fax at: 868-789-0123',
      'You can also contact us by text at: 868-789-0123',
      'You can also contact us by social media at: @towtrucktt',
      'You can also contact us by website at: www.towtrucktt.com',
    ] as const,
  },
] as const;
