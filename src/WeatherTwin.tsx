import type { TemperatureUnit, WeatherMetric } from './types'
import type { TwinScore } from './api'
import { METRICS } from './locations'
import { computeSummary } from './api'

interface WeatherTwinProps {
  homeName: string
  homeEmoji: string
  scores: TwinScore[]
  metrics: WeatherMetric[]
  tempUnit: TemperatureUnit
}

export default function WeatherTwin({ homeName, homeEmoji, scores, metrics, tempUnit }: WeatherTwinProps) {
  if (scores.length === 0) return null

  const topMatch = scores[0]

  return (
    <div className="twin" style={{ marginTop: 32 }}>
      {/* Top match highlight */}
      <div className="twin-hero">
        <div className="twin-hero-label">Your weather twin is...</div>
        <div className="twin-hero-match">
          <span className="twin-hero-emoji">{topMatch.location.emoji}</span>
          <span className="twin-hero-name">{topMatch.location.name}</span>
        </div>
        <div className="twin-hero-score">
          <span className="twin-score-number">{topMatch.score}%</span> match with {homeEmoji} {homeName}
        </div>
        {/* Quick stat comparison */}
        <div className="twin-hero-stats">
          {metrics.slice(0, 4).map(m => {
            const info = METRICS.find(i => i.id === m)!
            const val = computeSummary(topMatch.daily, m, tempUnit)
            return (
              <div key={m} className="twin-hero-stat">
                <span>{info.emoji}</span> {val}
              </div>
            )
          })}
        </div>
      </div>

      {/* Full ranking */}
      <div className="twin-ranking">
        <div className="twin-ranking-header">All matches</div>
        {scores.map((s, i) => (
          <div key={s.location.id} className={`twin-row ${i === 0 ? 'top' : ''}`}>
            <div className="twin-row-rank">#{i + 1}</div>
            <div className="twin-row-location">
              <span>{s.location.emoji}</span> {s.location.name}
            </div>
            <div className="twin-row-bar-wrap">
              <div
                className="twin-row-bar"
                style={{ width: `${s.score}%` }}
              />
            </div>
            <div className="twin-row-score">{s.score}%</div>
          </div>
        ))}
      </div>
    </div>
  )
}
