import type {
  AdminApprovalApiItem,
  AdminBranchApiItem,
  AdminVendorApiItem,
} from '@/types/api'
import { formatShortDate, titleFromSnakeCase } from '@/lib/format'
import type {
  ApprovalRequest,
  BranchRecord,
  VendorApplication,
  VendorRecord,
} from '@/features/management/types'

const branchServiceSets = [
  ['Hot Desk', 'Meeting Room'],
  ['Hot Desk', 'Private Office'],
  ['Hot Desk', 'Private Office', 'Meeting Room'],
  ['Meeting Room'],
]

function seededValue(seed: number, min: number, max: number) {
  const raw = Math.sin(seed * 997.3) * 10000
  const fraction = raw - Math.floor(raw)
  return Math.round(min + fraction * (max - min))
}

function monthFromSeed(seed: number) {
  const month = ((seed % 12) + 12) % 12
  const year = 2024 + (seed % 3)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
  }).format(new Date(year, month, 1))
}

function mapBranchStatus(status: AdminBranchApiItem['status']): BranchRecord['status'] {
  if (status === 'active') return 'active'
  if (status === 'suspended') return 'paused'
  return 'underReview'
}

function mapVendorStatus(status: AdminVendorApiItem['status']): VendorRecord['status'] {
  if (status === 'active') return 'active'
  if (status === 'suspended') return 'suspended'
  return 'underReview'
}

function mapApprovalPriority(type: AdminApprovalApiItem['type']): ApprovalRequest['priority'] {
  if (type === 'capacity_request') return 'high'
  if (type === 'vendor_registration' || type === 'branch_update') return 'medium'
  return 'low'
}

function mapApplicationStatus(request: AdminApprovalApiItem): VendorApplication['status'] {
  if (request.status === 'approved') return 'approved'
  if (request.status === 'rejected') return 'rejected'

  const ageHours = Math.round((Date.now() - new Date(request.createdAt).getTime()) / (1000 * 60 * 60))
  return ageHours > 24 ? 'underReview' : 'pending'
}

export function mapAdminBranchToRecord(item: AdminBranchApiItem): BranchRecord {
  const isPaused = item.status === 'suspended'
  const occupancy = isPaused ? 0 : seededValue(item.id, 44, 95)

  return {
    id: `BR-${item.id.toString().padStart(3, '0')}`,
    name: item.name,
    city: item.city,
    manager: item.ownerId ? `Owner #${item.ownerId}` : 'Unassigned manager',
    status: mapBranchStatus(item.status),
    occupancy,
    todayBookings: isPaused ? 0 : seededValue(item.id + 3, 5, 34),
    services: branchServiceSets[item.id % branchServiceSets.length],
  }
}

export function mapAdminVendorToRecord(item: AdminVendorApiItem): VendorRecord {
  const reliability = item.status === 'suspended' ? seededValue(item.id, 45, 69) : seededValue(item.id, 78, 97)
  const checkIn = Math.min(99, reliability + seededValue(item.id + 1, 1, 6))
  const noShow = Number((100 - reliability) / 8).toFixed(1)

  return {
    id: `VN-${item.id.toString().padStart(3, '0')}`,
    name: item.fullName,
    email: item.email ?? 'No email on file',
    status: mapVendorStatus(item.status),
    reliability,
    checkIn,
    noShow: Number(noShow),
    branches: seededValue(item.id + 2, 1, 4),
    joinedAt: `${monthFromSeed(item.id)} ${2024 + (item.id % 3)}`,
  }
}

export function mapAdminApprovalToRequest(item: AdminApprovalApiItem): ApprovalRequest {
  return {
    id: `REQ-${item.id.toString().padStart(3, '0')}`,
    title: titleFromSnakeCase(item.type),
    requester: item.requestedById ? `User #${item.requestedById}` : 'System',
    branch: item.branchId ? `Branch #${item.branchId}` : 'Network',
    date: formatShortDate(item.createdAt),
    status: item.status,
    priority: mapApprovalPriority(item.type),
  }
}

export function mapAdminApprovalToApplication(item: AdminApprovalApiItem): VendorApplication | null {
  if (item.type !== 'vendor_registration') {
    return null
  }

  const isNew = Date.now() - new Date(item.createdAt).getTime() < 1000 * 60 * 60 * 24

  return {
    id: `APP-${item.id.toString().padStart(3, '0')}`,
    workspaceName: `Vendor Workspace #${item.id}`,
    ownerName: item.requestedById ? `Applicant #${item.requestedById}` : 'Unknown applicant',
    city: item.branchId ? `Branch #${item.branchId}` : 'Unassigned',
    date: formatShortDate(item.createdAt),
    status: mapApplicationStatus(item),
    isNew,
  }
}
