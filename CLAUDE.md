# Weather Report

Compare weather data across locations using Open-Meteo's free historical API.

## Stack
- Vite + React 19 + TypeScript
- Tailwind v4 via `@tailwindcss/vite`
- Recharts for data visualization
- Open-Meteo Archive API (no auth required)

## Design
- **Wii/3DS Weather Channel aesthetic** — bubbly, translucent, pastel, light background
- NOT dark-first like other sakhalteam projects
- Nunito font (Google Fonts)
- Pill-shaped toggle buttons, frosted glass panels, rounded everything

## Locations
Pre-seeded: Lynnwood WA, Wenatchee WA, Ulaanbaatar, Tokyo, Naha (Okinawa), Phoenix AZ, Pluto (easter egg with simulated data)

## Deploy
GitHub Actions -> GitHub Pages at `sakhalteam.github.io/weather-report/`
`base: '/weather-report/'` in vite.config.ts

## Key Files
- `src/api.ts` — Open-Meteo fetch, Pluto mock data generator, aggregation/summary utils, CSV export
- `src/locations.ts` — location definitions with lat/lng, metric definitions
- `src/FilterBar.tsx` — weather type / location / date range selector UI
- `src/Chart.tsx` — Recharts bar chart (monthly aggregated)
- `src/App.tsx` — main layout, state, HomeBtn, results display
