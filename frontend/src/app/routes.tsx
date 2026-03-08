import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { CustomerProtectedRoute } from '@/app/customer-protected-route'
import { LoadingState } from '@/components/shared/loading-state'
import { useAuth } from '@/features/auth/store/auth-context'
import { useVendorAuth } from '@/features/auth/store/vendor-auth-context'
import { AdminLayout } from '@/layouts/admin-layout'
import { CustomerLayout } from '@/layouts/customer-layout'
import { VendorLayout } from '@/layouts/vendor-layout'
import { ForgotPasswordPage } from '@/pages/auth/forgot-password-page'
import { LoginPage } from '@/pages/auth/login-page'
import { ResetPasswordPage } from '@/pages/auth/reset-password-page'
import { AnalyticsPage } from '@/pages/management/analytics-page'
import { ApprovalRequestDetailsPage } from '@/pages/management/approval-request-details-page'
import { ApplicationsPage } from '@/pages/management/applications-page'
import { ApprovalsPage } from '@/pages/management/approvals-page'
import { BranchesPage } from '@/pages/management/branches-page'
import { DashboardPage } from '@/pages/management/dashboard-page'
import { NotificationsPage } from '@/pages/management/notifications-page'
import { PricingPage } from '@/pages/management/pricing-page'
import { SettingsPage } from '@/pages/management/settings-page'
import { VendorsPage } from '@/pages/management/vendors-page'
import { CustomerBookingPreviewPage } from '@/pages/customer/customer-booking-preview-page'
import { CustomerBranchDetailsPage } from '@/pages/customer/customer-branch-details-page'
import { CustomerBranchesPage } from '@/pages/customer/customer-branches-page'
import { CustomerForgotPasswordPage } from '@/pages/customer/customer-forgot-password-page'
import { CustomerHomePage } from '@/pages/customer/customer-home-page'
import { CustomerLoginPage } from '@/pages/customer/customer-login-page'
import { CustomerMyBookingsPage } from '@/pages/customer/customer-my-bookings-page'
import { CustomerProfilePage } from '@/pages/customer/customer-profile-page'
import { CustomerRegisterPage } from '@/pages/customer/customer-register-page'
import { CustomerResetPasswordPage } from '@/pages/customer/customer-reset-password-page'
import { CustomerServiceDetailsPage } from '@/pages/customer/customer-service-details-page'
import { VendorForgotPasswordPage } from '@/pages/vendor/auth/vendor-forgot-password-page'
import { VendorLoginPage } from '@/pages/vendor/auth/vendor-login-page'
import { VendorRegisterPage } from '@/pages/vendor/auth/vendor-register-page'
import { VendorResetPasswordPage } from '@/pages/vendor/auth/vendor-reset-password-page'
import { VendorAvailabilityPage } from '@/pages/vendor/vendor-availability-page'
import { VendorBookingsPage } from '@/pages/vendor/vendor-bookings-page'
import { VendorBranchesPage } from '@/pages/vendor/vendor-branches-page'
import { VendorDashboardPage } from '@/pages/vendor/vendor-dashboard-page'
import { VendorNotificationsPage } from '@/pages/vendor/vendor-notifications-page'
import { VendorRequestsPage } from '@/pages/vendor/vendor-requests-page'
import { VendorServicesPage } from '@/pages/vendor/vendor-services-page'
import { VendorSettingsPage } from '@/pages/vendor/vendor-settings-page'
import { ADMIN_ROUTES, CUSTOMER_ROUTES, LEGACY_ADMIN_ROUTES, ROUTES } from '@/lib/routes'

function RequireAdminAuth() {
  const location = useLocation()
  const { isAuthenticated, isHydrating } = useAuth()

  if (isHydrating) {
    return <LoadingState label="Checking admin session..." />
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={ADMIN_ROUTES.LOGIN}
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }

  return <Outlet />
}

function RequireAdminGuest() {
  const { isAuthenticated, isHydrating } = useAuth()

  if (isHydrating) {
    return <LoadingState label="Checking admin session..." />
  }

  if (isAuthenticated) {
    return <Navigate to={ADMIN_ROUTES.DASHBOARD} replace />
  }

  return <Outlet />
}

function AdminEntryRedirect() {
  const { isAuthenticated, isHydrating } = useAuth()

  if (isHydrating) {
    return <LoadingState label="Checking admin session..." />
  }

  return <Navigate to={isAuthenticated ? ADMIN_ROUTES.DASHBOARD : ADMIN_ROUTES.LOGIN} replace />
}

function RequireVendorAuth() {
  const location = useLocation()
  const { isAuthenticated, isHydrating } = useVendorAuth()

  if (isHydrating) {
    return <LoadingState label="Restoring vendor session..." />
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={ROUTES.VENDOR_LOGIN}
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }

  return <Outlet />
}

function RequireVendorGuest() {
  const { isAuthenticated, isHydrating } = useVendorAuth()

  if (isHydrating) {
    return <LoadingState label="Checking vendor session..." />
  }

  if (isAuthenticated) {
    return <Navigate to={ROUTES.VENDOR_DASHBOARD} replace />
  }

  return <Outlet />
}

