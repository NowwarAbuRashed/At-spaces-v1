import { Injectable } from '@nestjs/common';
import { AvailabilityCheckDto } from './dto/availability-check.dto';
import { AvailabilityEngineService } from './availability-engine.service';

@Injectable()
export class AvailabilityService {
  constructor(private readonly availabilityEngine: AvailabilityEngineService) {}

  async check(dto: AvailabilityCheckDto) {
    const window = this.availabilityEngine.parseWindow(dto.startTime, dto.endTime);
    const result = await this.availabilityEngine.checkAvailability({
      vendorServiceId: dto.vendorServiceId,
      quantity: dto.quantity,
      startTime: window.startTime,
      endTime: window.endTime,
    });

    return {
      available: result.available,
      price: result.price,
    };
  }
}
