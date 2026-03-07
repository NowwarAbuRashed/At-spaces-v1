import { ApiProperty } from '@nestjs/swagger';
import { FacilityPublicDto } from './facility-public.dto';
import { VendorServiceInBranchDto } from './vendor-service-in-branch.dto';

export class BranchDetailsDto {
  @ApiProperty({ example: 10 })
  id!: number;

  @ApiProperty({ example: 'Branch A' })
  name!: string;

  @ApiProperty({ example: 'Downtown branch', nullable: true })
  description!: string | null;

  @ApiProperty({ example: 'Amman' })
  city!: string;

  @ApiProperty({ example: 'Abdali Boulevard' })
  address!: string;

  @ApiProperty({ example: 31.95, nullable: true })
  latitude!: number | null;

  @ApiProperty({ example: 35.91, nullable: true })
  longitude!: number | null;

  @ApiProperty({ type: FacilityPublicDto, isArray: true })
  facilities!: FacilityPublicDto[];

  @ApiProperty({ type: VendorServiceInBranchDto, isArray: true })
  services!: VendorServiceInBranchDto[];
}
