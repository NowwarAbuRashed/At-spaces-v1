import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MinLength } from 'class-validator';

export class RegisterPhoneDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  fullName!: string;

  @ApiProperty({ example: '+9627xxxxxxxx' })
  @IsString()
  @Matches(/^\+\d{8,15}$/, { message: 'phoneNumber must be in international format' })
  phoneNumber!: string;
}

