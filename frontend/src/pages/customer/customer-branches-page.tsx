import { useQueries } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { CustomerPageShell } from '@/components/customer'
import { LoadingState } from '@/components/shared/loading-state'
import { Card, CardContent } from '@/components/ui'
import { getCustomerBranchDetailsRequest } from '@/api/customer-api'
import {
  buildBranchCityOptions,
  buildBranchServiceOptions,
  mapBranchDetailsToCustomerBranch,
  mapBranchListItemToCustomerBranchFallback,
} from '@/features/customer/lib/customer-mappers'
import {
  customerQueryKeys,
  useCustomerBranchesQuery,
  useCustomerFacilitiesQuery,
  useCustomerServicesQuery,
} from '@/features/customer/hooks/use-customer-queries'
import {
  CustomerBranchCard,
  CustomerBranchEmptyState,
  CustomerBranchFilters,
  CustomerBranchHero,
  CustomerBranchSearchBar,
} from '@/features/customer-discovery/components'
import { getInlineApiErrorMessage } from '@/lib/api-error'

const ALL_CITIES = 'All Cities'
const ALL_SERVICES = 'all'

export function CustomerBranchesPage() {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState(query)
  const [selectedCity, setSelectedCity] = useState(ALL_CITIES)
  const [selectedServiceId, setSelectedServiceId] = useState(ALL_SERVICES)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)

    return () => {
      window.clearTimeout(timer)
    }
  }, [query])

  const servicesQuery = useCustomerServicesQuery()
  const facilitiesQuery = useCustomerFacilitiesQuery()
  const selectedServiceNumber =
    selectedServiceId !== ALL_SERVICES ? Number(selectedServiceId) : undefined
  const branchesQuery = useCustomerBranchesQuery({
    city: selectedCity !== ALL_CITIES ? selectedCity : undefined,
    serviceId: Number.isFinite(selectedServiceNumber) ? selectedServiceNumber : undefined,
    query: debouncedQuery,
  })

  const listItems = useMemo(() => branchesQuery.data?.items ?? [], [branchesQuery.data?.items])
  const branchDetailsQueries = useQueries({
    queries: listItems.map((branch) => ({
      queryKey: customerQueryKeys.branchDetails(branch.id),
      queryFn: () => getCustomerBranchDetailsRequest(branch.id),
      retry: false,
    })),
  })

  const isPageLoading =
    branchesQuery.isLoading ||
    servicesQuery.isLoading ||
    facilitiesQuery.isLoading ||
    branchDetailsQueries.some((queryState) => queryState.isLoading)

  const hasQueryError =
    branchesQuery.error ??
    servicesQuery.error ??
    facilitiesQuery.error ??
    branchDetailsQueries.find((queryState) => queryState.error)?.error

  const branches = useMemo(() => {
    const serviceCatalogById = new Map(
      (servicesQuery.data ?? []).map((service) => [service.id, service] as const),
    )
    const fallbackFacility = facilitiesQuery.data?.[0]
    const normalizedQuery = query.trim().toLowerCase()

    const enriched = listItems.map((branch, index) => {
      const details = branchDetailsQueries[index]?.data
      if (details) {
        return mapBranchDetailsToCustomerBranch(details, {
          serviceCatalogById,
          fallbackFacilities: facilitiesQuery.data,
        })
      }

      return mapBranchListItemToCustomerBranchFallback(
        branch,
        servicesQuery.data?.[0],
        fallbackFacility,
      )
    })

    return enriched.filter((branch) => {
      const matchesCity = selectedCity === ALL_CITIES || branch.city === selectedCity
      const matchesService =
        selectedServiceId === ALL_SERVICES ||
        branch.services.some((service) => String(service.serviceId ?? service.id) === selectedServiceId)

      const matchesQuery =
        normalizedQuery.length === 0 ||
        [
          branch.name,
          branch.city,
          branch.district,
          branch.addressLine,
          branch.locationSummary,
          ...branch.services.map((service) => service.name),
          ...branch.facilities.map((facility) => facility.name),
        ].some((candidate) => candidate.toLowerCase().includes(normalizedQuery))

      return matchesCity && matchesService && matchesQuery
    })
  }, [
    branchDetailsQueries,
    facilitiesQuery.data,
    listItems,
    query,
    selectedCity,
    selectedServiceId,
    servicesQuery.data,
  ])

  const filteredBranches = useMemo(() => {
    if (hasQueryError) {
      return []
    }

    return branches
  }, [branches, hasQueryError])

  const cityOptions = useMemo(() => buildBranchCityOptions(branches), [branches])
  const serviceOptions = useMemo(
    () => buildBranchServiceOptions(branches, servicesQuery.data ?? []),
    [branches, servicesQuery.data],
  )

  const totalBranches = branchesQuery.data?.total ?? filteredBranches.length

  const onReset = () => {
    setQuery('')
    setSelectedCity(ALL_CITIES)
    setSelectedServiceId(ALL_SERVICES)
  }

  const cityCount = Math.max(0, cityOptions.length - 1)
  const serviceCount = Math.max(0, serviceOptions.length - 1)

  const errorMessage = hasQueryError
    ? getInlineApiErrorMessage(hasQueryError, 'Could not load branches right now.')
    : null

  return (
    <CustomerPageShell
      eyebrow="Branch Discovery"
      title="Discover branches built for every work style"
      description="Search by city, service, and branch attributes to quickly shortlist the best match."
      badges={['Live branch catalog', 'Real backend integration']}
    >
      <CustomerBranchHero branchCount={totalBranches} cityCount={cityCount} serviceCount={serviceCount} />

      <Card>
        <CardContent className="space-y-5 pt-6">
          <CustomerBranchSearchBar query={query} onQueryChange={setQuery} />
          <CustomerBranchFilters
            cityOptions={cityOptions}
            serviceOptions={serviceOptions}
            selectedCity={selectedCity}
            selectedServiceId={selectedServiceId}
            onCityChange={setSelectedCity}
            onServiceChange={setSelectedServiceId}
            onClear={onReset}
          />
          <p className="text-sm text-app-muted">
            Showing {filteredBranches.length} of {totalBranches} branches.
          </p>
        </CardContent>
      </Card>

      {isPageLoading ? <LoadingState label="Loading branches and service details..." /> : null}

      {errorMessage ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-app-danger">{errorMessage}</p>
          </CardContent>
        </Card>
      ) : null}

      {!isPageLoading && !errorMessage && filteredBranches.length === 0 ? (
        <CustomerBranchEmptyState onReset={onReset} />
      ) : null}

      {!isPageLoading && !errorMessage && filteredBranches.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredBranches.map((branch) => (
            <CustomerBranchCard key={branch.id} branch={branch} />
          ))}
        </div>
      ) : null}
    </CustomerPageShell>
  )
}
