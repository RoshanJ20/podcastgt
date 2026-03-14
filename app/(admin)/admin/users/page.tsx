/**
 * @module UsersPage
 *
 * Superadmin-only page for managing user roles.
 *
 * Key responsibilities:
 * - Authenticates the user and verifies superadmin role
 * - Redirects non-superadmin users to the unauthorized page
 * - Renders the UserRoleManager component for assigning roles
 */
import { createClient } from '@/lib/supabase/server'
import { UserRoleManager } from '@/components/admin/UserRoleManager'
import { redirect } from 'next/navigation'

export default async function UsersPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (roleData?.role !== 'superadmin') redirect('/unauthorized')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Role Management</h1>
        <p className="text-muted-foreground">
          Assign and update roles for registered users.
        </p>
      </div>
      <UserRoleManager />
    </div>
  )
}
