import { Tabs } from '@/components/ui/tabs'
import type {
  VendorNotificationFilterTab,
  VendorNotificationFilterValue,
} from '@/features/vendor-control/types'

export interface VendorNotificationFilterBarProps {
  filterTabs: VendorNotificationFilterTab[]
  value: VendorNotificationFilterValue
  onChange: (value: VendorNotificationFilterValue) => void
}

export function VendorNotificationFilterBar({
  filterTabs,
  value,
  onChange,
}: VendorNotificationFilterBarProps) {
  return <Tabs items={filterTabs} value={value} onChange={onChange} />
}
