'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { GraphNodeType } from '@/lib/supabase/types'

export type PodcastNodeData = {
  podcastId: string
  title: string
  domain: string
  thumbnailUrl: string | null
  nodeType: GraphNodeType
}

type PodcastNodeType = Node<PodcastNodeData, 'podcast'>

const nodeTypeStyles: Record<GraphNodeType, string> = {
  default: 'border-border',
  start: 'border-green-500 ring-1 ring-green-500/20',
  milestone: 'border-yellow-500 ring-1 ring-yellow-500/20',
  end: 'border-red-500 ring-1 ring-red-500/20',
}

const nodeTypeLabels: Record<GraphNodeType, string> = {
  default: '',
  start: 'Start',
  milestone: 'Milestone',
  end: 'End',
}

function PodcastNodeComponent({ data, selected }: NodeProps<PodcastNodeType>) {
  const nodeType = data.nodeType ?? 'default'

  const handleStyle = {
    width: 12,
    height: 12,
    background: 'var(--primary)',
    pointerEvents: 'all' as const,
    cursor: 'crosshair',
  }

  return (
    <>
      <Handle type="target" position={Position.Top} id="target-handle" isConnectable style={handleStyle} />
      <div
        className={cn(
          'bg-card rounded-lg border-2 shadow-md px-3 py-2 min-w-[160px] max-w-[200px]',
          nodeTypeStyles[nodeType],
          selected && 'ring-2 ring-primary'
        )}
      >
        <div className="flex items-start gap-2">
          {data.thumbnailUrl && (
            <img
              src={data.thumbnailUrl}
              alt=""
              className="w-8 h-8 rounded object-cover shrink-0 mt-0.5"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium leading-tight line-clamp-2">{data.title}</p>
            <div className="flex items-center gap-1 mt-1">
              <Badge variant="outline" className="text-[10px] px-1 py-0">
                {data.domain}
              </Badge>
              {nodeTypeLabels[nodeType] && (
                <Badge variant="secondary" className="text-[10px] px-1 py-0">
                  {nodeTypeLabels[nodeType]}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} id="source-handle" isConnectable style={handleStyle} />
    </>
  )
}

export const PodcastNode = memo(PodcastNodeComponent)
