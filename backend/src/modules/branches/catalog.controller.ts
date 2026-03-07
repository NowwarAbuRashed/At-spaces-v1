import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BranchesService } from './branches.service';
import { FacilityCatalogItemDto } from './dto/facility-catalog-item.dto';
import { FeatureCatalogItemDto } from './dto/feature-catalog-item.dto';

@ApiTags('Branches')
@Controller()
export class CatalogController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get('facilities')
  @ApiOperation({ summary: 'Facilities catalog (public)' })
  @ApiOkResponse({ type: FacilityCatalogItemDto, isArray: true })
  async listFacilities() {
    return this.branchesService.listFacilities();
  }

  @Get('features')
  @ApiOperation({ summary: 'Features catalog (public)' })
  @ApiOkResponse({ type: FeatureCatalogItemDto, isArray: true })
  async listFeatures() {
    return this.branchesService.listFeatures();
  }
}
