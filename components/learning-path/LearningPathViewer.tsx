'use client'

import { useMemo, useState } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  type Edge,
  type Node,
  type NodeTypes,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { NodeDetailModal } from './NodeDetailModal'
import type { LearningGraph, LearningGraphNode, LearningGraphEdge, GraphNodeType } from '@/lib/supabase/types'
import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { cn } from '@/lib/utils'

// Inline read-only node component
type ViewerNodeData = {
  podcastId: string
  title: string
  description: string | null
  domain: string
  thumbnailUrl: string | null
  audioShortUrl: string | null
  audioLongUrl: string | null
  bulletinUrl: string | null
  nodeType: GraphNodeType
}

type ViewerNodeType = Node<ViewerNodeData, 'viewerPodcast'>

const nodeTypeStyles: Record<GraphNodeType, string> = {
  default: 'border-border',
  start: 'border-green-500 ring-1 ring-green-500/20',
  milestone: 'border-yellow-500 ring-1 ring-yellow-500/20',
  end: 'border-red-500 ring-1 ring-red-500/20',
}

const ViewerPodcastNode = memo(function ViewerPodcastNode({ data }: NodeProps<ViewerNodeType>) {
  const nodeType = data.nodeType ?? 'default'

  return (
    <>
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <div
        className={cn(
          'bg-card rounded-lg border-2 shadow-md px-3 py-2 min-w-[160px] max-w-[200px] cursor-pointer hover:shadow-lg transition-shadow',
          nodeTypeStyles[nodeType],
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
            <Badge variant="outline" className="text-[10px] px-1 py-0 mt-1">
              {data.domain}
            </Badge>
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
    </>
  )
})

const viewerNodeTypes: NodeTypes = {
  viewerPodcast: ViewerPodcastNode,
}

function toFlowNodes(dbNodes: LearningGraphNode[]): Node<ViewerNodeData>[] {
  return dbNodes.map((n) => ({
    id: n.id,
    type: 'viewerPodcast',
    position: { x: n.position_x, y: n.position_y },
    draggable: false,
    connectable: false,
    data: {
      podcastId: n.podcast_id,
      title: n.podcast?.title ?? 'Untitled',
      description: n.podcast?.description ?? null,
      domain: n.podcast?.domain ?? '',
      thumbnailUrl: n.podcast?.thumbnail_url ?? null,
      audioShortUrl: n.podcast?.audio_short_url ?? null,
      audioLongUrl: n.podcast?.audio_long_url ?? null,
      bulletinUrl: n.podcast?.bulletin_url ?? null,
      nodeType: n.node_type,
    },
  }))
}

function toFlowEdges(dbEdges: LearningGraphEdge[]): Edge[] {
  return dbEdges.map((e) => ({
    id: e.id,
    source: e.source_node_id,
    target: e.target_node_id,
    label: e.label ?? undefined,
    animated: true,
    style: { stroke: 'var(--primary)', strokeWidth: 2 },
  }))
}

// Topological sort for graph mode mobile fallback
function topologicalSort(nodes: LearningGraphNode[], edges: LearningGraphEdge[]): LearningGraphNode[] {
  const adjacency = new Map<string, string[]>()
  const inDegree = new Map<string, number>()

  nodes.forEach((n) => {
    adjacency.set(n.id, [])
    inDegree.set(n.id, 0)
  })

  edges.forEach((e) => {
    adjacency.get(e.source_node_id)?.push(e.target_node_id)
    inDegree.set(e.target_node_id, (inDegree.get(e.target_node_id) ?? 0) + 1)
  })

  const queue = nodes.filter((n) => (inDegree.get(n.id) ?? 0) === 0)
  const sorted: LearningGraphNode[] = []

  while (queue.length > 0) {
    const node = queue.shift()!
    sorted.push(node)
    for (const neighborId of adjacency.get(node.id) ?? []) {
      const newDeg = (inDegree.get(neighborId) ?? 1) - 1
      inDegree.set(neighborId, newDeg)
      if (newDeg === 0) {
        const neighborNode = nodes.find((n) => n.id === neighborId)
        if (neighborNode) queue.push(neighborNode)
      }
    }
  }

  const sortedIds = new Set(sorted.map((n) => n.id))
  nodes.forEach((n) => {
    if (!sortedIds.has(n.id)) sorted.push(n)
  })

  return sorted
}

// Sort by sort_order for linear mode
function linearSort(nodes: LearningGraphNode[]): LearningGraphNode[] {
  return [...nodes].sort((a, b) => {
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
    return a.position_y - b.position_y
  })
}

function NodeList({
  nodes,
  onNodeClick,
}: {
  nodes: LearningGraphNode[]
  onNodeClick: (node: LearningGraphNode) => void
}) {
  return (
    <div className="space-y-3">
      {nodes.map((node, index) => (
        <Card
          key={node.id}
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onNodeClick(node)}
        >
          <CardContent className="pt-4 flex items-center gap-3">
            <span className="text-lg font-bold text-muted-foreground w-8 shrink-0 text-center">
              {index + 1}
            </span>
            {node.podcast?.thumbnail_url && (
              <img
                src={node.podcast.thumbnail_url}
                alt=""
                className="w-10 h-10 rounded object-cover shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{node.podcast?.title ?? 'Untitled'}</p>
              <Badge variant="outline" className="text-[10px] mt-0.5">
                {node.podcast?.domain}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function LearningPathViewerInner({ graph }: { graph: LearningGraph }) {
  const [selectedPodcast, setSelectedPodcast] = useState<ViewerNodeData | null>(null)

  const isLinear = graph.path_type === 'linear'

  const flowNodes = useMemo(() => toFlowNodes(graph.nodes ?? []), [graph.nodes])
  const flowEdges = useMemo(() => toFlowEdges(graph.edges ?? []), [graph.edges])

  const orderedNodes = useMemo(() => {
    if (isLinear) return linearSort(graph.nodes ?? [])
    return topologicalSort(graph.nodes ?? [], graph.edges ?? [])
  }, [graph.nodes, graph.edges, isLinear])

  const onFlowNodeClick = (_: React.MouseEvent, node: Node) => {
    const data = node.data as ViewerNodeData
    setSelectedPodcast(data)
  }

  const onListNodeClick = (node: LearningGraphNode) => {
    setSelectedPodcast({
      podcastId: node.podcast_id,
      title: node.podcast?.title ?? 'Untitled',
      description: node.podcast?.description ?? null,
      domain: node.podcast?.domain ?? '',
      thumbnailUrl: node.podcast?.thumbnail_url ?? null,
      audioShortUrl: node.podcast?.audio_short_url ?? null,
      audioLongUrl: node.podcast?.audio_long_url ?? null,
      bulletinUrl: node.podcast?.bulletin_url ?? null,
      nodeType: node.node_type,
    })
  }

  return (
    <>
      {isLinear ? (
        // Linear mode: always show ordered list
        <NodeList nodes={orderedNodes} onNodeClick={onListNodeClick} />
      ) : (
        <>
          {/* Graph mode desktop: React Flow canvas */}
          <div className="hidden md:block h-[600px] rounded-lg border overflow-hidden">
            <ReactFlow
              nodes={flowNodes}
              edges={flowEdges}
              nodeTypes={viewerNodeTypes}
              onNodeClick={onFlowNodeClick}
              nodesDraggable={false}
              nodesConnectable={false}
              fitView
              className="bg-background"
            >
              <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
              <Controls showInteractive={false} />
              <MiniMap pannable zoomable className="!bg-card !border" />
            </ReactFlow>
          </div>

          {/* Graph mode mobile: fallback list */}
          <div className="md:hidden">
            <NodeList nodes={orderedNodes} onNodeClick={onListNodeClick} />
          </div>
        </>
      )}

      {/* Detail Modal */}
      {selectedPodcast && (
        <NodeDetailModal
          open={!!selectedPodcast}
          onOpenChange={(open) => { if (!open) setSelectedPodcast(null) }}
          podcast={{
            id: selectedPodcast.podcastId,
            title: selectedPodcast.title,
            description: selectedPodcast.description,
            domain: selectedPodcast.domain,
            thumbnailUrl: selectedPodcast.thumbnailUrl,
            audioShortUrl: selectedPodcast.audioShortUrl,
            audioLongUrl: selectedPodcast.audioLongUrl,
            bulletinUrl: selectedPodcast.bulletinUrl,
          }}
        />
      )}
    </>
  )
}

export function LearningPathViewer({ graph }: { graph: LearningGraph }) {
  return (
    <ReactFlowProvider>
      <LearningPathViewerInner graph={graph} />
    </ReactFlowProvider>
  )
}
