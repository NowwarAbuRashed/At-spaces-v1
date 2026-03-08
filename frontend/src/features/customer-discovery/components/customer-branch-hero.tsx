import { Building2, Compass, Sparkles } from 'lucide-react'
import { Badge, Card, CardContent } from '@/components/ui'

export interface CustomerBranchHeroProps {
  branchCount: number
  cityCount: number
  serviceCount: number
}

export function CustomerBranchHero({
  branchCount,
  cityCount,
  serviceCount,
}: CustomerBranchHeroProps) {
  return (
    <Card className="overflow-hidden rounded-[1.75rem] border-app-border bg-app-surface/85">
      <CardContent className="relative space-y-6 pt-6 sm:pt-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-app-accent/18 blur-3xl" />

        <div className="relative max-w-3xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-app-accent">Branch Discovery</p>
          <h1 className="font-heading text-3xl font-semibold text-app-text sm:text-4xl">
            Find the right AtSpaces branch for your next booking
          </h1>
          <p className="text-base text-app-muted sm:text-lg">
            Explore branch locations, compare services, and review facilities before moving to booking preview.
          </p>
        </div>

        <div className="relative flex flex-wrap gap-2">
          <Badge variant="subtle" className="inline-flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-app-accent" />
            {branchCount} branches
          </Badge>
          <Badge variant="subtle" className="inline-flex items-center gap-1.5">
            <Compass className="h-3.5 w-3.5 text-app-accent" />
            {cityCount} cities
          </Badge>
          <Badge variant="subtle" className="inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-app-accent" />
            {serviceCount} service types
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
