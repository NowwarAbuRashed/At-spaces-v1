import { useQuery } from '@tanstack/react-query'
import { FileJson } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { getApprovalRequestDetails } from '@/api/admin-api'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingState } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { useAuth } from '@/features/auth/store/auth-context'
import { getInlineApiErrorMessage } from '@/lib/api-error'
import { ADMIN_ROUTES } from '@/lib/routes'

export function ApprovalRequestDetailsPage() {
  const { accessToken } = useAuth()
  const { id } = useParams<{ id: string }>()
  const requestId = id ? Number(id) : Number.NaN

  const detailsQuery = useQuery({
    queryKey: ['admin', 'approval-details', accessToken, requestId],
    queryFn: () => getApprovalRequestDetails({ accessToken: accessToken!, requestId }),
    enabled: Boolean(accessToken) && Number.isFinite(requestId),
    retry: false,
  })

  if (!Number.isFinite(requestId)) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Approval Details"
          description="The approval request id is invalid."
          actions={
            <Link to={ADMIN_ROUTES.APPROVALS}>
              <Button type="button">Back to approvals</Button>
            </Link>
          }
        />
        <EmptyState title="Invalid request id" description="Provide a valid request id to view details." />
      </div>
    )
  }

  if (detailsQuery.isPending) {
    return <LoadingState label="Loading approval request details..." />
  }

  if (detailsQuery.isError || !detailsQuery.data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Approval Details"
          description={getInlineApiErrorMessage(detailsQuery.error, 'Unable to load approval details.')}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => void detailsQuery.refetch()}>
                Retry
              </Button>
              <Link to={ADMIN_ROUTES.APPROVALS}>
                <Button type="button">Back to approvals</Button>
              </Link>
            </div>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Approval Request #${requestId}`}
        description="Raw backend details (including integrity fields when available)."
        actions={
          <Link to={ADMIN_ROUTES.APPROVALS}>
            <Button type="button" variant="outline">
              Back to approvals
            </Button>
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2">
            <FileJson className="h-5 w-5 text-app-accent" />
            Backend payload
          </CardTitle>
          <CardDescription>
            Endpoint: <code>GET /admin/approval-requests/{'{id}'}</code>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="max-h-[60vh] overflow-auto rounded-xl border border-app-border bg-app-surface-alt/70 p-4 text-xs text-app-text">
            {JSON.stringify(detailsQuery.data, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
