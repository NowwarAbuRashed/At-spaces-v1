import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, Mail } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { vendorForgotPasswordRequest } from '@/api/vendor-api'
import { ApiError } from '@/api/client'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from '@/components/ui'
import { AuthField } from '@/features/auth/components/auth-field'
import { VendorAuthShell } from '@/features/vendor-auth/components'
import {
  vendorForgotPasswordSchema,
  type VendorForgotPasswordFormValues,
} from '@/features/vendor-auth/schemas'
import { ADMIN_ROUTES, ROUTES } from '@/lib/routes'

export function VendorForgotPasswordPage() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VendorForgotPasswordFormValues>({
    resolver: zodResolver(vendorForgotPasswordSchema),
    defaultValues: {
      email: 'vendor@atspaces.com',
    },
  })

  const forgotPasswordMutation = useMutation({
    mutationFn: vendorForgotPasswordRequest,
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await forgotPasswordMutation.mutateAsync({
        email: values.email,
      })
      setSubmittedEmail(values.email)
      toast.success('Reset instructions have been sent if the email exists.')
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Unable to send reset instructions.'
      toast.error(message)
    }
  })

  return (
    <VendorAuthShell
      badgeLabel="Vendor Recovery"
      title="Reset Vendor Password"
      description="Enter your vendor account email and we will send reset instructions to continue."
    >
      <Card className="border-app-border bg-app-surface/90 shadow-soft">
        <CardHeader>
          <CardTitle className="text-2xl">Forgot Password</CardTitle>
          <CardDescription>
            Enter the email associated with your vendor account to receive password reset instructions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!submittedEmail ? (
            <form className="space-y-6" onSubmit={onSubmit} noValidate>
              <AuthField id="vendor-reset-email" label="Work Email" error={errors.email?.message}>
                <Input
                  id="vendor-reset-email"
                  type="email"
                  autoComplete="email"
                  placeholder="vendor@atspaces.com"
                  leftIcon={<Mail className="h-4 w-4" />}
                  aria-invalid={Boolean(errors.email)}
                  {...register('email')}
                />
              </AuthField>

              <Button type="submit" fullWidth size="lg" isLoading={isSubmitting}>
                Send Reset Link
              </Button>
            </form>
          ) : (
            <div className="rounded-2xl border border-app-border bg-app-surface-alt/70 p-4">
              <p className="font-semibold text-app-text">Reset request submitted</p>
              <p className="mt-1 text-sm text-app-muted">
                If this email is registered, a reset link was sent to{' '}
                <span className="text-app-accent">{submittedEmail}</span>.
              </p>
            </div>
          )}

          <Link
            to={ROUTES.VENDOR_LOGIN}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-app-border bg-transparent px-4 py-3 text-sm font-semibold text-app-muted transition-colors hover:border-app-accent/50 hover:text-app-text"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Link>

          <p className="text-center text-sm text-app-muted">
            Need admin access?{' '}
            <Link
              to={ADMIN_ROUTES.LOGIN}
              className="font-semibold text-app-accent transition-colors hover:text-orange-300"
            >
              Open Admin Sign In
            </Link>
          </p>
        </CardContent>
      </Card>
    </VendorAuthShell>
  )
}
