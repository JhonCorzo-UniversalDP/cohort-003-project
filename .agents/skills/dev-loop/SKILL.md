---
name: dev-loop
description: Structured development workflow: plan, implement, validate with type checking and tests, then commit. Use when starting a new feature, bug fix, or task and the user wants to plan out the work, implement it, run pnpm type-check and pnpm run test in a feedback loop until passing, and finally commit. Triggers on "plan and implement", "build and commit", "plan out the work", or any request to follow a structured dev workflow.
---

# Dev Loop

End-to-end workflow: plan → implement → validate → commit.

## Workflow

### 1. Plan
- Use EnterPlanMode to present an implementation plan
- Identify files to create or modify
- Define acceptance criteria and expected behavior
- Get user sign-off before writing any code

### 2. Implement
- Apply changes incrementally, one concern at a time
- Follow existing code conventions in the repo
- Keep changes scoped to the task — no unrelated cleanup

### 3. Validate (repeat until clean)
After each meaningful change, run:
```bash
pnpm type-check    # fix all type errors first
pnpm run test      # then fix failing tests
```
- Fix type errors before addressing test failures
- Re-run both commands after each fix
- Do not proceed to commit while either command fails

### 4. Commit
- Stage only files relevant to the task
- Write a commit message focused on *why*, not just what
- Use the `/commit` skill for guided commit creation
- Never skip hooks (`--no-verify`)
