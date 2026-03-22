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

// Pluto easter egg flavor text
export const PLUTO_QUIPS: Record<string, string[]> = {
  precipitation_sum: [
    'No rain on Pluto. Just the tears of astronomers who miss calling it a planet.',
    'Precipitation: 0. Nitrogen ice doesn\'t count. We checked.',
    'Rain forecast: never. Bring a jacket anyway (for the -230\u{00B0}C).',
  ],
  snowfall_sum: [
    'Technically nitrogen frost, but we\'ll allow it.',
    'Pluto snow day! Class is cancelled. Class was also never scheduled.',
    'Snowfall: vibes only. It\'s more of a "frozen hellscape" situation.',
  ],
  temperature_2m_max: [
    'High of -218\u{00B0}C. Wear layers.',
    'Warmer than expected! Still absolutely uninhabitable though.',
    'Hot Pluto summer. (It\'s -215\u{00B0}C.)',
  ],
  temperature_2m_min: [
    'Low of -233\u{00B0}C. Your phone would simply pass away.',
    'Cold enough to freeze nitrogen. Which it does. Regularly.',
    'At these temps, even the void shivers.',
  ],
  sunshine_duration: [
    'The Sun is just a really bright star from here.',
    'Sunshine hours: technically yes, emotionally no.',
    'You\'d need about 1,000 suns to feel warm here.',
  ],
  wind_speed_10m_max: [
    'Wind: barely. The atmosphere is thinner than your patience.',
    'Peak gust: 1.2 km/h. Devastating by Pluto standards.',
    'There\'s wind, but it\'s mostly existential.',
  ],
}

export function getPlutoQuip(metric: string): string {
  const quips = PLUTO_QUIPS[metric] ?? ['Pluto data is simulated. Obviously.']
  return quips[Math.floor(Math.random() * quips.length)]
}

// Geocoding via Open-Meteo
export async function searchLocations(query: string): Promise<Location[]> {
  if (!query.trim() || query.length < 2) return []
  const params = new URLSearchParams({ name: query, count: '5', language: 'en', format: 'json' })
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`)
  if (!res.ok) return []
  const data = await res.json()
  if (!data.results) return []
  return data.results.map((r: { id: number; name: string; country: string; admin1?: string; latitude: number; longitude: number }) => ({
    id: `custom-${r.id}`,
    name: r.admin1 ? `${r.name}, ${r.admin1}, ${r.country}` : `${r.name}, ${r.country}`,
    latitude: r.latitude,
    longitude: r.longitude,
    emoji: '\u{1F4CD}',
  }))
}
