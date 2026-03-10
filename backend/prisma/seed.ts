import {
  ApprovalRequestType,
  ApprovalStatus,
  BookingStatus,
  BranchStatus,
  NotificationType,
  PaymentMethod,
  PaymentProvider,
  PaymentStatus,
  PriceUnit,
  Prisma,
  PrismaClient,
  Role,
  SecurityEventOutcome,
  SecurityEventType,
  UserStatus,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHmac } from 'crypto';

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = 'Password123!';
const DEFAULT_ADMIN_EMAIL = 'admin@atspaces.local';
const DEFAULT_ADMIN_PASSWORD = 'ChangeMe123!';
const DEFAULT_ADMIN_TOTP_SECRET = 'JBSWY3DPEHPK3PXP';
const DEFAULT_HMAC_KEY = 'seed-dev-hmac-key-change-me';

interface SeedContext {
  users: Record<string, { id: number; email: string; password: string }>;
  branches: Record<string, { id: number; name: string }>;
  services: Record<string, { id: number; name: string }>;
  vendorServices: Record<string, { id: number; branchId: number; maxCapacity: number }>;
}

const serviceCatalog = [
  {
    key: 'hotDesk',
    name: 'Hot Desk',
    unit: 'seat',
    description: 'Flexible shared workspace seating for individuals.',
    imageUrl: 'https://cdn.atspaces.test/services/hot-desk-primary.jpg',
  },
  {
    key: 'privateOffice',
    name: 'Private Office',
    unit: 'office',
    description: 'Dedicated private office suites for focused teams.',
    imageUrl: 'https://cdn.atspaces.test/services/private-office-primary.jpg',
  },
  {
    key: 'meetingRoom',
    name: 'Meeting Room',
    unit: 'room',
    description: 'Bookable meeting rooms with presentation-ready equipment.',
    imageUrl: 'https://cdn.atspaces.test/services/meeting-room-primary.jpg',
  },
] as const;

const facilityCatalog = [
  { key: 'wifi', name: 'WiFi', icon: 'wifi', description: 'Business-grade high-speed internet.' },
  { key: 'parking', name: 'Parking', icon: 'parking', description: 'On-site parking for members.' },
  { key: 'elevator', name: 'Elevator', icon: 'elevator', description: 'Accessible elevator access.' },
  { key: 'reception', name: 'Reception', icon: 'reception', description: 'Front-desk support during hours.' },
  { key: 'coffee', name: 'Coffee Bar', icon: 'coffee', description: 'Coffee and beverages for members.' },
  { key: 'security', name: '24/7 Security', icon: 'security', description: 'Monitored secure building access.' },
] as const;

const featureCatalog = [
  { key: 'whiteboard', name: 'Whiteboard', description: 'In-room whiteboard for planning.' },
  { key: 'screen', name: 'Screen', description: 'HD screen for presentations.' },
  { key: 'meetingTable', name: 'Meeting Table', description: 'Large collaborative meeting table.' },
  { key: 'video', name: 'Video Conferencing', description: 'Video conferencing setup.' },
  { key: 'power', name: 'Power Outlets', description: 'Accessible outlets at each seat.' },
  { key: 'acoustic', name: 'Acoustic Panels', description: 'Improved sound isolation.' },
] as const;

const branchSeeds = [
  {
    key: 'abdali',
    ownerKey: 'vendorActive',
    name: 'Abdali Business Hub',
    description: 'Flagship branch for workshops and client meetings.',
    city: 'Amman',
    address: 'Abdali Boulevard, Building 12',
    latitude: 31.956578,
    longitude: 35.910637,
    status: BranchStatus.active,
    facilities: ['wifi', 'parking', 'reception', 'coffee', 'security'],
  },
  {
    key: 'riyadh',
    ownerKey: 'vendorActive',
    name: 'Riyadh Tech District Workspace',
    description: 'Modern workspace branch near business district towers.',
    city: 'Riyadh',
    address: 'King Fahd Road, Tower 8',
    latitude: 24.713552,
    longitude: 46.675297,
    status: BranchStatus.active,
    facilities: ['wifi', 'elevator', 'parking', 'security'],
  },
  {
    key: 'jeddahPaused',
    ownerKey: 'vendorActive',
    name: 'Jeddah Waterfront Branch',
    description: 'Temporarily paused branch for admin status scenarios.',
    city: 'Jeddah',
    address: 'Corniche Road, Block C',
    latitude: 21.543333,
    longitude: 39.172779,
    status: BranchStatus.suspended,
    facilities: ['wifi', 'parking', 'reception'],
  },
  {
    key: 'pendingVendor',
    ownerKey: 'vendorPending',
    name: 'Khobar Growth Branch',
    description: 'New vendor branch awaiting onboarding approval.',
    city: 'Khobar',
    address: 'Prince Turki Street, Business Park',
    latitude: 26.279442,
    longitude: 50.208328,
    status: BranchStatus.pending,
    facilities: ['wifi', 'parking'],
  },
] as const;

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function getUtcDate(offsetDays: number, hour: number, minute = 0): Date {
  const now = new Date();
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + offsetDays,
      hour,
      minute,
      0,
      0,
    ),
  );
}

