# Repository Guidelines

## Project Structure & Module Organization
- `server.js` — Express server, security middleware, `/api/generate` and `/api/health` routes, Gemini integration.
- `public/` — Static frontend (`index.html`, `styles.css`, `script.js`). Served by Express.
- `.env` / `.env.example` — Runtime configuration. Never commit real secrets.
- `Dockerfile` — Production image (Node 20 Alpine) with prod deps only.

## Build, Test, and Development Commands
- Install deps: `npm install` (or `pnpm install`)
- Run dev (nodemon): `npm run dev`
- Run server: `npm start` (serves `public/` on `/:*`)
- Docker build/run:
  - `docker build -t action-figure-builder .`
  - `docker run --rm -p 3000:3000 --env-file .env action-figure-builder`

## Coding Style & Naming Conventions
- Language: Node.js ESM (Node 18+). Prefer modern syntax and async/await.
- Indentation: 2 spaces; include semicolons; single quotes for strings as in existing files.
- Filenames: lower-case, hyphenated for multi-word (e.g., `action-utils.js`); CSS/JS in `public/` mirror the page purpose.
- Keep modules small and focused (server-only logic in `server.js`; browser logic in `public/`). Avoid introducing frameworks without discussion.

## Testing Guidelines
- No test suite exists yet. If adding tests:
  - Use Jest or Vitest + Supertest for HTTP routes.
  - Place tests under `tests/` or `__tests__/`, name like `server.generate.spec.js`.
  - Mock Gemini calls; cover `/api/health`, validation errors, rate limiting responses, and success path.
  - Add `npm test` and CI config in a separate PR.

## Commit & Pull Request Guidelines
- Commits: imperative mood, concise subject (≤72 chars), optional body explaining why and key decisions. Scope tags like `server:`, `public:`, `docs:` are encouraged.
- PRs: include a clear description, linked issues, reproduction steps, screenshots of UI changes, and any env vars required. Note security-impacting changes (CORS, file limits, rate limits).

## Security & Configuration Tips
- Required: `GOOGLE_API_KEY` for real generation; otherwise the API returns a mock echo of the upload.
- Set `ALLOWED_ORIGINS` in production; keep it empty only for local dev.
- Respect upload limits (≤10MB; JPEG/PNG/WEBP/HEIC/HEIF). Tune `RATE_LIMIT_MAX` and `GEMINI_TIMEOUT_MS` as needed.
