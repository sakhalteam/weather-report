import type { ClimateProjection, TemperatureUnit } from './types'
import { cToF } from './api'
import AnimatedNumber from './AnimatedNumber'

interface Climate2050Props {
  projections: ClimateProjection[]
  climateTwin: ClimateProjection | null
  tempUnit: TemperatureUnit
}

function displayTemp(c: number, unit: TemperatureUnit): string {
  const v = unit === 'F' ? cToF(c) : c
  return `${v}\u{00B0}${unit}`
}

function displayDelta(c: number, unit: TemperatureUnit): string {
  const v = unit === 'F' ? +(c * 9 / 5).toFixed(1) : c
  const sign = v > 0 ? '+' : ''
  return `${sign}${v}\u{00B0}${unit}`
}

export default function Climate2050({ projections, climateTwin, tempUnit }: Climate2050Props) {
  if (projections.length === 0) return null

  const primary = projections[0]

  return (
    <div className="climate" style={{ marginTop: 32 }}>
      {/* Hero card */}
      <div className="climate-hero">
        <div className="climate-hero-emoji">{primary.location.emoji}</div>
        <h2 className="climate-hero-title">
          {primary.location.name} in 2050
        </h2>
        <p className="climate-hero-subtitle">
          Climate model projection vs 2010-2019 baseline
        </p>

        {/* Delta badges */}
        <div className="climate-deltas">
          <div className={`climate-delta ${primary.deltaMax > 0 ? 'warming' : 'cooling'}`}>
            <div className="climate-delta-value">
              <AnimatedNumber value={displayDelta(primary.deltaMax, tempUnit)} />
            </div>
            <div className="climate-delta-label">Avg High</div>
          </div>
          <div className={`climate-delta ${primary.deltaMin > 0 ? 'warming' : 'cooling'}`}>
            <div className="climate-delta-value">
              <AnimatedNumber value={displayDelta(primary.deltaMin, tempUnit)} />
            </div>
            <div className="climate-delta-label">Avg Low</div>
          </div>
          <div className={`climate-delta ${primary.deltaPrecip > 0 ? 'wetter' : 'drier'}`}>
            <div className="climate-delta-value">
              <AnimatedNumber value={`${primary.deltaPrecip > 0 ? '+' : ''}${primary.deltaPrecip} mm`} />
            </div>
            <div className="climate-delta-label">Avg Daily Rain</div>
          </div>
        </div>
      </div>

      {/* Current vs Future comparison */}
      <div className="climate-compare">
        <div className="climate-compare-header">
          <span>Now vs 2050</span>
        </div>

        {projections.map(proj => (
          <div key={proj.location.id} className="climate-compare-row">
            <div className="climate-compare-name">
              {proj.location.emoji} {proj.location.name}
            </div>
            <div className="climate-compare-cells">
              <div className="climate-compare-cell">
                <div className="climate-compare-cell-label">Current High</div>
                <div className="climate-compare-cell-value">{displayTemp(proj.currentAvg.tempMax, tempUnit)}</div>
              </div>
              <div className="climate-compare-arrow">{'\u{2192}'}</div>
              <div className="climate-compare-cell">
                <div className="climate-compare-cell-label">2050 High</div>
                <div className="climate-compare-cell-value projected">{displayTemp(proj.projectedAvg.tempMax, tempUnit)}</div>
              </div>
              <div className={`climate-compare-badge ${proj.deltaMax > 0 ? 'warming' : 'cooling'}`}>
                {displayDelta(proj.deltaMax, tempUnit)}
              </div>
            </div>
            <div className="climate-compare-cells" style={{ marginTop: 8 }}>
              <div className="climate-compare-cell">
                <div className="climate-compare-cell-label">Current Low</div>
                <div className="climate-compare-cell-value">{displayTemp(proj.currentAvg.tempMin, tempUnit)}</div>
              </div>
              <div className="climate-compare-arrow">{'\u{2192}'}</div>
              <div className="climate-compare-cell">
                <div className="climate-compare-cell-label">2050 Low</div>
                <div className="climate-compare-cell-value projected">{displayTemp(proj.projectedAvg.tempMin, tempUnit)}</div>
              </div>
              <div className={`climate-compare-badge ${proj.deltaMin > 0 ? 'warming' : 'cooling'}`}>
                {displayDelta(proj.deltaMin, tempUnit)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Climate Twin */}
      {climateTwin && !primary.location.isEasterEgg && (
        <div className="climate-twin-card">
          <div className="climate-twin-label">
            {'\u{1F52E}'} Your 2050 weather twin
          </div>
          <div className="climate-twin-reveal">
            <span className="climate-twin-emoji">{climateTwin.location.emoji}</span>
            <span className="climate-twin-name">{climateTwin.location.name}</span>
          </div>
          <p className="climate-twin-blurb">
            By 2050, {primary.location.name}'s temperatures will feel like present-day {climateTwin.location.name} ({displayTemp(climateTwin.currentAvg.tempMax, tempUnit)} highs / {displayTemp(climateTwin.currentAvg.tempMin, tempUnit)} lows today).
          </p>
        </div>
      )}

      {primary.location.isEasterEgg && (
        <div className="pluto-toast" style={{ marginTop: 16 }}>
          Pluto's climate projection: still frozen. Check back in a few billion years.
        </div>
      )}

      {/* Data note */}
      <div className="climate-note">
        Data: MRI-AGCM3-2-S climate model via Open-Meteo. Projections are modeled averages, not forecasts. Actual outcomes depend on future emissions.
      </div>
    </div>
  )
}
