import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, Matches } from 'class-validator';
import { OtpVerifyPurpose } from './verify-otp.dto';

export class ResendOtpDto {
  @ApiProperty({ example: '+9627xxxxxxxx' })
  @IsString()
  @Matches(/^\+\d{8,15}$/, { message: 'phoneNumber must be in international format' })
  phoneNumber!: string;

  @ApiProperty({ enum: OtpVerifyPurpose })
  @IsEnum(OtpVerifyPurpose)
  purpose!: OtpVerifyPurpose;
}

