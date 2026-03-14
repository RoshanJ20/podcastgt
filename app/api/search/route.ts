/**
 * @module api/search
 *
 * Provides semantic search across podcast transcripts using vector embeddings.
 *
 * Key responsibilities:
 * - Accept a search query and return matching transcript segments with podcast metadata.
 *
 * Dependencies:
 * - Requires OPENAI_API_KEY env var and pgvector embeddings in the transcripts table.
 *
 * TODO(team): Implement vector search once embeddings pipeline is live.
 * Implementation outline:
 * 1. Generate embedding via lib/embeddings.ts
 * 2. Call supabase.rpc('match_transcripts', { query_embedding, match_count: 10 })
 * 3. Join with podcasts table for titles and thumbnails
 * 4. Return results with podcast metadata and matching segment timestamps
 */

import { NextRequest, NextResponse } from 'next/server'
import { validationErrorResponse } from '@/lib/api/error-response'

/**
 * Search podcast transcripts by a text query.
 *
 * Currently returns an empty placeholder response. Will perform vector similarity
 * search once the embeddings pipeline is activated.
 *
 * @param request - Incoming request with required `q` query parameter.
 * @returns JSON object with `results` array and informational `message`.
 * @throws 400 if the `q` query parameter is missing.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const searchQuery = searchParams.get('q')

  if (!searchQuery) {
    return validationErrorResponse('Missing query parameter "q"')
  }

  // Placeholder response until AI search is implemented
  return NextResponse.json({
    results: [],
    message: 'AI search is not yet enabled. Please add OPENAI_API_KEY to activate this feature.',
  })
}
