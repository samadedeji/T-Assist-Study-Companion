# T-Assist

T-Assist is a Flask-backed AI study companion where students chat with Temmy, explore any subject, and build learning momentum through progress, streaks, and badges.

## Run & Operate

- `python3 artifacts/api-server/app.py` — run the Flask API server (port 8080)
- `pnpm --filter @workspace/t-assist run dev` — run the T-Assist web interface
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- Required env: `DATABASE_URL`, `SESSION_SECRET`, and `GEMINI_API_KEY`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Flask 3 with psycopg
- DB: PostgreSQL
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React + Vite

## Where things live

- `artifacts/api-server/app.py` is the Flask API, session handling, companion logic, and progress rules.
- `artifacts/t-assist/src/` contains the React pages, visual system, and chat interactions.
- `lib/api-spec/openapi.yaml` is the source of truth for API contracts.
- `lib/api-client-react/` contains generated frontend API hooks.
- The development database uses the verified tables from the T-Assist app flow and schema document.

## Architecture decisions

- The Flask API owns streaks, badges, and progress derivation. The browser never submits those values.
- Student profiles use a name, class level, and hashed 4 to 6 digit PIN with a signed Flask session.
- Temmy uses Gemini when `GEMINI_API_KEY` is available and falls back to a friendly local reply if the provider is unavailable.
- Image and voice notes are sent as inline media to Gemini, with an 8 MB request limit.

## Product

- Students can create a low-friction profile and return with their name and PIN.
- Temmy supports text, image, and voice-note study questions.
- The app records recent messages, topics covered, current and longest streaks, and milestone badges.
- The landing page, chat desk, progress map, signup, login, and mobile navigation share one warm visual identity.

## User preferences

- Keep the tone warm, age-aware, and student-facing.
- Do not use em dashes in UI copy, API fallback text, or documentation.

## Gotchas

- Run API schema codegen after changing `lib/api-spec/openapi.yaml`.
- Restart the managed Flask API workflow after changing `artifacts/api-server/app.py`.
- Use Replit Secrets for `GEMINI_API_KEY` and never print secret values.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
