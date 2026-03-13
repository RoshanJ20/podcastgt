'use client'

import { useCallback, useMemo, useState } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import dagre from 'dagre'
import { toast } from 'sonner'
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
import { PodcastNode, type PodcastNodeData } from './graph-nodes/PodcastNode'
import { NodeEditModal } from './graph-nodes/NodeEditModal'
import { GraphPodcastPicker } from './GraphPodcastPicker'
import type { LearningGraph, LearningGraphNode, LearningGraphEdge, Podcast, GraphNodeType } from '@/lib/supabase/types'
import { GRAPH_NODE_TYPES } from '@/lib/supabase/types'

type PodcastSummary = Pick<Podcast, 'id' | 'title' | 'thumbnail_url' | 'domain'>

// Extended data stored per-node for edit modal
type ExtendedPodcastNodeData = PodcastNodeData & {
  description?: string | null
  audioShortUrl?: string | null
  audioLongUrl?: string | null
  bulletinUrl?: string | null
}

const nodeTypes: NodeTypes = {
  podcast: PodcastNode,
}

function dbNodesToFlowNodes(dbNodes: LearningGraphNode[]): Node<ExtendedPodcastNodeData>[] {
  return dbNodes.map((n) => ({
    id: n.id,
    type: 'podcast',
    position: { x: n.position_x, y: n.position_y },
    data: {
      podcastId: n.podcast_id,
      title: n.podcast?.title ?? 'Untitled',
      domain: n.podcast?.domain ?? '',
      thumbnailUrl: n.podcast?.thumbnail_url ?? null,
      nodeType: n.node_type,
      description: n.podcast?.description ?? null,
      audioShortUrl: n.podcast?.audio_short_url ?? null,
      audioLongUrl: n.podcast?.audio_long_url ?? null,
      bulletinUrl: n.podcast?.bulletin_url ?? null,
    },
  }))
}

function dbEdgesToFlowEdges(dbEdges: LearningGraphEdge[]): Edge[] {
  return dbEdges.map((e) => ({
    id: e.id,
    source: e.source_node_id,
    target: e.target_node_id,
    label: e.label ?? undefined,
    animated: true,
    style: { stroke: 'var(--primary)', strokeWidth: 2 },
  }))
}

function autoLayout(nodes: Node<ExtendedPodcastNodeData>[], edges: Edge[]): Node<ExtendedPodcastNodeData>[] {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 80 })

  nodes.forEach((node) => {
    g.setNode(node.id, { width: 200, height: 80 })
  })

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target)
  })

  dagre.layout(g)

  return nodes.map((node) => {
    const pos = g.node(node.id)
    return {
      ...node,
      position: { x: pos.x - 100, y: pos.y - 40 },
    }
  })
}

