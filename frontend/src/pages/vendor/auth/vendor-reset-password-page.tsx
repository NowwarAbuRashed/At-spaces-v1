import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, KeyRound, Lock } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { vendorResetPasswordRequest } from '@/api/vendor-api'
import { ApiError } from '@/api/client'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { AuthField } from '@/features/auth/components/auth-field'
import { CustomerPasswordInput } from '@/features/customer-auth/components'
import {
  vendorResetPasswordSchema,
  type VendorResetPasswordFormValues,
} from '@/features/vendor-auth/schemas'
import { VendorAuthShell } from '@/features/vendor-auth/components'
import { ROUTES } from '@/lib/routes'

export function VendorResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<VendorResetPasswordFormValues>({
    resolver: zodResolver(vendorResetPasswordSchema),
    defaultValues: {
      resetToken: searchParams.get('token') ?? '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const resetMutation = useMutation({
    mutationFn: vendorResetPasswordRequest,
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      const response = await resetMutation.mutateAsync({
        resetToken: values.resetToken,
        newPassword: values.newPassword,
      })
      toast.success('Vendor password reset completed.', {
        description: response.message,
      })
      navigate(ROUTES.VENDOR_LOGIN, { replace: true })
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to reset vendor password.'
      setError('resetToken', { type: 'manual', message })
      toast.error(message)
    }
  })

  return (
    <VendorAuthShell
      badgeLabel="Vendor Recovery"
      title="Set a new vendor password"
      description="Use the reset token and update your vendor account password."
    >
      <Card className="border-app-border bg-app-surface/90 shadow-soft">
        <CardHeader>
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>Reset token and new password are required to continue.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form className="space-y-4" onSubmit={onSubmit} noValidate>
            <AuthField id="vendor-reset-token" label="Reset Token" error={errors.resetToken?.message}>
              <CustomerPasswordInput
                id="vendor-reset-token"
                placeholder="Reset token"
                leftIcon={<KeyRound className="h-4 w-4" />}
                aria-invalid={Boolean(errors.resetToken)}
                {...register('resetToken')}
              />
            </AuthField>

            <AuthField id="vendor-reset-new-password" label="New Password" error={errors.newPassword?.message}>
              <CustomerPasswordInput
                id="vendor-reset-new-password"
                autoComplete="new-password"
                placeholder="Enter new password"
                leftIcon={<Lock className="h-4 w-4" />}
                aria-invalid={Boolean(errors.newPassword)}
                {...register('newPassword')}
              />
            </AuthField>

            <AuthField
              id="vendor-reset-confirm-password"
              label="Confirm Password"
              error={errors.confirmPassword?.message}
            >
              <CustomerPasswordInput
                id="vendor-reset-confirm-password"
                autoComplete="new-password"
                placeholder="Confirm new password"
                leftIcon={<Lock className="h-4 w-4" />}
                aria-invalid={Boolean(errors.confirmPassword)}
                {...register('confirmPassword')}
              />
            </AuthField>

            <Button type="submit" fullWidth size="lg" isLoading={isSubmitting || resetMutation.isPending}>
              Reset password
            </Button>
          </form>

          <Button variant="outline" fullWidth onClick={() => navigate(ROUTES.VENDOR_LOGIN)} type="button">
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Button>

          <p className="text-center text-sm text-app-muted">
            Need reset instructions first?{' '}
            <Link to={ROUTES.VENDOR_FORGOT_PASSWORD} className="font-semibold text-app-accent hover:text-orange-300">
              Request reset link
            </Link>
          </p>
        </CardContent>
      </Card>
    </VendorAuthShell>
  )
}
