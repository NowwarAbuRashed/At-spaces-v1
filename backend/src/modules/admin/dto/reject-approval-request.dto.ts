import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RejectApprovalRequestDto {
  @ApiProperty({ example: 'Not enough justification provided', minLength: 10 })
  @IsString()
  @MinLength(10)
  reason!: string;
}
