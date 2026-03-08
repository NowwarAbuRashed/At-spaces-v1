import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, Mail } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { adminForgotPasswordRequest } from '@/api/auth-api'
import { ApiError } from '@/api/client'
import { LogoMark } from '@/components/shared/logo-mark'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from '@/components/ui'
import { AuthField } from '@/features/auth/components/auth-field'
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/features/auth/schemas/forgot-password-schema'
import { ADMIN_ROUTES } from '@/lib/routes'

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: 'admin@atspaces.com',
    },
  })

  const forgotPasswordMutation = useMutation({
    mutationFn: adminForgotPasswordRequest,
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result = await forgotPasswordMutation.mutateAsync(values)
      toast.success(result.message)
      reset()
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Unable to send reset instructions right now.'
      toast.error(message)
    }
  })

  return (
    <div className="flex min-h-screen items-center justify-center bg-app-bg px-4 py-8">
      <Card className="w-full max-w-xl border-app-border bg-app-surface px-2 py-4 shadow-soft sm:px-4">
        <CardHeader>
          <LogoMark className="mb-6" />
          <CardTitle className="text-4xl">Reset Password</CardTitle>
          <CardDescription>Enter your email and we&apos;ll send you a reset link.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-6" onSubmit={onSubmit} noValidate>
            <AuthField id="reset-email" label="Email" error={errors.email?.message}>
              <Input
                id="reset-email"
                type="email"
                autoComplete="email"
                placeholder="admin@atspaces.com"
                leftIcon={<Mail className="h-4 w-4" />}
                aria-invalid={Boolean(errors.email)}
                {...register('email')}
              />
            </AuthField>

            <Button
              type="submit"
              size="lg"
              fullWidth
              isLoading={isSubmitting || forgotPasswordMutation.isPending}
            >
              Send Reset Link
            </Button>

            <Button variant="ghost" fullWidth onClick={() => navigate(ADMIN_ROUTES.LOGIN)} type="button">
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Button>

            <p className="text-center text-sm text-app-muted">
              Already have a token?{' '}
              <Link to={ADMIN_ROUTES.RESET_PASSWORD} className="font-semibold text-app-accent hover:text-orange-300">
                Reset password now
              </Link>
              .
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
