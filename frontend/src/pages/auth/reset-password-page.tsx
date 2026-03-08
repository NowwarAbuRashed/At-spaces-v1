import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, KeyRound, Lock, ShieldCheck } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { adminResetPasswordRequest } from '@/api/auth-api'
import { ApiError } from '@/api/client'
import { LogoMark } from '@/components/shared/logo-mark'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from '@/components/ui'
import { AuthField } from '@/features/auth/components/auth-field'
import {
  adminResetPasswordSchema,
  type AdminResetPasswordFormValues,
} from '@/features/auth/schemas/admin-reset-password-schema'
import { ADMIN_ROUTES } from '@/lib/routes'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const form = useForm<AdminResetPasswordFormValues>({
    resolver: zodResolver(adminResetPasswordSchema),
    defaultValues: {
      resetToken: searchParams.get('token') ?? '',
      newPassword: '',
      confirmPassword: '',
      totpCode: '',
    },
  })

  const resetMutation = useMutation({
    mutationFn: adminResetPasswordRequest,
  })

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const result = await resetMutation.mutateAsync({
        resetToken: values.resetToken,
        newPassword: values.newPassword,
        totpCode: values.totpCode,
      })
      toast.success('Password reset completed.', { description: result.message })
      navigate(ADMIN_ROUTES.LOGIN, { replace: true })
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Unable to reset admin password.'
      form.setError('resetToken', { type: 'manual', message })
      toast.error(message)
    }
  })

  return (
    <div className="flex min-h-screen items-center justify-center bg-app-bg px-4 py-8">
      <Card className="w-full max-w-xl border-app-border bg-app-surface px-2 py-4 shadow-soft sm:px-4">
        <CardHeader>
          <LogoMark className="mb-6" />
          <CardTitle className="text-4xl">Admin Password Reset</CardTitle>
          <CardDescription>Provide reset token, new password, and MFA code.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-6" onSubmit={onSubmit} noValidate>
            <AuthField id="admin-reset-token" label="Reset Token" error={form.formState.errors.resetToken?.message}>
              <Input
                id="admin-reset-token"
                placeholder="Reset token"
                leftIcon={<KeyRound className="h-4 w-4" />}
                aria-invalid={Boolean(form.formState.errors.resetToken)}
                {...form.register('resetToken')}
              />
            </AuthField>

            <AuthField id="admin-reset-new-password" label="New Password" error={form.formState.errors.newPassword?.message}>
              <Input
                id="admin-reset-new-password"
                type="password"
                autoComplete="new-password"
                placeholder="Enter new password"
                leftIcon={<Lock className="h-4 w-4" />}
                aria-invalid={Boolean(form.formState.errors.newPassword)}
                {...form.register('newPassword')}
              />
            </AuthField>

            <AuthField
              id="admin-reset-confirm-password"
              label="Confirm Password"
              error={form.formState.errors.confirmPassword?.message}
            >
              <Input
                id="admin-reset-confirm-password"
                type="password"
                autoComplete="new-password"
                placeholder="Confirm new password"
                leftIcon={<Lock className="h-4 w-4" />}
                aria-invalid={Boolean(form.formState.errors.confirmPassword)}
                {...form.register('confirmPassword')}
              />
            </AuthField>

            <AuthField id="admin-reset-totp" label="Authenticator Code" error={form.formState.errors.totpCode?.message}>
              <Input
                id="admin-reset-totp"
                inputMode="numeric"
                placeholder="123456"
                leftIcon={<ShieldCheck className="h-4 w-4" />}
                aria-invalid={Boolean(form.formState.errors.totpCode)}
                {...form.register('totpCode')}
              />
            </AuthField>

            <Button
              type="submit"
              size="lg"
              fullWidth
              isLoading={form.formState.isSubmitting || resetMutation.isPending}
            >
              Reset Password
            </Button>

            <Button variant="ghost" fullWidth onClick={() => navigate(ADMIN_ROUTES.LOGIN)} type="button">
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
