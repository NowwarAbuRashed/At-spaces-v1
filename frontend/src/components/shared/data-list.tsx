import type { CSSProperties, ReactNode } from 'react'
import { EmptyState } from '@/components/shared/empty-state'
import { cn } from '@/lib/cn'

export interface DataListColumn<T> {
  key: string
  label: string
  render: (row: T) => ReactNode
  className?: string
}

export interface DataListProps<T> {
  columns: DataListColumn<T>[]
  rows: T[]
  rowKey: (row: T, index: number) => string
  emptyTitle?: string
  emptyDescription?: string
  className?: string
}

export function DataList<T>({
  columns,
  rows,
  rowKey,
  emptyTitle = 'No data available',
  emptyDescription = 'No records match the current filter.',
  className,
}: DataListProps<T>) {
  if (!rows.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }

  return (
    <div className={cn('overflow-hidden rounded-xl border border-app-border', className)}>
      <div
        className="hidden grid-cols-[repeat(var(--col-count),minmax(0,1fr))] bg-app-surface-alt px-4 py-3 text-xs font-semibold uppercase tracking-wide text-app-muted md:grid"
        style={{ '--col-count': columns.length } as CSSProperties}
      >
        {columns.map((column) => (
          <div key={column.key} className={column.className}>
            {column.label}
          </div>
        ))}
      </div>
      <div className="divide-y divide-app-border">
        {rows.map((row, index) => (
          <div
            key={rowKey(row, index)}
            className="grid gap-3 bg-app-surface px-4 py-4 md:grid-cols-[repeat(var(--col-count),minmax(0,1fr))] md:items-center"
            style={{ '--col-count': columns.length } as CSSProperties}
          >
            {columns.map((column) => (
              <div key={column.key} className={cn('text-sm text-app-text', column.className)}>
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-app-muted md:hidden">
                  {column.label}
                </span>
                {column.render(row)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
