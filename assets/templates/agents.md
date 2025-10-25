---
teamwerx:
  version: "1.0.0"
  initialized: "{{ INITIALIZED_DATE }}"
---


# teamWERX Agent Instructions

AI agents: Use teamWERX commands to coordinate goal-based development with the developer.

## Workspace Architecture

All goals have a numbered workspace under `.teamwerx/goals/<number>-<slug>/` containing:
- `discuss.md` - Discussion log with numbered entries (D01, D02, ...)
- `plan.md` - Task plan with numbered tasks (T01, T02, ...)
- `research.md` - Research report with tech stack and project insights
- `implementation/` - Implementation records (T01.md, T02.md, ...)
- `summary.md` - Knowledge summary (optional, created with `teamwerx summarize`)

## Commands

### `teamwerx goal [description]`
Create a new goal with automatic workspace setup. Prompts for success criteria. Saves goal file to `.teamwerx/goals/[kebab-case-title].md` and creates numbered workspace `.teamwerx/goals/00X-[slug]/` with discussion, plan, and research templates.

### `teamwerx research [goal-name] [--goal <goal>]`
Analyze the codebase and generate/update research report. Detects technology stack, languages, and directory structure. Updates `research.md` in goal workspace.

### `teamwerx discuss <message> [--goal <goal>]`
Append a numbered discussion entry (D01, D02, ...) with timestamp and content to the goal's discussion log. Non-destructive; preserves all prior entries.

### `teamwerx reflect [--goal <goal>] [--notes <text>]`
Add a reflection entry (R01, R02, ...) to capture learning and adaptations during execution. Records what worked, what didn't, and adjustments made.

### `teamwerx dry-run [--goal <goal>] [--notes <text>]`
Record a dry-run assessment in the discussion log, outlining expected file changes, risks, and dependencies.

### `teamwerx plan [considerations] [--goal <goal>] [--task <task>] [--interactive]`
Add numbered tasks (T01, T02, ...) to the goal plan. Use `--task` flag for individual tasks, `--interactive` for prompted entry, or no flags for AI-driven planning mode.

### `teamwerx execute [goal-name]`
Execute tasks from the plan:
1. Read plan, identify next pending task
2. Implement task (create/modify code files)
3. Update task status to completed in plan file
4. Prompt developer to commit

### `teamwerx collect [--goal <goal>] [--title <title>]`
Collect staged git changes. Adds a completed plan task and creates `implementation/TXX.md` with diff summary and details.

### `teamwerx summarize [--goal <goal>]`
Generate or update knowledge summary for the goal. Distills key decisions, reusable patterns, and gotchas from discussions and implementations into `summary.md`.

### `teamwerx charter`
Generate/refresh `.teamwerx/goals/charter.md` based on detected technology stack and governance constraints.

### `teamwerx correct <issue> [--goal <goal>]`
Log an issue fix: adds a discussion entry, creates a completed task, and writes an implementation record describing the resolution.

### `teamwerx implement [--goal <goal>] [--notes <text>]`
Batch-complete up to five pending tasks and create implementation records for each.

### `teamwerx inspire [--goal <goal>]`
Analyze pending work and add a discussion entry highlighting decision points or follow-up questions.

### `teamwerx list [--status <status>]`
List all goals. Filter by status if specified. Display title, status, created date.

### `teamwerx status [goal-name] [--context] [--summary]`
Show detailed status of goal (or all goals if omitted).
- Default: Goal status, success criteria, plan info
- `--context`: Tech stack, directories, artifacts
- `--summary`: Discussion/implementation counts, recent records

### `teamwerx use <goal-name>`
Set current working goal context. Store in `.teamwerx/.current-goal`.

### `teamwerx propose <description>`
Propose change to goal/plan. Save to `.teamwerx/proposals/[goal-name]/[proposal-id].md` with frontmatter.

### `teamwerx archive [goal-name] [--yes]`
Archive a completed goal. Moves goal file, workspace, and artifacts to `.teamwerx/archive/`. Use `--yes` to skip confirmation.

## Conventions
- Default goal status: `draft`
- Git commits: Manual, prefix `[teamWERX]`
- File naming: kebab-case
- Task statuses: pending | in-progress | completed
- Goal statuses: draft | open | in-progress | blocked | completed | cancelled
- All commands are **non-destructive**: append to logs, create new entries, or add addenda instead of overwriting artifacts. Use git history for changes that must replace existing content.
- Workspace numbering: each goal gets a three-digit ID (`001`, `002`, ...), discussions use `Dxx`, tasks use `Txx`, reflections use `Rxx`. Preserve numbering when editing files manually.
