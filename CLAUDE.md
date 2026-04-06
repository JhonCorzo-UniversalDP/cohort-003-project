# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cadence is a full-stack course platform (like a mini-Udemy) built with React Router v7 (SSR), TypeScript, SQLite, and Drizzle ORM. It's part of the "AI Coding for Real Engineers with Claude Code" cohort.

## Commands

| Task | Command |
|------|---------|
| Dev server | `pnpm dev` (runs on port 80) |
| Build | `pnpm build` |
| Typecheck | `pnpm typecheck` |
| Run all tests | `pnpm test` |
| Watch tests | `pnpm test:watch` |
| Run single test | `pnpm vitest run app/services/courseService.test.ts` |
| DB migrate | `pnpm db:migrate` |
| DB seed | `pnpm db:seed` |
| Generate migration | `pnpm db:generate` |

## Architecture

**Stack**: React 19 + React Router 7 (SSR) + Tailwind CSS 4 + Drizzle ORM + SQLite (better-sqlite3) + Vitest

**Path alias**: `~/` maps to `./app/`

All source code lives in `app/`:

- **`routes/`** — File-based routing (React Router v7). Dynamic segments use `$param` convention. Routes handle both loader (data fetching) and action (mutations) in the same file. API routes are `api.*.ts` files.
- **`services/`** — Business logic layer. Each service accepts a `db` parameter (dependency injection) for testability. Services are the primary place for database queries and business rules.
- **`db/schema.ts`** — Single file with all Drizzle ORM table definitions. Uses SQLite with WAL mode and foreign keys enabled.
- **`components/ui/`** — shadcn/ui components (New York style). Don't modify these directly; use `npx shadcn` to add new ones.
- **`components/`** — Custom app components (sidebar, YouTube player, Monaco editor, etc.).
- **`lib/`** — Utilities: session management (cookie-based), PPP pricing logic, validation, markdown rendering.
- **`test/setup.ts`** — Provides `createTestDb()` (in-memory SQLite) and `seedBaseData()` for tests.

**Data flow**: Route loaders/actions → Services (with db injection) → Drizzle ORM → SQLite

**Domain model**: Categories → Courses → Modules → Lessons → Quizzes (with questions/options/attempts)

## Testing Patterns

Tests use in-memory SQLite databases via `createTestDb()` from `~/test/setup`. Each test gets a fresh database with migrations applied. Use `seedBaseData(db)` for common fixtures (user, instructor, category, course). Services are tested by passing the test db directly — no mocking.

## Database

- SQLite file at `./data.db` (gitignored)
- Migrations in `drizzle/` — generated via `pnpm db:generate`, applied via `pnpm db:migrate`
- Schema changes: edit `app/db/schema.ts`, then generate and run migrations
- Prices stored in cents (integers)
- Timestamps stored as ISO strings

## Formatting

Prettier: 2-space indent, 80-char width, semicolons, trailing commas (all), arrow parens always.
