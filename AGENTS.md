---
teamwerx:
  version: "1.0.0"
  initialized: "2025-10-25"
---

# teamWERX Agent Instructions

AI agents: Use teamWERX commands to coordinate goal-based development with the developer.

## Workspace Architecture

All goals have a numbered workspace under `.teamwerx/goals/<number>-<slug>/` containing:

- `discuss.md` - Discussion log with numbered entries (D01, D02, ...) and reflections (R01, R02, ...)
- `plan.json` - Task plan with numbered tasks (T01, T02, ...)
- `research.md` - Research report with tech stack, business context, and project insights
- `implementation/` - Implementation records (T01.md, T02.md, ...)
- `summary.md` - Knowledge summary (optional; maintained manually)

## Commands (Go CLI)

Use the Go CLI commands below. Workspace flags (optional; defaults shown):
- `--specs-dir` `.teamwerx/specs`
- `--goals-dir` `.teamwerx/goals`
- `--changes-dir` `.teamwerx/changes`

Tip: set `TEAMWERX_CI=1` to disable prompts in automation.

### `teamwerx spec list`
List available spec domains.

### `teamwerx spec show <domain>`
Show details for a spec domain.

### `teamwerx plan add --goal <goal-id> "<task>"`
Append a task to `.teamwerx/goals/<goal-id>/plan.json`. Creates the file if missing.

### `teamwerx plan list --goal <goal-id>`
List tasks for a goal’s plan.

### `teamwerx plan complete --goal <goal-id> --task <Txx>`
Mark a task as completed in the plan.

### `teamwerx plan show --goal <goal-id>`
Show a goal’s plan details.

### `teamwerx discuss add --goal <goal-id> "<message>"`
Append a discussion entry to `.teamwerx/goals/<goal-id>/discuss.md`.

### `teamwerx discuss list --goal <goal-id>`
List discussion entries for a goal.

### `teamwerx change list`
List changes found under `.teamwerx/changes`.

### `teamwerx change apply --id <change-id>`
Apply a change by ID (may detect spec divergence).

### `teamwerx change resolve --id <change-id>`
Interactively resolve divergence, then re-apply.

### `teamwerx change archive --id <change-id>`
Archive a change folder after it’s applied.

### `teamwerx completion [bash|zsh|fish|powershell]`
Generate shell completion scripts.

Note: Legacy Node-era commands (`goal`, `use`, `research`, `execute`, `complete`, `reflect`, `summarize`, `charter`, `archive`) are not implemented in the Go CLI. Manage these artifacts manually as needed. See `README.md` for details.

## Conventions

- Default goal status: `draft`
- Git commits: Manual, prefix `[teamWERX]`
- File naming: kebab-case
- Task statuses: pending | in-progress | completed
- Goal statuses: draft | open | in-progress | blocked | completed | cancelled | archived (derived from plan state)
- All commands are **non-destructive**: append to logs, create new entries, or add addenda instead of overwriting artifacts. Use git history for changes that must replace existing content.
- Workspace numbering: each goal gets a three-digit ID (`001`, `002`, ...), discussions use `Dxx`, tasks use `Txx`, reflections use `Rxx`. Preserve numbering when editing files manually.
