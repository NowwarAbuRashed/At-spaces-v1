import type { FormEventHandler } from 'react'
import { Mail, Phone, UserRound } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from '@/components/ui'
import type { CustomerProfileFormValues } from '@/types/customer'

export interface CustomerProfileFormProps {
  form: UseFormReturn<CustomerProfileFormValues>
  onSubmit: FormEventHandler<HTMLFormElement>
  onReset: () => void
  disablePhone?: boolean
  saveButtonLabel?: string
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null
  }

  return <p className="text-xs text-app-danger">{message}</p>
}

export function CustomerProfileForm({
  form,
  onSubmit,
  onReset,
  disablePhone = false,
  saveButtonLabel = 'Save profile',
}: CustomerProfileFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
        <CardDescription>Update your profile details using your customer account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-app-text">Full Name</span>
            <Input
              placeholder="Full name"
              leftIcon={<UserRound className="h-4 w-4" />}
              aria-invalid={Boolean(form.formState.errors.fullName)}
              {...form.register('fullName')}
            />
            <FieldError message={form.formState.errors.fullName?.message} />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-app-text">Email</span>
            <Input
              type="email"
              placeholder="Email address"
              leftIcon={<Mail className="h-4 w-4" />}
              aria-invalid={Boolean(form.formState.errors.email)}
              {...form.register('email')}
            />
            <FieldError message={form.formState.errors.email?.message} />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-app-text">Phone Number</span>
            <Input
              type="tel"
              placeholder="Phone number"
              leftIcon={<Phone className="h-4 w-4" />}
              disabled={disablePhone}
              aria-invalid={Boolean(form.formState.errors.phone)}
              {...form.register('phone')}
            />
            <FieldError message={form.formState.errors.phone?.message} />
            {disablePhone ? (
              <p className="text-xs text-app-muted">Phone updates are currently unavailable via backend API.</p>
            ) : null}
          </label>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" isLoading={form.formState.isSubmitting}>
              {saveButtonLabel}
            </Button>
            <Button type="button" variant="ghost" onClick={onReset}>
              Reset changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
