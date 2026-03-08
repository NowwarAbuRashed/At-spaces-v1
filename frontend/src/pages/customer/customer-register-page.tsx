import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Lock, Mail, UserRound } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { customerRegisterEmailRequest } from '@/api/customer-api'
import { Button, Input } from '@/components/ui'
import {
  CustomerAuthField,
  CustomerAuthShell,
  CustomerPasswordInput,
} from '@/features/customer-auth/components'
import {
  customerRegisterSchema,
  type CustomerRegisterFormValues,
} from '@/features/customer-auth/schemas'
import { useCustomerAuth } from '@/features/customer-auth/store/customer-auth-context'
import { getInlineApiErrorMessage } from '@/lib/api-error'
import { CUSTOMER_ROUTES } from '@/lib/routes'

export function CustomerRegisterPage() {
  const navigate = useNavigate()
  const { isBackendUnavailable } = useCustomerAuth()

  const form = useForm<CustomerRegisterFormValues>({
    resolver: zodResolver(customerRegisterSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const registerMutation = useMutation({
    mutationFn: customerRegisterEmailRequest,
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      const response = await registerMutation.mutateAsync({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
      })
      toast.success('Account created successfully.', {
        description: response.message,
      })
      navigate(CUSTOMER_ROUTES.LOGIN, { replace: true })
    } catch (error) {
      const message = getInlineApiErrorMessage(error, 'Customer registration failed.')
      form.setError('email', { type: 'manual', message })
      toast.error(message)
    }
  })

  return (
    <CustomerAuthShell
      title="Create your AtSpaces account"
      description="Set up your customer profile to manage bookings and save your preferences."
      formTitle="Customer Registration"
      formDescription="All fields are required for account setup."
      badges={['Customer auth', 'Backend connected']}
      formFooter={
        <p className="text-sm text-app-muted">
          Already registered?{' '}
          <Link to={CUSTOMER_ROUTES.LOGIN} className="font-semibold text-app-accent hover:text-orange-300">
            Back to sign in
          </Link>
          .
        </p>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <CustomerAuthField
          id="customer-register-full-name"
          label="Full Name"
          error={form.formState.errors.fullName?.message}
        >
          <Input
            id="customer-register-full-name"
            autoComplete="name"
            placeholder="Your full name"
            leftIcon={<UserRound className="h-4 w-4" />}
            aria-invalid={Boolean(form.formState.errors.fullName)}
            {...form.register('fullName')}
          />
        </CustomerAuthField>

        <CustomerAuthField
          id="customer-register-email"
          label="Email"
          error={form.formState.errors.email?.message}
        >
          <Input
            id="customer-register-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            leftIcon={<Mail className="h-4 w-4" />}
            aria-invalid={Boolean(form.formState.errors.email)}
            {...form.register('email')}
          />
        </CustomerAuthField>

        <CustomerAuthField
          id="customer-register-password"
          label="Password"
          error={form.formState.errors.password?.message}
          hint="Use a strong password you can remember."
        >
          <CustomerPasswordInput
            id="customer-register-password"
            autoComplete="new-password"
            placeholder="Create password"
            leftIcon={<Lock className="h-4 w-4" />}
            aria-invalid={Boolean(form.formState.errors.password)}
            {...form.register('password')}
          />
        </CustomerAuthField>

        <CustomerAuthField
          id="customer-register-confirm-password"
          label="Confirm Password"
          error={form.formState.errors.confirmPassword?.message}
        >
          <CustomerPasswordInput
            id="customer-register-confirm-password"
            autoComplete="new-password"
            placeholder="Confirm password"
            leftIcon={<Lock className="h-4 w-4" />}
            aria-invalid={Boolean(form.formState.errors.confirmPassword)}
            {...form.register('confirmPassword')}
          />
        </CustomerAuthField>

        <Button type="submit" fullWidth isLoading={form.formState.isSubmitting}>
          Create account
        </Button>

        {isBackendUnavailable ? (
          <p className="text-center text-xs text-app-warning">
            Backend is currently unavailable. You can retry registration shortly.
          </p>
        ) : null}
      </form>
    </CustomerAuthShell>
  )
}
