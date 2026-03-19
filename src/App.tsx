import { useState, useCallback, useEffect } from 'react'
import FilterBar from './FilterBar'
import Chart from './Chart'
import { LOCATIONS, METRICS } from './locations'
import { fetchWeatherData, computeSummary, toCSV } from './api'
import type { WeatherMetric, LocationResult } from './types'

function parseUrlParams(): {
  metrics?: WeatherMetric[]
  locations?: string[]
  start?: string
  end?: string
} {
  const params = new URLSearchParams(window.location.search)
  const validMetrics = new Set(METRICS.map(m => m.id))
  const validLocations = new Set(LOCATIONS.map(l => l.id))

  const metrics = params.get('metrics')?.split(',').filter(m => validMetrics.has(m as WeatherMetric)) as WeatherMetric[] | undefined
  const locations = params.get('locations')?.split(',').filter(l => validLocations.has(l))
  const start = params.get('start') ?? undefined
  const end = params.get('end') ?? undefined

  return {
    metrics: metrics?.length ? metrics : undefined,
    locations: locations?.length ? locations : undefined,
    start,
    end,
  }
}

function buildShareUrl(metrics: WeatherMetric[], locations: string[], start: string, end: string): string {
  const params = new URLSearchParams({
    metrics: metrics.join(','),
    locations: locations.join(','),
    start,
    end,
  })
  return `${window.location.origin}${window.location.pathname}?${params}`
}

function HomeBtn() {
  return (
    <a href="https://sakhalteam.github.io/" className="home-btn" title="Back to island">
      <svg width="20" height="12" viewBox="0 0 32 18" fill="currentColor" aria-hidden="true">
        <path d="M 4,10 C 5,4 9,2 14,3 C 18,4 20,2 24,4 C 28,6 29,11 26,15 C 22,18 12,18 6,15 C 2,13 2,11 4,10 Z" />
      </svg>
      sakhalteam
    </a>
  )
}

export default function App() {
  const urlParams = parseUrlParams()
  const [selectedMetrics, setSelectedMetrics] = useState<WeatherMetric[]>(urlParams.metrics ?? ['precipitation_sum'])
  const [selectedLocations, setSelectedLocations] = useState<string[]>(urlParams.locations ?? ['lynnwood'])
  const [startDate, setStartDate] = useState(urlParams.start ?? '2025-09-01')
  const [endDate, setEndDate] = useState(urlParams.end ?? '2026-03-15')
  const [results, setResults] = useState<LocationResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeChartMetric, setActiveChartMetric] = useState<WeatherMetric>('precipitation_sum')
  const [copied, setCopied] = useState(false)

  // Sync selections to URL
  useEffect(() => {
    const url = buildShareUrl(selectedMetrics, selectedLocations, startDate, endDate)
    window.history.replaceState(null, '', url)
  }, [selectedMetrics, selectedLocations, startDate, endDate])

  const toggleMetric = useCallback((id: WeatherMetric) => {
    setSelectedMetrics(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }, [])

  const toggleLocation = useCallback((id: string) => {
    setSelectedLocations(prev =>
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    )
  }, [])

  const generate = useCallback(async () => {
    setLoading(true)
    setError(null)
    setResults([])

    try {
      const locations = selectedLocations.map(id => LOCATIONS.find(l => l.id === id)!)
      const fetched = await Promise.all(
        locations.map(async loc => {
          const data = await fetchWeatherData(loc, selectedMetrics, startDate, endDate)
          return { location: loc, daily: data.daily }
        })
      )
      setResults(fetched)
      setActiveChartMetric(selectedMetrics[0])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [selectedMetrics, selectedLocations, startDate, endDate])

  const reset = useCallback(() => {
    setSelectedMetrics(['precipitation_sum'])
    setSelectedLocations(['lynnwood'])
    setStartDate('2025-09-01')
    setEndDate('2026-03-15')
    setResults([])
    setError(null)
  }, [])

  const exportCSV = useCallback(() => {
    const csv = toCSV(results, selectedMetrics)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `weather-report-${startDate}-to-${endDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [results, selectedMetrics, startDate, endDate])

  const hasPluto = results.some(r => r.location.isEasterEgg)

  return (
    <>
      <HomeBtn />

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '60px 16px 40px' }}>
        <header style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text)' }}>
            Weather Report
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-muted)', marginTop: 4 }}>
            Compare weather across locations. Yes, including Pluto.
          </p>
        </header>

        <FilterBar
          selectedMetrics={selectedMetrics}
          selectedLocations={selectedLocations}
          startDate={startDate}
          endDate={endDate}
          loading={loading}
          onToggleMetric={toggleMetric}
          onToggleLocation={toggleLocation}
          onStartDate={setStartDate}
          onEndDate={setEndDate}
          onGenerate={generate}
          onReset={reset}
        />

        {error && (
          <div style={{ textAlign: 'center', marginTop: 24, color: '#e74c3c', fontWeight: 600 }}>
            {error}
          </div>
        )}

        {results.length > 0 && (
          <div style={{ marginTop: 32 }}>
            {/* Summary Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(auto-fill, minmax(160px, 1fr))`,
              gap: 12,
              marginBottom: 24,
            }}>
              {results.map(r => (
                selectedMetrics.map(metric => {
                  const info = METRICS.find(m => m.id === metric)!
                  return (
                    <div
                      key={`${r.location.id}-${metric}`}
                      className={`summary-card ${r.location.isEasterEgg ? 'pluto' : ''}`}
                    >
                      <div className="emoji">{r.location.emoji}</div>
                      <div className="location-name">{r.location.name}</div>
                      <div className="stat">{computeSummary(r.daily, metric)}</div>
                      <div className="label">{info.emoji} {info.summaryLabel}</div>
                    </div>
                  )
                })
              ))}
            </div>

            {hasPluto && (
              <div className="pluto-toast">
                Data from Pluto is simulated. Actual conditions may include nitrogen ice storms and existential dread.
              </div>
            )}

            {/* Chart Metric Selector */}
            {selectedMetrics.length > 1 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 20, marginBottom: 12, flexWrap: 'wrap' }}>
                {selectedMetrics.map(m => {
                  const info = METRICS.find(i => i.id === m)!
                  return (
                    <button
                      key={m}
                      className={`pill ${activeChartMetric === m ? 'active' : ''}`}
                      onClick={() => setActiveChartMetric(m)}
                      style={{ fontSize: 13, padding: '6px 12px' }}
                    >
                      {info.emoji} {info.label}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Chart */}
            <div style={{ marginTop: 12 }}>
              <Chart results={results} metric={activeChartMetric} />
            </div>

            {/* Export & Share */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 24 }}>
              <button className="btn-export" onClick={exportCSV}>
                Export CSV
              </button>
              <button
                className="btn-export"
                onClick={() => {
                  navigator.clipboard.writeText(
                    buildShareUrl(selectedMetrics, selectedLocations, startDate, endDate)
                  )
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}
              >
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
