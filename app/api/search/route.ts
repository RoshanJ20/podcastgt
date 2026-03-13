import { NextRequest, NextResponse } from 'next/server'

// TODO: Implement "Ask the Podcast" vector search
// Requires: OPENAI_API_KEY env var + pgvector embeddings populated in transcripts table
//
// Implementation outline (deferred):
// 1. const embedding = await generateEmbedding(query) -- from lib/embeddings.ts
// 2. const { data } = await supabase.rpc('match_transcripts', { query_embedding: embedding, match_count: 10 })
// 3. Join with podcasts table to get titles, thumbnails
// 4. Return results with podcast metadata + matching segment timestamps

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ error: 'Missing query parameter "q"' }, { status: 400 })
  }

  // Placeholder response until AI search is implemented
  return NextResponse.json({
    results: [],
    message: 'AI search is not yet enabled. Please add OPENAI_API_KEY to activate this feature.',
  })
}
