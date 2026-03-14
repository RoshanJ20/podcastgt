/**
 * @module UnauthorizedPage
 *
 * Static error page displayed when a user lacks permission to access a route.
 *
 * Key responsibilities:
 * - Shows an access denied message with a shield icon
 * - Directs users to contact a Superadmin for access
 * - Provides a link back to the public library
 */
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ShieldOff } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center p-4">
      <ShieldOff className="h-12 w-12 text-muted-foreground" />
      <h1 className="text-2xl font-semibold">Access Denied</h1>
      <p className="text-muted-foreground max-w-sm">
        You don&apos;t have permission to access this page. Contact a Superadmin to request access.
      </p>
      <Button asChild>
        <Link href="/">Go to Library</Link>
      </Button>
    </div>
  )
}
