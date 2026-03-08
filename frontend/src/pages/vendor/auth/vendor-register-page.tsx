import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff, Lock, Mail, MapPin, UserRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { vendorRegisterRequest } from '@/api/vendor-api'
import { ApiError } from '@/api/client'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from '@/components/ui'
import { AuthField } from '@/features/auth/components/auth-field'
import { VendorAuthShell } from '@/features/vendor-auth/components'
import {
  vendorRegisterSchema,
  type VendorRegisterFormValues,
} from '@/features/vendor-auth/schemas'
import { ADMIN_ROUTES, ROUTES } from '@/lib/routes'

function parseOptionalNumber(value: string) {
  const normalized = value.trim()
  if (!normalized) {
    return null
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

export function VendorRegisterPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<VendorRegisterFormValues>({
    resolver: zodResolver(vendorRegisterSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      branchName: '',
      city: '',
      address: '',
      latitude: '',
      longitude: '',
    },
  })

  const registerMutation = useMutation({
    mutationFn: vendorRegisterRequest,
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      const response = await registerMutation.mutateAsync({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        branch: {
          name: values.branchName,
          city: values.city,
          address: values.address,
          latitude: parseOptionalNumber(values.latitude ?? ''),
          longitude: parseOptionalNumber(values.longitude ?? ''),
        },
      })
      toast.success('Vendor registration submitted.', {
        description: response.message,
      })
      navigate(ROUTES.VENDOR_LOGIN, { replace: true })
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Vendor registration failed.'
      setError('email', { type: 'manual', message })
      toast.error(message)
    }
  })

  const titleBadges = useMemo(() => ['Vendor onboarding', 'Backend connected'], [])

  return (
    <VendorAuthShell
      badgeLabel="Vendor Onboarding"
      title="Register as a Vendor"
      description="Submit your profile and branch details to start the admin approval process."
    >
      <Card className="border-app-border bg-app-surface/90 shadow-soft">
        <CardHeader>
          <CardTitle className="text-2xl">Vendor Registration</CardTitle>
          <CardDescription>All required fields are part of the backend registration contract.</CardDescription>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {titleBadges.map((badge) => (
              <span key={badge} className="rounded-full border border-app-border px-2 py-1 text-app-muted">
                {badge}
              </span>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit} noValidate>
            <AuthField id="vendor-register-full-name" label="Full Name" error={errors.fullName?.message}>
              <Input
                id="vendor-register-full-name"
                autoComplete="name"
                placeholder="Owner full name"
                leftIcon={<UserRound className="h-4 w-4" />}
                aria-invalid={Boolean(errors.fullName)}
                {...register('fullName')}
              />
            </AuthField>

            <AuthField id="vendor-register-email" label="Email" error={errors.email?.message}>
              <Input
                id="vendor-register-email"
                type="email"
                autoComplete="email"
                placeholder="vendor@workspace.com"
                leftIcon={<Mail className="h-4 w-4" />}
                aria-invalid={Boolean(errors.email)}
                {...register('email')}
              />
            </AuthField>

            <AuthField id="vendor-register-password" label="Password" error={errors.password?.message}>
              <Input
                id="vendor-register-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Create password"
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
                aria-invalid={Boolean(errors.password)}
                {...register('password')}
              />
            </AuthField>

            <div className="grid gap-4 sm:grid-cols-2">
              <AuthField id="vendor-register-branch-name" label="Branch Name" error={errors.branchName?.message}>
                <Input
                  id="vendor-register-branch-name"
                  placeholder="Branch name"
                  leftIcon={<MapPin className="h-4 w-4" />}
                  aria-invalid={Boolean(errors.branchName)}
                  {...register('branchName')}
                />
              </AuthField>
              <AuthField id="vendor-register-city" label="City" error={errors.city?.message}>
                <Input
                  id="vendor-register-city"
                  placeholder="City"
                  aria-invalid={Boolean(errors.city)}
                  {...register('city')}
                />
              </AuthField>
            </div>

            <AuthField id="vendor-register-address" label="Address" error={errors.address?.message}>
              <Input
                id="vendor-register-address"
                placeholder="Branch address"
                aria-invalid={Boolean(errors.address)}
                {...register('address')}
              />
            </AuthField>

            <div className="grid gap-4 sm:grid-cols-2">
              <AuthField id="vendor-register-latitude" label="Latitude (optional)" error={errors.latitude?.message}>
                <Input
                  id="vendor-register-latitude"
                  placeholder="24.7136"
                  aria-invalid={Boolean(errors.latitude)}
                  {...register('latitude')}
                />
              </AuthField>
              <AuthField id="vendor-register-longitude" label="Longitude (optional)" error={errors.longitude?.message}>
                <Input
                  id="vendor-register-longitude"
                  placeholder="46.6753"
                  aria-invalid={Boolean(errors.longitude)}
                  {...register('longitude')}
                />
              </AuthField>
            </div>

            <Button type="submit" fullWidth size="lg" isLoading={isSubmitting || registerMutation.isPending}>
              Submit registration
            </Button>

            <div className="space-y-2 text-center text-sm text-app-muted">
              <p>
                Already have vendor access?{' '}
                <Link to={ROUTES.VENDOR_LOGIN} className="font-semibold text-app-accent hover:text-orange-300">
                  Sign in
                </Link>
              </p>
              <p>
                Need admin portal instead?{' '}
                <Link to={ADMIN_ROUTES.LOGIN} className="font-semibold text-app-accent hover:text-orange-300">
                  Open admin login
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </VendorAuthShell>
  )
}
