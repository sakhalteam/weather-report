export interface Location {
  id: string
  name: string
  latitude: number
  longitude: number
  emoji: string
  isEasterEgg?: boolean
}

export type WeatherMetric =
  | 'precipitation_sum'
  | 'sunshine_duration'
  | 'temperature_2m_max'
  | 'temperature_2m_min'
  | 'snowfall_sum'
  | 'wind_speed_10m_max'

export interface MetricInfo {
  id: WeatherMetric
  label: string
  emoji: string
  unit: string
  summaryLabel: string
}

export interface DailyData {
  time: string[]
  [key: string]: number[] | string[]
}

export interface LocationResult {
  location: Location
  daily: DailyData
}

export interface MonthBucket {
  month: string
  [key: string]: number | string
}

export type ChartType = 'bar' | 'line'
