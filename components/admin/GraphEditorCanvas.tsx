/**
 * @module GraphEditorCanvas
 *
 * Renders the React Flow canvas with background, controls, minimap,
 * the episode sidebar, and the episode-edit modal. This component
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
import { useCallback, useState, useEffect } from 'react'
import { EpisodeNode } from './graph-nodes/EpisodeNode'
import { EpisodeEditModal, type EpisodeData } from './graph-nodes/EpisodeEditModal'
import { EpisodeSidebar } from './EpisodeSidebar'
import type { GraphNodeType } from '@/lib/supabase/types'
import type { EpisodeNodeData } from './graph-utils'

const nodeTypes: NodeTypes = {
  episode: EpisodeNode,
}

type FlowNode = Node<EpisodeNodeData>

export interface GraphEditorCanvasProps {
  nodes: FlowNode[]
  edges: Edge[]
  episodeCount: number
  onNodesChange: OnNodesChange<FlowNode>
  onEdgesChange: OnEdgesChange<Edge>
  onConnect: OnConnect
  onAddEpisode: () => void
  onChangeNodeType: (nodeId: string, nodeType: GraphNodeType) => void
  onEpisodeUpdate: (nodeId: string, updated: EpisodeData) => void
  autoEditNodeId?: string | null
  onAutoEditDone?: () => void
}

export function GraphEditorCanvas({
  nodes,
  edges,
  episodeCount,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onAddEpisode,
  onChangeNodeType,
  onEpisodeUpdate,
  autoEditNodeId,
  onAutoEditDone,
}: GraphEditorCanvasProps) {
  const [editModalNode, setEditModalNode] = useState<{
    nodeId: string
    data: EpisodeNodeData
  } | null>(null)

  useEffect(() => {
    if (!autoEditNodeId) return
    const node = nodes.find((n) => n.id === autoEditNodeId)
    if (node) {
      setEditModalNode({ nodeId: node.id, data: node.data as EpisodeNodeData })
      onAutoEditDone?.()
    }
  }, [autoEditNodeId, nodes, onAutoEditDone])

  const handleNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const data = node.data as EpisodeNodeData
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
          <EpisodeSidebar
            episodeCount={episodeCount}
            onAddEpisode={onAddEpisode}
          />
        </div>
      </div>

      {editModalNode && (
        <EpisodeEditModal
          open={!!editModalNode}
          onOpenChange={(open) => {
            if (!open) setEditModalNode(null)
          }}
          nodeId={editModalNode.nodeId}
          episode={{
            title: editModalNode.data.title,
            description: editModalNode.data.description,
            thumbnailUrl: editModalNode.data.thumbnailUrl,
            audioUrl: editModalNode.data.audioUrl,
            transcript: editModalNode.data.transcript,
            nodeType: editModalNode.data.nodeType,
          }}
          onEpisodeUpdate={(nodeId, updated) => {
            onEpisodeUpdate(nodeId, updated)
            onChangeNodeType(nodeId, updated.nodeType)
            setEditModalNode(null)
          }}
        />
      )}
    </>
  )
}
