import { PrismaClient, Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const services = [
  {
    name: 'Hot Desk',
    unit: 'seat',
    description: 'Flexible workspace seating for individuals.',
  },
  {
    name: 'Private Office',
    unit: 'office',
    description: 'Dedicated private office for teams and businesses.',
  },
  {
    name: 'Meeting Room',
    unit: 'room',
    description: 'Bookable meeting rooms with hourly and daily options.',
  },
];

const facilities = [
  { name: 'WiFi', icon: 'wifi', description: 'High-speed internet access' },
  { name: 'Parking', icon: 'parking', description: 'On-site parking spaces' },
  { name: 'Elevator', icon: 'elevator', description: 'Accessible elevator access' },
  { name: 'Reception', icon: 'reception', description: 'Front desk assistance' },
  { name: 'Coffee Bar', icon: 'coffee', description: 'Complimentary beverages' },
];

const features = [
  { name: 'Whiteboard', description: 'In-room whiteboard' },
  { name: 'Screen', description: 'Display screen for presentations' },
  { name: 'Meeting Table', description: 'Large table for collaborative work' },
  { name: 'Video Conferencing', description: 'Video conferencing support' },
  { name: 'Power Outlets', description: 'Accessible power outlets' },
];

async function seedServices(): Promise<void> {
  for (const service of services) {
    await prisma.service.upsert({
      where: { name: service.name },
      update: {
        description: service.description,
        unit: service.unit,
      },
      create: service,
    });
  }
}

async function seedFacilities(): Promise<void> {
  for (const facility of facilities) {
    await prisma.facility.upsert({
      where: { name: facility.name },
      update: {
        icon: facility.icon,
        description: facility.description,
        isActive: true,
      },
      create: {
        ...facility,
        isActive: true,
      },
    });
  }
}

async function seedFeatures(): Promise<void> {
  for (const feature of features) {
    await prisma.feature.upsert({
      where: { name: feature.name },
      update: {
        description: feature.description,
        isActive: true,
      },
      create: {
        ...feature,
        isActive: true,
      },
    });
  }
}

async function seedAdmin(): Promise<void> {
  const email = process.env.ADMIN_SEED_EMAIL;
  const password = process.env.ADMIN_SEED_PASSWORD;
  const fullName = process.env.ADMIN_SEED_FULL_NAME ?? 'At Spaces Admin';
  const totpSecret = process.env.ADMIN_SEED_TOTP_SECRET;

  if (!email) {
    throw new Error('ADMIN_SEED_EMAIL is required for seed execution.');
  }

  if (!password) {
    throw new Error('ADMIN_SEED_PASSWORD is required for seed execution.');
  }

  if (!totpSecret) {
    throw new Error('ADMIN_SEED_TOTP_SECRET is required for seed execution.');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: {
      role: Role.admin,
      fullName,
      passwordHash,
      status: UserStatus.active,
      isEmailVerified: true,
      mfaEnabled: true,
      mfaSecretEnc: totpSecret,
      deletedAt: null,
    },
    create: {
      role: Role.admin,
      fullName,
      email,
      passwordHash,
      status: UserStatus.active,
      isEmailVerified: true,
      mfaEnabled: true,
      mfaSecretEnc: totpSecret,
    },
  });
}

async function main(): Promise<void> {
  await seedServices();
  await seedFacilities();
  await seedFeatures();
  await seedAdmin();
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
