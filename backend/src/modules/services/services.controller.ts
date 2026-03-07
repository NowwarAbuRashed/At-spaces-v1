import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServiceResponseDto } from './dto/service-response.dto';
import { ServicesService } from './services.service';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  @ApiOperation({ summary: 'List services' })
  @ApiOkResponse({ type: ServiceResponseDto, isArray: true })
  async listServices() {
    return this.servicesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service details' })
  @ApiOkResponse({ type: ServiceResponseDto })
  async getService(@Param('id', ParseIntPipe) id: number) {
    return this.servicesService.findById(id);
  }
}
