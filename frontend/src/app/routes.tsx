import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { AdminLayout } from '@/layouts/admin-layout'
import { VendorLayout } from '@/layouts/vendor-layout'
import { LoadingState } from '@/components/shared/loading-state'
import { useAuth } from '@/features/auth/store/auth-context'
import { hasVendorSession } from '@/features/auth/store/vendor-session'
import { ForgotPasswordPage } from '@/pages/auth/forgot-password-page'
import { LoginPage } from '@/pages/auth/login-page'
import { AnalyticsPage } from '@/pages/management/analytics-page'
import { ApplicationsPage } from '@/pages/management/applications-page'
import { ApprovalsPage } from '@/pages/management/approvals-page'
import { BranchesPage } from '@/pages/management/branches-page'
import { DashboardPage } from '@/pages/management/dashboard-page'
import { NotificationsPage } from '@/pages/management/notifications-page'
import { PricingPage } from '@/pages/management/pricing-page'
import { SettingsPage } from '@/pages/management/settings-page'
import { VendorsPage } from '@/pages/management/vendors-page'
import { VendorForgotPasswordPage } from '@/pages/vendor/auth/vendor-forgot-password-page'
import { VendorLoginPage } from '@/pages/vendor/auth/vendor-login-page'
import { VendorAvailabilityPage } from '@/pages/vendor/vendor-availability-page'
import { VendorBookingsPage } from '@/pages/vendor/vendor-bookings-page'
import { VendorBranchesPage } from '@/pages/vendor/vendor-branches-page'
import { VendorDashboardPage } from '@/pages/vendor/vendor-dashboard-page'
import { VendorNotificationsPage } from '@/pages/vendor/vendor-notifications-page'
import { VendorRequestsPage } from '@/pages/vendor/vendor-requests-page'
import { VendorServicesPage } from '@/pages/vendor/vendor-services-page'
import { VendorSettingsPage } from '@/pages/vendor/vendor-settings-page'
import { ROUTES } from '@/lib/routes'

function RequireAdminAuth() {
  const { isAuthenticated, isHydrating } = useAuth()
  const location = useLocation()

  if (isHydrating) {
    return <LoadingState label="Checking session..." />
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

function RequireVendorAuth() {
  const location = useLocation()

  if (!hasVendorSession()) {
    return <Navigate to={ROUTES.VENDOR_LOGIN} replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

function RequireVendorGuest() {
  if (hasVendorSession()) {
    return <Navigate to={ROUTES.VENDOR_DASHBOARD} replace />
  }

  return <Outlet />
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
      <Route element={<RequireVendorGuest />}>
        <Route path={ROUTES.VENDOR_LOGIN} element={<VendorLoginPage />} />
        <Route path={ROUTES.VENDOR_FORGOT_PASSWORD} element={<VendorForgotPasswordPage />} />
      </Route>
      <Route
        path="/vendor"
        element={
          <Navigate
            to={hasVendorSession() ? ROUTES.VENDOR_DASHBOARD : ROUTES.VENDOR_LOGIN}
            replace
          />
        }
      />

      <Route element={<RequireAdminAuth />}>
        <Route element={<AdminLayout />}>
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
          <Route path={ROUTES.ANALYTICS} element={<AnalyticsPage />} />
          <Route path={ROUTES.BRANCHES} element={<BranchesPage />} />
          <Route path={ROUTES.VENDORS} element={<VendorsPage />} />
          <Route path={ROUTES.PRICING} element={<PricingPage />} />
          <Route path={ROUTES.APPROVALS} element={<ApprovalsPage />} />
          <Route path={ROUTES.APPLICATIONS} element={<ApplicationsPage />} />
          <Route path={ROUTES.NOTIFICATIONS} element={<NotificationsPage />} />
          <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
        </Route>
      </Route>

      <Route element={<RequireVendorAuth />}>
        <Route element={<VendorLayout />}>
          <Route path={ROUTES.VENDOR_DASHBOARD} element={<VendorDashboardPage />} />
          <Route path={ROUTES.VENDOR_BRANCHES} element={<VendorBranchesPage />} />
          <Route path={ROUTES.VENDOR_SERVICES} element={<VendorServicesPage />} />
          <Route path={ROUTES.VENDOR_AVAILABILITY} element={<VendorAvailabilityPage />} />
          <Route path={ROUTES.VENDOR_BOOKINGS} element={<VendorBookingsPage />} />
          <Route path={ROUTES.VENDOR_REQUESTS} element={<VendorRequestsPage />} />
          <Route path={ROUTES.VENDOR_NOTIFICATIONS} element={<VendorNotificationsPage />} />
          <Route path={ROUTES.VENDOR_SETTINGS} element={<VendorSettingsPage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
    </Routes>
  )
}