function bookingNumber(offsetDays: number, sequence: number): string {
  const date = getUtcDate(offsetDays, 0, 0);
  const y = date.getUTCFullYear();
  const m = `${date.getUTCMonth() + 1}`.padStart(2, '0');
  const d = `${date.getUTCDate()}`.padStart(2, '0');
  return `BKG-${y}${m}${d}-${String(sequence).padStart(4, '0')}`;
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sortValue(item));
  }
  if (value && typeof value === 'object') {
    const source = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(source).sort()) {
      sorted[key] = sortValue(source[key]);
    }
    return sorted;
  }
  return value;
}

function signApprovalPayload(payload: Record<string, unknown>): string {
  const key = process.env.HMAC_APPROVAL_REQUESTS_KEY?.trim() || DEFAULT_HMAC_KEY;
  return createHmac('sha256', key).update(JSON.stringify(sortValue(payload))).digest('hex');
}

async function resetSeedDomainData(): Promise<void> {
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.securityEvent.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.vendorServiceImage.deleteMany();
  await prisma.approvalRequest.deleteMany();
  await prisma.vendorService.deleteMany();
  await prisma.serviceImage.deleteMany();
  await prisma.serviceFeature.deleteMany();
  await prisma.branchFacility.deleteMany();
  await prisma.otpSession.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.feature.deleteMany();
  await prisma.facility.deleteMany();
  await prisma.service.deleteMany();
}

async function seedCatalogs(context: SeedContext): Promise<void> {
  await prisma.service.createMany({
    data: serviceCatalog.map((service) => ({
      name: service.name,
      unit: service.unit,
      description: service.description,
      isActive: true,
    })),
  });
  await prisma.facility.createMany({
    data: facilityCatalog.map((facility) => ({
      name: facility.name,
      icon: facility.icon,
      description: facility.description,
      isActive: true,
    })),
  });
  await prisma.feature.createMany({
    data: featureCatalog.map((feature) => ({
      name: feature.name,
      description: feature.description,
      isActive: true,
    })),
  });

  const services = await prisma.service.findMany({
    where: {
      name: {
        in: serviceCatalog.map((item) => item.name),
      },
    },
  });
  for (const service of services) {
    const key = serviceCatalog.find((item) => item.name === service.name)?.key;
    if (key) {
      context.services[key] = { id: service.id, name: service.name };
    }
  }

  await prisma.serviceImage.createMany({
    data: serviceCatalog.map((item, index) => ({
      serviceId: context.services[item.key].id,
      url: item.imageUrl,
      storageKey: `seed/service/${item.key}-primary.jpg`,
      isPrimary: true,
      sortOrder: index,
    })),
  });

  const features = await prisma.feature.findMany({
    where: {
      name: {
        in: featureCatalog.map((item) => item.name),
      },
    },
  });
  const featureByKey = new Map<string, number>();
  for (const feature of features) {
    const key = featureCatalog.find((item) => item.name === feature.name)?.key;
    if (key) {
      featureByKey.set(key, feature.id);
    }
  }

  await prisma.serviceFeature.createMany({
    data: [
      { serviceId: context.services.hotDesk.id, featureId: featureByKey.get('power')! },
      { serviceId: context.services.hotDesk.id, featureId: featureByKey.get('acoustic')! },
      { serviceId: context.services.privateOffice.id, featureId: featureByKey.get('power')! },
      { serviceId: context.services.privateOffice.id, featureId: featureByKey.get('whiteboard')! },
      { serviceId: context.services.privateOffice.id, featureId: featureByKey.get('acoustic')! },
      { serviceId: context.services.meetingRoom.id, featureId: featureByKey.get('whiteboard')! },
      { serviceId: context.services.meetingRoom.id, featureId: featureByKey.get('screen')! },
      { serviceId: context.services.meetingRoom.id, featureId: featureByKey.get('meetingTable')! },
      { serviceId: context.services.meetingRoom.id, featureId: featureByKey.get('video')! },
      { serviceId: context.services.meetingRoom.id, featureId: featureByKey.get('power')! },
    ],
  });
}

