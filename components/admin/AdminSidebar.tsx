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
  ListMusic,
  Users,
  Headphones,
  LogOut,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { cn } from '@/lib/utils'

interface AdminSidebarProps {
  role: string
  userEmail: string
}

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/upload', label: 'Upload Bulletin', icon: Upload },
  { href: '/admin/playlists', label: 'Playlists', icon: ListMusic },
]

export function AdminSidebar({ role, userEmail }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="bg-gradient-to-br from-[#60A5FA] to-[#38BDF8] p-1.5 rounded-lg">
            <Headphones className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold gradient-text font-[family-name:var(--font-heading)]">Podcast Hub</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Content</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map(({ href, label, icon: Icon }) => (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton
                  render={<Link href={href} />}
                  isActive={pathname === href}
                  className={cn(
                    'transition-all duration-200 hover:translate-x-0.5',
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
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href="/admin/users" />}
                  isActive={pathname === '/admin/users'}
                  className={cn(
                    'transition-all duration-200 hover:translate-x-0.5',
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

      <SidebarFooter className="border-t p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {userEmail.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{userEmail}</p>
            <p className="text-xs text-muted-foreground capitalize">{role}</p>
          </div>
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign out" className="hover-glow">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
