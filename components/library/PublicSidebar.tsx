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
import { Headphones, BookOpen, Settings } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Bulletins', icon: Headphones },
  { href: '/learning-path', label: 'Learning Paths', icon: BookOpen },
]

export function PublicSidebar() {
  const pathname = usePathname()

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
          <SidebarGroupLabel>Browse</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map(({ href, label, icon: Icon }) => (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton
                  render={<Link href={href} />}
                  isActive={href === '/' ? pathname === '/' : pathname.startsWith(href)}
                  className={cn(
                    'transition-all duration-200 hover:translate-x-0.5',
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

      <SidebarFooter className="border-t p-4">
        <div className="flex items-center justify-between">
          <SidebarMenu className="flex-1">
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link href="/admin" />}
                className="transition-all duration-200 hover:translate-x-0.5"
              >
                <Settings className="h-4 w-4" />
                Admin
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
