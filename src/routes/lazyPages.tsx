import { lazy } from 'react';

/** Route-level code splitting — keep shell/layout imports eager in `router.tsx`. */
export const Home = lazy(() => import('@/pages/frontend/Home'));
export const NotFound = lazy(() => import('@/pages/NotFound'));
export const Unauthorized = lazy(() => import('@/pages/Unauthorized'));
export const Login = lazy(() => import('@/pages/auth/Login'));
export const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
export const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));
export const TwoFactorChallengePage = lazy(() => import('@/pages/auth/TwoFactorChallengePage'));

export const UserDashboard = lazy(() => import('@/pages/user/UserDashboard'));
export const UserRideHistoryPage = lazy(() => import('@/pages/user/UserRideHistoryPage'));
export const UserRideDetailPage = lazy(() => import('@/pages/user/UserRideDetailPage'));
export const LiveRideTrackPage = lazy(() => import('@/pages/user/LiveRideTrackPage'));
export const ProfileInfo = lazy(() => import('@/pages/user/ProfileInfo'));
export const UserNotificationsPage = lazy(() => import('@/pages/user/UserNotificationsPage'));
export const UserNotificationDetailPage = lazy(() => import('@/pages/user/UserNotificationDetailPage'));

export const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
export const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'));
export const AdminRidesPage = lazy(() => import('@/pages/admin/AdminRidesPage'));
export const AdminDriversPage = lazy(() => import('@/pages/admin/AdminDriversPage'));
export const AdminCustomersPage = lazy(() => import('@/pages/admin/AdminCustomersPage'));
export const AdminReviewsPage = lazy(() => import('@/pages/admin/AdminReviewsPage'));
export const AdminNotificationsPage = lazy(() => import('@/pages/admin/AdminNotificationsPage'));
export const AdminSettingsPage = lazy(() => import('@/pages/admin/AdminSettingsPage'));
export const AdminDriverDetailPage = lazy(() => import('@/pages/admin/AdminDriverDetailPage'));
export const AdminNotificationDetailPage = lazy(() => import('@/pages/admin/AdminNotificationDetailPage'));
export const AdminContactQueriesPage = lazy(() => import('@/pages/admin/AdminContactQueriesPage'));
export const AdminCustomerDetailsPage = lazy(() => import('@/pages/admin/AdminCustomerDetailsPage'));




export const FindDriversPage = lazy(() => import('@/pages/frontend/FindDriversPage'));
export const DriverProfilePage = lazy(() => import('@/pages/frontend/DriverProfilePage'));
export const RequestServicePage = lazy(() => import('@/pages/frontend/RequestServicePage'));
export const DriverRideDetail = lazy(() => import('@/pages/driver/DriverRideDetail'));
export const RequestWaitingPage = lazy(() => import('@/pages/user/RequestWaitingPage'));
export const RequestAcceptedPage = lazy(() => import('@/pages/user/RequestAcceptedPage'));
export const TrackingServicePage = lazy(() => import('@/pages/user/TrackingServicePage'));
export const ServiceCompletedPage = lazy(() => import('@/pages/user/ServiceCompletedPage'));
export const RateExperiencePage = lazy(() => import('@/pages/user/RateExperiencePage'));
export const ReviewSubmittedPage = lazy(() => import('@/pages/user/ReviewSubmittedPage'));
export const MessagesPage = lazy(() => import('@/pages/user/MessagesPage'));
export const TermsPage = lazy(() => import('@/pages/frontend/TermsPage'));
export const PrivacyPage = lazy(() => import('@/pages/frontend/PrivacyPage'));
export const ContactPage = lazy(() => import('@/pages/frontend/ContactPage'));
/* ===== FIREBASE-DISABLED START (docs/FIREBASE_DISABLE_AND_RESTORE.md) =====
export const FcmTokenDebugPage = lazy(() => import('@/pages/demo/FcmTokenDebugPage'));
export const FcmSendDemoPage = lazy(() => import('@/pages/demo/FcmSendDemoPage'));
===== FIREBASE-DISABLED END ===== */

export const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
export const RegisterOperatorPage = lazy(() => import('@/pages/auth/SelectOperatorPage'));
export const DriverRegisterPage = lazy(() => import('@/pages/auth/DriverRegisterPage'));
export const OtpVerificationPage = lazy(() => import('@/pages/auth/OtpVerificationPage'));

export const DriverDashboardPage = lazy(() => import('@/pages/driver/DriverDashboardPage'));
export const DriverDashboardBookingsPage = lazy(() => import('@/pages/driver/DriverDashboardBookingsPage'));
export const DriverPendingRidesPage = lazy(() => import('@/pages/driver/DriverPendingRidesPage'));
export const DriverActiveRidesPage = lazy(() => import('@/pages/driver/DriverActiveRidesPage'));
export const DriverActiveRideDetailPage = lazy(() => import('@/pages/driver/DriverRideDetail'));
export const DriverCompletedRidesPage = lazy(() => import('@/pages/driver/DriverCompletedRidesPage'));
export const DriverMessagesPage = lazy(() => import('@/pages/driver/DriverMessagesPage'));
export const DriverNotificationsPage = lazy(() => import('@/pages/driver/DriverNotificationsPage'));
export const DriverNotificationDetailPage = lazy(() => import('@/pages/driver/DriverNotificationDetailPage'));
export const DriverSettingsPage = lazy(() => import('@/pages/driver/DriverSettingsPage'));
export const DriverAppProfilePage = lazy(() => import('@/pages/driver/DriverAppProfilePage'));
export const DriverVehiclePage = lazy(() => import('@/pages/driver/DriverVehiclePage'));
export const DriverAccountApprovalPage = lazy(() => import('@/pages/driver/DriverAccountApprovalPage'));
export const DriverOnboardingWaitingPage = lazy(
  () => import('@/pages/driver/DriverOnboardingWaitingPage'),
);
export const DriverReviewPage = lazy(() => import('@/pages/driver/DriverReviewPage'));
