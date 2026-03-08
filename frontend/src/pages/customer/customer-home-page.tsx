import { ArrowRight, Search, Sparkles, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CustomerChecklistCard, CustomerPageShell } from '@/components/customer'
import { LoadingState } from '@/components/shared/loading-state'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from '@/components/ui'
import { useBackendVersionQuery, useCustomerFeaturesQuery } from '@/features/customer/hooks/use-customer-queries'
import {
  getBranchStartingPrice,
  mockCustomerBranches,
} from '@/features/customer-discovery/data/customer-branches-mock-data'
import { formatCurrency } from '@/lib/format'
import { CUSTOMER_ROUTES, getCustomerBranchDetailsRoute } from '@/lib/routes'

export function CustomerHomePage() {
  const featuredBranches = mockCustomerBranches.slice(0, 3)
  const featuresQuery = useCustomerFeaturesQuery()
  const versionQuery = useBackendVersionQuery()
  const backendVersion = versionQuery.data?.version ?? 'unknown'

  return (
    <CustomerPageShell
      eyebrow="AtSpaces Customer Portal"
      title="Book your ideal space with confidence"
      description="Browse premium branches, compare services, and reserve a slot in just a few steps."
      badges={['Phase 1', 'Design system ready', `Backend ${backendVersion}`]}
      actions={
        <div className="flex flex-wrap gap-3">
          <Link to={CUSTOMER_ROUTES.BRANCHES}>
            <Button type="button" size="lg">
              Explore Branches
            </Button>
          </Link>
          <Link to={CUSTOMER_ROUTES.BOOKING_PREVIEW}>
            <Button type="button" variant="secondary" size="lg">
              Booking Preview
            </Button>
          </Link>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Quick Search</CardTitle>
            <CardDescription>Route and visual skeleton for the upcoming search and filter flow.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Search by city, branch, or service" leftIcon={<Search className="h-4 w-4" />} />
            <div className="flex flex-wrap gap-2">
              <Badge variant="accent">Riyadh</Badge>
              <Badge variant="neutral">Private Office</Badge>
              <Badge variant="neutral">Meeting Room</Badge>
              <Badge variant="neutral">Today</Badge>
            </div>
            <p className="text-sm text-app-muted">
              Live filtering and availability checks are wired in later phases.
            </p>
          </CardContent>
        </Card>

        <CustomerChecklistCard
          title="Customer Journey"
          description="Phase plan for this portal."
          items={[
            {
              label: 'Design system and route skeleton',
              description: 'Foundational customer layout and pages in place.',
              done: true,
            },
            {
              label: 'Auth and registration flow',
              description: 'Login/register/forgot password forms in Phase 2.',
            },
            {
              label: 'Branch discovery and booking',
              description: 'Live catalog, availability, and booking creation in later phases.',
            },
          ]}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Feature Catalog</CardTitle>
          <CardDescription>Public feature list from backend (`GET /features`).</CardDescription>
        </CardHeader>
        <CardContent>
          {featuresQuery.isPending ? <LoadingState label="Loading feature catalog..." className="py-4" /> : null}
          {featuresQuery.isError ? (
            <p className="text-sm text-app-warning">
              Feature catalog is unavailable at the moment.
            </p>
          ) : null}
          {!featuresQuery.isPending && !featuresQuery.isError ? (
            <div className="flex flex-wrap gap-2">
              {(featuresQuery.data ?? []).map((feature) => (
                <Badge key={feature.id} variant="neutral">
                  {feature.name}
                </Badge>
              ))}
              {(featuresQuery.data ?? []).length === 0 ? (
                <span className="text-sm text-app-muted">No features returned by backend.</span>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {featuredBranches.map((branch) => (
          <Card key={branch.id} className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-lg">{branch.name}</CardTitle>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-app-warning">
                  <Star className="h-4 w-4 fill-app-warning text-app-warning" />
                  {branch.rating.toFixed(1)}
                </span>
              </div>
              <CardDescription>
                {branch.city}, {branch.district}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-app-muted">{branch.description}</p>
              <p className="text-sm font-semibold text-app-text">
                Starts from {formatCurrency(getBranchStartingPrice(branch))}/{branch.services[0]?.unit ?? 'hour'}
              </p>
              <Link
                to={getCustomerBranchDetailsRoute(branch.id)}
                className="inline-flex items-center gap-2 text-sm font-semibold text-app-accent transition-colors hover:text-orange-300"
              >
                View branch details
                <ArrowRight className="h-4 w-4" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-app-accent/30 bg-app-accent/8">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <div className="space-y-1">
            <p className="inline-flex items-center gap-2 text-sm text-app-text sm:text-base">
              <Sparkles className="h-4 w-4 text-app-accent" />
              Optional AI recommendations can plug into this same shell later.
            </p>
            <p className="text-xs text-app-muted">
              Backend version endpoint: {versionQuery.isError ? 'unavailable' : backendVersion}
            </p>
          </div>
          <Link to={CUSTOMER_ROUTES.LOGIN}>
            <Button type="button" variant="outline">
              Continue to Login
            </Button>
          </Link>
        </CardContent>
      </Card>
    </CustomerPageShell>
  )
}
