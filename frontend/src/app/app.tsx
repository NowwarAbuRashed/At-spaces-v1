import { Toaster } from 'sonner'
import { AppRouter } from '@/app/router'

export function App() {
  return (
    <>
      <AppRouter />
      <Toaster
        richColors
        closeButton
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgb(var(--color-surface-alt))',
            border: '1px solid rgb(var(--color-border))',
            color: 'rgb(var(--color-text))',
          },
        }}
      />
    </>
  )
}

