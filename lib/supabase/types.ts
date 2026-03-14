/**
 * @module supabase/types
 *
 * Shared TypeScript types and constants for domain entities, content categories,
 * and database record shapes used across the application.
 *
 * Key responsibilities:
 * - Define domain literals and their display metadata.
 * - Define interfaces for all major database entities (Podcast, Transcript, Bookmark, etc.).
 * - Define learning graph types (LearningGraph, Episode, LearningPathEdge).
 */

/** Business domain identifier for categorizing podcasts and learning graphs. */
export type Domain =
  | 'Audit Methodology'
  | 'Accounting and Reporting'
  | 'Audit Technology'
  | 'Quality and Risk'
  | 'LEAP'
  | 'Auditing'

/** Application-level user role. */
export type UserRole = 'public' | 'admin' | 'superadmin'

/** Domains available for technical releases. */
export const TECHNICAL_DOMAINS: Domain[] = [
  'Audit Methodology',
  'Accounting and Reporting',
  'Audit Technology',
  'Quality and Risk',
  'LEAP',
]

/** Domains available for learning series. */
export const LEARNING_SERIES_DOMAINS: Domain[] = [
  'Auditing',
  'Accounting and Reporting',
]

/** All unique domain identifiers (union of both categories). */
export const DOMAINS: Domain[] = [
  'Audit Methodology',
  'Accounting and Reporting',
  'Audit Technology',
  'Quality and Risk',
  'LEAP',
  'Auditing',
]

/** CSS class mapping for domain-specific color theming. */
export const DOMAIN_COLORS: Record<Domain, string> = {
  'Audit Methodology': 'domain-audit-methodology',
  'Accounting and Reporting': 'domain-accounting-reporting',
  'Audit Technology': 'domain-audit-technology',
  'Quality and Risk': 'domain-quality-risk',
  'LEAP': 'domain-leap',
  'Auditing': 'domain-auditing',
}

/** A podcast episode record from the database. */
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
  sort_order: number
  created_at: string
  updated_at: string
  transcript?: Transcript | null
}

/** A transcript record linked to a podcast. */
export interface Transcript {
  id: string
  podcast_id: string
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

/** A learning graph record with optional joined episode/edge data. */
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
  episode_count?: number
  episodes?: Episode[]
  edges?: LearningPathEdge[]
}

/** Transcript data stored inline on an episode. */
export interface EpisodeTranscript {
  full_text: string | null
  segments: TranscriptSegment[] | null
}

/** An episode within a learning path, carrying both content and layout info. */
export interface Episode {
  id: string
  graph_id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  audio_url: string | null
  transcript: EpisodeTranscript | null
  sort_order: number
  position_x: number
  position_y: number
  node_type: GraphNodeType
  label: string | null
  created_at: string
  updated_at: string
}

/** A directed edge between two episodes within a learning path. */
export interface LearningPathEdge {
  id: string
  graph_id: string
  source_episode_id: string
  target_episode_id: string
  label: string | null
  created_at: string
}
