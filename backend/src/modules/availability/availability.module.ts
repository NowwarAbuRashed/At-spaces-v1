import { Module } from '@nestjs/common';
import { AvailabilityController } from './availability.controller';
import { AvailabilityEngineService } from './availability-engine.service';
import { AvailabilityService } from './availability.service';

@Module({
  controllers: [AvailabilityController],
  providers: [AvailabilityService, AvailabilityEngineService],
  exports: [AvailabilityEngineService],
})
export class AvailabilityModule {}
