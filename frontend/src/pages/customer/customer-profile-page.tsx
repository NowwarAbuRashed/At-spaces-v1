import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { ApiError } from '@/api/client'
import { CustomerPageShell } from '@/components/customer'
import { LoadingState } from '@/components/shared/loading-state'
import { Card, CardContent, Button } from '@/components/ui'
import {
  customerPreferredCities,
  customerWorkspacePreferences,
  mapProfileToFormValues,
  mockCustomerRecommendationPlaceholder,
} from '@/features/customer-profile/data'
import {
  CustomerComingSoonCard,
  CustomerPreferenceCard,
  CustomerProfileForm,
  CustomerProfileSummaryCard,
} from '@/features/customer-profile/components'
import {
  customerProfileFormSchema,
  type CustomerProfileFormSchemaValues,
} from '@/features/customer-profile/schemas'
import { mapProfileApiToCustomerProfile } from '@/features/customer/lib/customer-mappers'
import { useCustomerAuth } from '@/features/customer-auth/store/customer-auth-context'
import {
  useCustomerProfileQuery,
  useCustomerRecommendationMutation,
  useUpdateCustomerProfileMutation,
} from '@/features/customer/hooks/use-customer-queries'
import { getInlineApiErrorMessage } from '@/lib/api-error'
import type { CustomerProfileFormValues } from '@/types/customer'

function normalizeFormValues(
  values: Partial<CustomerProfileFormValues>,
  fallback: CustomerProfileFormValues,
): CustomerProfileFormValues {
  return {
    fullName: values.fullName ?? fallback.fullName,
    email: values.email ?? fallback.email,
    phone: values.phone ?? fallback.phone,
    preferredCity: values.preferredCity ?? fallback.preferredCity,
    workspacePreference: values.workspacePreference ?? fallback.workspacePreference,
    bookingReminders: values.bookingReminders ?? fallback.bookingReminders,
    scheduleChanges: values.scheduleChanges ?? fallback.scheduleChanges,
    specialOffers: values.specialOffers ?? fallback.specialOffers,
  }
}

export function CustomerProfilePage() {
  const { accessToken } = useCustomerAuth()
  const profileQuery = useCustomerProfileQuery(accessToken)
  const updateProfileMutation = useUpdateCustomerProfileMutation(accessToken)
  const recommendationMutation = useCustomerRecommendationMutation()

  const profile = useMemo(
    () => (profileQuery.data ? mapProfileApiToCustomerProfile(profileQuery.data) : null),
    [profileQuery.data],
  )

  const form = useForm<CustomerProfileFormSchemaValues>({
    resolver: zodResolver(customerProfileFormSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      preferredCity: customerPreferredCities[0],
      workspacePreference: 'quiet',
      bookingReminders: true,
      scheduleChanges: true,
      specialOffers: false,
    },
  })

  useEffect(() => {
    if (!profile) {
      return
    }

    form.reset(mapProfileToFormValues(profile))
  }, [form, profile])

  const watchedValues = useWatch({
    control: form.control,
  })

  const normalizedValues = normalizeFormValues(
    watchedValues,
    mapProfileToFormValues(
      profile ?? {
        id: '',
        fullName: '',
        email: '',
        phone: '',
        memberSince: '',
        loyaltyTier: 'Customer Account',
        preferences: {
          preferredCity: customerPreferredCities[0],
          workspacePreference: 'quiet',
          notifications: {
            bookingReminders: true,
            scheduleChanges: true,
            specialOffers: false,
          },
        },
      },
    ),
  )

  const handleProfileSave = form.handleSubmit(async (values) => {
    try {
      const updated = await updateProfileMutation.mutateAsync({
        fullName: values.fullName,
        email: values.email,
      })
      form.reset(
        mapProfileToFormValues(mapProfileApiToCustomerProfile(updated)),
      )
      toast.success('Profile updated successfully.')
    } catch (error) {
      const message = getInlineApiErrorMessage(error, 'Failed to update profile.')
      form.setError('email', { type: 'manual', message })
      toast.error(message)
    }
  })

  const handleRecommendationClick = async () => {
    try {
      await recommendationMutation.mutateAsync({
        query: 'Suggest the best workspace for me',
        location: normalizedValues.preferredCity,
        time: new Date().toISOString(),
        durationMinutes: 120,
      })
      toast.success('AI recommendation endpoint is available.')
    } catch (error) {
      if (error instanceof ApiError && error.status === 501) {
        toast.message('AI recommendations are currently unavailable (coming soon).')
        return
      }

      toast.error(getInlineApiErrorMessage(error, 'Recommendation request failed.'))
    }
  }

  const handleReset = () => {
    if (!profile) {
      return
    }

    form.reset(mapProfileToFormValues(profile))
    toast.message('Unsaved changes reset.')
  }

  if (profileQuery.isLoading) {
    return (
      <CustomerPageShell
        eyebrow="My Profile"
        title="Loading your profile"
        description="Fetching your account details from the backend."
        badges={['Customer profile']}
      >
        <LoadingState label="Loading profile..." />
      </CustomerPageShell>
    )
  }

  if (profileQuery.error || !profile) {
    return (
      <CustomerPageShell
        eyebrow="My Profile"
        title="Unable to load profile"
        description={getInlineApiErrorMessage(profileQuery.error, 'Profile data is unavailable right now.', {
          sessionLabel: 'user',
        })}
        badges={['Backend response']}
      >
        <Card>
          <CardContent className="space-y-4 pt-6">
            <p className="text-sm text-app-muted">Please retry loading your profile details.</p>
            <Button type="button" variant="secondary" onClick={() => profileQuery.refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </CustomerPageShell>
    )
  }

  return (
    <CustomerPageShell
      eyebrow="My Profile"
      title="Manage your customer profile and preferences"
      description="Update your account details and notification preferences with a simple customer-friendly experience."
      badges={['Live profile integration', 'Safe preference fallback']}
    >
      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <div className="space-y-6">
          <CustomerProfileForm
            form={form}
            onSubmit={handleProfileSave}
            onReset={handleReset}
            disablePhone
            saveButtonLabel={updateProfileMutation.isPending ? 'Saving profile...' : 'Save profile'}
          />
          <CustomerPreferenceCard
            values={normalizedValues}
            preferredCityOptions={customerPreferredCities}
            workspaceOptions={customerWorkspacePreferences}
            disabled
            disabledMessage="Preference persistence is not yet supported by backend endpoints, so these controls are read-only."
            onPreferredCityChange={(city) =>
              form.setValue('preferredCity', city, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
              })
            }
            onWorkspacePreferenceChange={(value) =>
              form.setValue('workspacePreference', value, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
              })
            }
            onBookingRemindersChange={(checked) =>
              form.setValue('bookingReminders', checked, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
              })
            }
            onScheduleChangesChange={(checked) =>
              form.setValue('scheduleChanges', checked, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
              })
            }
            onSpecialOffersChange={(checked) =>
              form.setValue('specialOffers', checked, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
              })
            }
          />
        </div>

        <div className="space-y-6">
          <CustomerProfileSummaryCard profile={profile} />
          <CustomerComingSoonCard
            placeholder={{
              ...mockCustomerRecommendationPlaceholder,
              title: 'AI Workspace Match (Currently Unavailable)',
            }}
            onClick={handleRecommendationClick}
          />
        </div>
      </div>
    </CustomerPageShell>
  )
}
