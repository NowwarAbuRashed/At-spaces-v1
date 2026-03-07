import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, Length, Matches } from 'class-validator';

export enum OtpVerifyPurpose {
  login = 'login',
  signup = 'signup',
  verify = 'verify',
}

export class VerifyOtpDto {
  @ApiProperty({ example: '+9627xxxxxxxx' })
  @IsString()
  @Matches(/^\+\d{8,15}$/, { message: 'phoneNumber must be in international format' })
  phoneNumber!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  otpCode!: string;

  @ApiProperty({ enum: OtpVerifyPurpose })
  @IsEnum(OtpVerifyPurpose)
  purpose!: OtpVerifyPurpose;
}

