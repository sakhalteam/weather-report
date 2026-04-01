# Weather Report

Compare weather data across locations using Open-Meteo's free APIs.

## Stack
- Vite + React 19 + TypeScript
- Tailwind v4 via `@tailwindcss/vite`
- Recharts for data visualization
- Open-Meteo APIs: Archive (historical weather), Air Quality, Climate Change, Elevation, Geocoding

## Design
- **Wii/3DS Weather Channel aesthetic + great UX** — bubbly, translucent, pastel, light background
- NOT dark-first like other sakhalteam projects
- Nunito font (Google Fonts)
- Pill-shaped toggle buttons, frosted glass panels, rounded everything
- Usability is a first-class driver alongside the playful aesthetic

## Modes
- **Compare** — multi-location weather comparison with bar/line charts, timeline playback
- **Year-over-Year** — same location across different years
- **Showdown** — head-to-head 2-city battle with winner crowns
- **Weather Twin** — find which world city has the most similar weather
- **Air Quality** — US AQI, PM2.5, PM10, ozone, NO2 (7-day hourly data, color-coded EPA scale)
- **2050 Climate** — MRI-AGCM3 model projections with "future weather twin" matching

## Locations
Pre-seeded: Lynnwood WA, Wenatchee WA, Ulaanbaatar, Tokyo, Naha (Okinawa), Phoenix AZ, Pluto (easter egg with simulated data)
20-city twin pool for Weather Twin and Climate 2050 comparisons
Location search via Open-Meteo Geocoding API

## Features
- F/C temperature toggle
- Date range presets (last 7/30/90 days, this year, last year, seasons)
- Elevation badges on summary cards
- Animated timeline playback with scrubber and speed control
- Categorized metric groups (temperature, precipitation, sun & light, wind)
- Sound effects (Web Audio API, procedurally generated, muted by default)
- Export: CSV, PNG (with watermark), shareable URL
- Full responsive/mobile CSS

## Deploy
GitHub Actions -> GitHub Pages at `sakhalteam.github.io/weather-report/`
`base: '/weather-report/'` in vite.config.ts

## Key Files
- `src/api.ts` — Open-Meteo fetches (weather, AQ, climate, elevation), Pluto mock data, aggregation, scoring, CSV export
- `src/locations.ts` — location definitions, metric definitions with categories, twin pool cities, Pluto quips, geocoding
- `src/FilterBar.tsx` — mode-aware filter UI (metrics, locations, dates, year picker, presets)
- `src/Chart.tsx` — Recharts bar/line chart with F/C conversion
- `src/App.tsx` — main layout, all state, mode routing, generate logic
- `src/Showdown.tsx` — head-to-head VS layout
- `src/WeatherTwin.tsx` — similarity scoring UI with ranking
- `src/AirQuality.tsx` — AQI cards with EPA color scale and trend charts
- `src/Climate2050.tsx` — current vs projected comparison with future twin
- `src/Timeline.tsx` — animated playback with windowed chart
- `src/sounds.ts` — procedural Wii-style sound effects
