import { useState, useCallback, useEffect, useRef } from 'react'
import html2canvas from 'html2canvas'
import FilterBar from './FilterBar'
import Chart from './Chart'
import Showdown from './Showdown'
import WeatherTwin from './WeatherTwin'
import Timeline from './Timeline'
import AnimatedNumber from './AnimatedNumber'
import { LOCATIONS, TWIN_POOL, METRICS, getPlutoQuip } from './locations'
import { fetchWeatherData, computeSummary, computeTwinScores, toCSV } from './api'
import { playBloop, playWhoosh, playChime, playClick, isMuted, toggleMute } from './sounds'
import type { WeatherMetric, LocationResult, Location, ChartType, TemperatureUnit, AppMode } from './types'
import type { TwinScore } from './api'

const MODE_INFO: { id: AppMode; label: string; emoji: string; description: string }[] = [
  { id: 'compare', label: 'Compare', emoji: '\u{1F4CA}', description: 'Compare weather across locations' },
  { id: 'yoy', label: 'Year over Year', emoji: '\u{1F4C5}', description: 'Same place, different years' },
  { id: 'showdown', label: 'Showdown', emoji: '\u{26A1}', description: 'Head-to-head battle' },
  { id: 'twin', label: 'Weather Twin', emoji: '\u{1F46F}', description: 'Find your weather doppelg\u{00E4}nger' },
]

function parseUrlParams(): {
  metrics?: WeatherMetric[]
  locations?: string[]
  start?: string
  end?: string
  mode?: AppMode
} {
  const params = new URLSearchParams(window.location.search)
  const validMetrics = new Set(METRICS.map(m => m.id))

  const metrics = params.get('metrics')?.split(',').filter(m => validMetrics.has(m as WeatherMetric)) as WeatherMetric[] | undefined
  const locations = params.get('locations')?.split(',')
  const start = params.get('start') ?? undefined
  const end = params.get('end') ?? undefined
  const mode = params.get('mode') as AppMode | undefined

  return {
    metrics: metrics?.length ? metrics : undefined,
    locations: locations?.length ? locations : undefined,
    start,
    end,
    mode: mode && ['compare', 'yoy', 'showdown', 'twin'].includes(mode) ? mode : undefined,
  }
}

function buildShareUrl(mode: AppMode, metrics: WeatherMetric[], locations: string[], start: string, end: string): string {
  const params = new URLSearchParams({
    mode,
    metrics: metrics.join(','),
    locations: locations.join(','),
    start,
    end,
  })
  return `${window.location.origin}${window.location.pathname}?${params}`
}

