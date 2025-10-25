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
**One-time codebase analysis.** Analyze existing codebase for current goal. Identify relevant files/functions/patterns. Save structured report to `.teamwerx/research/[goal-name]/report.md`.

### `/teamwerx.discuss [message]`
**Iterative conversation.** Respond to developer's message about implementation approach. Can be called multiple times. Append to `.teamwerx/research/[goal-name]/discussion.md`.

### `/teamwerx.dry-run`
Simulate current plan to identify potential issues. Provide feedback before execution.

### `/teamwerx.plan`
Generate task list from research/discussion. Save to `.teamwerx/plans/[goal-name].md` with YAML frontmatter (goal, status, tasks array with id, description, status).

### `/teamwerx.execute [task-id]`
Execute specific task or next pending task from plan. Flow:
1. Read plan, identify task
2. Implement task (create/modify code files)
3. Update task status to completed in plan file
4. Prompt developer to commit
If no task-id: execute next pending task.

### `/teamwerx.propose [description]`
Propose change to goal/plan. Save to `.teamwerx/proposals/[goal-name]/[proposal-id].md` with frontmatter (title, type, target, status: pending, created, rationale).

### `/teamwerx.approve [proposal-id]`
Approve proposal. Update status to approved, apply changes to target goal/plan, archive proposal, prompt commit.

### `/teamwerx.reject [proposal-id] [reason]`
Reject proposal. Update status to rejected, add reason, archive proposal, prompt commit. Do not modify target.

### `/teamwerx.delta [artifact-path] [version1] [version2]`
Show diff between versions using git diff. Display unified diff of changes.

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
