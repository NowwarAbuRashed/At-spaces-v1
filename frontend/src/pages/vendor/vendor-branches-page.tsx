import { Save } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/page-header'
import { SectionCard } from '@/components/shared/section-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  VendorBranchDetailsEditor,
  VendorBranchInfoCard,
  VendorFacilityRow,
} from '@/features/vendor-management/components'
import {
  vendorBranchDetailsMock,
  vendorFacilitiesMock,
} from '@/features/vendor-management/data/vendor-management-mock-data'
import type {
  VendorBranchDetails,
  VendorBranchEditableField,
  VendorFacility,
} from '@/features/vendor-management/types'

export function VendorBranchesPage() {
  const [branchDetails, setBranchDetails] = useState<VendorBranchDetails>(vendorBranchDetailsMock)
  const [facilities, setFacilities] = useState<VendorFacility[]>(vendorFacilitiesMock)

  const availableFacilities = facilities.filter((facility) => facility.isAvailable).length

  const handleFieldChange = (field: VendorBranchEditableField, value: string) => {
    setBranchDetails((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const updateFacility = (facilityId: string, update: (facility: VendorFacility) => VendorFacility) => {
    setFacilities((prev) => prev.map((facility) => (facility.id === facilityId ? update(facility) : facility)))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Branch Management"
        description="Maintain branch profile details, coordinates, and facilities from a single operational workspace."
        actions={
          <>
            <Badge variant="accent">Mock Data</Badge>
            <Button
              type="button"
              className="gap-2"
              onClick={() => toast.success('Branch updates saved locally (mock-only in Phase 4).')}
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
        description="Toggle availability and update details for each facility. Changes are local mock state only."
        action={
          <Badge variant="neutral">
            {availableFacilities}/{facilities.length} available
          </Badge>
        }
      >
        <div className="space-y-3">
          {facilities.map((facility) => (
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
            />
          ))}
        </div>
      </SectionCard>
    </div>
  )
}
