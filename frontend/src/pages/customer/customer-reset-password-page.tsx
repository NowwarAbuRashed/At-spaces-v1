import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { KeyRound, Lock } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { customerResetPasswordRequest } from '@/api/customer-api'
import { Button } from '@/components/ui'
import {
  CustomerAuthField,
  CustomerAuthShell,
  CustomerPasswordInput,
} from '@/features/customer-auth/components'
import {
  customerResetPasswordSchema,
  type CustomerResetPasswordFormValues,
} from '@/features/customer-auth/schemas'
import { getInlineApiErrorMessage } from '@/lib/api-error'
import { CUSTOMER_ROUTES } from '@/lib/routes'

export function CustomerResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const form = useForm<CustomerResetPasswordFormValues>({
    resolver: zodResolver(customerResetPasswordSchema),
    defaultValues: {
      resetToken: searchParams.get('token') ?? '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const resetPasswordMutation = useMutation({
    mutationFn: customerResetPasswordRequest,
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      const response = await resetPasswordMutation.mutateAsync({
        resetToken: values.resetToken,
        newPassword: values.newPassword,
      })
      toast.success('Password reset completed.', {
        description: response.message,
      })
      navigate(CUSTOMER_ROUTES.LOGIN, { replace: true })
    } catch (error) {
      const message = getInlineApiErrorMessage(error, 'Failed to reset password.')
      form.setError('resetToken', { type: 'manual', message })
      toast.error(message)
    }
  })

  return (
    <CustomerAuthShell
      title="Set a new password"
      description="Use your reset token and create a new password for your customer account."
      formTitle="Reset Password"
      formDescription="Reset token and new password are required."
      badges={['Customer auth', 'Backend connected']}
      formFooter={
        <p className="text-sm text-app-muted">
          Back to sign in?{' '}
          <Link to={CUSTOMER_ROUTES.LOGIN} className="font-semibold text-app-accent hover:text-orange-300">
            Customer login
          </Link>
          .
        </p>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <CustomerAuthField
          id="customer-reset-token"
          label="Reset Token"
          error={form.formState.errors.resetToken?.message}
          hint="Paste the token from your reset email."
        >
          <CustomerPasswordInput
            id="customer-reset-token"
            placeholder="Reset token"
            leftIcon={<KeyRound className="h-4 w-4" />}
            aria-invalid={Boolean(form.formState.errors.resetToken)}
            {...form.register('resetToken')}
          />
        </CustomerAuthField>

        <CustomerAuthField
          id="customer-reset-new-password"
          label="New Password"
          error={form.formState.errors.newPassword?.message}
        >
          <CustomerPasswordInput
            id="customer-reset-new-password"
            autoComplete="new-password"
            placeholder="Enter new password"
            leftIcon={<Lock className="h-4 w-4" />}
            aria-invalid={Boolean(form.formState.errors.newPassword)}
            {...form.register('newPassword')}
          />
        </CustomerAuthField>

        <CustomerAuthField
          id="customer-reset-confirm-password"
          label="Confirm Password"
          error={form.formState.errors.confirmPassword?.message}
        >
          <CustomerPasswordInput
            id="customer-reset-confirm-password"
            autoComplete="new-password"
            placeholder="Confirm new password"
            leftIcon={<Lock className="h-4 w-4" />}
            aria-invalid={Boolean(form.formState.errors.confirmPassword)}
            {...form.register('confirmPassword')}
          />
        </CustomerAuthField>

        <Button type="submit" fullWidth isLoading={form.formState.isSubmitting || resetPasswordMutation.isPending}>
          Reset password
        </Button>
      </form>
    </CustomerAuthShell>
  )
}
