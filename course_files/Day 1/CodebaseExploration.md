# Cadence Codebase Exploration — Full Conversation
Date: 2026-04-01

---

## User
Tell me what the tech stack of this repo is and what its intended purpose is.

## Assistant

**Cadence** is a full-stack **online course platform** (think Udemy-like) built as a teaching repo for the "AI Coding for Real Engineers with Claude Code" cohort.

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React Router v7 (SSR), TypeScript, Tailwind CSS 4, shadcn/ui, Radix UI |
| **Backend** | React Router Node (file-based routing in `/app/routes`) |
| **Database** | SQLite via better-sqlite3, Drizzle ORM |
| **Testing** | Vitest |
| **Build** | Vite 7, pnpm |
| **Other** | Monaco Editor, Zod validation, Shiki syntax highlighting |

### Core Features

- User auth with roles (Student, Instructor, Admin)
- Course management with modules, lessons, and video streaming
- Quiz system (multiple-choice, true/false)
- Purchase/enrollment system with coupon and PPP support
- Progress tracking and video watch events
- Admin and instructor dashboards
- Team management

### Key Directories

- `/app/routes` — 30+ file-based route handlers
- `/app/services` — 23 service files with tests
- `/app/db` — Drizzle ORM schema and migrations
- `/app/components` — React + shadcn/ui components
- `/scripts` — Database seeding

---

## User
I've just entered the working team for this project. Introduce me to the project, tell me about the architecture of it, the coding practices the team have and highlight the most relevant files or concept that you consider I should check by myself.

## Assistant

Welcome to the team! Here's your onboarding guide to **Cadence**.

---

### What is Cadence?

Cadence is a **full-stack online course platform** (think Udemy). Users can browse courses, purchase them, watch video lessons, track progress, and take quizzes. There are three roles: **Student**, **Instructor**, and **Admin** — each with their own views and capabilities.

---

### Architecture Overview

The app follows a **server-side rendered fullstack** pattern using React Router v7 (the spiritual successor to Remix):

```
app/
├── routes/          ← Page-level components with loaders/actions (the "controllers")
├── services/        ← Business logic & DB queries (the "model" layer)
├── db/              ← Drizzle ORM schema + database connection
├── lib/             ← Shared utilities (session, validation, PPP pricing, markdown)
├── components/      ← React components (custom + shadcn/ui)
├── test/            ← Test infrastructure (in-memory DB setup)
└── routes.ts        ← Central route definitions
```

**Data flow for a page request:**
1. A **route file** (e.g., `routes/courses.$slug.tsx`) defines a `loader` function that runs server-side
2. The loader calls **service functions** (e.g., `courseService.getCourseBySlug()`) to query the DB
3. The route's React component receives the loader data and renders the UI
4. Mutations use `action` functions (form submissions) that call service write functions

---

### Coding Practices

**Services pattern:** Each domain entity has a dedicated service file with pure functions that use Drizzle ORM directly. They use **positional parameters** (not option objects). Example from `courseService.ts:16`:
```ts
export function getAllCourses() {
  return db.select().from(courses).all();
}
```

**Testing:** Tests use **in-memory SQLite databases** — each test gets a fresh DB via `createTestDb()` in `app/test/setup.ts`. The `~/db` module is mocked with `vi.mock` so service functions hit the test DB. No external services or mocks needed.

**Auth:** Cookie-based sessions via `app/lib/session.ts`. The `getCurrentUserId()` helper extracts the user from the request cookie. There's a dev-only user switcher for local development.

**No CLAUDE.md exists** — there are no documented team conventions beyond what the code itself shows.

---

### Key Files to Read First

