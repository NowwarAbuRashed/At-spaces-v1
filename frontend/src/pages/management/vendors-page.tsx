import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { listAdminVendors, updateAdminVendorStatus } from '@/api/admin-api'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingState } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { Button, Input, Modal } from '@/components/ui'
import { useAuth } from '@/features/auth/store/auth-context'
import { VendorCard } from '@/features/management/components'
import { vendorRecords } from '@/features/management/data/management-mock-data'
import { mapAdminVendorToRecord } from '@/features/management/lib/admin-mappers'
import type { VendorRecord } from '@/features/management/types'
import { getInlineApiErrorMessage } from '@/lib/api-error'

export function VendorsPage() {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()
  const [searchValue, setSearchValue] = useState('')
  const [selectedVendor, setSelectedVendor] = useState<VendorRecord | null>(null)

  const vendorsQuery = useQuery({
    queryKey: ['admin', 'vendors', accessToken],
    queryFn: () => listAdminVendors({ accessToken: accessToken!, limit: 100 }),
    enabled: Boolean(accessToken),
  })

  const vendorStatusMutation = useMutation({
    mutationFn: (payload: { vendorId: number; status: 'active' | 'suspended' }) =>
      updateAdminVendorStatus({
        accessToken: accessToken!,
        vendorId: payload.vendorId,
        status: payload.status,
      }),
    onSuccess: () => {
      toast.success('Vendor status updated.')
      void queryClient.invalidateQueries({ queryKey: ['admin', 'vendors', accessToken] })
    },
    onError: (error) => {
      toast.error(getInlineApiErrorMessage(error, 'Failed to update vendor status.'))
    },
  })

  const allVendors = useMemo(() => {
    if (!accessToken) {
      return vendorRecords
    }

    return (vendorsQuery.data?.items ?? []).map(mapAdminVendorToRecord)
  }, [accessToken, vendorsQuery.data?.items])

  const filteredVendors = useMemo(() => {
    const searchTerm = searchValue.trim().toLowerCase()

    return allVendors.filter((vendor) => {
      return (
        !searchTerm ||
        vendor.name.toLowerCase().includes(searchTerm) ||
        vendor.email.toLowerCase().includes(searchTerm)
      )
    })
  }, [allVendors, searchValue])

  const handleToggleVendorStatus = (vendor: VendorRecord) => {
    if (!accessToken) {
      toast.info('Sign in as admin to update vendor status.')
      return
    }

    const vendorId = Number(vendor.id.replace('VN-', ''))
    if (Number.isNaN(vendorId)) {
      toast.error('Invalid vendor identifier.')
      return
    }

    const nextStatus: 'active' | 'suspended' =
      vendor.status === 'suspended' ? 'active' : 'suspended'

    vendorStatusMutation.mutate({
      vendorId,
      status: nextStatus,
    })
  }

  if (accessToken && vendorsQuery.isPending) {
    return <LoadingState label="Loading vendors..." />
  }

  if (accessToken && vendorsQuery.isError) {
    return (
      <EmptyState
        title="Unable to load vendors"
        description={getInlineApiErrorMessage(vendorsQuery.error, 'Refresh and try again.')}
        action={
          <Button variant="outline" onClick={() => void vendorsQuery.refetch()}>
            Retry
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendor Management"
        description={`${allVendors.length} vendors in the network.`}
        actions={
          <Button className="gap-2" onClick={() => toast.info('Vendor invite flow will be added in a later phase.')}>
            <Plus className="h-4 w-4" />
            Invite Vendor
          </Button>
        }
      />

      <Input
        value={searchValue}
        onChange={(event) => setSearchValue(event.target.value)}
        placeholder="Search vendors by name or email..."
        leftIcon={<Search className="h-4 w-4" />}
      />

      {filteredVendors.length ? (
        <section className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
          {filteredVendors.map((vendor) => (
            <VendorCard
              key={vendor.id}
              vendor={vendor}
              onViewProfile={setSelectedVendor}
              onToggleStatus={handleToggleVendorStatus}
              isStatusUpdating={
                vendorStatusMutation.isPending &&
                vendorStatusMutation.variables?.vendorId === Number(vendor.id.replace('VN-', ''))
              }
            />
          ))}
        </section>
      ) : (
        <EmptyState title="No vendors found" description="Try a different search term." />
      )}

      <Modal
        open={Boolean(selectedVendor)}
        onClose={() => setSelectedVendor(null)}
        title={selectedVendor ? `${selectedVendor.name} profile` : 'Vendor profile'}
        description="Vendor details and performance snapshot."
      >
        {selectedVendor ? (
          <div className="space-y-4 text-sm text-app-muted">
            <p>
              <span className="font-semibold text-app-text">Email:</span> {selectedVendor.email}
            </p>
            <p>
              <span className="font-semibold text-app-text">Status:</span> {selectedVendor.status}
            </p>
            <p>
              <span className="font-semibold text-app-text">Branches:</span> {selectedVendor.branches}
            </p>
            <p>
              <span className="font-semibold text-app-text">Joined:</span> {selectedVendor.joinedAt}
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-app-border bg-app-surface-alt/70 p-3 text-center">
                <p className="font-heading text-lg font-semibold text-app-text">{selectedVendor.reliability}%</p>
                <p>Reliability</p>
              </div>
              <div className="rounded-xl border border-app-border bg-app-surface-alt/70 p-3 text-center">
                <p className="font-heading text-lg font-semibold text-app-text">{selectedVendor.checkIn}%</p>
                <p>Check-In</p>
              </div>
              <div className="rounded-xl border border-app-border bg-app-surface-alt/70 p-3 text-center">
                <p className="font-heading text-lg font-semibold text-app-text">{selectedVendor.noShow}%</p>
                <p>No-Show</p>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
