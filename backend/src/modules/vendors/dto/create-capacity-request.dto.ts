import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateCapacityRequestDto {
  @ApiProperty({ example: 80, minimum: 1, maximum: 10000 })
  @IsInt()
  @Min(1)
  @Max(10000)
  newCapacity!: number;

  @ApiProperty({ example: 'We added more seats', minLength: 3, maxLength: 500 })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
}