async function seedUsers(context: SeedContext): Promise<void> {
  const adminSeedEmail = normalizeEmail(process.env.ADMIN_SEED_EMAIL || DEFAULT_ADMIN_EMAIL);
  const adminSeedPassword = process.env.ADMIN_SEED_PASSWORD?.trim() || DEFAULT_ADMIN_PASSWORD;
  const adminSeedTotp = process.env.ADMIN_SEED_TOTP_SECRET?.trim() || DEFAULT_ADMIN_TOTP_SECRET;
  const adminSeedName = process.env.ADMIN_SEED_FULL_NAME?.trim() || 'AtSpaces Admin QA';

  const users: Array<{
    key: string;
    role: Role;
    fullName: string;
    email: string;
    password: string;
    status: UserStatus;
    isEmailVerified: boolean;
    mfaEnabled?: boolean;
    mfaSecretEnc?: string | null;
  }> = [
    {
      key: 'adminPrimary',
      role: Role.admin,
      fullName: adminSeedName,
      email: adminSeedEmail,
      password: adminSeedPassword,
      status: UserStatus.active,
      isEmailVerified: true,
      mfaEnabled: true,
      mfaSecretEnc: adminSeedTotp,
    },
    {
      key: 'adminOps',
      role: Role.admin,
      fullName: 'AtSpaces Ops Admin',
      email: 'ops-admin@atspaces.local',
      password: DEFAULT_ADMIN_PASSWORD,
      status: UserStatus.active,
      isEmailVerified: true,
      mfaEnabled: true,
      mfaSecretEnc: 'JBSWY3DPEHPK3PWQ',
    },
    {
      key: 'vendorActive',
      role: Role.vendor,
      fullName: 'Phase3 Vendor QA',
      email: 'phase3-vendor@example.com',
      password: DEFAULT_PASSWORD,
      status: UserStatus.active,
      isEmailVerified: true,
    },
    {
      key: 'vendorPending',
      role: Role.vendor,
      fullName: 'Phase3 Vendor Pending',
      email: 'phase3-vendor-pending@example.com',
      password: DEFAULT_PASSWORD,
      status: UserStatus.pending,
      isEmailVerified: true,
    },
    {
      key: 'customerBooked',
      role: Role.customer,
      fullName: 'QA Customer Bookings',
      email: 'qa.customer.bookings@atspaces.local',
      password: DEFAULT_PASSWORD,
      status: UserStatus.active,
      isEmailVerified: true,
    },
    {
      key: 'customerFresh',
      role: Role.customer,
      fullName: 'QA Customer Fresh',
      email: 'qa.customer.fresh@atspaces.local',
      password: DEFAULT_PASSWORD,
      status: UserStatus.active,
      isEmailVerified: true,
    },
  ];

  const hashCache = new Map<string, string>();
  for (const user of users) {
    if (!hashCache.has(user.password)) {
      hashCache.set(user.password, await bcrypt.hash(user.password, 12));
    }
  }

  for (const user of users) {
    const normalizedEmail = normalizeEmail(user.email);
    const created = await prisma.user.upsert({
      where: {
        email: normalizedEmail,
      },
      update: {
        role: user.role,
        fullName: user.fullName,
        passwordHash: hashCache.get(user.password)!,
        status: user.status,
        isEmailVerified: user.isEmailVerified,
        mfaEnabled: user.mfaEnabled ?? false,
        mfaSecretEnc: user.mfaSecretEnc ?? null,
        deletedAt: null,
      },
      create: {
        role: user.role,
        fullName: user.fullName,
        email: normalizedEmail,
        passwordHash: hashCache.get(user.password)!,
        status: user.status,
        isEmailVerified: user.isEmailVerified,
        mfaEnabled: user.mfaEnabled ?? false,
        mfaSecretEnc: user.mfaSecretEnc ?? null,
      },
    });

    context.users[user.key] = {
      id: created.id,
      email: normalizedEmail,
      password: user.password,
    };
  }

  const seededEmails = users.map((item) => normalizeEmail(item.email));
  await prisma.user.updateMany({
    where: {
      deletedAt: null,
      OR: [
        { email: null },
        {
          email: {
            notIn: seededEmails,
          },
        },
      ],
    },
    data: {
      deletedAt: new Date(),
    },
  });
}

