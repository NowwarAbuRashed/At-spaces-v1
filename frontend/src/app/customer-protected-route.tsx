import type { PropsWithChildren } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { LoadingState } from '@/components/shared/loading-state'
import { useCustomerAuth } from '@/features/customer-auth/store/customer-auth-context'
import { CUSTOMER_ROUTES } from '@/lib/routes'

export function CustomerProtectedRoute({ children }: PropsWithChildren) {
  const location = useLocation()
  const { isAuthenticated, isHydrating } = useCustomerAuth()

  if (isHydrating) {
    return <LoadingState label="Restoring your customer session..." />
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={CUSTOMER_ROUTES.LOGIN}
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }

  return children
}
