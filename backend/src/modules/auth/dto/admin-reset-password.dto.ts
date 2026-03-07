import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, MinLength } from 'class-validator';

export class AdminResetPasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(20)
  resetToken!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  newPassword!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  totpCode!: string;
}

