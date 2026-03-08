import { Search } from 'lucide-react'
import { Input } from '@/components/ui'

export interface CustomerBranchSearchBarProps {
  query: string
  onQueryChange: (nextValue: string) => void
}

export function CustomerBranchSearchBar({
  query,
  onQueryChange,
}: CustomerBranchSearchBarProps) {
  return (
    <Input
      type="search"
      value={query}
      onChange={(event) => onQueryChange(event.target.value)}
      placeholder="Search by branch name, city, service, or facility"
      leftIcon={<Search className="h-4 w-4" />}
      aria-label="Search branches"
      className="h-12"
    />
  )
}
