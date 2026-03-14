'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'

interface DomainData {
  domain: string
  count: number
}

interface MonthData {
  month: string
  count: number
}

interface TopicData {
  topic: string
  count: number
}

interface AnalyticsResponse {
  listensByDomain: DomainData[]
  listensByMonth: MonthData[]
  listensByTopic: TopicData[]
}

const DOMAIN_CHART_COLORS = [
  'hsl(217, 91%, 60%)',
  'hsl(224, 76%, 48%)',
  'hsl(199, 89%, 48%)',
  'hsl(190, 80%, 50%)',
  'hsl(243, 75%, 59%)',
  'hsl(270, 60%, 52%)',
]

function formatMonth(ym: string) {
  const [year, month] = ym.split('-')
  const date = new Date(Number(year), Number(month) - 1)
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

/** Custom SVG donut chart (recharts PieChart is broken with React 19) */
function DonutChart({ data, colors }: { data: DomainData[]; colors: string[] }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const total = data.reduce((sum, d) => sum + d.count, 0)
  if (total === 0) return null

  const cx = 120
  const cy = 110
  const outerR = 90
  const innerR = 55

  const cumulatives = data.reduce<number[]>((acc, d) => {
    acc.push((acc[acc.length - 1] ?? 0) + d.count)
    return acc
  }, [])

  const arcs = data.map((d, i) => {
    const prevCumulative = i === 0 ? 0 : cumulatives[i - 1]
    const startAngle = (prevCumulative / total) * 2 * Math.PI - Math.PI / 2
    const endAngle = (cumulatives[i] / total) * 2 * Math.PI - Math.PI / 2
    const largeArc = d.count / total > 0.5 ? 1 : 0

    const x1o = cx + outerR * Math.cos(startAngle)
    const y1o = cy + outerR * Math.sin(startAngle)
    const x2o = cx + outerR * Math.cos(endAngle)
    const y2o = cy + outerR * Math.sin(endAngle)
    const x1i = cx + innerR * Math.cos(endAngle)
    const y1i = cy + innerR * Math.sin(endAngle)
    const x2i = cx + innerR * Math.cos(startAngle)
    const y2i = cy + innerR * Math.sin(startAngle)

    const path = [
      `M ${x1o} ${y1o}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2o} ${y2o}`,
      `L ${x1i} ${y1i}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x2i} ${y2i}`,
      'Z',
    ].join(' ')

    return { path, color: colors[i % colors.length], domain: d.domain, count: d.count, pct: Math.round((d.count / total) * 100) }
  })

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox="0 0 240 220" className="w-full max-w-[280px]">
        {arcs.map((arc, i) => (
          <path
            key={arc.domain}
            d={arc.path}
            fill={arc.color}
            stroke="hsl(var(--card))"
            strokeWidth={2}
            opacity={hovered === null || hovered === i ? 1 : 0.4}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            className="transition-opacity duration-200 cursor-pointer"
          />
        ))}
        {hovered !== null && (
          <>
            <text x={cx} y={cy - 8} textAnchor="middle" className="fill-foreground text-sm font-semibold">
              {arcs[hovered].count}
            </text>
            <text x={cx} y={cy + 10} textAnchor="middle" className="fill-muted-foreground text-[10px]">
              {arcs[hovered].pct}%
            </text>
          </>
        )}
        {hovered === null && (
          <>
            <text x={cx} y={cy - 8} textAnchor="middle" className="fill-foreground text-lg font-bold">
              {total}
            </text>
            <text x={cx} y={cy + 10} textAnchor="middle" className="fill-muted-foreground text-[10px]">
              total
            </text>
          </>
        )}
      </svg>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs">
        {arcs.map((arc, i) => (
          <div
            key={arc.domain}
            className="flex items-center gap-1.5 cursor-pointer"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="h-2 w-2 rounded-[2px] shrink-0" style={{ backgroundColor: arc.color }} />
            <span className="text-muted-foreground">{arc.domain}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load analytics')
        return res.json()
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const monthConfig: ChartConfig = {
    count: { label: 'Listens', color: 'hsl(217, 91%, 60%)' },
  }

  const topicConfig: ChartConfig = {
    count: { label: 'Releases', color: 'hsl(224, 76%, 48%)' },
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] gradient-text inline-block">
          Analytics
        </h1>
        <p className="text-muted-foreground mt-1">Engagement overview across domains and topics</p>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <Card key={i} className={`glass-card ${i === 3 ? 'lg:col-span-2' : ''}`}>
              <CardHeader>
                <div className="h-5 w-40 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-muted/50 animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {data && !loading && (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {/* Donut Chart — Listens by Domain */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base font-[family-name:var(--font-heading)]">
                Listens by Domain
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.listensByDomain.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                  No data available
                </div>
              ) : (
                <DonutChart data={data.listensByDomain} colors={DOMAIN_CHART_COLORS} />
              )}
            </CardContent>
          </Card>

          {/* Column Bar Chart — Listens Over Month */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base font-[family-name:var(--font-heading)]">
                Listens Over Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.listensByMonth.every((m) => m.count === 0) ? (
                <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                  No data available
                </div>
              ) : (
                <ChartContainer config={monthConfig} className="h-64 w-full">
                  <BarChart data={data.listensByMonth}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      tickFormatter={formatMonth}
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      fontSize={12}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          labelFormatter={(value) => formatMonth(value as string)}
                        />
                      }
                    />
                    <Bar
                      dataKey="count"
                      fill="var(--color-count)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Horizontal Bar Chart — Listens by Topics */}
          <Card className="glass-card lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base font-[family-name:var(--font-heading)]">
                Listens by Topics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.listensByTopic.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                  No data available
                </div>
              ) : (
                <ChartContainer
                  config={topicConfig}
                  className="w-full"
                  style={{ height: Math.max(200, data.listensByTopic.length * 40) }}
                >
                  <BarChart data={data.listensByTopic} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      fontSize={12}
                    />
                    <YAxis
                      type="category"
                      dataKey="topic"
                      tickLine={false}
                      axisLine={false}
                      width={140}
                      fontSize={12}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="count"
                      fill="var(--color-count)"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
