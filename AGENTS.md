---
teamwerx:
  version: "1.0.0"
  initialized: "2025-10-25"
---

# teamWERX Agent Instructions

**AI agents**: This document defines how you should use teamWERX to coordinate development with humans. Follow these instructions precisely.

---

## Core Principles

1. **Charter is authoritative** — ALWAYS read `.teamwerx/charter.md` before doing any work. It defines project purpose, tech stack, conventions, and agent-specific instructions.

2. **Propose before executing** — Never make significant changes without first proposing tasks and getting confirmation.

3. **Capture everything** — Use `teamwerx discuss add` to log all decisions, discoveries, and context.

4. **Append-only** — teamWERX commands are non-destructive. Never directly overwrite `plan.json` or `discuss.md`.

5. **Transparent workflow** — Make your reasoning visible by logging discussion entries as you work.

---

## Required Workflow

### Step 1: Read the Charter

**Before any work**, read the project charter:

```bash
teamwerx charter show
```

The charter contains:
- **Purpose** — What this project does and why it exists
- **Tech Stack** — Languages, frameworks, databases, tools you must use
- **Conventions** — Commit format, branch naming, code style rules
- **Governance** — Approval processes and decision-making rules
- **AI Agent Instructions** — Project-specific guidance for you

**Critical**: The charter's "AI Agent Instructions" section may contain project-specific rules that override general conventions. Always check this section.

### Step 2: Understand the Current Goal

When asked to work on a goal, first understand its context:

```bash
# See the task plan
teamwerx plan show --goal <goal-id>

# Review decision history
teamwerx discuss list --goal <goal-id>
```

If `research.md` exists, read it for background context:

```bash
cat .teamwerx/goals/<goal-id>/research.md
```

### Step 3: Propose Tasks

Before implementing anything, break the work into concrete tasks and add them to the plan:

```bash
teamwerx plan add --goal <goal-id> "Implement user login endpoint"
teamwerx plan add --goal <goal-id> "Add password hashing with bcrypt"
teamwerx plan add --goal <goal-id> "Write integration tests for auth"
```

**Ask the human for approval** before proceeding to implementation.

### Step 4: Execute and Document

As you complete each task:

1. **Do the work** (write code, create files, run tests)
2. **Log key decisions**:
   ```bash
   teamwerx discuss add --goal <goal-id> "Using bcrypt with cost factor 12 for password hashing"
   ```
3. **Mark task complete**:
   ```bash
   teamwerx plan complete --goal <goal-id> --task T01
   ```

### Step 5: Capture Learnings

When you encounter important information:

```bash
# Log discoveries
teamwerx discuss add --goal <goal-id> "Found existing auth middleware in middleware/auth.go - will extend it"

# Log problems and solutions
teamwerx discuss add --goal <goal-id> "bcrypt import was failing - needed to run 'go get golang.org/x/crypto/bcrypt'"

# Log design decisions
teamwerx discuss add --goal <goal-id> "Decided against JWT refresh tokens for MVP - will add in next iteration"
```

---

## Command Reference

### Charter Commands

```bash
# Display the project charter (always read this first)
teamwerx charter show

# Initialize charter (only if it doesn't exist)
teamwerx charter init
```

**Agent rule**: You should **read** the charter, not modify it. Charter edits are human-driven.

### Plan Commands

```bash
# Add a new task to the plan
teamwerx plan add --goal <goal-id> "Task description"

# List all tasks with their status
teamwerx plan list --goal <goal-id>

# Show plan summary
teamwerx plan show --goal <goal-id>

# Mark a task as completed
teamwerx plan complete --goal <goal-id> --task <Txx>
```

**Agent rule**: Always add tasks before implementing them. This gives humans visibility and control.

### Discussion Commands

```bash
# Add a discussion entry (decision, note, discovery)
teamwerx discuss add --goal <goal-id> "Your message here"

# List all discussion entries
teamwerx discuss list --goal <goal-id>
```

**Agent rule**: Log liberally. Capture:
- Design decisions and rationale
- Technical discoveries
- Problems encountered and solutions
- Trade-offs considered
- Important constraints or requirements

### Spec Commands

```bash
# List all specification domains
teamwerx spec list

# Show a specific spec's requirements
teamwerx spec show <domain>
```

**Agent rule**: Specs live at `.teamwerx/specs/<domain>/spec.md` and can be read directly. Use change proposals for modifications (advanced usage).

### Change Commands (Advanced)

```bash
# List pending changes
teamwerx change list

# Apply a change proposal
teamwerx change apply --id <change-id>

# Resolve conflicts interactively
teamwerx change resolve --id <change-id>

# Archive applied change
teamwerx change archive --id <change-id>
```

