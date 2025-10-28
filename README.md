# teamWERX
[![Release (goreleaser)](https://github.com/teamwerx/teamwerx/actions/workflows/release.yml/badge.svg)](https://github.com/teamwerx/teamwerx/actions/workflows/release.yml)

See also: [Contributing (Go)](CONTRIBUTING-GO.md)

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

```bash
npm install -g teamwerx
```

Or use locally in your project:

```bash
npm install --save-dev teamwerx
```

## Quick Start

```bash
# Install and initialize
npm install -g teamwerx
cd my-project && git init
teamwerx init

# Create and develop a goal
teamwerx goal "Implement user authentication"
teamwerx use implement-user-authentication
teamwerx research
teamwerx discuss "Should we use JWT or sessions?"
teamwerx plan
teamwerx execute
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

This minimal end-to-end recipe shows common commands and the files they create or update. Use `teamwerx use <goal-slug>` to set context or pass `--goal <slug>` to commands.

0. Initialize (once per repo)

- npm: install globally or locally and run:
  - teamwerx init
- Creates: `.teamwerx/` and templates

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
- Updates: `.teamwerx/goals/00X-<slug>/plan.md` (task statuses: pending | in-progress | completed | blocked)

6. Inspect status and plan summary

- teamwerx status
- Quick list: teamwerx status --list
- Programmatic JSON: teamwerx status --json
- Uses: reads `.teamwerx/goals/00X-<slug>/plan.md` to derive counts and goal status

7. Dry-run and execute tasks

- Preview (recommended): teamwerx execute --dry-run
- Execute: teamwerx execute
- Effect: applies the next pending task, updates `plan.md`, and records implementation notes

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
- `teamwerx plan` → `.teamwerx/goals/00X-<slug>/plan.md` (authoritative plan file)
- `teamwerx status` → reads `.teamwerx/goals/00X-<slug>/plan.md` (derives goal-level status at read-time)
- `teamwerx execute` → modifies files according to planned task, updates `plan.md`, and writes implementation notes in the workspace
- `teamwerx complete` → updates `plan.md` and appends implementation entries (modes: `manual`, `fix`, `batch`)
- `teamwerx reflect` → `.teamwerx/goals/00X-<slug>/reflect.md` (or appended to `discuss.md` depending on implementation)
- `teamwerx summarize` → `.teamwerx/goals/00X-<slug>/summary.md`

### Best-practices (recommendations)

- Always set the active goal (`teamwerx use <slug>`) or pass `--goal <slug>` to avoid accidental updates to the wrong workspace.
- Run `teamwerx status --summary` and `teamwerx execute --dry-run` before a real `teamwerx execute`.
- Keep a small, focused plan (T01–T05) per execution session to reduce conflicts and make reviews easy.
- Preserve traceability: prefer `teamwerx complete --source manual` when you make local changes and commit them; this links the git patch to plan progress.

**Key Points:**

- The canonical plan file is `.teamwerx/goals/00X-<slug>/plan.md`; goal status is derived at read-time by inspecting that plan (do not rely on a persisted `plan.status` elsewhere).
- Commands are mostly non-destructive and append to workspace artifacts; `execute` and `complete` change plan/task state and may write implementation notes.
- Use `--json` output and `--dry-run` where available to integrate teamWERX into automation or CI safely.

## Commands

All commands are **non-destructive**. Instead of overwriting existing artifacts, they append new entries or create new files so prior context remains available in git history.

### Command Behavior (detailed)

The table below explains what each CLI command actually does, the primary flags you should know, which files it reads or writes, a short example, and safety notes or recommendations.

- `init`

  - What it does: Initialize teamWERX in the current repository.
  - Flags: none
  - Files read/written:
    - Writes: `.teamwerx/` directory, `.teamwerx/AGENTS.md`, template files under `.teamwerx/`
  - Example:
    - `teamwerx init`
  - Safety notes:
    - Requires a git repository (it checks for git). Safe to run multiple times; it will update templates but not remove existing workspaces.

- `goal [description]`

  - What it does: Create a new goal descriptor and numbered workspace.
  - Flags:
    - none (interactive prompts may be shown)
  - Files read/written:
    - Writes: `.teamwerx/goals/<slug>.md` (goal metadata), `.teamwerx/goals/00X-<slug>/` workspace (plan.md, discuss.md, research.md templates)
  - Example:
    - `teamwerx goal "Add SSO support"`
  - Safety notes:
    - Non-destructive — it creates files only. Commit the created goal files to preserve history.

- `use <goal-name>`

  - What it does: Set the current working goal context for subsequent commands.
  - Flags: none
  - Files read/written:
    - Writes: `.teamwerx/.current-goal`
  - Example:
    - `teamwerx use add-sso`
  - Safety notes:
    - This is local workspace state. Prefer passing `--goal <slug>` to a command in scripts to avoid implicit context.

- `research [goal-name]` / `research --goal <slug>`

  - What it does: Analyze the codebase and produce (or update) a research report tailored to the goal.
  - Flags:
    - `--goal <slug>` — operate on a specific goal without changing `.current-goal`
  - Files read/written:
    - Reads repo files to analyze structure and dependencies
    - Writes: `.teamwerx/goals/00X-<slug>/research.md`
  - Example:
    - `teamwerx research` (when a goal is active)
    - `teamwerx research --goal add-sso`
  - Safety notes:
    - Read-only for project files; modifies only workspace artifacts.

- `discuss <message> [--proposal]`

  - What it does: Append a timestamped, numbered discussion entry to the goal discussion log.
  - Flags:
    - `--proposal` — mark the entry as a formal proposal
    - `--goal <slug>` — (optional) operate on another goal
  - Files read/written:
    - Appends to: `.teamwerx/goals/00X-<slug>/discuss.md`
  - Example:
    - `teamwerx discuss "Prefer OAuth2 because it supports PKCE" --proposal`
  - Safety notes:
    - Append-only. Good for traceability and preserving context for review.

- `plan [considerations] [--task <task>] [--interactive]`

  - What it does: Create or update a plan with numbered tasks. Supports adding tasks inline or interactively.
  - Flags:
    - `--task <task>` (repeatable) — add one or more tasks non-interactively
    - `--interactive` — walk through prompts to build tasks
    - `--goal <slug>` — operate on a specific goal
  - Files read/written:
    - Reads/writes: `.teamwerx/goals/00X-<slug>/plan.md` (this is the authoritative plan)
  - Example:
    - `teamwerx plan --task "Add login endpoint" --task "Add session store"`
    - `teamwerx plan --interactive`
  - Safety notes:
    - Editing plan.md updates the canonical plan. Prefer small, focused batches of tasks to simplify execution and review.

- `status [goal-name] [--list] [--status <status>] [--context] [--summary] [--json]`

  - What it does: Derive and show goal-level status and plan summaries by reading the plan file(s).
  - Flags:
    - `--list` — show a table of goals
    - `--status <status>` — filter when using `--list`
    - `--summary` — show counts and a short plan summary
    - `--context` — include project context/tech stack
    - `--json` — machine-readable output
  - Files read/written:
    - Reads: `.teamwerx/goals/*/plan.md` and related workspace artifacts
  - Example:
    - `teamwerx status` (for active goal)
    - `teamwerx status --list --status open`
    - `teamwerx status --json`
  - Safety notes:
    - Read-only. `status` derives state at read-time — do not expect `plan.status` to be persisted elsewhere.

- `execute [goal-name] [--dry-run]`

  - What it does: Execute the next pending task in the plan. When applying, it updates task status and may write implementation artifacts.
  - Flags:
    - `--dry-run` — preview planned changes without modifying repository files (recommended)
    - `--goal <slug>` — operate on a specific goal
  - Files read/written:
    - Reads: `.teamwerx/goals/00X-<slug>/plan.md`
    - Writes: updates `plan.md` task status; writes implementation notes and may modify project files (when applied)
  - Example:
    - `teamwerx execute --dry-run` — preview
    - `teamwerx execute` — apply
  - Safety notes:
    - Prefer `--dry-run` first. When `execute` applies changes, review diffs before committing. Consider using `teamwerx complete --source manual` to record local commits.

- `complete [issue-or-title] [--goal <goal>] [--source <fix|manual|batch>] [--notes <text>] [--limit <number>]`

  - What it does: Mark tasks complete and record implementation details. Modes:
    - `fix` — associate a specific issue or fix with a task
    - `manual` — read staged git changes and attach them to a task
    - `batch` — mark multiple tasks completed in one operation
  - Flags:
    - `--source` (default: `batch`)
    - `--notes` — human notes about the completion
    - `--limit` — when batch completing
  - Files read/written:
    - Reads: git index (for `manual`), `.teamwerx/goals/00X-<slug>/plan.md`
    - Writes: updates `plan.md`, and creates implementation records (e.g., `.teamwerx/goals/00X-<slug>/implementation/T01.md`)
  - Example:
    - `teamwerx complete --source manual`
    - `teamwerx complete "Fix login bug" --source fix --notes "rate limit adjusted"`
  - Safety notes:
    - `manual` mode reads staged changes — ensure you have committed or staged the intended patch. `fix` mode is for small issue-based changes.

- `reflect [--goal <goal>] [--notes <text>] [--inspire] [--dry-run]`

  - What it does: Append reflections (R01, R02, ...) capturing lessons and adaptations. `--inspire` can auto-suggest follow-ups.
  - Flags:
    - `--inspire` — request autogenerated suggestions
    - `--dry-run` — simulate entry creation
  - Files read/written:
    - Appends to: `.teamwerx/goals/00X-<slug>/discuss.md` or `.teamwerx/goals/00X-<slug>/reflect.md` depending on implementation
  - Example:
    - `teamwerx reflect --notes "Refined success criteria based on load tests"`
  - Safety notes:
    - Append-only behavior; safe to run anytime.

- `summarize [--goal <goal>]`

  - What it does: Generate or refresh a condensed `summary.md` capturing decisions, patterns, and key outcomes to aid future work.
  - Flags:
    - `--goal <goal>`
  - Files read/written:
    - Writes/updates: `.teamwerx/goals/00X-<slug>/summary.md`
  - Example:
    - `teamwerx summarize`
  - Safety notes:
    - Intended as a read/aggregation step — safe and non-destructive.

- `charter`

  - What it does: Generate or refresh a project-level charter file (e.g., `.teamwerx/goals/charter.md`) based on detected stack & governance constraints.
  - Flags: none
  - Files read/written:
    - Writes/updates: `.teamwerx/goals/charter.md`
  - Example:
    - `teamwerx charter`
  - Safety notes:
    - Non-destructive; intended to provide project-level guidance for AI agents.

- `archive [goal-name] [--yes]`
  - What it does: Move a completed or abandoned goal workspace into `.teamwerx/archive/` for long-term storage.
  - Flags:
    - `--yes` — skip confirmation prompts
  - Files read/written:
    - Moves: `.teamwerx/goals/00X-<slug>/` → `.teamwerx/archive/`
  - Example:
    - `teamwerx archive add-sso --yes`
  - Safety notes:
    - This operation relocates files. Keep backups or use git to revert if done accidentally.

#### General Safety & Integration Recommendations

- Always prefer `--goal <slug>` in automation or scripts to avoid implicit `.current-goal` context.
- Use `teamwerx status --json` and `teamwerx execute --dry-run` in CI or automation to preview changes safely.
- Keep plan edits small and focused (T01–T05) per execution run to reduce overlapping changes and simplify review.
- When performing local development that you want to record as part of a plan, stage and commit changes first, then run `teamwerx complete --source manual` to link the git patch to the appropriate task.

### Initialization

**`teamwerx init`**

Initializes teamWERX in the current project. This command:

- Verifies that the current directory is a git repository (fails if not)
- Creates the `.teamwerx` directory structure
- Creates template directories for goals and proposals
- Creates or updates `AGENTS.md` with teamWERX configuration in YAML frontmatter

**Prerequisites:**

- The project must be initialized as a git repository (`git init`)
- The command must be run from the project root directory

### Goal Management

**`teamwerx goal [description]`**

Creates a new goal with automatic workspace setup. Prompts for success criteria if not provided. Saves:

- Goal file to `.teamwerx/goals/[kebab-case-title].md`
- Creates numbered workspace `.teamwerx/goals/00X-[slug]/` with discussion, plan, and research templates

**`teamwerx status [goal-name] [--list] [--status <status>] [--context] [--summary]`**

Shows detailed status of a goal (or all goals if omitted).

- Default: Goal status, success criteria, plan info
- `--list`: Show table view of all goals (filter with `--status`)
- `--context`: Show project context with tech stack and directories
- `--summary`: Show summary with discussion/implementation records

**`teamwerx use <goal-name>`**

Sets the current working goal context. Stores selection in `.teamwerx/.current-goal`.

### Research and Discussion

**`teamwerx research [goal-name] [--goal <goal>]`**

Analyzes the codebase and generates/updates research report. Detects technology stack, languages, and directory structure. Updates `research.md` in goal workspace.

This command is designed to be executed by an AI agent.

**`teamwerx discuss <message> [--goal <goal>] [--proposal]`**

Appends a numbered discussion entry (D01, D02, ...) with timestamp and content to the goal's discussion log. Use `--proposal` to mark as a change proposal. Non-destructive; preserves all prior entries.

This command is designed to be executed by an AI agent.

**`teamwerx reflect [--goal <goal>] [--notes <text>] [--inspire] [--dry-run]`**

Adds a reflection entry (R01, R02, ...) to capture learning and adaptations during execution. Records what worked, what didn't, and adjustments made.

- `--inspire`: Auto-generate suggestions based on plan state
- `--dry-run`: Record a dry-run simulation assessment

This command is designed to be executed by an AI agent.

### Planning and Execution

**`teamwerx plan [considerations] [--goal <goal>] [--task <task>] [--interactive]`**

Adds numbered tasks (T01, T02, ...) to the goal plan.

- Use `--task` flag for individual tasks
- Use `--interactive` for prompted entry
- Use no flags for AI-driven planning mode

This command is designed to be executed by an AI agent.

**`teamwerx execute [goal-name]`**

Executes tasks from the plan:

1. Read plan, identify next pending task
2. Implement task (create/modify code files)
3. Update task status to completed in plan file
4. Prompt developer to commit

If `goal-name` is provided, uses that goal; otherwise uses current goal.

This command is designed to be executed by an AI agent.

**`teamwerx complete [issue-or-title] [--goal <goal>] [--source <source>] [--notes <text>] [--limit <number>]`**

Completes tasks and records implementations.

- `--source fix`: Record an issue correction
- `--source manual`: Collect staged git changes into task
- `--source batch`: Batch-complete up to 5 pending tasks (default)

### Workspace Management

**`teamwerx summarize [--goal <goal>]`**

Generates or updates knowledge summary for the goal. Distills key decisions, reusable patterns, and gotchas from discussions and implementations into `summary.md`. Helps with knowledge distillation and token efficiency for future goals.

**`teamwerx charter`**

Generates or refreshes `.teamwerx/goals/charter.md` based on detected technology stack and governance constraints.

### Change Management

**`teamwerx archive [goal-name] [--yes]`**

Archives a completed goal (defaults to the current goal). Moves goal file, workspace, and artifacts to `.teamwerx/archive/`. Use `--yes` to skip confirmation.

**`teamwerx archive [goal-name] [--yes]`**

Archives a completed goal (defaults to the current goal). Moves goal file, workspace, and artifacts to `.teamwerx/archive/`. Use `--yes` to skip confirmation.

## Project Structure

After initialization, teamWERX creates the following structure:

```
project-root/
├── AGENTS.md              # Configuration + AI agent instructions
└── .teamwerx/
    ├── goals/
    │   ├── goal-name.md             # Goal definition file
    │   ├── 001-goal-name/           # Numbered workspace
    │   │   ├── discuss.md           # Discussion log (D01, D02, ...) and reflections (R01, R02, ...)
    │   │   ├── plan.md              # Task plan (T01, T02, ...)
    │   │   ├── research.md          # Research report with business context
    │   │   ├── summary.md           # Knowledge summary (optional)
    │   │   └── implementation/      # Implementation records (T01.md, T02.md, ...)
    │   ├── 002-another-goal/
    │   ├── charter.md               # Project charter
    │   └── .current-goal                # Current working goal
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
- `teamwerx status --list [--status=<status>]` - List/filter all goals
- `teamwerx status [goal-name]` - Show detailed goal status

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

# Check all goals
teamwerx status --list
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
     - `tasks.md` — checklist of tasks (checkbox list). These are authoring artifacts until applied.
     - `spec-delta.md` — optional spec or design notes
     - `status.json` — small machine state (draft | applied | archived)
   - A `Dxx` proposal entry is also appended to the referenced goal discussion log (if a goal is specified) to keep the proposal discoverable.
2. Review
   - Edit `proposal.md` and `tasks.md`, discuss in the goal `discuss.md`, and iterate until approval.
3. Apply
   - Run an explicit `apply` step to import tasks into the canonical plan file (`.teamwerx/goals/00X-<slug>/plan.md`) using the `PlanManager`.
   - Implementation stubs are created under the goal workspace (`.teamwerx/goals/00X-<slug>/implementation/Txx.md`) via `ImplementationManager`.
   - The change `status.json` is updated to `applied` and a discussion entry is added for traceability.
4. Archive
   - Move the change folder into `.teamwerx/archive/changes/` and optionally add an archive note to the goal discussion log.

Commands (CLI)

- `teamwerx propose "<title>" [--goal <slug>] [--author <author>]`

  - Create a new proposal scaffold at `.teamwerx/changes/<id>-<slug>/`.
  - Writes `proposal.md`, `tasks.md`, `spec-delta.md`, and `status.json`.
  - Adds a `--proposal` discussion entry for the goal (if provided).

- `teamwerx changes list`

  - List change proposals and their current status.

- `teamwerx changes show <id|slug>`

  - Display the proposal frontmatter, a tasks summary, and the spec delta excerpt.

- `teamwerx changes apply <id|slug> [--goal <slug>] [--dry-run] [--yes]`

  - Import tasks from the change's `tasks.md` into the canonical `.teamwerx/goals/00X-<slug>/plan.md` (using `PlanManager.addTask()`).
  - Create implementation stubs with `ImplementationManager.createRecord()`.
  - Updates `status.json` to `applied` and appends a discussion entry for traceability.
  - `--dry-run` previews tasks without modifying any files. `--yes` skips confirmations for scriptable workflows.

- `teamwerx changes archive <id|slug> [--goal <slug>] [--notify] [--yes]`
  - Move the change folder to `.teamwerx/archive/changes/`.
  - Optionally notify the referenced goal discussion log (`--notify`) that the change was archived.

Files read/written (summary)

- Created under proposal flow:
  - `.teamwerx/changes/<id>-<slug>/proposal.md`
  - `.teamwerx/changes/<id>-<slug>/tasks.md`
  - `.teamwerx/changes/<id>-<slug>/spec-delta.md`
  - `.teamwerx/changes/<id>-<slug>/status.json`
- When applied:
  - `.teamwerx/goals/00X-<slug>/plan.md` — tasks are added here (canonical source)
  - `.teamwerx/goals/00X-<slug>/implementation/Txx.md` — implementation stubs
- When archived:
  - `.teamwerx/archive/changes/<id>-<slug>/` — archived change folder

Integration with existing artifacts and commands

- Single source of truth for tasks: `plan.md` remains authoritative. `changes/*.md` are authoring artifacts until `apply` is invoked.
- Discussion trace: `discuss --proposal` entries are still used; the change manager appends discovery and apply/archive entries into the goal's `discuss.md` so the audit trail remains in the workspace.
- Implementation records use the existing `ImplementationManager` for consistency with `teamwerx complete`.
- Archival uses the same `.teamwerx/archive/` area already used by `teamwerx archive`.

Quick recipe (copy/paste)

```bash
# 1) Create a change proposal
teamwerx propose "Add profile search filters" --goal 002-user-profiles

# 2) Review and refine (edit files and discuss)
teamwerx changes show 001-add-profile-search-filters
teamwerx discuss "Feedback about filter UX" --proposal --goal 002-user-profiles

# 3) Preview apply
teamwerx changes apply 001-add-profile-search-filters --dry-run

# 4) Apply the change (imports tasks into plan and creates stubs)
teamwerx changes apply 001-add-profile-search-filters --goal 002-user-profiles --yes

# 5) Archive when complete
teamwerx changes archive 001-add-profile-search-filters --notify --goal 002-user-profiles --yes
```

Guidelines & safety notes

- Non-destructive by default: authoring files live in `.teamwerx/changes/` and nothing in the canonical plan is modified until you run `changes apply`.
- Always run `--dry-run` to preview imports in automation.
- Use `--yes` only in trusted automation contexts; otherwise the CLI will prompt for confirmation before applying or archiving.
- The change `id` embeds a numeric prefix and kebab slug (e.g., `001-add-profile-filters`) to make cross-referencing simple.

Command → Primary file mapping (changes)

- `teamwerx propose` → writes `/.teamwerx/changes/<id>/proposal.md` + `tasks.md` + `spec-delta.md`
- `teamwerx changes show` → reads files under `.teamwerx/changes/<id>/`
- `teamwerx changes apply` → reads `.teamwerx/changes/<id>/tasks.md`, writes `.teamwerx/goals/00X-<slug>/plan.md` and implementation stubs
- `teamwerx changes archive` → moves change folder to `.teamwerx/archive/changes/<id>/`

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
- Regularly review all goals with `teamwerx status --list`
- Archive completed goals to keep workspace focused
- Limit number of goals in `in-progress` state simultaneously

### Multi-Agent Coordination

- Each agent works on one goal at a time (set with `teamwerx use`)
- Use separate terminal sessions/IDEs for different agents
- Review overall status with `teamwerx status --list` before switching contexts
- Document blockers in goal status when work is halted

### Research & Discussion

- Run `teamwerx research` once per goal (initial analysis)
- Use `teamwerx discuss` for iterative conversations (multiple rounds)
- Follow recommended flow: goal → research → discuss → plan → execute → archive

### Workspace Management

- Use `teamwerx complete --source manual` to capture manual changes into the plan
- Use `teamwerx complete --source fix` to log issue fixes
- Use `teamwerx complete --source batch` to batch-complete tasks
- Keep `plan.md`, `discuss.md`, `research.md`, and `implementation/` synchronized with actual work

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

Archived goals no longer appear in `teamwerx status --list`, but they remain in `.teamwerx/archive/` (and git history) for auditing.

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

- **New commands**: Create a new JavaScript file in the `lib/commands/` directory
- **New artifact types**: Create a new directory in the `.teamwerx/` directory

The CLI source includes reusable templates (e.g., `AGENTS.md`) under `assets/templates/`.

## Requirements

- Node.js >= 14.0.0
- Git (must be initialized in your project)

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run linter
npm run lint
```

### Test Coverage

This project uses Jest for testing and maintains baseline code coverage thresholds:

- Statements: 12%
- Branches: 10%
- Functions: 25%
- Lines: 12%

Coverage reports are generated in the `coverage/` directory.

## License

MIT

## Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:

- Setting up your development environment
- Running tests and linters
- Code style and conventions
- Submitting pull requests

## Support

For issues and questions, please file an issue on GitHub.
