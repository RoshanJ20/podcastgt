'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DOMAINS } from '@/lib/supabase/types'
import { Loader2, Trash2 } from 'lucide-react'
import type { Playlist } from '@/lib/supabase/types'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  domain: z.string().min(1, 'Domain is required'),
  year: z.number().int().min(2000).max(2100),
})

type FormValues = z.infer<typeof schema>

export function PlaylistManager({ playlists: initialPlaylists }: { playlists: Playlist[] }) {
  const router = useRouter()
  const [playlists, setPlaylists] = useState(initialPlaylists)
  const [loading, setLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { year: new Date().getFullYear() },
  })

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    try {
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error('Failed to create playlist')
      const playlist = await res.json()
      setPlaylists((prev) => [playlist, ...prev])
      form.reset()
      toast.success('Playlist created!')
      router.refresh()
    } catch {
      toast.error('Failed to create playlist')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/playlists/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setPlaylists((prev) => prev.filter((p) => p.id !== id))
      toast.success('Playlist deleted')
    } else {
      toast.error('Failed to delete playlist')
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Create New Playlist</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Playlist title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe this learning series…" rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  name="domain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Domain *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select domain" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DOMAINS.map((d) => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year *</FormLabel>
                      <FormControl>
                        <Input type="number" min={2000} max={2100} {...field} onChange={(e) => field.onChange(parseInt(e.target.value, 10))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Playlist
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Existing Playlists</h2>
        {playlists.length === 0 && (
          <p className="text-sm text-muted-foreground">No playlists yet.</p>
        )}
        {playlists.map((playlist) => (
          <Card key={playlist.id}>
            <CardContent className="pt-4 flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">{playlist.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {playlist.domain} · {playlist.year}
                  {playlist.episode_count !== undefined && ` · ${playlist.episode_count} episodes`}
                </p>
                {playlist.description && (
                  <p className="text-sm text-muted-foreground mt-1">{playlist.description}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive shrink-0"
                onClick={() => handleDelete(playlist.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
