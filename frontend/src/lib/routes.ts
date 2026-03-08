export const CUSTOMER_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  RESET_PASSWORD: '/reset-password',
  FORGOT_PASSWORD: '/forgot-password',
  BRANCHES: '/branches',
  BRANCH_DETAILS: '/branches/:id',
  SERVICE_DETAILS: '/services/:id',
  BOOKING_PREVIEW: '/booking-preview',
  MY_BOOKINGS: '/my-bookings',
  PROFILE: '/profile',
  AI_RECOMMEND: '/ai-recommend',
  BOOKING_DETAILS: '/booking/:id',
} as const

export type CustomerRoutePath = (typeof CUSTOMER_ROUTES)[keyof typeof CUSTOMER_ROUTES]

export function getCustomerBranchDetailsRoute(branchId: string | number) {
  return `/branches/${branchId}`
}

export function getCustomerServiceDetailsRoute(serviceId: string | number) {
  return `/services/${serviceId}`
}

export function getCustomerBookingDetailsRoute(bookingId: string | number) {
  return `/booking/${bookingId}`
}

export const ADMIN_ROUTES = {
  LOGIN: '/admin/login',
  FORGOT_PASSWORD: '/admin/forgot-password',
  RESET_PASSWORD: '/admin/reset-password',
  DASHBOARD: '/admin/dashboard',
  ANALYTICS: '/admin/analytics',
  BRANCHES: '/admin/branches',
  VENDORS: '/admin/vendors',
  PRICING: '/admin/pricing',
  APPROVALS: '/admin/approvals',
  APPROVAL_DETAILS: '/admin/approvals/:id',
  APPLICATIONS: '/admin/applications',
  NOTIFICATIONS: '/admin/notifications',
  SETTINGS: '/admin/settings',
} as const

export function getAdminApprovalDetailsRoute(requestId: string | number) {
  return `/admin/approvals/${requestId}`
}

// Old unscoped admin URLs still used by existing links/helpers.
// NOTE: '/branches' is intentionally excluded because it belongs to customer/public discovery.
export const LEGACY_ADMIN_ROUTES = {
  DASHBOARD: '/dashboard',
  ANALYTICS: '/analytics',
  VENDORS: '/vendors',
  PRICING: '/pricing',
  APPROVALS: '/approvals',
  APPLICATIONS: '/applications',
  NOTIFICATIONS: '/notifications',
  SETTINGS: '/settings',
} as const

export const ROUTES = {
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  VENDOR_LOGIN: '/vendor/login',
  VENDOR_REGISTER: '/vendor/register',
  VENDOR_FORGOT_PASSWORD: '/vendor/forgot-password',
  VENDOR_RESET_PASSWORD: '/vendor/reset-password',
  VENDOR_DASHBOARD: '/vendor/dashboard',
  VENDOR_BRANCHES: '/vendor/branches',
  VENDOR_SERVICES: '/vendor/services',
  VENDOR_AVAILABILITY: '/vendor/availability',
  VENDOR_BOOKINGS: '/vendor/bookings',
  VENDOR_REQUESTS: '/vendor/requests',
  VENDOR_NOTIFICATIONS: '/vendor/notifications',
  VENDOR_SETTINGS: '/vendor/settings',
} as const

export type AppRoutePath =
  | (typeof ROUTES)[keyof typeof ROUTES]
  | (typeof ADMIN_ROUTES)[keyof typeof ADMIN_ROUTES]
  | (typeof LEGACY_ADMIN_ROUTES)[keyof typeof LEGACY_ADMIN_ROUTES]
  | CustomerRoutePath
