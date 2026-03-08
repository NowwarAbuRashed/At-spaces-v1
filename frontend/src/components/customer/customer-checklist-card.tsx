import { CheckCircle2, CircleDashed } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export interface CustomerChecklistItem {
  label: string
  description?: string
  done?: boolean
}

export interface CustomerChecklistCardProps {
  title: string
  description?: string
  items: CustomerChecklistItem[]
}

export function CustomerChecklistCard({ title, description, items }: CustomerChecklistCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-start gap-3 rounded-xl border border-app-border bg-app-surface-alt/70 p-3"
          >
            {item.done ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-app-success" />
            ) : (
              <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-app-muted" />
            )}
            <div className="space-y-1">
              <p className="text-sm font-semibold text-app-text">{item.label}</p>
              {item.description ? <p className="text-xs text-app-muted">{item.description}</p> : null}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
