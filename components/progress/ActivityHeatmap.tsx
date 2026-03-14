'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  dates: string[]
}

function getDateKey(date: Date): string {
  return date.toISOString().split('T')[0]
}

function getDayLabel(dayIndex: number): string {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayIndex]
}

function getMonthLabel(monthIndex: number): string {
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][monthIndex]
}

function getIntensity(count: number): string {
  if (count === 0) return 'bg-muted/50'
  if (count === 1) return 'bg-[#60A5FA]/25'
  if (count <= 3) return 'bg-[#60A5FA]/50'
  if (count <= 6) return 'bg-[#60A5FA]/75'
  return 'bg-[#60A5FA]'
}

export function ActivityHeatmap({ dates }: Props) {
  const { weeks, countByDate, monthLabels, totalDays } = useMemo(() => {
    // Count activities per day
    const counts: Record<string, number> = {}
    dates.forEach((d) => {
      const key = getDateKey(new Date(d))
      counts[key] = (counts[key] ?? 0) + 1
    })

    // Generate last 13 weeks (91 days) of date cells
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const numWeeks = 13
    const totalDays = numWeeks * 7

    // Start from the beginning of the week, 13 weeks ago
    const start = new Date(today)
    start.setDate(today.getDate() - totalDays + 1)
    // Align to Sunday
    start.setDate(start.getDate() - start.getDay())

    const weeksArr: { date: Date; key: string; count: number; future: boolean }[][] = []
    const months: { label: string; weekIndex: number }[] = []
    let lastMonth = -1

    const current = new Date(start)
    let weekIndex = 0

    while (current <= today || weeksArr.length < numWeeks) {
      const week: { date: Date; key: string; count: number; future: boolean }[] = []
      for (let day = 0; day < 7; day++) {
        const d = new Date(current)
        const key = getDateKey(d)
        const isFuture = d > today
        week.push({
          date: d,
          key,
          count: isFuture ? 0 : (counts[key] ?? 0),
          future: isFuture,
        })

        // Track month labels
        if (d.getMonth() !== lastMonth && !isFuture) {
          lastMonth = d.getMonth()
          months.push({ label: getMonthLabel(d.getMonth()), weekIndex })
        }

        current.setDate(current.getDate() + 1)
      }
      weeksArr.push(week)
      weekIndex++

      if (weeksArr.length >= numWeeks + 2) break
    }

    return {
      weeks: weeksArr.slice(0, numWeeks),
      countByDate: counts,
      monthLabels: months,
      totalDays,
    }
  }, [dates])

  const activeDays = Object.values(countByDate ?? {}).filter((c) => c > 0).length
  const maxCount = Math.max(1, ...Object.values(countByDate ?? {}))

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{activeDays} active days in the last 13 weeks</span>
        <div className="flex items-center gap-1">
          <span>Less</span>
          <div className="flex gap-0.5">
            {[0, 1, 3, 6, 10].map((n, i) => (
              <div key={i} className={cn('w-2.5 h-2.5 rounded-sm', getIntensity(n))} />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-0.5 min-w-fit">
          {/* Month labels */}
          <div className="flex gap-0.5 ml-8 mb-1">
            {monthLabels.map((m, i) => (
              <div
                key={`${m.label}-${i}`}
                className="text-[10px] text-muted-foreground"
                style={{
                  position: 'relative',
                  left: `${m.weekIndex * 12}px`,
                }}
              >
                {m.label}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex gap-0.5">
            {/* Day labels */}
            <div className="flex flex-col gap-0.5 mr-1 shrink-0">
              {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => (
                <div key={dayIdx} className="h-2.5 flex items-center">
                  {dayIdx % 2 === 1 ? (
                    <span className="text-[9px] text-muted-foreground w-6 text-right">{getDayLabel(dayIdx)}</span>
                  ) : (
                    <span className="w-6" />
                  )}
                </div>
              ))}
            </div>

            {/* Week columns */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5">
                {week.map((cell) => (
                  <div
                    key={cell.key}
                    title={
                      cell.future
                        ? undefined
                        : `${cell.count} activit${cell.count === 1 ? 'y' : 'ies'} — ${cell.date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}`
                    }
                    className={cn(
                      'w-2.5 h-2.5 rounded-sm transition-colors',
                      cell.future ? 'bg-transparent' : getIntensity(cell.count),
                    )}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
