import { LOCATIONS, METRICS } from './locations'
import type { WeatherMetric } from './types'

interface FilterBarProps {
  selectedMetrics: WeatherMetric[]
  selectedLocations: string[]
  startDate: string
  endDate: string
  loading: boolean
  onToggleMetric: (id: WeatherMetric) => void
  onToggleLocation: (id: string) => void
  onStartDate: (date: string) => void
  onEndDate: (date: string) => void
  onGenerate: () => void
}

export default function FilterBar({
  selectedMetrics,
  selectedLocations,
  startDate,
  endDate,
  loading,
  onToggleMetric,
  onToggleLocation,
  onStartDate,
  onEndDate,
  onGenerate,
}: FilterBarProps) {
  const canGenerate = selectedMetrics.length > 0 && selectedLocations.length > 0 && startDate && endDate

  return (
    <div className="panel" style={{ maxWidth: 640, margin: '0 auto' }}>
      <Section label="What weather?">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {METRICS.map(m => (
            <button
              key={m.id}
              className={`pill ${selectedMetrics.includes(m.id) ? 'active' : ''}`}
              onClick={() => onToggleMetric(m.id)}
            >
              <span>{m.emoji}</span> {m.label}
            </button>
          ))}
        </div>
      </Section>

      <Section label="Where?">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {LOCATIONS.map(loc => (
            <button
              key={loc.id}
              className={`pill ${selectedLocations.includes(loc.id) ? 'active' : ''} ${loc.isEasterEgg ? 'pluto' : ''}`}
              onClick={() => onToggleLocation(loc.id)}
            >
              <span>{loc.emoji}</span> {loc.name}
            </button>
          ))}
        </div>
      </Section>

      <Section label="When?">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <input
            type="date"
            className="date-input"
            value={startDate}
            onChange={e => onStartDate(e.target.value)}
          />
          <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>&rarr;</span>
          <input
            type="date"
            className="date-input"
            value={endDate}
            onChange={e => onEndDate(e.target.value)}
          />
        </div>
      </Section>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <button
          className="btn-generate"
          disabled={!canGenerate || loading}
          onClick={onGenerate}
        >
          {loading ? (
            <><div className="spinner" /> Fetching...</>
          ) : (
            'Generate Report'
          )}
        </button>
      </div>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      {children}
    </div>
  )
}
