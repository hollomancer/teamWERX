---
teamwerx:
  version: "1.0.0"
  initialized: "2025-10-25"
---

# teamWERX Agent Instructions

**AI agents**: Follow this workflow precisely when using teamWERX.

---

## Core Workflow

```
CHARTER → GOAL → PLAN → TASKS → SPEC
   ↓        ↓       ↓       ↓       ↓
 R/D/D    R/D/D   R/D/D   E/D/D   Create

R/D/D = Research/Discuss/Decide
E/D/D = Execute/Discuss/Decide
```

Each level requires research, discussion, and decision-making before proceeding.

---

## The Workflow

### 1. CHARTER (Project Level)

**Do once per project.**

```bash
teamwerx charter show
```

The charter defines:
- Project purpose
- Tech stack
- Conventions (commits, branches, code style)
- AI-specific instructions

**Agent rule**: Read charter before any work. It's authoritative.

### 2. GOAL (Feature Level)

**For each new feature/initiative.**

#### Research phase:
- Understand requirements
- Review existing code (`grep`, `find_path`)
- Investigate technical options
- Create `.teamwerx/goals/<goal-id>/research.md`

**research.md template**:
```markdown
# Research: <Goal Name>

## Requirements
- [What we're building]

## Existing Code Review
- [Relevant patterns, code to reuse]

## Technical Options
- Option 1: [Approach]
  - Pros: ...
  - Cons: ...
- Option 2: [Approach]
  - Pros: ...
  - Cons: ...

## Recommended Approach
[Your recommendation with rationale]

## Open Questions
- [Uncertainties for human]
```

#### Discuss phase:
```bash
teamwerx discuss add --goal <goal-id> "Completed research. Recommending [approach]. See research.md."
```

**Tell human**: "I've researched [goal]. Recommending [approach]. See research.md. Approve?"

#### Decide phase:
Wait for human approval before proceeding.

### 3. PLAN (Task Breakdown Level)

**Break goal into tasks.**

#### Research phase:
- Determine logical task sequence
- Identify dependencies
- Consider testing strategy

#### Discuss phase:
```bash
teamwerx discuss add --goal <goal-id> "Breaking work into [N] tasks: [summary]"
```

#### Decide phase:
```bash
teamwerx plan add --goal <goal-id> "Task 1 description"
teamwerx plan add --goal <goal-id> "Task 2 description"
# ... repeat
```

**Tell human**: "I've created [N] tasks. Review with `teamwerx plan show --goal <goal-id>`. Approve?"

Wait for approval.

### 4. TASKS (Execution Level)

**For each task:**

#### Execute phase:
1. Log start:
   ```bash
   teamwerx discuss add --goal <goal-id> "Starting T0X: [what you're doing]"
   ```

2. Implement code

3. Write tests

#### Discuss phase:
Log decisions as you work:
```bash
teamwerx discuss add --goal <goal-id> "[Decision with rationale]"
teamwerx discuss add --goal <goal-id> "[Discovery or problem solved]"
```

#### Decide phase:
```bash
teamwerx plan complete --goal <goal-id> --task T0X
teamwerx discuss add --goal <goal-id> "Completed T0X: [summary]"
```

**Pattern**: Start → Implement → Log decisions → Complete → Summarize

### 5. SPEC (Formalization Level)

**After goal completion**, formalize what was built into specifications.

```bash
# Review spec domains
teamwerx spec list

# Update relevant spec
# Edit .teamwerx/specs/<domain>/spec.md
```

Document:
- What was implemented
- API contracts
- Key decisions
- Integration points

---

## Commands

### Charter
```bash
teamwerx charter show    # Read charter (do this first)
teamwerx charter init    # Initialize charter (if missing)
```

### Discussion
```bash
teamwerx discuss add --goal <id> "Message"    # Log decision/discovery
teamwerx discuss list --goal <id>             # List entries
```

### Plan
```bash
teamwerx plan add --goal <id> "Task"          # Add task
teamwerx plan list --goal <id>                # List tasks
teamwerx plan show --goal <id>                # Show plan summary
teamwerx plan complete --goal <id> --task TX  # Mark complete
```

### Spec
```bash
teamwerx spec list              # List spec domains
teamwerx spec show <domain>     # Show spec
```

### Changes (Advanced)
```bash
teamwerx change list                # List changes
teamwerx change apply --id <id>     # Apply change
teamwerx change resolve --id <id>   # Resolve conflicts
teamwerx change archive --id <id>   # Archive change
```

---

## File Rules

### NEVER edit directly:
- `plan.json` (use `teamwerx plan` commands)
- `discuss.md` (use `teamwerx discuss` commands)
- `charter.md` (read-only for agents)

### YOU create/edit:
- `research.md` (goal-level investigation)
- `implementation/*.md` (task notes, optional)
- Source code files
- Tests
- Specs (`.teamwerx/specs/<domain>/spec.md`)

### HUMANS manage:
- `charter.md` (you read only)
- `summary.md` (post-goal summary)

---

## Workspace Structure

```
.teamwerx/
├── charter.md                    # Project steering doc
├── goals/
│   └── 001-feature/
│       ├── research.md           # Goal-level research
│       ├── plan.json             # Tasks (CLI-managed)
│       ├── discuss.md            # Decisions (CLI-managed)
│       └── summary.md            # Post-completion (optional)
└── specs/
    └── domain/
        └── spec.md               # Formalized spec
```

**Numbering**:
- Goals: `001`, `002`, `003`, ...
- Tasks: `T01`, `T02`, `T03`, ...
- Discussions: `D01`, `D02`, `D03`, ...