| File | Why |
|------|-----|
| `app/db/schema.ts` | The entire data model — 14 tables covering users, courses, modules, lessons, enrollments, quizzes, purchases, teams, coupons, and video tracking |
| `app/routes.ts` | The complete route map — shows every page and API endpoint at a glance |
| `app/services/courseService.ts` | The canonical example of how services are written — read this and you'll understand the pattern for all services |
| `app/services/courseService.test.ts` | Shows the testing pattern: `createTestDb()` + `seedBaseData()` + `vi.mock` |
| `app/routes/courses.$slug.tsx` | A representative route — shows the loader/component pattern with auth, error handling, and UI composition |
| `app/test/setup.ts` | The test harness — `createTestDb` and `seedBaseData` are used everywhere |
| `app/lib/session.ts` | How auth works — cookie sessions, user ID storage, dev country override |
| `app/lib/ppp.ts` | Purchasing Power Parity pricing logic — an interesting domain-specific piece |

---

### Quick Commands

- `pnpm dev` — start the dev server
- `pnpm test` — run all tests
- `pnpm db:seed` — seed the database with sample data
- `pnpm typecheck` — full TypeScript check
- `pnpm db:generate` — generate Drizzle migrations after schema changes

---

## User
I've heard a colleague talk about a tool called Ably, is it used in this project?

## Assistant

No, Ably is not used in this project. There are no dependencies on Ably in `package.json`, and the app doesn't use any real-time/WebSocket communication. Cadence is a traditional request-response SSR app — pages load via React Router loaders and mutations happen through form actions.

---

## User
Going back to the tech stack, I want you to explain me how the different technologies from the Frontend layer interact the one between each other, then give me more context about the technologies: Monaco Editor, Zod validation, Shiki syntax highlighting

## Assistant

### How the Frontend Technologies Interact

Think of it as a layered stack where each technology has a clear role:

```
User sees the page
       │
       ▼
┌─────────────────────────────────────────────────┐
│  React (v19) — Component tree, state, rendering │
│    ├── React Router v7 — SSR, loaders, actions  │
│    │     └── Zod — validates form/param data     │
│    │         inside loaders and actions           │
│    ├── shadcn/ui + Radix UI — Pre-built UI       │
│    │     └── Tailwind CSS — all styling           │
│    ├── Monaco Editor — rich markdown editing      │
│    └── Lucide React — icons                      │
└─────────────────────────────────────────────────┘
       │
       ▼ (server-side only)
┌─────────────────────────────────────────────────┐
│  marked — converts markdown to HTML              │
│    └── Shiki — syntax-highlights code blocks     │
└─────────────────────────────────────────────────┘
```

**React** is the foundation — everything renders as React components. **React Router v7** sits on top and controls the full request lifecycle: its `loader` functions fetch data server-side, and `action` functions handle form submissions. **Tailwind CSS** provides all styling — you won't find CSS files or styled-components, just utility classes. **shadcn/ui** provides pre-built components (buttons, cards, tabs, etc.) built on top of **Radix UI** primitives, all styled with Tailwind. **Lucide React** supplies the icons.

The key interaction point is inside **route files** — that's where all these technologies converge. A single route file like `instructor.new.tsx` will:
- Use **Zod** in the `action` to validate the form submission
- Use **shadcn/ui** components for the form inputs and layout
- Use **Tailwind** classes for spacing and styling
- Use **React Router** hooks (`useActionData`, `useNavigation`) for form state

---

### Deep Dive on the Three Technologies

#### Zod Validation

Zod is a **schema declaration and validation library**. In Cadence, it's the gatekeeper between user input and the backend. It's used in **19 route files** — essentially every route that accepts input.

The project centralizes its Zod patterns in `app/lib/validation.ts`, which provides three helpers:

- **`parseFormData(formData, schema)`** — takes raw `FormData` from a form submission, validates it against a Zod schema, and returns either the typed data or a field-error map. Used in `action` functions.
- **`parseParams(params, schema)`** — validates URL params (like `:courseId`). Throws a 400 if invalid.
- **`parseJsonBody(request, schema)`** — validates JSON request bodies from API endpoints.

A typical usage in a route looks like:
```ts
// Define shape
const newCourseSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  description: z.string().trim().min(1, "Description is required."),
  ...
});

// Validate in the action
const parsed = parseFormData(formData, newCourseSchema);
if (!parsed.success) return data({ errors: parsed.errors }, { status: 400 });
```

#### Monaco Editor

