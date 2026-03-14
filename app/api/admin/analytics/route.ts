import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { unauthorizedResponse, forbiddenResponse, internalErrorResponse } from '@/lib/api/error-response'
import { DOMAINS } from '@/lib/supabase/types'

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorizedResponse()

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!roleData || !['admin', 'superadmin'].includes(roleData.role)) {
    return forbiddenResponse()
  }

  const service = await createServiceClient()

  try {
    // Fetch all listen activities
    const { data: allListens, error: listenError } = await service
      .from('user_activity')
      .select('created_at, metadata, episode_id')
      .eq('activity_type', 'listen')

    if (listenError) return internalErrorResponse('fetch listen data', listenError)

    // Fetch podcasts for domain/tag lookups
    const { data: podcasts, error: podcastError } = await service
      .from('podcasts')
      .select('id, domain, tags')

    if (podcastError) return internalErrorResponse('fetch podcast data', podcastError)

    const podcastMap = new Map(podcasts?.map(p => [p.id, p]) ?? [])

    // Fetch episodes with their graph's domain for episode-based listens
    const { data: episodes, error: episodeError } = await service
      .from('episodes')
      .select('id, graph_id, learning_graphs:graph_id(domain)')

    if (episodeError) return internalErrorResponse('fetch episode data', episodeError)

    const episodeDomainMap = new Map<string, string>()
    if (episodes) {
      for (const ep of episodes) {
        const lg = ep.learning_graphs as { domain: string } | null
        if (lg?.domain) episodeDomainMap.set(ep.id, lg.domain)
      }
    }

    // Initialize counters
    const domainCounts: Record<string, number> = {}
    DOMAINS.forEach(d => { domainCounts[d] = 0 })

    const monthlyCounts: Record<string, number> = {}
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthlyCounts[key] = 0
    }

    const topicListenCounts: Record<string, number> = {}

    // Process each listen activity
    if (allListens) {
      for (const listen of allListens) {
        // Monthly aggregation
        const month = listen.created_at.slice(0, 7)
        if (month in monthlyCounts) {
          monthlyCounts[month]++
        }

        const meta = listen.metadata as { podcast_id?: string } | null

        // Podcast/bulletin listen (stored in metadata)
        if (meta?.podcast_id) {
          const podcast = podcastMap.get(meta.podcast_id)
          if (podcast) {
            if (podcast.domain && podcast.domain in domainCounts) {
              domainCounts[podcast.domain]++
            }
            if (podcast.tags && Array.isArray(podcast.tags)) {
              for (const tag of podcast.tags) {
                topicListenCounts[tag] = (topicListenCounts[tag] || 0) + 1
              }
            }
          }
        }
        // Episode listen (has episode_id → learning_graph domain)
        else if (listen.episode_id) {
          const domain = episodeDomainMap.get(listen.episode_id)
          if (domain && domain in domainCounts) {
            domainCounts[domain]++
          }
        }
      }
    }

    // Fallback: if no listen data yet, show content distribution
    const totalListens = Object.values(domainCounts).reduce((a, b) => a + b, 0)
    if (totalListens === 0 && podcasts) {
      for (const p of podcasts) {
        if (p.domain && p.domain in domainCounts) {
          domainCounts[p.domain]++
        }
      }
    }

    // Fallback for topics: if no listen-based topic data, use podcast tag counts
    if (Object.keys(topicListenCounts).length === 0 && podcasts) {
      for (const p of podcasts) {
        if (p.tags && Array.isArray(p.tags)) {
          for (const tag of p.tags) {
            topicListenCounts[tag] = (topicListenCounts[tag] || 0) + 1
          }
        }
      }
    }

    const listensByDomain = Object.entries(domainCounts)
      .map(([domain, count]) => ({ domain, count }))
      .filter(d => d.count > 0)

    const listensByMonth = Object.entries(monthlyCounts)
      .map(([month, count]) => ({ month, count }))

    const listensByTopic = Object.entries(topicListenCounts)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)

    return NextResponse.json({ listensByDomain, listensByMonth, listensByTopic })
  } catch (err) {
    return internalErrorResponse('compute analytics', err)
  }
}