async function seedBranchesAndBranchFacilities(context: SeedContext): Promise<void> {
  const facilities = await prisma.facility.findMany({
    where: {
      name: {
        in: facilityCatalog.map((item) => item.name),
      },
    },
  });
  const facilityIdByKey = new Map<string, number>();
  for (const facility of facilities) {
    const key = facilityCatalog.find((item) => item.name === facility.name)?.key;
    if (key) {
      facilityIdByKey.set(key, facility.id);
    }
  }

  for (const branchSeed of branchSeeds) {
    const created = await prisma.branch.create({
      data: {
        ownerId: context.users[branchSeed.ownerKey].id,
        name: branchSeed.name,
        description: branchSeed.description,
        city: branchSeed.city,
        address: branchSeed.address,
        latitude: branchSeed.latitude,
        longitude: branchSeed.longitude,
        status: branchSeed.status,
      },
    });

    context.branches[branchSeed.key] = { id: created.id, name: created.name };

    await prisma.branchFacility.createMany({
      data: branchSeed.facilities.map((facilityKey) => ({
        branchId: created.id,
        facilityId: facilityIdByKey.get(facilityKey)!,
        isAvailable: true,
      })),
    });
  }
}

async function seedVendorServices(context: SeedContext): Promise<void> {
  const vendorActiveId = context.users.vendorActive.id;
  const serviceHotDesk = context.services.hotDesk.id;
  const servicePrivateOffice = context.services.privateOffice.id;
  const serviceMeetingRoom = context.services.meetingRoom.id;

  const hotDeskAbdali = await prisma.vendorService.create({
    data: {
      vendorId: vendorActiveId,
      branchId: context.branches.abdali.id,
      serviceId: serviceHotDesk,
      name: 'Abdali Hot Desk Access',
      description: 'Open desk access with ergonomic seating and fast internet.',
      pricePerUnit: 6.5,
      priceUnit: PriceUnit.hour,
      maxCapacity: 12,
      isAvailable: true,
    },
  });
  const privateOfficeAbdali = await prisma.vendorService.create({
    data: {
      vendorId: vendorActiveId,
      branchId: context.branches.abdali.id,
      serviceId: servicePrivateOffice,
      name: 'Abdali Private Office Suite',
      description: 'Quiet private office with dedicated AC and team storage.',
      pricePerUnit: 95,
      priceUnit: PriceUnit.day,
      maxCapacity: 4,
      isAvailable: true,
    },
  });
  const meetingAbdali = await prisma.vendorService.create({
    data: {
      vendorId: vendorActiveId,
      branchId: context.branches.abdali.id,
      serviceId: serviceMeetingRoom,
      name: 'Abdali Meeting Room A',
      description: 'Boardroom setup for client meetings and workshops.',
      pricePerUnit: 18,
      priceUnit: PriceUnit.hour,
      maxCapacity: 10,
      isAvailable: true,
    },
  });
  const hotDeskRiyadh = await prisma.vendorService.create({
    data: {
      vendorId: vendorActiveId,
      branchId: context.branches.riyadh.id,
      serviceId: serviceHotDesk,
      name: 'Riyadh Hot Desk Zone',
      description: 'Community-focused hot desk floor with business lounge access.',
      pricePerUnit: 8,
      priceUnit: PriceUnit.hour,
      maxCapacity: 9,
      isAvailable: true,
    },
  });
  const meetingRiyadh = await prisma.vendorService.create({
    data: {
      vendorId: vendorActiveId,
      branchId: context.branches.riyadh.id,
      serviceId: serviceMeetingRoom,
      name: 'Riyadh Collaboration Room',
      description: 'Video-ready meeting room for product demos and sales calls.',
      pricePerUnit: 22,
      priceUnit: PriceUnit.hour,
      maxCapacity: 8,
      isAvailable: true,
    },
  });

  context.vendorServices.hotDeskAbdali = { id: hotDeskAbdali.id, branchId: hotDeskAbdali.branchId, maxCapacity: hotDeskAbdali.maxCapacity };
  context.vendorServices.privateOfficeAbdali = { id: privateOfficeAbdali.id, branchId: privateOfficeAbdali.branchId, maxCapacity: privateOfficeAbdali.maxCapacity };
  context.vendorServices.meetingAbdali = { id: meetingAbdali.id, branchId: meetingAbdali.branchId, maxCapacity: meetingAbdali.maxCapacity };
  context.vendorServices.hotDeskRiyadh = { id: hotDeskRiyadh.id, branchId: hotDeskRiyadh.branchId, maxCapacity: hotDeskRiyadh.maxCapacity };
  context.vendorServices.meetingRiyadh = { id: meetingRiyadh.id, branchId: meetingRiyadh.branchId, maxCapacity: meetingRiyadh.maxCapacity };

  await prisma.vendorServiceImage.createMany({
    data: [
      { vendorServiceId: hotDeskAbdali.id, url: 'https://cdn.atspaces.test/vendor-services/abdali-hot-desk.jpg', storageKey: 'seed/vendor-services/abdali-hot-desk.jpg', isPrimary: true, sortOrder: 0 },
      { vendorServiceId: privateOfficeAbdali.id, url: 'https://cdn.atspaces.test/vendor-services/abdali-private-office.jpg', storageKey: 'seed/vendor-services/abdali-private-office.jpg', isPrimary: true, sortOrder: 0 },
      { vendorServiceId: meetingAbdali.id, url: 'https://cdn.atspaces.test/vendor-services/abdali-meeting-room.jpg', storageKey: 'seed/vendor-services/abdali-meeting-room.jpg', isPrimary: true, sortOrder: 0 },
      { vendorServiceId: hotDeskRiyadh.id, url: 'https://cdn.atspaces.test/vendor-services/riyadh-hot-desk.jpg', storageKey: 'seed/vendor-services/riyadh-hot-desk.jpg', isPrimary: true, sortOrder: 0 },
      { vendorServiceId: meetingRiyadh.id, url: 'https://cdn.atspaces.test/vendor-services/riyadh-meeting-room.jpg', storageKey: 'seed/vendor-services/riyadh-meeting-room.jpg', isPrimary: true, sortOrder: 0 },
    ],
  });
}

