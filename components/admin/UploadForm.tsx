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
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { DOMAINS, type Domain, type ContentType } from '@/lib/supabase/types'
import { Upload, X, Loader2 } from 'lucide-react'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  domain: z.string().min(1, 'Domain is required'),
  year: z.number().int().min(2000).max(2100),
  content_type: z.enum(['technical', 'learning_series']),
  playlist_id: z.string().optional(),
  tags: z.array(z.string()),
})

type FormValues = z.infer<typeof schema>

interface UploadFormProps {
  playlists?: { id: string; title: string }[]
  editPodcast?: {
    id: string
    title: string
    description: string | null
    domain: Domain
    year: number
    content_type: ContentType
    playlist_id: string | null
    tags: string[]
  }
}

async function uploadFile(
  file: File,
  bucket: string,
  pathPrefix: string
): Promise<string> {
  const ext = file.name.split('.').pop()
  const path = `${pathPrefix}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bucket, path, contentType: file.type }),
  })
  const { signedUrl, publicUrl } = await res.json()

  await fetch(signedUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  })

  return publicUrl
}

export function UploadForm({ playlists = [], editPodcast }: UploadFormProps) {
  const router = useRouter()
  const [tagInput, setTagInput] = useState('')
  const [loading, setLoading] = useState(false)

  const [files, setFiles] = useState<{
    thumbnail?: File
    audioShort?: File
    audioLong?: File
    bulletin?: File
    transcript?: File
  }>({})

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: editPodcast
      ? {
          title: editPodcast.title,
          description: editPodcast.description ?? '',
          domain: editPodcast.domain,
          year: editPodcast.year,
          content_type: editPodcast.content_type,
          playlist_id: editPodcast.playlist_id ?? undefined,
          tags: editPodcast.tags,
        }
      : {
          year: new Date().getFullYear(),
          content_type: 'technical',
          tags: [],
        },
  })

  const tags = form.watch('tags')
  const contentType = form.watch('content_type')

  const addTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (t && !tags.includes(t)) {
      form.setValue('tags', [...tags, t])
    }
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    form.setValue('tags', tags.filter((t: string) => t !== tag))
  }

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    try {
      const payload: Record<string, unknown> = { ...values }

      if (files.thumbnail) {
        payload.thumbnail_url = await uploadFile(files.thumbnail, 'thumbnails', 'covers')
      }
      if (files.audioShort) {
        payload.audio_short_url = await uploadFile(files.audioShort, 'audio', 'short')
      }
      if (files.audioLong) {
        payload.audio_long_url = await uploadFile(files.audioLong, 'audio', 'long')
      }
      if (files.bulletin) {
        payload.bulletin_url = await uploadFile(files.bulletin, 'bulletins', 'pdfs')
      }

      const url = editPodcast ? `/api/podcasts/${editPodcast.id}` : '/api/podcasts'
      const method = editPodcast ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to save podcast')
      }

      const podcast = await res.json()

      // Upload transcript if provided
      if (files.transcript) {
        const text = await files.transcript.text()
        await fetch(`/api/podcasts/${podcast.id}/transcript`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ full_text: text }),
        })
      }

      toast.success(editPodcast ? 'Podcast updated!' : 'Podcast uploaded!')
      router.push('/admin/manage')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        <FormField
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title *</FormLabel>
              <FormControl>
                <Input placeholder="Podcast title" {...field} />
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
                <Textarea placeholder="Brief overview of this podcast…" rows={3} {...field} />
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

        <FormField
          name="content_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content Type *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="technical">Technical Content</SelectItem>
                  <SelectItem value="learning_series">Learning Series</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {contentType === 'learning_series' && playlists.length > 0 && (
          <FormField
            name="playlist_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Add to Playlist</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select playlist (optional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {playlists.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Tags */}
        <div className="space-y-2">
          <FormLabel>Tags</FormLabel>
          <div className="flex gap-2">
            <Input
              placeholder="Add tag and press Enter"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addTag()
                }
              }}
            />
            <Button type="button" variant="outline" onClick={addTag}>Add</Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.map((tag: string) => (
                <Badge key={tag} variant="secondary" className="gap-1 cursor-pointer" onClick={() => removeTag(tag)}>
                  {tag}
                  <X className="h-3 w-3" />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* File Uploads */}
        <Card>
          <CardContent className="pt-4 space-y-4">
            <p className="text-sm font-medium">Files</p>

            {[
              { label: 'Thumbnail Image', key: 'thumbnail', accept: 'image/*' },
              { label: 'Audio — Short Duration', key: 'audioShort', accept: 'audio/*' },
              { label: 'Audio — Long Duration', key: 'audioLong', accept: 'audio/*' },
              { label: 'Bulletin (PDF)', key: 'bulletin', accept: '.pdf' },
              { label: 'Transcript (plain text, optional)', key: 'transcript', accept: '.txt,.vtt' },
            ].map(({ label, key, accept }) => (
              <div key={key} className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-sm text-muted-foreground">{label}</label>
                  <Input
                    type="file"
                    accept={accept}
                    className="mt-1 cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) setFiles((prev) => ({ ...prev, [key]: file }))
                    }}
                  />
                </div>
                {files[key as keyof typeof files] && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-4">
                    <Upload className="h-3 w-3" />
                    {files[key as keyof typeof files]!.name}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {editPodcast ? 'Save Changes' : 'Upload Podcast'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