---

## research.md vs discuss.md

**research.md**:
- Created at goal start (once)
- Upfront investigation
- Options analysis
- Recommended approach

**discuss.md**:
- Updated continuously
- Implementation narrative
- Decisions made during work
- Problems/solutions

**Think**: research = planning, discuss = journal

---

## When to Ask Human

**ALWAYS ask before**:
- Adding external dependencies
- Architectural changes
- Database schema changes
- API contract changes
- Deviating from charter tech stack

**Proceed without asking**:
- Adding tasks to plan
- Implementing within established patterns
- Writing tests
- Logging discussion entries
- Completing tasks

---

## Discussion Logging

Log **frequently** during task execution:

**Starting task**:
```bash
teamwerx discuss add --goal <id> "Starting T0X: [what you'll do]"
```

**Design decision**:
```bash
teamwerx discuss add --goal <id> "Using bcrypt cost 12 per OWASP recommendations"
```

**Discovery**:
```bash
teamwerx discuss add --goal <id> "Found existing auth middleware - will extend it"
```

**Problem/solution**:
```bash
teamwerx discuss add --goal <id> "Migration failed - needed to drop constraint first"
```

**Completion**:
```bash
teamwerx discuss add --goal <id> "Completed T0X: [what you accomplished]"
```

**Goal**: Create narrative another developer can follow.

---

## Example: User Authentication

### Charter
```bash
teamwerx charter show
# Output shows: Go, PostgreSQL, prefer stdlib, security paramount
```

### Goal Research
Create `.teamwerx/goals/001-user-auth/research.md`:
- Requirements: email/password auth, JWT tokens
- Existing: found DB connection, no existing auth
- Options: bcrypt vs argon2, golang-jwt vs stdlib
- Recommend: bcrypt + golang-jwt/jwt
- Questions: token expiration? password complexity?

```bash
teamwerx discuss add --goal 001-user-auth "Research complete. Recommending bcrypt + JWT. See research.md."
```

**Tell human**: Present findings, wait for approval.

### Plan Research
Determine task breakdown:
- User model + migration
- Password hashing
- Register endpoint
- Login endpoint
- JWT generation
- Auth middleware
- Tests

```bash
teamwerx discuss add --goal 001-user-auth "Breaking into 7 tasks: model, hashing, register, login, JWT, middleware, tests"
teamwerx plan add --goal 001-user-auth "Create User model and migration"
teamwerx plan add --goal 001-user-auth "Implement password hashing utilities"
# ... repeat for all 7 tasks
```

**Tell human**: "Created 7 tasks. Approve?"

### Task Execution
```bash
# T01
teamwerx discuss add --goal 001-user-auth "Starting T01: User model with email, password_hash, created_at"
# Implement...
teamwerx discuss add --goal 001-user-auth "Using CITEXT for case-insensitive email"
teamwerx plan complete --goal 001-user-auth --task T01
teamwerx discuss add --goal 001-user-auth "Completed T01: User model with migration"

# T02
teamwerx discuss add --goal 001-user-auth "Starting T02: Password hashing"
# Implement...
teamwerx discuss add --goal 001-user-auth "Created HashPassword/CheckPassword with bcrypt cost 12"
teamwerx plan complete --goal 001-user-auth --task T02
teamwerx discuss add --goal 001-user-auth "Completed T02: Password utils with tests"

# Continue for T03-T07...
```

### Spec Update
After completion, update `.teamwerx/specs/authentication/spec.md`:
- Document POST /auth/register
- Document POST /auth/login
- Document JWT token format
- Document auth middleware usage

---

## Quick Reference

```bash
# EVERY SESSION
teamwerx charter show

# GOAL START
# 1. Create research.md with investigation
# 2. Discuss findings with human
teamwerx discuss add --goal <id> "Research complete. Recommend [X]."
# 3. Wait for approval

# PLAN START
# 1. Determine task breakdown
# 2. Discuss approach
teamwerx discuss add --goal <id> "Breaking into [N] tasks: [summary]"
teamwerx plan add --goal <id> "Task description"
# 3. Wait for approval

# TASK EXECUTION
teamwerx discuss add --goal <id> "Starting T0X: [description]"
# ... implement and log decisions ...
teamwerx plan complete --goal <id> --task T0X
teamwerx discuss add --goal <id> "Completed T0X: [summary]"

# GOAL COMPLETION
# Update relevant specs in .teamwerx/specs/
```

---

## Common Mistakes

❌ Skip charter → ✅ Read charter first
❌ Code without research → ✅ Research, then discuss with human
❌ Vague tasks → ✅ Specific, granular tasks
❌ Silent implementation → ✅ Log decisions continuously
❌ Edit plan.json directly → ✅ Use `teamwerx plan` commands
❌ Forget specs → ✅ Update specs after goal completion

---

## Configuration

Set `TEAMWERX_CI=1` to disable prompts (automation only).

Optional flags (use defaults unless customized):
- `--goals-dir` (default: `.teamwerx/goals`)
- `--specs-dir` (default: `.teamwerx/specs`)
- `--changes-dir` (default: `.teamwerx/changes`)

---

## Summary

**Workflow**: Charter → Goal (R/D/D) → Plan (R/D/D) → Tasks (E/D/D) → Spec

**Key principle**: Research and discuss at each level before proceeding.

**Remember**: Charter is authoritative. Research before coding. Discuss continuously. Update specs after completion.

If charter's "AI Agent Instructions" conflicts with this doc, **follow the charter**.

If unsure, **ask the human**.