async function seedAvailability(context: SeedContext): Promise<void> {
  const ranges = [
    { dayOffset: 1, startHour: 8, endHour: 20 },
    { dayOffset: 2, startHour: 8, endHour: 20 },
    { dayOffset: 3, startHour: 8, endHour: 20 },
  ];

  const rows: Prisma.AvailabilityCreateManyInput[] = [];
  const append = (vendorServiceId: number, availableUnits: number) => {
    for (const range of ranges) {
      rows.push({
        vendorServiceId,
        slotStart: getUtcDate(range.dayOffset, range.startHour),
        slotEnd: getUtcDate(range.dayOffset, range.endHour),
        availableUnits,
        isBlocked: false,
      });
    }
  };

  append(context.vendorServices.hotDeskAbdali.id, 10);
  append(context.vendorServices.privateOfficeAbdali.id, 4);
  append(context.vendorServices.meetingAbdali.id, 8);
  append(context.vendorServices.hotDeskRiyadh.id, 7);
  append(context.vendorServices.meetingRiyadh.id, 6);

  await prisma.availability.createMany({ data: rows });
}

async function seedBookingsAndPayments(context: SeedContext): Promise<void> {
  const customerId = context.users.customerBooked.id;
  const now = new Date();

  const confirmed = await prisma.booking.create({
    data: {
      bookingNumber: bookingNumber(1, 1001),
      customerId,
      vendorServiceId: context.vendorServices.hotDeskAbdali.id,
      branchId: context.vendorServices.hotDeskAbdali.branchId,
      startTime: getUtcDate(1, 11),
      endTime: getUtcDate(1, 13),
      quantity: 2,
      totalPrice: 26,
      currency: 'JOD',
      status: BookingStatus.confirmed,
      paymentStatus: PaymentStatus.paid,
      paymentMethod: PaymentMethod.card,
      createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
    },
  });
  const cancelled = await prisma.booking.create({
    data: {
      bookingNumber: bookingNumber(-1, 1002),
      customerId,
      vendorServiceId: context.vendorServices.meetingAbdali.id,
      branchId: context.vendorServices.meetingAbdali.branchId,
      startTime: getUtcDate(-1, 9),
      endTime: getUtcDate(-1, 10),
      quantity: 1,
      totalPrice: 18,
      currency: 'JOD',
      status: BookingStatus.cancelled,
      paymentStatus: PaymentStatus.refunded,
      paymentMethod: PaymentMethod.card,
      cancelledAt: new Date(now.getTime() - 20 * 60 * 60 * 1000),
      cancellationReason: 'Customer schedule conflict',
      createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
    },
  });
  const completed = await prisma.booking.create({
    data: {
      bookingNumber: bookingNumber(-3, 1003),
      customerId,
      vendorServiceId: context.vendorServices.privateOfficeAbdali.id,
      branchId: context.vendorServices.privateOfficeAbdali.branchId,
      startTime: getUtcDate(-3, 9),
      endTime: getUtcDate(-3, 17),
      quantity: 1,
      totalPrice: 95,
      currency: 'JOD',
      status: BookingStatus.completed,
      paymentStatus: PaymentStatus.paid,
      paymentMethod: PaymentMethod.cash,
      createdAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
    },
  });
  const actionable = await prisma.booking.create({
    data: {
      bookingNumber: bookingNumber(2, 1004),
      customerId,
      vendorServiceId: context.vendorServices.hotDeskAbdali.id,
      branchId: context.vendorServices.hotDeskAbdali.branchId,
      startTime: getUtcDate(2, 10),
      endTime: getUtcDate(2, 12),
      quantity: 1,
      totalPrice: 13,
      currency: 'JOD',
      status: BookingStatus.pending,
      paymentStatus: PaymentStatus.pending,
      paymentMethod: PaymentMethod.apple_pay,
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
  });
  const freshCustomerBooking = await prisma.booking.create({
    data: {
      bookingNumber: bookingNumber(3, 1005),
      customerId: context.users.customerFresh.id,
      vendorServiceId: context.vendorServices.meetingRiyadh.id,
      branchId: context.vendorServices.meetingRiyadh.branchId,
      startTime: getUtcDate(3, 14),
      endTime: getUtcDate(3, 15),
      quantity: 1,
      totalPrice: 22,
      currency: 'JOD',
      status: BookingStatus.pending,
      paymentStatus: PaymentStatus.pending,
      paymentMethod: PaymentMethod.cash,
      createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
    },
  });

  await prisma.payment.createMany({
    data: [
      { bookingId: confirmed.id, provider: PaymentProvider.stripe, providerRef: 'seed-pay-confirmed-1001', method: PaymentMethod.card, amount: 26, currency: 'JOD', status: PaymentStatus.paid, paidAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000) },
      { bookingId: cancelled.id, provider: PaymentProvider.stripe, providerRef: 'seed-pay-cancelled-1002', method: PaymentMethod.card, amount: 18, currency: 'JOD', status: PaymentStatus.refunded, paidAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000) },
      { bookingId: completed.id, provider: PaymentProvider.none, providerRef: 'seed-pay-completed-1003', method: PaymentMethod.cash, amount: 95, currency: 'JOD', status: PaymentStatus.paid, paidAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) },
      { bookingId: actionable.id, provider: PaymentProvider.none, providerRef: 'seed-pay-actionable-1004', method: PaymentMethod.apple_pay, amount: 13, currency: 'JOD', status: PaymentStatus.pending },
      { bookingId: freshCustomerBooking.id, provider: PaymentProvider.none, providerRef: 'seed-pay-riyadh-1005', method: PaymentMethod.cash, amount: 22, currency: 'JOD', status: PaymentStatus.pending },
    ],
  });
}

