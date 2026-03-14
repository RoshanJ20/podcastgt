/**
 * @module supabase/types
 *
 * Shared TypeScript types and constants for domain entities, content categories,
 * and database record shapes used across the application.
 *
 * Key responsibilities:
 * - Define domain literals and their display metadata.
 * - Define interfaces for all major database entities (Podcast, Transcript, Bookmark, etc.).
 * - Define learning graph types (LearningGraph, LearningGraphNode, LearningGraphEdge).
 */

/** Business domain identifier for categorizing podcasts and learning graphs. */
export type Domain = 'AMG' | 'ARG' | 'QRMG' | 'AITG' | 'LEAP' | 'Independence'

/** Content classification for podcast episodes. */
export type ContentType = 'technical' | 'learning_series'

/** Application-level user role. */
export type UserRole = 'public' | 'admin' | 'superadmin'

/** Ordered list of all domain identifiers. */
export const DOMAINS: Domain[] = ['AMG', 'ARG', 'QRMG', 'AITG', 'LEAP', 'Independence']

/** CSS class mapping for domain-specific color theming. */
export const DOMAIN_COLORS: Record<Domain, string> = {
  AMG: 'domain-amg',
  ARG: 'domain-arg',
  QRMG: 'domain-qrmg',
  AITG: 'domain-aitg',
  LEAP: 'domain-leap',
  Independence: 'domain-independence',
}

/** Content type options with human-readable labels for UI selects. */
export const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: 'technical', label: 'Technical Content' },
  { value: 'learning_series', label: 'Learning Series' },
]

/** A podcast episode record from the database. */
export interface Podcast {
  id: string
  title: string | null
  description: string | null
  domain: Domain | null
  year: number | null
  tags: string[]
  thumbnail_url: string | null
  audio_short_url: string | null
  audio_long_url: string | null
  bulletin_urls: string[]
  content_type: ContentType | null
  sort_order: number
  created_at: string
  updated_at: string
  transcripts?: Transcript[] | null
}

/** Transcript type: short matches audio short, long matches audio long. */
export type TranscriptType = 'short' | 'long'

/** A transcript record linked to a podcast. */
export interface Transcript {
  id: string
  podcast_id: string
  transcript_type: TranscriptType
  full_text: string | null
  segments: TranscriptSegment[] | null
  created_at: string
}

/** A single time-stamped segment within a transcript. */
export interface TranscriptSegment {
  start: number
  end: number
  text: string
}

/** A user bookmark on a specific podcast timestamp. */
export interface Bookmark {
  id: string
  user_id: string
  podcast_id: string
  timestamp_seconds: number
  note: string | null
  created_at: string
  podcast?: Pick<Podcast, 'id' | 'title' | 'thumbnail_url'>
}

/** A user role assignment record. */
export interface UserRoleRecord {
  id: string
  user_id: string
  role: UserRole
  assigned_by: string | null
  created_at: string
  email?: string
}

/** Visual type classification for learning graph nodes. */
export type GraphNodeType = 'default' | 'start' | 'milestone' | 'end'

/** All available graph node types. */
export const GRAPH_NODE_TYPES: GraphNodeType[] = ['default', 'start', 'milestone', 'end']

/** Path layout type for learning graphs. */
export type PathType = 'linear' | 'graph'

/** A learning graph record with optional joined node/edge data. */
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
  node_count?: number
  nodes?: LearningGraphNode[]
  edges?: LearningGraphEdge[]
}

/** A node within a learning graph, optionally joined with its podcast data. */
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
  podcast?: Pick<Podcast, 'id' | 'title' | 'thumbnail_url' | 'domain' | 'description' | 'audio_short_url' | 'audio_long_url' | 'bulletin_urls'>
}

/** A directed edge between two nodes within a learning graph. */
export interface LearningGraphEdge {
  id: string
  graph_id: string
  source_node_id: string
  target_node_id: string
  label: string | null
  created_at: string
}