Monaco is the **same editor engine that powers VS Code**, embedded in the browser. In Cadence, it's used for one specific purpose: **instructors editing lesson content in Markdown**.

The implementation lives in `app/components/monaco-markdown-editor.tsx`. Key details:

- **Lazy loaded** — it's a heavy library (~2MB), so it's dynamically imported with `import("@monaco-editor/react")` only when needed, showing an empty placeholder while loading
- **Custom theme** — defines a `"cadence-dark"` theme that matches the app's dark UI
- **Prettier integration** — registers Prettier as the document formatter for Markdown, so Ctrl+S formats the content before saving
- **Used by instructors only** — it appears on lesson editing pages (`instructor.$courseId.lessons.$lessonId.tsx`)

Students never see Monaco. They see the *rendered* markdown output instead.

#### Shiki Syntax Highlighting

Shiki is a **syntax highlighter that produces pre-colored HTML** (unlike client-side highlighters that run in the browser). In Cadence, it runs **server-side only** in `app/lib/markdown.server.ts`.

The flow:
1. Lesson content is stored as Markdown in the database
2. When a student views a lesson, the server calls `renderMarkdown(content)`
3. **marked** parses the Markdown into HTML
4. For every code block (` ```typescript ... ``` `), Shiki takes over and produces syntax-highlighted HTML using the `github-dark` theme
5. The pre-highlighted HTML is sent to the browser — no client-side JS needed for highlighting

It supports 13 languages (TypeScript, JavaScript, JSON, Bash, HTML, CSS, TSX, JSX, SQL, YAML, Markdown, text, plaintext) and uses a singleton highlighter instance for performance.

---

**In summary:** Monaco and Shiki handle two sides of the same coin — Monaco lets instructors *write* markdown with code blocks, and Shiki makes those code blocks look good when students *read* them. Zod is the validation layer that sits between every user action and the database.

---

## User
Explain me the database schema of the project, create a visual representation so I can understand it better

## Assistant

### Schema at a Glance (14 tables)

**Core entities:**
- **users** — students, instructors, admins (distinguished by `role` enum)
- **categories** — course groupings (e.g. "Programming")
- **courses** — belongs to one instructor and one category; has status (draft/published/archived), price, and PPP toggle

**Course content (hierarchical):**
- **modules** — ordered sections within a course (`position`)
- **lessons** — ordered items within a module; hold markdown `content`, `videoUrl`, and optional `githubRepoUrl`

**Student activity:**
- **enrollments** — links a user to a course (with optional `completedAt`)
- **lesson_progress** — per-user, per-lesson status (not_started / in_progress / completed)
- **video_watch_events** — granular tracking of play/pause/seek events with timestamp positions

**Commerce:**
- **purchases** — records payment amount and country (for PPP pricing)
- **coupons** — redemption codes tied to a team purchase; each code is single-use (`redeemedByUserId`)

**Quizzes (4-table hierarchy):**
- **quizzes** → **quiz_questions** → **quiz_options** (the choices)
- **quiz_attempts** → **quiz_answers** (records which option was selected per question)

**Teams:**
- **teams** + **team_members** — group users with admin/member roles; linked to coupons for bulk course access

The main relationship chains to remember:
- `courses → modules → lessons → (quizzes, progress, video events)`
- `users → enrollments → courses`
- `teams → coupons → purchases`

Visual diagram saved to `schema-diagram.md` in the project root.

---

## User
How does PPP (Purchasing Power Parity) work in this repo? How does the React Router setup work specifically?

## Assistant

### How PPP Works

PPP lets instructors offer discounted prices to users in lower-income countries, preventing VPN abuse by locking discounted purchases to the country they were bought in.

#### 1. Country Detection (`app/lib/country.server.ts`)

Every request that needs pricing runs `resolveCountry(request)`, which tries three sources in order:

```
1. Dev session override  →  set via /api/set-dev-country (dev UI only)
2. Cloudflare CF-IPCountry header  →  auto-populated in production by Cloudflare
3. ip-api.com fallback  →  GeoIP lookup using X-Forwarded-For IP
```

If all fail → returns `null` → treated as Tier 1 (full price).

