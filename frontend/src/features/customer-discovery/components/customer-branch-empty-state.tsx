import { Compass } from 'lucide-react'
import { Button, Card, CardContent } from '@/components/ui'

export interface CustomerBranchEmptyStateProps {
  onReset: () => void
}

export function CustomerBranchEmptyState({ onReset }: CustomerBranchEmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-app-border bg-app-surface-alt text-app-accent">
          <Compass className="h-6 w-6" />
        </span>
        <div className="space-y-2">
          <p className="font-heading text-xl font-semibold text-app-text">No branches matched your filters</p>
          <p className="max-w-md text-sm text-app-muted">
            Try another city or service selection, or clear filters to view all branches.
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={onReset}>
          Reset filters
        </Button>
      </CardContent>
    </Card>
  )
}
