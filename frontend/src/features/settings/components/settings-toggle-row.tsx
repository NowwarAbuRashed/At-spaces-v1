import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/cn'

export interface SettingsToggleRowProps {
  title: string
  description: string
  enabled: boolean
  onToggle: (next: boolean) => void
  disabled?: boolean
  className?: string
}

export function SettingsToggleRow({
  title,
  description,
  enabled,
  onToggle,
  disabled = false,
  className,
}: SettingsToggleRowProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 rounded-xl border border-app-border bg-app-surface-alt/60 px-4 py-3',
        className,
      )}
    >
      <div>
        <p className="text-base font-semibold text-app-text">{title}</p>
        <p className="text-sm text-app-muted">{description}</p>
      </div>
      <Switch checked={enabled} onCheckedChange={onToggle} label={title} disabled={disabled} />
    </div>
  )
}
