import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Bell, Check, Shield, Upload, Waves } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { getMe, updateMe } from '@/api/users-api'
import { listAuditLog } from '@/api/admin-api'
import { uploadImageRequest } from '@/api/uploads-api'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingState } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Tabs } from '@/components/ui'
import { useAuth } from '@/features/auth/store/auth-context'
import { SettingsActivityItem, SettingsToggleRow } from '@/features/settings/components'
import {
  notificationSettingsDefaults,
  profileDefaults,
  securitySettingsDefaults,
  settingsActivityLog,
} from '@/features/settings/data/settings-mock-data'
import {
  mapAuditLogToSettingsActivity,
  mapMeToProfileSettings,
} from '@/features/settings/lib/settings-mappers'
import { getInlineApiErrorMessage } from '@/lib/api-error'
import {
  profileSettingsSchema,
  type ProfileSettingsValues,
} from '@/features/settings/schemas/profile-settings-schema'
import type { SettingsTabKey, ToggleSetting } from '@/features/settings/types'

const SETTINGS_TABS: Array<{ label: string; value: SettingsTabKey }> = [
  { label: 'Profile', value: 'profile' },
  { label: 'Security', value: 'security' },
  { label: 'Notifications', value: 'notifications' },
  { label: 'Activity Log', value: 'activity' },
]
const SETTINGS_UNAVAILABLE_MESSAGE =
  'Security and notification preference endpoints are not available in the current backend contract. Controls are read-only.'
const PHONE_UPDATE_UNAVAILABLE_MESSAGE =
  'Phone number updates are currently unavailable. Backend profile updates support full name and email only.'

