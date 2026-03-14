/**
 * @module GraphEditorToolbar
 *
 * Toolbar component for the learning-graph editor. Renders navigation,
 * graph title, publish/draft badge, node-type selector for the currently
 * selected node, auto-layout button, publish toggle, and save button.
 */

'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Save, ArrowLeft, Layout, Eye, EyeOff, Loader2 } from 'lucide-react'
import { GRAPH_NODE_TYPES } from '@/lib/supabase/types'
import type { GraphNodeType } from '@/lib/supabase/types'
import type { ExtendedPodcastNodeData } from './graph-utils'
import type { Node } from '@xyflow/react'

export interface GraphEditorToolbarProps {
  graphTitle: string
  isPublished: boolean
  saving: boolean
  selectedNode: Node<ExtendedPodcastNodeData> | undefined
  onAutoLayout: () => void
  onTogglePublish: () => void
  onSave: () => void
  onChangeNodeType: (nodeId: string, nodeType: GraphNodeType) => void
}

export function GraphEditorToolbar({
  graphTitle,
  isPublished,
  saving,
  selectedNode,
  onAutoLayout,
  onTogglePublish,
  onSave,
  onChangeNodeType,
}: GraphEditorToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2 border-b bg-background">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/learning-graphs">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
        </Button>
        <div className="h-5 w-px bg-border" />
        <h2 className="text-sm font-semibold truncate max-w-[200px]">
          {graphTitle}
        </h2>
        <Badge variant={isPublished ? 'default' : 'secondary'}>
          {isPublished ? 'Published' : 'Draft'}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        {selectedNode && (
          <Select
            value={(selectedNode.data as ExtendedPodcastNodeData).nodeType}
            onValueChange={(v) =>
              onChangeNodeType(selectedNode.id, v as GraphNodeType)
            }
          >
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GRAPH_NODE_TYPES.map((t) => (
                <SelectItem key={t} value={t} className="text-xs capitalize">
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button variant="outline" size="sm" onClick={onAutoLayout}>
          <Layout className="h-4 w-4 mr-1" />
          Auto Layout
        </Button>
        <Button variant="outline" size="sm" onClick={onTogglePublish}>
          {isPublished ? (
            <EyeOff className="h-4 w-4 mr-1" />
          ) : (
            <Eye className="h-4 w-4 mr-1" />
          )}
          {isPublished ? 'Unpublish' : 'Publish'}
        </Button>
        <Button size="sm" onClick={onSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-1" />
          )}
          Save
        </Button>
      </div>
    </div>
  )
}
