import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.service.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        id: 'asc',
      },
      select: {
        id: true,
        name: true,
        unit: true,
      },
    });
  }

  async findById(id: number) {
    const service = await this.prisma.service.findFirst({
      where: {
        id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        unit: true,
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }
}
