export interface BranchRecord {
  id: string
  name: string
  city: string
  manager: string
  status: 'active' | 'underReview' | 'paused'
  occupancy: number
  todayBookings: number
  services: string[]
}

export interface VendorRecord {
  id: string
  name: string
  email: string
  status: 'active' | 'underReview' | 'suspended'
  reliability: number
  checkIn: number
  noShow: number
  branches: number
  joinedAt: string
}

export interface ApprovalRequest {
  id: string
  title: string
  requester: string
  branch: string
  date: string
  status: 'pending' | 'approved' | 'rejected'
  priority: 'high' | 'medium' | 'low'
}

export interface VendorApplication {
  id: string
  workspaceName: string
  ownerName: string
  city: string
  date: string
  status: 'pending' | 'underReview' | 'approved' | 'rejected'
  isNew?: boolean
}