**Agent rule**: Change proposals are for structured spec modifications. Only use these if explicitly working with spec change workflows.

---

## File Editing Rules

### Files YOU MUST NEVER EDIT DIRECTLY

- **plan.json** — Use `teamwerx plan` commands only
- **discuss.md** — Use `teamwerx discuss` commands only
- **charter.md** — Read-only for agents; human-maintained

### Files YOU CAN CREATE/EDIT

- **research.md** — Background research (but check if human has already created it)
- **implementation/*.md** — Implementation notes for specific tasks
- **Source code files** — Your primary work product
- **Tests** — Always create tests for new functionality
- **Documentation** — README updates, API docs, etc.

### Files HUMANS TYPICALLY MANAGE

- **summary.md** — Post-goal knowledge capture (but you can help draft it)
- **charter.md** — Project steering document (you only read this)

---

## Workspace Structure

Each goal lives in `.teamwerx/goals/<number>-<slug>/`:

```
.teamwerx/goals/001-user-auth/
├── plan.json              # Task list (managed by CLI)
├── discuss.md             # Decision log (managed by CLI)
├── research.md            # Background research (human-created)
├── implementation/        # Implementation notes (optional)
│   ├── T01.md            # Notes for task T01
│   └── T02.md            # Notes for task T02
└── summary.md             # Post-completion summary (human-created)
```

### Numbering Conventions

- **Goals**: Three-digit IDs (`001`, `002`, `003`, ...)
- **Tasks**: `T01`, `T02`, `T03`, ... (sequential within each goal)
- **Discussions**: `D01`, `D02`, `D03`, ... (sequential within each goal)
- **Reflections**: `R01`, `R02`, `R03`, ... (used in discuss.md for deeper analysis)

**Agent rule**: When editing files manually, preserve this numbering scheme.

---

## Example: Implementing a Feature

Human request: *"Add user authentication to the API"*

### Step 1: Read Charter

```bash
teamwerx charter show
```

Output shows:
- Tech stack includes Go, PostgreSQL, JWT
- Commit convention is `[PROJECT] <description>`
- Must write tests for all endpoints
- AI instruction: "Prefer standard library over third-party packages when possible"

### Step 2: Understand Context

```bash
# Assume goal 001-user-auth already exists
teamwerx plan show --goal 001-user-auth
teamwerx discuss list --goal 001-user-auth
```

Check for existing research:
```bash
cat .teamwerx/goals/001-user-auth/research.md
```

### Step 3: Propose Tasks

```bash
teamwerx plan add --goal 001-user-auth "Create User model and migration"
teamwerx plan add --goal 001-user-auth "Implement password hashing utilities"
teamwerx plan add --goal 001-user-auth "Add POST /auth/register endpoint"
teamwerx plan add --goal 001-user-auth "Add POST /auth/login endpoint"
teamwerx plan add --goal 001-user-auth "Implement JWT token generation"
teamwerx plan add --goal 001-user-auth "Add authentication middleware"
teamwerx plan add --goal 001-user-auth "Write integration tests"
```

**Say to human**: "I've added 7 tasks to the plan for user authentication. Should I proceed with implementation?"

### Step 4: Execute Tasks

For task T01:

1. Create the User model and migration files
2. Log the decision:
   ```bash
   teamwerx discuss add --goal 001-user-auth "Created users table with email, password_hash, created_at, updated_at. Using bcrypt for hashing."
   ```
3. Mark complete:
   ```bash
   teamwerx plan complete --goal 001-user-auth --task T01
   ```

For task T02:

1. Implement password hashing with bcrypt
2. Log details:
   ```bash
   teamwerx discuss add --goal 001-user-auth "Using bcrypt cost factor 12 per OWASP recommendations. Wrapped in utils/auth package."
   ```
3. Mark complete:
   ```bash
   teamwerx plan complete --goal 001-user-auth --task T02
   ```

Continue for remaining tasks...

### Step 5: Capture Problems and Solutions

If you encounter an issue:

```bash
teamwerx discuss add --goal 001-user-auth "JWT library selection: considered both golang-jwt/jwt and standard library. Chose golang-jwt/jwt v5 for better ergonomics and active maintenance."

teamwerx discuss add --goal 001-user-auth "Discovered existing session middleware in middleware/ - extended it instead of creating new auth middleware."
```

### Step 6: Summary

When all tasks are complete:

```bash
teamwerx plan show --goal 001-user-auth
```

All tasks should show `[completed]`.

**Tell the human**: "All authentication tasks are complete. I've logged all major decisions in the discussion log. Would you like me to draft a summary.md for this goal?"

---

## Decision-Making Guide

### When to ask for human approval

**ALWAYS ask before**:
- Adding external dependencies
- Making architectural changes
- Modifying database schema
- Changing API contracts
- Deploying or releasing
- Deviating from the charter's tech stack or conventions

**You can proceed without asking**:
- Adding tasks to a plan
- Writing implementation code within established patterns
- Creating tests
- Logging discussion entries
- Completing tasks
- Fixing obvious bugs

### When to use discuss.md

Log a discussion entry when:
- You make a design decision
- You discover important context
- You encounter a problem and solve it
- You identify a trade-off
- You deviate from an obvious approach (explain why)
- You learn something the next developer should know

**Example good entries**:
- "Using bcrypt with cost 12 for password hashing per OWASP recommendations"
- "Chose REST over GraphQL for this API - simpler mental model for small team"
- "Database migration failed on first attempt - needed to drop enum constraint before recreating"

**Example bad entries** (too vague):
- "Made progress"
- "Fixed bugs"
- "Updated code"

---

## Git Conventions

Commits are **human-driven** but you should remind humans to commit at logical checkpoints.

**Suggest commit messages** that follow the charter's convention:

```
[teamWERX] Complete user authentication (T01-T07)
```

When a task is finished, you might say:

> "Task T03 is complete. You might want to commit this change:
> ```
> git add .
> git commit -m '[PROJECT] Add login endpoint (T03)'
> ```
> "

---

## Advanced: Multi-Goal Coordination

When working across multiple goals:

```bash
# Check status of all goals
teamwerx plan show --goal 001-auth
teamwerx plan show --goal 002-profiles
teamwerx plan show --goal 003-payments

# Log cross-goal dependencies
teamwerx discuss add --goal 002-profiles "Blocked on T01 of 001-auth - need User model first"
```

**Agent rule**: If goals have dependencies, make them explicit in discussion logs.

---

## Automation and CI

Set `TEAMWERX_CI=1` to disable interactive prompts:

```bash
TEAMWERX_CI=1 teamwerx plan add --goal 001-demo "Automated task"
```

**Agent rule**: Only use non-interactive mode in scripts or automation. For normal development with a human, keep prompts enabled.

---

## Configuration Flags

All commands support these optional flags:

- `--goals-dir <path>` — Override default `.teamwerx/goals`
- `--specs-dir <path>` — Override default `.teamwerx/specs`
- `--changes-dir <path>` — Override default `.teamwerx/changes`

**Agent rule**: Only use these flags if the project has explicitly customized workspace locations. Default paths work for 99% of projects.

---

## Common Mistakes to Avoid

❌ **DON'T** edit `plan.json` or `discuss.md` directly  
✅ **DO** use `teamwerx plan` and `teamwerx discuss` commands

❌ **DON'T** start coding before reading the charter  
✅ **DO** run `teamwerx charter show` as your first action

❌ **DON'T** add vague tasks like "Implement feature"  
✅ **DO** add specific tasks like "Create User model", "Add login endpoint"

❌ **DON'T** make large changes without proposing them first  
✅ **DO** add tasks to the plan and get approval before implementing

❌ **DON'T** forget to log important decisions  
✅ **DO** use `teamwerx discuss add` liberally to capture context

❌ **DON'T** assume project conventions  
✅ **DO** read the charter to learn this project's specific rules

---

## Quick Reference Card

```bash
# ============================================================
# EVERY SESSION: Read the charter first
# ============================================================
teamwerx charter show

# ============================================================
# BEFORE CODING: Understand the goal
# ============================================================
teamwerx plan show --goal <goal-id>
teamwerx discuss list --goal <goal-id>

# ============================================================
# BEFORE IMPLEMENTING: Propose tasks
# ============================================================
teamwerx plan add --goal <goal-id> "Concrete task description"

# ============================================================
# DURING WORK: Log decisions and complete tasks
# ============================================================
teamwerx discuss add --goal <goal-id> "Design decision or discovery"
teamwerx plan complete --goal <goal-id> --task <Txx>

# ============================================================
# REVIEW PROGRESS: Show what's done
# ============================================================
teamwerx plan list --goal <goal-id>
```

---

## Questions?

If the charter's "AI Agent Instructions" section provides guidance that conflicts with this document, **follow the charter**. It is project-specific and authoritative.

If you're unsure whether to proceed with an action, **ask the human**. It's better to over-communicate than to make incorrect assumptions.

**Remember**: Your goal is to augment human decision-making, not replace it. Use teamWERX to make your work transparent, traceable, and collaborative.