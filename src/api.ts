import type { Location, WeatherMetric, DailyData } from './types'

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

  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    start_date: startDate,
    end_date: endDate,
    daily: metrics.join(','),
    timezone: 'auto',
  })

  const res = await fetch(`${BASE_URL}?${params}`)
  if (!res.ok) throw new Error(`Failed to fetch data for ${location.name}`)
  const data = await res.json()
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
        case 'precipitation_sum': return 0
        case 'snowfall_sum': return Math.random() < 0.05 ? +(Math.random() * 0.3).toFixed(2) : 0
        case 'sunshine_duration': return +(Math.random() * 120).toFixed(0)
        case 'wind_speed_10m_max': return +(Math.random() * 1.5).toFixed(1)
        default: return 0
      }
    })
  }

  return { daily }
}

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

  const isCountMetric = metric === 'precipitation_sum' || metric === 'snowfall_sum'
  const isSumMetric = metric === 'sunshine_duration'

  return Array.from(buckets.entries()).map(([month, vals]) => {
    let value: number
    if (isCountMetric) {
      value = vals.filter(v => v > 0).length
    } else if (isSumMetric) {
      value = Math.round(vals.reduce((a, b) => a + b, 0) / 3600)
    } else {
      value = +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
    }
    return { month, value }
  })
}

export function computeSummary(
  daily: DailyData,
  metric: WeatherMetric,
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
    case 'temperature_2m_max':
    case 'temperature_2m_min': {
      const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)
      return `${avg}\u{00B0}C avg`
    }
    case 'wind_speed_10m_max': {
      const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)
      return `${avg} km/h avg`
    }
    default:
      return ''
  }
}

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
