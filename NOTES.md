# Community Forum — Saved Posts

## Setup

```bash
# Prerequisites: Bun v1.1+ and Node.js v18+

# Install dependencies
cd server && npm install
cd ../web && npm install

# Create schema and seed data
cd ../server
bun run db:migrate
bun run db:seed

# Start the API (port 4000)
bun run dev

# In a new terminal — start the UI (port 3000)
cd web
npm run dev

# Run tests
cd server
bun test
```

## Key Design Decisions

### Database Schema

I chose **SQLite + Drizzle ORM** (`bun:sqlite` driver) to eliminate infrastructure setup. The key table is `saved_posts`:

```
saved_posts
├── id          TEXT PK
├── user_id     TEXT FK → users
├── post_id     TEXT FK → posts
├── active      INTEGER (boolean) — soft-delete flag
├── created_at  TEXT
├── updated_at  TEXT
└── UNIQUE(user_id, post_id) — prevents duplicate rows
```

**Why this shape:**
- The `UNIQUE(user_id, post_id)` constraint guarantees no duplicate saves at the database level
- `active` column enables soft delete: unsave sets `active=0`, re-save sets `active=1`
- `updated_at` tracks when the save state last changed, used for "most-recently-saved" ordering
- History is preserved — un-saving never deletes the row

### Business Logic Layer

The core save/unsave logic lives in `resolveToggle()` — a **pure function** that determines the next action based on the current state:

- No existing record + save → `create`
- Inactive record + save → `activate` (reactivate, not duplicate)
- Active record + save → `noop` (idempotent)
- Active record + unsave → `deactivate`
- No/inactive record + unsave → `noop`

This function is **testable without a database** — it's pure input/output.

### Authorization

Auth is **stubbed via request headers** (`x-user-id`, `x-user-role`) using an Elysia middleware that runs before every route. The middleware:

1. Returns **401** if headers are missing
2. Passes the user object to route handlers
3. Route handlers check enrollment for **403** (students only — moderators bypass)
4. Route handlers return **404** for missing posts

The saved list endpoint **only returns the current user's saves** — there's no way to query another user's list (the OWN rule).

### Efficient hasSaved / savesCount Hydration

Instead of N+1 queries, the `hydratePostFlags()` function does a **single batch query** for all save records across the post list, then builds maps for counts and per-user flags. This scales well even with pagination.

### Client Data Layer

- **React Query v5** manages all server state
- **Optimistic updates** on bookmark toggle — the UI updates immediately, then refetches to confirm
- **Query key factory** centralizes cache keys for easy invalidation
- On mutation error, previous data is **rolled back**

### UI Architecture

- **Presentation components** (`PostCard`, `BookmarkButton`) receive data as props — no data fetching inside
- **Page components** handle data fetching via hooks
- **Providers** wrap the app with React Query, i18n, and auth context
- Loading states, error states, and empty states are all handled

### i18n

- Two locales: **English** and **Spanish**
- Strings externalized in JSON message catalogs
- Custom ICU-style plural formatter handles "1 save" vs "12 saves" correctly
- Language toggle in the navbar switches instantly (client-side)

## Trade-offs & Descoped Items

- **SQLite over PostgreSQL**: Chose SQLite to avoid Docker/Postgres setup. For production, the Drizzle schema maps 1:1 to Postgres with minimal changes.
- **No real authentication**: Used header-based stubs as instructed. In production, this would be JWT or session-based.
- **No comments/likes**: The assessment focuses on the bookmark feature, so I kept the post model minimal.
- **Client-side i18n**: Used a simple context-based approach rather than `next-intl` server components for simplicity.
- **No SSR for data**: Pages are `"use client"` for React Query integration. Could optimize with server components + prefetching.

## What I'd Do Next (With Another Day)

1. **Add real pagination UI** with page numbers, not just prev/next
2. **Server-side rendering** with React Query prefetching for faster initial load
3. **Playwright E2E tests** covering the full save/unsave flow in the browser
4. **Comments and likes** on posts to make the forum more complete
5. **Rate limiting** on the save endpoint to prevent abuse
6. **Database indexes** on `saved_posts(user_id, active)` and `posts(course_id, deleted_at)` for query performance
7. **Docker Compose** setup with PostgreSQL for production-like deployment
8. **Proper error boundaries** in React for graceful error handling
