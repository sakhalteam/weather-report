import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import type { LocationResult, WeatherMetric, ChartType, TemperatureUnit } from './types'
import { METRICS } from './locations'
import { aggregateMonthly, aggregateDaily, cToF, isTemperatureMetric } from './api'

interface ChartProps {
  results: LocationResult[]
  metric: WeatherMetric
  chartType: ChartType
  tempUnit: TemperatureUnit
  onToggleChartType: () => void
}

const COLORS = [
  '#4db8ff', '#ff7eb3', '#7bed9f', '#ffd54f', '#b388ff', '#ff8a65', '#64ffda',
]

export default function Chart({ results, metric, chartType, tempUnit, onToggleChartType }: ChartProps) {
  const metricInfo = METRICS.find(m => m.id === metric)
  if (!metricInfo || results.length === 0) return null

  const isCountMetric = metric === 'precipitation_sum' || metric === 'snowfall_sum'
  const isTempMetric = isTemperatureMetric(metric)
  const convertVal = (v: number) => isTempMetric && tempUnit === 'F' ? cToF(v) : v
  const displayUnit = isTempMetric ? `\u{00B0}${tempUnit}` : metricInfo.unit

  if (chartType === 'line') {
    const locationWeekly = results.map(r => ({
      location: r.location,
      data: aggregateDaily(r.daily, metric),
    }))

    const dates = locationWeekly[0]?.data.map(d => d.date) ?? []
    const chartData = dates.map((date, i) => {
      const row: Record<string, string | number> = { date: formatDate(date) }
      for (const lw of locationWeekly) {
        row[lw.location.name] = convertVal(lw.data[i]?.value ?? 0)
      }
      return row
    })

    return (
      <div className="chart-container">
        <ChartHeader
          metricInfo={metricInfo}
          displayUnit={displayUnit}
          isCountMetric={isCountMetric}
          chartType={chartType}
          onToggle={onToggleChartType}
          isLine
        />
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fontWeight: 600 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 13, fontWeight: 600 }} />
            {results.map((r, i) => (
              <Line
                key={r.location.id}
                type="monotone"
                dataKey={r.location.name}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // Bar chart (monthly)
  const locationMonthly = results.map(r => ({
    location: r.location,
    data: aggregateMonthly(r.daily, metric),
  }))

  const months = locationMonthly[0]?.data.map(d => d.month) ?? []
  const chartData = months.map(month => {
    const row: Record<string, string | number> = { month: formatMonth(month) }
    for (const lm of locationMonthly) {
      const entry = lm.data.find(d => d.month === month)
      row[lm.location.name] = convertVal(entry?.value ?? 0)
    }
    return row
  })

  return (
    <div className="chart-container">
      <ChartHeader
        metricInfo={metricInfo}
        displayUnit={displayUnit}
        isCountMetric={isCountMetric}
        chartType={chartType}
        onToggle={onToggleChartType}
        isLine={false}
      />
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
          <XAxis dataKey="month" tick={{ fontSize: 12, fontWeight: 600 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip contentStyle={tooltipStyle} />
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

const tooltipStyle = {
  background: 'rgba(255,255,255,0.9)',
  backdropFilter: 'blur(8px)',
  border: '1px solid rgba(180,210,240,0.4)',
  borderRadius: 12,
  fontFamily: 'Nunito, system-ui',
  fontSize: 13,
}

function ChartHeader({ metricInfo, displayUnit, isCountMetric, chartType, onToggle, isLine }: {
  metricInfo: { emoji: string; label: string; unit: string }
  displayUnit: string
  isCountMetric: boolean
  chartType: ChartType
  onToggle: () => void
  isLine: boolean
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {metricInfo.emoji} {metricInfo.label} {isLine ? 'by Week' : 'by Month'}
        {isCountMetric ? ' (days)' : ` (${displayUnit})`}
      </div>
      <button className="btn-chart-toggle" onClick={onToggle}>
        {chartType === 'bar' ? '\u{1F4C8} Line' : '\u{1F4CA} Bar'}
      </button>
    </div>
  )
}

function formatMonth(yyyymm: string): string {
  const [y, m] = yyyymm.split('-')
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${names[parseInt(m, 10) - 1]} ${y.slice(2)}`
}

function formatDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-')
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${names[parseInt(m, 10) - 1]} ${parseInt(d, 10)}`
}
