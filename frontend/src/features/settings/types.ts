export type SettingsTabKey = 'profile' | 'security' | 'notifications' | 'activity'

export interface ProfileSettings {
  fullName: string
  email: string
  phone: string
}

export interface ToggleSetting {
  key: string
  title: string
  description: string
  enabled: boolean
}

export interface ActivityLogEntry {
  id: string
  title: string
  detail: string
  timestamp: string
}

