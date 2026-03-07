import { Injectable, NotFoundException } from '@nestjs/common';
import { BranchStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { toApiPriceUnit } from '../../common/utils/api-price-unit.util';
import { BranchListQueryDto } from './dto/branch-list-query.dto';
import { BranchSearchQueryDto } from './dto/branch-search-query.dto';

interface PaginationInput {
  page: number;
  limit: number;
}

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  async listBranches(query: BranchListQueryDto) {
    const where: Prisma.BranchWhereInput = {
      deletedAt: null,
      status: BranchStatus.active,
    };

    if (query.city) {
      where.city = {
        equals: query.city.trim(),
        mode: 'insensitive',
      };
    }

    if (query.serviceId) {
      where.vendorServices = {
        some: {
          serviceId: query.serviceId,
          deletedAt: null,
          isAvailable: true,
        },
      };
    }

    return this.getPagedBranches(where, {
      page: query.page,
      limit: query.limit,
    });
  }

  async searchBranches(query: BranchSearchQueryDto) {
    const text = query.q.trim();
    const where: Prisma.BranchWhereInput = {
      deletedAt: null,
      status: BranchStatus.active,
      OR: [
        {
          name: {
            contains: text,
            mode: 'insensitive',
          },
        },
        {
          city: {
            contains: text,
            mode: 'insensitive',
          },
        },
        {
          address: {
            contains: text,
            mode: 'insensitive',
          },
        },
      ],
    };

    return this.getPagedBranches(where, {
      page: query.page,
      limit: query.limit,
    });
  }

  async getBranchDetails(id: number) {
    const branch = await this.prisma.branch.findFirst({
      where: {
        id,
        deletedAt: null,
        status: BranchStatus.active,
      },
      include: {
        branchFacilities: {
          include: {
            facility: true,
          },
          orderBy: {
            facilityId: 'asc',
          },
        },
        vendorServices: {
          where: {
            deletedAt: null,
            isAvailable: true,
          },
          include: {
            service: true,
          },
          orderBy: {
            id: 'asc',
          },
        },
      },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    return {
      id: branch.id,
      name: branch.name,
      description: branch.description,
      city: branch.city,
      address: branch.address,
      latitude: branch.latitude ? Number(branch.latitude) : null,
      longitude: branch.longitude ? Number(branch.longitude) : null,
      facilities: branch.branchFacilities
        .filter((branchFacility) => branchFacility.facility.isActive)
        .map((branchFacility) => ({
          id: branchFacility.facility.id,
          name: branchFacility.facility.name,
          icon: branchFacility.facility.icon,
          isAvailable: branchFacility.isAvailable,
          description: branchFacility.facility.description,
        })),
      services: branch.vendorServices
        .filter((vendorService) => vendorService.service.isActive)
        .map((vendorService) => ({
          vendorServiceId: vendorService.id,
          serviceId: vendorService.serviceId,
          name: vendorService.name ?? vendorService.service.name,
          pricePerUnit: Number(vendorService.pricePerUnit),
          priceUnit: toApiPriceUnit(vendorService.priceUnit),
          maxCapacity: vendorService.maxCapacity,
          isAvailable: vendorService.isAvailable,
        })),
    };
  }

  async listFacilities() {
    return this.prisma.facility.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        id: 'asc',
      },
      select: {
        id: true,
        name: true,
        icon: true,
      },
    });
  }

  async listFeatures() {
    const features = await this.prisma.feature.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        id: 'asc',
      },
      select: {
        id: true,
        name: true,
      },
    });

    return features.map((feature) => ({
      ...feature,
      icon: null,
    }));
  }

  private async getPagedBranches(
    where: Prisma.BranchWhereInput,
    pagination: PaginationInput,
  ) {
    const skip = (pagination.page - 1) * pagination.limit;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.branch.findMany({
        where,
        skip,
        take: pagination.limit,
        orderBy: {
          id: 'asc',
        },
        select: {
          id: true,
          name: true,
          city: true,
          address: true,
        },
      }),
      this.prisma.branch.count({ where }),
    ]);

    return {
      items,
      page: pagination.page,
      limit: pagination.limit,
      total,
      hasNext: skip + items.length < total,
    };
  }
}
