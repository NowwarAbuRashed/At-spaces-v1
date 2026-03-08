import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'
import { useState } from 'react'
import { AuthProvider } from '@/features/auth/store/auth-context'
import { VendorAuthProvider } from '@/features/auth/store/vendor-auth-context'

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 30,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <VendorAuthProvider>{children}</VendorAuthProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
