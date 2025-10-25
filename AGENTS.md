---
teamwerx:
  version: "1.0.0"
  initialized: "2025-10-25"
---


# teamWERX Agent Instructions

AI agents: Use teamWERX commands to coordinate goal-based development with the developer.

## Commands

### `/teamwerx.goal [description]`
Create a new goal. Prompt for success criteria. Save to `.teamwerx/goals/[kebab-case-title].md` with YAML frontmatter (title, status: draft, created, success_criteria).

### `/teamwerx.research [goal-name] [--note <text>] [--file <path>] [--url <url>]`
**Session-based analysis.** Analyze the current goal (or supplied artifact such as a plan/proposal), search the web when allowed, and incorporate any supplemental context passed through `--note`, `--file`, or `--url`. Each invocation creates `.teamwerx/research/[artifact]/session-<timestamp>/`; store `report.md`, supporting artifacts, and summaries inside that session folder without deleting previous sessions.

### `/teamwerx.discuss [message]`
**Iterative conversation.** Respond to developer messages about implementation approach. Append timestamped entries to `.teamwerx/research/[artifact]/discussion.md` (never overwrite existing discussion). Reference the relevant goal/plan/proposal explicitly at the top of each entry.

### `/teamwerx.dry-run`
Simulate current plan to identify potential issues. Provide feedback before execution.

### `/teamwerx.plan`
Generate task list from accumulated research/discussion. Update `.teamwerx/plans/[goal-name].md` in place while preserving historical context (append new sections or version notes instead of deleting prior content).

### `/teamwerx.execute [task-id]`
Execute specific task or next pending task from plan. Flow:
1. Read plan, identify task
2. Implement task (create/modify code files)
3. Update task status to completed in plan file
4. Prompt developer to commit
If no task-id: execute next pending task.

### `/teamwerx.propose [description]`
Propose change to goal/plan. Save to `.teamwerx/proposals/[goal-name]/[proposal-id].md` with frontmatter (title, type, target, status: pending, created, rationale).

### `/teamwerx.archive [goal-name] [--yes]`
Archive a completed goal (defaults to the current goal). Moves the goal, plan, research, and proposal artifacts into `.teamwerx/archive/`. Use `--yes` to skip confirmation.

### `/teamwerx.list [--status=<status>]`
List all goals. Filter by status if specified. Display title, status, created date.

### `/teamwerx.status [goal-name]`
Show detailed status of goal (or all goals if omitted). Include plan status and recent activity.

### `/teamwerx.use [goal-name]`
Set current working goal context. Store in `.teamwerx/.current-goal`.

## Conventions
- Default goal status: `draft`
- Git commits: Manual, prefix `[teamWERX]`
- File naming: kebab-case
- Task statuses: pending | in-progress | completed
- Goal statuses: draft | open | in-progress | blocked | completed | cancelled
- All commands are **non-destructive**: append to logs, create new session folders, or add addenda instead of overwriting artifacts. Use git history for changes that must replace existing content.
