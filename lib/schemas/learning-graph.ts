import { z } from 'zod'

export const learningGraphSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  domain: z.string().min(1, 'Domain is required'),
  path_type: z.enum(['linear', 'graph']),
})

export type LearningGraphFormValues = z.infer<typeof learningGraphSchema>

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

export type SaveGraphData = z.infer<typeof saveGraphDataSchema>