async function seedApprovalRequests(context: SeedContext): Promise<void> {
  const pendingPayload = {
    branch: {
      name: context.branches.pendingVendor.name,
      city: 'Khobar',
      address: 'Prince Turki Street, Business Park',
      latitude: 26.279442,
      longitude: 50.208328,
    },
    requestedAt: getUtcDate(0, 8).toISOString(),
  };
  const approvedPayload = {
    branchId: context.branches.abdali.id,
    currentCapacity: context.vendorServices.meetingAbdali.maxCapacity,
    newCapacity: 12,
    reason: 'High weekday demand from enterprise teams.',
    requestedAt: getUtcDate(-4, 9).toISOString(),
    vendorId: context.users.vendorActive.id,
    vendorServiceId: context.vendorServices.meetingAbdali.id,
  };
  const rejectedPayload = {
    vendorServiceId: context.vendorServices.meetingRiyadh.id,
    requestedPricePerUnit: 140,
    currentPricePerUnit: 22,
    reason: 'Requested increase exceeds approved pricing policy.',
    requestedAt: getUtcDate(-2, 11).toISOString(),
  };

  await prisma.approvalRequest.createMany({
    data: [
      {
        type: ApprovalRequestType.vendor_registration,
        status: ApprovalStatus.pending,
        branchId: context.branches.pendingVendor.id,
        requestedById: context.users.vendorPending.id,
        payload: pendingPayload as Prisma.InputJsonValue,
        payloadHmac: signApprovalPayload(pendingPayload),
        createdAt: getUtcDate(0, 8),
      },
      {
        type: ApprovalRequestType.capacity_request,
        status: ApprovalStatus.approved,
        branchId: context.branches.abdali.id,
        vendorServiceId: context.vendorServices.meetingAbdali.id,
        requestedById: context.users.vendorActive.id,
        reviewedById: context.users.adminPrimary.id,
        payload: approvedPayload as Prisma.InputJsonValue,
        payloadHmac: signApprovalPayload(approvedPayload),
        reason: approvedPayload.reason,
        reviewedAt: getUtcDate(-3, 12),
        createdAt: getUtcDate(-4, 9),
      },
      {
        type: ApprovalRequestType.vendor_service_update,
        status: ApprovalStatus.rejected,
        branchId: context.branches.riyadh.id,
        vendorServiceId: context.vendorServices.meetingRiyadh.id,
        requestedById: context.users.vendorActive.id,
        reviewedById: context.users.adminOps.id,
        payload: rejectedPayload as Prisma.InputJsonValue,
        payloadHmac: signApprovalPayload(rejectedPayload),
        reason: 'Pricing update rejected: missing supporting commercial analysis.',
        reviewedAt: getUtcDate(-1, 15),
        createdAt: getUtcDate(-2, 11),
      },
    ],
  });
}

