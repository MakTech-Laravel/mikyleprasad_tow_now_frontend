/**
 * Route map (high level)
 * - Public (FrontendLayout): /, /find-drivers, /driver/:id, booking flow, /messages/:driverId, legal, /contact-us, /cart, /demo/*
 * - Auth (AuthLayout + GuestGate where noted): /login, /forgot-password, /reset-password, /two-factor-challenge, /register, /verify-otp
 * - User (RoleGate user|buyer + UserLayout): /dashboard, /rides, /rides/:rideId, /notifications, /notifications/:id, /profile
 * - Driver (RoleGate driver + DriverLayout): /driver-app/*
 * - Admin (RoleGate admin + AdminLayout): /admin, /admin/rides, /admin/drivers, /admin/customers, /admin/reviews, /admin/notifications, /admin/settings, /admin/users
 *
 * Page modules are lazy-loaded from `./lazyPages` (see `AppBootstrap` Suspense).
 */
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';

import { DriverApprovalRedirectListener } from '@/components/auth/DriverApprovalRedirectListener';
import { FcmRideEventBridge } from '@/components/fcm/FcmRideEventBridge';
import { FrontendLayout } from '@/layouts/frontend/FrontendLayout';
import { AuthLayout } from '@/layouts/auth/AuthLayout';
import { AdminLayout } from '@/layouts/admin/AdminLayout';
import { UserLayout } from '@/layouts/user/UserLayout';
import { DriverLayout } from '@/layouts/driver/DriverLayout';

// import { RoleGate } from '@/routes/RoleGate';
import { GuestGate } from '@/routes/GuestGate';
import { RouteErrorBoundary } from '@/components/error/RouteErrorBoundary';
import ChatRoom from '@/demo/ChatRoom';
import { RoleGate } from './RoleGate';
import { DriverApprovedGate } from './DriverApprovedGate';
import { ProtectedRoute } from './ProtectedRoute';
import RegisterOtpVerificationPage from '@/pages/auth/RegisterOtpVerificationPage';
import AdminRidesDetailPage from '@/pages/admin/AdminRidesDetailPage';

import {
  AdminCustomersPage,
  AdminDashboard,
  AdminDriversPage,
  AdminNotificationsPage,
  AdminReviewsPage,
  AdminRidesPage,
  AdminSettingsPage,
  AdminUsers,
  ContactPage,
  FcmTokenDebugPage,
  FcmSendDemoPage,
  DriverOnboardingWaitingPage,
  DriverActiveRidesPage,
  DriverAppProfilePage,
  DriverCompletedRidesPage,
  DriverDashboardPage,
  DriverMessagesPage,
  DriverNotificationsPage,
  DriverPendingRidesPage,
  DriverProfilePage,
  DriverSettingsPage,
  DriverVehiclePage,
  FindDriversPage,
  Home,
  Login,
  ForgotPasswordPage,
  ResetPasswordPage,
  TwoFactorChallengePage,
  MessagesPage,
  NotFound,
  OtpVerificationPage,
  PrivacyPage,
  RateExperiencePage,
  RegisterOperatorPage,
  RegisterPage,
  RequestAcceptedPage,
  RequestServicePage,
  RequestWaitingPage,
  ReviewSubmittedPage,
  ServiceCompletedPage,
  TermsPage,
  TrackingServicePage,
  Unauthorized,
  UserDashboard,
  UserRideDetailPage,
  LiveRideTrackPage,
  UserRideHistoryPage,
  ProfileInfo,
  UserNotificationsPage,
  UserNotificationDetailPage,
  AdminNotificationDetailPage,
  DriverNotificationDetailPage,
  DriverDashboardBookingsPage,
  DriverRideDetail,
  DriverReviewPage,
  AdminDriverDetailPage,
  AdminContactQueriesPage,
  AdminCustomerDetailsPage,
} from '@/routes/lazyPages';

