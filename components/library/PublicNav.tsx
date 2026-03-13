'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Headphones, Search, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function PublicNav() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-semibold shrink-0">
          <Headphones className="h-5 w-5 text-primary" />
          <span className="hidden sm:inline">Podcast Hub</span>
        </Link>

        <nav className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className={cn(pathname === '/' && 'bg-accent')}
          >
            <Link href="/">Library</Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className={cn(pathname === '/search' && 'bg-accent')}
          >
            <Link href="/search">
              <Search className="h-4 w-4 mr-1" />
              Ask the Podcast
            </Link>
          </Button>
        </nav>

        <Button variant="ghost" size="icon" asChild title="Admin">
          <Link href="/admin">
            <Settings className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </header>
  )
}
