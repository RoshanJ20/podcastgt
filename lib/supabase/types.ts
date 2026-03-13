export type Domain = 'AMG' | 'ARG' | 'QRMG' | 'AITG' | 'LEAP' | 'Independence'
export type ContentType = 'technical' | 'learning_series'
export type UserRole = 'public' | 'admin' | 'superadmin'

export const DOMAINS: Domain[] = ['AMG', 'ARG', 'QRMG', 'AITG', 'LEAP', 'Independence']

export const DOMAIN_COLORS: Record<Domain, string> = {
  AMG: 'domain-amg',
  ARG: 'domain-arg',
  QRMG: 'domain-qrmg',
  AITG: 'domain-aitg',
  LEAP: 'domain-leap',
  Independence: 'domain-independence',
}
export const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: 'technical', label: 'Technical Content' },
  { value: 'learning_series', label: 'Learning Series' },
]

export interface Podcast {
  id: string
  title: string
  description: string | null
  domain: Domain
  year: number
  tags: string[]
  thumbnail_url: string | null
  audio_short_url: string | null
  audio_long_url: string | null
  bulletin_url: string | null
  content_type: ContentType
  sort_order: number
  created_at: string
  updated_at: string
  // joined
  transcript?: Transcript | null
}

export interface Transcript {
  id: string
  podcast_id: string
  full_text: string | null
  segments: TranscriptSegment[] | null
  created_at: string
}

export interface TranscriptSegment {
  start: number
  end: number
  text: string
}

export interface Bookmark {
  id: string
  user_id: string
  podcast_id: string
  timestamp_seconds: number
  note: string | null
  created_at: string
  // joined
  podcast?: Pick<Podcast, 'id' | 'title' | 'thumbnail_url'>
}

export interface UserRoleRecord {
  id: string
  user_id: string
  role: UserRole
  assigned_by: string | null
  created_at: string
  // joined
  email?: string
}

// Learning Graphs
export type GraphNodeType = 'default' | 'start' | 'milestone' | 'end'
export const GRAPH_NODE_TYPES: GraphNodeType[] = ['default', 'start', 'milestone', 'end']

export type PathType = 'linear' | 'graph'

export interface LearningGraph {
  id: string
  title: string
  description: string | null
  domain: Domain
  path_type: PathType
  is_published: boolean
  thumbnail_url: string | null
  created_at: string
  updated_at: string
  // joined
  node_count?: number
  nodes?: LearningGraphNode[]
  edges?: LearningGraphEdge[]
}

export interface LearningGraphNode {
  id: string
  graph_id: string
  podcast_id: string
  position_x: number
  position_y: number
  label: string | null
  node_type: GraphNodeType
  sort_order: number
  created_at: string
  // joined
  podcast?: Pick<Podcast, 'id' | 'title' | 'thumbnail_url' | 'domain' | 'description' | 'audio_short_url' | 'audio_long_url' | 'bulletin_url'>
}

export interface LearningGraphEdge {
  id: string
  graph_id: string
  source_node_id: string
  target_node_id: string
  label: string | null
  created_at: string
}
