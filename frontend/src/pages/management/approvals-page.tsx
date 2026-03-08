import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { approveRequest, listApprovalRequests, rejectRequest } from '@/api/admin-api'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingState } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { Button, Tabs } from '@/components/ui'
import { useAuth } from '@/features/auth/store/auth-context'
import { ApprovalRequestCard } from '@/features/management/components'
import { approvalRequests } from '@/features/management/data/management-mock-data'
import { mapAdminApprovalToRequest } from '@/features/management/lib/admin-mappers'
import { getInlineApiErrorMessage } from '@/lib/api-error'
import { getAdminApprovalDetailsRoute } from '@/lib/routes'
import type { ApprovalRequest } from '@/features/management/types'

type ApprovalStatusFilter = 'all' | 'pending' | 'approved' | 'rejected'

export function ApprovalsPage() {
  const { accessToken } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<ApprovalStatusFilter>('all')

  const approvalsQuery = useQuery({
    queryKey: ['admin', 'approvals', accessToken],
    queryFn: () => listApprovalRequests({ accessToken: accessToken!, limit: 100 }),
    enabled: Boolean(accessToken),
  })

  const approveMutation = useMutation({
    mutationFn: (requestId: number) => approveRequest({ accessToken: accessToken!, requestId }),
    onSuccess: () => {
      toast.success('Request approved.')
      void queryClient.invalidateQueries({ queryKey: ['admin', 'approvals', accessToken] })
    },
    onError: () => {
      toast.error('Failed to approve request.')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (requestId: number) =>
      rejectRequest({
        accessToken: accessToken!,
        requestId,
        reason: 'Rejected by admin from dashboard.',
      }),
    onSuccess: () => {
      toast.success('Request rejected.')
      void queryClient.invalidateQueries({ queryKey: ['admin', 'approvals', accessToken] })
    },
    onError: () => {
      toast.error('Failed to reject request.')
    },
  })

  const allRequests = useMemo(() => {
    if (!accessToken) {
      return approvalRequests
    }

    return (approvalsQuery.data?.items ?? []).map(mapAdminApprovalToRequest)
  }, [accessToken, approvalsQuery.data?.items])

  const counts = useMemo(() => {
    return {
      all: allRequests.length,
      pending: allRequests.filter((item) => item.status === 'pending').length,
      approved: allRequests.filter((item) => item.status === 'approved').length,
      rejected: allRequests.filter((item) => item.status === 'rejected').length,
    }
  }, [allRequests])

  const filteredRequests = useMemo(() => {
    if (activeTab === 'all') {
      return allRequests
    }

    return allRequests.filter((item) => item.status === activeTab)
  }, [activeTab, allRequests])

  const requestIdFromDisplayId = (request: ApprovalRequest) => Number(request.id.replace('REQ-', ''))

  const handleApprove = (request: ApprovalRequest) => {
    if (!accessToken) {
      toast.info('Sign in as admin to approve requests.')
      return
    }

    approveMutation.mutate(requestIdFromDisplayId(request))
  }

  const handleReject = (request: ApprovalRequest) => {
    if (!accessToken) {
      toast.info('Sign in as admin to reject requests.')
      return
    }

    rejectMutation.mutate(requestIdFromDisplayId(request))
  }

  if (accessToken && approvalsQuery.isPending) {
    return <LoadingState label="Loading approval requests..." />
  }

  if (accessToken && approvalsQuery.isError) {
    return (
      <EmptyState
        title="Unable to load approvals"
        description={getInlineApiErrorMessage(approvalsQuery.error, 'Refresh and try again.')}
        action={
          <Button variant="outline" onClick={() => void approvalsQuery.refetch()}>
            Retry
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Approvals"
        description={
          <span>
            Review and process vendor requests.{' '}
            <span className="font-semibold text-app-warning">{counts.pending} pending</span>
          </span>
        }
      />

      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        className="max-w-full overflow-x-auto"
        items={[
          { label: 'All', value: 'all', count: counts.all },
          { label: 'Pending', value: 'pending', count: counts.pending },
          { label: 'Approved', value: 'approved', count: counts.approved },
          { label: 'Rejected', value: 'rejected', count: counts.rejected },
        ]}
      />

      {filteredRequests.length ? (
        <section className="space-y-4">
          {filteredRequests.map((request) => (
            <ApprovalRequestCard
              key={request.id}
              request={request}
              detailsHref={getAdminApprovalDetailsRoute(requestIdFromDisplayId(request))}
              onApprove={handleApprove}
              onReject={handleReject}
              isApproving={
                approveMutation.isPending &&
                approveMutation.variables === requestIdFromDisplayId(request)
              }
              isRejecting={
                rejectMutation.isPending &&
                rejectMutation.variables === requestIdFromDisplayId(request)
              }
            />
          ))}
        </section>
      ) : (
        <EmptyState title="No approvals in this tab" description="Select another status tab." />
      )}
    </div>
  )
}
