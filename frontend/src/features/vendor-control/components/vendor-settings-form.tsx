import { ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SettingsToggleRow } from '@/features/settings/components/settings-toggle-row'
import type {
  VendorPreferenceSettings,
  VendorProfileSettings,
} from '@/features/vendor-control/types'

export interface VendorSettingsFormProps {
  profile: VendorProfileSettings
  preferences: VendorPreferenceSettings
  onProfileChange: (field: keyof VendorProfileSettings, value: string) => void
  onPreferenceChange: (field: keyof VendorPreferenceSettings, value: boolean) => void
  onSave: () => void
  profileDisabled?: boolean
  preferencesDisabled?: boolean
  isSaving?: boolean
  preferencesUnavailableMessage?: string
}

export function VendorSettingsForm({
  profile,
  preferences,
  onProfileChange,
  onPreferenceChange,
  onSave,
  profileDisabled = false,
  preferencesDisabled = false,
  isSaving = false,
  preferencesUnavailableMessage,
}: VendorSettingsFormProps) {
  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <h3 className="font-heading text-xl font-semibold text-app-text">Profile Information</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Full Name</span>
            <Input
              value={profile.fullName}
              onChange={(event) => onProfileChange('fullName', event.target.value)}
              disabled={profileDisabled}
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Email</span>
            <Input
              value={profile.email}
              onChange={(event) => onProfileChange('email', event.target.value)}
              disabled={profileDisabled}
            />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Phone Number</span>
            <Input
              value={profile.phoneNumber}
              onChange={(event) => onProfileChange('phoneNumber', event.target.value)}
              disabled={profileDisabled}
            />
          </label>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-heading text-xl font-semibold text-app-text">Preferences</h3>
        <SettingsToggleRow
          title="Email Alerts"
          description="Receive request and operational updates by email."
          enabled={preferences.emailAlerts}
          onToggle={(next) => onPreferenceChange('emailAlerts', next)}
          disabled={preferencesDisabled}
        />
        <SettingsToggleRow
          title="SMS Alerts"
          description="Get urgent status changes directly to your phone."
          enabled={preferences.smsAlerts}
          onToggle={(next) => onPreferenceChange('smsAlerts', next)}
          disabled={preferencesDisabled}
        />
        <SettingsToggleRow
          title="Weekly Digest"
          description="Receive a weekly performance summary."
          enabled={preferences.weeklyDigest}
          onToggle={(next) => onPreferenceChange('weeklyDigest', next)}
          disabled={preferencesDisabled}
        />
        {preferencesUnavailableMessage ? (
          <p className="text-xs font-semibold text-app-muted">{preferencesUnavailableMessage}</p>
        ) : null}
      </section>

      <section className="rounded-xl border border-dashed border-app-border bg-app-surface-alt/35 p-4">
        <p className="inline-flex items-center gap-2 font-semibold text-app-text">
          <ShieldCheck className="h-4 w-4 text-app-accent" />
          Security Placeholder
        </p>
        <p className="mt-1 text-sm text-app-muted">
          Password and advanced security actions will be connected in a later phase.
        </p>
      </section>

      <Button type="button" onClick={onSave} isLoading={isSaving} disabled={profileDisabled}>
        Save Settings
      </Button>
    </div>
  )
}
