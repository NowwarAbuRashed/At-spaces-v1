import { Bot, Sparkles } from 'lucide-react'
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import type { CustomerRecommendationPlaceholderState } from '@/types/customer'

export interface CustomerComingSoonCardProps {
  placeholder: CustomerRecommendationPlaceholderState
  onClick: () => void
}

export function CustomerComingSoonCard({ placeholder, onClick }: CustomerComingSoonCardProps) {
  return (
    <Card className="border-app-accent/30 bg-app-accent/10">
      <CardHeader>
        <CardTitle className="inline-flex items-center gap-2 text-lg">
          <Bot className="h-5 w-5 text-app-accent" />
          {placeholder.title}
        </CardTitle>
        <CardDescription>{placeholder.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Badge variant="subtle" className="inline-flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-app-accent" />
          Lightweight placeholder
        </Badge>
        <Button type="button" variant="outline" onClick={onClick}>
          {placeholder.ctaLabel}
        </Button>
      </CardContent>
    </Card>
  )
}
