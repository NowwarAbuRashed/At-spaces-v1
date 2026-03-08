import { Save } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingState } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { SectionCard } from '@/components/shared/section-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useVendorAuth } from '@/features/auth/store/vendor-auth-context'
import {
  VendorBranchDetailsEditor,
  VendorBranchInfoCard,
  VendorFacilityRow,
} from '@/features/vendor-management/components'
import type {
  VendorBranchDetails,
  VendorBranchEditableField,
  VendorFacility,
} from '@/features/vendor-management/types'
import {
  useVendorBranchesQuery,
  useVendorDashboardQuery,
  useVendorProfileQuery,
  useUpdateVendorBranchMutation,
} from '@/features/vendor/hooks/use-vendor-queries'
import {
  mapVendorBranchDetailsFromUpdate,
  mapVendorBranchToDetails,
  mapVendorFacilityToView,
} from '@/features/vendor/lib/vendor-mappers'
import { getInlineApiErrorMessage } from '@/lib/api-error'

export function VendorBranchesPage() {
  const { accessToken } = useVendorAuth()
  const branchesQuery = useVendorBranchesQuery(accessToken)
  const dashboardQuery = useVendorDashboardQuery(accessToken)
  const profileQuery = useVendorProfileQuery(accessToken)
  const updateBranchMutation = useUpdateVendorBranchMutation(accessToken)
  const [branchDetails, setBranchDetails] = useState<VendorBranchDetails | null>(null)
  const [facilities, setFacilities] = useState<VendorFacility[]>([])

  const selectedBranch = branchesQuery.data?.[0] ?? null
  const managerName = profileQuery.data?.fullName || 'Vendor Manager'
  const supportPhone = profileQuery.data?.phoneNumber || 'Not available'
  const todayOccupancy = dashboardQuery.data?.todayOccupancy ?? 0
  const todayBookings = dashboardQuery.data?.upcomingBookings ?? 0

  useEffect(() => {
    if (!selectedBranch) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBranchDetails(null)
      return
    }

    setBranchDetails((current) => {
      if (current && current.id === String(selectedBranch.id)) {
        return current
      }

      return mapVendorBranchToDetails(selectedBranch, {
        managerName,
        supportPhone,
        occupancyPercent: todayOccupancy,
        todayBookings,
      })
    })
  }, [managerName, selectedBranch, supportPhone, todayBookings, todayOccupancy])

  const availableFacilities = facilities.filter((facility) => facility.isAvailable).length

  const handleFieldChange = (field: VendorBranchEditableField, value: string) => {
    if (!branchDetails) {
      return
    }

    setBranchDetails((prev) => ({
      ...(prev as VendorBranchDetails),
      [field]: value,
    }))
  }

  const updateFacility = (facilityId: string, update: (facility: VendorFacility) => VendorFacility) => {
    setFacilities((prev) => prev.map((facility) => (facility.id === facilityId ? update(facility) : facility)))
  }

  const canSubmit = useMemo(() => Boolean(selectedBranch && branchDetails), [branchDetails, selectedBranch])

  const handleSave = async () => {
    if (!selectedBranch || !branchDetails || !accessToken) {
      return
    }

    const latitude = branchDetails.latitude.trim()
    const longitude = branchDetails.longitude.trim()
    const parsedLatitude = latitude ? Number(latitude) : null
    const parsedLongitude = longitude ? Number(longitude) : null

    if (latitude && Number.isNaN(parsedLatitude)) {
      toast.error('Latitude must be a valid number.')
      return
    }

    if (longitude && Number.isNaN(parsedLongitude)) {
      toast.error('Longitude must be a valid number.')
      return
    }

    try {
      const response = await updateBranchMutation.mutateAsync({
        branchId: selectedBranch.id,
        body: {
          name: branchDetails.name.trim(),
          description: branchDetails.description.trim() || null,
          city: branchDetails.city.trim(),
          address: branchDetails.address.trim(),
          latitude: parsedLatitude,
          longitude: parsedLongitude,
        },
      })

      setBranchDetails((current) =>
        mapVendorBranchDetailsFromUpdate(current ?? branchDetails, response, {
          managerName,
          supportPhone,
          occupancyPercent: todayOccupancy,
          todayBookings,
        }),
      )
      setFacilities(response.facilities.map(mapVendorFacilityToView))
      toast.success('Branch details updated.')
    } catch (error) {
      toast.error(
        getInlineApiErrorMessage(error, 'Failed to update branch details.', { sessionLabel: 'vendor' }),
      )
    }
  }

  if (branchesQuery.isPending || dashboardQuery.isPending || profileQuery.isPending) {
    return <LoadingState label="Loading branch details..." />
  }

  if (branchesQuery.isError || dashboardQuery.isError || profileQuery.isError) {
    const error = branchesQuery.error ?? dashboardQuery.error ?? profileQuery.error
    return (
      <EmptyState
        title="Unable to load branch management"
        description={getInlineApiErrorMessage(error, 'Please retry in a moment.', {
          sessionLabel: 'vendor',
        })}
        action={
          <Button
            variant="outline"
            onClick={() => {
              void branchesQuery.refetch()
              void dashboardQuery.refetch()
              void profileQuery.refetch()
            }}
          >
            Retry
          </Button>
        }
      />
    )
  }

  if (!selectedBranch || !branchDetails) {
    return (
      <EmptyState
        title="No vendor branches found"
        description="Branch data is not available for this account."
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Branch Management"
        description="Maintain branch profile details, coordinates, and facilities from a single operational workspace."
        actions={
          <>
            <Badge variant="accent">Backend Integrated</Badge>
            <Button
              type="button"
              className="gap-2"
              isLoading={updateBranchMutation.isPending}
              disabled={!canSubmit}
              onClick={() => {
                void handleSave()
              }}
            >
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        <VendorBranchInfoCard branch={branchDetails} />
        <VendorBranchDetailsEditor details={branchDetails} onFieldChange={handleFieldChange} />
      </section>

      <SectionCard
        title="Facilities Management"
        description="Facility editing endpoint is not yet available in backend vendor APIs. Current data is read-only."
        action={
          <Badge variant="neutral">
            {availableFacilities}/{facilities.length} available
          </Badge>
        }
      >
        <div className="space-y-3">
          {facilities.length ? (
            facilities.map((facility) => (
              <VendorFacilityRow
                key={facility.id}
                facility={facility}
                onToggleAvailability={(id, nextValue) =>
                  updateFacility(id, (current) => ({ ...current, isAvailable: nextValue }))
                }
                onDescriptionChange={(id, value) =>
                  updateFacility(id, (current) => ({ ...current, description: value }))
                }
                onDetailsChange={(id, value) =>
                  updateFacility(id, (current) => ({ ...current, details: value }))
                }
                disabled
              />
            ))
          ) : (
            <EmptyState
              title="No facilities returned yet"
              description="Facilities become available after backend returns branch details."
            />
          )}
        </div>
      </SectionCard>
    </div>
  )
}
