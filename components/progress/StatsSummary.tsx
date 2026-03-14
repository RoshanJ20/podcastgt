/**
 * @module StatsSummary
 *
 * Displays a grid of key progress statistics as cards: total bulletins
 * completed, fully completed paths, current day streak, and this week's
 * completion count. Each stat has an icon with a colored background.
 */

import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, Flame, Trophy, TrendingUp } from 'lucide-react'

interface StatsSummaryProps {
  totalBulletinsCompleted: number
  fullyCompletedPaths: number
  streak: number
  thisWeekCount: number
}

export function StatsSummary({
  totalBulletinsCompleted,
  fullyCompletedPaths,
  streak,
  thisWeekCount,
}: StatsSummaryProps) {
  const stats = [
    {
      label: 'Bulletins Completed',
      value: totalBulletinsCompleted,
      icon: CheckCircle2,
      colorClass: 'bg-green-500/15 text-green-500',
    },
    {
      label: 'Paths Completed',
      value: fullyCompletedPaths,
      icon: Trophy,
      colorClass: 'bg-[#60A5FA]/15 text-[#60A5FA]',
    },
    {
      label: 'Day Streak',
      value: streak,
      icon: Flame,
      colorClass: 'bg-orange-500/15 text-orange-500',
    },
    {
      label: 'This Week',
      value: thisWeekCount,
      icon: TrendingUp,
      colorClass: 'bg-[#818CF8]/15 text-[#818CF8]',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="glass-card">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold font-[family-name:var(--font-heading)]">
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {stat.label}
                </p>
              </div>
              <div className={`p-2 rounded-lg ${stat.colorClass.split(' ')[0]}`}>
                <stat.icon
                  className={`h-5 w-5 ${stat.colorClass.split(' ')[1]}`}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
