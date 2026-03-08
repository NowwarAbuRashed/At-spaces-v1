import {
  getMockCustomerBranchById,
  mockCustomerBranches,
} from '@/features/customer-discovery/data/customer-branches-mock-data'
import type {
  CustomerBookingPreviewState,
  CustomerBookingPriceBreakdown,
  CustomerBookingPreviewFormState,
  CustomerPaymentMethodOption,
} from '@/types/customer'

function parseTimeToMinutes(value: string) {
  const [hours, minutes] = value.split(':').map((part) => Number(part))
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return 0
  }

  return hours * 60 + minutes
}

export const mockCustomerPaymentMethods: CustomerPaymentMethodOption[] = [
  {
    id: 'card',
    label: 'Credit / Debit Card',
    description: 'Pay securely with your saved or new card.',
    feeLabel: 'No extra fee',
    additionalFee: 0,
  },
  {
    id: 'apple-pay',
    label: 'Apple Pay',
    description: 'Fast one-tap checkout on supported devices.',
    feeLabel: 'SAR 5 convenience fee',
    additionalFee: 5,
  },
  {
    id: 'bank-transfer',
    label: 'Bank Transfer',
    description: 'Manual transfer verification within business hours.',
    feeLabel: 'SAR 8 processing fee',
    additionalFee: 8,
  },
]

const selectedBranch = getMockCustomerBranchById('riyadh-tech-hub') ?? mockCustomerBranches[0]
const selectedService =
  selectedBranch.services.find((service) => service.id === 'meeting-room') ??
  selectedBranch.services[0]

export const mockCustomerBookingPreviewState: CustomerBookingPreviewState = {
  selection: {
    branchId: selectedBranch.id,
    branchName: selectedBranch.name,
    city: selectedBranch.city,
    district: selectedBranch.district,
    addressLine: selectedBranch.addressLine,
    serviceId: selectedService.id,
    serviceName: selectedService.name,
    serviceCategory: selectedService.category,
    serviceUnit: selectedService.unit,
    serviceUnitPrice: selectedService.price,
  },
  formDefaults: {
    bookingDate: '2026-03-21',
    startTime: '09:00',
    endTime: '11:00',
    quantity: 1,
    paymentMethodId: 'card',
    notes: '',
  },
  paymentMethods: mockCustomerPaymentMethods,
  currency: 'SAR',
  taxRate: 0.15,
  platformFee: 20,
  discount: 0,
}

export function calculateMockBookingPriceBreakdown(
  state: CustomerBookingPreviewState,
  values: Pick<
    CustomerBookingPreviewFormState,
    'startTime' | 'endTime' | 'quantity' | 'paymentMethodId'
  >,
): CustomerBookingPriceBreakdown {
  const startMinutes = parseTimeToMinutes(values.startTime)
  const endMinutes = parseTimeToMinutes(values.endTime)
  const rawDuration = Math.max(1, Math.ceil((endMinutes - startMinutes) / 60))
  const durationUnits = state.selection.serviceUnit === 'hour' ? rawDuration : 1
  const quantity = Math.max(1, values.quantity)

  const basePrice = state.selection.serviceUnitPrice * durationUnits * quantity
  const platformFee = state.platformFee
  const paymentMethod =
    state.paymentMethods.find((option) => option.id === values.paymentMethodId) ??
    state.paymentMethods[0]
  const paymentFee = paymentMethod.additionalFee
  const discount = state.discount
  const taxableSubtotal = Math.max(0, basePrice + platformFee + paymentFee - discount)
  const tax = Math.round(taxableSubtotal * state.taxRate)
  const total = taxableSubtotal + tax

  return {
    durationUnits,
    basePrice,
    platformFee,
    paymentFee,
    discount,
    tax,
    total,
  }
}
