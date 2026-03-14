/**
 * @module UserRoleManager
 *
 * Admin interface for assigning and viewing user roles (public, admin, superadmin).
 *
 * Key responsibilities:
 * - Provides a form to assign roles to users by email
 * - Fetches and displays all users with their current roles
 * - Updates user roles optimistically via API calls
 * - Displays role badges with color-coded severity
 */
'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import type { UserRoleRecord, UserRole } from '@/lib/supabase/types'

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'public', label: 'Public' },
  { value: 'admin', label: 'Admin' },
  { value: 'superadmin', label: 'Superadmin' },
]

const ROLE_COLORS: Record<UserRole, string> = {
  public: 'secondary',
  admin: 'default',
  superadmin: 'destructive',
}

export function UserRoleManager() {
  const [users, setUsers] = useState<UserRoleRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<UserRole>('public')
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    fetch('/api/users')
      .then((response) => response.json())
      .then(setUsers)
      .finally(() => setLoading(false))
  }, [])

  const handleAssign = async () => {
    if (!newEmail.trim()) return
    setAssigning(true)

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail.trim(), role: newRole }),
      })
      if (!res.ok) throw new Error('Failed')
      const updated = await res.json()
      setUsers((prev) => {
        const exists = prev.find((user) => user.user_id === updated.user_id)
        return exists
          ? prev.map((user) => (user.user_id === updated.user_id ? { ...user, role: updated.role } : user))
          : [updated, ...prev]
      })
      setNewEmail('')
      toast.success('Role assigned')
    } catch (error) {
      console.error('[UserRoleManager] Failed to assign role:', error)
      toast.error('Failed to assign role. Make sure the user has signed in at least once.')
    } finally {
      setAssigning(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Assign Role</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3 flex-wrap">
          <Input
            placeholder="user@example.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="flex-1 min-w-48"
          />
          <Select value={newRole} onValueChange={(value) => setNewRole(value as UserRole)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((role) => (
                <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAssign} disabled={assigning || !newEmail.trim()}>
            {assigning && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Assign
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">All Users</h2>
        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!loading && users.length === 0 && (
          <p className="text-sm text-muted-foreground">No users with assigned roles yet.</p>
        )}
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between p-3 rounded-md border bg-card"
          >
            <span className="text-sm">{user.email ?? user.user_id}</span>
            <Badge variant={ROLE_COLORS[user.role] as 'default' | 'secondary' | 'destructive'}>
              {user.role}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  )
}
