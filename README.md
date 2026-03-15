# BladeClaw Control Room

A React + Vite dashboard for monitoring BladeClaw autonomous build operations.

## Scripts

- `npm install` — install dependencies
- `npm run dev` — start local dev server
- `npm run build` — type-check and create production build
- `npm run lint` — run TypeScript no-emit validation
- `npm run preview` — preview production build locally

## Assets

Required public assets:
- `public/images/bladeclaw-icon.png`
- `public/images/hud-overlay.png`

## Stack

- React 18
- TypeScript
- Vite 5
- Tailwind CSS
- motion
- Three.js / React Three Fiber

## Notes

This build uses simulated live telemetry for agent status, DAG progress, and token tracking.
