/**
 * @module ViewerPodcastNode
 *
 * A read-only React Flow node component that renders a podcast card
 * within the learning path graph viewer. Displays the podcast title,
 * domain badge, optional thumbnail, and completion status indicator.
 * Styled differently based on node type (start, milestone, end, default).
 */

import { memo } from 'react'
import { Handle, Position, type NodeProps, type Node, type NodeTypes } from '@xyflow/react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2 } from 'lucide-react'
import type { GraphNodeType } from '@/lib/supabase/types'
import type { ViewerNodeData } from './graph-utils'

type ViewerNodeType = Node<ViewerNodeData, 'viewerPodcast'>

const nodeTypeStyles: Record<GraphNodeType, string> = {
  default: 'border-border',
  start: 'border-green-500 ring-1 ring-green-500/20',
  milestone: 'border-yellow-500 ring-1 ring-yellow-500/20',
  end: 'border-red-500 ring-1 ring-red-500/20',
}

const ViewerPodcastNode = memo(function ViewerPodcastNode({
  data,
}: NodeProps<ViewerNodeType>) {
  const nodeType = data.nodeType ?? 'default'

  return (
    <>
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <div
        className={cn(
          'bg-card rounded-lg border-2 shadow-md px-3 py-2 min-w-[160px] max-w-[200px] cursor-pointer hover:shadow-lg transition-shadow relative',
          nodeTypeStyles[nodeType],
          data.completed && 'border-green-500/50 bg-green-500/5',
        )}
      >
        {data.completed && (
          <div className="absolute -top-1.5 -right-1.5 bg-green-500 rounded-full p-0.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-white" />
          </div>
        )}
        <div className="flex items-start gap-2">
          {data.thumbnailUrl && (
            <img
              src={data.thumbnailUrl}
              alt=""
              className="w-8 h-8 rounded object-cover shrink-0 mt-0.5"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium leading-tight line-clamp-2">
              {data.title ?? 'Untitled'}
            </p>
            {data.domain && (
            <Badge variant="outline" className="text-[10px] px-1 py-0 mt-1">
              {data.domain}
            </Badge>
            )}
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
    </>
  )
})

/** Pre-configured node type mapping for React Flow's nodeTypes prop. */
export const viewerNodeTypes: NodeTypes = {
  viewerPodcast: ViewerPodcastNode,
}
