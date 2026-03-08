import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface LoadingStateProps {
  label?: string
  className?: string
}

export function LoadingState({ label = 'Loading...', className }: LoadingStateProps) {
  return (
    <div className={cn('flex items-center justify-center gap-3 py-12 text-app-muted', className)}>
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  )
}