function getWeatherGradient(metrics: WeatherMetric[]): string {
  if (metrics.length === 0) return ''
  const primary = metrics[0]
  switch (primary) {
    case 'precipitation_sum':
    case 'precipitation_hours': return 'linear-gradient(150deg, #b0c4d8 0%, #d0dde8 50%, #e8eef4 100%)'
    case 'sunshine_duration':
    case 'daylight_duration':
    case 'uv_index_max': return 'linear-gradient(150deg, #f5e6b0 0%, #fef3d0 50%, #fff9e8 100%)'
    case 'temperature_2m_max':
    case 'apparent_temperature_max': return 'linear-gradient(150deg, #f0c8a8 0%, #f8e0cc 50%, #fef0e4 100%)'
    case 'temperature_2m_min':
    case 'apparent_temperature_min': return 'linear-gradient(150deg, #a8c8e8 0%, #c8ddf0 50%, #e4eef8 100%)'
    case 'snowfall_sum': return 'linear-gradient(150deg, #d8e4f0 0%, #e8eff6 50%, #f4f8fc 100%)'
    case 'wind_speed_10m_max':
    case 'wind_gusts_10m_max': return 'linear-gradient(150deg, #c0d8d0 0%, #dce8e4 50%, #eef4f0 100%)'
    default: return ''
  }
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

const TODAY = new Date().toISOString().split('T')[0]

export default function App() {
  const urlParams = parseUrlParams()

  // Core state
  const [mode, setMode] = useState<AppMode>(urlParams.mode ?? 'compare')
  const [selectedMetrics, setSelectedMetrics] = useState<WeatherMetric[]>(urlParams.metrics ?? ['precipitation_sum'])
  const [selectedLocations, setSelectedLocations] = useState<string[]>(urlParams.locations ?? ['lynnwood'])
  const [allLocations, setAllLocations] = useState<Location[]>(LOCATIONS)
  const [startDate, setStartDate] = useState(urlParams.start ?? TODAY)
  const [endDate, setEndDate] = useState(urlParams.end ?? TODAY)
  const [tempUnit, setTempUnit] = useState<TemperatureUnit>('F')

  // Results
  const [results, setResults] = useState<LocationResult[]>([])
  const [twinScores, setTwinScores] = useState<TwinScore[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Chart & UI
  const [activeChartMetric, setActiveChartMetric] = useState<WeatherMetric>('precipitation_sum')
  const [chartType, setChartType] = useState<ChartType>('bar')
  const [copied, setCopied] = useState(false)
  const [soundMuted, setSoundMuted] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [showTimeline, setShowTimeline] = useState(false)

  // YoY state
  const [yoyYears, setYoyYears] = useState<number[]>([new Date().getFullYear(), new Date().getFullYear() - 1])

  const reportRef = useRef<HTMLDivElement>(null)
  const hasAutoGenerated = useRef(false)

  // Sync to URL
  useEffect(() => {
    const url = buildShareUrl(mode, selectedMetrics, selectedLocations, startDate, endDate)
    window.history.replaceState(null, '', url)
  }, [mode, selectedMetrics, selectedLocations, startDate, endDate])

  // Background gradient
  useEffect(() => {
    const gradient = getWeatherGradient(selectedMetrics)
    if (gradient) {
      document.body.style.background = gradient
      document.body.style.transition = 'background 0.8s ease'
    }
    return () => { document.body.style.background = '' }
  }, [selectedMetrics])

  // Clear results when mode changes
  useEffect(() => {
    setResults([])
    setTwinScores([])
    setError(null)
    setShowTimeline(false)
  }, [mode])

  const toggleMetric = useCallback((id: WeatherMetric) => {
    playBloop()
    setSelectedMetrics(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }, [])

  const toggleLocation = useCallback((id: string) => {
    playBloop()
    setSelectedLocations(prev =>
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    )
  }, [])

  const addLocation = useCallback((loc: Location) => {
    playBloop()
    setAllLocations(prev => {
      if (prev.some(l => l.id === loc.id)) return prev
      return [...prev, loc]
    })
    setSelectedLocations(prev => prev.includes(loc.id) ? prev : [...prev, loc.id])
  }, [])

  const toggleYear = useCallback((year: number) => {
    playBloop()
    setYoyYears(prev =>
      prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year].sort((a, b) => a - b)
    )
  }, [])

  // --- Generate logic per mode ---
  const generate = useCallback(async () => {
    playWhoosh()
    setLoading(true)
    setError(null)
    setResults([])
    setTwinScores([])
    setShowTimeline(false)

    try {
      if (mode === 'compare' || mode === 'showdown') {
        const locations = selectedLocations.map(id => allLocations.find(l => l.id === id)!).filter(Boolean)
        const fetched = await Promise.all(
          locations.map(async loc => {
            const data = await fetchWeatherData(loc, selectedMetrics, startDate, endDate)
            return { location: loc, daily: data.daily }
          })
        )
        setResults(fetched)
        setActiveChartMetric(selectedMetrics[0])
      } else if (mode === 'yoy') {
        // Fetch same location for each year
        const loc = allLocations.find(l => l.id === selectedLocations[0])!
        const startMD = startDate.slice(5) // MM-DD
        const endMD = endDate.slice(5) // MM-DD
        const fetched = await Promise.all(
          yoyYears.map(async year => {
            const yearStart = `${year}-${startMD}`
            const yearEnd = `${year}-${endMD}`
            const data = await fetchWeatherData(loc, selectedMetrics, yearStart, yearEnd)
            // Create pseudo-location for each year
            return {
              location: { ...loc, id: `${loc.id}-${year}`, name: `${year}` },
              daily: data.daily,
            }
          })
        )
        setResults(fetched)
        setActiveChartMetric(selectedMetrics[0])
      } else if (mode === 'twin') {
        const homeLoc = allLocations.find(l => l.id === selectedLocations[0])!
        // Fetch home location
        const homeData = await fetchWeatherData(homeLoc, selectedMetrics, startDate, endDate)
        const homeResult: LocationResult = { location: homeLoc, daily: homeData.daily }

        // Fetch all twin pool cities (filter out home if it's in the pool)
        const pool = TWIN_POOL.filter(l => l.id !== homeLoc.id)
        const poolResults = await Promise.all(
          pool.map(async loc => {
            try {
              const data = await fetchWeatherData(loc, selectedMetrics, startDate, endDate)
              return { location: loc, daily: data.daily } as LocationResult
            } catch {
              return null
            }
          })
        )
        const validResults = poolResults.filter((r): r is LocationResult => r !== null)

        setResults([homeResult])
        const scores = computeTwinScores(homeResult, validResults, selectedMetrics)
        setTwinScores(scores)
        setActiveChartMetric(selectedMetrics[0])
      }
      playChime()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [mode, selectedMetrics, selectedLocations, allLocations, startDate, endDate, yoyYears])

  // Auto-generate from URL
  useEffect(() => {
    if (hasAutoGenerated.current) return
    if (urlParams.metrics && urlParams.locations && urlParams.start && urlParams.end) {
      hasAutoGenerated.current = true
      generate()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const reset = useCallback(() => {
    playClick()
    setSelectedMetrics(['precipitation_sum'])
    setSelectedLocations(['lynnwood'])
    setStartDate(TODAY)
    setEndDate(TODAY)
    setResults([])
    setTwinScores([])
    setError(null)
    setShowTimeline(false)
    setYoyYears([new Date().getFullYear(), new Date().getFullYear() - 1])
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

  const exportPNG = useCallback(async () => {
    if (!reportRef.current) return
    setExporting(true)
    try {
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#eef6ff',
        scale: 2,
        logging: false,
        useCORS: true,
      })
      const ctx = canvas.getContext('2d')!
      ctx.font = '14px Nunito, system-ui, sans-serif'
      ctx.fillStyle = 'rgba(100, 140, 180, 0.5)'
      ctx.textAlign = 'right'
      ctx.fillText('sakhalteam.github.io/weather-report', canvas.width - 20, canvas.height - 12)
      const link = document.createElement('a')
      link.download = `weather-report-${startDate}-to-${endDate}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } finally {
      setExporting(false)
    }
  }, [startDate, endDate])

  const hasPluto = results.some(r => r.location.isEasterEgg)
  const hasResults = results.length > 0
  const totalDays = (results[0]?.daily.time as string[])?.length ?? 0
  const canTimeline = hasResults && totalDays > 14 && (mode === 'compare' || mode === 'yoy')

  return (
    <>
      <HomeBtn />

      {/* Sound toggle */}
      <button
        className="sound-toggle"
        onClick={() => { toggleMute(); setSoundMuted(isMuted()) }}
        title={soundMuted ? 'Unmute sounds' : 'Mute sounds'}
      >
        {soundMuted ? '\u{1F507}' : '\u{1F50A}'}
      </button>

      <div className="app-container">
        <header className="app-header">
          <h1 className="app-title">Weather Report</h1>
          <p className="app-subtitle">
            Compare weather across locations. Yes, including Pluto.
          </p>

          {/* F/C toggle */}
          <div className="temp-toggle">
            <button
              className={`pill ${tempUnit === 'C' ? 'active' : ''}`}
              style={{ borderRadius: '999px 0 0 999px', margin: 0, border: 'none' }}
              onClick={() => { setTempUnit('C'); playBloop() }}
            >
              °C
            </button>
            <button
              className={`pill ${tempUnit === 'F' ? 'active' : ''}`}
              style={{ borderRadius: '0 999px 999px 0', margin: 0, border: 'none' }}
              onClick={() => { setTempUnit('F'); playBloop() }}
            >
              °F
            </button>
          </div>
        </header>

        {/* Mode tabs */}
        <div className="mode-tabs">
          {MODE_INFO.map(m => (
            <button
              key={m.id}
              className={`mode-tab ${mode === m.id ? 'active' : ''}`}
              onClick={() => { setMode(m.id); playBloop() }}
            >
              <span className="mode-tab-emoji">{m.emoji}</span>
              <span className="mode-tab-label">{m.label}</span>
            </button>
          ))}
        </div>

        {/* Mode description */}
        <div className="mode-description">
          {MODE_INFO.find(m => m.id === mode)?.description}
        </div>

        <FilterBar
          mode={mode}
          selectedMetrics={selectedMetrics}
          selectedLocations={selectedLocations}
          allLocations={allLocations}
          startDate={startDate}
          endDate={endDate}
          yoyYears={yoyYears}
          loading={loading}
          onToggleMetric={toggleMetric}
          onToggleLocation={toggleLocation}
          onAddLocation={addLocation}
          onStartDate={setStartDate}
          onEndDate={setEndDate}
          onToggleYear={toggleYear}
          onGenerate={generate}
          onReset={reset}
        />

        {error && (
          <div style={{ textAlign: 'center', marginTop: 24, color: '#e74c3c', fontWeight: 600 }}>
            {error}
          </div>
        )}

        {/* Empty state */}
        {!hasResults && !loading && !error && twinScores.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">{'\u{1F326}\u{FE0F}'}</div>
            <div className="empty-text">
              {mode === 'twin' ? 'Pick your home city and hit Find My Twin!'
                : mode === 'showdown' ? 'Pick two cities and start the showdown!'
                : mode === 'yoy' ? 'Pick a city, date range, and years to compare!'
                : 'Pick some weather, choose your locations, and hit Generate!'}
            </div>
            <div className="empty-hint">Pro tip: add Pluto for a reality check on your local weather complaints</div>
          </div>
        )}

        {/* === SHOWDOWN MODE === */}
        {mode === 'showdown' && results.length === 2 && (
          <div ref={reportRef}>
            <Showdown
              results={[results[0], results[1]]}
              metrics={selectedMetrics}
              tempUnit={tempUnit}
            />

            {/* Still show chart for visual comparison */}
            {selectedMetrics.length > 1 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 20, marginBottom: 12, flexWrap: 'wrap' }}>
                {selectedMetrics.map(m => {
                  const info = METRICS.find(i => i.id === m)!
                  return (
                    <button
                      key={m}
                      className={`pill ${activeChartMetric === m ? 'active' : ''}`}
                      onClick={() => { setActiveChartMetric(m); playBloop() }}
                      style={{ fontSize: 13, padding: '6px 12px' }}
                    >
                      {info.emoji} {info.label}
                    </button>
                  )
                })}
              </div>
            )}
            <div style={{ marginTop: 12 }}>
              <Chart
                results={results}
                metric={activeChartMetric}
                chartType={chartType}
                tempUnit={tempUnit}
                onToggleChartType={() => {
                  setChartType(prev => prev === 'bar' ? 'line' : 'bar')
                  playBloop()
                }}
              />
            </div>
          </div>
        )}

        {/* === TWIN MODE === */}
        {mode === 'twin' && twinScores.length > 0 && (
          <div ref={reportRef}>
            <WeatherTwin
              homeName={results[0]?.location.name ?? ''}
              homeEmoji={results[0]?.location.emoji ?? ''}
              scores={twinScores}
              metrics={selectedMetrics}
              tempUnit={tempUnit}
            />
          </div>
        )}

        {/* === COMPARE & YOY MODES === */}
        {(mode === 'compare' || mode === 'yoy') && hasResults && (
          <div ref={reportRef} style={{ marginTop: 32 }}>
            {/* Report title for PNG export context */}
            <div className="report-header">
              <span className="report-title">
                {mode === 'yoy' ? 'Year-over-Year Report' : 'Weather Report'}
              </span>
              <span className="report-dates">{startDate} to {endDate}</span>
            </div>

            {/* Summary Cards */}
            <div className="summary-grid">
              {results.map(r => (
                <div
                  key={r.location.id}
                  className={`summary-card ${r.location.isEasterEgg ? 'pluto' : ''}`}
                >
                  <div className="emoji">{r.location.emoji}</div>
                  <div className="location-name">{r.location.name}</div>
                  <div className="stat-list">
                    {selectedMetrics.map(metric => {
                      const info = METRICS.find(m => m.id === metric)!
                      const summaryText = computeSummary(r.daily, metric, tempUnit)
                      return (
                        <div key={metric} className="stat-row">
                          <span className="stat-value">
                            <AnimatedNumber value={summaryText} />
                          </span>
                          <span className="stat-label">{info.emoji} {info.summaryLabel}</span>
                        </div>
                      )
                    })}
                  </div>
                  {r.location.isEasterEgg && (
                    <div className="pluto-quip">{getPlutoQuip(selectedMetrics[0])}</div>
                  )}
                </div>
              ))}
            </div>

            {hasPluto && (
              <div className="pluto-toast">
                Data from Pluto is simulated. Actual conditions may include nitrogen ice storms and existential dread.
              </div>
            )}

            {/* Timeline toggle */}
            {canTimeline && (
              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <button
                  className={`pill ${showTimeline ? 'active' : ''}`}
                  onClick={() => { setShowTimeline(!showTimeline); playBloop() }}
                >
                  {'\u{23F5}'} {showTimeline ? 'Hide Timeline' : 'Timeline Playback'}
                </button>
              </div>
            )}

            {/* Timeline mode */}
            {showTimeline && canTimeline && (
              <Timeline
                results={results}
                metrics={selectedMetrics}
                tempUnit={tempUnit}
                chartType={chartType}
                onToggleChartType={() => {
                  setChartType(prev => prev === 'bar' ? 'line' : 'bar')
                  playBloop()
                }}
              />
            )}

            {/* Standard chart (hidden when timeline is showing) */}
            {!showTimeline && (
              <>
                {/* Chart Metric Selector */}
                {selectedMetrics.length > 1 && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 20, marginBottom: 12, flexWrap: 'wrap' }}>
                    {selectedMetrics.map(m => {
                      const info = METRICS.find(i => i.id === m)!
                      return (
                        <button
                          key={m}
                          className={`pill ${activeChartMetric === m ? 'active' : ''}`}
                          onClick={() => { setActiveChartMetric(m); playBloop() }}
                          style={{ fontSize: 13, padding: '6px 12px' }}
                        >
                          {info.emoji} {info.label}
                        </button>
                      )
                    })}
                  </div>
                )}

                <div style={{ marginTop: 12 }}>
                  <Chart
                    results={results}
                    metric={activeChartMetric}
                    chartType={chartType}
                    tempUnit={tempUnit}
                    onToggleChartType={() => {
                      setChartType(prev => prev === 'bar' ? 'line' : 'bar')
                      playBloop()
                    }}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* Export & Share buttons */}
        {hasResults && (
          <div className="export-row">
            <button className="btn-export" onClick={exportCSV}>
              Export CSV
            </button>
            <button className="btn-export" onClick={exportPNG} disabled={exporting}>
              {exporting ? 'Exporting...' : 'Export PNG'}
            </button>
            <button
              className="btn-export"
              onClick={() => {
                navigator.clipboard.writeText(
                  buildShareUrl(mode, selectedMetrics, selectedLocations, startDate, endDate)
                )
                setCopied(true)
                playChime()
                setTimeout(() => setCopied(false), 2000)
              }}
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
