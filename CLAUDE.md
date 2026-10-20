# Planck

Kanban task tracker (boards → columns → tasks → subtasks) with shared boards. pnpm workspace: `client/` (React SPA) + `server/` (Express API).

## Commands

```bash
pnpm dev                      # client (5173) + server (3000) concurrently
pnpm client | pnpm server     # one side only

# client/
pnpm build                    # tsc -b && vite build
pnpm test:run                 # vitest (jsdom unit tests in src/test)
pnpm storybook

# server/
npx tsc --noEmit -p .         # typecheck (dev server runs with --transpile-only, so it won't catch type errors)
npx prisma migrate dev --name <name>   # new migration after editing schema.prisma
npx prisma migrate deploy     # apply pending migrations
npx prisma generate
npx prisma db seed
```

Env: `server/.env` (`JWT_SECRET`, `RP_ID`, `ORIGIN`, `PORT`, optional `DB_PATH`), `client/.env` (`VITE_API_URL`). See README.

## Deploy — be careful

Push to `master` auto-deploys to production (`.github/workflows/main.yml` → SSH → `git pull && bash deploy.sh`). Don't commit/push to master without explicit request.

`server/.gitignore` ignores `prisma/migrations`, yet some migrations are tracked — new migration folders must be added with `git add -f`. Production has real users: migrations must be additive and backfill existing rows (see `20261020120000_board_members`); never drop/recreate the DB.

## Server (`server/src`)

- Express 5 (async throws reach `middleware/errorHandler.ts`). Throw `AppError(status, message)` for HTTP errors; Zod `.parse()` errors become 400 automatically.
- Prisma 7 + SQLite via `@prisma/adapter-better-sqlite3` (`db/client.ts`). Schema: `prisma/schema.prisma`, snake_case columns via `@map`.
- Routes: `auth.ts` (public, mounted before `authMiddleware`), then `boards.ts` (`/api/boards` — list, CRUD, members), `board.ts` (`/api/board` — board contents, column/task moves), `column.ts`, `tasks.ts`. Request bodies are validated with schemas in `schemas/`.
- **Access control**: every route touching a board/column/task/subtask must call a guard from `utils/access.ts` (`requireBoardMember`, `requireBoardOwner`, `requireColumnAccess`, `requireTaskAccess`, `requireSubtaskAccess`). Inaccessible resources respond 404.
- **Soft delete**: entities have `deletedAt`; always filter `deletedAt: null`. Deleting/restoring cascades manually in a `$transaction`.
- **Ordering**: float `order` with gaps of 1000; `utils/order.ts` (`calculateOrder`, `rebalanceIfNeeded`) renumbers when the gap gets < 1.

### Multi-user model

- `BoardMember(boardId, userId, role, order)` — who has access. The creator gets `role: "owner"`; invited users `"member"`. `order` is the per-user sidebar order (`Board.order` is legacy and no longer used for sorting).
- Owner: delete/restore board, invite (`POST /boards/:id/members {username}`), remove (`DELETE /boards/:id/members/:userId`). Members: edit board contents, rename, leave (DELETE with own id). The owner can't leave.
- `GET /boards` returns boards with `role` and `_count.members`; `GET /board/:id` also returns `members[]`.

### Realtime

- Server-Sent Events: `GET /api/events?clientId=…` (`realtime/events.ts`, in-memory hub — single server process; switch to Redis pub/sub if it ever runs in several instances). Heartbeat every 25s, `X-Accel-Buffering: no` for nginx.
- Every mutating route calls `notifyBoard(req, boardId)` after the DB write (event `board`). Membership/visibility changes send `boards` (`notifyUsers` for a removed user). **New mutating routes must notify too.**
- Each tab sends `X-Client-Id` (`CLIENT_ID` in `shared/api/apiClient.ts`); the originating tab is skipped, it already applied the change optimistically.
- Client: `useBoardLiveUpdates()` (in `DashboardPage`) invalidates `['board', id]` / `['boards']`. Invalidation is deferred while `dragLock` is active (call `dragLock.begin/end` in every DnD start/end handler) or a mutation is in flight. On reconnect everything is refetched.

### Auth

- JWT in httpOnly cookie `token` (30d, auto-refreshed in `middleware/auth.ts`), `req.userId` set by middleware.
- Sign-up is by **username + password** (`/auth/register/password`, scrypt hashes in `utils/password.ts`). Sign-in: password (`/auth/login/password`) or passkey (`/auth/login/begin|complete`, `@simplewebauthn/server`).
- Passkeys are attached to an existing account from settings (`/auth/passkey/begin|complete`, authed). Older accounts may be passkey-only (`passwordHash = null`) and can set a password via `POST /auth/password`.
- WebAuthn challenges: `db/challengeStore.ts` (Redis in production, in-memory otherwise).
- `/auth/me` and every auth response return `{ id, username, displayName, hasPassword, passkeys }` (`loadAuthUser`).

## Client (`client/src`)

- React 19, Vite, TypeScript, react-query **v3**, @dnd-kit, GSAP animations, Sass modules, i18next (en/ru).
- Feature-Sliced Design layers: `pages` → `widgets` → `features` → `entities` → `shared`. Import only downward; features don't import other features (pass slots/props via widgets, e.g. `SidebarFooter actions`). Path alias `@/` = `src/`.
- `entities/*/api/*.api.ts`: objects of react-query hooks (`boardApi.useGetBoard`, `useRename`, …) built on `shared/api/apiClient.ts` `api()` (returns `null` on 401, throws `Error(message)` with the server's `error` text). Mutations are optimistic: snapshot in `onMutate`, rollback in `onError`. Query keys: `['boards']`, `['board', id]`, `'me'`.
- Components live in `components/Name/Name.tsx` + `name.module.sass`; logic in `utils/useXxx.ts` hooks. Feature public API via `index.ts`.
- Styling: always use tokens from `shared/styles/_variables.sass` (`$background`, `$font-choose`, `$background__choose`, `$border`, spacing `$xs…$xxxl`, `@include shadow`). Light/dark themes are CSS variables — never hardcode colors (except white text on colored chips). Common patterns: muted uppercase 12px section labels, `$background__choose`/`$font-choose` accent buttons, popovers via `shared/lib/usePopover.ts` (GSAP fade/scale, outside click + Escape).
- Shared UI: `shared/components/avatar` (initial + color from the board palette), `recover` (undo toast), `toggleTheme`.
- All user-facing strings go through `t()`; add keys to both `i18n/locales/en.json` and `ru.json`. Server error messages are mapped to i18n keys in hooks (`ERROR_KEYS`).
- Code comments are in Russian; keep that.

## Known issues

- `pnpm lint` is broken: `"@feature-sliced"` in `client/eslint.config.js` isn't a valid flat-config entry.
- `src/stories/` (Storybook boilerplate) fails `tsc -b` with unused `React` imports.
