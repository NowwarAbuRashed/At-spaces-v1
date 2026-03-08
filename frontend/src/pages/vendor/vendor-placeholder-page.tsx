import { Construction, Rocket } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { SectionCard } from '@/components/shared/section-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/status-badge'

export interface VendorPlaceholderPageProps {
  title: string
  description: string
}

export function VendorPlaceholderPage({ title, description }: VendorPlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="accent">Phase 1</Badge>
            <Button type="button" variant="secondary">
              UI Skeleton
            </Button>
          </div>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <SectionCard
          title={`${title} Workspace`}
          description="Layout, navigation, and reusable vendor components are in place."
          action={<StatusBadge status="pending" />}
        >
          <EmptyState
            icon={Construction}
            title={`${title} business logic comes in the next phase`}
            description="This page is intentionally a placeholder in Phase 1. API integrations, workflows, and operational interactions are added later."
            action={
              <Button variant="outline" type="button">
                Coming in Phase 2
              </Button>
            }
          />
        </SectionCard>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Module Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-app-muted">
            <div className="flex items-center justify-between">
              <span>Design language</span>
              <StatusBadge status="active" />
            </div>
            <div className="flex items-center justify-between">
              <span>Routing skeleton</span>
              <StatusBadge status="approved" />
            </div>
            <div className="flex items-center justify-between">
              <span>Backend integration</span>
              <StatusBadge status="pending" />
            </div>
            <div className="rounded-xl border border-app-border bg-app-surface-alt/70 p-3 text-app-muted">
              <p className="inline-flex items-center gap-2 font-semibold text-app-text">
                <Rocket className="h-4 w-4 text-app-accent" />
                Vendor Frontend Phase 1
              </p>
              <p className="mt-1">Scaffold complete and ready for feature implementation.</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
