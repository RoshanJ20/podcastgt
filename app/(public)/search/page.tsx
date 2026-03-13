'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Search, Sparkles, Clock } from 'lucide-react'
import Link from 'next/link'
import { DOMAIN_COLORS, type Domain } from '@/lib/supabase/types'

interface SearchResult {
  podcast_id: string
  podcast_title?: string
  podcast_thumbnail?: string
  domain?: string
  matching_text?: string
  timestamp_seconds?: number
  similarity?: number
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [message, setMessage] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setSearched(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`)
      const data = await res.json()
      setResults(data.results ?? [])
      setMessage(data.message ?? '')
    } catch {
      setMessage('Search failed. Please try again.')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="bg-gradient-to-br from-[#60A5FA] to-[#38BDF8] p-3.5 rounded-2xl shadow-lg glow-primary">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold gradient-text font-[family-name:var(--font-heading)]">Ask the Podcast</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Ask any question and we&apos;ll find the podcasts where that topic was discussed,
          with the exact timestamp.
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="e.g. What were the key audit findings on procurement?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="btn-gradient px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {/* Example queries */}
      {!searched && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Example questions
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              'What is the role of internal audit?',
              'Key findings on public spending',
              'Independence standards explained',
              'Risk management frameworks',
            ].map((q) => (
              <button
                key={q}
                onClick={() => setQuery(q)}
                className="text-sm px-3.5 py-1.5 rounded-full border border-[#60A5FA]/30 hover:bg-[#60A5FA]/10 hover:border-[#60A5FA]/50 text-foreground/80 transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {searched && (
        <div className="space-y-4">
          {message && (
            <div className="text-sm text-muted-foreground bg-[#60A5FA]/10 border border-[#60A5FA]/20 rounded-lg p-4 flex items-start gap-2">
              <Sparkles className="h-4 w-4 mt-0.5 shrink-0 text-[#60A5FA]" />
              <p>{message}</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Found {results.length} result{results.length !== 1 ? 's' : ''}
              </p>
              {results.map((result, i) => (
                <Card key={i} className="glass-card hover:border-[#60A5FA]/20 transition-colors">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      {result.podcast_thumbnail && (
                        <img
                          src={result.podcast_thumbnail}
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {result.domain && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DOMAIN_COLORS[result.domain as Domain] ?? 'bg-primary text-white'}`}>
                              {result.domain}
                            </span>
                          )}
                          {result.timestamp_seconds !== undefined && (
                            <span className="flex items-center gap-1 text-xs text-[#60A5FA] font-medium">
                              <Clock className="h-3 w-3" />
                              {formatTime(result.timestamp_seconds)}
                            </span>
                          )}
                        </div>
                        {result.podcast_title && (
                          <p className="font-medium text-sm">{result.podcast_title}</p>
                        )}
                        {result.matching_text && (
                          <p className="text-xs text-muted-foreground line-clamp-3">
                            &ldquo;{result.matching_text}&rdquo;
                          </p>
                        )}
                      </div>
                      <Link
                        href={`/podcast/${result.podcast_id}${result.timestamp_seconds !== undefined ? `?t=${result.timestamp_seconds}` : ''}`}
                        className="btn-gradient px-4 py-2 rounded-lg text-xs font-medium shrink-0"
                      >
                        Listen
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
