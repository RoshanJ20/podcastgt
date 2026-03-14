/**
 * @module GraphEditorCanvas
 *
 * Renders the React Flow canvas with background, controls, minimap,
 * the podcast picker sidebar, and the node-edit modal. This component
 * is responsible for the visual editing surface of the graph editor.
 */

'use client'

import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Edge,
  type Node,
  type NodeTypes,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  BackgroundVariant,
} from '@xyflow/react'
import { useCallback, useState } from 'react'
import { PodcastNode } from './graph-nodes/PodcastNode'
import { NodeEditModal } from './graph-nodes/NodeEditModal'
import { GraphPodcastPicker } from './GraphPodcastPicker'
import type { GraphNodeType } from '@/lib/supabase/types'
import type { ExtendedPodcastNodeData, PodcastSummary } from './graph-utils'

const nodeTypes: NodeTypes = {
  podcast: PodcastNode,
}

type FlowNode = Node<ExtendedPodcastNodeData>

export interface GraphEditorCanvasProps {
  nodes: FlowNode[]
  edges: Edge[]
  podcasts: PodcastSummary[]
  usedPodcastIds: Set<string>
  onNodesChange: OnNodesChange<FlowNode>
  onEdgesChange: OnEdgesChange<Edge>
  onConnect: OnConnect
  onAddPodcast: (podcast: PodcastSummary) => void
  onPodcastCreated: (podcast: PodcastSummary) => void
  onChangeNodeType: (nodeId: string, nodeType: GraphNodeType) => void
  onPodcastUpdate: (updated: {
    id: string
    title: string
    description: string | null
    domain: string
    thumbnailUrl: string | null
  }) => void
}

export function GraphEditorCanvas({
  nodes,
  edges,
  podcasts,
  usedPodcastIds,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onAddPodcast,
  onPodcastCreated,
  onChangeNodeType,
  onPodcastUpdate,
}: GraphEditorCanvasProps) {
  const [editModalNode, setEditModalNode] = useState<{
    nodeId: string
    data: ExtendedPodcastNodeData
  } | null>(null)

  const handleNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const data = node.data as ExtendedPodcastNodeData
      setEditModalNode({ nodeId: node.id, data })
    },
    []
  )

  return (
    <>
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
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
            />
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
            onAddPodcast={onAddPodcast}
            onPodcastCreated={onPodcastCreated}
          />
        </div>
      </div>

      {editModalNode && (
        <NodeEditModal
          open={!!editModalNode}
          onOpenChange={(open) => {
            if (!open) setEditModalNode(null)
          }}
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
            onChangeNodeType(editModalNode.nodeId, nodeType)
            setEditModalNode((prev) =>
              prev
                ? { ...prev, data: { ...prev.data, nodeType } }
                : null
            )
          }}
          onPodcastUpdate={(updated) => {
            onPodcastUpdate(updated)
            setEditModalNode(null)
          }}
        />
      )}
    </>
  )
}
