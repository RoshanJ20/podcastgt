/**
 * @module AdminSidebar
 *
 * Sidebar navigation for the admin panel with role-based menu items.
 *
 * Key responsibilities:
 * - Renders navigation links for admin content management (dashboard, upload, learning paths)
 * - Conditionally shows superadmin-only menu items (user role management)
 * - Provides user account dropdown with sign-out and theme toggle
 */
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from '@/components/ui/sidebar'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Upload,
  Users,
  LogOut,
  GitBranch,
  Moon,
  Sun,
  ExternalLink,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'
import { cn } from '@/lib/utils'

interface AdminSidebarProps {
  role: string
  userEmail: string
}

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/upload', label: 'Upload Release', icon: Upload },
  { href: '/admin/learning-graphs', label: 'Learning Paths', icon: GitBranch },
]

const emptySubscribe = () => () => {}

export function AdminSidebar({ role, userEmail }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = userEmail.split('@')[0].slice(0, 2).toUpperCase()
  const username = userEmail.split('@')[0]

  return (
    <Sidebar>
      <SidebarHeader className="p-4 pb-2">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="font-semibold gradient-text font-[family-name:var(--font-heading)]">Podcast Hub</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/60">Content</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map(({ href, label, icon: Icon }) => (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton
                  render={<Link href={href} />}
                  isActive={pathname === href}
                  className={cn(
                    'transition-all duration-200',
                    pathname === href && 'bg-accent text-accent-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {role === 'superadmin' && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/60">Administration</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href="/admin/users" />}
                  isActive={pathname === '/admin/users'}
                  className={cn(
                    'transition-all duration-200',
                    pathname === '/admin/users' && 'bg-accent text-accent-foreground'
                  )}
                >
                  <Users className="h-4 w-4" />
                  User Roles
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-3">
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
                  <p className="text-sm font-medium truncate">{username}</p>
                  <p className="text-[11px] text-muted-foreground truncate capitalize">{role}</p>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium truncate">{userEmail}</p>
                <p className="text-xs text-muted-foreground capitalize">{role}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/')} className="cursor-pointer">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Public Site
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex items-center px-2.5">
            <button
              onClick={() => mounted && setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center gap-2 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors py-1"
            >
              {mounted && theme === 'dark' ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
              {mounted ? (theme === 'dark' ? 'Light mode' : 'Dark mode') : 'Toggle theme'}
            </button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
