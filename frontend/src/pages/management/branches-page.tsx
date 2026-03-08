import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { listAdminBranches, updateAdminBranchStatus } from '@/api/admin-api'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingState } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { Button, Dropdown, Input } from '@/components/ui'
import { useAuth } from '@/features/auth/store/auth-context'
import { BranchCard } from '@/features/management/components'
import { branchRecords } from '@/features/management/data/management-mock-data'
import { mapAdminBranchToRecord } from '@/features/management/lib/admin-mappers'
import { getInlineApiErrorMessage } from '@/lib/api-error'
import type { BranchRecord } from '@/features/management/types'

type BranchStatusFilter = 'all' | BranchRecord['status']

export function BranchesPage() {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()
  const [searchValue, setSearchValue] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<BranchStatusFilter>('all')
  const [selectedCity, setSelectedCity] = useState('all')

  const branchesQuery = useQuery({
    queryKey: ['admin', 'branches', accessToken],
    queryFn: () => listAdminBranches({ accessToken: accessToken!, limit: 100 }),
    enabled: Boolean(accessToken),
  })

  const branchStatusMutation = useMutation({
    mutationFn: (payload: { branchId: number; status: 'active' | 'suspended' }) =>
      updateAdminBranchStatus({
        accessToken: accessToken!,
        branchId: payload.branchId,
        status: payload.status,
      }),
    onSuccess: () => {
      toast.success('Branch status updated.')
      void queryClient.invalidateQueries({ queryKey: ['admin', 'branches', accessToken] })
    },
    onError: () => {
      toast.error('Failed to update branch status.')
    },
  })

  const allBranches = useMemo<BranchRecord[]>(() => {
    if (!accessToken) {
      return branchRecords
    }

    return (branchesQuery.data?.items ?? []).map(mapAdminBranchToRecord)
  }, [accessToken, branchesQuery.data?.items])

  const cityOptions = useMemo(
    () => ['all', ...new Set(allBranches.map((branch) => branch.city.toLowerCase()))],
    [allBranches],
  )

  const filteredBranches = useMemo(() => {
    return allBranches.filter((branch) => {
      const searchTerm = searchValue.trim().toLowerCase()
      const matchesSearch =
        !searchTerm ||
        branch.name.toLowerCase().includes(searchTerm) ||
        branch.manager.toLowerCase().includes(searchTerm)
      const matchesStatus = selectedStatus === 'all' || branch.status === selectedStatus
      const matchesCity = selectedCity === 'all' || branch.city.toLowerCase() === selectedCity

      return matchesSearch && matchesStatus && matchesCity
    })
  }, [allBranches, searchValue, selectedStatus, selectedCity])

  const handleToggleBranchStatus = (branch: BranchRecord) => {
    if (!accessToken) {
      toast.info('Sign in as admin to update branch status.')
      return
    }

    const branchId = Number(branch.id.replace('BR-', ''))
    const status = branch.status === 'paused' ? 'active' : 'suspended'
    branchStatusMutation.mutate({ branchId, status })
  }

  if (accessToken && branchesQuery.isPending) {
    return <LoadingState label="Loading branches..." />
  }

  if (accessToken && branchesQuery.isError) {
    return (
      <EmptyState
        title="Unable to load branches"
        description={getInlineApiErrorMessage(branchesQuery.error, 'Refresh and try again.')}
        action={
          <Button variant="outline" onClick={() => void branchesQuery.refetch()}>
            Retry
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Branch Management"
        description={`${allBranches.length} branches across the network.`}
        actions={
          <Button className="gap-2" onClick={() => toast.info('Branch creation flow will be added in a later phase.')}>
            <Plus className="h-4 w-4" />
            Add Branch
          </Button>
        }
      />

      <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
        <Input
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="Search branches..."
          leftIcon={<Search className="h-4 w-4" />}
        />
        <Dropdown
          label={selectedStatus === 'all' ? 'All' : selectedStatus}
          items={[
            { label: 'All', onClick: () => setSelectedStatus('all') },
            { label: 'Active', onClick: () => setSelectedStatus('active') },
            { label: 'Under Review', onClick: () => setSelectedStatus('underReview') },
            { label: 'Paused', onClick: () => setSelectedStatus('paused') },
          ]}
        />
        <Dropdown
          label={selectedCity === 'all' ? 'All Cities' : selectedCity}
          items={cityOptions.map((city) => ({
            label: city === 'all' ? 'All Cities' : city.charAt(0).toUpperCase() + city.slice(1),
            onClick: () => setSelectedCity(city),
          }))}
        />
      </div>

      {filteredBranches.length ? (
        <section className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
          {filteredBranches.map((branch) => (
            <BranchCard
              key={branch.id}
              branch={branch}
              onToggleStatus={handleToggleBranchStatus}
              isStatusUpdating={
                branchStatusMutation.isPending &&
                branchStatusMutation.variables?.branchId === Number(branch.id.replace('BR-', ''))
              }
            />
          ))}
        </section>
      ) : (
        <EmptyState
          title="No branches found"
          description="Try a different search term or reset filters."
        />
      )}
    </div>
  )
}
