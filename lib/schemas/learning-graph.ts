/**
 * @module schemas/learning-graph
 *
 * Zod validation schemas for learning graph form submissions and data persistence.
 *
 * Key responsibilities:
 * - Define the shape and constraints for creating/editing learning graphs.
 * - Define the shape for bulk-saving graph node and edge data.
 */

import { z } from 'zod'

/** Schema for creating or editing a learning graph's metadata. */
export const learningGraphSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  domain: z.string().min(1, 'Domain is required'),
  path_type: z.enum(['linear', 'graph']),
})

/** TypeScript type inferred from `learningGraphSchema`. */
export type LearningGraphFormValues = z.infer<typeof learningGraphSchema>

/** Schema for the bulk save payload containing arrays of nodes and edges. */
export const saveGraphDataSchema = z.object({
  nodes: z.array(
    z.object({
      id: z.string().optional(),
      podcast_id: z.string(),
      position_x: z.number(),
      position_y: z.number(),
      label: z.string().nullable().optional(),
      node_type: z.enum(['default', 'start', 'milestone', 'end']).default('default'),
      sort_order: z.number().default(0),
    })
  ),
  edges: z.array(
    z.object({
      id: z.string().optional(),
      source_node_id: z.string(),
      target_node_id: z.string(),
      label: z.string().nullable().optional(),
    })
  ),
})

/** TypeScript type inferred from `saveGraphDataSchema`. */
export type SaveGraphData = z.infer<typeof saveGraphDataSchema>
