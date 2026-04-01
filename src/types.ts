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
  | 'apparent_temperature_max'
  | 'apparent_temperature_min'
  | 'snowfall_sum'
  | 'wind_speed_10m_max'
  | 'wind_gusts_10m_max'
  | 'daylight_duration'
  | 'uv_index_max'
  | 'precipitation_hours'

export type MetricCategory = 'temperature' | 'precipitation' | 'sun' | 'wind'

// Air quality types
export interface AirQualityHourly {
  time: string[]
  us_aqi?: number[]
  pm2_5?: number[]
  pm10?: number[]
  ozone?: number[]
  nitrogen_dioxide?: number[]
  carbon_monoxide?: number[]
  uv_index?: number[]
}

export interface AirQualityResult {
  location: Location
  hourly: AirQualityHourly
}

// Climate 2050 types
export interface ClimateProjection {
  location: Location
  currentAvg: { tempMax: number; tempMin: number; precip: number }
  projectedAvg: { tempMax: number; tempMin: number; precip: number }
  deltaMax: number
  deltaMin: number
  deltaPrecip: number
}

export interface MetricInfo {
  id: WeatherMetric
  label: string
  emoji: string
  unit: string
  summaryLabel: string
  category: MetricCategory
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
export type TemperatureUnit = 'C' | 'F'
export type AppMode = 'compare' | 'yoy' | 'showdown' | 'twin' | 'airquality' | 'climate2050'
