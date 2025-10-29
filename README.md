# teamWERX
[![Release (goreleaser)](https://github.com/hollomancer/teamwerx/actions/workflows/release.yml/badge.svg)](https://github.com/hollomancer/teamwerx/actions/workflows/release.yml)
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

### Quick Recipe (Go CLI)

Use these commands with an existing `.teamwerx` workspace:

- TEAMWERX_CI=1 teamwerx spec list --specs-dir .teamwerx/specs
- TEAMWERX_CI=1 teamwerx plan add --goals-dir .teamwerx/goals --goal 001-demo "Add login endpoint"
- TEAMWERX_CI=1 teamwerx plan list --goals-dir .teamwerx/goals --goal 001-demo
- TEAMWERX_CI=1 teamwerx plan complete --goals-dir .teamwerx/goals --goal 001-demo --task T01
- TEAMWERX_CI=1 teamwerx discuss add --goals-dir .teamwerx/goals --goal 001-demo "Initial planning notes"
- TEAMWERX_CI=1 teamwerx discuss list --goals-dir .teamwerx/goals --goal 001-demo
- TEAMWERX_CI=1 teamwerx change list --changes-dir .teamwerx/changes --specs-dir .teamwerx/specs
- TEAMWERX_CI=1 teamwerx migrate check --specs-dir .teamwerx/specs --goals-dir .teamwerx/goals --changes-dir .teamwerx/changes

### Command → Primary file mapping

- `teamwerx spec` → reads `.teamwerx/specs/*/spec.md`
- `teamwerx plan` → reads/writes `.teamwerx/goals/<goal-id>/plan.json`
- `teamwerx discuss` → appends `.teamwerx/goals/<goal-id>/discuss.md`
- `teamwerx change` → reads `.teamwerx/changes/*/change.json` and `.teamwerx/specs/*/spec.md`; writes specs on apply; moves change folders on archive
- `teamwerx migrate` → reads specs, plans, discussions, and changes for validation

### Best-practices (recommendations)

- Always pass `--goal <id>` explicitly to avoid accidental updates to the wrong workspace.
- Keep a small, focused plan (T01–T05) per session to reduce conflicts and make reviews easy.
- Preserve traceability: make small, focused commits and reference task IDs (e.g., T01) in commit messages.

**Key Points:**

- The canonical plan file is `.teamwerx/goals/00X-<slug>/plan.json`; goal status is derived at read-time by inspecting that plan (do not rely on a persisted `plan.status` elsewhere).
- Commands are mostly non-destructive and append to workspace artifacts; `execute` and `complete` change plan/task state and may write implementation notes.
- Use `--json` output and `--dry-run` where available to integrate teamWERX into automation or CI safely.

## Commands

All commands are **non-destructive**. Instead of overwriting existing artifacts, they append new entries or create new files so prior context remains available in git history.
Implemented Go CLI command groups: spec, plan, discuss, change, migrate, completion.

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
├── AGENTS.md
└── .teamwerx/
    ├── goals/
    │   └── 001-demo/
    │       ├── discuss.md
    │       ├── plan.json
    │       ├── research.md
    │       ├── summary.md
    │       └── implementation/
    ├── specs/
    │   └── <domain>/
    │       └── spec.md
    └── changes/
        ├── <change-id>/
        │   └── change.json
        └── .archive/
            └── <change-id>/
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

- `.teamwerx/goals/`
- `.teamwerx/specs/`
- `.teamwerx/changes/`
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

When you run commands like `teamwerx plan` or `teamwerx discuss`, the AI agent should:

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

Persisted artifact formats:
- Plan: JSON at `.teamwerx/goals/<goal-id>/plan.json`
- Change: JSON at `.teamwerx/changes/<id>/change.json`
- Discussion: YAML front-matter blocks appended to `.teamwerx/goals/<goal-id>/discuss.md`
- Specs: Markdown under `.teamwerx/specs/<domain>/spec.md`



### Plan Schema (JSON)

| Field        | Type   | Required | Description                       |
| ------------ | ------ | -------- | --------------------------------- |
| `goal_id`    | string | ✓        | Goal ID (e.g., "001-demo")        |
| `updated_at` | date   | ✓        | RFC 3339 timestamp of last update |
| `tasks`      | array  | ✓        | Task objects                      |

**Task object (JSON):** `{id: string, title: string, status: string}`

## Multi-Goal Development

teamWERX supports unlimited concurrent goals, each with independent workflows. Different AI agents can work on different goals in parallel.

**Goal identification:** Kebab-case filenames (e.g., `implement-new-login-page.md`)

**Context management:**

- Pass `--goal <id>` to commands to target a specific goal workspace



**Dependencies:** Add `dependencies` field in goal frontmatter to track prerequisite goals

**Multi-Agent Coordination:**

```bash
# Agent A (session 1)
TEAMWERX_CI=1 teamwerx plan add --goal 001-a "Add API endpoint"
TEAMWERX_CI=1 teamwerx plan list --goal 001-a
TEAMWERX_CI=1 teamwerx discuss add --goal 001-a "Decided on approach"

# Agent B (session 2)
TEAMWERX_CI=1 teamwerx plan add --goal 002-b "Write tests"
TEAMWERX_CI=1 teamwerx plan complete --goal 002-b --task T01
TEAMWERX_CI=1 teamwerx discuss list --goal 002-b
```

## Common Workflows

### Complete Goal Lifecycle

```bash
# Minimal supported flow
TEAMWERX_CI=1 teamwerx spec list --specs-dir .teamwerx/specs

# Plan work
TEAMWERX_CI=1 teamwerx plan add --goals-dir .teamwerx/goals --goal 001-demo "Set up CI"
TEAMWERX_CI=1 teamwerx plan list --goals-dir .teamwerx/goals --goal 001-demo
TEAMWERX_CI=1 teamwerx plan complete --goals-dir .teamwerx/goals --goal 001-demo --task T01

# Discuss decisions
TEAMWERX_CI=1 teamwerx discuss add --goals-dir .teamwerx/goals --goal 001-demo "Initial planning notes"
TEAMWERX_CI=1 teamwerx discuss list --goals-dir .teamwerx/goals --goal 001-demo

# Manage changes (optional)
TEAMWERX_CI=1 teamwerx change list --changes-dir .teamwerx/changes --specs-dir .teamwerx/specs
TEAMWERX_CI=1 teamwerx change resolve --id CH-123 --changes-dir .teamwerx/changes --specs-dir .teamwerx/specs

# Validate workspace
TEAMWERX_CI=1 teamwerx migrate check --specs-dir .teamwerx/specs --goals-dir .teamwerx/goals --changes-dir .teamwerx/changes
```

### Managing Multiple Goals

```bash
# List tasks for different goals
TEAMWERX_CI=1 teamwerx plan list --goals-dir .teamwerx/goals --goal 001-demo
TEAMWERX_CI=1 teamwerx plan list --goals-dir .teamwerx/goals --goal 002-auth

# Show plan details for a goal
TEAMWERX_CI=1 teamwerx plan show --goals-dir .teamwerx/goals --goal 001-demo
```

### Change Management

teamWERX manages changes via JSON files under a dedicated workspace. Each change lives at `.teamwerx/changes/<id>/change.json` and contains one or more `SpecDelta`s (add/modify/remove requirement operations) to apply to spec domains. Use:
- `teamwerx change list` to enumerate changes
- `teamwerx change apply --id <change-id>` to attempt a merge into current specs
- `teamwerx change resolve --id <change-id>` to interactively handle divergence (refresh base fingerprints or skip domains)
- `teamwerx change archive --id <change-id>` to move the change folder into `.teamwerx/changes/.archive/<id>/` after application

Flow (high level)

1. Propose (draft)
   - Create `.teamwerx/changes/<id>/change.json` with desired SpecDelta operations for the target spec domains
   - Optionally add a discussion entry in the goal’s `discuss.md` to track context and decisions
2. Review
   - Discuss in the goal `discuss.md` and iterate until approval.
3. Apply
   - Run an explicit `apply` step to import tasks into the canonical plan file (`.teamwerx/goals/00X-<slug>/plan.json`) using the `PlanManager`.
   - Implementation artifacts are not auto-generated by the CLI; track code changes and notes in your repository as you prefer.
   - Add a discussion entry to record the apply action for traceability.
4. Archive
   - Move the change folder into `.teamwerx/changes/.archive/` and optionally add an archive note to the goal discussion log.

Commands (CLI)

- `teamwerx change list`

  - List change entries discovered under `.teamwerx/changes/*/change.json`.
  - Read-only; helpful before applying or archiving.




  - List change proposals and their current status.



  - Display the proposal frontmatter, a tasks summary, and the spec delta excerpt.












Files read/written (summary)

- Change workspace content:
  - `.teamwerx/changes/<id>/change.json`
- When applied:
  - `.teamwerx/goals/00X-<slug>/plan.json` — tasks are added here (canonical source)
  - (Optional) `.teamwerx/goals/00X-<slug>/implementation/` — your own implementation notes or artifacts
- When archived:
  - `.teamwerx/changes/.archive/<id>-<slug>/` — archived change folder

Integration with existing artifacts and commands

- Single source of truth for tasks: `plan.json` remains authoritative. `changes/*.md` are authoring artifacts until `apply` is invoked.
- Discussion trace: `discuss --proposal` entries are still used; the change manager appends discovery and apply/archive entries into the goal's `discuss.md` so the audit trail remains in the workspace.
- Implementation records can be created alongside tasks and tracked in your repository; link commits to task IDs for traceability.
- Archival of changes uses `.teamwerx/changes/.archive/`.

Quick recipe (copy/paste)

```bash
# 1) Create a change proposal


# 2) Review and refine (edit files and discuss)

teamwerx discuss "Feedback about filter UX" --proposal --goal 002-user-profiles

# 3) Preview apply


# 4) Apply the change (imports tasks into plan and creates stubs)


# 5) Archive when complete

```

Guidelines & safety notes



- Use `--yes` only in trusted automation contexts; otherwise the CLI will prompt for confirmation before applying or archiving.
- The change `id` embeds a numeric prefix and kebab slug (e.g., `001-add-profile-filters`) to make cross-referencing simple.

Command → Primary file mapping (changes)






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

- Each agent works on one goal at a time
- Use separate terminal sessions/IDEs for different agents

- Document blockers in goal status when work is halted

### Research & Discussion

- Capture research notes in `.teamwerx/goals/<id>/research.md` as needed
- Use `teamwerx discuss` for iterative conversations (multiple rounds)
- Follow recommended flow: plan → discuss → change (optional) → commit

### Workspace Management

- Commit changes incrementally and reference task IDs (e.g., T01) to keep plan progress traceable
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













## Archiving

Goal-level archiving is not implemented in the Go CLI. For change proposals, use:

- TEAMWERX_CI=1 teamwerx change archive --id CH-123 --changes-dir .teamwerx/changes --specs-dir .teamwerx/specs

This moves the change folder into `.teamwerx/changes/.archive/<id>/`.



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
