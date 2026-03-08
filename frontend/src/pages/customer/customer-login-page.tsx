import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Lock, Mail } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { customerLoginRequest } from '@/api/customer-api'
import { Button, Input } from '@/components/ui'
import {
  CustomerAuthField,
  CustomerAuthShell,
  CustomerPasswordInput,
} from '@/features/customer-auth/components'
import {
  customerLoginSchema,
  type CustomerLoginFormValues,
} from '@/features/customer-auth/schemas'
import { useCustomerAuth } from '@/features/customer-auth/store/customer-auth-context'
import { getInlineApiErrorMessage } from '@/lib/api-error'
import { CUSTOMER_ROUTES } from '@/lib/routes'

export function CustomerLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setAuthenticatedSession, isBackendUnavailable } = useCustomerAuth()

  const form = useForm<CustomerLoginFormValues>({
    resolver: zodResolver(customerLoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const loginMutation = useMutation({
    mutationFn: customerLoginRequest,
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    const state = location.state as { from?: string } | null
    const redirectTarget = state?.from && state.from.startsWith('/') ? state.from : CUSTOMER_ROUTES.HOME

    try {
      const response = await loginMutation.mutateAsync(values)
      setAuthenticatedSession({
        accessToken: response.accessToken,
        user: response.user,
      })
      toast.success(`Welcome back, ${response.user.fullName}.`)
      navigate(redirectTarget, { replace: true })
    } catch (error) {
      const message = getInlineApiErrorMessage(error, 'Customer sign in failed.', {
        sessionLabel: 'user',
      })
      form.setError('password', { type: 'manual', message })
      toast.error(message)
    }
  })

  return (
    <CustomerAuthShell
      title="Sign in to continue booking"
      description="Access your booking history, upcoming reservations, and profile in one place."
      formTitle="Customer Login"
      formDescription="Use your account email and password."
      badges={['Customer auth', 'Backend connected']}
      formFooter={
        <div className="space-y-2 text-sm text-app-muted">
          <p>
            New to AtSpaces?{' '}
            <Link to={CUSTOMER_ROUTES.REGISTER} className="font-semibold text-app-accent hover:text-orange-300">
              Create an account
            </Link>
            .
          </p>
          <p>
            Need help signing in? Email{' '}
            <a href="mailto:support@atspaces.com" className="font-semibold text-app-accent hover:text-orange-300">
              support@atspaces.com
            </a>
            .
          </p>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <CustomerAuthField
          id="customer-login-email"
          label="Email"
          error={form.formState.errors.email?.message}
        >
          <Input
            id="customer-login-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            leftIcon={<Mail className="h-4 w-4" />}
            aria-invalid={Boolean(form.formState.errors.email)}
            {...form.register('email')}
          />
        </CustomerAuthField>

        <CustomerAuthField
          id="customer-login-password"
          label="Password"
          error={form.formState.errors.password?.message}
          rightLabel={
            <Link
              to={CUSTOMER_ROUTES.FORGOT_PASSWORD}
              className="text-xs font-semibold text-app-accent transition-colors hover:text-orange-300"
            >
              Forgot password?
            </Link>
          }
        >
          <CustomerPasswordInput
            id="customer-login-password"
            autoComplete="current-password"
            placeholder="Enter your password"
            leftIcon={<Lock className="h-4 w-4" />}
            aria-invalid={Boolean(form.formState.errors.password)}
            {...form.register('password')}
          />
        </CustomerAuthField>

        <Button type="submit" fullWidth isLoading={form.formState.isSubmitting}>
          Sign in
        </Button>

        {isBackendUnavailable ? (
          <p className="text-center text-xs text-app-warning">
            Backend is currently unavailable. You can retry in a moment.
          </p>
        ) : null}
      </form>
    </CustomerAuthShell>
  )
}
