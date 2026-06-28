# Feature Specs

Per-feature specifications for Spec Driven Development (SDD).

## Workflow

```
1. Copy template → docs/specs/features/<name>.md
2. Fill all sections, set Status: draft
3. Review with team/user → Status: approved
4. Implement (Cursor agent reads spec + rules)
5. Verify acceptance criteria
6. Status: implemented + update docs/memory/STATE.md
```

## Template

Use: `.cursor/skills/spec-driven-dev/feature-spec-template.md`

Or invoke skill: **spec-driven-dev**

## Naming

`docs/specs/features/<verb>-<noun>.md`

Examples:
- `add-csv-export.md`
- `implement-query-builder-ui.md`
- `fix-upload-large-files.md`

## Index

| Spec | Status | Description |
|------|--------|-------------|
| _(none yet)_ | — | Create first spec when starting next feature |

## Relationship to other docs

| Doc | Role |
|-----|------|
| `SPEC.md` | Product vision, full architecture target |
| `docs/specs/features/*.md` | Incremental feature work units |
| `docs/memory/STATE.md` | What is actually built right now |
| `AGENTS.md` | AI entry point, quick reference |

## Tips for AI sessions

Start prompt with:
```
Read docs/specs/features/<name>.md and implement per spec.
Follow .cursor/rules/ and update memory when done.
```

For new features without spec:
```
Use spec-driven-dev skill to create spec for [feature], then implement.
```
