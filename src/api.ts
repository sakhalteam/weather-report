import type { Location, WeatherMetric, DailyData, TemperatureUnit, LocationResult, AirQualityHourly, AirQualityResult, ClimateProjection } from './types'

export function cToF(c: number): number {
  return +(c * 9 / 5 + 32).toFixed(1)
}

export function isTemperatureMetric(metric: WeatherMetric): boolean {
  return metric === 'temperature_2m_max' || metric === 'temperature_2m_min'
    || metric === 'apparent_temperature_max' || metric === 'apparent_temperature_min'
}

const BASE_URL = 'https://archive-api.open-meteo.com/v1/archive'

export async function fetchWeatherData(
  location: Location,
  metrics: WeatherMetric[],
  startDate: string,
  endDate: string,
): Promise<{ daily: DailyData }> {
  if (location.isEasterEgg) {
    return generatePlutoData(metrics, startDate, endDate)
  }

  // Clamp end date to 5 days ago to avoid archive API gaps
  const fiveDaysAgo = new Date()
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5)
  const clampedEnd = endDate > fiveDaysAgo.toISOString().split('T')[0]
    ? fiveDaysAgo.toISOString().split('T')[0]
    : endDate

  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    start_date: startDate,
    end_date: clampedEnd,
    daily: metrics.join(','),
    timezone: 'auto',
  })

  const res = await fetch(`${BASE_URL}?${params}`)
  const data = await res.json()
  if (!res.ok) {
    const reason = data?.reason ?? `HTTP ${res.status}`
    throw new Error(`${location.name}: ${reason}`)
  }
  return { daily: data.daily }
}

function generatePlutoData(
  metrics: WeatherMetric[],
  startDate: string,
  endDate: string,
): { daily: DailyData } {
  const days: string[] = []
  const current = new Date(startDate)
  const end = new Date(endDate)

  while (current <= end) {
    days.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 1)
  }

  const daily: DailyData = { time: days }

  for (const metric of metrics) {
    daily[metric] = days.map(() => {
      switch (metric) {
        case 'temperature_2m_max': return -218 + (Math.random() * 6 - 3)
        case 'temperature_2m_min': return -233 + (Math.random() * 6 - 3)
        case 'apparent_temperature_max': return -225 + (Math.random() * 6 - 3)
        case 'apparent_temperature_min': return -240 + (Math.random() * 6 - 3)
        case 'precipitation_sum': return 0
        case 'snowfall_sum': return Math.random() < 0.05 ? +(Math.random() * 0.3).toFixed(2) : 0
        case 'sunshine_duration': return +(Math.random() * 120).toFixed(0)
        case 'daylight_duration': return +(23040 + Math.random() * 3600).toFixed(0) // ~6.4 hrs in seconds
        case 'uv_index_max': return +(Math.random() * 0.1).toFixed(2)
        case 'wind_speed_10m_max': return +(Math.random() * 1.5).toFixed(1)
        case 'wind_gusts_10m_max': return +(Math.random() * 2.0).toFixed(1)
        case 'precipitation_hours': return 0
        default: return 0
      }
    })
  }

  return { daily }
}

// --- Aggregation ---

export function aggregateMonthly(
  daily: DailyData,
  metric: WeatherMetric,
): { month: string; value: number }[] {
  const times = daily.time as string[]
  const values = (daily[metric] as number[]) ?? []
  const buckets = new Map<string, number[]>()

  for (let i = 0; i < times.length; i++) {
    const month = times[i].slice(0, 7)
    if (!buckets.has(month)) buckets.set(month, [])
    buckets.get(month)!.push(values[i] ?? 0)
  }

  return Array.from(buckets.entries()).map(([month, vals]) => ({
    month,
    value: aggregateValues(vals, metric),
  }))
}

export function aggregateDaily(
  daily: DailyData,
  metric: WeatherMetric,
): { date: string; value: number }[] {
  const times = daily.time as string[]
  const values = (daily[metric] as number[]) ?? []
  const result: { date: string; value: number }[] = []
  for (let i = 0; i < times.length; i += 7) {
    const weekSlice = values.slice(i, i + 7)
    result.push({ date: times[i], value: aggregateValues(weekSlice, metric) })
  }
  return result
}

