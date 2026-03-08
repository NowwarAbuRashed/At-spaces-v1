import { ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface DropdownItem {
  label: string
  onClick: () => void
  icon?: ReactNode
  destructive?: boolean
}

export interface DropdownProps {
  label: string
  items: DropdownItem[]
  className?: string
}

export function Dropdown({ label, items, className }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    window.addEventListener('mousedown', handleOutsideClick)
    return () => {
      window.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [open])

  return (
    <div className={cn('relative', className)} ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-app-border bg-app-surface-alt px-3 text-sm font-medium text-app-text hover:border-app-accent/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent/60"
      >
        <span>{label}</span>
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
      </button>

      {open ? (
        <div className="absolute right-0 z-30 mt-2 min-w-48 overflow-hidden rounded-xl border border-app-border bg-app-surface p-1 shadow-soft">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                item.onClick()
                setOpen(false)
              }}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-app-surface-alt',
                item.destructive ? 'text-app-danger' : 'text-app-text',
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
