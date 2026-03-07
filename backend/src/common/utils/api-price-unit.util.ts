import { PriceUnit } from '@prisma/client';

export const API_PRICE_UNITS = ['hour', 'day', 'week', 'month'] as const;

export type ApiPriceUnit = (typeof API_PRICE_UNITS)[number];

export function isApiPriceUnit(value: string): value is ApiPriceUnit {
  return API_PRICE_UNITS.includes(value as ApiPriceUnit);
}

export function toApiPriceUnit(value: PriceUnit): ApiPriceUnit {
  switch (value) {
    case PriceUnit.hour:
      return 'hour';
    case PriceUnit.week:
      return 'week';
    case PriceUnit.month:
      return 'month';
    case PriceUnit.half_day:
    case PriceUnit.full_day:
    case PriceUnit.day:
      return 'day';
  }
}