function aggregateValues(vals: number[], metric: WeatherMetric): number {
  if (vals.length === 0) return 0
  const isCountMetric = metric === 'precipitation_sum' || metric === 'snowfall_sum'
  const isSumMetric = metric === 'sunshine_duration' || metric === 'daylight_duration' || metric === 'precipitation_hours'

  if (isCountMetric) {
    return vals.filter(v => v > 0).length
  } else if (isSumMetric) {
    return Math.round(vals.reduce((a, b) => a + b, 0) / 3600)
  } else {
    return +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
  }
}

// --- Summary ---

export function computeSummary(
  daily: DailyData,
  metric: WeatherMetric,
  tempUnit: TemperatureUnit = 'C',
): string {
  const values = (daily[metric] as number[]) ?? []
  if (values.length === 0) return 'No data'

  switch (metric) {
    case 'precipitation_sum': {
      const rainyDays = values.filter(v => v > 0).length
      return `${rainyDays} / ${values.length} days`
    }
    case 'snowfall_sum': {
      const snowDays = values.filter(v => v > 0).length
      return `${snowDays} / ${values.length} days`
    }
    case 'sunshine_duration': {
      const totalHrs = Math.round(values.reduce((a, b) => a + b, 0) / 3600)
      return `${totalHrs} hrs total`
    }
    case 'daylight_duration': {
      const avgHrs = (values.reduce((a, b) => a + b, 0) / values.length / 3600).toFixed(1)
      return `${avgHrs} hrs/day avg`
    }
    case 'precipitation_hours': {
      const total = Math.round(values.reduce((a, b) => a + b, 0))
      return `${total} hrs total`
    }
    case 'uv_index_max': {
      const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)
      return `${avg} avg`
    }
    case 'temperature_2m_max':
    case 'temperature_2m_min':
    case 'apparent_temperature_max':
    case 'apparent_temperature_min': {
      const avgC = values.reduce((a, b) => a + b, 0) / values.length
      const avg = tempUnit === 'F' ? cToF(avgC) : +avgC.toFixed(1)
      return `${avg}\u{00B0}${tempUnit} avg`
    }
    case 'wind_speed_10m_max':
    case 'wind_gusts_10m_max': {
      const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)
      return `${avg} km/h avg`
    }
    default:
      return ''
  }
}

// --- Numeric summary for comparisons ---

export function computeNumericSummary(
  daily: DailyData,
  metric: WeatherMetric,
): number {
  const values = (daily[metric] as number[]) ?? []
  if (values.length === 0) return 0

  switch (metric) {
    case 'precipitation_sum':
    case 'snowfall_sum':
      return values.filter(v => v > 0).length
    case 'sunshine_duration':
    case 'daylight_duration':
      return Math.round(values.reduce((a, b) => a + b, 0) / 3600)
    case 'precipitation_hours':
      return Math.round(values.reduce((a, b) => a + b, 0))
    default:
      return +(values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)
  }
}

// --- Weather Twin scoring ---

export interface TwinScore {
  location: Location
  score: number // 0-100, higher = more similar
  daily: DailyData
}

export function computeTwinScores(
  homeResult: LocationResult,
  comparisonResults: LocationResult[],
  metrics: WeatherMetric[],
): TwinScore[] {
  // For each metric, compute the home value and the range across all results
  const homeValues: number[] = metrics.map(m => computeNumericSummary(homeResult.daily, m))

  // Find min/max across home + all comparisons for normalization
  const allValues = [homeResult, ...comparisonResults]
  const ranges = metrics.map((m, i) => {
    const vals = allValues.map(r => computeNumericSummary(r.daily, m))
    const min = Math.min(...vals)
    const max = Math.max(...vals)
    return { min, max, range: max - min || 1, homeNorm: (homeValues[i] - min) / (max - min || 1) }
  })

  return comparisonResults.map(r => {
    const compValues = metrics.map(m => computeNumericSummary(r.daily, m))
    // Euclidean distance in normalized space
    let sumSq = 0
    for (let i = 0; i < metrics.length; i++) {
      const compNorm = (compValues[i] - ranges[i].min) / ranges[i].range
      const diff = ranges[i].homeNorm - compNorm
      sumSq += diff * diff
    }
    const distance = Math.sqrt(sumSq / metrics.length)
    const score = Math.max(0, Math.round((1 - distance) * 100))
    return { location: r.location, score, daily: r.daily }
  }).sort((a, b) => b.score - a.score)
}

