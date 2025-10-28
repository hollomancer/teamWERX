# teamWERX
[![Release (goreleaser)](https://github.com/teamwerx/teamwerx/actions/workflows/release.yml/badge.svg)](https://github.com/teamwerx/teamwerx/actions/workflows/release.yml)

See also: [Migration Guide (Node → Go)](MIGRATION.md) · [Contributing (Go)](CONTRIBUTING-GO.md)

> Legacy Node.js docs have been archived in this repository. See docs/archive/CONTRIBUTING-node.md for the last Node-based contributing guide.

## Go CLI Installation


> Release builds are published automatically via GoReleaser when tags (v*) are pushed. Download binaries from the GitHub Releases page.

You can install and run the Go-based CLI in a few different ways. Choose the one that fits your workflow:

- Using Go (quickest if you have Go installed):
  - Go 1.18+ required
  - Run:
    - go install github.com/teamwerx/teamwerx/cmd/teamwerx@latest
  - The binary will be placed in your GOPATH/bin (or GOBIN) and available on your PATH if configured.

- From source (recommended for contributors):
  - Clone this repository
  - Build the CLI:
    - make build
    - or: go build -v -o teamwerx ./cmd/teamwerx

- From releases (multi-platform archives):
  - We use GoReleaser to publish macOS, Linux, and Windows archives.
  - Download the archive for your OS/arch from the Releases page, extract, and place the teamwerx binary on your PATH.

Notes:
- The CLI is non-destructive by design and operates against a .teamwerx workspace in your project.
- For non-interactive/CI runs, set TEAMWERX_CI=1 to disable prompts.

## Go CLI Usage

Below are common tasks and example commands. All commands accept base directory flags so you can target different workspaces if needed.

Workspace flags (optional, default to .teamwerx/*):
- --specs-dir: defaults to .teamwerx/specs
- --goals-dir: defaults to .teamwerx/goals
- --changes-dir: defaults to .teamwerx/changes

Tip: add TEAMWERX_CI=1 to skip interactive prompts in scripts.

### Specs

List all specs:
- TEAMWERX_CI=1 teamwerx spec list --specs-dir .teamwerx/specs

Show a specific spec summary (first 10 requirements):
- TEAMWERX_CI=1 teamwerx spec show auth --specs-dir .teamwerx/specs

### Plans

Add a task to a goal’s plan:
- TEAMWERX_CI=1 teamwerx plan add --goals-dir .teamwerx/goals --goal 001-demo "Set up CI"

List tasks for a goal:
- TEAMWERX_CI=1 teamwerx plan list --goals-dir .teamwerx/goals --goal 001-demo

Complete a task:
- TEAMWERX_CI=1 teamwerx plan complete --goals-dir .teamwerx/goals --goal 001-demo --task T01

Show plan details:
- TEAMWERX_CI=1 teamwerx plan show --goals-dir .teamwerx/goals --goal 001-demo

### Discussions

Add a discussion entry to a goal:
- TEAMWERX_CI=1 teamwerx discuss add --goals-dir .teamwerx/goals --goal 001-demo "Initial planning notes"

List discussion entries:
- TEAMWERX_CI=1 teamwerx discuss list --goals-dir .teamwerx/goals --goal 001-demo

### Changes

List changes:
- TEAMWERX_CI=1 teamwerx change list --changes-dir .teamwerx/changes --specs-dir .teamwerx/specs

Apply a change (may detect conflicts):
- TEAMWERX_CI=1 teamwerx change apply --id CH-123 --changes-dir .teamwerx/changes --specs-dir .teamwerx/specs

Resolve conflicts interactively (refresh base fingerprints or skip domains, then re-apply):
- TEAMWERX_CI=1 teamwerx change resolve --id CH-123 --changes-dir .teamwerx/changes --specs-dir .teamwerx/specs

Archive a change after it’s applied:
- TEAMWERX_CI=1 teamwerx change archive --id CH-123 --changes-dir .teamwerx/changes --specs-dir .teamwerx/specs

### Migration Check

Validate that your existing .teamwerx workspace is compatible:
- TEAMWERX_CI=1 teamwerx migrate check \
  --specs-dir .teamwerx/specs \
  --goals-dir .teamwerx/goals \
  --changes-dir .teamwerx/changes

This will parse specs, plans, discussions, and changes, then report any issues.

### Shell Completions

Generate completion scripts for your shell (bash|zsh|fish|powershell):
- teamwerx completion bash
- teamwerx completion zsh
- teamwerx completion fish
- teamwerx completion powershell

Load or install the output according to your shell’s recommended approach.

### Non-Interactive Mode

Set TEAMWERX_CI=1 to disable interactive prompts and use defaults within commands. This is helpful for CI/CD or scripted runs:
- TEAMWERX_CI=1 teamwerx spec list
- TEAMWERX_CI=1 teamwerx plan add --goal 001-demo "Automated task"

### Building From Source (Developers)

- Prerequisites: Go 1.18+
- Build:
  - make build
  - or: go build -v -o teamwerx ./cmd/teamwerx
- Test:
  - make test
- Lint:
  - Ensure golangci-lint is installed, then: make lint

For releases, we use GoReleaser with a multi-platform configuration. CI builds and publishes archives on tagged releases.

A development framework for individual developers working with multiple AI agents.

## Overview

teamWERX is a command-line interface (CLI) tool that provides a structured workflow to bring clarity, predictability, and efficiency to the software development lifecycle by coordinating the developer and their AI assistants around shared goals and plans.

## Core Philosophy

- **Goal-Oriented**: Development starts with clear definitions of high-level goals and desired outcomes
- **Specification-Driven**: Goals are translated into concrete specifications through research and discussion with AI agents
- **Multi-Agent Coordination**: The framework orchestrates multiple AI agents working on different aspects of a project, all guided by a single developer
- **Traceability**: All decisions, discussions, and plans are documented and version-controlled, providing a clear audit trail
- **Non-Destructive**: All commands append to existing artifacts rather than overwriting them, preserving full history in git

## Features

- **Goal-Oriented Development**: Start with clear, measurable goals
- **AI Agent Coordination**: Work with multiple AI agents on different aspects of your project
- **Git-Based Versioning**: All artifacts tracked in git for complete traceability
- **Structured Workflow**: Research → Discussion → Planning → Execution
- **Multi-Goal Support**: Work on multiple goals concurrently
- **Numbered Workspaces**: Deterministic numbering for goals, tasks, and discussions

## Installation

See "Go CLI Installation" above. Node.js-based installation via npm has been removed in favor of the Go CLI. Use go install, build from source, or download a release binary.

## Quick Start

```bash
# List specs
teamwerx spec list --specs-dir .teamwerx/specs

# Add and list tasks for a goal plan
teamwerx plan add --goals-dir .teamwerx/goals --goal 001-demo "Set up CI"
teamwerx plan list --goals-dir .teamwerx/goals --goal 001-demo
teamwerx plan complete --goals-dir .teamwerx/goals --goal 001-demo --task T01

# Add and list discussion entries
teamwerx discuss add --goals-dir .teamwerx/goals --goal 001-demo "Initial planning notes"
teamwerx discuss list --goals-dir .teamwerx/goals --goal 001-demo

# Check workspace migration/compatibility
teamwerx migrate check --specs-dir .teamwerx/specs --goals-dir .teamwerx/goals --changes-dir .teamwerx/changes
```

## Workflow

The teamWERX workflow is divided into main phases. Multiple goals can progress through these phases concurrently, with different AI agents potentially working on different goals under the developer's direction.

Core phases:

1. **Goal Setting** — Define the high-level goal and success criteria.
2. **Research** — Generate a codebase-aware research report to surface constraints and options.
3. **Discussion** — Capture reasoning, proposals, and decisions in an append-only discussion log.
4. **Planning** — Create a numbered task plan (T01, T02, ...) for implementation.
5. **Execution** — Apply changes, one task at a time, and record progress.
6. **Change Management & Summaries** — Propose changes, capture reflections, and produce a knowledge summary.

### Quick Recipe (copy/paste)

This minimal end-to-end recipe shows common commands and the files they create or update. Pass `--goal <slug>` to commands.

0. Initialize (once per repo)

- Install the Go CLI (see "Go CLI Installation" above)
- teamWERX will create or update `.teamwerx/` workspace files as needed when running commands

1. Create a goal

- teamwerx goal "Implement user authentication"
- Creates: `.teamwerx/goals/<slug>.md` and workspace `.teamwerx/goals/00X-<slug>/`

2. Set working goal context

- teamwerx use implement-user-authentication
- Stores: `.teamwerx/.current-goal`

3. Research the codebase

- teamwerx research
- Updates/creates: `.teamwerx/goals/00X-<slug>/research.md`

4. Capture discussion / proposals

- teamwerx discuss "Should we use JWT or sessions?"
- Optionally: teamwerx discuss "..." --proposal
- Appends to: `.teamwerx/goals/00X-<slug>/discuss.md`

5. Create or update a plan

- Interactive: teamwerx plan --interactive
- Add tasks inline: teamwerx plan --task "Add login endpoint" --task "Add session store"
- Updates: `.teamwerx/goals/00X-<slug>/plan.json` (task statuses: pending | in-progress | completed | blocked)

6. Inspect status and plan summary

- TEAMWERX_CI=1 teamwerx plan show --goals-dir .teamwerx/goals --goal 001-demo
- Uses: reads `.teamwerx/goals/00X-<slug>/plan.json` to derive counts and goal status

7. Dry-run and execute tasks





8. Record completed work

- Manual staged changes: teamwerx complete --source manual
- For issue-fix flows: teamwerx complete --source fix --notes "fix: adjust login rate limit"
- Batch: teamwerx complete --source batch --limit 3
- Updates plan task statuses and adds implementation records to the workspace

9. Reflect and summarize

- teamwerx reflect --notes "What went well..."
- teamwerx summarize
- Creates/updates summary: `.teamwerx/goals/00X-<slug>/summary.md`

### Command → Primary file mapping

- `teamwerx init` → `.teamwerx/` (project-level templates)
- `teamwerx goal` → `.teamwerx/goals/<slug>.md`, `.teamwerx/goals/00X-<slug>/` (workspace created)
- `teamwerx use` → `.teamwerx/.current-goal` (context)
- `teamwerx research` → `.teamwerx/goals/00X-<slug>/research.md`
- `teamwerx discuss` → `.teamwerx/goals/00X-<slug>/discuss.md` (append-only)
- `teamwerx plan` → `.teamwerx/goals/00X-<slug>/plan.json` (authoritative plan file)



- `teamwerx summarize` → `.teamwerx/goals/00X-<slug>/summary.md`

### Best-practices (recommendations)

- Always set the active goal (`teamwerx use <slug>`) or pass `--goal <slug>` to avoid accidental updates to the wrong workspace.
- Keep a small, focused plan (T01–T05) per session to reduce conflicts and make reviews easy.
- Preserve traceability: prefer `teamwerx complete --source manual` when you make local changes and commit them; this links the git patch to plan progress.

**Key Points:**

- The canonical plan file is `.teamwerx/goals/00X-<slug>/plan.json`; goal status is derived at read-time by inspecting that plan (do not rely on a persisted `plan.status` elsewhere).
- Commands are mostly non-destructive and append to workspace artifacts; `execute` and `complete` change plan/task state and may write implementation notes.
- Use `--json` output and `--dry-run` where available to integrate teamWERX into automation or CI safely.

## Commands

All commands are **non-destructive**. Instead of overwriting existing artifacts, they append new entries or create new files so prior context remains available in git history.
Implemented Go CLI command groups: spec, plan, discuss, change, migrate, completion. Legacy Node-era commands (init, goal, use, research, status, execute, complete, reflect, summarize, charter, archive) are no longer available in main; see docs/archive/CONTRIBUTING-node.md for historical reference.

### Command Behavior (detailed)

Below are the implemented Go CLI commands, their primary flags, which files they read/write, examples, and safety notes.

- spec

  - list
    - What it does: Lists available spec domains.
    - Flags:
      - `--specs-dir` — base directory (default: `.teamwerx/specs`)
    - Files read/written:
      - Reads: `.teamwerx/specs/*/spec.md`
    - Example:
      - `teamwerx spec list --specs-dir .teamwerx/specs`
    - Safety notes:
      - Read-only.

  - show <domain>
    - What it does: Shows details for a spec domain (first 10 requirements).
    - Flags:
      - `--specs-dir` — base directory (default: `.teamwerx/specs`)
    - Files read/written:
      - Reads: `.teamwerx/specs/<domain>/spec.md`
    - Example:
      - `teamwerx spec show auth --specs-dir .teamwerx/specs`
    - Safety notes:
      - Read-only.

- plan

  - add
    - What it does: Adds a task to a goal’s plan.
    - Flags:
      - `--goals-dir` — base directory (default: `.teamwerx/goals`)
      - `--goal` — goal ID (e.g., `001-demo`)
    - Files read/written:
      - Reads/writes: `.teamwerx/goals/<goal-id>/plan.json`
    - Example:
      - `teamwerx plan add --goals-dir .teamwerx/goals --goal 001-demo "Set up CI"`
    - Safety notes:
      - Creates `plan.json` if missing. Non-destructive append.

  - list
    - What it does: Lists tasks for a goal’s plan.
    - Flags:
      - `--goals-dir`, `--goal`
    - Files read/written:
      - Reads: `.teamwerx/goals/<goal-id>/plan.json`
    - Example:
      - `teamwerx plan list --goals-dir .teamwerx/goals --goal 001-demo`
    - Safety notes:
      - Read-only.

  - complete
    - What it does: Marks a task as completed in the plan.
    - Flags:
      - `--goals-dir`, `--goal`, `--task` (e.g., `T01`)
    - Files read/written:
      - Reads/writes: `.teamwerx/goals/<goal-id>/plan.json`
    - Example:
      - `teamwerx plan complete --goals-dir .teamwerx/goals --goal 001-demo --task T01`
    - Safety notes:
      - Writes only to plan.json; review diffs before committing.

  - show
    - What it does: Shows a goal’s plan details.
    - Flags:
      - `--goal` — goal ID
    - Files read/written:
      - Reads: `.teamwerx/goals/<goal-id>/plan.json`
    - Example:
      - `teamwerx plan show --goals-dir .teamwerx/goals --goal 001-demo`
    - Safety notes:
      - Read-only.

- discuss

  - add
    - What it does: Appends a discussion entry to a goal (YAML front-matter blocks).
    - Flags:
      - `--goals-dir`, `--goal`
    - Files read/written:
      - Appends to: `.teamwerx/goals/<goal-id>/discuss.md`
    - Example:
      - `teamwerx discuss add --goals-dir .teamwerx/goals --goal 001-demo "Initial planning notes"`
    - Safety notes:
      - Append-only; preserves history.

  - list
    - What it does: Lists discussion entries for a goal.
    - Flags:
      - `--goals-dir`, `--goal`
    - Files read/written:
      - Reads: `.teamwerx/goals/<goal-id>/discuss.md`
    - Example:
      - `teamwerx discuss list --goals-dir .teamwerx/goals --goal 001-demo`
    - Safety notes:
      - Read-only.

- change

  - list
    - What it does: Lists changes.
    - Flags:
      - `--changes-dir` (default: `.teamwerx/changes`), `--specs-dir`
    - Files read/written:
      - Reads: `.teamwerx/changes/*/change.json`, `.teamwerx/specs/*/spec.md`
    - Example:
      - `teamwerx change list --changes-dir .teamwerx/changes --specs-dir .teamwerx/specs`
    - Safety notes:
      - Read-only.

  - apply
    - What it does: Applies a change by ID, merging spec deltas where possible.
    - Flags:
      - `--id`, `--changes-dir`, `--specs-dir`
    - Files read/written:
      - Reads: change JSON and spec files
      - Writes: merged spec files on success
    - Example:
      - `teamwerx change apply --id CH-123 --changes-dir .teamwerx/changes --specs-dir .teamwerx/specs`
    - Safety notes:
      - May detect divergence; see `change resolve`.

  - resolve
    - What it does: Interactively resolves spec merge conflicts (divergence) per domain.
    - Flags:
      - `--id`, `--changes-dir`, `--specs-dir`
    - Files read/written:
      - Reads/writes: change and spec files as part of resolution
    - Example:
      - `teamwerx change resolve --id CH-123 --changes-dir .teamwerx/changes --specs-dir .teamwerx/specs`
    - Safety notes:
      - Offers refresh/skip/cancel options; re-run apply after resolving.

  - archive
    - What it does: Archives a change after it’s applied.
    - Flags:
      - `--id`, `--changes-dir`, `--specs-dir`
    - Files read/written:
      - Moves change folder to archive under changes base dir
    - Example:
      - `teamwerx change archive --id CH-123 --changes-dir .teamwerx/changes --specs-dir .teamwerx/specs`
    - Safety notes:
      - Destructive move of change folder (non-spec files unaffected).

- migrate

  - check
    - What it does: Validates an existing `.teamwerx` workspace for compatibility.
    - Flags:
      - `--specs-dir`, `--goals-dir`, `--changes-dir`
    - Files read/written:
      - Reads: specs, plan.json, discuss.md, changes
    - Example:
      - `teamwerx migrate check --specs-dir .teamwerx/specs --goals-dir .teamwerx/goals --changes-dir .teamwerx/changes`
    - Safety notes:
      - Read-only; returns non-zero on failure.

- completion

  - [bash|zsh|fish|powershell]
    - What it does: Generates shell completion scripts.
    - Example:
      - `teamwerx completion bash`
      - `teamwerx completion zsh`
      - `teamwerx completion fish`
      - `teamwerx completion powershell`
    - Safety notes:
      - Redirect or install according to your shell’s instructions.

#### General Safety & Integration Recommendations

- Prefer explicit `--goal <id>`/base-dir flags in automation to avoid implicit context.
- Use `TEAMWERX_CI=1` to disable prompts in CI.
- Keep changes small; review diffs before committing when commands write files.

## Project Structure

After initialization, teamWERX creates the following structure:

```
project-root/
├── AGENTS.md              # Configuration + AI agent instructions
└── .teamwerx/
    ├── .current-goal                # Current working goal
    └── goals/
        ├── goal-name.md             # Goal definition file
        ├── 001-goal-name/           # Numbered workspace
        │   ├── discuss.md           # Discussion log (D01, D02, ...) and reflections (R01, R02, ...)
        │   ├── plan.json            # Task plan (T01, T02, ...)
        │   ├── research.md          # Research report with business context
        │   ├── summary.md           # Knowledge summary (optional)
        │   └── implementation/      # Implementation records (T01.md, T02.md, ...)
        ├── 002-another-goal/
        └── charter.md               # Project charter
```

### Structure Details

Each goal has two parts:

1. **Goal file** (`goal-name.md`) - Metadata, success criteria, and notes
2. **Numbered workspace** (`00X-goal-name/`) - Discussion, plan, research, and implementation records

**Workspace numbering:**

- Goals get sequential three-digit IDs (`001`, `002`, ...) derived from filesystem
- Discussion entries use `D01`, `D02`, ...
- Reflection entries use `R01`, `R02`, ...
- Tasks use `T01`, `T02`, ...
- Implementation records match task IDs (`T01.md`, `T02.md`, ...)

**Files to commit:**

- `.teamwerx/goals/` (goal files and workspaces)
- `.teamwerx/proposals/`
- `.teamwerx/archive/`
- `AGENTS.md`

**Files to ignore:**

- `.teamwerx/.current-goal` (local state)
- `.teamwerx/.temp/` (temporary files)

## Configuration

Configuration is stored in `AGENTS.md` frontmatter at the project root:

```yaml
---
teamwerx:
  version: "1.0.0"
  initialized: "2025-10-25"
---
```

**Configuration Fields:**

- `version`: teamWERX specification version
- `initialized`: ISO 8601 date when teamWERX was initialized

**Note on Token Efficiency:** The configuration is intentionally minimal because `AGENTS.md` is read by AI agents with every command execution. Additional settings are defined as conventions in the specification rather than configuration.

## Working with AI Agents

teamWERX is designed to work seamlessly with AI coding assistants. The `AGENTS.md` file provides instructions that AI agents can read and follow.

When you run commands like `teamwerx research` or `teamwerx plan`, the AI agent should:

1. Read the relevant sections of `AGENTS.md`
2. Perform the requested analysis or action
3. Save the results to the appropriate location

**AI-agnostic design:** teamWERX doesn't call AI APIs. AI agents read `AGENTS.md` to understand commands and execute accordingly.

## Goal States

Goals progress through the following states:

- **draft** - Initial state when created, under refinement
- **open** - Ready for work but not yet started
- **in-progress** - Active work being done
- **blocked** - Temporarily halted due to dependencies or issues
- **completed** - Success criteria met
- **cancelled** - Abandoned

**State transitions:** Goal status is automatically derived from plan state. Manual overrides possible for `cancelled` and `archived`.

**Plan/Task states:**

- Plans: `pending` → `in-progress` → `completed` (or `blocked`)
- Tasks: `pending` → `in-progress` → `completed`
- Plan status automatically reflects task statuses

## Schemas

All artifacts use YAML frontmatter for machine-readability.

### Goal Schema

| Field              | Type   | Required | Description                                                        |
| ------------------ | ------ | -------- | ------------------------------------------------------------------ |
| `title`            | string | ✓        | Brief, descriptive name                                            |
| `created`          | date   | ✓        | ISO 8601 date (YYYY-MM-DD)                                         |
| `success_criteria` | array  | ✓        | Success criteria as flat array                                     |
| `outcomes`         | array  | -        | Measurable metrics with targets and measurement methods (optional) |
| `dependencies`     | array  | -        | Goal IDs that must complete first (optional)                       |
| `status`           | enum   | -        | Manual override: cancelled \| archived (auto-derived otherwise)    |

### Plan Schema

| Field         | Type   | Required | Description                                        |
| ------------- | ------ | -------- | -------------------------------------------------- |
| `goal`        | string | ✓        | Goal file reference (without .md)                  |
| `goal_number` | string | ✓        | Workspace number (e.g., "001")                     |
| `updated`     | date   | ✓        | ISO 8601 timestamp                                 |
| `tasks`       | array  | ✓        | Task objects with id, title, status, notes, source |

**Task object:** `{id: string, title: string, status: string, notes: string, source: string, created: string, updated: string}`

## Multi-Goal Development

teamWERX supports unlimited concurrent goals, each with independent workflows. Different AI agents can work on different goals in parallel.

**Goal identification:** Kebab-case filenames (e.g., `implement-new-login-page.md`)

**Context management:**

- `teamwerx use [goal-name]` - Set current working goal (stored in `.teamwerx/.current-goal`)



**Dependencies:** Add `dependencies` field in goal frontmatter to track prerequisite goals

**Multi-Agent Coordination:**

```bash
# Agent A (session 1)
teamwerx use goal-a
teamwerx research
teamwerx execute

# Agent B (session 2, different terminal)
teamwerx use goal-b
teamwerx research
teamwerx execute



```

## Common Workflows

### Complete Goal Lifecycle

```bash
# Create a goal
teamwerx goal "Add payment integration"

# Set as current goal
teamwerx use add-payment-integration

# AI agent analyzes codebase
teamwerx research

# Discuss implementation approach (multiple rounds)
teamwerx discuss "Should we use Stripe or PayPal?"
teamwerx discuss "Let's go with Stripe for better API support"

# AI agent generates plan
teamwerx plan

# AI agent executes tasks
teamwerx execute

# Archive when complete
teamwerx archive add-payment-integration

# Commit after each major step
git add . && git commit -m "[teamWERX] Complete payment integration"
```

### Managing Multiple Goals

```bash
# List all goals
teamwerx status --list

# Filter by status
teamwerx status --list --status=in-progress

# Check status of specific goal
teamwerx status add-payment-integration

# Switch between goals
teamwerx use authentication-feature
```

### Change Management (full-featured)

teamWERX supports a first-class change proposal workflow (inspired by OpenSpec). Use this workflow to author a non-destructive change proposal, review tasks, import them into the canonical plan, and archive the change for auditability.

Lifecycle (high level)

1. Propose (draft)
   - Scaffold a change under `.teamwerx/changes/<id>-<slug>/` containing:
     - `proposal.md` — YAML frontmatter + body describing intent, goal linkage, and acceptance criteria

     - `spec-delta.md` — optional spec or design notes
     - `status.json` — small machine state (draft | applied | archived)
   - A `Dxx` proposal entry is also appended to the referenced goal discussion log (if a goal is specified) to keep the proposal discoverable.
2. Review
   - Edit `proposal.md`, discuss in the goal `discuss.md`, and iterate until approval.
3. Apply
   - Run an explicit `apply` step to import tasks into the canonical plan file (`.teamwerx/goals/00X-<slug>/plan.json`) using the `PlanManager`.
   - Implementation stubs are created under the goal workspace (`.teamwerx/goals/00X-<slug>/implementation/Txx.md`) via `ImplementationManager`.
   - The change `status.json` is updated to `applied` and a discussion entry is added for traceability.
4. Archive
   - Move the change folder into `.teamwerx/archive/changes/` and optionally add an archive note to the goal discussion log.

Commands (CLI)

- `teamwerx propose "<title>" [--goal <slug>] [--author <author>]`

  - Create a new proposal scaffold at `.teamwerx/changes/<id>-<slug>/`.
  - Writes `proposal.md`, `spec-delta.md`, and `status.json`.
  - Adds a `--proposal` discussion entry for the goal (if provided).

- `teamwerx changes list`

  - List change proposals and their current status.

- `teamwerx changes show <id|slug>`

  - Display the proposal frontmatter, a tasks summary, and the spec delta excerpt.












Files read/written (summary)

- Created under proposal flow:
  - `.teamwerx/changes/<id>-<slug>/proposal.md`

  - `.teamwerx/changes/<id>-<slug>/spec-delta.md`
  - `.teamwerx/changes/<id>-<slug>/status.json`
- When applied:
  - `.teamwerx/goals/00X-<slug>/plan.json` — tasks are added here (canonical source)
  - `.teamwerx/goals/00X-<slug>/implementation/Txx.md` — implementation stubs
- When archived:
  - `.teamwerx/archive/changes/<id>-<slug>/` — archived change folder

Integration with existing artifacts and commands

- Single source of truth for tasks: `plan.json` remains authoritative. `changes/*.md` are authoring artifacts until `apply` is invoked.
- Discussion trace: `discuss --proposal` entries are still used; the change manager appends discovery and apply/archive entries into the goal's `discuss.md` so the audit trail remains in the workspace.
- Implementation records use the existing `ImplementationManager` for consistency with `teamwerx complete`.
- Archival uses the same `.teamwerx/archive/` area already used by `teamwerx archive`.

Quick recipe (copy/paste)

```bash
# 1) Create a change proposal


# 2) Review and refine (edit files and discuss)
teamwerx changes show 001-add-profile-search-filters
teamwerx discuss "Feedback about filter UX" --proposal --goal 002-user-profiles

# 3) Preview apply


# 4) Apply the change (imports tasks into plan and creates stubs)


# 5) Archive when complete

```

Guidelines & safety notes



- Use `--yes` only in trusted automation contexts; otherwise the CLI will prompt for confirmation before applying or archiving.
- The change `id` embeds a numeric prefix and kebab slug (e.g., `001-add-profile-filters`) to make cross-referencing simple.

Command → Primary file mapping (changes)


- `teamwerx changes show` → reads files under `.teamwerx/changes/<id>/`



See also

- `teamwerx discuss` — keep the debate and acceptance criteria in the discussion log for auditability before you apply a change
- `teamwerx plan` — after applying changes, review the updated plan and adjust task ordering or dependencies if needed

## Best Practices

### Git Workflow

- Commit after each major change (goal creation, plan updates, task completion)
- Use `[teamWERX]` prefix for commit messages
- Tag important milestones with git tags
- Create branches for experimental goals

Example:

```bash
git add .teamwerx/
git commit -m "[teamWERX] Add authentication goal"
```

### Goal Management

- Use clear, distinctive goal names to avoid confusion between agents
- Track dependencies in goal frontmatter when goals depend on each other

- Archive completed goals to keep workspace focused
- Limit number of goals in `in-progress` state simultaneously

### Multi-Agent Coordination

- Each agent works on one goal at a time (set with `teamwerx use`)
- Use separate terminal sessions/IDEs for different agents

- Document blockers in goal status when work is halted

### Research & Discussion

- Run `teamwerx research` once per goal (initial analysis)
- Use `teamwerx discuss` for iterative conversations (multiple rounds)
- Follow recommended flow: goal → research → discuss → plan → execute → archive

### Workspace Management

- Use `teamwerx complete --source manual` to capture manual changes into the plan
- Use `teamwerx complete --source fix` to log issue fixes
- Use `teamwerx complete --source batch` to batch-complete tasks
- Keep `plan.json`, `discuss.md`, `research.md`, and `implementation/` synchronized with actual work

## Error Handling

Commands provide clear, actionable error messages that include:

1. What went wrong
2. How to fix it
3. Relevant context (available options, next steps)

**Common error categories:**

- Prerequisites not met (git not initialized, teamWERX not initialized)
- Resource not found (invalid goal/task/proposal ID)
- State errors (no current goal set, no pending tasks)

## Proposal Workflow

A **proposal** is a suggested change to a goal or a plan. It provides a structured way to propose changes and track the decision-making process.

**Recommended workflow:**

1. Create a proposal using `teamwerx discuss "Proposal: ..." --proposal`
2. The proposal is saved as a discussion entry with proposal status `pending`
3. Review the proposal and provide feedback in subsequent discussions
4. Update the proposal status directly in the discussion log
5. If approved, apply changes to the corresponding goal or plan

## Archiving

Use `teamwerx archive [goal-name]` to move completed work out of the active workspace:

1. The CLI looks up the goal (defaults to the current goal)
2. It shows a summary of artifacts to be moved and asks for confirmation unless `--yes` is provided
3. Each artifact is moved into `.teamwerx/archive/<type>/`, automatically appending suffixes if files already exist
4. If the archived goal was the current goal, `.teamwerx/.current-goal` is cleared



## Version Tracking

teamWERX uses git-based versioning for all artifacts.

**Version references:** Commit SHAs, tags, or branches (e.g., `a1b2c3d`, `v1.0.0`, `HEAD~1`)

**Examples:**

```bash
# View git history for a goal
git log -- .teamwerx/goals/my-goal.md

# Compare revisions directly with git
git diff HEAD~1 -- .teamwerx/goals/my-goal.md

# View changes to a workspace
git log -- .teamwerx/goals/001-my-goal/
```

## Extensibility

teamWERX is designed to be extensible. Users can add new commands and new types of artifacts to the framework.

- **New commands**: Add a new Cobra command under `cmd/teamwerx`
- **New artifact types**: Create a new directory in the `.teamwerx/` directory

The CLI source includes reusable templates (e.g., `AGENTS.md`) under `assets/templates/`.

## Requirements

- Go 1.18+ installed
- Git

## Development

### Running Tests

```bash
# Run all tests
make test
# Or use go directly
go test -v ./...

# Run only E2E tests
go test -v ./internal/core -run E2E_
```

### Linting

Use golangci-lint:

```bash
# Run lints
make lint
# Or run directly (ensure installed)
golangci-lint run
```

## License

MIT

## Contributing

Contributions welcome! Please read [CONTRIBUTING-GO.md](CONTRIBUTING-GO.md) for guidelines on:

- Setting up your development environment
- Running tests and linters
- Code style and conventions
- Submitting pull requests

## Support

For issues and questions, please file an issue on GitHub.
