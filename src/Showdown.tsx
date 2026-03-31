import { METRICS } from './locations'
import { computeShowdown } from './api'
import AnimatedNumber from './AnimatedNumber'
import type { LocationResult, WeatherMetric, TemperatureUnit } from './types'

interface ShowdownProps {
  results: [LocationResult, LocationResult]
  metrics: WeatherMetric[]
  tempUnit: TemperatureUnit
}

export default function Showdown({ results, metrics, tempUnit }: ShowdownProps) {
  const [a, b] = results
  const rows = computeShowdown(a, b, metrics, tempUnit)

  const scoreA = rows.filter(r => r.winner === 'a').length
  const scoreB = rows.filter(r => r.winner === 'b').length

  return (
    <div className="showdown" style={{ marginTop: 32 }}>
      {/* VS Header */}
      <div className="showdown-header">
        <div className="showdown-team">
          <span className="showdown-emoji">{a.location.emoji}</span>
          <span className="showdown-name">{a.location.name}</span>
          <span className={`showdown-score ${scoreA > scoreB ? 'winning' : ''}`}>{scoreA}</span>
        </div>
        <div className="showdown-vs">VS</div>
        <div className="showdown-team">
          <span className={`showdown-score ${scoreB > scoreA ? 'winning' : ''}`}>{scoreB}</span>
          <span className="showdown-name">{b.location.name}</span>
          <span className="showdown-emoji">{b.location.emoji}</span>
        </div>
      </div>

      {/* Metric rows */}
      <div className="showdown-rows">
        {rows.map(row => {
          const info = METRICS.find(m => m.id === row.metric)!
          return (
            <div key={row.metric} className="showdown-row">
              <div className={`showdown-cell left ${row.winner === 'a' ? 'winner' : ''}`}>
                <span className="showdown-value"><AnimatedNumber value={row.summaryA} /></span>
                {row.winner === 'a' && <span className="showdown-crown">{'\u{1F451}'}</span>}
              </div>
              <div className="showdown-metric">
                <span>{info.emoji}</span>
                <span className="showdown-metric-label">{info.label}</span>
              </div>
              <div className={`showdown-cell right ${row.winner === 'b' ? 'winner' : ''}`}>
                {row.winner === 'b' && <span className="showdown-crown">{'\u{1F451}'}</span>}
                <span className="showdown-value"><AnimatedNumber value={row.summaryB} /></span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Verdict */}
      <div className="showdown-verdict">
        {scoreA === scoreB
          ? "It's a tie! Both cities are equally formidable."
          : scoreA > scoreB
            ? `${a.location.emoji} ${a.location.name} takes the crown with ${scoreA} wins!`
            : `${b.location.emoji} ${b.location.name} takes the crown with ${scoreB} wins!`
        }
      </div>
    </div>
  )
}
