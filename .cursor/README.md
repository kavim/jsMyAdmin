# .cursor/ — AI Configuration

Cursor-specific config for Spec Driven Development on Elendra.

## Structure

```
.cursor/
├── rules/                    # Auto-injected context rules
│   ├── spec-driven.mdc       # SDD workflow (always)
│   ├── elendra-core.mdc      # Project conventions (always)
│   ├── memory-evolution.mdc  # Memory update triggers (always)
│   ├── client-react.mdc      # React patterns (client files)
│   └── server-express.mdc    # Express patterns (server files)
└── skills/
    ├── spec-driven-dev/      # Feature spec workflow
    ├── update-memory/        # Post-work memory updates
    └── jsmyadmin/            # Domain knowledge
```

## For developers

### Starting a new feature

In Cursor chat:
```
Use spec-driven-dev skill. Create spec for [feature description].
```

After approval:
```
Implement docs/specs/features/[name].md. Update memory when done.
```

### Evolving rules

When a pattern repeats 3+ times → add to `docs/memory/PATTERNS.md`.
When it affects all sessions → consider new rule in `.cursor/rules/`.
Keep rules under 50 lines, one concern per file.

### Evolving memory

After each merged feature:
```
Use update-memory skill for [feature name].
```

## Rules vs Skills vs Memory

| Layer | Purpose | Updates |
|-------|---------|---------|
| Rules | How to work (workflow, conventions) | Rarely |
| Skills | Step-by-step procedures | When workflow changes |
| Memory | What exists now (STATE, patterns, ADRs) | Every feature |
| Specs | What to build next | Per feature |

## Legacy files

`jsmyadmin/prompt.md` and `skill.json` — kept as backup. Prefer `jsmyadmin/SKILL.md`.
