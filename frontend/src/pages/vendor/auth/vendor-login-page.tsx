import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button, Input } from '@/components/ui'
import { AuthField } from '@/features/auth/components/auth-field'
import { startVendorSession } from '@/features/auth/store/vendor-session'
import { VendorAuthShell } from '@/features/vendor-auth/components'
import {
  vendorLoginSchema,
  type VendorLoginFormValues,
} from '@/features/vendor-auth/schemas'
import { ROUTES } from '@/lib/routes'

export function VendorLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VendorLoginFormValues>({
    resolver: zodResolver(vendorLoginSchema),
    defaultValues: {
      email: 'vendor@atspaces.com',
      password: '',
    },
  })

  const redirectPath = useMemo(() => {
    const state = location.state as { from?: string } | null
    if (state?.from && state.from.startsWith('/vendor/')) {
      return state.from
    }

    return ROUTES.VENDOR_DASHBOARD
  }, [location.state])

  const onSubmit = handleSubmit(async () => {
    await Promise.resolve()
    startVendorSession()
    toast.success('Vendor sign in completed (placeholder flow).')
    navigate(redirectPath, { replace: true })
  })

  return (
    <VendorAuthShell
      badgeLabel="Vendor Access"
      title="Sign in to Vendor Workspace"
      description="Manage branches, schedules, and bookings from your dedicated AtSpaces vendor portal."
    >
      <form className="space-y-6" onSubmit={onSubmit} noValidate>
        <AuthField id="vendor-email" label="Email Address" error={errors.email?.message}>
          <Input
            id="vendor-email"
            type="email"
            autoComplete="email"
            placeholder="vendor@atspaces.com"
            leftIcon={<Mail className="h-4 w-4" />}
            aria-invalid={Boolean(errors.email)}
            {...register('email')}
          />
        </AuthField>

        <AuthField
          id="vendor-password"
          label="Password"
          error={errors.password?.message}
          rightLabel={
            <Link
              to={ROUTES.VENDOR_FORGOT_PASSWORD}
              className="text-sm font-semibold text-app-accent transition-colors hover:text-orange-300"
            >
              Forgot password?
            </Link>
          }
        >
          <Input
            id="vendor-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Enter your password"
            leftIcon={<Lock className="h-4 w-4" />}
            rightAddon={
              <button
                type="button"
                className="rounded p-0.5 text-app-muted transition-colors hover:text-app-text"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            aria-invalid={Boolean(errors.password)}
            {...register('password')}
          />
        </AuthField>

        <Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>
          Sign In
        </Button>

        <div className="space-y-3 text-center">
          <p className="text-sm text-app-muted">
            Need access help? Contact Vendor Support at{' '}
            <a
              href="mailto:vendor-support@atspaces.com"
              className="font-semibold text-app-accent transition-colors hover:text-orange-300"
            >
              vendor-support@atspaces.com
            </a>
            .
          </p>
          <p className="text-sm text-app-muted">
            Looking for the management portal?{' '}
            <Link
              to={ROUTES.LOGIN}
              className="font-semibold text-app-accent transition-colors hover:text-orange-300"
            >
              Open Admin Sign In
            </Link>
          </p>
        </div>
      </form>
    </VendorAuthShell>
  )
}
