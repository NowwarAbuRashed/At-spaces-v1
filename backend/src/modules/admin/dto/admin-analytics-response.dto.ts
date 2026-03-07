import { ApiProperty } from '@nestjs/swagger';

export class TopCityAnalyticsDto {
  @ApiProperty({ example: 'Amman' })
  city!: string;

  @ApiProperty({ example: 42 })
  bookings!: number;
}

export class AdminAnalyticsResponseDto {
  @ApiProperty({ example: 120 })
  totalBookings!: number;

  @ApiProperty({ example: 68.5 })
  occupancyRate!: number;

  @ApiProperty({ example: 3500.75 })
  revenue!: number;

  @ApiProperty({ type: TopCityAnalyticsDto, isArray: true })
  topCities!: TopCityAnalyticsDto[];
}
