import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { getAQILevel, computeAQSummary, aggregateAQDaily } from './api'
import type { AirQualityResult } from './types'
import AnimatedNumber from './AnimatedNumber'

interface AirQualityProps {
  results: AirQualityResult[]
}

const CHART_COLORS = ['#4db8ff', '#ff7eb3', '#7bed9f', '#ffd54f', '#b388ff', '#ff8a65']

export default function AirQuality({ results }: AirQualityProps) {
  if (results.length === 0) return null

  return (
    <div className="aq" style={{ marginTop: 32 }}>
      {/* AQI Summary Cards */}
      <div className="aq-grid">
        {results.map(r => {
          const summary = computeAQSummary(r.hourly)
          const level = getAQILevel(summary.avgAQI)

          return (
            <div key={r.location.id} className="aq-card">
              <div className="aq-card-header">
                <span style={{ fontSize: 24 }}>{r.location.emoji}</span>
                <span className="aq-card-name">{r.location.name}</span>
              </div>

              {/* Big AQI badge */}
              <div
                className="aq-badge"
                style={{ background: level.bg, color: level.color }}
              >
                <div className="aq-badge-number">
                  <AnimatedNumber value={String(summary.avgAQI)} />
                </div>
                <div className="aq-badge-label">{level.label}</div>
              </div>

              {/* Detail stats */}
              <div className="aq-stats">
                <div className="aq-stat">
                  <span className="aq-stat-value">{summary.maxAQI}</span>
                  <span className="aq-stat-label">Peak AQI</span>
                </div>
                <div className="aq-stat">
                  <span className="aq-stat-value">{summary.avgPM25}</span>
                  <span className="aq-stat-label">Avg PM2.5</span>
                </div>
                <div className="aq-stat">
                  <span className="aq-stat-value">{summary.avgOzone}</span>
                  <span className="aq-stat-label">Avg Ozone</span>
                </div>
              </div>

              {r.location.isEasterEgg && (
                <div className="pluto-quip" style={{ marginTop: 8 }}>
                  Air quality on Pluto is excellent. There's almost no air.
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* AQI over time chart */}
      <div className="chart-container" style={{ marginTop: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
          {'\u{1F32C}\u{FE0F}'} US AQI by Day
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fontWeight: 600 }}
              interval="preserveStartEnd"
              allowDuplicatedCategory={false}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 13, fontWeight: 600 }} />
            {results.map((r, i) => {
              const data = aggregateAQDaily(r.hourly, 'us_aqi')
              return (
                <Line
                  key={r.location.id}
                  data={data}
                  type="monotone"
                  dataKey="value"
                  name={r.location.name}
                  stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              )
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* PM2.5 chart */}
      <div className="chart-container" style={{ marginTop: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
          {'\u{1F4A8}'} PM2.5 by Day ({'\u{00B5}'}g/m{'\u{00B3}'})
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fontWeight: 600 }}
              interval="preserveStartEnd"
              allowDuplicatedCategory={false}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 13, fontWeight: 600 }} />
            {results.map((r, i) => {
              const data = aggregateAQDaily(r.hourly, 'pm2_5')
              return (
                <Line
                  key={r.location.id}
                  data={data}
                  type="monotone"
                  dataKey="value"
                  name={r.location.name}
                  stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                />
              )
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* AQI scale legend */}
      <div className="aq-legend">
        {[
          { max: 50, label: 'Good' },
          { max: 100, label: 'Moderate' },
          { max: 150, label: 'Sensitive' },
          { max: 200, label: 'Unhealthy' },
          { max: 300, label: 'Very Unhealthy' },
          { max: 500, label: 'Hazardous' },
        ].map(band => {
          const level = getAQILevel(band.max)
          return (
            <div key={band.label} className="aq-legend-item">
              <div className="aq-legend-swatch" style={{ background: level.bg, border: `1px solid ${level.color}` }} />
              <span style={{ fontSize: 11, color: level.color, fontWeight: 600 }}>{band.label}</span>
            </div>
          )
        })}
      </div>
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
