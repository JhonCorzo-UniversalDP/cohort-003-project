---
name: do-work
description: "Execute a unit of work end-to-end: plan, implement, validate with typecheck and tests, then commit. Use when user wants to do work, build a feature, fix a bug, or implement a phase from a plan."
---

# Do Work

Execute a complete unit of work: plan it, build it, validate it, commit it.

## Workflow

### 1. Understand the task

Read any referenced plan or PRD. Explore the codebase to understand the relevant files, patterns, and conventions. If the task is ambiguous, ask the user to clarify scope before proceeding.

### 2. Plan the implementation (optional)

If the task has not already been planned, create a plan for it.

### 3. Implement

Work through the plan step by step.

**Backend code: use red-green-refactor, one test at a time.**

For every backend unit (service function, API route, utility), follow this loop before moving to the next piece:

1. **Red** — write one test that covers the next behavior. Run `pnpm run test` and confirm it fails.
2. **Green** — write the minimum implementation to make that test pass. Run `pnpm run test` and confirm it passes.
3. **Refactor** — clean up if needed, re-run to stay green.
4. Repeat for the next behavior.

Work in tracer-bullet slices: pick the thinnest vertical behavior (e.g., "create a notification"), get it end-to-end green, then layer the next behavior on top.

**Frontend code: skip TDD.**

The test suite only covers backend code. Frontend code (components, loaders, UI) changes too fluidly during development for test-first to be practical — implement it directly.

### 4. Validate

Run the feedback loops and fix any issues. Repeat until both pass cleanly.

```
pnpm run typecheck
pnpm run test
```

### 5. Commit

Once typecheck and tests pass, commit the work.
