import { Bell, Building2, Sparkles } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Switch } from '@/components/ui'
import type { CustomerProfileFormValues } from '@/types/customer'

export interface CustomerPreferenceCardProps {
  values: CustomerProfileFormValues
  preferredCityOptions: readonly string[]
  workspaceOptions: readonly { value: string; label: string }[]
  disabled?: boolean
  disabledMessage?: string
  onPreferredCityChange: (city: string) => void
  onWorkspacePreferenceChange: (value: CustomerProfileFormValues['workspacePreference']) => void
  onBookingRemindersChange: (checked: boolean) => void
  onScheduleChangesChange: (checked: boolean) => void
  onSpecialOffersChange: (checked: boolean) => void
}

export function CustomerPreferenceCard({
  values,
  preferredCityOptions,
  workspaceOptions,
  disabled = false,
  disabledMessage,
  onPreferredCityChange,
  onWorkspacePreferenceChange,
  onBookingRemindersChange,
  onScheduleChangesChange,
  onSpecialOffersChange,
}: CustomerPreferenceCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
        <CardDescription>Customize your booking and notification experience.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="space-y-2">
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-app-text">
            <Building2 className="h-4 w-4 text-app-accent" />
            Preferred City
          </span>
          <select
            value={values.preferredCity}
            onChange={(event) => onPreferredCityChange(event.target.value)}
            disabled={disabled}
            className="h-11 w-full rounded-xl border border-app-border bg-app-surface-alt px-3 text-sm text-app-text outline-none transition-all focus:border-app-accent/60 focus:ring-2 focus:ring-app-accent/30"
          >
            {preferredCityOptions.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-app-text">
            <Sparkles className="h-4 w-4 text-app-accent" />
            Workspace Style
          </span>
          <select
            value={values.workspacePreference}
            onChange={(event) =>
              onWorkspacePreferenceChange(
                event.target.value as CustomerProfileFormValues['workspacePreference'],
              )
            }
            disabled={disabled}
            className="h-11 w-full rounded-xl border border-app-border bg-app-surface-alt px-3 text-sm text-app-text outline-none transition-all focus:border-app-accent/60 focus:ring-2 focus:ring-app-accent/30"
          >
            {workspaceOptions.map((workspace) => (
              <option key={workspace.value} value={workspace.value}>
                {workspace.label}
              </option>
            ))}
          </select>
        </label>

        <div className="space-y-3 rounded-xl border border-app-border bg-app-surface-alt/70 p-3">
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-app-text">
            <Bell className="h-4 w-4 text-app-accent" />
            Notifications
          </p>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-app-muted">Booking reminders</p>
            <Switch
              checked={values.bookingReminders}
              onCheckedChange={onBookingRemindersChange}
              label="Booking reminders"
              disabled={disabled}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-app-muted">Schedule change alerts</p>
            <Switch
              checked={values.scheduleChanges}
              onCheckedChange={onScheduleChangesChange}
              label="Schedule changes"
              disabled={disabled}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-app-muted">Special offers</p>
            <Switch
              checked={values.specialOffers}
              onCheckedChange={onSpecialOffersChange}
              label="Special offers"
              disabled={disabled}
            />
          </div>
        </div>
        {disabled && disabledMessage ? (
          <p className="text-xs text-app-muted">{disabledMessage}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
