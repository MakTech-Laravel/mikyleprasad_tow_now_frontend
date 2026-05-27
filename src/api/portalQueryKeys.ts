export const portalQueryKeys = {
  notifications: {
    list: (params?: { page?: number; per_page?: number }) =>
      [
        'notifications',
        'list',
        params?.page ?? 1,
        params?.per_page ?? 50,
      ] as const,
    detail: (id: number | string) => ['notifications', 'detail', id] as const,
  },
  driverDashboard: ['driver', 'dashboard'] as const,
  driverRides: (params: unknown) => ['driver', 'rides', params] as const,
  userDashboard: ['user', 'dashboard'] as const,
  userRides: (params: unknown) => ['user', 'rides', params] as const,
  adminDashboard: ['admin', 'dashboard'] as const,
  adminRides: (params: unknown) => ['admin', 'rides', params] as const,
  adminDrivers: (params: unknown) => ['admin', 'drivers', params] as const,
  adminCustomers: (params: unknown) => ['admin', 'customers', params] as const,
  adminReviews: (params: unknown) => ['admin', 'reviews', params] as const,
  adminContactQueries: (params: unknown) => ['admin', 'contact-queries', params] as const,
};