export function SettingsPage() {
  const { accessToken } = useAuth()
  const [activeTab, setActiveTab] = useState<SettingsTabKey>('profile')
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
  const [securitySettings] = useState<ToggleSetting[]>(securitySettingsDefaults)
  const [notificationSettings] = useState<ToggleSetting[]>(notificationSettingsDefaults)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileSettingsValues>({
    resolver: zodResolver(profileSettingsSchema),
    defaultValues: profileDefaults,
  })

  const meQuery = useQuery({
    queryKey: ['users', 'me', accessToken],
    queryFn: () => getMe({ accessToken: accessToken! }),
    enabled: Boolean(accessToken),
  })

  const activityQuery = useQuery({
    queryKey: ['admin', 'audit-log', accessToken],
    queryFn: () => listAuditLog({ accessToken: accessToken!, limit: 30 }),
    enabled: Boolean(accessToken),
  })

  const updateProfileMutation = useMutation({
    mutationFn: (values: ProfileSettingsValues) =>
      updateMe({
        accessToken: accessToken!,
        fullName: values.fullName,
        email: values.email,
      }),
  })

  const uploadImageMutation = useMutation({
    mutationFn: (file: File) => uploadImageRequest({ accessToken: accessToken!, file }),
  })

  useEffect(() => {
    if (!accessToken || !meQuery.data) {
      return
    }

    const mapped = mapMeToProfileSettings(meQuery.data)
    reset({
      ...mapped,
      phone: mapped.phone || profileDefaults.phone,
    })
  }, [accessToken, meQuery.data, reset])

  const profileName = useWatch({ control, name: 'fullName' }) || profileDefaults.fullName
  const profileEmail = useWatch({ control, name: 'email' }) || profileDefaults.email

  const activityItems = useMemo(() => {
    if (!accessToken) {
      return settingsActivityLog
    }

    return mapAuditLogToSettingsActivity(activityQuery.data?.items ?? [])
  }, [accessToken, activityQuery.data?.items])

  const onSubmitProfile = handleSubmit(async (values) => {
    if (!accessToken) {
      await new Promise<void>((resolve) => setTimeout(resolve, 500))
      toast.success(`Profile updated for ${values.fullName}.`)
      return
    }

    try {
      const updated = await updateProfileMutation.mutateAsync(values)
      const mapped = mapMeToProfileSettings(updated)
      reset({
        ...mapped,
        phone: mapped.phone || profileDefaults.phone,
      })
      toast.success(`Profile updated for ${mapped.fullName}.`)
    } catch (error) {
      toast.error(getInlineApiErrorMessage(error, 'Failed to update profile.'))
    }
  })

  const handleUploadImage = async () => {
    if (!accessToken) {
      toast.error('Sign in as admin to upload an image.')
      return
    }

    if (!selectedImageFile) {
      toast.error('Select an image first.')
      return
    }

    try {
      const response = await uploadImageMutation.mutateAsync(selectedImageFile)
      setUploadedImageUrl(response.url)
      toast.success('Image uploaded successfully.')
    } catch (error) {
      toast.error(getInlineApiErrorMessage(error, 'Failed to upload image.'))
    }
  }

  const profileSection = (
    <Card className="max-w-4xl">
      <CardHeader>
        <CardTitle className="text-3xl">Profile Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-app-border bg-app-surface-alt/55 p-4">
          <div className="flex items-center gap-4">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-app-surface text-3xl font-semibold text-app-accent">
              {profileName.charAt(0).toUpperCase()}
            </span>
            <div>
              <p className="font-heading text-3xl font-semibold text-app-text">{profileName}</p>
              <p className="text-base text-app-muted">{profileEmail}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input type="file" accept="image/*" onChange={(event) => setSelectedImageFile(event.target.files?.[0] ?? null)} />
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => {
                void handleUploadImage()
              }}
              isLoading={uploadImageMutation.isPending}
            >
              <Upload className="h-4 w-4" />
              Change Photo
            </Button>
          </div>
        </div>
        {uploadedImageUrl ? (
          <div className="rounded-xl border border-app-border bg-app-surface-alt/55 p-3">
            <p className="mb-2 text-sm text-app-muted">Uploaded image preview</p>
            <img src={uploadedImageUrl} alt="Uploaded admin profile" className="max-h-40 rounded-lg border border-app-border object-cover" />
          </div>
        ) : null}

        {accessToken && meQuery.isPending ? <LoadingState label="Loading profile..." className="py-6" /> : null}

        {accessToken && meQuery.isError ? (
          <EmptyState
            title="Unable to load profile"
            description={getInlineApiErrorMessage(meQuery.error, 'Refresh and try again.')}
            action={
              <Button variant="outline" onClick={() => void meQuery.refetch()}>
                Retry
              </Button>
            }
            className="py-8"
          />
        ) : null}

        {!accessToken || meQuery.isSuccess ? (
          <form className="space-y-4" onSubmit={onSubmitProfile} noValidate>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-app-text">Full Name</span>
                <Input
                  aria-invalid={Boolean(errors.fullName)}
                  placeholder="Enter full name"
                  {...register('fullName')}
                />
                {errors.fullName?.message ? (
                  <span className="text-xs text-app-danger">{errors.fullName.message}</span>
                ) : null}
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-app-text">Email</span>
                <Input
                  aria-invalid={Boolean(errors.email)}
                  type="email"
                  placeholder="Enter email"
                  {...register('email')}
                />
                {errors.email?.message ? (
                  <span className="text-xs text-app-danger">{errors.email.message}</span>
                ) : null}
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-app-text">Phone</span>
              <Input
                aria-invalid={Boolean(errors.phone)}
                placeholder="Enter phone number"
                disabled
                {...register('phone')}
              />
              {errors.phone?.message ? (
                <span className="text-xs text-app-danger">{errors.phone.message}</span>
              ) : null}
              <span className="text-xs text-app-muted">{PHONE_UPDATE_UNAVAILABLE_MESSAGE}</span>
            </label>

            <Button
              type="submit"
              className="mt-2 gap-2"
              isLoading={isSubmitting || updateProfileMutation.isPending}
            >
              <Check className="h-4 w-4" />
              Save Changes
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  )

  const securitySection = (
    <Card className="max-w-4xl">
      <CardHeader>
        <CardTitle className="inline-flex items-center gap-2 text-3xl">
          <Shield className="h-5 w-5 text-app-accent" />
          Security Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {securitySettings.map((setting) => (
          <SettingsToggleRow
            key={setting.key}
            title={setting.title}
            description={setting.description}
            enabled={setting.enabled}
            onToggle={() => undefined}
            disabled
          />
        ))}
        <p className="text-xs font-semibold text-app-muted">{SETTINGS_UNAVAILABLE_MESSAGE}</p>
      </CardContent>
    </Card>
  )

  const notificationSection = (
    <Card className="max-w-4xl">
      <CardHeader>
        <CardTitle className="inline-flex items-center gap-2 text-3xl">
          <Bell className="h-5 w-5 text-app-accent" />
          Notification Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {notificationSettings.map((setting) => (
          <SettingsToggleRow
            key={setting.key}
            title={setting.title}
            description={setting.description}
            enabled={setting.enabled}
            onToggle={() => undefined}
            disabled
          />
        ))}
        <p className="text-xs font-semibold text-app-muted">{SETTINGS_UNAVAILABLE_MESSAGE}</p>
      </CardContent>
    </Card>
  )

  const activitySection = (
    <Card className="max-w-4xl">
      <CardHeader>
        <CardTitle className="inline-flex items-center gap-2 text-3xl">
          <Waves className="h-5 w-5 text-app-accent" />
          Activity Log
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {accessToken && activityQuery.isPending ? (
          <LoadingState label="Loading activity log..." className="py-6" />
        ) : null}
        {accessToken && activityQuery.isError ? (
          <EmptyState
            title="Unable to load activity log"
            description={getInlineApiErrorMessage(activityQuery.error, 'Refresh and try again.')}
            action={
              <Button variant="outline" onClick={() => void activityQuery.refetch()}>
                Retry
              </Button>
            }
            className="py-8"
          />
        ) : null}
        {!accessToken || activityQuery.isSuccess ? (
          activityItems.length ? (
            activityItems.map((item) => <SettingsActivityItem key={item.id} item={item} />)
          ) : (
            <EmptyState title="No activity yet" description="Recent admin actions will appear here." />
          )
        ) : null}
      </CardContent>
    </Card>
  )

  let activeTabContent = profileSection
  if (activeTab === 'security') {
    activeTabContent = securitySection
  } else if (activeTab === 'notifications') {
    activeTabContent = notificationSection
  } else if (activeTab === 'activity') {
    activeTabContent = activitySection
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your account and preferences." />

      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        items={SETTINGS_TABS}
        className="max-w-full overflow-x-auto"
      />

      {activeTabContent}
    </div>
  )
}
