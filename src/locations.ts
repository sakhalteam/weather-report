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

// Pool of world cities for Weather Twin comparison
export const TWIN_POOL: Location[] = [
  { id: 'twin-london', name: 'London', latitude: 51.5074, longitude: -0.1278, emoji: '\u{1F302}' },
  { id: 'twin-paris', name: 'Paris', latitude: 48.8566, longitude: 2.3522, emoji: '\u{1F5FC}' },
  { id: 'twin-sydney', name: 'Sydney', latitude: -33.8688, longitude: 151.2093, emoji: '\u{1F998}' },
  { id: 'twin-cairo', name: 'Cairo', latitude: 30.0444, longitude: 31.2357, emoji: '\u{1F3DB}\u{FE0F}' },
  { id: 'twin-mumbai', name: 'Mumbai', latitude: 19.0760, longitude: 72.8777, emoji: '\u{1F3D9}\u{FE0F}' },
  { id: 'twin-beijing', name: 'Beijing', latitude: 39.9042, longitude: 116.4074, emoji: '\u{1F3EF}' },
  { id: 'twin-rio', name: 'Rio de Janeiro', latitude: -22.9068, longitude: -43.1729, emoji: '\u{1F3D6}\u{FE0F}' },
  { id: 'twin-nairobi', name: 'Nairobi', latitude: -1.2921, longitude: 36.8219, emoji: '\u{1F981}' },
  { id: 'twin-reykjavik', name: 'Reykjavik', latitude: 64.1466, longitude: -21.9426, emoji: '\u{1F9CA}' },
  { id: 'twin-bangkok', name: 'Bangkok', latitude: 13.7563, longitude: 100.5018, emoji: '\u{1F962}' },
  { id: 'twin-mexicocity', name: 'Mexico City', latitude: 19.4326, longitude: -99.1332, emoji: '\u{1F32E}' },
  { id: 'twin-seoul', name: 'Seoul', latitude: 37.5665, longitude: 126.9780, emoji: '\u{1F1F0}\u{1F1F7}' },
  { id: 'twin-moscow', name: 'Moscow', latitude: 55.7558, longitude: 37.6173, emoji: '\u{2744}\u{FE0F}' },
  { id: 'twin-lima', name: 'Lima', latitude: -12.0464, longitude: -77.0428, emoji: '\u{1F3D4}\u{FE0F}' },
  { id: 'twin-dubai', name: 'Dubai', latitude: 25.2048, longitude: 55.2708, emoji: '\u{1F3DC}\u{FE0F}' },
  { id: 'twin-vancouver', name: 'Vancouver', latitude: 49.2827, longitude: -123.1207, emoji: '\u{1F332}' },
  { id: 'twin-capetown', name: 'Cape Town', latitude: -33.9249, longitude: 18.4241, emoji: '\u{1F30D}' },
  { id: 'twin-helsinki', name: 'Helsinki', latitude: 60.1699, longitude: 24.9384, emoji: '\u{1F1EB}\u{1F1EE}' },
  { id: 'twin-singapore', name: 'Singapore', latitude: 1.3521, longitude: 103.8198, emoji: '\u{1F1F8}\u{1F1EC}' },
  { id: 'twin-denver', name: 'Denver', latitude: 39.7392, longitude: -104.9903, emoji: '\u{26F7}\u{FE0F}' },
]