function GraphEditorInner({
  graph,
  initialPodcasts,
}: {
  graph: LearningGraph
  initialPodcasts: PodcastSummary[]
}) {
  const [saving, setSaving] = useState(false)
  const [isPublished, setIsPublished] = useState(graph.is_published)
  const [podcasts, setPodcasts] = useState<PodcastSummary[]>(initialPodcasts)

  // Edit modal state
  const [editModalNode, setEditModalNode] = useState<{
    nodeId: string
    data: ExtendedPodcastNodeData
  } | null>(null)

  const initialNodes = useMemo(
    () => dbNodesToFlowNodes(graph.nodes ?? []),
    [graph.nodes]
  )
  const initialEdges = useMemo(
    () => dbEdgesToFlowEdges(graph.edges ?? []),
    [graph.edges]
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const usedPodcastIds = useMemo(
    () => new Set(nodes.map((n) => (n.data as ExtendedPodcastNodeData).podcastId)),
    [nodes]
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            id: `e-${connection.source}-${connection.target}`,
            animated: true,
            style: { stroke: 'var(--primary)', strokeWidth: 2 },
          },
          eds
        )
      )
    },
    [setEdges]
  )

  const handleAddPodcast = useCallback(
    (podcast: PodcastSummary) => {
      const newNode: Node<ExtendedPodcastNodeData> = {
        id: `temp-${Date.now()}`,
        type: 'podcast',
        position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
        data: {
          podcastId: podcast.id,
          title: podcast.title,
          domain: podcast.domain,
          thumbnailUrl: podcast.thumbnail_url,
          nodeType: 'default',
        },
      }
      setNodes((nds) => [...nds, newNode])
    },
    [setNodes]
  )

  const handlePodcastCreated = useCallback(
    (podcast: PodcastSummary) => {
      setPodcasts((prev) => [podcast, ...prev])
    },
    []
  )

  const handleAutoLayout = useCallback(() => {
    setNodes((nds) => autoLayout(nds as Node<ExtendedPodcastNodeData>[], edges))
  }, [edges, setNodes])

  const handleChangeNodeType = useCallback(
    (nodeId: string, nodeType: GraphNodeType) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, nodeType } as ExtendedPodcastNodeData }
            : n
        )
      )
    },
    [setNodes]
  )

  const handleNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const data = node.data as ExtendedPodcastNodeData
      setEditModalNode({ nodeId: node.id, data })
    },
    []
  )

  const handlePodcastUpdate = useCallback(
    (updated: { id: string; title: string; description: string | null; domain: string; thumbnailUrl: string | null }) => {
      setNodes((nds) =>
        nds.map((n) => {
          const data = n.data as ExtendedPodcastNodeData
          if (data.podcastId === updated.id) {
            return {
              ...n,
              data: {
                ...data,
                title: updated.title,
                description: updated.description,
                domain: updated.domain,
              } as ExtendedPodcastNodeData,
            }
          }
          return n
        })
      )
      setPodcasts((prev) =>
        prev.map((p) =>
          p.id === updated.id
            ? { ...p, title: updated.title, domain: updated.domain as Podcast['domain'] }
            : p
        )
      )
    },
    [setNodes]
  )

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const payload = {
        nodes: nodes.map((n) => {
          const data = n.data as ExtendedPodcastNodeData
          return {
            id: n.id,
            podcast_id: data.podcastId,
            position_x: n.position.x,
            position_y: n.position.y,
            label: null,
            node_type: data.nodeType,
          }
        }),
        edges: edges.map((e) => ({
          id: e.id,
          source_node_id: e.source,
          target_node_id: e.target,
          label: (e.label as string) ?? null,
        })),
      }

      const res = await fetch(`/api/learning-graphs/${graph.id}/data`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Failed to save')

      const saved = await res.json()

      if (saved.nodes) setNodes(dbNodesToFlowNodes(saved.nodes))
      if (saved.edges) setEdges(dbEdgesToFlowEdges(saved.edges))

      toast.success('Graph saved!')
    } catch {
      toast.error('Failed to save graph')
    } finally {
      setSaving(false)
    }
  }, [nodes, edges, graph.id, setNodes, setEdges])

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

  const selectedNode = nodes.find((n) => n.selected)

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
        </div>
        <div className="flex items-center gap-2">
          {selectedNode && (
            <Select
              value={(selectedNode.data as ExtendedPodcastNodeData).nodeType}
              onValueChange={(v) => handleChangeNodeType(selectedNode.id, v as GraphNodeType)}
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
          <Button variant="outline" size="sm" onClick={handleAutoLayout}>
            <Layout className="h-4 w-4 mr-1" />
            Auto Layout
          </Button>
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

      {/* Canvas + Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDoubleClick={handleNodeDoubleClick}
            nodeTypes={nodeTypes}
            fitView
            deleteKeyCode={['Backspace', 'Delete']}
            className="bg-background"
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
            <Controls />
            <MiniMap
              nodeStrokeWidth={3}
              pannable
              zoomable
              className="!bg-card !border"
            />
          </ReactFlow>
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

      {/* Edit Modal */}
      {editModalNode && (
        <NodeEditModal
          open={!!editModalNode}
          onOpenChange={(open) => { if (!open) setEditModalNode(null) }}
          nodeId={editModalNode.nodeId}
          podcast={{
            id: editModalNode.data.podcastId,
            title: editModalNode.data.title,
            description: editModalNode.data.description ?? null,
            domain: editModalNode.data.domain,
            thumbnailUrl: editModalNode.data.thumbnailUrl,
            audioShortUrl: editModalNode.data.audioShortUrl ?? null,
            audioLongUrl: editModalNode.data.audioLongUrl ?? null,
            bulletinUrl: editModalNode.data.bulletinUrl ?? null,
          }}
          nodeType={editModalNode.data.nodeType}
          onNodeTypeChange={(nodeType) => {
            handleChangeNodeType(editModalNode.nodeId, nodeType)
            setEditModalNode((prev) =>
              prev ? { ...prev, data: { ...prev.data, nodeType } } : null
            )
          }}
          onPodcastUpdate={(updated) => {
            handlePodcastUpdate(updated)
            setEditModalNode(null)
          }}
        />
      )}
    </div>
  )
}

export function GraphEditor(props: {
  graph: LearningGraph
  podcasts: PodcastSummary[]
}) {
  return (
    <ReactFlowProvider>
      <GraphEditorInner graph={props.graph} initialPodcasts={props.podcasts} />
    </ReactFlowProvider>
  )
}
