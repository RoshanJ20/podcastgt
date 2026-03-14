/**
 * @module PublicLayout
 *
 * Layout for all public-facing routes with sidebar navigation and footer.
 *
 * Key responsibilities:
 * - Renders the public sidebar for navigation
 * - Shows a mobile-friendly sidebar trigger on small screens
 * - Provides a consistent footer across all public pages
 */
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { PublicSidebar } from '@/components/library/PublicSidebar'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <PublicSidebar />
      <div className="flex-1 min-h-screen flex flex-col overflow-auto">
        <div className="flex items-center gap-2 p-4 border-b lg:hidden">
          <SidebarTrigger />
          <span className="text-sm text-muted-foreground">Podcast Hub</span>
        </div>
        <main className="flex-1">{children}</main>
        <footer className="border-t py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} National Audit Office — Podcast Hub
        </footer>
      </div>
    </SidebarProvider>
  )
}
