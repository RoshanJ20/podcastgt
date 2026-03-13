'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DOMAINS } from '@/lib/supabase/types'

export function DomainFilter() {
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
    <Tabs value={current} onValueChange={handleChange}>
      <TabsList className="flex-wrap h-auto gap-1">
        <TabsTrigger value="all">All</TabsTrigger>
        {DOMAINS.map((d) => (
          <TabsTrigger key={d} value={d}>{d}</TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
