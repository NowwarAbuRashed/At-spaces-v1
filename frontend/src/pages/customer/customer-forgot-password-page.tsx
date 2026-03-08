import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Mail } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { customerForgotPasswordRequest } from '@/api/customer-api'
import { Button, Input } from '@/components/ui'
import { CustomerAuthField, CustomerAuthShell } from '@/features/customer-auth/components'
import {
  customerForgotPasswordSchema,
  type CustomerForgotPasswordFormValues,
} from '@/features/customer-auth/schemas'
import { useCustomerAuth } from '@/features/customer-auth/store/customer-auth-context'
import { getInlineApiErrorMessage } from '@/lib/api-error'
import { CUSTOMER_ROUTES } from '@/lib/routes'

export function CustomerForgotPasswordPage() {
  const { isBackendUnavailable } = useCustomerAuth()

  const form = useForm<CustomerForgotPasswordFormValues>({
    resolver: zodResolver(customerForgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const forgotPasswordMutation = useMutation({
    mutationFn: customerForgotPasswordRequest,
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      const response = await forgotPasswordMutation.mutateAsync(values)
      toast.success('Reset link requested.', {
        description: response.message,
      })
    } catch (error) {
      const message = getInlineApiErrorMessage(error, 'Failed to request reset link.')
      form.setError('email', { type: 'manual', message })
      toast.error(message)
    }
  })

  return (
    <CustomerAuthShell
      title="Reset your password"
      description="Enter your email and we will send password reset instructions."
      formTitle="Forgot Password"
      formDescription="Provide the email linked to your customer account."
      badges={['Customer auth', 'Backend connected']}
      formFooter={
        <div className="space-y-2 text-sm text-app-muted">
          <p>
            Remembered your password?{' '}
            <Link to={CUSTOMER_ROUTES.LOGIN} className="font-semibold text-app-accent hover:text-orange-300">
              Back to sign in
            </Link>
            .
          </p>
          <p>
            Already have a token?{' '}
            <Link to={CUSTOMER_ROUTES.RESET_PASSWORD} className="font-semibold text-app-accent hover:text-orange-300">
              Reset password now
            </Link>
            .
          </p>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <CustomerAuthField
          id="customer-forgot-email"
          label="Email"
          error={form.formState.errors.email?.message}
        >
          <Input
            id="customer-forgot-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            leftIcon={<Mail className="h-4 w-4" />}
            aria-invalid={Boolean(form.formState.errors.email)}
            {...form.register('email')}
          />
        </CustomerAuthField>

        <Button type="submit" fullWidth isLoading={form.formState.isSubmitting}>
          Send reset link
        </Button>

        {isBackendUnavailable ? (
          <p className="text-center text-xs text-app-warning">
            Backend is currently unavailable. Reset emails cannot be requested right now.
          </p>
        ) : null}
      </form>
    </CustomerAuthShell>
  )
}
