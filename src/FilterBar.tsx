import { useState, useRef, useEffect } from 'react'
import { METRICS, searchLocations } from './locations'
import type { Location, WeatherMetric } from './types'

interface FilterBarProps {
  selectedMetrics: WeatherMetric[]
  selectedLocations: string[]
  allLocations: Location[]
  startDate: string
  endDate: string
  loading: boolean
  onToggleMetric: (id: WeatherMetric) => void
  onToggleLocation: (id: string) => void
  onAddLocation: (loc: Location) => void
  onStartDate: (date: string) => void
  onEndDate: (date: string) => void
  onGenerate: () => void
  onReset: () => void
}

export default function FilterBar({
  selectedMetrics,
  selectedLocations,
  allLocations,
  startDate,
  endDate,
  loading,
  onToggleMetric,
  onToggleLocation,
  onAddLocation,
  onStartDate,
  onEndDate,
  onGenerate,
  onReset,
}: FilterBarProps) {
  const canGenerate = selectedMetrics.length > 0 && selectedLocations.length > 0 && startDate && endDate
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

  // Close search dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

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
          {allLocations.map(loc => (
            <button
              key={loc.id}
              className={`pill ${selectedLocations.includes(loc.id) ? 'active' : ''} ${loc.isEasterEgg ? 'pluto' : ''}`}
              onClick={() => onToggleLocation(loc.id)}
            >
              <span>{loc.emoji}</span> {loc.name}
            </button>
          ))}
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

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 24 }}>
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
        {!isDefault && (
          <button className="btn-reset" onClick={onReset}>
            Reset
          </button>
        )}
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
