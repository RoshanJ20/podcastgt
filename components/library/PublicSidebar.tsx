/**
 * @module PublicSidebar
 *
 * Sidebar navigation for the public-facing site with browse links and user controls.
 *
 * Key responsibilities:
 * - Renders navigation links for bulletins, learning paths, and progress
 * - Highlights the active route in the sidebar menu
 * - Embeds the UserNav component in the sidebar footer for auth and theme controls
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
import { Headphones, BookOpen, BarChart3 } from 'lucide-react'
import { UserNav } from '@/components/library/UserNav'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Bulletins', icon: Headphones },
  { href: '/learning-path', label: 'Learning Paths', icon: BookOpen },
  { href: '/progress', label: 'My Progress', icon: BarChart3 },
]

export function PublicSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader className="p-4 pb-2">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="font-semibold gradient-text font-[family-name:var(--font-heading)]">Podcast Hub</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/60">Browse</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map(({ href, label, icon: Icon }) => (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton
                  render={<Link href={href} />}
                  isActive={href === '/' ? pathname === '/' : pathname.startsWith(href)}
                  className={cn(
                    'transition-all duration-200',
                    (href === '/' ? pathname === '/' : pathname.startsWith(href)) && 'bg-accent text-accent-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <UserNav />
      </SidebarFooter>
    </Sidebar>
  )
}
