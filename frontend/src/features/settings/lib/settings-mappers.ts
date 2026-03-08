import type { AuditLogApiItem, MeApiResponse } from '@/types/api'
import { formatRelativeTime, titleFromSnakeCase } from '@/lib/format'
import type { ActivityLogEntry, ProfileSettings } from '@/features/settings/types'

export function mapMeToProfileSettings(me: MeApiResponse): ProfileSettings {
  return {
    fullName: me.fullName,
    email: me.email ?? '',
    phone: me.phoneNumber ?? '',
  }
}

export function mapAuditLogToSettingsActivity(items: AuditLogApiItem[]): ActivityLogEntry[] {
  return items.map((item) => ({
    id: `LOG-${item.id}`,
    title: titleFromSnakeCase(item.action),
    detail: `${titleFromSnakeCase(item.entity)} #${item.entityId ?? 'n/a'}`,
    timestamp: formatRelativeTime(item.timestamp),
  }))
}
