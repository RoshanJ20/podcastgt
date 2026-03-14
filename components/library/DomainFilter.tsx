/**
 * @module DomainFilter
 *
 * Horizontal filter bar for selecting a domain category.
 *
 * Key responsibilities:
 * - Renders pill-shaped filter buttons for each domain plus an "All" option
 * - Updates the URL search params to reflect the selected domain filter
 * - Applies domain-specific color styling to the active filter button
 * - Accepts an explicit list of domains so each page shows only relevant options
 */
'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { DOMAINS, DOMAIN_COLORS } from '@/lib/supabase/types'
import type { Domain } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

interface DomainFilterProps {
  domains?: Domain[]
}

export function DomainFilter({ domains = DOMAINS }: DomainFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const current = searchParams.get('domain') ?? 'all'

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      params.delete('domain')
    } else {
      params.set('domain', value)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => handleChange('all')}
        className={cn(
          'px-3.5 py-1.5 text-sm font-medium rounded-full transition-all',
          current === 'all'
            ? 'btn-gradient shadow-md'
            : 'border border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
        )}
      >
        All
      </button>
      {domains.map((domain) => (
        <button
          key={domain}
          onClick={() => handleChange(domain)}
          className={cn(
            'px-3.5 py-1.5 text-sm font-medium rounded-full transition-all',
            current === domain
              ? `${DOMAIN_COLORS[domain]} shadow-md`
              : 'border border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
          )}
        >
          {domain}
        </button>
      ))}
    </div>
  )
}
