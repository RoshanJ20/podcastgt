'use client'

import { useCallback, useMemo, useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { toast } from 'sonner'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Save, ArrowLeft, Eye, EyeOff, Loader2, GripVertical, X } from 'lucide-react'
import { GraphPodcastPicker } from './GraphPodcastPicker'
import type { LearningGraph, LearningGraphNode, Podcast } from '@/lib/supabase/types'

type PodcastSummary = Pick<Podcast, 'id' | 'title' | 'thumbnail_url' | 'domain'>

interface LinearItem {
  id: string
  podcastId: string
  title: string
  domain: string
  thumbnailUrl: string | null
}

function SortableItem({
  item,
  index,
  onRemove,
}: {
  item: LinearItem
  index: number
  onRemove: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={isDragging ? 'shadow-lg' : ''}>
        <CardContent className="pt-3 pb-3 flex items-center gap-3">
          <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
            <GripVertical className="h-4 w-4" />
          </button>
          <span className="text-sm font-bold text-muted-foreground w-6 text-center shrink-0">
            {index + 1}
          </span>
          {item.thumbnailUrl && (
            <img
              src={item.thumbnailUrl}
              alt=""
              className="w-8 h-8 rounded object-cover shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{item.title}</p>
            <Badge variant="outline" className="text-[10px] mt-0.5">
              {item.domain}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(item.id)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export function LinearPathEditor({
  graph,
  initialPodcasts,
}: {
  graph: LearningGraph
  initialPodcasts: PodcastSummary[]
}) {
  const [saving, setSaving] = useState(false)
  const [isPublished, setIsPublished] = useState(graph.is_published)
  const [podcasts, setPodcasts] = useState<PodcastSummary[]>(initialPodcasts)

  // Initialize items from existing nodes, sorted by sort_order then position_y
  const [items, setItems] = useState<LinearItem[]>(() => {
    const nodes = [...(graph.nodes ?? [])].sort((a, b) => {
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
      return a.position_y - b.position_y
    })
    return nodes.map((n) => ({
      id: n.id,
      podcastId: n.podcast_id,
      title: n.podcast?.title ?? 'Untitled',
      domain: n.podcast?.domain ?? '',
      thumbnailUrl: n.podcast?.thumbnail_url ?? null,
    }))
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const usedPodcastIds = useMemo(
    () => new Set(items.map((item) => item.podcastId)),
    [items]
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setItems((prev) => {
        const oldIndex = prev.findIndex((i) => i.id === active.id)
        const newIndex = prev.findIndex((i) => i.id === over.id)
        return arrayMove(prev, oldIndex, newIndex)
      })
    }
  }, [])

  const handleAddPodcast = useCallback((podcast: PodcastSummary) => {
    setItems((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        podcastId: podcast.id,
        title: podcast.title,
        domain: podcast.domain,
        thumbnailUrl: podcast.thumbnail_url,
      },
    ])
  }, [])

  const handleRemove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const handlePodcastCreated = useCallback((podcast: PodcastSummary) => {
    setPodcasts((prev) => [podcast, ...prev])
  }, [])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const payload = {
        nodes: items.map((item, index) => ({
          id: item.id,
          podcast_id: item.podcastId,
          position_x: 0,
          position_y: index * 100,
          label: null,
          node_type: 'default' as const,
          sort_order: index,
        })),
        edges: [],
      }

      const res = await fetch(`/api/learning-graphs/${graph.id}/data`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Failed to save')

      const saved = await res.json()

      if (saved.nodes) {
        const sortedNodes = [...saved.nodes].sort(
          (a: LearningGraphNode, b: LearningGraphNode) => a.sort_order - b.sort_order
        )
        setItems(
          sortedNodes.map((n: LearningGraphNode) => ({
            id: n.id,
            podcastId: n.podcast_id,
            title: n.podcast?.title ?? 'Untitled',
            domain: n.podcast?.domain ?? '',
            thumbnailUrl: n.podcast?.thumbnail_url ?? null,
          }))
        )
      }

      toast.success('Path saved!')
    } catch {
      toast.error('Failed to save path')
    } finally {
      setSaving(false)
    }
  }, [items, graph.id])

  const handleTogglePublish = useCallback(async () => {
    const res = await fetch(`/api/learning-graphs/${graph.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published: !isPublished }),
    })
    if (res.ok) {
      setIsPublished(!isPublished)
      toast.success(isPublished ? 'Unpublished' : 'Published!')
    } else {
      toast.error('Failed to update')
    }
  }, [graph.id, isPublished])

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 px-4 py-2 border-b bg-background">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/learning-graphs">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
          <div className="h-5 w-px bg-border" />
          <h2 className="text-sm font-semibold truncate max-w-[200px]">{graph.title}</h2>
          <Badge variant={isPublished ? 'default' : 'secondary'}>
            {isPublished ? 'Published' : 'Draft'}
          </Badge>
          <Badge variant="outline" className="text-[10px]">Linear</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleTogglePublish}>
            {isPublished ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
            {isPublished ? 'Unpublish' : 'Publish'}
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Save
          </Button>
        </div>
      </div>

      {/* List + Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p className="text-sm">Add bulletins from the sidebar to build your linear path.</p>
            </div>
          ) : (
            <div className="max-w-xl mx-auto space-y-2">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={items} strategy={verticalListSortingStrategy}>
                  {items.map((item, index) => (
                    <SortableItem
                      key={item.id}
                      item={item}
                      index={index}
                      onRemove={handleRemove}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          )}
        </div>
        <div className="w-64 border-l bg-card overflow-hidden">
          <GraphPodcastPicker
            podcasts={podcasts}
            usedPodcastIds={usedPodcastIds}
            onAddPodcast={handleAddPodcast}
            onPodcastCreated={handlePodcastCreated}
          />
        </div>
      </div>
    </div>
  )
}