async function seedNotifications(context: SeedContext): Promise<void> {
  await prisma.notification.createMany({
    data: [
      { userId: context.users.customerBooked.id, type: NotificationType.booking, title: 'Booking confirmed', body: 'Your booking is confirmed for Abdali Business Hub tomorrow at 11:00.', data: { bookingHint: 'confirmed' } as Prisma.InputJsonValue, createdAt: getUtcDate(0, 7) },
      { userId: context.users.customerBooked.id, type: NotificationType.booking, title: 'Booking cancelled', body: 'Your cancelled booking has been refunded.', data: { bookingHint: 'cancelled' } as Prisma.InputJsonValue, readAt: getUtcDate(0, 8), createdAt: getUtcDate(-1, 12) },
      { userId: context.users.customerFresh.id, type: NotificationType.general, title: 'Welcome to AtSpaces', body: 'Complete your first booking to unlock faster checkout.', createdAt: getUtcDate(0, 6) },
      { userId: context.users.vendorActive.id, type: NotificationType.approval, title: 'Capacity request approved', body: 'Your capacity request for Abdali Meeting Room A was approved.', createdAt: getUtcDate(-2, 13) },
      { userId: context.users.vendorActive.id, type: NotificationType.security, title: 'Security login alert', body: 'A login to the vendor portal was detected from a new device.', createdAt: getUtcDate(-1, 9) },
      { userId: context.users.vendorActive.id, type: NotificationType.general, title: 'Billing invoice available', body: 'Billing statement for this month is now ready for review.', createdAt: getUtcDate(0, 5) },
      { userId: context.users.vendorActive.id, type: NotificationType.general, title: 'Operations reminder', body: 'Update tomorrow availability windows before 20:00.', readAt: getUtcDate(0, 6), createdAt: getUtcDate(-1, 16) },
      { userId: context.users.adminPrimary.id, type: NotificationType.approval, title: 'Approval queue updated', body: 'A new vendor registration request is pending review.', createdAt: getUtcDate(0, 7) },
      { userId: context.users.adminPrimary.id, type: NotificationType.security, title: 'Admin security check', body: 'Security policy review requires acknowledgement.', createdAt: getUtcDate(-1, 10) },
      { userId: context.users.adminPrimary.id, type: NotificationType.general, title: 'Pricing sync completed', body: 'Pricing baseline sync completed for active branches.', readAt: getUtcDate(-1, 11), createdAt: getUtcDate(-1, 11) },
      { userId: context.users.adminOps.id, type: NotificationType.general, title: 'Vendor profile update submitted', body: 'A vendor profile update was submitted and requires review.', createdAt: getUtcDate(0, 9) },
    ],
  });
}

async function seedSecurityEvents(context: SeedContext): Promise<void> {
  await prisma.securityEvent.createMany({
    data: [
      { eventType: SecurityEventType.login_success, userId: context.users.adminPrimary.id, ipAddress: '127.0.0.1', userAgent: 'seed-script', outcome: SecurityEventOutcome.success, metadata: { portal: 'admin' } as Prisma.InputJsonValue, createdAt: getUtcDate(0, 7) },
      { eventType: SecurityEventType.mfa_success, userId: context.users.adminPrimary.id, ipAddress: '127.0.0.1', userAgent: 'seed-script', outcome: SecurityEventOutcome.success, metadata: { portal: 'admin' } as Prisma.InputJsonValue, createdAt: getUtcDate(0, 7) },
      { eventType: SecurityEventType.login_success, userId: context.users.vendorActive.id, ipAddress: '127.0.0.1', userAgent: 'seed-script', outcome: SecurityEventOutcome.success, metadata: { portal: 'vendor' } as Prisma.InputJsonValue, createdAt: getUtcDate(0, 6) },
      { eventType: SecurityEventType.approval_reviewed, userId: context.users.adminPrimary.id, ipAddress: '127.0.0.1', userAgent: 'seed-script', outcome: SecurityEventOutcome.success, metadata: { source: 'seed', status: 'approved' } as Prisma.InputJsonValue, createdAt: getUtcDate(-2, 13) },
    ],
  });
}

