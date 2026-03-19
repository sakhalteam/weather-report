import type { Location, MetricInfo } from './types'

export const LOCATIONS: Location[] = [
  { id: 'lynnwood', name: 'Lynnwood, WA', latitude: 47.8207, longitude: -122.3151, emoji: '\u{1F332}' },
  { id: 'wenatchee', name: 'Wenatchee, WA', latitude: 47.4235, longitude: -120.3103, emoji: '\u{1F34E}' },
  { id: 'ulaanbaatar', name: 'Ulaanbaatar', latitude: 47.9077, longitude: 106.8832, emoji: '\u{1F40E}' },
  { id: 'tokyo', name: 'Tokyo', latitude: 35.6762, longitude: 139.6503, emoji: '\u{1F5FC}' },
  { id: 'naha', name: 'Naha, Okinawa', latitude: 26.3344, longitude: 127.8056, emoji: '\u{1F33A}' },
  { id: 'phoenix', name: 'Phoenix, AZ', latitude: 33.4484, longitude: -112.0740, emoji: '\u{1F335}' },
  { id: 'pluto', name: 'Pluto', latitude: 0, longitude: 0, emoji: '\u{1FA90}', isEasterEgg: true },
]

export const METRICS: MetricInfo[] = [
  { id: 'precipitation_sum', label: 'Rain', emoji: '\u{1F327}\u{FE0F}', unit: 'mm', summaryLabel: 'rainy days' },
  { id: 'temperature_2m_max', label: 'High Temp', emoji: '\u{1F321}\u{FE0F}', unit: '\u{00B0}C', summaryLabel: 'avg high' },
  { id: 'temperature_2m_min', label: 'Low Temp', emoji: '\u{2744}\u{FE0F}', unit: '\u{00B0}C', summaryLabel: 'avg low' },
  { id: 'snowfall_sum', label: 'Snow', emoji: '\u{26C4}', unit: 'cm', summaryLabel: 'snowy days' },
  { id: 'sunshine_duration', label: 'Sunshine', emoji: '\u{2600}\u{FE0F}', unit: 'hrs', summaryLabel: 'sunshine hrs' },
  { id: 'wind_speed_10m_max', label: 'Wind', emoji: '\u{1F4A8}', unit: 'km/h', summaryLabel: 'avg max wind' },
]
