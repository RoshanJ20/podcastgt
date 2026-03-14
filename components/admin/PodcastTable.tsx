/**
 * @module PodcastTable
 *
 * Drag-and-drop sortable table of podcasts/bulletins for the admin dashboard.
 *
 * Key responsibilities:
 * - Renders a table of all bulletins with title, domain, type, and tags
 * - Supports drag-and-drop reordering with persisted sort order
 * - Provides edit and delete actions per row with confirmation dialogs
 * - Navigates to edit page on row click
 */
'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
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
import { useRouter } from 'next/navigation'
import { GripVertical, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import Link from 'next/link'
import type { Podcast } from '@/lib/supabase/types'

function SortableRow({ podcast, onDelete }: { podcast: Podcast; onDelete: (id: string) => void }) {
  const router = useRouter()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: podcast.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleRowClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on buttons, links, or drag handles
    const target = e.target as HTMLElement
    if (target.closest('button, a, [data-drag-handle]')) return
    router.push(`/admin/edit/${podcast.id}`)
  }

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="border-b hover:bg-muted/50 transition-all duration-200 hover:translate-x-0.5 cursor-pointer"
      onClick={handleRowClick}
    >
      <td className="p-3 w-8">
        <button
          {...attributes}
          {...listeners}
          data-drag-handle
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </td>
      <td className="p-3">
        <div className="flex items-center gap-3">
          {podcast.thumbnail_url && (
            <img
              src={podcast.thumbnail_url}
              alt=""
              className="h-10 w-10 rounded object-cover shrink-0"
            />
          )}
          <div>
            <p className="font-medium text-sm">{podcast.title}</p>
            <p className="text-xs text-muted-foreground">{podcast.year}</p>
          </div>
        </div>
      </td>
      <td className="p-3">
        <Badge variant="outline">{podcast.domain}</Badge>
      </td>
      <td className="p-3">
        <div className="flex gap-1 flex-wrap">
          {podcast.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
          ))}
          {podcast.tags.length > 3 && (
            <span className="text-xs text-muted-foreground">+{podcast.tags.length - 3}</span>
          )}
        </div>
      </td>
      <td className="p-3">
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/admin/edit/${podcast.id}`}>
              <Pencil className="h-4 w-4" />
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" />
              }
            >
              <Trash2 className="h-4 w-4" />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete release?</AlertDialogTitle>
                <AlertDialogDescription>
                  &ldquo;{podcast.title}&rdquo; will be permanently removed. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(podcast.id)}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </td>
    </tr>
  )
}

export function PodcastTable({ initialPodcasts }: { initialPodcasts: Podcast[] }) {
  const [podcasts, setPodcasts] = useState(initialPodcasts)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = podcasts.findIndex((podcast) => podcast.id === active.id)
    const newIndex = podcasts.findIndex((podcast) => podcast.id === over.id)
    const reordered = arrayMove(podcasts, oldIndex, newIndex)
    setPodcasts(reordered)

    // Persist new sort_order for affected items
    const updates = reordered.map((podcast, index) => ({ id: podcast.id, sort_order: index }))

    try {
      await Promise.all(
        updates.map(({ id, sort_order }) =>
          fetch(`/api/podcasts/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sort_order }),
          })
        )
      )
    } catch (error) {
      console.error('[PodcastTable] Failed to save order:', error)
      toast.error('Failed to save order')
      setPodcasts(initialPodcasts)
    }
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/podcasts/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setPodcasts((prev) => prev.filter((podcast) => podcast.id !== id))
      toast.success('Release deleted')
    } else {
      toast.error('Failed to delete release')
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-3 w-8" />
              <th className="p-3 text-left font-medium">Title</th>
              <th className="p-3 text-left font-medium">Domain</th>
              <th className="p-3 text-left font-medium">Tags</th>
              <th className="p-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <SortableContext items={podcasts.map((podcast) => podcast.id)} strategy={verticalListSortingStrategy}>
            <tbody>
              {podcasts.map((podcast) => (
                <SortableRow key={podcast.id} podcast={podcast} onDelete={handleDelete} />
              ))}
            </tbody>
          </SortableContext>
        </table>
        {podcasts.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No releases yet. <Link href="/admin/upload" className="underline text-primary">Upload one</Link>.
          </div>
        )}
      </div>
    </DndContext>
  )
}