async function seedAuditLogs(context: SeedContext): Promise<void> {
  const existing = await prisma.auditLog.count({
    where: {
      action: { startsWith: 'seed_activity_' },
      createdAt: { gte: getUtcDate(0, 0) },
    },
  });
  if (existing > 0) {
    return;
  }

  await prisma.auditLog.createMany({
    data: [
      { actorId: context.users.adminPrimary.id, actorRole: Role.admin, action: 'seed_activity_vendor_status_updated', targetType: 'vendor', targetId: context.users.vendorPending.id, oldValue: { status: 'pending' } as Prisma.InputJsonValue, newValue: { status: 'active' } as Prisma.InputJsonValue, ipAddress: '127.0.0.1', userAgent: 'seed-script', createdAt: getUtcDate(0, 6) },
      { actorId: context.users.adminPrimary.id, actorRole: Role.admin, action: 'seed_activity_branch_status_updated', targetType: 'branch', targetId: context.branches.jeddahPaused.id, oldValue: { status: 'suspended' } as Prisma.InputJsonValue, newValue: { status: 'active' } as Prisma.InputJsonValue, ipAddress: '127.0.0.1', userAgent: 'seed-script', createdAt: getUtcDate(0, 7) },
      { actorId: context.users.adminPrimary.id, actorRole: Role.admin, action: 'seed_activity_approval_approved', targetType: 'approval_request', targetId: 1, oldValue: { status: 'pending' } as Prisma.InputJsonValue, newValue: { status: 'approved' } as Prisma.InputJsonValue, ipAddress: '127.0.0.1', userAgent: 'seed-script', createdAt: getUtcDate(-1, 12) },
      { actorId: context.users.adminOps.id, actorRole: Role.admin, action: 'seed_activity_approval_rejected', targetType: 'approval_request', targetId: 2, oldValue: { status: 'pending' } as Prisma.InputJsonValue, newValue: { status: 'rejected' } as Prisma.InputJsonValue, ipAddress: '127.0.0.1', userAgent: 'seed-script', createdAt: getUtcDate(-1, 13) },
      { actorId: context.users.adminPrimary.id, actorRole: Role.admin, action: 'seed_activity_report_exported', targetType: 'report', targetId: null, oldValue: Prisma.JsonNull, newValue: { reportType: 'analytics_overview', format: 'csv' } as Prisma.InputJsonValue, ipAddress: '127.0.0.1', userAgent: 'seed-script', createdAt: getUtcDate(-2, 10) },
    ],
  });
}

async function main(): Promise<void> {
  const context: SeedContext = {
    users: {},
    branches: {},
    services: {},
    vendorServices: {},
  };

  await resetSeedDomainData();
  await seedCatalogs(context);
  await seedUsers(context);
  await seedBranchesAndBranchFacilities(context);
  await seedVendorServices(context);
  await seedAvailability(context);
  await seedBookingsAndPayments(context);
  await seedApprovalRequests(context);
  await seedNotifications(context);
  await seedSecurityEvents(context);
  await seedAuditLogs(context);

  const summary = {
    admins: [context.users.adminPrimary.email, context.users.adminOps.email],
    vendors: [context.users.vendorActive.email, context.users.vendorPending.email],
    customers: [context.users.customerBooked.email, context.users.customerFresh.email],
    primaryAdminPassword: process.env.ADMIN_SEED_PASSWORD?.trim() || DEFAULT_ADMIN_PASSWORD,
    vendorPassword: DEFAULT_PASSWORD,
    customerPassword: DEFAULT_PASSWORD,
    adminTotpSecret: process.env.ADMIN_SEED_TOTP_SECRET?.trim() || DEFAULT_ADMIN_TOTP_SECRET,
  };

  // eslint-disable-next-line no-console
  console.log('Seed completed successfully.');
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(summary, null, 2));
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    // eslint-disable-next-line no-console
    console.error('Seed failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
