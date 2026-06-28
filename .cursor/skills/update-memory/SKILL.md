---
name: update-memory
description: Updates Elendra project AI memory after features, refactors, or architectural decisions. Use after completing work, when user says "update memory", "record decision", or when spec-driven-dev workflow finishes.
---

# Update Project Memory

Run after significant code changes to keep AI context accurate.

## Checklist

```
- [ ] docs/memory/STATE.md — implementation truth
- [ ] docs/memory/PATTERNS.md — new reusable patterns
- [ ] docs/memory/DECISIONS.md — non-obvious choices
- [ ] docs/specs/features/<name>.md — status → implemented
```

## STATE.md update rules

1. Read current STATE.md
2. Add new files/features under correct section (Client / Server / API / WS)
3. Remove entries for deleted files
4. Change `planned:` → implemented when done
5. Keep one line per entry: `path — brief purpose`

Example entry:
```
client/src/pages/ExportPage.tsx — CSV export UI
```

## PATTERNS.md update rules

Add only patterns that will repeat. Format:

```markdown
## [area] Pattern name

When: one-line trigger
Example: (minimal code from codebase)
```

Areas: `[client]`, `[server]`, `[api]`, `[socket]`, `[db]`

## DECISIONS.md update rules

Add ADR when choice affects future work:

```markdown
## ADR-NNN: Short title
**Date:** YYYY-MM-DD | **Status:** accepted | superseded
**Context:** Why decision was needed
**Decision:** What we chose
**Consequences:** Trade-offs
```

Increment NNN from last ADR in file.

## What NOT to update

- AGENTS.md — only for stack/layout changes affecting all sessions
- SPEC.md — only for major product vision shifts
- Do not duplicate full spec content into memory files

## Quick diff check

Before finishing, verify:
- Every new route appears in STATE.md API section
- Every new page appears in STATE Client section
- Feature spec acceptance criteria all checked
