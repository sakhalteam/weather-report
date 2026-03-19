import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import type { LocationResult, WeatherMetric } from './types'
import { METRICS } from './locations'
import { aggregateMonthly } from './api'

interface ChartProps {
  results: LocationResult[]
  metric: WeatherMetric
}

const COLORS = [
  '#4db8ff', '#ff7eb3', '#7bed9f', '#ffd54f', '#b388ff', '#ff8a65', '#64ffda',
]

export default function Chart({ results, metric }: ChartProps) {
  const metricInfo = METRICS.find(m => m.id === metric)
  if (!metricInfo || results.length === 0) return null

  // Build monthly data with one key per location
  const locationMonthly = results.map(r => ({
    location: r.location,
    data: aggregateMonthly(r.daily, metric),
  }))

  // Merge into a single array keyed by month
  const months = locationMonthly[0]?.data.map(d => d.month) ?? []
  const chartData = months.map(month => {
    const row: Record<string, string | number> = { month: formatMonth(month) }
    for (const lm of locationMonthly) {
      const entry = lm.data.find(d => d.month === month)
      row[lm.location.name] = entry?.value ?? 0
    }
    return row
  })

  const isCountMetric = metric === 'precipitation_sum' || metric === 'snowfall_sum'

  return (
    <div className="chart-container">
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {metricInfo.emoji} {metricInfo.label} by Month
        {isCountMetric ? ' (days)' : ` (${metricInfo.unit})`}
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
          <XAxis dataKey="month" tick={{ fontSize: 12, fontWeight: 600 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              background: 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(180,210,240,0.4)',
              borderRadius: 12,
              fontFamily: 'Nunito, system-ui',
              fontSize: 13,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 13, fontWeight: 600 }} />
          {results.map((r, i) => (
            <Bar
              key={r.location.id}
              dataKey={r.location.name}
              fill={COLORS[i % COLORS.length]}
              radius={[6, 6, 0, 0]}
              maxBarSize={40}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function formatMonth(yyyymm: string): string {
  const [y, m] = yyyymm.split('-')
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${names[parseInt(m, 10) - 1]} ${y.slice(2)}`
}