#### 2. Tier System (`app/lib/ppp.ts`)

Countries are hardcoded into 4 tiers:

| Tier | Discount | Example countries |
|------|----------|-------------------|
| 1 | 0% (full price) | US, UK, DE, JP, SG |
| 2 | 30% off | Brazil, Mexico, Poland, Turkey |
| 3 | 50% off | India, Colombia, South Africa, Vietnam |
| 4 | 70% off | Nigeria, Pakistan, Bangladesh, Egypt |

Any unlisted country defaults to Tier 1.

#### 3. Purchase Flow (`app/routes/courses.$slug.purchase.tsx`)

At checkout:
1. `resolveCountry()` detects the buyer's country
2. `calculatePppPrice(priceInCents, countryCode)` applies the discount: `price * (1 - discount)`
3. The purchase record stores the `country` at time of purchase

#### 4. Access Control (`checkPppAccess` in `ppp.ts`)

When a student tries to access a course they bought at a discount, the app checks:
- Is the course paid and PPP-enabled? If not → allow
- Was it a Tier 1 (full-price) purchase? → allow (no restriction)
- Is the current country **different** from the purchase country? → **block**

This prevents buying at 70% off in Nigeria and then accessing from Germany.

---

### How React Router v7 Works in This Project

React Router v7 is a **full-stack framework** — it handles both the server and client. Think of it as Remix, because it effectively is (Remix was merged into React Router v7).

#### The Setup Chain

```
vite.config.ts
  └── reactRouter() plugin  ← turns Vite into a full-stack server
        └── app/routes.ts   ← central route registry
              └── app/root.tsx  ← top-level HTML shell
                    └── route files in app/routes/
```

**`vite.config.ts`** has three plugins:
- `reactRouter()` — the core plugin that enables SSR, loaders, and actions
- `tailwindcss()` — Tailwind v4 via Vite plugin (no `tailwind.config.js` needed)
- `tsconfigPaths()` — enables the `~/` alias (maps to `app/`) so you can write `import { db } from "~/db"` anywhere

#### Route Registration (`app/routes.ts`)

Routes are defined **programmatically** (not by file-system convention):

```ts
export default [
  index("routes/home.tsx"),                          // GET /
  layout("routes/layout.app.tsx", [                  // shared layout wrapper
    route("dashboard", "routes/dashboard.tsx"),       // GET /dashboard
    route("courses/:slug", "routes/courses.$slug.tsx"), // GET /courses/my-course
    ...
  ]),
  route("api/video-tracking", "routes/api.video-tracking.ts"), // POST /api/video-tracking
] satisfies RouteConfig;
```

The `layout()` call means all nested routes share the shell in `layout.app.tsx` (the sidebar, nav, etc.) without re-rendering it on navigation.

#### Route File Anatomy

Each route file can export up to three things:

```ts
// 1. loader — runs SERVER-SIDE on GET, feeds data to the component
export async function loader({ params, request }: Route.LoaderArgs) {
  const course = getCourseBySlug(params.slug);
  if (!course) throw data("Not found", { status: 404 });
  return { course };
}

// 2. action — runs SERVER-SIDE on form POST/PUT/DELETE
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  // validate, mutate DB, redirect...
}

// 3. default export — the React component, receives loader data
export default function CoursePage({ loaderData }: Route.ComponentProps) {
  const { course } = loaderData; // fully typed from loader return
  return <div>{course.title}</div>;
}
```

#### Type Safety

React Router generates types automatically via `pnpm typecheck` (runs `react-router typegen`). The `Route` types imported at the top of each file (e.g. `import type { Route } from "./+types/courses.$slug"`) are auto-generated, giving you end-to-end TypeScript safety from loader return → component props.

#### `root.tsx` — The HTML Shell

`root.tsx` is the outermost wrapper rendered for every request. It:
- Outputs the full `<html>` document with `<head>` and `<body>`
- Injects an inline script that sets dark mode before React hydrates (prevents flash)
- Renders a top-of-page loading bar using `useNavigation()` during client-side navigations
- Defines the global `ErrorBoundary` (404s, 500s) shown when any route throws
