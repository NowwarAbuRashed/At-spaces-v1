import { useMutation } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { uploadImageRequest } from '@/api/uploads-api'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingState } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { SectionCard } from '@/components/shared/section-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useVendorAuth } from '@/features/auth/store/vendor-auth-context'
import { VendorSettingsForm } from '@/features/vendor-control/components'
import { vendorPreferenceSettingsMock } from '@/features/vendor-control/data/vendor-control-mock-data'
import type {
  VendorPreferenceSettings,
  VendorProfileSettings,
} from '@/features/vendor-control/types'
import {
  useUpdateVendorProfileMutation,
  useVendorProfileQuery,
} from '@/features/vendor/hooks/use-vendor-queries'
import { getInlineApiErrorMessage } from '@/lib/api-error'

const PREFERENCES_UNAVAILABLE_MESSAGE =
  'Notification preference endpoints are not available yet. Preferences are shown as unavailable.'

export function VendorSettingsPage() {
  const { accessToken } = useVendorAuth()
  const profileQuery = useVendorProfileQuery(accessToken)
  const updateProfileMutation = useUpdateVendorProfileMutation(accessToken)
  const [profile, setProfile] = useState<VendorProfileSettings>({
    fullName: '',
    email: '',
    phoneNumber: '',
  })
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
  const [preferences, setPreferences] = useState<VendorPreferenceSettings>(vendorPreferenceSettingsMock)
  const uploadImageMutation = useMutation({
    mutationFn: (file: File) => uploadImageRequest({ accessToken: accessToken!, file }),
  })

  useEffect(() => {
    if (!profileQuery.data) {
      return
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfile({
      fullName: profileQuery.data.fullName,
      email: profileQuery.data.email ?? '',
      phoneNumber: profileQuery.data.phoneNumber ?? '',
    })
  }, [profileQuery.data])

  const handleProfileChange = (field: keyof VendorProfileSettings, value: string) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handlePreferenceChange = (field: keyof VendorPreferenceSettings, value: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSave = async () => {
    try {
      await updateProfileMutation.mutateAsync({
        fullName: profile.fullName.trim(),
        email: profile.email.trim(),
      })
      toast.success('Vendor profile updated.')
      toast.info(PREFERENCES_UNAVAILABLE_MESSAGE)
      void profileQuery.refetch()
    } catch (error) {
      toast.error(getInlineApiErrorMessage(error, 'Failed to update vendor profile.', { sessionLabel: 'vendor' }))
    }
  }

  const handleImageUpload = async () => {
    if (!accessToken) {
      toast.error('Sign in as vendor to upload an image.')
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
      toast.error(getInlineApiErrorMessage(error, 'Failed to upload image.', { sessionLabel: 'vendor' }))
    }
  }

  if (profileQuery.isPending) {
    return <LoadingState label="Loading vendor settings..." />
  }

  if (profileQuery.isError) {
    return (
      <EmptyState
        title="Unable to load vendor settings"
        description={getInlineApiErrorMessage(profileQuery.error, 'Please retry in a moment.', {
          sessionLabel: 'vendor',
        })}
        action={
          <Button variant="outline" onClick={() => void profileQuery.refetch()}>
            Retry
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendor Settings"
        description="Manage profile details and communication preferences for your vendor workspace."
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="neutral">Profile Synced</Badge>
            <Badge variant="subtle">Preferences Unavailable</Badge>
          </div>
        }
      />

      <SectionCard title="Profile & Preferences" description="Update profile details via backend user profile APIs.">
        <VendorSettingsForm
          profile={profile}
          preferences={preferences}
          onProfileChange={handleProfileChange}
          onPreferenceChange={handlePreferenceChange}
          onSave={() => {
            void handleSave()
          }}
          isSaving={updateProfileMutation.isPending}
          profileDisabled={updateProfileMutation.isPending}
          preferencesDisabled
          preferencesUnavailableMessage={PREFERENCES_UNAVAILABLE_MESSAGE}
        />
      </SectionCard>

      <SectionCard
        title="Brand Image Upload"
        description="Upload workspace branding image via backend uploads API."
        action={
          <Badge variant="subtle">
            POST /uploads/image
          </Badge>
        }
      >
        <div className="space-y-4">
          <Input
            type="file"
            accept="image/*"
            onChange={(event) => setSelectedImageFile(event.target.files?.[0] ?? null)}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={() => void handleImageUpload()} isLoading={uploadImageMutation.isPending}>
              Upload image
            </Button>
            {uploadedImageUrl ? (
              <a
                href={uploadedImageUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-app-accent hover:text-orange-300"
              >
                Open uploaded image
              </a>
            ) : null}
          </div>
          {uploadedImageUrl ? (
            <img
              src={uploadedImageUrl}
              alt="Uploaded vendor branding"
              className="max-h-48 rounded-xl border border-app-border object-cover"
            />
          ) : null}
        </div>
      </SectionCard>
    </div>
  )
}
