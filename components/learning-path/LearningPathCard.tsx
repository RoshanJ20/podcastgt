import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { GitBranch, List } from 'lucide-react'
import { DOMAIN_COLORS } from '@/lib/supabase/types'
import type { LearningGraph } from '@/lib/supabase/types'

export function LearningPathCard({ graph }: { graph: LearningGraph }) {
  return (
    <Link href={`/learning-path/${graph.id}`}>
      <Card className="group overflow-hidden transition-all duration-300 cursor-pointer h-full glass-card ring-0 hover:border-[#38BDF8]/30 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#38BDF8]/10 pt-0 gap-0">
        <div className="relative aspect-square bg-muted overflow-hidden">
          {graph.thumbnail_url ? (
            <img
              src={graph.thumbnail_url}
              alt={graph.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#38BDF8]/30 to-[#60A5FA]/20">
              <GitBranch className="h-12 w-12 text-white/30" />
            </div>
          )}
          {graph.node_count !== undefined && (
            <div className="absolute bottom-2 right-2 bg-gradient-to-r from-[#60A5FA] to-[#38BDF8] text-white text-xs px-2.5 py-1 rounded-full font-semibold shadow-lg">
              {graph.node_count} bulletins
            </div>
          )}
          <div className="absolute top-2 left-2 flex items-center gap-1.5">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DOMAIN_COLORS[graph.domain]}`}>
              {graph.domain}
            </span>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-black/50 text-white/80 backdrop-blur-sm flex items-center gap-0.5">
              {graph.path_type === 'linear' ? <List className="h-2.5 w-2.5" /> : <GitBranch className="h-2.5 w-2.5" />}
              {graph.path_type === 'linear' ? 'Linear' : 'Graph'}
            </span>
          </div>
        </div>
        <CardContent className="p-3 space-y-1.5">
          <h3 className="font-medium text-sm line-clamp-2 leading-snug">{graph.title}</h3>
          {graph.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{graph.description}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
