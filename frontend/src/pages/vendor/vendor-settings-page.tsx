import { useState } from 'react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/page-header'
import { SectionCard } from '@/components/shared/section-card'
import { Badge } from '@/components/ui/badge'
import { VendorSettingsForm } from '@/features/vendor-control/components'
import {
  vendorPreferenceSettingsMock,
  vendorProfileSettingsMock,
} from '@/features/vendor-control/data/vendor-control-mock-data'
import type {
  VendorPreferenceSettings,
  VendorProfileSettings,
} from '@/features/vendor-control/types'

export function VendorSettingsPage() {
  const [profile, setProfile] = useState<VendorProfileSettings>(vendorProfileSettingsMock)
  const [preferences, setPreferences] = useState<VendorPreferenceSettings>(vendorPreferenceSettingsMock)

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendor Settings"
        description="Manage profile details and communication preferences for your vendor workspace."
        actions={<Badge variant="neutral">Mock Preferences</Badge>}
      />

      <SectionCard
        title="Profile & Preferences"
        description="All updates stay in local mock state for this phase."
      >
        <VendorSettingsForm
          profile={profile}
          preferences={preferences}
          onProfileChange={handleProfileChange}
          onPreferenceChange={handlePreferenceChange}
          onSave={() => toast.success('Settings updated in local state (mock-only).')}
        />
      </SectionCard>
    </div>
  )
}
