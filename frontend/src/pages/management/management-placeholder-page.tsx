import { Construction } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeader } from '@/components/shared/page-header'
import { SectionCard } from '@/components/shared/section-card'
import { Button } from '@/components/ui/button'

export interface ManagementPlaceholderPageProps {
  title: string
  description: string
}

export function ManagementPlaceholderPage({ title, description }: ManagementPlaceholderPageProps) {
  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        actions={
          <Button variant="secondary" size="md">
            Phase 1 Scaffold
          </Button>
        }
      />

      <SectionCard title={`${title} Workspace`} description="Foundational layout and reusable components are ready.">
        <EmptyState
          icon={Construction}
          title={`${title} content lands in later phases`}
          description="This page is intentionally scaffolded during Phase 1. Feature-specific UI and data workflows are added in upcoming phases."
        />
      </SectionCard>
    </div>
  )
}

