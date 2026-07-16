# RecallLayer.ai

`RecallLayer.ai` is a TypeScript persistence and retrieval layer for AI-agent memory.

It extracts useful facts from chat, stores them in PostgreSQL with pgvector, retrieves relevant memories during future turns, and provides a React dashboard for testing conversations, memories, and provider settings.

## Stack

- Bun workspaces
- Express API
- React + Vite dashboard
- PostgreSQL + pgvector
- Prisma
- OpenAI-compatible client
- OpenAI and OpenRouter support
- Zod validation

## Workspace Layout

```txt
new_project/
  apps/
    api/        Express API
    web/        React landing page and dashboard
  packages/
    core/       Memory extraction, chat, search, bubbles, summaries
    db/         Prisma schema and database stores
    shared/     Shared TypeScript types and Zod schemas
```

See `MIGRATION_MAP.md` for the file-by-file mapping from old Python modules to new TypeScript modules. No Python source is copied into `new_project`.

The data-access layer is named `stores`, for example:

```txt
ConversationStore
MemoryStore
MessageStore
ProviderSettingsStore
SummaryStore
```

## Environment

Create `new_project/.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require"
NODE_ENV="development"
API_PORT="4000"
WEB_ORIGIN="http://localhost:5173"
CORS_ORIGINS="http://localhost:5173"
TRUST_PROXY="false"
ADMIN_EMAILS="you@example.com"
JWT_SECRET_KEY="replace-with-a-long-random-secret"
ENCRYPTION_KEY="replace-with-a-different-long-random-secret"
JSON_BODY_LIMIT="1mb"
VITE_API_URL="http://localhost:4000"

GLOBAL_RATE_LIMIT_WINDOW_MS="60000"
GLOBAL_RATE_LIMIT_MAX="300"
AUTH_RATE_LIMIT_WINDOW_MS="900000"
AUTH_RATE_LIMIT_MAX="30"
CHAT_RATE_LIMIT_WINDOW_MS="60000"
CHAT_RATE_LIMIT_MAX="30"
API_KEY_RATE_LIMIT_WINDOW_MS="900000"
API_KEY_RATE_LIMIT_MAX="20"

LLM_PROVIDER="openrouter"
OPENAI_API_KEY=""
OPENROUTER_API_KEY=""
LLM_MODEL="openai/gpt-4o-mini"
EMBEDDING_MODEL="text-embedding-3-small"
DEBUG="false"
```

For Neon, use the Neon connection string with `sslmode=require`.

`ADMIN_EMAILS` is a comma-separated allowlist for the global provider/settings API. Normal users can still save their own OpenRouter API key from the dashboard.

## Database Setup

Enable pgvector in Neon SQL Editor:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Then run:

```bash
bun install
bun run db:generate
bun run db:migrate
```

For a disposable local or preview database only, if `db:migrate` has trouble with Neon shadow database permissions, use:

```bash
bunx prisma db push --schema packages/db/prisma/schema.prisma
```

For production, use checked-in migrations instead of development migrations:

```bash
bun run db:deploy
bun run db:status
```

### Fresh Neon database for production

Do not reuse a development database that contains old demo users or memories. Create a new Neon project/database. A normal branch of the existing project copies its parent data, so it is not clean unless it branches from a point before those rows existed.

After creating the new project:

1. Copy its connection string into `DATABASE_URL` in `.env` and in the deployed API environment.
2. Enable pgvector in the new database with `CREATE EXTENSION IF NOT EXISTS vector;`.
3. Apply the checked-in migration history with `bun run db:deploy`.
4. Confirm the result with `bun run db:status`.
5. Start the API and create a new account through the product. Do not copy the old `users`, `conversations`, `chat_messages`, `messages`, or `memories` rows.

Keep the old database temporarily as a rollback archive, but do not point the production API at it.

## Run The App

Start the API:

```bash
bun run dev:api
```

Start the web dashboard:

```bash
bun run dev:web
```

Default URLs:

```txt
API: http://localhost:4000
Landing page: http://localhost:5173
Dashboard: http://localhost:5173/dashboard
Docs: http://localhost:5173/docs
Demo: http://localhost:5173/demo
Sign in: http://localhost:5173/signin
Sign up: http://localhost:5173/signup
```

