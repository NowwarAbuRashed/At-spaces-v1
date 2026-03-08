import { CalendarClock, MapPin, Star } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { CustomerPageShell } from '@/components/customer'
import { LoadingState } from '@/components/shared/loading-state'
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import {
  CustomerFacilityList,
  CustomerServiceList,
} from '@/features/customer-discovery/components'
import { mapBranchDetailsToCustomerBranch } from '@/features/customer/lib/customer-mappers'
import {
  useCustomerBranchDetailsQuery,
  useCustomerFacilitiesQuery,
  useCustomerServicesQuery,
} from '@/features/customer/hooks/use-customer-queries'
import { getInlineApiErrorMessage } from '@/lib/api-error'
import { formatCurrency } from '@/lib/format'
import { CUSTOMER_ROUTES } from '@/lib/routes'

export function CustomerBranchDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const branchId = id ? Number(id) : Number.NaN
  const servicesQuery = useCustomerServicesQuery()
  const facilitiesQuery = useCustomerFacilitiesQuery()
  const detailsQuery = useCustomerBranchDetailsQuery(Number.isFinite(branchId) ? branchId : null)

  const branch = detailsQuery.data
    ? mapBranchDetailsToCustomerBranch(detailsQuery.data, {
        serviceCatalogById: new Map(
          (servicesQuery.data ?? []).map((service) => [service.id, service] as const),
        ),
        fallbackFacilities: facilitiesQuery.data,
      })
    : null

  const isLoading = servicesQuery.isLoading || facilitiesQuery.isLoading || detailsQuery.isLoading
  const error = detailsQuery.error ?? servicesQuery.error ?? facilitiesQuery.error

  if (!Number.isFinite(branchId)) {
    return (
      <CustomerPageShell
        eyebrow="Branch Details"
        title="Branch not found"
        description="The branch identifier is invalid."
        badges={['Branch lookup']}
      >
        <Card>
          <CardContent className="space-y-4 pt-6">
            <p className="text-sm text-app-muted">Return to browse and pick an available branch.</p>
            <Link to={CUSTOMER_ROUTES.BRANCHES}>
              <Button type="button">Back to Branches</Button>
            </Link>
          </CardContent>
        </Card>
      </CustomerPageShell>
    )
  }

  if (isLoading) {
    return (
      <CustomerPageShell
        eyebrow="Branch Details"
        title="Loading branch details"
        description="Fetching facilities and services for this branch."
        badges={['Live branch data']}
      >
        <LoadingState label="Loading branch details..." />
      </CustomerPageShell>
    )
  }

  if (error || !branch) {
    return (
      <CustomerPageShell
        eyebrow="Branch Details"
        title="Unable to load branch details"
        description={getInlineApiErrorMessage(error, 'Branch details are unavailable right now.')}
        badges={['Backend response']}
      >
        <Card>
          <CardContent className="space-y-4 pt-6">
            <p className="text-sm text-app-muted">Please return to the branches page and try again.</p>
            <Link to={CUSTOMER_ROUTES.BRANCHES}>
              <Button type="button">Back to Branches</Button>
            </Link>
          </CardContent>
        </Card>
      </CustomerPageShell>
    )
  }

  const servicePrices = branch.services.map((service) => service.price)
  const startingPrice = servicePrices.length > 0 ? Math.min(...servicePrices) : 0
  const maxServicePrice = servicePrices.length > 0 ? Math.max(...servicePrices) : 0
  const serviceUnits = Array.from(new Set(branch.services.map((service) => service.unit))).join(', ') || 'N/A'
  const firstService = branch.services[0]
  const bookingPreviewParams = new URLSearchParams({
    branchId: branch.id,
    serviceId: String(firstService?.serviceId ?? ''),
    vendorServiceId: String(firstService?.vendorServiceId ?? ''),
  })
  const bookingPreviewHref = `${CUSTOMER_ROUTES.BOOKING_PREVIEW}?${bookingPreviewParams.toString()}`

  return (
    <CustomerPageShell
      eyebrow="Branch Details"
      title={branch.name}
      description={branch.heroHighlight}
      badges={[`${branch.city}, ${branch.district}`, 'Live backend details']}
      actions={
        <div className="flex flex-wrap gap-3">
          <Link to={bookingPreviewHref}>
            <Button type="button">
              <CalendarClock className="h-4 w-4" />
              Continue to booking preview
            </Button>
          </Link>
          <Link to={CUSTOMER_ROUTES.BRANCHES}>
            <Button type="button" variant="secondary">
              Back to branches
            </Button>
          </Link>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="text-2xl">{branch.name}</CardTitle>
                  <CardDescription className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {branch.addressLine}, {branch.city}
                  </CardDescription>
                </div>
                <Badge variant="warning" className="inline-flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-app-warning text-app-warning" />
                  {branch.rating.toFixed(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-app-muted">{branch.description}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <p className="rounded-xl border border-app-border bg-app-surface-alt/70 px-3 py-2 text-sm text-app-muted">
                  <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-app-muted">
                    Location Summary
                  </span>
                  <span className="mt-1 block text-app-text">{branch.locationSummary}</span>
                </p>
                <p className="rounded-xl border border-app-border bg-app-surface-alt/70 px-3 py-2 text-sm text-app-muted">
                  <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-app-muted">
                    Starting Price
                  </span>
                  <span className="mt-1 block font-semibold text-app-accent">
                    {formatCurrency(startingPrice)}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>

          <CustomerFacilityList facilities={branch.facilities} />
          <CustomerServiceList services={branch.services} />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pricing Summary</CardTitle>
              <CardDescription>Quick view of service price bands and booking units.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-xl border border-app-border bg-app-surface-alt/70 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-app-muted">Price Range</p>
                <p className="mt-1 font-semibold text-app-text">
                  {formatCurrency(startingPrice)} - {formatCurrency(maxServicePrice)}
                </p>
              </div>
              <div className="rounded-xl border border-app-border bg-app-surface-alt/70 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-app-muted">Service Units</p>
                <p className="mt-1 font-semibold text-app-text">{serviceUnits}</p>
              </div>
              <div className="rounded-xl border border-app-border bg-app-surface-alt/70 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-app-muted">Service Count</p>
                <p className="mt-1 font-semibold text-app-text">{branch.services.length} options</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-app-accent/30 bg-app-accent/10">
            <CardHeader>
              <CardTitle className="text-lg">Ready for the next step?</CardTitle>
              <CardDescription>
                Continue to booking preview to check availability windows and estimated totals.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to={bookingPreviewHref} className="block">
                <Button type="button" fullWidth>
                  <CalendarClock className="h-4 w-4" />
                  Go to booking preview
                </Button>
              </Link>
              <Link to={CUSTOMER_ROUTES.BRANCHES} className="block">
                <Button type="button" variant="outline" fullWidth>
                  Explore more branches
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </CustomerPageShell>
  )
}
