import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(20)
  resetToken!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  newPassword!: string;
}

