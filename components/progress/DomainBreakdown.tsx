/**
 * @module DomainBreakdown
 *
 * Renders a card showing how many bulletins the user has completed
 * in each subject domain. Domains are sorted by count (highest first)
 * and displayed in a responsive grid with domain-specific color badges.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Headphones } from 'lucide-react'
import { DOMAIN_COLORS } from '@/lib/supabase/types'
import type { Domain } from '@/lib/supabase/types'

interface DomainBreakdownProps {
  domainProgress: Record<string, number>
}

export function DomainBreakdown({ domainProgress }: DomainBreakdownProps) {
  const domainEntries = Object.entries(domainProgress).sort(
    ([, countA], [, countB]) => countB - countA,
  )

  if (domainEntries.length === 0) return null

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Headphones className="h-4 w-4 text-[#60A5FA]" />
          Domains
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {domainEntries.map(([domain, count]) => (
            <div
              key={domain}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
            >
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DOMAIN_COLORS[domain as Domain]}`}
              >
                {domain}
              </span>
              <span className="text-sm font-bold">{count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
