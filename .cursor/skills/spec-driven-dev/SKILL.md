---
name: spec-driven-dev
description: Guides Spec Driven Development workflow for Elendra. Use when starting a new feature, refactoring, planning work, writing feature specs, or when the user mentions SDD, spec, specification, or "spec driven".
---

# Spec Driven Development

## Workflow

```
1. Context  → Read AGENTS.md + docs/memory/STATE.md
2. Spec     → Find or create docs/specs/features/<name>.md
3. Approve  → User confirms spec (status: approved)
4. Build    → Implement only what spec defines
5. Verify   → Code matches acceptance criteria
6. Memory   → Run update-memory skill
```

## Step 1: Gather context

Read in order:
1. `AGENTS.md`
2. `docs/memory/STATE.md`
3. `SPEC.md` (relevant sections only)
4. Existing feature spec if any

## Step 2: Create feature spec

Copy template from [feature-spec-template.md](feature-spec-template.md) to:
```
docs/specs/features/<kebab-case-name>.md
```

Fill all sections. Mark uncertain items with `TBD` and ask user.

### Spec must include
- **Problem** — why this exists
- **Scope** — in/out of scope
- **API changes** — endpoints, payloads, WS events
- **UI changes** — pages, components, user flow
- **Files affected** — explicit file list
- **Acceptance criteria** — testable checkboxes
- **Status** — draft | approved | in-progress | implemented

## Step 3: Implementation

- Set spec status → `in-progress`
- Touch only files in "Files affected"
- Follow `.cursor/rules/client-react.mdc` or `server-express.mdc`
- If scope grows → update spec first, then code

## Step 4: Verification

Check each acceptance criterion. Mismatch → fix code or update spec with user approval.

## Step 5: Close

- Spec status → `implemented`
- Invoke `update-memory` skill

## When to skip full spec

Trivial fixes (typo, one-line bug) — no spec needed. Still update STATE if behavior changes.

## Naming

Feature specs: `docs/specs/features/<verb>-<noun>.md`
Examples: `add-export-csv.md`, `fix-query-timeout.md`, `refactor-auth-middleware.md`
