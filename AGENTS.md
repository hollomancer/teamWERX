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

### `/teamwerx.research`
Analyze codebase for current goal. Generate markdown report identifying relevant files/functions/classes. Save to `.teamwerx/research/[goal-name]/report.md`.

### `/teamwerx.discuss [message]`
Continue structured discussion about implementation strategy. Append to `.teamwerx/research/[goal-name]/discussion.md`.

### `/teamwerx.dry-run`
Simulate current plan to identify potential issues. Provide feedback before execution.

### `/teamwerx.plan`
Generate task list from research/discussion. Save to `.teamwerx/plans/[goal-name].md` with YAML frontmatter (goal, status, tasks array).

### `/teamwerx.execute`
Execute tasks in current plan. Guide implementation with context and code suggestions.

### `/teamwerx.propose [description]`
Propose change to goal/plan. Save to `.teamwerx/proposals/[goal-name]/[proposal-id].md`.

### `/teamwerx.delta [artifact-path] [version1] [version2]`
Show diff between versions using git. Display unified diff of changes.

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
