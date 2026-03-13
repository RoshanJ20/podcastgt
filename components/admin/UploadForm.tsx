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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { DOMAINS, type Domain, type ContentType } from '@/lib/supabase/types'
import { X, Loader2, ArrowRight, ArrowLeft, Check, FileText, Music, Image as ImageIcon } from 'lucide-react'
import { FileDropZone } from './FileDropZone'
import { uploadFile } from '@/lib/upload'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  domain: z.string().min(1, 'Domain is required'),
  year: z.number().int().min(2000).max(2100),
  content_type: z.enum(['technical', 'learning_series']),
  tags: z.array(z.string()),
})

type FormValues = z.infer<typeof schema>

interface UploadFormProps {
  editPodcast?: {
    id: string
    title: string
    description: string | null
    domain: Domain
    year: number
    content_type: ContentType
    tags: string[]
  }
  onSuccess?: (podcast: { id: string; title: string; thumbnail_url: string | null; domain: string }) => void
}

const STEPS = [
  { label: 'Details', number: 1 },
  { label: 'Files', number: 2 },
  { label: 'Review', number: 3 },
]

export function UploadForm({ editPodcast, onSuccess }: UploadFormProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [tagInput, setTagInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})

  const [files, setFiles] = useState<{
    thumbnail: File[]
    audioShort: File[]
    audioLong: File[]
    bulletin: File[]
    transcript: File[]
  }>({
    thumbnail: [],
    audioShort: [],
    audioLong: [],
    bulletin: [],
    transcript: [],
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: editPodcast
      ? {
          title: editPodcast.title,
          description: editPodcast.description ?? '',
          domain: editPodcast.domain,
          year: editPodcast.year,
          content_type: editPodcast.content_type,
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
  const values = form.watch()

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

  const nextStep = async () => {
    if (step === 1) {
      const valid = await form.trigger(['title', 'domain', 'year', 'content_type'])
      if (!valid) return
    }
    setStep((s) => Math.min(s + 1, 3))
  }

  const prevStep = () => setStep((s) => Math.max(s - 1, 1))

  const onSubmit = async (formValues: FormValues) => {
    setLoading(true)
    setUploadProgress({})
    try {
      const payload: Record<string, unknown> = { ...formValues }

      if (files.thumbnail[0]) {
        setUploadProgress((p) => ({ ...p, thumbnail: 0 }))
        payload.thumbnail_url = await uploadFile(files.thumbnail[0], 'thumbnails', 'covers', (pct) =>
          setUploadProgress((p) => ({ ...p, thumbnail: pct }))
        )
      }
      if (files.audioShort[0]) {
        setUploadProgress((p) => ({ ...p, audioShort: 0 }))
        payload.audio_short_url = await uploadFile(files.audioShort[0], 'audio', 'short', (pct) =>
          setUploadProgress((p) => ({ ...p, audioShort: pct }))
        )
      }
      if (files.audioLong[0]) {
        setUploadProgress((p) => ({ ...p, audioLong: 0 }))
        payload.audio_long_url = await uploadFile(files.audioLong[0], 'audio', 'long', (pct) =>
          setUploadProgress((p) => ({ ...p, audioLong: pct }))
        )
      }
      if (files.bulletin[0]) {
        setUploadProgress((p) => ({ ...p, bulletin: 0 }))
        payload.bulletin_url = await uploadFile(files.bulletin[0], 'bulletins', 'pdfs', (pct) =>
          setUploadProgress((p) => ({ ...p, bulletin: pct }))
        )
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

      if (files.transcript[0]) {
        const text = await files.transcript[0].text()
        await fetch(`/api/podcasts/${podcast.id}/transcript`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ full_text: text }),
        })
      }

      toast.success(editPodcast ? 'Podcast updated!' : 'Podcast uploaded!')
      if (onSuccess) {
        onSuccess(podcast)
      } else {
        router.push('/admin')
        router.refresh()
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const fileCount = Object.values(files).filter((f) => f.length > 0).length

  return (
    <div className="max-w-3xl space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.number} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (s.number < step) setStep(s.number)
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                step === s.number
                  ? 'btn-gradient'
                  : step > s.number
                    ? 'bg-[#8B5CF6]/15 text-[#A78BFA] cursor-pointer hover:bg-[#8B5CF6]/25'
                    : 'text-muted-foreground bg-white/5'
              }`}
            >
              <span className={`h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold ${
                step > s.number ? 'bg-[#8B5CF6] text-white' : ''
              }`}>
                {step > s.number ? <Check className="h-3 w-3" /> : s.number}
              </span>
              {s.label}
            </button>
            {i < STEPS.length - 1 && (
              <div className={`h-px w-8 ${step > s.number ? 'bg-[#8B5CF6]' : 'bg-border'}`} />
            )}
          </div>
        ))}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Step 1: Details */}
          {step === 1 && (
            <div className="glass-card rounded-xl p-6 space-y-5">
              <div>
                <h2 className="text-lg font-semibold font-[family-name:var(--font-heading)]">Podcast Details</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Basic information about the podcast</p>
              </div>

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
                  <button type="button" onClick={addTag} className="px-4 py-2 rounded-lg border border-border text-sm hover-glow hover:border-[#8B5CF6]/30 transition-all">
                    Add
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="gap-1 cursor-pointer bg-[#8B5CF6]/15 text-[#A78BFA] hover:bg-[#8B5CF6]/25" onClick={() => removeTag(tag)}>
                        {tag}
                        <X className="h-3 w-3" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Files */}
          {step === 2 && (
            <div className="glass-card rounded-xl p-6 space-y-5">
              <div>
                <h2 className="text-lg font-semibold font-[family-name:var(--font-heading)]">Upload Files</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Drag & drop or click to select files</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FileDropZone
                  accept="image/*"
                  label="Thumbnail Image"
                  icon="image"
                  files={files.thumbnail}
                  onFilesChange={(f) => setFiles((prev) => ({ ...prev, thumbnail: f }))}
                  showPreview
                />
                <FileDropZone
                  accept="audio/*"
                  label="Audio — Short Duration"
                  icon="audio"
                  files={files.audioShort}
                  onFilesChange={(f) => setFiles((prev) => ({ ...prev, audioShort: f }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FileDropZone
                  accept="audio/*"
                  label="Audio — Long Duration"
                  icon="audio"
                  files={files.audioLong}
                  onFilesChange={(f) => setFiles((prev) => ({ ...prev, audioLong: f }))}
                />
                <FileDropZone
                  accept=".pdf"
                  label="Bulletin (PDF)"
                  icon="pdf"
                  files={files.bulletin}
                  onFilesChange={(f) => setFiles((prev) => ({ ...prev, bulletin: f }))}
                />
              </div>

              <FileDropZone
                accept=".txt,.vtt"
                label="Transcript (optional)"
                description="Plain text or VTT subtitle file"
                icon="file"
                files={files.transcript}
                onFilesChange={(f) => setFiles((prev) => ({ ...prev, transcript: f }))}
              />
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="glass-card rounded-xl p-6 space-y-5">
              <div>
                <h2 className="text-lg font-semibold font-[family-name:var(--font-heading)]">Review & Upload</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Confirm everything looks good</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Title</p>
                    <p className="font-medium">{values.title || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Domain</p>
                    <p className="font-medium">{values.domain || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Year</p>
                    <p className="font-medium">{values.year}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Content Type</p>
                    <p className="font-medium">{values.content_type === 'learning_series' ? 'Learning Series' : 'Technical'}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {values.description && (
                    <div>
                      <p className="text-xs text-muted-foreground">Description</p>
                      <p className="text-sm line-clamp-3">{values.description}</p>
                    </div>
                  )}
                  {tags.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Tags</p>
                      <div className="flex flex-wrap gap-1">
                        {tags.map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="text-xs bg-[#8B5CF6]/15 text-[#A78BFA]">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Files summary */}
              <div className="border-t border-border pt-4">
                <p className="text-xs text-muted-foreground mb-2">Files ({fileCount} selected)</p>
                <div className="space-y-2">
                  {([
                    ['thumbnail', 'Thumbnail', ImageIcon],
                    ['audioShort', 'Audio (Short)', Music],
                    ['audioLong', 'Audio (Long)', Music],
                    ['bulletin', 'Bulletin PDF', FileText],
                    ['transcript', 'Transcript', FileText],
                  ] as const).map(([key, label, FileIcon]) => {
                    const file = files[key][0]
                    const progress = uploadProgress[key]
                    return (
                      <div key={key} className="flex items-center gap-2 text-sm">
                        <FileIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground w-24 shrink-0">{label}</span>
                        {file ? (
                          <span className="truncate">{file.name}</span>
                        ) : (
                          <span className="text-muted-foreground/50 italic">Not selected</span>
                        )}
                        {progress !== undefined && progress < 100 && (
                          <div className="ml-auto w-20 h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        )}
                        {progress === 100 && (
                          <Check className="h-3.5 w-3.5 text-green-500 ml-auto" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <div>
              {step > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium border border-border hover-glow hover:border-[#8B5CF6]/30 transition-all"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2.5 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:text-foreground transition-all"
              >
                Cancel
              </button>
              {step < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="btn-gradient px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-1.5"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-gradient px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1.5"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editPodcast ? 'Save Changes' : 'Upload Podcast'}
                </button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
