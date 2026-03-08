import { cn } from '@/lib/cn'
import type { TopBranch } from '@/features/dashboard/types'

export interface TopBranchRowProps {
  branch: TopBranch
}

export function TopBranchRow({ branch }: TopBranchRowProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl px-1 py-2 sm:flex-nowrap sm:gap-4">
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-app-surface-alt text-base font-semibold text-app-accent">
        {branch.rank}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-2xl font-semibold text-app-text">{branch.name}</p>
        <p className="text-base text-app-muted">{branch.city}</p>
      </div>

      <div className="order-3 w-full shrink-0 sm:order-none sm:w-40">
        <div className="h-2.5 overflow-hidden rounded-full bg-app-surface-alt">
          <div
            className={cn('h-full rounded-full bg-app-accent')}
            style={{ width: `${branch.occupancy}%` }}
            aria-label={`${branch.occupancy}% occupancy`}
          />
        </div>
      </div>

      <p className="w-auto text-right text-xl font-semibold text-app-text sm:w-14 sm:text-2xl">
        {branch.occupancy}%
      </p>
    </div>
  )
}
