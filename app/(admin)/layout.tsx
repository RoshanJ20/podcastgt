/**
 * @module AdminLayout
 *
 * Layout for all admin routes, gating access to admin and superadmin roles.
 *
 * Key responsibilities:
 * - Authenticates the current user and redirects unauthenticated visitors to login
 * - Verifies admin or superadmin role, redirecting unauthorized users
 * - Renders the admin sidebar and top bar with a sidebar trigger
 */
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirectTo=/admin')

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  const role = roleData?.role ?? 'public'
  if (!['admin', 'superadmin'].includes(role)) redirect('/unauthorized')

  return (
    <SidebarProvider>
      <AdminSidebar role={role} userEmail={user.email ?? ''} />
      <main className="flex-1 overflow-auto">
        <div className="flex items-center gap-2 p-4 border-b">
          <SidebarTrigger />
          <span className="text-sm text-muted-foreground">Admin Panel</span>
        </div>
        <div className="p-6">{children}</div>
      </main>
    </SidebarProvider>
  )
}
