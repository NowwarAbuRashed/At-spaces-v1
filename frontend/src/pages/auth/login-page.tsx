import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { adminLoginRequest, adminVerifyMfaRequest } from '@/api/auth-api'
import { ApiError } from '@/api/client'
import { Button, Input } from '@/components/ui'
import { AuthField } from '@/features/auth/components/auth-field'
import { AuthPromoPanel } from '@/features/auth/components/auth-promo-panel'
import { loginSchema, type LoginFormValues } from '@/features/auth/schemas/login-schema'
import { mfaVerifySchema, type MfaVerifyValues } from '@/features/auth/schemas/mfa-verify-schema'
import { useAuth } from '@/features/auth/store/auth-context'
import { appEnv } from '@/lib/env'
import { ADMIN_ROUTES } from '@/lib/routes'

export function LoginPage() {
  const navigate = useNavigate()
  const { setAuthenticatedSession } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [pendingPreAuthToken, setPendingPreAuthToken] = useState<string | null>(null)
  const [rememberChoice, setRememberChoice] = useState(true)

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@example.com',
      password: '',
      remember: true,
      captchaToken: appEnv.hcaptchaToken,
    },
  })

  const mfaForm = useForm<MfaVerifyValues>({
    resolver: zodResolver(mfaVerifySchema),
    defaultValues: {
      totpCode: appEnv.defaultMfaCode,
    },
  })

  const loginMutation = useMutation({
    mutationFn: adminLoginRequest,
  })

  const mfaMutation = useMutation({
    mutationFn: adminVerifyMfaRequest,
  })

  const handleLoginSubmit = loginForm.handleSubmit(async (values) => {
    try {
      const response = await loginMutation.mutateAsync({
        email: values.email,
        password: values.password,
        captchaToken: values.captchaToken,
      })

      setRememberChoice(values.remember)
      setPendingPreAuthToken(response.preAuthToken)
      toast.success('Primary authentication passed. Enter MFA code to continue.')
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Login failed.'
      loginForm.setError('password', { type: 'manual', message })
      toast.error(message)
    }
  })

  const handleMfaSubmit = mfaForm.handleSubmit(async (values) => {
    if (!pendingPreAuthToken) {
      toast.error('Pre-auth token missing. Please sign in again.')
      return
    }

    try {
      const response = await mfaMutation.mutateAsync({
        preAuthToken: pendingPreAuthToken,
        totpCode: values.totpCode,
      })

      setAuthenticatedSession(
        {
          accessToken: response.accessToken,
          user: response.user,
        },
        rememberChoice,
      )
      toast.success(`Welcome back, ${response.user.fullName}.`)
      navigate(ADMIN_ROUTES.DASHBOARD)
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'MFA verification failed.'
      mfaForm.setError('totpCode', { type: 'manual', message })
      toast.error(message)
    }
  })

  return (
    <div className="min-h-screen bg-app-bg">
      <div className="grid min-h-screen lg:grid-cols-[1.08fr_1fr]">
        <AuthPromoPanel />

        <section className="flex items-center justify-center p-6 sm:p-10 lg:p-14">
          <div className="w-full max-w-lg">
            <h2 className="font-heading text-4xl font-semibold text-app-text">
              {pendingPreAuthToken ? 'MFA Verification' : 'Welcome back'}
            </h2>
            <p className="mt-3 text-2xl text-app-muted">
              {pendingPreAuthToken
                ? 'Enter your 6-digit authenticator code to complete sign in.'
                : 'Sign in to your admin account to continue.'}
            </p>

            {!pendingPreAuthToken ? (
              <form className="mt-8 space-y-6" onSubmit={handleLoginSubmit} noValidate>
                <AuthField id="email" label="Email Address" error={loginForm.formState.errors.email?.message}>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="admin@atspaces.com"
                    leftIcon={<Mail className="h-4 w-4" />}
                    aria-invalid={Boolean(loginForm.formState.errors.email)}
                    {...loginForm.register('email')}
                  />
                </AuthField>

                <AuthField
                  id="password"
                  label="Password"
                  error={loginForm.formState.errors.password?.message}
                  rightLabel={
                    <a
                      href="mailto:security@atspaces.com?subject=Admin%20Password%20Reset"
                      className="text-sm font-semibold text-app-accent transition-colors hover:text-orange-300"
                    >
                      Request password reset
                    </a>
                  }
                >
                  <Input
                    id="password"
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
                    aria-invalid={Boolean(loginForm.formState.errors.password)}
                    {...loginForm.register('password')}
                  />
                </AuthField>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-app-text">Captcha Token</span>
                  <Input
                    aria-invalid={Boolean(loginForm.formState.errors.captchaToken)}
                    placeholder="Captcha token"
                    {...loginForm.register('captchaToken')}
                  />
                  {loginForm.formState.errors.captchaToken?.message ? (
                    <span className="text-xs text-app-danger">
                      {loginForm.formState.errors.captchaToken.message}
                    </span>
                  ) : null}
                </label>

                <label className="flex items-center gap-2.5 text-base text-app-muted">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-app-border bg-app-surface text-app-accent focus:ring-app-accent/60"
                    {...loginForm.register('remember')}
                  />
                  Remember me for 30 days
                </label>

                <Button type="submit" size="lg" fullWidth isLoading={loginMutation.isPending}>
                  Sign In
                </Button>

                <p className="text-center text-base text-app-muted">
                  This portal is restricted to authorized administrators.
                </p>
              </form>
            ) : (
              <form className="mt-8 space-y-6" onSubmit={handleMfaSubmit} noValidate>
                <AuthField id="totp-code" label="Authenticator Code" error={mfaForm.formState.errors.totpCode?.message}>
                  <Input
                    id="totp-code"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    leftIcon={<ShieldCheck className="h-4 w-4" />}
                    aria-invalid={Boolean(mfaForm.formState.errors.totpCode)}
                    {...mfaForm.register('totpCode')}
                  />
                </AuthField>

                <Button type="submit" size="lg" fullWidth isLoading={mfaMutation.isPending}>
                  Verify & Sign In
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  fullWidth
                  onClick={() => {
                    setPendingPreAuthToken(null)
                    mfaForm.reset()
                  }}
                >
                  Back to login
                </Button>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
