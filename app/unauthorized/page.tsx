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