// --- Showdown ---

export interface ShowdownResult {
  metric: WeatherMetric
  valueA: number
  valueB: number
  winner: 'a' | 'b' | 'tie'
  summaryA: string
  summaryB: string
}

export function computeShowdown(
  a: LocationResult,
  b: LocationResult,
  metrics: WeatherMetric[],
  tempUnit: TemperatureUnit,
): ShowdownResult[] {
  return metrics.map(metric => {
    const valueA = computeNumericSummary(a.daily, metric)
    const valueB = computeNumericSummary(b.daily, metric)
    const summaryA = computeSummary(a.daily, metric, tempUnit)
    const summaryB = computeSummary(b.daily, metric, tempUnit)

    // "Winner" depends on metric — more sun/warmth = better, less rain = better
    // This is subjective, so we just pick the "more extreme" one
    let winner: 'a' | 'b' | 'tie' = 'tie'
    if (Math.abs(valueA - valueB) > 0.01) {
      winner = valueA > valueB ? 'a' : 'b'
    }

    return { metric, valueA, valueB, winner, summaryA, summaryB }
  })
}

// --- Date presets ---

export interface DatePreset {
  label: string
  getRange: () => { start: string; end: string }
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

export const DATE_PRESETS: DatePreset[] = [
  { label: 'Last 7 days', getRange: () => ({ start: daysAgo(7), end: daysAgo(0) }) },
  { label: 'Last 30 days', getRange: () => ({ start: daysAgo(30), end: daysAgo(0) }) },
  { label: 'Last 90 days', getRange: () => ({ start: daysAgo(90), end: daysAgo(0) }) },
  {
    label: 'This year', getRange: () => {
      const year = new Date().getFullYear()
      return { start: `${year}-01-01`, end: daysAgo(0) }
    },
  },
  {
    label: 'Last year', getRange: () => {
      const year = new Date().getFullYear() - 1
      return { start: `${year}-01-01`, end: `${year}-12-31` }
    },
  },
  {
    label: 'This winter', getRange: () => {
      const now = new Date()
      const year = now.getFullYear()
      // Northern hemisphere winter: Dec prev year to Feb this year
      const month = now.getMonth()
      if (month <= 2) {
        return { start: `${year - 1}-12-01`, end: `${year}-02-28` }
      }
      return { start: `${year}-12-01`, end: daysAgo(0) }
    },
  },
  {
    label: 'This summer', getRange: () => {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth()
      if (month >= 5 && month <= 8) {
        return { start: `${year}-06-01`, end: daysAgo(0) }
      }
      // Most recent completed summer
      const summerYear = month < 5 ? year - 1 : year
      return { start: `${summerYear}-06-01`, end: `${summerYear}-08-31` }
    },
  },
]

// --- Elevation ---

export async function fetchElevations(locations: Location[]): Promise<Map<string, number>> {
  const real = locations.filter(l => !l.isEasterEgg)
  if (real.length === 0) return new Map()

  const lats = real.map(l => l.latitude).join(',')
  const lngs = real.map(l => l.longitude).join(',')
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lats}&longitude=${lngs}`)
    const data = await res.json()
    const elevations = data.elevation as number[]
    const map = new Map<string, number>()
    real.forEach((loc, i) => map.set(loc.id, Math.round(elevations[i])))
    // Pluto: ~1,200m avg (Sputnik Planitia basin)
    locations.filter(l => l.isEasterEgg).forEach(l => map.set(l.id, -2500))
    return map
  } catch {
    return new Map()
  }
}

// --- Air Quality ---

const AQ_BASE_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality'

export const AQ_METRICS = ['us_aqi', 'pm2_5', 'pm10', 'ozone', 'nitrogen_dioxide', 'carbon_monoxide'] as const
export type AQMetric = typeof AQ_METRICS[number]

export async function fetchAirQuality(
  location: Location,
  pastDays: number = 7,
): Promise<AirQualityResult> {
  if (location.isEasterEgg) {
    return generatePlutoAQ(location, pastDays)
  }

  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    hourly: AQ_METRICS.join(','),
    past_days: String(pastDays),
    forecast_days: '1',
    timezone: 'auto',
  })

  const res = await fetch(`${AQ_BASE_URL}?${params}`)
  const data = await res.json()
  if (!res.ok) {
    throw new Error(`${location.name}: ${data?.reason ?? `HTTP ${res.status}`}`)
  }
  return { location, hourly: data.hourly }
}

function generatePlutoAQ(location: Location, pastDays: number): AirQualityResult {
  const hours: string[] = []
  const now = new Date()
  for (let d = pastDays; d >= 0; d--) {
    for (let h = 0; h < 24; h++) {
      const dt = new Date(now)
      dt.setDate(dt.getDate() - d)
      dt.setHours(h, 0, 0, 0)
      hours.push(dt.toISOString().slice(0, 16))
    }
  }
  return {
    location,
    hourly: {
      time: hours,
      us_aqi: hours.map(() => Math.round(Math.random() * 3)),
      pm2_5: hours.map(() => +(Math.random() * 0.01).toFixed(3)),
      pm10: hours.map(() => +(Math.random() * 0.02).toFixed(3)),
      ozone: hours.map(() => +(Math.random() * 0.5).toFixed(2)),
      nitrogen_dioxide: hours.map(() => 0),
      carbon_monoxide: hours.map(() => 0),
    },
  }
}

// AQI color scale (US EPA)
export function getAQILevel(aqi: number): { label: string; color: string; bg: string } {
  if (aqi <= 50) return { label: 'Good', color: '#1a7d1a', bg: '#d4edda' }
  if (aqi <= 100) return { label: 'Moderate', color: '#856404', bg: '#fff3cd' }
  if (aqi <= 150) return { label: 'Unhealthy (Sensitive)', color: '#e07020', bg: '#ffe0cc' }
  if (aqi <= 200) return { label: 'Unhealthy', color: '#cc0000', bg: '#f8d7da' }
  if (aqi <= 300) return { label: 'Very Unhealthy', color: '#8b008b', bg: '#e8d0e8' }
  return { label: 'Hazardous', color: '#7e0023', bg: '#d4a0a0' }
}

export function computeAQSummary(hourly: AirQualityHourly): {
  avgAQI: number
  maxAQI: number
  avgPM25: number
  avgOzone: number
} {
  const aqiVals = (hourly.us_aqi ?? []).filter(v => v != null && !isNaN(v))
  const pm25Vals = (hourly.pm2_5 ?? []).filter(v => v != null && !isNaN(v))
  const ozoneVals = (hourly.ozone ?? []).filter(v => v != null && !isNaN(v))

  const avg = (arr: number[]) => arr.length ? +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : 0

  return {
    avgAQI: Math.round(avg(aqiVals)),
    maxAQI: aqiVals.length ? Math.max(...aqiVals) : 0,
    avgPM25: +avg(pm25Vals),
    avgOzone: +avg(ozoneVals),
  }
}

// Aggregate hourly AQ data to daily averages for charting
export function aggregateAQDaily(hourly: AirQualityHourly, metric: AQMetric): { date: string; value: number }[] {
  const times = hourly.time ?? []
  const values = (hourly[metric] as number[] | undefined) ?? []
  const buckets = new Map<string, number[]>()

  for (let i = 0; i < times.length; i++) {
    const day = times[i].slice(0, 10)
    if (!buckets.has(day)) buckets.set(day, [])
    const v = values[i]
    if (v != null && !isNaN(v)) buckets.get(day)!.push(v)
  }

  return Array.from(buckets.entries()).map(([date, vals]) => ({
    date,
    value: vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : 0,
  }))
}

// --- Climate 2050 ---

const CLIMATE_URL = 'https://climate-api.open-meteo.com/v1/climate'
const CLIMATE_MODEL = 'MRI_AGCM3_2_S' // Good general-purpose model

export async function fetchClimateProjection(location: Location): Promise<ClimateProjection> {
  if (location.isEasterEgg) {
    return {
      location,
      currentAvg: { tempMax: -218, tempMin: -233, precip: 0 },
      projectedAvg: { tempMax: -217.5, tempMin: -232.5, precip: 0 },
      deltaMax: 0.5,
      deltaMin: 0.5,
      deltaPrecip: 0,
    }
  }

  // Fetch "current" baseline: 2010-2020
  // Fetch "future" projection: 2040-2050
  const daily = 'temperature_2m_max,temperature_2m_min,precipitation_sum'

  const [currentRes, futureRes] = await Promise.all([
    fetch(`${CLIMATE_URL}?latitude=${location.latitude}&longitude=${location.longitude}&start_date=2010-01-01&end_date=2019-12-31&models=${CLIMATE_MODEL}&daily=${daily}`),
    fetch(`${CLIMATE_URL}?latitude=${location.latitude}&longitude=${location.longitude}&start_date=2040-01-01&end_date=2049-12-31&models=${CLIMATE_MODEL}&daily=${daily}`),
  ])

  const [currentData, futureData] = await Promise.all([currentRes.json(), futureRes.json()])

  if (!currentRes.ok || !futureRes.ok) {
    throw new Error(`${location.name}: Climate API error`)
  }

  const getAvg = (data: Record<string, unknown>, field: string): number => {
    const daily = data.daily as Record<string, number[]> | undefined
    if (!daily) return 0
    // Climate API nests under model name
    const key = `${field}_${CLIMATE_MODEL}` in daily ? `${field}_${CLIMATE_MODEL}` : field
    const vals = (daily[key] ?? []).filter((v: number) => v != null && !isNaN(v))
    return vals.length ? +(vals.reduce((a: number, b: number) => a + b, 0) / vals.length).toFixed(1) : 0
  }

  const currentAvg = {
    tempMax: getAvg(currentData, 'temperature_2m_max'),
    tempMin: getAvg(currentData, 'temperature_2m_min'),
    precip: getAvg(currentData, 'precipitation_sum'),
  }
  const projectedAvg = {
    tempMax: getAvg(futureData, 'temperature_2m_max'),
    tempMin: getAvg(futureData, 'temperature_2m_min'),
    precip: getAvg(futureData, 'precipitation_sum'),
  }

  return {
    location,
    currentAvg,
    projectedAvg,
    deltaMax: +(projectedAvg.tempMax - currentAvg.tempMax).toFixed(1),
    deltaMin: +(projectedAvg.tempMin - currentAvg.tempMin).toFixed(1),
    deltaPrecip: +(projectedAvg.precip - currentAvg.precip).toFixed(2),
  }
}

// Find which current city's weather matches this city's 2050 projection
export function findClimateTwin(
  projection: ClimateProjection,
  allProjections: ClimateProjection[],
): ClimateProjection | null {
  if (allProjections.length === 0) return null

  // Find the city whose CURRENT temps are closest to this city's PROJECTED temps
  let best: ClimateProjection | null = null
  let bestDist = Infinity

  for (const other of allProjections) {
    if (other.location.id === projection.location.id) continue
    const dMax = projection.projectedAvg.tempMax - other.currentAvg.tempMax
    const dMin = projection.projectedAvg.tempMin - other.currentAvg.tempMin
    const dist = Math.sqrt(dMax * dMax + dMin * dMin)
    if (dist < bestDist) {
      bestDist = dist
      best = other
    }
  }

  return best
}

// --- CSV export ---

export function toCSV(
  results: { location: Location; daily: DailyData }[],
  metrics: WeatherMetric[],
): string {
  const headers = ['date', ...results.flatMap(r =>
    metrics.map(m => `${r.location.name} - ${m}`)
  )]

  const times = results[0]?.daily.time as string[] ?? []
  const rows = times.map((date, i) => {
    const cells = results.flatMap(r =>
      metrics.map(m => {
        const vals = r.daily[m] as number[]
        return vals?.[i] ?? ''
      })
    )
    return [date, ...cells].join(',')
  })

  return [headers.join(','), ...rows].join('\n')
}
