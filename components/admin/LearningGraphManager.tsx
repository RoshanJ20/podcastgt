/**
 * @module LearningGraphManager
 *
 * Admin interface for creating and managing learning paths (graphs).
 *
 * Key responsibilities:
 * - Provides a form for creating new learning paths with title, description, domain, and mode
 * - Lists existing learning paths with publish/unpublish, edit, and delete actions
 * - Supports both linear and graph-based path types
 * - Persists changes via API calls with optimistic UI updates
 */
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
import { Badge } from '@/components/ui/badge'
import { LEARNING_SERIES_DOMAINS } from '@/lib/supabase/types'
import { learningGraphSchema, type LearningGraphFormValues } from '@/lib/schemas/learning-graph'
import { Loader2, Trash2, Pencil, Eye, EyeOff, GitBranch, List } from 'lucide-react'
import type { LearningGraph } from '@/lib/supabase/types'

export function LearningGraphManager({ graphs: initialGraphs }: { graphs: LearningGraph[] }) {
  const router = useRouter()
  const [graphs, setGraphs] = useState(initialGraphs)
  const [loading, setLoading] = useState(false)

  const form = useForm<LearningGraphFormValues>({
    resolver: zodResolver(learningGraphSchema),
    defaultValues: { title: '', description: '', domain: '', path_type: 'graph' },
  })

  const onSubmit = async (values: LearningGraphFormValues) => {
    setLoading(true)
    try {
      const res = await fetch('/api/learning-graphs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error('Failed to create graph')
      const graph = await res.json()
      setGraphs((prev) => [{ ...graph, episode_count: 0 }, ...prev])
      form.reset()
      toast.success('Learning path created!')
      router.refresh()
    } catch (error) {
      console.error('[LearningGraphManager] Failed to create learning path:', error)
      toast.error('Failed to create learning path')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/learning-graphs/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setGraphs((prev) => prev.filter((graph) => graph.id !== id))
      toast.success('Learning path deleted')
    } else {
      toast.error('Failed to delete learning path')
    }
  }

  const togglePublish = async (id: string, isPublished: boolean) => {
    const res = await fetch(`/api/learning-graphs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published: !isPublished }),
    })
    if (res.ok) {
      setGraphs((prev) =>
        prev.map((graph) => (graph.id === id ? { ...graph, is_published: !isPublished } : graph))
      )
      toast.success(isPublished ? 'Unpublished' : 'Published!')
    } else {
      toast.error('Failed to update')
    }
  }

  const pathType = form.watch('path_type')

  return (
    <div className="space-y-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Create New Learning Path</CardTitle>
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
                      <Input placeholder="Learning path title" {...field} />
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
                      <Textarea placeholder="Describe this learning path…" rows={2} {...field} />
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
                          {LEARNING_SERIES_DOMAINS.map((domain) => (
                            <SelectItem key={domain} value={domain}>{domain}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="path_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mode</FormLabel>
                      <div className="flex rounded-lg border p-1 gap-1">
                        <button
                          type="button"
                          onClick={() => field.onChange('linear')}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                            field.value === 'linear'
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <List className="h-3.5 w-3.5" />
                          Linear
                        </button>
                        <button
                          type="button"
                          onClick={() => field.onChange('graph')}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                            field.value === 'graph'
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <GitBranch className="h-3.5 w-3.5" />
                          Graph
                        </button>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Learning Path
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Existing Learning Paths</h2>
        {graphs.length === 0 && (
          <p className="text-sm text-muted-foreground">No learning paths yet.</p>
        )}
        {graphs.map((graph) => (
          <Card key={graph.id}>
            <CardContent className="pt-4 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{graph.title}</p>
                  <Badge variant={graph.is_published ? 'default' : 'secondary'}>
                    {graph.is_published ? 'Published' : 'Draft'}
                  </Badge>
                  <Badge variant="outline" className="gap-1 text-[10px]">
                    {graph.path_type === 'linear' ? (
                      <><List className="h-2.5 w-2.5" /> Linear</>
                    ) : (
                      <><GitBranch className="h-2.5 w-2.5" /> Graph</>
                    )}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {graph.domain}
                  {graph.episode_count !== undefined && ` · ${graph.episode_count} episodes`}
                </p>
                {graph.description && (
                  <p className="text-sm text-muted-foreground mt-1">{graph.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  title={graph.is_published ? 'Unpublish' : 'Publish'}
                  onClick={() => togglePublish(graph.id, graph.is_published)}
                >
                  {graph.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" asChild title="Edit">
                  <Link href={`/admin/learning-graphs/${graph.id}`}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(graph.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
