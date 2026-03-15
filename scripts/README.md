# BladeClaw Control Room Scripts

This directory documents the primary scripts used in the project lifecycle.

## Development Commands

- `npm run dev`
  Starts the local development server with Vite on port 5173. Hot Module Replacement (HMR) is enabled.

- `npm run build`
  Compiles TypeScript, then builds the application for production using Vite. The output will be placed in the `dist/` directory. Optimized chunks (`vendor`, `three`, `motion`) are automatically generated to improve loading performance.

- `npm run preview`
  Boots a local web server to serve the production build generated in the `dist/` directory. Use this command to test the final built application before deploying.

- `npm run lint`
  Runs ESLint to statically analyze the codebase for syntax and style issues.
