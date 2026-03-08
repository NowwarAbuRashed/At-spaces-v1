import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { KeyRound, Lock, Mail, Smartphone, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  customerRegisterEmailRequest,
  customerRegisterPhoneRequest,
  customerResendOtpRequest,
  customerVerifyOtpRequest,
} from '@/api/customer-api'
import { ApiError } from '@/api/client'
import { Button, Input, Tabs } from '@/components/ui'
import {
  CustomerAuthField,
  CustomerAuthShell,
  CustomerPasswordInput,
} from '@/features/customer-auth/components'
import {
  customerRegisterPhoneSchema,
  customerRegisterSchema,
  customerVerifyOtpSchema,
  type CustomerRegisterPhoneFormValues,
  type CustomerRegisterFormValues,
  type CustomerVerifyOtpFormValues,
} from '@/features/customer-auth/schemas'
import { useCustomerAuth } from '@/features/customer-auth/store/customer-auth-context'
import { getInlineApiErrorMessage } from '@/lib/api-error'
import { CUSTOMER_ROUTES } from '@/lib/routes'

type RegisterMode = 'email' | 'phone'

export function CustomerRegisterPage() {
  const navigate = useNavigate()
  const { isBackendUnavailable, setAuthenticatedSession } = useCustomerAuth()
  const [registerMode, setRegisterMode] = useState<RegisterMode>('email')
  const [otpPhoneNumber, setOtpPhoneNumber] = useState<string | null>(null)

  const emailForm = useForm<CustomerRegisterFormValues>({
    resolver: zodResolver(customerRegisterSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const phoneForm = useForm<CustomerRegisterPhoneFormValues>({
    resolver: zodResolver(customerRegisterPhoneSchema),
    defaultValues: {
      fullName: '',
      phoneNumber: '',
    },
  })

  const otpForm = useForm<CustomerVerifyOtpFormValues>({
    resolver: zodResolver(customerVerifyOtpSchema),
    defaultValues: {
      phoneNumber: '',
      otpCode: '',
    },
  })

  const registerMutation = useMutation({
    mutationFn: customerRegisterEmailRequest,
  })
  const registerPhoneMutation = useMutation({
    mutationFn: customerRegisterPhoneRequest,
  })
  const verifyOtpMutation = useMutation({
    mutationFn: customerVerifyOtpRequest,
  })
  const resendOtpMutation = useMutation({
    mutationFn: customerResendOtpRequest,
  })

  const handleEmailSubmit = emailForm.handleSubmit(async (values) => {
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
      emailForm.setError('email', { type: 'manual', message })
      toast.error(message)
    }
  })

  const handlePhoneSubmit = phoneForm.handleSubmit(async (values) => {
    try {
      const response = await registerPhoneMutation.mutateAsync(values)
      setOtpPhoneNumber(values.phoneNumber)
      otpForm.setValue('phoneNumber', values.phoneNumber, { shouldValidate: true })
      toast.success('OTP sent to your phone.', {
        description: response.message,
      })
    } catch (error) {
      const message = getInlineApiErrorMessage(error, 'Phone registration failed.')
      phoneForm.setError('phoneNumber', { type: 'manual', message })
      toast.error(message)
    }
  })

  const handleVerifyOtp = otpForm.handleSubmit(async (values) => {
    try {
      const response = await verifyOtpMutation.mutateAsync({
        phoneNumber: values.phoneNumber,
        otpCode: values.otpCode,
        purpose: 'signup',
      })
      setAuthenticatedSession({
        accessToken: response.accessToken,
        user: response.user,
      })
      toast.success(`Welcome, ${response.user.fullName}.`)
      navigate(CUSTOMER_ROUTES.HOME, { replace: true })
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        const otpMessage = error.message || 'Invalid or expired OTP code. Please try again.'
        otpForm.setError('otpCode', { type: 'manual', message: otpMessage })
        toast.error(otpMessage)
        return
      }

      const message = getInlineApiErrorMessage(error, 'OTP verification failed.')
      otpForm.setError('otpCode', { type: 'manual', message })
      toast.error(message)
    }
  })

  const handleResendOtp = async () => {
    const phoneNumber = otpForm.getValues('phoneNumber')
    if (!phoneNumber) {
      otpForm.setError('phoneNumber', { type: 'manual', message: 'Phone number is required.' })
      return
    }

    try {
      const response = await resendOtpMutation.mutateAsync({
        phoneNumber,
        purpose: 'signup',
      })
      toast.success('OTP resent.', {
        description: response.message,
      })
    } catch (error) {
      const message = getInlineApiErrorMessage(error, 'Failed to resend OTP.')
      otpForm.setError('otpCode', { type: 'manual', message })
      toast.error(message)
    }
  }

  return (
    <CustomerAuthShell
      title="Create your AtSpaces account"
      description="Register by email or phone OTP to manage bookings and save preferences."
      formTitle="Customer Registration"
      formDescription="Choose an onboarding method that fits your account setup."
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
      <Tabs
        value={registerMode}
        onChange={(value) => setRegisterMode(value)}
        items={[
          { label: 'Email', value: 'email' },
          { label: 'Phone OTP', value: 'phone' },
        ]}
      />

      {registerMode === 'email' ? (
        <form className="space-y-4" onSubmit={handleEmailSubmit} noValidate>
          <CustomerAuthField
            id="customer-register-full-name"
            label="Full Name"
            error={emailForm.formState.errors.fullName?.message}
          >
            <Input
              id="customer-register-full-name"
              autoComplete="name"
              placeholder="Your full name"
              leftIcon={<UserRound className="h-4 w-4" />}
              aria-invalid={Boolean(emailForm.formState.errors.fullName)}
              {...emailForm.register('fullName')}
            />
          </CustomerAuthField>

          <CustomerAuthField
            id="customer-register-email"
            label="Email"
            error={emailForm.formState.errors.email?.message}
          >
            <Input
              id="customer-register-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              leftIcon={<Mail className="h-4 w-4" />}
              aria-invalid={Boolean(emailForm.formState.errors.email)}
              {...emailForm.register('email')}
            />
          </CustomerAuthField>

          <CustomerAuthField
            id="customer-register-password"
            label="Password"
            error={emailForm.formState.errors.password?.message}
            hint="Use a strong password you can remember."
          >
            <CustomerPasswordInput
              id="customer-register-password"
              autoComplete="new-password"
              placeholder="Create password"
              leftIcon={<Lock className="h-4 w-4" />}
              aria-invalid={Boolean(emailForm.formState.errors.password)}
              {...emailForm.register('password')}
            />
          </CustomerAuthField>

          <CustomerAuthField
            id="customer-register-confirm-password"
            label="Confirm Password"
            error={emailForm.formState.errors.confirmPassword?.message}
          >
            <CustomerPasswordInput
              id="customer-register-confirm-password"
              autoComplete="new-password"
              placeholder="Confirm password"
              leftIcon={<Lock className="h-4 w-4" />}
              aria-invalid={Boolean(emailForm.formState.errors.confirmPassword)}
              {...emailForm.register('confirmPassword')}
            />
          </CustomerAuthField>

          <Button type="submit" fullWidth isLoading={emailForm.formState.isSubmitting || registerMutation.isPending}>
            Create account
          </Button>
        </form>
      ) : (
        <div className="space-y-4">
          <form className="space-y-4" onSubmit={handlePhoneSubmit} noValidate>
            <CustomerAuthField
              id="customer-register-phone-full-name"
              label="Full Name"
              error={phoneForm.formState.errors.fullName?.message}
            >
              <Input
                id="customer-register-phone-full-name"
                autoComplete="name"
                placeholder="Your full name"
                leftIcon={<UserRound className="h-4 w-4" />}
                aria-invalid={Boolean(phoneForm.formState.errors.fullName)}
                {...phoneForm.register('fullName')}
              />
            </CustomerAuthField>

            <CustomerAuthField
              id="customer-register-phone-number"
              label="Phone Number"
              error={phoneForm.formState.errors.phoneNumber?.message}
              hint="Use the same phone number for OTP verification."
            >
              <Input
                id="customer-register-phone-number"
                type="tel"
                autoComplete="tel"
                placeholder="+9627xxxxxxxx"
                leftIcon={<Smartphone className="h-4 w-4" />}
                aria-invalid={Boolean(phoneForm.formState.errors.phoneNumber)}
                {...phoneForm.register('phoneNumber')}
              />
            </CustomerAuthField>

            <Button type="submit" fullWidth isLoading={phoneForm.formState.isSubmitting || registerPhoneMutation.isPending}>
              Send OTP
            </Button>
          </form>

          {otpPhoneNumber ? (
            <form className="space-y-4 rounded-xl border border-app-border bg-app-surface-alt/70 p-4" onSubmit={handleVerifyOtp} noValidate>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-app-muted">OTP Verification</p>

              <CustomerAuthField
                id="customer-register-otp-phone-number"
                label="Phone Number"
                error={otpForm.formState.errors.phoneNumber?.message}
              >
                <Input
                  id="customer-register-otp-phone-number"
                  type="tel"
                  placeholder="+9627xxxxxxxx"
                  leftIcon={<Smartphone className="h-4 w-4" />}
                  aria-invalid={Boolean(otpForm.formState.errors.phoneNumber)}
                  {...otpForm.register('phoneNumber')}
                />
              </CustomerAuthField>

              <CustomerAuthField
                id="customer-register-otp-code"
                label="OTP Code"
                error={otpForm.formState.errors.otpCode?.message}
              >
                <Input
                  id="customer-register-otp-code"
                  inputMode="numeric"
                  placeholder="123456"
                  leftIcon={<KeyRound className="h-4 w-4" />}
                  aria-invalid={Boolean(otpForm.formState.errors.otpCode)}
                  {...otpForm.register('otpCode')}
                />
              </CustomerAuthField>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="submit"
                  fullWidth
                  className="sm:flex-1"
                  isLoading={otpForm.formState.isSubmitting || verifyOtpMutation.isPending}
                >
                  Verify OTP
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="sm:flex-1"
                  onClick={() => {
                    void handleResendOtp()
                  }}
                  isLoading={resendOtpMutation.isPending}
                >
                  Resend OTP
                </Button>
              </div>
            </form>
          ) : null}
        </div>
      )}

      {isBackendUnavailable ? (
        <p className="text-center text-xs text-app-warning">
          Backend is currently unavailable. You can retry registration shortly.
        </p>
      ) : null}
    </CustomerAuthShell>
  )
}
