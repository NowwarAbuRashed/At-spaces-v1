import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from '@/app/routes'

export function AppRouter() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

