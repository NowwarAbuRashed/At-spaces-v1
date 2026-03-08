import type {
  CustomerBranch,
  CustomerBranchServiceFilterOption,
  CustomerBranchService,
  CustomerServiceUnit,
} from '@/types/customer'

function createService(
  id: string,
  name: string,
  category: string,
  price: number,
  unit: CustomerServiceUnit,
  durationLabel: string,
  capacityLabel: string,
  description: string,
): CustomerBranchService {
  return {
    id,
    name,
    category,
    price,
    unit,
    durationLabel,
    capacityLabel,
    description,
  }
}

export const mockCustomerBranches: CustomerBranch[] = [
  {
    id: 'riyadh-tech-hub',
    name: 'Riyadh Tech Hub',
    city: 'Riyadh',
    district: 'Al Olaya',
    addressLine: 'Olaya Street, Tower 7',
    locationSummary: '2 min walk from Olaya Metro',
    heroHighlight: 'High-performance coworking for focused teams.',
    rating: 4.9,
    reviewsCount: 214,
    description:
      'Premium coworking floors with quiet zones, executive meeting suites, and concierge-level support.',
    facilities: [
      {
        id: 'parking',
        name: 'Covered Parking',
        description: 'Dedicated guest parking with direct access to the main lobby.',
      },
      {
        id: 'coffee-bar',
        name: 'Coffee Bar',
        description: 'All-day barista station with specialty coffee and snacks.',
      },
      {
        id: 'pods',
        name: 'Focus Pods',
        description: 'Sound-treated pods for private calls and focused solo sessions.',
      },
      {
        id: 'security',
        name: '24/7 Security',
        description: 'On-site security and controlled smart entry at all times.',
      },
    ],
    services: [
      createService(
        'hot-desk',
        'Hot Desk',
        'Coworking',
        120,
        'hour',
        '1-8 hours',
        '1 person',
        'Flexible workstation with shared lounge and amenities.',
      ),
      createService(
        'meeting-room',
        'Meeting Room',
        'Meetings',
        180,
        'hour',
        '1-4 hours',
        'Up to 8 people',
        'Smart display, whiteboard, and conferencing equipment included.',
      ),
      createService(
        'private-office',
        'Private Office',
        'Offices',
        650,
        'day',
        'Full-day',
        'Up to 4 people',
        'Ready-to-use private office with dedicated storage.',
      ),
    ],
  },
  {
    id: 'jeddah-bay-collective',
    name: 'Jeddah Bay Collective',
    city: 'Jeddah',
    district: 'Al Shati',
    addressLine: 'Corniche Road, Bay Complex B',
    locationSummary: 'Sea-facing branch near the north corniche',
    heroHighlight: 'Collaborative spaces with a coastal atmosphere.',
    rating: 4.7,
    reviewsCount: 162,
    description:
      'Designed for creative teams with boardrooms, workshop halls, and high-quality media capabilities.',
    facilities: [
      {
        id: 'valet',
        name: 'Valet Parking',
        description: 'Valet parking service during peak business hours.',
      },
      {
        id: 'podcast-room',
        name: 'Podcast Room',
        description: 'Acoustically treated room for recording and livestream sessions.',
      },
      {
        id: 'prayer-room',
        name: 'Prayer Room',
        description: 'Quiet and clean dedicated prayer area.',
      },
      {
        id: 'sea-lounge',
        name: 'Sea View Lounge',
        description: 'Casual lounge area with sea view for networking breaks.',
      },
    ],
    services: [
      createService(
        'team-suite',
        'Team Suite',
        'Offices',
        780,
        'day',
        'Full-day',
        'Up to 6 people',
        'Private suite ideal for project teams and sprint sessions.',
      ),
      createService(
        'workshop-hall',
        'Workshop Hall',
        'Events',
        250,
        'hour',
        '2-6 hours',
        'Up to 24 people',
        'Flexible hall layout for workshops, training, and group sessions.',
      ),
      createService(
        'boardroom',
        'Boardroom',
        'Meetings',
        220,
        'hour',
        '1-4 hours',
        'Up to 10 people',
        'Executive boardroom with premium presentation setup.',
      ),
    ],
  },
  {
    id: 'khobar-business-lounge',
    name: 'Khobar Business Lounge',
    city: 'Khobar',
    district: 'Al Aqrabiyah',
    addressLine: 'King Fahd Road, Business Strip 19',
    locationSummary: 'Business district with direct highway access',
    heroHighlight: 'Executive-friendly spaces for client-facing work.',
    rating: 4.8,
    reviewsCount: 139,
    description:
      'Built for consultants and executives with concierge support, premium lounges, and business-grade services.',
    facilities: [
      {
        id: 'concierge',
        name: 'Concierge Desk',
        description: 'Front desk support for guest handling and room coordination.',
      },
      {
        id: 'wifi',
        name: 'High-Speed Wi-Fi',
        description: 'Reliable secure internet designed for heavy business use.',
      },
      {
        id: 'phone-booths',
        name: 'Phone Booths',
        description: 'Private call booths for short calls and online meetings.',
      },
      {
        id: 'lockers',
        name: 'Secure Lockers',
        description: 'Short-term lockers for documents and personal items.',
      },
    ],
    services: [
      createService(
        'day-pass',
        'Day Pass',
        'Coworking',
        140,
        'day',
        'Full-day',
        '1 person',
        'Full-day coworking access with lounge and work zones.',
      ),
      createService(
        'executive-room',
        'Executive Meeting Room',
        'Meetings',
        210,
        'hour',
        '1-4 hours',
        'Up to 6 people',
        'Premium room for client meetings and internal strategy sessions.',
      ),
      createService(
        'private-office-plus',
        'Private Office Plus',
        'Offices',
        700,
        'day',
        'Full-day',
        'Up to 5 people',
        'Private office with enhanced hospitality and admin support.',
      ),
    ],
  },
  {
    id: 'medina-flex-studio',
    name: 'Medina Flex Studio',
    city: 'Medina',
    district: 'Al Khalidiyyah',
    addressLine: 'Prince Abdul Majeed St, Studio Block 4',
    locationSummary: 'Flexible venue close to key business routes',
    heroHighlight: 'Adaptable studio spaces for workshops and sessions.',
    rating: 4.6,
    reviewsCount: 88,
    description:
      'A configurable studio branch ideal for workshops, coaching sessions, and client-focused events.',
    facilities: [
      {
        id: 'av',
        name: 'A/V Equipment',
        description: 'Built-in screens, microphones, and hybrid event setup.',
      },
      {
        id: 'reception',
        name: 'Reception Support',
        description: 'Guest check-in and flow coordination during sessions.',
      },
      {
        id: 'layout',
        name: 'Flexible Layout',
        description: 'Adjustable furniture arrangements based on event format.',
      },
      {
        id: 'onsite-support',
        name: 'On-Site Support',
        description: 'Support team for setup transitions and event operations.',
      },
    ],
    services: [
      createService(
        'studio-room',
        'Studio Booking',
        'Events',
        190,
        'hour',
        '2-8 hours',
        'Up to 18 people',
        'Flexible studio suitable for workshops and interactive sessions.',
      ),
      createService(
        'seminar-room',
        'Seminar Room',
        'Events',
        230,
        'hour',
        '2-6 hours',
        'Up to 30 people',
        'Tiered seating room for seminars and presentations.',
      ),
      createService(
        'consultation-booth',
        'Consultation Booth',
        'Meetings',
        95,
        'hour',
        '1-3 hours',
        'Up to 2 people',
        'Private booth for one-on-one consultations.',
      ),
    ],
  },
  {
    id: 'dammam-innovation-yard',
    name: 'Dammam Innovation Yard',
    city: 'Dammam',
    district: 'Al Faisaliyah',
    addressLine: 'Innovation Avenue, Block C',
    locationSummary: 'Next to startup district and transport hub',
    heroHighlight: 'Fast-moving spaces for product and growth teams.',
    rating: 4.8,
    reviewsCount: 104,
    description:
      'Modern branch optimized for startup teams with agile rooms, sprint corners, and collaborative lounges.',
    facilities: [
      {
        id: 'whiteboard-walls',
        name: 'Whiteboard Walls',
        description: 'Large writable walls across multiple breakout areas.',
      },
      {
        id: 'breakout-lounge',
        name: 'Breakout Lounge',
        description: 'Informal lounge for brainstorming and quick syncs.',
      },
      {
        id: 'event-host',
        name: 'Event Host Desk',
        description: 'Host support for community gatherings and demo days.',
      },
      {
        id: 'refreshment',
        name: 'Refreshment Bar',
        description: 'Snacks and beverages available throughout the day.',
      },
    ],
    services: [
      createService(
        'sprint-room',
        'Sprint Room',
        'Meetings',
        160,
        'hour',
        '1-6 hours',
        'Up to 8 people',
        'Room designed for agile standups, planning, and retrospectives.',
      ),
      createService(
        'demo-stage',
        'Demo Stage',
        'Events',
        260,
        'hour',
        '2-5 hours',
        'Up to 40 people',
        'Stage-ready setup for product demos and team announcements.',
      ),
      createService(
        'focus-desk',
        'Focus Desk',
        'Coworking',
        90,
        'hour',
        '1-8 hours',
        '1 person',
        'Quiet desk zone for individual focused work.',
      ),
    ],
  },
]

export const mockCustomerBranchCities = ['All Cities', ...new Set(mockCustomerBranches.map((branch) => branch.city))]

export const mockCustomerBranchServiceFilters: CustomerBranchServiceFilterOption[] = (() => {
  const counter = new Map<string, number>()

  for (const branch of mockCustomerBranches) {
    for (const service of branch.services) {
      counter.set(service.id, (counter.get(service.id) ?? 0) + 1)
    }
  }

  return [
    { id: 'all', label: 'All Services', count: mockCustomerBranches.length },
    ...Array.from(counter.entries())
      .map(([id, count]) => {
        const label =
          mockCustomerBranches
            .flatMap((branch) => branch.services)
            .find((service) => service.id === id)?.name ?? id

        return { id, label, count }
      })
      .sort((a, b) => a.label.localeCompare(b.label)),
  ]
})()

export function getMockCustomerBranchById(branchId: string) {
  return mockCustomerBranches.find((branch) => branch.id === branchId)
}

export function getBranchStartingPrice(branch: CustomerBranch) {
  return Math.min(...branch.services.map((service) => service.price))
}
