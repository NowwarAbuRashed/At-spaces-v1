import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class VendorBranchDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  address!: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}

export class VendorRegisterDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  fullName!: string;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ type: VendorBranchDto })
  @ValidateNested()
  @Type(() => VendorBranchDto)
  branch!: VendorBranchDto;
}

