import { useState, useEffect, useRef, useCallback } from 'react'
import type { LocationResult, WeatherMetric, TemperatureUnit, DailyData, ChartType } from './types'
import { computeSummary } from './api'
import { METRICS } from './locations'
import Chart from './Chart'

interface TimelineProps {
  results: LocationResult[]
  metrics: WeatherMetric[]
  tempUnit: TemperatureUnit
  chartType: ChartType
  onToggleChartType: () => void
}

export default function Timeline({ results, metrics, tempUnit, chartType, onToggleChartType }: TimelineProps) {
  const totalDays = (results[0]?.daily.time as string[])?.length ?? 0
  const [windowEnd, setWindowEnd] = useState(totalDays)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1) // 1 = normal, 2 = fast, 0.5 = slow
  const frameRef = useRef<number>(0)
  const lastTickRef = useRef<number>(0)

  // Window size: show last N days (adaptive based on total range)
  const windowSize = Math.max(7, Math.min(30, Math.floor(totalDays / 4)))

  const windowStart = Math.max(0, windowEnd - windowSize)
  const activeMetric = metrics[0]

  // Slice results to current window
  const slicedResults: LocationResult[] = results.map(r => ({
    location: r.location,
    daily: sliceDailyData(r.daily, windowStart, windowEnd),
  }))

  const currentDate = (results[0]?.daily.time as string[])?.[windowEnd - 1] ?? ''
  const startDateLabel = (results[0]?.daily.time as string[])?.[windowStart] ?? ''

  // Playback loop
  const tick = useCallback((timestamp: number) => {
    if (!lastTickRef.current) lastTickRef.current = timestamp
    const elapsed = timestamp - lastTickRef.current

    // Advance every 80ms * speed
    if (elapsed > 80 / speed) {
      lastTickRef.current = timestamp
      setWindowEnd(prev => {
        if (prev >= totalDays) {
          setPlaying(false)
          return prev
        }
        return prev + 1
      })
    }

    frameRef.current = requestAnimationFrame(tick)
  }, [speed, totalDays])

  useEffect(() => {
    if (playing) {
      lastTickRef.current = 0
      frameRef.current = requestAnimationFrame(tick)
    } else {
      cancelAnimationFrame(frameRef.current)
    }
    return () => cancelAnimationFrame(frameRef.current)
  }, [playing, tick])

  // Reset when results change
  useEffect(() => {
    setWindowEnd(windowSize)
    setPlaying(false)
  }, [totalDays, windowSize])

  if (totalDays < 2) return null

  return (
    <div className="timeline" style={{ marginTop: 24 }}>
      {/* Date display */}
      <div className="timeline-date">
        <span>{startDateLabel}</span>
        <span style={{ fontWeight: 800, color: 'var(--accent)' }}>{currentDate}</span>
      </div>

      {/* Summary row for current window */}
      <div className="timeline-summaries">
        {slicedResults.map(r => (
          <div key={r.location.id} className="timeline-summary">
            <span className="timeline-summary-emoji">{r.location.emoji}</span>
            <span className="timeline-summary-name">{r.location.name}</span>
            <span className="timeline-summary-value">
              {computeSummary(r.daily, activeMetric, tempUnit)}
            </span>
          </div>
        ))}
      </div>

      {/* Chart showing windowed data */}
      <Chart
        results={slicedResults}
        metric={activeMetric}
        chartType={chartType}
        tempUnit={tempUnit}
        onToggleChartType={onToggleChartType}
      />

      {/* Controls */}
      <div className="timeline-controls">
        <button
          className="timeline-btn"
          onClick={() => { setWindowEnd(windowSize); setPlaying(false) }}
          title="Reset"
        >
          {'\u{23EE}\u{FE0F}'}
        </button>
        <button
          className="timeline-btn play"
          onClick={() => {
            if (windowEnd >= totalDays) setWindowEnd(windowSize)
            setPlaying(!playing)
          }}
        >
          {playing ? '\u{23F8}\u{FE0F}' : '\u{25B6}\u{FE0F}'}
        </button>
        <input
          type="range"
          className="timeline-scrubber"
          min={windowSize}
          max={totalDays}
          value={windowEnd}
          onChange={e => {
            setWindowEnd(parseInt(e.target.value))
            setPlaying(false)
          }}
        />
        <div className="timeline-speed">
          {[0.5, 1, 2].map(s => (
            <button
              key={s}
              className={`pill ${speed === s ? 'active' : ''}`}
              style={{ fontSize: 11, padding: '3px 8px' }}
              onClick={() => setSpeed(s)}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Metric selector for timeline */}
      {metrics.length > 1 && (
        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          {metrics.map(m => {
            const info = METRICS.find(i => i.id === m)!
            return (
              <span
                key={m}
                className="timeline-metric-tag"
                style={{ opacity: m === activeMetric ? 1 : 0.5, fontSize: 12 }}
              >
                {info.emoji} {info.label}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}

function sliceDailyData(daily: DailyData, start: number, end: number): DailyData {
  const result: DailyData = { time: (daily.time as string[]).slice(start, end) }
  for (const key of Object.keys(daily)) {
    if (key === 'time') continue
    result[key] = (daily[key] as number[]).slice(start, end)
  }
  return result
}