If Vite says port `5173` is busy, it may use `5174`, `5175`, or the next free port.

## Account And API Key Flow

Create an account at `/signup`, then open `/dashboard`. The first 10 chat messages can use `OPENROUTER_API_KEY` as the system free-tier key. After that, users add their own OpenRouter key from the dashboard profile menu.

For OpenRouter:

```txt
Provider: OpenRouter
LLM model: openai/gpt-4o-mini
Embedding model: text-embedding-3-small
OpenRouter API key: sk-or-v1-...
```

For OpenAI:

```txt
Provider: OpenAI
LLM model: gpt-4o-mini
Embedding model: text-embedding-3-small
OpenAI API key: sk-...
```

User OpenRouter API keys are encrypted before storage and are never returned to the browser. The UI only shows whether a key exists.

## Manual Test Flow

1. Open `/signup` and create an account.
2. Open `/dashboard`.
3. Send:

```txt
Hi, I am Alex. I use TypeScript and prefer dark mode.
```

Expected:

- The assistant replies.
- The graph refreshes with semantic memories like:

```txt
User name is Alex
User uses TypeScript
User prefers dark mode
```

Then test memory updates:

```txt
Actually, I prefer light mode now.
```

Expected:

- The old dark-mode memory is updated or replaced with the new light-mode preference.

## API Smoke Tests

Health check:

```powershell
Invoke-RestMethod http://localhost:4000/api/health
```

Sign up:

```powershell
Invoke-RestMethod `
  -Uri http://localhost:4000/api/auth/signup `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"name":"Alex","email":"alex@example.com","password":"password123"}'
```

Use the returned `access_token` as a Bearer token for chat:

```powershell
Invoke-RestMethod `
  -Uri http://localhost:4000/api/chat `
  -Method POST `
  -Headers @{ Authorization = "Bearer YOUR_ACCESS_TOKEN" } `
  -ContentType "application/json" `
  -Body '{"message":"I use TypeScript and React daily."}'
```

## Database Inspection

Open Prisma Studio:

```bash
bun run db:studio
```

Important tables:

```txt
users
refresh_tokens
user_api_keys
chat_messages
conversations
messages
memories
conversation_summary
provider_settings
```

## Useful Commands

```bash
bun run typecheck
bun run build
bun run prod:check
bun run db:generate
bun run db:migrate
bun run db:deploy
bun run db:status
bun run db:studio
bun run dev:api
bun run dev:web
bun run start
bun run chat
```

## Production Checklist

- Use a fresh Neon project/database with no copied development users, chat messages, or memories before a public launch.
- Set `NODE_ENV="production"`, `WEB_ORIGIN` to the deployed frontend URL, and `VITE_API_URL` to the deployed API URL.
- Set `CORS_ORIGINS` to the deployed frontend origin. Add multiple origins as a comma-separated list only when needed.
- Set `TRUST_PROXY="1"` if the API runs behind a trusted reverse proxy/load balancer that terminates HTTPS.
- Set `ADMIN_EMAILS` to the owner/admin account emails that may read or update global provider settings.
- Use long random values for `JWT_SECRET_KEY` and `ENCRYPTION_KEY`; keep them different.
- Keep `OPENROUTER_API_KEY` available only on the API server for the free-tier system key.
- Run `bun run db:deploy` during deployment. Do not run `bun run db:migrate` against a populated production Neon database.
- Run `bun run prod:check` before shipping a release.
- Stop local dev servers before running `bun run build` on Windows so Prisma can regenerate its query engine file.
- Add an external process manager/reverse proxy for deployment, such as PM2/systemd plus HTTPS termination.

## Troubleshooting

### `401 Not authenticated`

Sign in again. The dashboard stores access and refresh tokens in browser local storage, matching the old app.

### No memories appear

Check:

- Provider settings are saved.
- API key is valid.
- Database migration completed.
- Chat message contains stable facts worth remembering.

### Vite uses another port

If `5173` is busy, Vite chooses another port. Use the URL printed in the terminal.

### Prisma engine file lock on Windows

Stop running dev servers before rebuilding:

```powershell
Get-CimInstance Win32_Process | Where-Object { $_.Name -like 'bun*' }
```

Then close or stop the relevant Bun processes and rerun:

```bash
bun run build
```
