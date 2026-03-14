'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LogIn, LogOut, User, Bookmark, BarChart3, Settings, Moon, Sun } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'
import type { User as SupabaseUser } from '@supabase/supabase-js'

const emptySubscribe = () => () => {}

export function UserNav() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-2.5 animate-pulse">
        <div className="h-8 w-8 rounded-full bg-muted" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-20 rounded bg-muted" />
          <div className="h-2 w-14 rounded bg-muted" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="space-y-1">
        <a
          href="/login?redirectTo=/"
          className="flex items-center gap-3 rounded-lg p-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/50 border border-border/50">
            <LogIn className="h-3.5 w-3.5" />
          </div>
          <span className="font-medium">Sign in</span>
        </a>
        <div className="flex items-center justify-between px-2.5">
          <button
            onClick={() => mounted && setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center gap-2 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors py-1"
          >
            {mounted && theme === 'dark' ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
            {mounted ? (theme === 'dark' ? 'Light mode' : 'Dark mode') : 'Toggle theme'}
          </button>
          <a
            href="/admin"
            className="flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors py-1"
          >
            <Settings className="h-3 w-3" />
            Admin
          </a>
        </div>
      </div>
    )
  }

  const initials = (user.email ?? '?')
    .split('@')[0]
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="space-y-1">
      <DropdownMenu>
        <DropdownMenuTrigger className="outline-none w-full">
          <div className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-accent transition-colors cursor-pointer w-full text-left">
            <Avatar className="h-8 w-8 ring-2 ring-primary/20">
              <AvatarFallback className="bg-gradient-to-br from-[#60A5FA] to-[#818CF8] text-white text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.email?.split('@')[0]}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="top" className="w-56">
          <DropdownMenuItem onClick={() => router.push('/profile')} className="cursor-pointer">
            <User className="h-4 w-4 mr-2" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/profile#bookmarks')} className="cursor-pointer">
            <Bookmark className="h-4 w-4 mr-2" />
            My Bookmarks
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/progress')} className="cursor-pointer">
            <BarChart3 className="h-4 w-4 mr-2" />
            Progress & Analytics
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="flex items-center justify-between px-2.5">
        <button
          onClick={() => mounted && setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex items-center gap-2 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors py-1"
        >
          {mounted && theme === 'dark' ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
          {mounted ? (theme === 'dark' ? 'Light mode' : 'Dark mode') : 'Toggle theme'}
        </button>
        <a
          href="/admin"
          className="flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors py-1"
        >
          <Settings className="h-3 w-3" />
          Admin
        </a>
      </div>
    </div>
  )
}
