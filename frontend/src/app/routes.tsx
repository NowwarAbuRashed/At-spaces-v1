import { Navigate, Route, Routes } from 'react-router-dom'
import { CustomerProtectedRoute } from '@/app/customer-protected-route'
import { CUSTOMER_ROUTES } from '@/lib/routes'
import { CustomerLayout } from '@/layouts/customer-layout'
import { CustomerBookingPreviewPage } from '@/pages/customer/customer-booking-preview-page'
import { CustomerBranchDetailsPage } from '@/pages/customer/customer-branch-details-page'
import { CustomerBranchesPage } from '@/pages/customer/customer-branches-page'
import { CustomerForgotPasswordPage } from '@/pages/customer/customer-forgot-password-page'
import { CustomerHomePage } from '@/pages/customer/customer-home-page'
import { CustomerLoginPage } from '@/pages/customer/customer-login-page'
import { CustomerMyBookingsPage } from '@/pages/customer/customer-my-bookings-page'
import { CustomerProfilePage } from '@/pages/customer/customer-profile-page'
import { CustomerRegisterPage } from '@/pages/customer/customer-register-page'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<CustomerLayout />}>
        <Route path={CUSTOMER_ROUTES.HOME} element={<CustomerHomePage />} />
        <Route path={CUSTOMER_ROUTES.LOGIN} element={<CustomerLoginPage />} />
        <Route path={CUSTOMER_ROUTES.REGISTER} element={<CustomerRegisterPage />} />
        <Route path={CUSTOMER_ROUTES.FORGOT_PASSWORD} element={<CustomerForgotPasswordPage />} />
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

      <Route path="*" element={<Navigate to={CUSTOMER_ROUTES.HOME} replace />} />
    </Routes>
  )
}
