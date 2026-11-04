# Mythos Frontend

React/TypeScript with Vite. See the [main README](../README.md) for integrated setup, configuration, testing, and deployment.

- `npm ci`: install locked dependencies (Node 24).
- `npm run dev`: start on port 3000; proxy `/api` to `API_PROXY_TARGET` (default `http://localhost:8080`).
- `npm run build`: run TypeScript checks and generate the production bundle.
- `npm run lint`: run static checks.
- `npm run test:e2e`: run Chromium desktop/mobile checks, read-only by default. Requires `npx playwright install chromium` and running local services.

Screens use the HTTP API exclusively. `VITE_API_URL` is public; never put database credentials in frontend variables. Hash-based navigation preserves filters in the URL and supports static hosting.
