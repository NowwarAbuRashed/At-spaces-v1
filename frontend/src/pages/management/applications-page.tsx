import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { listApprovalRequests } from '@/api/admin-api'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingState } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { Button, Input } from '@/components/ui'
import { useAuth } from '@/features/auth/store/auth-context'
import { VendorApplicationCard } from '@/features/management/components'
import { vendorApplications } from '@/features/management/data/management-mock-data'
import { mapAdminApprovalToApplication } from '@/features/management/lib/admin-mappers'
import { getInlineApiErrorMessage } from '@/lib/api-error'
import type { VendorApplication } from '@/features/management/types'

export function ApplicationsPage() {
  const { accessToken } = useAuth()
  const [searchValue, setSearchValue] = useState('')

  const applicationsQuery = useQuery({
    queryKey: ['admin', 'applications', accessToken],
    queryFn: () => listApprovalRequests({ accessToken: accessToken!, limit: 100 }),
    enabled: Boolean(accessToken),
  })

  const allApplications = useMemo(() => {
    if (!accessToken) {
      return vendorApplications
    }

    return (applicationsQuery.data?.items ?? [])
      .map(mapAdminApprovalToApplication)
      .filter((item): item is VendorApplication => item !== null)
  }, [accessToken, applicationsQuery.data?.items])

  const filteredApplications = useMemo(() => {
    const searchTerm = searchValue.trim().toLowerCase()
    return allApplications.filter((item) => {
      return (
        !searchTerm ||
        item.workspaceName.toLowerCase().includes(searchTerm) ||
        item.ownerName.toLowerCase().includes(searchTerm)
      )
    })
  }, [allApplications, searchValue])

  const newCount = allApplications.filter((item) => item.isNew).length

  if (accessToken && applicationsQuery.isPending) {
    return <LoadingState label="Loading applications..." />
  }

  if (accessToken && applicationsQuery.isError) {
    return (
      <EmptyState
        title="Unable to load applications"
        description={getInlineApiErrorMessage(applicationsQuery.error, 'Refresh and try again.')}
        action={
          <Button variant="outline" onClick={() => void applicationsQuery.refetch()}>
            Retry
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendor Applications"
        description={
          <span>
            Review &quot;Become a Vendor&quot; submissions.{' '}
            <span className="font-semibold text-app-info">{newCount} new</span>
          </span>
        }
      />

      <Input
        value={searchValue}
        onChange={(event) => setSearchValue(event.target.value)}
        placeholder="Search applications..."
        leftIcon={<Search className="h-4 w-4" />}
      />

      {filteredApplications.length ? (
        <section className="space-y-4">
          {filteredApplications.map((application) => (
            <VendorApplicationCard key={application.id} application={application} />
          ))}
        </section>
      ) : (
        <EmptyState title="No applications found" description="Try a different search term." />
      )}
    </div>
  )
}
