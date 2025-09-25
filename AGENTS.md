# Repository Guidelines

## Project Structure & Module Organization
React code lives in `client/src` with feature folders (`pages/`, `components/`, `hooks/`, `contexts/`). Shared API contracts stay in `shared/`; regenerate with `npm run api:generate-types` after server updates. The Express backend sits in `server/` with routes, services, middleware, and monitoring modules. Supabase migrations live in `supabase/migrations/`; static assets stay in `public/`. Generated output (`dist/`, `logs/`, `playwright-report/`) is disposable—keep it out of git.

## Build, Test, and Development Commands
Use Node 20+. `npm run dev` boots the API and Vite; helper scripts `npm run dev:main` and `npm run dev:redesign` preload env vars for the main and redesign stacks. Build with `npm run build` and verify via `npm run start`. Apply schema changes with `npm run db:push` and seed data through `npm run db:seed` or `npm run db:seed:local`. Rerun `npm run api:generate-types` whenever backend routes change.

## Coding Style & Naming Conventions
This is a strict TypeScript codebase. Keep 2-space indentation, double quotes, and semicolons. Use PascalCase for components and services, prefix hooks with `use`, and colocate files with their feature. Import UI modules with `@/...` and shared schemas with `@shared/...`. Tailwind utilities stay inline; put reusable tokens in `client/src/styles/`.

## Testing Guidelines
Vitest covers unit and interaction tests—create `*.test.ts(x)` beside the code or reuse `client/src/test/setup.ts`, and run `npm run test:run` or `npm run test:watch`. API integrations live in `test/*.api.spec.ts` and run via `npm run test:integration`. End-to-end flows use Playwright (`npm run test:e2e`, `npm run test:e2e:debug`). Aim for coverage before merging; `npm run test:coverage` reports results.

## Commit & Pull Request Guidelines
Follow the `<type>: <summary>` style visible in history (`feat: finalize UI redesign`, `config: add Railway configuration`). Keep commits focused and include regenerated artifacts. PRs should summarize scope, link the tracking issue, note env or migration impacts, and attach screenshots or short clips for UI work. Mention which of `test:run`, `test:integration`, or `test:e2e` ran.

## Security & Configuration Tips
Keep secrets in `.env.local`; required keys include `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `DATABASE_URL`. Do not commit env files, logs, or generated assets from `server/logs/`. When adjusting infra, update `drizzle.config.ts`, `railway.json`, and confirm `server/middleware/security.ts` stays enabled so rate limiting and headers remain intact.