function VendorEntryRedirect() {
  const { isAuthenticated, isHydrating } = useVendorAuth()

  if (isHydrating) {
    return <LoadingState label="Checking vendor session..." />
  }

  return <Navigate to={isAuthenticated ? ROUTES.VENDOR_DASHBOARD : ROUTES.VENDOR_LOGIN} replace />
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<CustomerLayout />}>
        <Route path={CUSTOMER_ROUTES.HOME} element={<CustomerHomePage />} />
        <Route path={CUSTOMER_ROUTES.LOGIN} element={<CustomerLoginPage />} />
        <Route path={CUSTOMER_ROUTES.REGISTER} element={<CustomerRegisterPage />} />
        <Route path={CUSTOMER_ROUTES.FORGOT_PASSWORD} element={<CustomerForgotPasswordPage />} />
        <Route path={CUSTOMER_ROUTES.RESET_PASSWORD} element={<CustomerResetPasswordPage />} />
        <Route path={CUSTOMER_ROUTES.SERVICE_DETAILS} element={<CustomerServiceDetailsPage />} />
        <Route path={CUSTOMER_ROUTES.BRANCHES} element={<CustomerBranchesPage />} />
        <Route path={CUSTOMER_ROUTES.BRANCH_DETAILS} element={<CustomerBranchDetailsPage />} />
        <Route path={CUSTOMER_ROUTES.BOOKING_PREVIEW} element={<CustomerBookingPreviewPage />} />
        <Route
          path={CUSTOMER_ROUTES.MY_BOOKINGS}
          element={
            <CustomerProtectedRoute>
              <CustomerMyBookingsPage />
            </CustomerProtectedRoute>
          }
        />
        <Route
          path={CUSTOMER_ROUTES.PROFILE}
          element={
            <CustomerProtectedRoute>
              <CustomerProfilePage />
            </CustomerProtectedRoute>
          }
        />
      </Route>

      <Route path="/vendor">
        <Route index element={<VendorEntryRedirect />} />
        <Route element={<RequireVendorGuest />}>
          <Route path="login" element={<VendorLoginPage />} />
          <Route path="register" element={<VendorRegisterPage />} />
          <Route path="forgot-password" element={<VendorForgotPasswordPage />} />
          <Route path="reset-password" element={<VendorResetPasswordPage />} />
        </Route>
        <Route element={<RequireVendorAuth />}>
          <Route element={<VendorLayout />}>
            <Route path="dashboard" element={<VendorDashboardPage />} />
            <Route path="branches" element={<VendorBranchesPage />} />
            <Route path="services" element={<VendorServicesPage />} />
            <Route path="availability" element={<VendorAvailabilityPage />} />
            <Route path="bookings" element={<VendorBookingsPage />} />
            <Route path="requests" element={<VendorRequestsPage />} />
            <Route path="notifications" element={<VendorNotificationsPage />} />
            <Route path="settings" element={<VendorSettingsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<VendorEntryRedirect />} />
      </Route>

      <Route path="/admin">
        <Route index element={<AdminEntryRedirect />} />
        <Route element={<RequireAdminGuest />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
        </Route>
        <Route element={<RequireAdminAuth />}>
          <Route element={<AdminLayout />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="branches" element={<BranchesPage />} />
            <Route path="vendors" element={<VendorsPage />} />
            <Route path="pricing" element={<PricingPage />} />
            <Route path="approvals" element={<ApprovalsPage />} />
            <Route path="approvals/:id" element={<ApprovalRequestDetailsPage />} />
            <Route path="applications" element={<ApplicationsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<AdminEntryRedirect />} />
      </Route>

      {/* Legacy unscoped admin paths still used in helpers/integrations.
          '/branches' intentionally remains customer/public and is not redirected. */}
      <Route
        path={LEGACY_ADMIN_ROUTES.DASHBOARD}
        element={<Navigate to={ADMIN_ROUTES.DASHBOARD} replace />}
      />
      <Route
        path={LEGACY_ADMIN_ROUTES.ANALYTICS}
        element={<Navigate to={ADMIN_ROUTES.ANALYTICS} replace />}
      />
      <Route
        path={LEGACY_ADMIN_ROUTES.VENDORS}
        element={<Navigate to={ADMIN_ROUTES.VENDORS} replace />}
      />
      <Route
        path={LEGACY_ADMIN_ROUTES.PRICING}
        element={<Navigate to={ADMIN_ROUTES.PRICING} replace />}
      />
      <Route
        path={LEGACY_ADMIN_ROUTES.APPROVALS}
        element={<Navigate to={ADMIN_ROUTES.APPROVALS} replace />}
      />
      <Route
        path={LEGACY_ADMIN_ROUTES.APPLICATIONS}
        element={<Navigate to={ADMIN_ROUTES.APPLICATIONS} replace />}
      />
      <Route
        path={LEGACY_ADMIN_ROUTES.NOTIFICATIONS}
        element={<Navigate to={ADMIN_ROUTES.NOTIFICATIONS} replace />}
      />
      <Route
        path={LEGACY_ADMIN_ROUTES.SETTINGS}
        element={<Navigate to={ADMIN_ROUTES.SETTINGS} replace />}
      />

      <Route path="*" element={<Navigate to={CUSTOMER_ROUTES.HOME} replace />} />
    </Routes>
  )
}
