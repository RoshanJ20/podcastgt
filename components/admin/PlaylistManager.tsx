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
import { DOMAINS, DOMAIN_COLORS } from '@/lib/supabase/types'
import { Loader2, Trash2, ChevronDown, ChevronRight, ListMusic, Upload, FolderPlus } from 'lucide-react'
import type { Playlist } from '@/lib/supabase/types'
import { PlaylistEpisodeManager } from './PlaylistEpisodeManager'
import { BulkEpisodeUploader } from './BulkEpisodeUploader'

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
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [createMode, setCreateMode] = useState<'empty' | 'bulk'>('bulk')
  const [showBulkUploader, setShowBulkUploader] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { year: new Date().getFullYear() },
  })

  const formValues = form.watch()
  const isFormValid = formValues.title && formValues.domain && formValues.year

  const onSubmitEmpty = async (values: FormValues) => {
    setLoading(true)
    try {
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error('Failed to create playlist')
      const playlist = await res.json()
      setPlaylists((prev) => [{ ...playlist, episode_count: 0 }, ...prev])
      form.reset()
      toast.success('Playlist created!')
      router.refresh()
    } catch {
      toast.error('Failed to create playlist')
    } finally {
      setLoading(false)
    }
  }

  const handleStartBulkUpload = async () => {
    const valid = await form.trigger()
    if (!valid) return
    setShowBulkUploader(true)
  }

  const handleBulkComplete = () => {
    setShowBulkUploader(false)
    form.reset()
    router.refresh()
    // Refresh playlist list
    window.location.reload()
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/playlists/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setPlaylists((prev) => prev.filter((p) => p.id !== id))
      if (expandedId === id) setExpandedId(null)
      toast.success('Playlist deleted')
    } else {
      toast.error('Failed to delete playlist')
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="space-y-8">
      {/* Create form */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)]">Create New Playlist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitEmpty)} className="space-y-4">
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

              {/* Mode selector */}
              {!showBulkUploader && (
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCreateMode('bulk')
                      handleStartBulkUpload()
                    }}
                    className="btn-gradient px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Create & Upload Episodes
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 rounded-lg text-sm font-medium border border-border hover-glow hover:border-[#60A5FA]/30 transition-all flex items-center gap-2"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderPlus className="h-4 w-4" />}
                    Create Empty Playlist
                  </button>
                </div>
              )}
            </form>
          </Form>

          {/* Bulk uploader section */}
          {showBulkUploader && (
            <div className="border-t border-border pt-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold font-[family-name:var(--font-heading)]">
                    Bulk Upload Episodes
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Drop audio files and PDFs — they&apos;ll be auto-matched by filename
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBulkUploader(false)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
              <BulkEpisodeUploader
                playlistMeta={{
                  title: formValues.title,
                  description: formValues.description,
                  domain: formValues.domain,
                  year: formValues.year,
                }}
                onComplete={handleBulkComplete}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Playlist list with episode management */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold font-[family-name:var(--font-heading)]">Existing Playlists</h2>
        {playlists.length === 0 && (
          <p className="text-sm text-muted-foreground">No playlists yet.</p>
        )}
        {playlists.map((playlist) => (
          <Card key={playlist.id} className={`glass-card hover-lift transition-all ${expandedId === playlist.id ? 'border-[#60A5FA]/30' : ''}`}>
            <CardContent className="pt-4 space-y-0">
              {/* Playlist header row */}
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleExpand(playlist.id)}
                  className="mt-0.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {expandedId === playlist.id ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                </button>

                <div
                  className="flex-1 cursor-pointer min-w-0"
                  onClick={() => toggleExpand(playlist.id)}
                >
                  <div className="flex items-center gap-2">
                    <ListMusic className="h-4 w-4 text-[#60A5FA] shrink-0" />
                    <p className="font-medium truncate">{playlist.title}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${DOMAIN_COLORS[playlist.domain]}`}>
                      {playlist.domain}
                    </span>
                    <span className="text-xs text-muted-foreground">{playlist.year}</span>
                    {playlist.episode_count !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        · {playlist.episode_count} episode{playlist.episode_count !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  {playlist.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{playlist.description}</p>
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
              </div>

              {/* Expanded episode manager */}
              {expandedId === playlist.id && (
                <div className="mt-4 pt-4 border-t border-border">
                  <PlaylistEpisodeManager
                    playlistId={playlist.id}
                    playlistTitle={playlist.title}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
