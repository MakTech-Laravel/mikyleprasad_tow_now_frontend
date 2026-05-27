export type DriverJobStatus = 'pending' | 'active' | 'completed';

export type DriverJob = {
  id: string;
  customerName: string;
  pickup: string;
  dropoff: string;
  vehicle: string;
  status: DriverJobStatus;
  createdAt: string;
};

export const mockDriverJobs: DriverJob[] = [
  {
    id: 'j1',
    customerName: 'Sarah M.',
    pickup: 'Chaguanas interchange',
    dropoff: 'POS ferry terminal',
    vehicle: 'Silver Honda Civic',
    status: 'pending',
    createdAt: '2026-04-28T10:02:00',
  },
  {
    id: 'j2',
    customerName: 'David P.',
    pickup: 'San Fernando High Street',
    dropoff: 'Gulf City',
    vehicle: 'White Toyota Hilux',
    status: 'active',
    createdAt: '2026-04-28T09:40:00',
  },
  {
    id: 'j3',
    customerName: 'Lisa K.',
    pickup: 'Piarco Airport',
    dropoff: 'Westmoorings',
    vehicle: 'Grey Mazda 3',
    status: 'completed',
    createdAt: '2026-04-26T16:00:00',
  },
];

export function jobsByStatus(status: DriverJobStatus) {
  return mockDriverJobs.filter((j) => j.status === status);
}

export function getDriverJob(id: string) {
  return mockDriverJobs.find((j) => j.id === id);
}
