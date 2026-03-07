import { Module } from '@nestjs/common';
import { BranchesController } from './branches.controller';
import { BranchesService } from './branches.service';
import { CatalogController } from './catalog.controller';

@Module({
  controllers: [BranchesController, CatalogController],
  providers: [BranchesService],
  exports: [BranchesService],
})
export class BranchesModule {}
