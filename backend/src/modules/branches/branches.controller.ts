import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BranchesService } from './branches.service';
import { BranchDetailsDto } from './dto/branch-details.dto';
import { BranchListQueryDto } from './dto/branch-list-query.dto';
import { BranchSearchQueryDto } from './dto/branch-search-query.dto';
import { PagedBranchesResponseDto } from './dto/paged-branches-response.dto';

@ApiTags('Branches')
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  @ApiOperation({ summary: 'List branches (filters + pagination)' })
  @ApiOkResponse({ type: PagedBranchesResponseDto })
  async listBranches(@Query() query: BranchListQueryDto) {
    return this.branchesService.listBranches(query);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search branches by query string' })
  @ApiOkResponse({ type: PagedBranchesResponseDto })
  async searchBranches(@Query() query: BranchSearchQueryDto) {
    return this.branchesService.searchBranches(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Branch details (facilities + services)' })
  @ApiOkResponse({ type: BranchDetailsDto })
  async getBranchDetails(@Param('id', ParseIntPipe) id: number) {
    return this.branchesService.getBranchDetails(id);
  }
}
