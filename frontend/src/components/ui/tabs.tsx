import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/cn'
import type { TabItem } from '@/types/ui'

export interface TabsProps<T extends string> {
  items: TabItem<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

export function Tabs<T extends string>({ items, value, onChange, className }: TabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label="tabs"
      className={cn(
        'flex max-w-full overflow-x-auto rounded-xl border border-app-border bg-app-surface-alt/80 p-1',
        className,
      )}
    >
      {items.map((item) => {
        const isActive = item.value === value

        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={cn(
              'inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent/60',
              isActive
                ? 'bg-app-accent text-white shadow-glow'
                : 'text-app-muted hover:bg-app-surface hover:text-app-text',
            )}
            onClick={() => onChange(item.value)}
          >
            <span>{item.label}</span>
            {typeof item.count === 'number' ? (
              <Badge
                variant={isActive ? 'subtle' : 'neutral'}
                className={cn(
                  'px-1.5 py-0 text-[11px]',
                  isActive ? 'bg-white/20 text-white' : undefined,
                )}
              >
                {item.count}
              </Badge>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
