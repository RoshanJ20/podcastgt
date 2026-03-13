'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Headphones, Search, Settings, GitBranch } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PublicNav() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 font-bold shrink-0 group">
          <div className="bg-gradient-to-br from-[#8B5CF6] to-[#3B82F6] p-1.5 rounded-lg">
            <Headphones className="h-4 w-4 text-white" />
          </div>
          <span className="hidden sm:inline text-lg font-bold gradient-text font-[family-name:var(--font-heading)]">
            Podcast Hub
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className={cn(
              'relative px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
              pathname === '/'
                ? 'text-white bg-gradient-to-r from-[#8B5CF6] to-[#6366F1]'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            )}
          >
            Library
          </Link>
          <Link
            href="/learning-path"
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
              pathname?.startsWith('/learning-path')
                ? 'text-white bg-gradient-to-r from-[#8B5CF6] to-[#6366F1]'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            )}
          >
            <GitBranch className="h-3.5 w-3.5" />
            Learning Paths
          </Link>
          <Link
            href="/search"
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
              pathname === '/search'
                ? 'text-white bg-gradient-to-r from-[#8B5CF6] to-[#6366F1]'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            )}
          >
            <Search className="h-3.5 w-3.5" />
            Ask the Podcast
          </Link>
        </nav>

        <Link
          href="/admin"
          className="p-2 rounded-lg text-muted-foreground hover:text-primary transition-colors hover:bg-primary/10"
          title="Admin"
        >
          <Settings className="h-4 w-4" />
        </Link>
      </div>
    </header>
  )
}
