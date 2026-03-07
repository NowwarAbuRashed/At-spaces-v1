import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class AdminMfaVerifyDto {
  @ApiProperty()
  @IsString()
  preAuthToken!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  totpCode!: string;
}

