import type {
  VendorBranchDetails,
  VendorFacility,
  VendorPriceUnit,
  VendorService,
} from '@/features/vendor-management/types'

export const vendorBranchDetailsMock: VendorBranchDetails = {
  id: 'branch-001',
  name: 'Amman Downtown Hub',
  description:
    'Flagship branch serving premium workspace bookings with high weekday demand and curated service bundles.',
  city: 'Amman',
  address: '12 King Faisal Street, Downtown District',
  latitude: '31.9516',
  longitude: '35.9239',
  status: 'active',
  managerName: 'Maya Al-Masri',
  supportPhone: '+962 6 555 2010',
  occupancyPercent: 78,
  todayBookings: 24,
}

export const vendorFacilitiesMock: VendorFacility[] = [
  {
    id: 'facility-1',
    name: 'High-Speed WiFi',
    iconKey: 'wifi',
    isAvailable: true,
    description: 'Business-grade internet access with segmented guest network.',
    details: 'Average speed 250 Mbps, backup failover enabled.',
  },
  {
    id: 'facility-2',
    name: 'Coffee Bar',
    iconKey: 'coffee',
    isAvailable: true,
    description: 'All-day specialty coffee and refreshments.',
    details: 'Open from 8:00 AM to 8:00 PM.',
  },
  {
    id: 'facility-3',
    name: 'Secure Access',
    iconKey: 'shield',
    isAvailable: true,
    description: 'Controlled entry points with monitored reception.',
    details: 'RFID access with staffed front desk.',
  },
  {
    id: 'facility-4',
    name: 'Valet Parking',
    iconKey: 'car',
    isAvailable: false,
    description: 'Optional vehicle reception during peak windows.',
    details: 'Currently paused pending vendor contract renewal.',
  },
  {
    id: 'facility-5',
    name: 'Presentation Studio',
    iconKey: 'presentation',
    isAvailable: true,
    description: 'Ready-to-use studio for client demos and presentations.',
    details: '4K screen, HDMI + wireless casting support.',
  },
]

export const vendorPriceUnitOptions: VendorPriceUnit[] = ['hour', 'day', 'week', 'month']

export const vendorServicesMock: VendorService[] = [
  {
    id: 'service-001',
    name: 'Premium Desk Slot',
    description: 'Single workstation booking with premium seating and quiet zone access.',
    status: 'active',
    pricePerUnit: 28,
    priceUnit: 'hour',
    activeCapacity: 36,
    totalCapacity: 42,
    features: [
      {
        id: 'feature-001',
        name: 'Dedicated Desk',
        description: 'Ergonomic desk with cable management',
        quantity: 1,
        unitLabel: 'unit',
      },
      {
        id: 'feature-002',
        name: 'Beverage Credits',
        description: 'Complimentary drinks from coffee bar',
        quantity: 2,
        unitLabel: 'credits',
      },
    ],
  },
  {
    id: 'service-002',
    name: 'Meeting Room - 6 Seats',
    description: 'Private room booking for team sessions and external client meetings.',
    status: 'active',
    pricePerUnit: 140,
    priceUnit: 'day',
    activeCapacity: 8,
    totalCapacity: 10,
    features: [
      {
        id: 'feature-003',
        name: 'Display Screen',
        description: 'Large screen with casting support',
        quantity: 1,
        unitLabel: 'unit',
      },
      {
        id: 'feature-004',
        name: 'Whiteboard Kit',
        description: 'Markers and board cleaning pack',
        quantity: 1,
        unitLabel: 'kit',
      },
    ],
  },
  {
    id: 'service-003',
    name: 'Business Lounge Access',
    description: 'Flexible lounge access for short stay bookings and guest waiting sessions.',
    status: 'pending',
    pricePerUnit: 65,
    priceUnit: 'week',
    activeCapacity: 22,
    totalCapacity: 30,
    features: [
      {
        id: 'feature-005',
        name: 'Priority Seating',
        description: 'Preferred lounge table assignment',
        quantity: 1,
        unitLabel: 'slot',
      },
      {
        id: 'feature-006',
        name: 'Reception Support',
        description: 'Guest check-in assistance',
        quantity: 1,
        unitLabel: 'service',
      },
    ],
  },
]
