# teamWERX

[![Release (goreleaser)](https://github.com/hollomancer/teamwerx/actions/workflows/release.yml/badge.svg)](https://github.com/hollomancer/teamwerx/actions/workflows/release.yml)

> A lightweight CLI for organizing development work with AI coding assistants.

## What is teamWERX?

teamWERX helps you work effectively with AI coding assistants by providing a structured workflow for goals, research, planning, and decision tracking.

**Key principle**: Everything is a file. Your charter, research, plans, discussions, and specifications live in `.teamwerx/` and version with your code.

## The Workflow

teamWERX follows a clear progression with research/discuss/decide at each level:

```
CHARTER → GOAL → PLAN → TASKS → SPEC
   ↓        ↓       ↓       ↓       ↓
 R/D/D    R/D/D   R/D/D   E/D/D   Create

R/D/D = Research/Discuss/Decide
E/D/D = Execute/Discuss/Decide
```

### 1. CHARTER (Project Level)

Define your project once:
- Purpose and vision
- Technology stack
- Coding conventions
- AI-specific instructions

**You do this once.** Your AI reads it before every session.

### 2. GOAL (Feature Level)

For each feature or initiative:
- **Research**: AI investigates options, reviews existing code
- **Discuss**: AI presents findings, you review together
- **Decide**: You approve the approach

Creates: `research.md` with options analysis and recommendation

### 3. PLAN (Task Breakdown Level)

Break the goal into tasks:
- **Research**: Determine logical task sequence
- **Discuss**: Review task breakdown
- **Decide**: Approve the plan

Creates: `plan.json` with task list

### 4. TASKS (Execution Level)

For each task:
- **Execute**: AI implements code
- **Discuss**: AI logs decisions continuously
- **Decide**: Mark task complete

Updates: `discuss.md` with implementation narrative

### 5. SPEC (Formalization Level)

After goal completion:
- **Create**: Formalize what was built into specifications
- Document API contracts, decisions, integration points

Updates: `.teamwerx/specs/<domain>/spec.md`

## Installation

### Download pre-built binary (recommended)

1. Go to [Releases](https://github.com/hollomancer/teamwerx/releases)
2. Download the archive for your OS (macOS, Linux, Windows)
3. Extract and place `teamwerx` binary on your PATH

### Install with Go

```bash
go install github.com/teamwerx/teamwerx/cmd/teamwerx@latest
```

Binary installs to `$GOPATH/bin` (usually `~/go/bin`).

### Build from source

```bash
git clone https://github.com/hollomancer/teamwerx.git
cd teamwerx
make build
```

## Quick Start

### 1. Initialize your charter

```bash
teamwerx charter init
```

Edit `.teamwerx/charter.md` with your project details:

```yaml
---
title: Project Charter
version: 1.0.0
purpose: E-commerce platform for artisan goods
tech_stack:
  - Go 1.21
  - PostgreSQL 15
  - React + TypeScript
conventions:
  commit_prefix: '[PROJECT]'
  branch_naming: feature/*, bugfix/*
---

# Project Charter

## Purpose
Build a marketplace connecting artisan creators with customers.

## Tech Stack
- Backend: Go with standard library preference
- Database: PostgreSQL
- Frontend: React + TypeScript

## Conventions
- Commits: `[PROJECT] <description>`
- Tests required for all endpoints

## AI Agent Instructions
- Prefer standard library over dependencies
- Security is paramount
- Write tests before marking tasks complete
```

### 2. Create your first goal workspace

```bash
mkdir -p .teamwerx/goals/001-user-auth
```

### 3. Start working with AI

Give your AI this prompt:

> "I want to implement user authentication as goal 001-user-auth. Please:
> 1. Read the charter
> 2. Research the approach and create research.md
> 3. Present your findings and wait for approval
> 4. Create a task plan
> 5. Execute tasks, logging decisions continuously
> 6. Help update specs after completion"

The AI follows the teamWERX workflow automatically (it reads `AGENTS.md`).

## Working with AI: The Complete Flow

### CHARTER Level

**You (once per project):**

```bash
teamwerx charter init
# Edit .teamwerx/charter.md with your project details
```

### GOAL Level

**Prompt your AI:**

> "I want to add user authentication. Please research the approach for this project and create research.md at `.teamwerx/goals/001-user-auth/research.md`."

**AI researches and creates research.md:**
```markdown
# Research: User Authentication

## Requirements
- Email/password registration and login
- JWT tokens for sessions
- Password security

## Existing Code Review
- Found DB connection in db/postgres.go
- Found migration system
- No existing auth code

## Technical Options
1. **bcrypt** for hashing (industry standard, adjustable cost)
2. argon2 (more modern, complex config)

1. **golang-jwt/jwt v5** (popular, good ergonomics)
2. Standard library (more boilerplate)

## Recommended Approach
- bcrypt with cost 12 (OWASP standard)
- golang-jwt/jwt v5 for tokens
- Follow existing middleware pattern

## Open Questions
- Password complexity requirements?
- Token expiration time?
```

**AI discusses:**
```bash
teamwerx discuss add --goal 001-user-auth "Research complete. Recommending bcrypt + JWT. See research.md for details."
```

**AI presents to you:**

> "I've researched user authentication. Recommending bcrypt for password hashing and golang-jwt/jwt for tokens. See `.teamwerx/goals/001-user-auth/research.md` for full analysis. I have questions about password requirements and token expiration. Approve?"

**You review and decide:**

```bash
cat .teamwerx/goals/001-user-auth/research.md
```

> "Approved. Use bcrypt cost 12, JWT 24h expiration, min 8 chars for passwords. Log this and create the plan."

### PLAN Level

**AI researches task breakdown, discusses, and creates plan:**

```bash
teamwerx discuss add --goal 001-user-auth "Approved approach. Breaking into 7 tasks: model, hashing, register, login, JWT, middleware, tests."

teamwerx plan add --goal 001-user-auth "Create User model and migration"
teamwerx plan add --goal 001-user-auth "Implement password hashing utilities"
teamwerx plan add --goal 001-user-auth "Add POST /auth/register endpoint"
teamwerx plan add --goal 001-user-auth "Add POST /auth/login endpoint"
teamwerx plan add --goal 001-user-auth "Implement JWT token generation"
teamwerx plan add --goal 001-user-auth "Add authentication middleware"
teamwerx plan add --goal 001-user-auth "Write integration tests"
```

**AI shows plan:**

> "Created 7 tasks for user authentication. Review with `teamwerx plan show --goal 001-user-auth`. Proceed?"

**You approve:**

> "Yes, proceed with implementation."

### TASK Level

**AI executes each task with continuous discussion:**

```bash
# Task 1
teamwerx discuss add --goal 001-user-auth "Starting T01: User model with email, password_hash, timestamps"
# AI implements User struct, migration file, runs migration
teamwerx discuss add --goal 001-user-auth "Using CITEXT for email field - ensures case-insensitive uniqueness"
teamwerx plan complete --goal 001-user-auth --task T01
teamwerx discuss add --goal 001-user-auth "Completed T01: User model with migration, email constraint added"

# Task 2
teamwerx discuss add --goal 001-user-auth "Starting T02: Password hashing utilities"
# AI implements HashPassword() and CheckPassword()
teamwerx discuss add --goal 001-user-auth "Created HashPassword/CheckPassword in utils/auth with bcrypt cost 12"
teamwerx discuss add --goal 001-user-auth "Added unit tests covering edge cases - empty passwords, cost verification"
teamwerx plan complete --goal 001-user-auth --task T02
teamwerx discuss add --goal 001-user-auth "Completed T02: Password utilities with full test coverage"

# Continue for remaining tasks...
```

**You review progress anytime:**

```bash
teamwerx plan show --goal 001-user-auth
teamwerx discuss list --goal 001-user-auth
```

### SPEC Level

**After goal completion, AI updates specs:**

> "All tasks complete for 001-user-auth. Should I update the authentication spec?"

**AI updates `.teamwerx/specs/authentication/spec.md`:**
```markdown
# Authentication Specification

## Endpoints

### POST /auth/register
- Request: `{"email": "string", "password": "string"}`
- Response: `{"user_id": "uuid", "token": "jwt"}`
- Password requirements: min 8 chars
- Password storage: bcrypt cost 12

### POST /auth/login
- Request: `{"email": "string", "password": "string"}`
- Response: `{"user_id": "uuid", "token": "jwt"}`
- Case-insensitive email matching

## JWT Tokens
- Expiration: 24 hours
- Algorithm: HS256
- Claims: user_id, email, exp

## Middleware
- Bearer token authentication
- Available at: middleware/auth.go
```

**You commit everything:**

```bash
git add .teamwerx/ src/
git commit -m "[teamWERX] Complete user authentication (001-user-auth)"
```

## Recommended AI Prompts

### Starting a goal

```
I want to implement [FEATURE] as goal [ID]-[NAME].
Please:
1. Read the charter
2. Research the approach and create research.md
3. Present findings and wait for approval
4. Create the task plan
5. Execute tasks with continuous discussion logging
6. Update relevant specs when complete
```

### Checking progress

```
What's the status of goal [ID]? Show completed tasks, remaining work, and any blockers.
```

### Reviewing decisions

```
Show me all the decisions we made for goal [ID].
```

### Resuming work

```
Let's continue goal [ID]. Catch me up on what's done and what's next.
```

### Investigating options

```
Before implementing [FEATURE], research the options and document your findings in research.md. Include pros/cons and a recommendation.
```

### Getting summary

```
Goal [ID] is complete. Please help create a summary.md documenting what we built, key decisions, and lessons learned.
```

## Best Practices

### 1. Charter first, always

Initialize and customize your charter before any goals. It guides all AI behavior.

### 2. Enforce the workflow

Don't let AI skip steps:
- **Goal level**: Require research.md before approving
- **Plan level**: Review task breakdown before execution
- **Task level**: Require continuous discussion logging
- **Spec level**: Formalize what was built

### 3. Review research before approving

Always read the research.md AI creates. Ask questions, suggest alternatives, challenge assumptions.

### 4. Use descriptive names

- ✅ `001-user-authentication`
- ✅ `002-stripe-payments`
- ❌ `001-feature`

### 5. Keep tasks granular

Good:
- ✅ "Create User model and migration"
- ✅ "Add login endpoint"

Bad:
- ❌ "Implement authentication system"

### 6. Commit `.teamwerx/` with code

```bash
git add .teamwerx/ src/
git commit -m "[teamWERX] Complete feature (goal ID)"
```

This creates an audit trail.

### 7. Update specs after completion

Don't skip the spec formalization step. It documents what was actually built.

## Command Reference

### Charter

```bash
teamwerx charter init    # Initialize charter
teamwerx charter show    # View charter
```

### Discussion

```bash
teamwerx discuss add --goal <id> "Message"    # Log decision/discovery
teamwerx discuss list --goal <id>             # List all entries
```

### Plan

```bash
teamwerx plan add --goal <id> "Task"          # Add task
teamwerx plan list --goal <id>                # List tasks
teamwerx plan show --goal <id>                # Show summary
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

## Workspace Structure

```
.teamwerx/
├── charter.md                    # Project steering document
├── goals/
│   ├── 001-user-auth/
│   │   ├── research.md           # Goal-level research
│   │   ├── plan.json             # Task list (CLI-managed)
│   │   ├── discuss.md            # Decisions (CLI-managed)
│   │   └── summary.md            # Post-completion summary
│   └── 002-payments/
│       └── ...
└── specs/
    ├── authentication/
    │   └── spec.md               # Formalized spec
    └── payments/
        └── spec.md
```

### File ownership

**You create/edit:**
- `charter.md` (initialize, then customize)
- `research.md` (AI creates, you can edit)
- `summary.md` (you or AI can create)
- Specs (`.teamwerx/specs/<domain>/spec.md`)

**CLI manages (never edit directly):**
- `plan.json` (use `teamwerx plan` commands)
- `discuss.md` (use `teamwerx discuss` commands)

## File Formats

### charter.md

```yaml
---
title: Project Charter
version: 1.0.0
purpose: Brief project purpose
tech_stack:
  - Technology 1
  - Technology 2
conventions:
  commit_prefix: '[PROJECT]'
---

# Project Charter

## Purpose
[Vision and goals]

## Tech Stack
[Technologies]

## Conventions
[Standards]

## AI Agent Instructions
[AI-specific guidance]
```

### research.md

```markdown
# Research: [Goal Name]

## Requirements
- [What we're building]

## Existing Code Review
- [Relevant patterns, code to reuse]

## Technical Options
- Option 1: [Approach]
  - Pros: ...
  - Cons: ...

## Recommended Approach
[Recommendation with rationale]

## Open Questions
- [Uncertainties for human]
```

### plan.json

```json
{
  "goal_id": "001-user-auth",
  "tasks": [
    {
      "id": "T01",
      "title": "Create User model and migration",
      "status": "completed"
    },
    {
      "id": "T02",
      "title": "Implement password hashing",
      "status": "pending"
    }
  ],
  "updated_at": "2025-01-15T10:30:00Z"
}
```

### discuss.md

```yaml
---
id: D01
type: discussion
timestamp: 2025-01-15T10:00:00Z
content: Research complete. Recommending bcrypt + JWT approach.
---

---
id: D02
type: discussion
timestamp: 2025-01-15T10:15:00Z
content: Starting T01 - User model with email, password_hash, timestamps
---

---
id: D03
type: discussion
timestamp: 2025-01-15T10:45:00Z
content: Using CITEXT for email field - ensures case-insensitive uniqueness
---
```

## Common Workflows

### Starting a new feature

```bash
mkdir -p .teamwerx/goals/002-payments
```

**Prompt AI:**

> "Implement Stripe payment integration as goal 002-payments. Follow the full workflow: research, plan, execute, update specs."

### Resuming after a break

**Prompt AI:**

> "Catch me up on goal 002-payments. What's done, what's next?"

**AI responds:**

> "For 002-payments: Completed T01-T03 (Stripe setup, payment model, create endpoint). Remaining: T04 (webhook handling), T05 (refund endpoint), T06 (tests). Continue with T04?"

### Investigating before deciding

**Prompt AI:**

> "Before implementing real-time notifications, research WebSockets vs Server-Sent Events vs polling. Create research.md with analysis."

### Working on multiple goals

Switch contexts freely - each goal is independent:

> "Pause 002-payments. Start 003-email-notifications. Research email service options first."

### Reviewing all work for a goal

```bash
teamwerx plan show --goal 001-user-auth
teamwerx discuss list --goal 001-user-auth
cat .teamwerx/goals/001-user-auth/research.md
cat .teamwerx/goals/001-user-auth/summary.md
```

## Tips for Working with AI

### Enforce the workflow

**Don't accept:**
> "I'll implement authentication now"

**Require:**
> "First create research.md, then discuss your findings with me"

### Be specific

**Vague:**
> "Add payments"

**Specific:**
> "Add Stripe payment processing as goal 002-payments. Research the approach, then create a plan."

### Request progress updates

> "After each task, tell me what you did before starting the next one."

### Review before approving

At each level:
- **Goal**: Review research.md
- **Plan**: Review task list
- **Task**: Review discuss.md narrative
- **Spec**: Review spec updates

### Use AI to document

> "Based on the discussion log, help me create summary.md for this goal."

## Troubleshooting

### AI skipping research

**Remind it:**

> "Don't skip the research phase. Create research.md first, then discuss findings with me."

### Missing discussion entries

**Correct it:**

> "Please log more decisions as you work. I want to understand your reasoning."

### AI editing files directly

**Stop it:**

> "Don't edit plan.json or discuss.md directly. Use the teamwerx CLI commands."

### Specs not updated

**Remind it:**

> "After completing a goal, update the relevant spec at .teamwerx/specs/<domain>/spec.md."

## Advanced Features

### Non-interactive mode (CI/automation)

```bash
TEAMWERX_CI=1 teamwerx plan add --goal 001-demo "Automated task"
```

### Custom workspace paths

```bash
teamwerx plan list --goals-dir /custom/path --goal 001-demo
```

### Spec change proposals

For formal spec management with conflict detection:

```bash
teamwerx change apply --id CH-001
teamwerx change resolve --id CH-001  # if conflicts
teamwerx change archive --id CH-001
```

See [docs/spec-merging.md](docs/spec-merging.md) for details.

## Example Prompts Library

### Initial setup

```
I'm starting a new project. Help me customize the charter at .teamwerx/charter.md. Ask me about project purpose, tech stack, and conventions.
```

### Starting a goal

```
Implement [FEATURE] as goal [ID]-[NAME]. Follow the workflow:
1. Research and create research.md
2. Discuss findings, wait for approval
3. Create task plan
4. Execute tasks with discussion logging
5. Update specs when complete
```

### Checking status

```
Show status of goal [ID]:
- Completed tasks
- Remaining tasks
- Any blockers
```

### Getting context

```
I'm returning to goal [ID]. Review the plan and discussion log and catch me up.
```

### Requesting summary

```
Create summary.md for goal [ID] covering what we built, key decisions, and lessons learned.
```

## Requirements

- Go 1.18+ (if building from source)
- Git (for version control)
- An AI coding assistant that can run shell commands

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Building and testing
- Code organization
- Adding new commands
- Release process

## License

MIT

## Links

- **Documentation**: [docs/](docs/)
- **Agent Instructions**: [AGENTS.md](AGENTS.md)
- **Issue Tracker**: [GitHub Issues](https://github.com/hollomancer/teamwerx/issues)
- **Contributing**: [CONTRIBUTING.md](CONTRIBUTING.md)
