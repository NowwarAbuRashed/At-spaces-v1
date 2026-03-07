import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class AuthUserResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty({ enum: ['customer', 'vendor', 'admin'] })
  role!: Role;

  @ApiProperty()
  fullName!: string;
}

export class AuthLoginResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty({ type: AuthUserResponseDto })
  user!: AuthUserResponseDto;
}

export class AccessTokenResponseDto {
  @ApiProperty()
  accessToken!: string;
}

export class MessageResponseDto {
  @ApiProperty()
  message!: string;
}

export class RegisterEmailResponseDto {
  @ApiProperty()
  userId!: number;

  @ApiProperty()
  message!: string;
}

export class AdminPreAuthResponseDto {
  @ApiProperty()
  preAuthToken!: string;

  @ApiProperty()
  mfaRequired!: boolean;
}

