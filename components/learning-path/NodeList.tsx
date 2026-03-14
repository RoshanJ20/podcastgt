/**
 * @module NodeList
 *
 * Renders an ordered list of learning path nodes as clickable cards.
 * Used as the primary view for linear paths and as a mobile fallback
 * for graph-mode paths where the React Flow canvas is not practical.
 * Each card shows a sequence number (or checkmark if completed),
 * thumbnail, title, and domain badge.
 */

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LearningGraphNode } from '@/lib/supabase/types'

interface NodeListProps {
  nodes: LearningGraphNode[]
  completedNodeIds: Set<string>
  onNodeClick: (node: LearningGraphNode) => void
}

export function NodeList({ nodes, completedNodeIds, onNodeClick }: NodeListProps) {
  return (
    <div className="space-y-3">
      {nodes.map((node, index) => {
        const isCompleted = completedNodeIds.has(node.id)
        return (
          <Card
            key={node.id}
            className={cn(
              'cursor-pointer hover:shadow-md transition-shadow',
              isCompleted && 'border-green-500/30 bg-green-500/5',
            )}
            onClick={() => onNodeClick(node)}
          >
            <CardContent className="pt-4 flex items-center gap-3">
              <span
                className={cn(
                  'text-lg font-bold w-8 shrink-0 text-center',
                  isCompleted ? 'text-green-500' : 'text-muted-foreground',
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 mx-auto" />
                ) : (
                  index + 1
                )}
              </span>
              {node.podcast?.thumbnail_url && (
                <img
                  src={node.podcast.thumbnail_url}
                  alt=""
                  className="w-10 h-10 rounded object-cover shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {node.podcast?.title ?? 'Untitled'}
                </p>
                <Badge variant="outline" className="text-[10px] mt-0.5">
                  {node.podcast?.domain}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
