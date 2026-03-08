import type {
  CustomerProfile,
  CustomerProfileFormValues,
  CustomerRecommendationPlaceholderState,
} from '@/types/customer'

export const customerPreferredCities = ['Riyadh', 'Jeddah', 'Khobar', 'Medina', 'Dammam'] as const

export const customerWorkspacePreferences = [
  { value: 'quiet', label: 'Quiet Focus' },
  { value: 'collaborative', label: 'Collaborative' },
  { value: 'private-office', label: 'Private Office' },
] as const

export const mockCustomerProfile: CustomerProfile = {
  id: 'cus-001',
  fullName: 'Sara Al-Mutairi',
  email: 'sara@example.com',
  phone: '+966 55 123 4567',
  memberSince: '2025-08-10',
  loyaltyTier: 'Gold Member',
  preferences: {
    preferredCity: 'Riyadh',
    workspacePreference: 'quiet',
    notifications: {
      bookingReminders: true,
      scheduleChanges: true,
      specialOffers: false,
    },
  },
}

export const mockCustomerRecommendationPlaceholder: CustomerRecommendationPlaceholderState = {
  title: 'AI Workspace Match (Coming Soon)',
  description:
    'Get suggested branches and service combinations based on your booking patterns and preferences.',
  ctaLabel: 'Enable recommendations soon',
}

export function mapProfileToFormValues(profile: CustomerProfile): CustomerProfileFormValues {
  return {
    fullName: profile.fullName,
    email: profile.email,
    phone: profile.phone,
    preferredCity: profile.preferences.preferredCity,
    workspacePreference: profile.preferences.workspacePreference,
    bookingReminders: profile.preferences.notifications.bookingReminders,
    scheduleChanges: profile.preferences.notifications.scheduleChanges,
    specialOffers: profile.preferences.notifications.specialOffers,
  }
}

export function mapFormValuesToProfile(
  formValues: CustomerProfileFormValues,
  currentProfile: CustomerProfile,
): CustomerProfile {
  return {
    ...currentProfile,
    fullName: formValues.fullName,
    email: formValues.email,
    phone: formValues.phone,
    preferences: {
      preferredCity: formValues.preferredCity,
      workspacePreference: formValues.workspacePreference,
      notifications: {
        bookingReminders: formValues.bookingReminders,
        scheduleChanges: formValues.scheduleChanges,
        specialOffers: formValues.specialOffers,
      },
    },
  }
}
