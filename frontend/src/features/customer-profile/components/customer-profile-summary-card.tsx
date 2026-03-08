import { CalendarDays, Mail, Phone, UserRound } from 'lucide-react'
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { formatShortDate } from '@/lib/format'
import type { CustomerProfile } from '@/types/customer'

export interface CustomerProfileSummaryCardProps {
  profile: CustomerProfile
}

export function CustomerProfileSummaryCard({ profile }: CustomerProfileSummaryCardProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Profile Summary</CardTitle>
        <CardDescription>Your customer account identity and membership context.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="inline-flex w-full items-center gap-2 rounded-xl border border-app-border bg-app-surface-alt/70 px-3 py-2 text-sm text-app-text">
          <UserRound className="h-4 w-4 text-app-accent" />
          {profile.fullName}
        </p>
        <p className="inline-flex w-full items-center gap-2 rounded-xl border border-app-border bg-app-surface-alt/70 px-3 py-2 text-sm text-app-text">
          <Mail className="h-4 w-4 text-app-accent" />
          {profile.email}
        </p>
        <p className="inline-flex w-full items-center gap-2 rounded-xl border border-app-border bg-app-surface-alt/70 px-3 py-2 text-sm text-app-text">
          <Phone className="h-4 w-4 text-app-accent" />
          {profile.phone}
        </p>
        <p className="inline-flex w-full items-center gap-2 rounded-xl border border-app-border bg-app-surface-alt/70 px-3 py-2 text-sm text-app-text">
          <CalendarDays className="h-4 w-4 text-app-accent" />
          Member since {formatShortDate(profile.memberSince)}
        </p>
        <Badge variant="accent">{profile.loyaltyTier}</Badge>
      </CardContent>
    </Card>
  )
}
