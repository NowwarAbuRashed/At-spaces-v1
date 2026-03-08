import { PrismaService } from '../../src/common/prisma/prisma.service';

/**
 * Avoid relation-level deadlocks from TRUNCATE ... CASCADE across suites by
 * clearing mutable tables in a deterministic dependency order.
 *
 * Notes:
 * - audit_log is append-only for DELETE/UPDATE, so tests hard-reset it with TRUNCATE.
 * - remaining deletes run sequentially (not a single transaction) to reduce lock contention.
 */
export async function resetE2eDatabase(prisma: PrismaService): Promise<void> {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "audit_log" RESTART IDENTITY');

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
  await prisma.user.deleteMany();
}
