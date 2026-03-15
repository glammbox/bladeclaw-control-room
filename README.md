# BladeClaw Control Room v7

A real-time command center for monitoring BladeClaw autonomous multi-agent build operations. Built with the **IronMan Design System** — glassmorphism panels, arc-reactor accents, and a 10-stage DAG visualization.

🔗 **Live Demo:** https://bladeclaw-control-room.vercel.app

---

## Features

- **10-Stage DAG Visualization** — real-time pipeline: Pulse → Planner → Research/Market → Content/Media → Builder → Validator → Optimizer → Package
- **IronMan Design System** — glassmorphism panels, arc-reactor glow, gold/blue accent palette
- **Agent Matrix** — live status grid for all 9 souls with token counters and stage progress
- **Intel Feed** — streaming log of agent activity, lessons learned, and build events
- **Token Tracker** — real-time token budget consumption per stage
- **Cloudinary CDN** — hero imagery served via `q_auto,f_auto` transforms for instant loading
- **Responsive** — optimized for desktop HUD and mobile monitoring

---

## Stack

- **React 18** + TypeScript
- **Vite 5** — fast builds, optimized chunking
- **TailwindCSS 3** — utility-first styling
- **motion/react** — smooth animated transitions and panel entrance
- **react-router-dom** — Dashboard + Settings views
- **GSAP** — HUD animations and arc-reactor pulse effects

---

## Scripts

```bash
npm install       # install dependencies
npm run dev       # start local dev server (port 5173)
npm run build     # type-check + production build
npm run lint      # TypeScript no-emit validation
npm run preview   # preview production build locally
```

---

## Bundle Profile

| Chunk | Gzip |
|-------|------|
| vendor | 62 KB |
| motion | 36 KB |
| index (main) | 33 KB |
| CSS | 7 KB |
| **Total** | **~138 KB** |

> ✅ All chunks under 200KB gzip budget. Three.js/R3F tree-shaken (not in active render tree).

---

## Architecture Notes

- `src/pages/Dashboard.tsx` — primary HUD with DAG, agent matrix, token tracker
- `src/pages/Settings.tsx` — configuration and stack info panel
- `src/components/ArcReactorCore.tsx` — R3F/Three.js component (available, not currently rendered — tree-shaken from bundle)
- `src/lib/openclawData.ts` — simulated telemetry, agent personas, DAG stage data

---

## Deployment

Deployed via Vercel. Push to `main` → auto-deploys.

```bash
vercel --prod --scope blade-claw
```
