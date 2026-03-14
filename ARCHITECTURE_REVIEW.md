# Architecture & Quality Review — Podcast Hub

**Date:** 2026-03-14
**Status:** Late-stage development review

---

## Current Strengths

Your codebase has solid fundamentals:

- **TypeScript strict mode** with Zod runtime validation — no `any` types
- **Supabase Auth + RBAC** (public/admin/superadmin) with Row-Level Security on all tables
- **Centralized API error handling** via `lib/api/error-response.ts`
- **Database migrations** (11 files) with pgvector for semantic search
- **CI/CD pipeline** — GitHub Actions → Docker → Azure Container Apps
- **Clean separation** — App Router route groups, server/client components, schema validation

---

## Critical Gaps & Action Items

### 1. Testing (Priority: CRITICAL)

**Current state:** Zero tests. No test framework installed.

**Recommended stack:**
- **Vitest** — fast, native ESM/TypeScript, works with Next.js
- **React Testing Library** — component testing
- **MSW (Mock Service Worker)** — API mocking for integration tests

**What to test first (highest ROI):**

| Layer | What to test | Why |
|-------|-------------|-----|
| Schemas | Zod validation (valid + invalid inputs) | Pure logic, easy to test, catches regressions |
| API routes | Auth checks, validation, error responses | Prevents security regressions |
| Utilities | `error-response.ts`, `upload.ts`, `utils.ts` | Pure functions, quick wins |
| Components | Forms, role-gated UI | Catches UI regressions |

**CI integration:** Add `npm test` step to `.github/workflows/ci.yml` between lint and build.

---

### 2. Pre-commit Hooks (Priority: HIGH)

**Install:**
```bash
npm install -D husky lint-staged prettier
npx husky init
```

**`.husky/pre-commit`:**
```bash
npx lint-staged
```

**`package.json` addition:**
```json
"lint-staged": {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md,css}": ["prettier --write"]
}
```

---

### 3. Error Boundaries (Priority: HIGH)

Add a React error boundary at the layout level to catch client-side crashes gracefully instead of showing a white screen.

**Location:** `components/error-boundary.tsx` wrapping children in `app/layout.tsx`

Next.js also supports `error.tsx` files per route segment — add these to critical routes like `/(admin)` and `/(public)`.

---

### 4. Structured Logging (Priority: MEDIUM)

Replace `console.error()` with a structured logger.

**Recommended:** `pino` (lightweight, JSON output, works in Edge/Node)

```typescript
// lib/logger.ts
import pino from 'pino'
export const logger = pino({ level: process.env.LOG_LEVEL || 'info' })
```

Benefits: JSON logs → queryable in Azure Log Analytics, add request IDs for tracing.

---

### 5. API Pagination (Priority: MEDIUM)

All list endpoints (`GET /api/podcasts`, `/api/learning-graphs`, etc.) return all rows. This will degrade as data grows.

**Pattern:**
```typescript
const page = parseInt(searchParams.get('page') || '1')
const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
const offset = (page - 1) * limit

const { data, count } = await supabase
  .from('podcasts')
  .select('*', { count: 'exact' })
  .range(offset, offset + limit - 1)
```

---

### 6. Rate Limiting (Priority: MEDIUM)

No rate limiting on API routes — vulnerable to abuse, especially the upload endpoint.

**Options:**
- **Middleware-level:** Use Vercel/Azure built-in rate limiting
- **Application-level:** `next-rate-limit` or custom middleware with in-memory/Redis store
- **Critical endpoints:** `/api/upload`, `/api/podcasts` (POST), `/api/users` (POST)

---

### 7. Monitoring & Error Tracking (Priority: MEDIUM)

**Recommended:** Sentry (free tier covers most needs)

```bash
npx @sentry/wizard@latest -i nextjs
```

Gives you: error tracking, performance monitoring, session replay, source maps.

---

### 8. Code Formatter (Priority: LOW)

No Prettier configured. Add it to prevent style drift:

```bash
npm install -D prettier
echo '{ "semi": false, "singleQuote": true, "trailingComma": "es5" }' > .prettierrc
```

---

### 9. Documentation (Priority: LOW)

- Update `README.md` with: project overview, setup instructions, environment variables, architecture diagram
- Consider OpenAPI/Swagger for the 14 API endpoints
- Add `CONTRIBUTING.md` if others will work on this

---

## Recommended Implementation Order

1. **Set up Vitest** + write tests for Zod schemas and error-response helpers (1-2 hours)
2. **Add error boundaries** — `error.tsx` in route groups (30 min)
3. **Install husky + lint-staged + prettier** (30 min)
4. **Add pagination** to list endpoints (1-2 hours)
5. **Add Sentry** for error tracking (30 min)
6. **Add structured logging** with pino (1 hour)
7. **Add rate limiting** to write endpoints (1 hour)
8. **Update documentation** (ongoing)

---

## Files Referenced

| File | Role |
|------|------|
| `lib/api/error-response.ts` | Centralized error handling (testable) |
| `lib/schemas/learning-graph.ts` | Zod validation schemas (testable) |
| `lib/supabase/server.ts` | Supabase server client |
| `proxy.ts` | Auth middleware |
| `.github/workflows/ci.yml` | CI pipeline (add test step) |
| `app/layout.tsx` | Root layout (add error boundary) |
