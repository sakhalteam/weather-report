import { useState, useRef, useEffect } from 'react'
import { METRICS, METRIC_CATEGORIES, searchLocations } from './locations'
import { DATE_PRESETS } from './api'
import type { Location, WeatherMetric, AppMode } from './types'

interface FilterBarProps {
  mode: AppMode
  selectedMetrics: WeatherMetric[]
  selectedLocations: string[]
  allLocations: Location[]
  startDate: string
  endDate: string
  yoyYears: number[]
  loading: boolean
  onToggleMetric: (id: WeatherMetric) => void
  onToggleLocation: (id: string) => void
  onAddLocation: (loc: Location) => void
  onStartDate: (date: string) => void
  onEndDate: (date: string) => void
  onToggleYear: (year: number) => void
  onGenerate: () => void
  onReset: () => void
}

const currentYear = new Date().getFullYear()
const AVAILABLE_YEARS = Array.from({ length: 11 }, (_, i) => currentYear - i)

export default function FilterBar({
  mode,
  selectedMetrics,
  selectedLocations,
  allLocations,
  startDate,
  endDate,
  yoyYears,
  loading,
  onToggleMetric,
  onToggleLocation,
  onAddLocation,
  onStartDate,
  onEndDate,
  onToggleYear,
  onGenerate,
  onReset,
}: FilterBarProps) {
  const canGenerate = getCanGenerate(mode, selectedMetrics, selectedLocations, startDate, endDate, yoyYears)
  const today = new Date().toISOString().split('T')[0]
  const isDefault = selectedMetrics.length === 1 && selectedMetrics[0] === 'precipitation_sum'
    && selectedLocations.length === 1 && selectedLocations[0] === 'lynnwood'
    && startDate === today && endDate === today

  // Location search
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Location[]>([])
  const [searching, setSearching] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([])
      return
    }
    setSearching(true)
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(async () => {
      const results = await searchLocations(searchQuery)
      setSearchResults(results)
      setSearching(false)
    }, 400)
    return () => clearTimeout(searchTimeout.current)
  }, [searchQuery])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const locationHint = mode === 'showdown'
    ? 'Pick exactly 2 locations'
    : mode === 'twin' || mode === 'yoy' || mode === 'climate2050'
      ? 'Pick your home location'
      : undefined

  const maxLocations = mode === 'showdown' ? 2 : (mode === 'twin' || mode === 'yoy' || mode === 'climate2050') ? 1 : Infinity
  const hideMetrics = mode === 'airquality' || mode === 'climate2050'
  const atLocationLimit = selectedLocations.length >= maxLocations

  return (
    <div className="panel" style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* Metrics — grouped by category (hidden for AQ and Climate modes) */}
      {!hideMetrics && (
        <Section label="What weather?">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {METRIC_CATEGORIES.map(cat => {
              const catMetrics = METRICS.filter(m => m.category === cat.id)
              return (
                <div key={cat.id}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.7 }}>
                    {cat.emoji} {cat.label}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {catMetrics.map(m => (
                      <button
                        key={m.id}
                        className={`pill ${selectedMetrics.includes(m.id) ? 'active' : ''}`}
                        onClick={() => onToggleMetric(m.id)}
                      >
                        <span>{m.emoji}</span> {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </Section>
      )}
      {mode === 'airquality' && (
        <Section label="What's measured?">
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            US AQI, PM2.5, PM10, Ozone, NO{'\u{2082}'} &mdash; last 7 days of hourly data
          </div>
        </Section>
      )}
      {mode === 'climate2050' && (
        <Section label="What's compared?">
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Temperature &amp; precipitation: 2010-2019 baseline vs 2040-2050 projection (MRI-AGCM3 model)
          </div>
        </Section>
      )}

      {/* Locations */}
      <Section label={`Where?${locationHint ? ` \u2014 ${locationHint}` : ''}`}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {allLocations.map(loc => {
            const isSelected = selectedLocations.includes(loc.id)
            const disabled = !isSelected && atLocationLimit
            return (
              <button
                key={loc.id}
                className={`pill ${isSelected ? 'active' : ''} ${loc.isEasterEgg ? 'pluto' : ''}`}
                onClick={() => !disabled && onToggleLocation(loc.id)}
                style={disabled ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
              >
                <span>{loc.emoji}</span> {loc.name}
              </button>
            )
          })}
          {!atLocationLimit && (
            <div ref={searchRef} style={{ position: 'relative' }}>
              <button
                className={`pill ${showSearch ? 'active' : ''}`}
                onClick={() => setShowSearch(!showSearch)}
                style={{ borderStyle: 'dashed' }}
              >
                + Add City
              </button>
              {showSearch && (
                <div className="search-dropdown">
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search city..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                  {searching && <div className="search-status">Searching...</div>}
                  {!searching && searchResults.length === 0 && searchQuery.length >= 2 && (
                    <div className="search-status">No results</div>
                  )}
                  {searchResults.map(loc => (
                    <button
                      key={loc.id}
                      className="search-result"
                      onClick={() => {
                        onAddLocation(loc)
                        setSearchQuery('')
                        setSearchResults([])
                        setShowSearch(false)
                      }}
                    >
                      {loc.emoji} {loc.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Section>

      {/* Date Range — hidden for AQ (uses past_days) and Climate (fixed decades) */}
      {mode !== 'airquality' && mode !== 'climate2050' && (
      <Section label={mode === 'yoy' ? 'Date range (month/day) & years' : 'When?'}>
        {/* Presets */}
        {mode !== 'yoy' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {DATE_PRESETS.map(preset => (
              <button
                key={preset.label}
                className="pill"
                style={{ fontSize: 12, padding: '5px 12px' }}
                onClick={() => {
                  const { start, end } = preset.getRange()
                  onStartDate(start)
                  onEndDate(end)
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        )}

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

        {/* Year-over-Year: year picker */}
        {mode === 'yoy' && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Compare years
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {AVAILABLE_YEARS.map(year => (
                <button
                  key={year}
                  className={`pill ${yoyYears.includes(year) ? 'active' : ''}`}
                  style={{ fontSize: 13, padding: '5px 12px' }}
                  onClick={() => onToggleYear(year)}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
        )}
      </Section>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 24 }}>
        <button
          className="btn-generate"
          disabled={!canGenerate || loading}
          onClick={onGenerate}
        >
          {loading ? (
            <><div className="spinner" /> Fetching...</>
          ) : mode === 'twin' ? (
            'Find My Twin'
          ) : mode === 'showdown' ? (
            'Start Showdown'
          ) : mode === 'airquality' ? (
            'Check Air Quality'
          ) : mode === 'climate2050' ? (
            'See My 2050'
          ) : (
            'Generate Report'
          )}
        </button>
        {!isDefault && (
          <button className="btn-reset" onClick={onReset}>
            Reset
          </button>
        )}
      </div>
    </div>
  )
}

function getCanGenerate(
  mode: AppMode,
  metrics: WeatherMetric[],
  locations: string[],
  start: string,
  end: string,
  years: number[],
): boolean {
  if (mode === 'airquality') return locations.length > 0
  if (mode === 'climate2050') return locations.length === 1
  if (metrics.length === 0 || !start || !end) return false
  switch (mode) {
    case 'compare': return locations.length > 0
    case 'showdown': return locations.length === 2
    case 'twin': return locations.length === 1
    case 'yoy': return locations.length === 1 && years.length >= 2
    default: return false
  }
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
