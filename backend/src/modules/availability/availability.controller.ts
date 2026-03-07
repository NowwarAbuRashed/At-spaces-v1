import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AvailabilityService } from './availability.service';
import { AvailabilityCheckDto } from './dto/availability-check.dto';
import { AvailabilityCheckResponseDto } from './dto/availability-check-response.dto';

@ApiTags('Availability')
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Post('check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check availability + price' })
  @ApiOkResponse({ type: AvailabilityCheckResponseDto })
  async check(@Body() dto: AvailabilityCheckDto) {
    return this.availabilityService.check(dto);
  }
}