export const METRICS: MetricInfo[] = [
  // Temperature
  { id: 'temperature_2m_max', label: 'High Temp', emoji: '\u{1F321}\u{FE0F}', unit: '\u{00B0}C', summaryLabel: 'avg high', category: 'temperature' },
  { id: 'temperature_2m_min', label: 'Low Temp', emoji: '\u{2744}\u{FE0F}', unit: '\u{00B0}C', summaryLabel: 'avg low', category: 'temperature' },
  { id: 'apparent_temperature_max', label: 'Feels Like (High)', emoji: '\u{1F975}', unit: '\u{00B0}C', summaryLabel: 'feels like high', category: 'temperature' },
  { id: 'apparent_temperature_min', label: 'Feels Like (Low)', emoji: '\u{1F976}', unit: '\u{00B0}C', summaryLabel: 'feels like low', category: 'temperature' },
  // Precipitation
  { id: 'precipitation_sum', label: 'Rain', emoji: '\u{1F327}\u{FE0F}', unit: 'mm', summaryLabel: 'rainy days', category: 'precipitation' },
  { id: 'snowfall_sum', label: 'Snow', emoji: '\u{26C4}', unit: 'cm', summaryLabel: 'snowy days', category: 'precipitation' },
  { id: 'precipitation_hours', label: 'Rain Hours', emoji: '\u{2614}', unit: 'hrs', summaryLabel: 'rainy hrs', category: 'precipitation' },
  // Sun & Light
  { id: 'sunshine_duration', label: 'Sunshine', emoji: '\u{2600}\u{FE0F}', unit: 'hrs', summaryLabel: 'sunshine hrs', category: 'sun' },
  { id: 'daylight_duration', label: 'Daylight', emoji: '\u{1F305}', unit: 'hrs', summaryLabel: 'daylight hrs', category: 'sun' },
  { id: 'uv_index_max', label: 'UV Index', emoji: '\u{1F60E}', unit: '', summaryLabel: 'avg UV', category: 'sun' },
  // Wind
  { id: 'wind_speed_10m_max', label: 'Wind', emoji: '\u{1F4A8}', unit: 'km/h', summaryLabel: 'avg max wind', category: 'wind' },
  { id: 'wind_gusts_10m_max', label: 'Gusts', emoji: '\u{1F32A}\u{FE0F}', unit: 'km/h', summaryLabel: 'avg gusts', category: 'wind' },
]

export const METRIC_CATEGORIES = [
  { id: 'temperature' as const, label: 'Temperature', emoji: '\u{1F321}\u{FE0F}' },
  { id: 'precipitation' as const, label: 'Precipitation', emoji: '\u{1F327}\u{FE0F}' },
  { id: 'sun' as const, label: 'Sun & Light', emoji: '\u{2600}\u{FE0F}' },
  { id: 'wind' as const, label: 'Wind', emoji: '\u{1F4A8}' },
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
  apparent_temperature_max: [
    'Feels like: instant death. But a dry instant death.',
    'Wind chill makes it worse? Somehow, yes.',
    'The "feels like" on Pluto is just "no."',
  ],
  apparent_temperature_min: [
    'Feels like: the heat death of the universe, but colder.',
    'Even the concept of "feels like" gives up at these temps.',
    'Your bones would shatter before you could feel anything.',
  ],
  sunshine_duration: [
    'The Sun is just a really bright star from here.',
    'Sunshine hours: technically yes, emotionally no.',
    'You\'d need about 1,000 suns to feel warm here.',
  ],
  daylight_duration: [
    'A Pluto day is 6.4 Earth days. Naps are encouraged.',
    'Daylight exists, technically. Warmth does not.',
    'You get daylight, just not the kind that helps.',
  ],
  uv_index_max: [
    'UV index: 0. Sunscreen not required. Spacesuit very much required.',
    'The UV on Pluto is so low even vampires would be fine.',
    'SPF 0. You\'ll be fine. (You won\'t be fine.)',
  ],
  wind_speed_10m_max: [
    'Wind: barely. The atmosphere is thinner than your patience.',
    'Peak gust: 1.2 km/h. Devastating by Pluto standards.',
    'There\'s wind, but it\'s mostly existential.',
  ],
  wind_gusts_10m_max: [
    'Gusts of up to "technically measurable." Impressive.',
    'The gusts on Pluto are like a polite suggestion.',
    'Wind gusts: present, but deeply unimpressive.',
  ],
  precipitation_hours: [
    'Rainy hours: a concept Pluto has never heard of.',
    'Hours of rain: 0. Hours of existential cold: all of them.',
    'It doesn\'t rain on Pluto. Nothing rains on Pluto.',
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