export const router = createBrowserRouter([
  {
    element: (
      <>
        <FcmRideEventBridge />
        <DriverApprovalRedirectListener />
        <Outlet />
      </>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: (
          <GuestGate>
            <AuthLayout />
          </GuestGate>
        ),
        children: [
          {
            path: '/login',
            element: <Login />,
          },
          {
            path: '/forgot-password',
            element: <ForgotPasswordPage />,
          },
          {
            path: '/reset-password',
            element: <ResetPasswordPage />,
          },
          {
            path: '/two-factor-challenge',
            element: <TwoFactorChallengePage />,
          },
          {
            path: '/register',
            element: <RegisterPage />,
          },
          {
            path: '/select-operator',
            element: <RegisterOperatorPage />,
          },
          {
            path: '/verify-otp',
            element: <OtpVerificationPage />,
          },
          {
            path: '/register-verify-otp',
            element: <RegisterOtpVerificationPage />,
          },
        ],
      },
      {
        element: <FrontendLayout />,
        children: [
          { path: '/', element: <Home /> },
          { path: '/find-drivers', element: <FindDriversPage /> },
          { path: '/driver/:id', element: <DriverProfilePage /> },
          { path: '/request-service/:driverId', element: <RequestServicePage /> },
          { path: '/terms', element: <TermsPage /> },
          { path: '/privacy', element: <PrivacyPage /> },
          { path: '/contact-us', element: <ContactPage /> },
          { path: '/demo/chat-room', element: <ChatRoom conversationId="1" /> },
          { path: '/demo/fcm-token', element: <FcmTokenDebugPage /> },
          { path: '/demo/fcm-send', element: <FcmSendDemoPage /> },
        ],
      },
      {
        element: (
          <ProtectedRoute>
            <FrontendLayout />
          </ProtectedRoute>
        ),
        children: [{ path: '/driver-onboarding', element: <DriverOnboardingWaitingPage /> }],
      },

      {
        element: (
          <RoleGate allow={['user']} fallback="/unauthorized">
            <FrontendLayout />
          </RoleGate>
        ),
        children: [
          { path: '/request-waiting', element: <RequestWaitingPage /> },
          { path: '/request-accepted', element: <RequestAcceptedPage /> },
          { path: '/tracking-service', element: <TrackingServicePage /> },
          { path: '/service-completed', element: <ServiceCompletedPage /> },
          { path: '/rate-experience/:rideId', element: <RateExperiencePage /> },
          { path: '/review-submitted', element: <ReviewSubmittedPage /> },
          { path: '/messages/:conversationId', element: <MessagesPage /> },
          {
            element: <UserLayout />,
            children: [
              { path: '/dashboard', element: <UserDashboard /> },
              { path: '/rides', element: <UserRideHistoryPage /> },
              { path: '/rides/:rideId/live', element: <LiveRideTrackPage /> },
              { path: '/rides/:rideId', element: <UserRideDetailPage /> },
              { path: '/profile', element: <ProfileInfo /> },
              { path: '/notifications', element: <UserNotificationsPage /> },
              { path: '/notifications/:id', element: <UserNotificationDetailPage /> },
            ],
          },
        ],
      },
      {
        element: (
          <RoleGate allow="driver" fallback="/unauthorized">
            <DriverApprovedGate>
              <DriverLayout />
            </DriverApprovedGate>
          </RoleGate>
        ),
        children: [
          { path: '/driver-app', element: <DriverDashboardPage /> },
          { path: '/driver-app/bookings', element: <DriverDashboardBookingsPage /> },
          {
            path: '/driver-app/rides',
            element: <Navigate to="/driver-app/rides/pending" replace />,
          },
          { path: '/driver-app/rides/pending', element: <DriverPendingRidesPage /> },
          { path: '/driver-app/rides/active', element: <DriverActiveRidesPage /> },
          {
            path: '/driver-app/bookings/messages/:conversationId',
            element: <DriverMessagesPage />,
          },
          { path: '/driver-app/rides/completed', element: <DriverCompletedRidesPage /> },
          { path: '/driver-app/rides/detail/:rideId', element: <DriverRideDetail /> },
          { path: '/driver-app/notifications', element: <DriverNotificationsPage /> },
          { path: '/driver-app/notifications/:id', element: <DriverNotificationDetailPage /> },

          { path: '/driver-app/settings', element: <DriverSettingsPage /> },
          { path: '/driver-app/profile', element: <DriverAppProfilePage /> },
          { path: '/driver-app/vehicle/:vehicleId', element: <DriverVehiclePage /> },
          { path: '/driver-app/approval', element: <Navigate to="/driver-onboarding" replace /> },

          { path: '/driver-app/review', element: <DriverReviewPage /> },
        ],
      },
      {
        element: (
          <RoleGate allow="admin" fallback="/unauthorized">
            <AdminLayout />
          </RoleGate>
        ),
        children: [
          { path: '/admin', element: <AdminDashboard /> },
          { path: '/admin/rides', element: <AdminRidesPage /> },

          { path: '/admin/drivers', element: <AdminDriversPage /> },
          { path: '/admin/drivers/detail/:driverid', element: <AdminDriverDetailPage /> },
          { path: '/admin/customers', element: <AdminCustomersPage /> },
          { path: '/admin/reviews', element: <AdminReviewsPage /> },
          { path: '/admin/notifications', element: <AdminNotificationsPage /> },
          { path: '/admin/notifications/:id', element: <AdminNotificationDetailPage /> },
          { path: '/admin/settings', element: <AdminSettingsPage /> },
          { path: '/admin/users', element: <AdminUsers /> },
          { path: '/admin/rides/detail/:rideId', element: <AdminRidesDetailPage /> },
          { path: '/admin/customers/detail/:customerId', element: <AdminCustomerDetailsPage /> },
          { path: '/admin/contact-queries', element: <AdminContactQueriesPage /> },
        ],
      },

      // end: Remove after testing
      {
        path: '/unauthorized',
        element: <Unauthorized />,
      },

      // start: Uncomment after testing
      // {
      //   element: (
      //     <RoleGate allow="driver" fallback="/unauthorized">
      //       <DriverLayout />
      //     </RoleGate>
      //   ),
      //   children: [
      //     { path: '/driver-app', element: <DriverDashboardPage /> },
      //     { path: '/driver-app/rides/pending', element: <DriverPendingRidesPage /> },
      //     { path: '/driver-app/rides/active', element: <DriverActiveRidesPage /> },
      //     { path: '/driver-app/rides/active/:jobId', element: <DriverActiveRideDetailPage /> },
      //     { path: '/driver-app/rides/completed', element: <DriverCompletedRidesPage /> },
      //     { path: '/driver-app/messages', element: <DriverMessagesPage /> },
      //     { path: '/driver-app/notifications', element: <DriverNotificationsPage /> },
      //     { path: '/driver-app/settings', element: <DriverSettingsPage /> },
      //     { path: '/driver-app/profile', element: <DriverAppProfilePage /> },
      //     { path: '/driver-app/vehicle', element: <DriverVehiclePage /> },
      //     { path: '/driver-app/approval', element: <DriverAccountApprovalPage /> },
      //   ],
      // },
      // {
      //   element: (
      //     <RoleGate allow="admin" fallback="/login">
      //       <AdminLayout />
      //     </RoleGate>
      //   ),
      //   children: [
      //     { path: '/admin', element: <AdminDashboard /> },
      //     { path: '/admin/rides', element: <AdminRidesPage /> },
      //     { path: '/admin/drivers', element: <AdminDriversPage /> },
      //     { path: '/admin/customers', element: <AdminCustomersPage /> },
      //     { path: '/admin/reviews', element: <AdminReviewsPage /> },
      //     { path: '/admin/notifications', element: <AdminNotificationsPage /> },
      //     { path: '/admin/settings', element: <AdminSettingsPage /> },
      //     { path: '/admin/users', element: <AdminUsers /> },
      //   ],
      // },

      // end: Uncomment after testing
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
]);
