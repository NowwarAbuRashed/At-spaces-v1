import { Layers, Link2 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { CustomerPageShell } from '@/components/customer'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingState } from '@/components/shared/loading-state'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { useCustomerServiceDetailsQuery } from '@/features/customer/hooks/use-customer-queries'
import { getInlineApiErrorMessage } from '@/lib/api-error'
import { CUSTOMER_ROUTES } from '@/lib/routes'

export function CustomerServiceDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const serviceId = id ? Number(id) : Number.NaN
  const serviceQuery = useCustomerServiceDetailsQuery(Number.isFinite(serviceId) ? serviceId : null)

  if (!Number.isFinite(serviceId)) {
    return (
      <CustomerPageShell
        eyebrow="Service Details"
        title="Service not found"
        description="The service identifier is invalid."
        badges={['Service catalog']}
      >
        <EmptyState
          title="Invalid service ID"
          description="Return to branches and choose a valid service."
          action={
            <Link to={CUSTOMER_ROUTES.BRANCHES}>
              <Button type="button">Back to branches</Button>
            </Link>
          }
        />
      </CustomerPageShell>
    )
  }

  if (serviceQuery.isPending) {
    return (
      <CustomerPageShell
        eyebrow="Service Details"
        title="Loading service details"
        description="Fetching service information from backend."
        badges={['Backend connected']}
      >
        <LoadingState label="Loading service details..." />
      </CustomerPageShell>
    )
  }

  if (serviceQuery.isError || !serviceQuery.data) {
    return (
      <CustomerPageShell
        eyebrow="Service Details"
        title="Unable to load service"
        description={getInlineApiErrorMessage(serviceQuery.error, 'Service details are unavailable right now.')}
        badges={['Backend response']}
      >
        <EmptyState
          title="Service details unavailable"
          description="Try again or continue browsing branches."
          action={
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => void serviceQuery.refetch()}>
                Retry
              </Button>
              <Link to={CUSTOMER_ROUTES.BRANCHES}>
                <Button type="button">Back to branches</Button>
              </Link>
            </div>
          }
        />
      </CustomerPageShell>
    )
  }

  const service = serviceQuery.data

  return (
    <CustomerPageShell
      eyebrow="Service Details"
      title={service.name}
      description="Service metadata from the backend catalog."
      badges={[`Service #${service.id}`, `Unit: ${service.unit}`]}
      actions={
        <div className="flex flex-wrap gap-2">
          <Link to={CUSTOMER_ROUTES.BRANCHES}>
            <Button type="button">Browse branches</Button>
          </Link>
          <Link to={CUSTOMER_ROUTES.BOOKING_PREVIEW}>
            <Button type="button" variant="secondary">
              Booking preview
            </Button>
          </Link>
        </div>
      }
    >
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2">
            <Layers className="h-5 w-5 text-app-accent" />
            Catalog information
          </CardTitle>
          <CardDescription>Public service details endpoint (`GET /services/{'{id}'}`)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-app-muted">
          <p className="rounded-xl border border-app-border bg-app-surface-alt/70 px-3 py-2">
            <span className="block text-xs uppercase tracking-[0.12em]">Service ID</span>
            <span className="mt-1 block font-semibold text-app-text">{service.id}</span>
          </p>
          <p className="rounded-xl border border-app-border bg-app-surface-alt/70 px-3 py-2">
            <span className="block text-xs uppercase tracking-[0.12em]">Service Name</span>
            <span className="mt-1 block font-semibold text-app-text">{service.name}</span>
          </p>
          <p className="rounded-xl border border-app-border bg-app-surface-alt/70 px-3 py-2">
            <span className="block text-xs uppercase tracking-[0.12em]">Unit</span>
            <span className="mt-1 block font-semibold text-app-text">{service.unit}</span>
          </p>
          <p className="inline-flex items-center gap-2 text-xs">
            <Link2 className="h-3.5 w-3.5 text-app-accent" />
            Connected from frontend API client and reachable from branch service cards.
          </p>
        </CardContent>
      </Card>
    </CustomerPageShell>
  )
}
