# teamWERX

[![Release (goreleaser)](https://github.com/hollomancer/teamwerx/actions/workflows/release.yml/badge.svg)](https://github.com/hollomancer/teamwerx/actions/workflows/release.yml)

> A lightweight CLI for managing development goals, specifications, and AI-assisted workflows.

## What is teamWERX?

teamWERX helps you organize development work into clear, traceable goals with the help of AI coding assistants. It's designed for individual developers who:

- Want to keep their work organized across multiple features or goals
- Work with AI coding assistants (Claude, ChatGPT, Copilot, etc.)
- Need to track decisions, specifications, and task progress
- Value simplicity and git-based version control

**Key principle**: Everything is a file. Your goals, plans, discussions, and specifications live in `.teamwerx/` and version with your code in git.

## How it works

1. **Create your charter** — Define your project's purpose, tech stack, and conventions in `.teamwerx/charter.md`
2. **Organize by goals** — Create numbered workspaces (`.teamwerx/goals/001-demo/`) for each feature or project
3. **Plan your work** — Break down goals into tasks stored in `plan.json`
4. **Capture decisions** — Log discussions and context in `discuss.md` 
5. **Track specs** — Manage specifications as Markdown files with version control
6. **Work with AI** — AI agents read the charter and `AGENTS.md` to understand your workflow and help execute tasks

All artifacts are plain text files that live alongside your code, making them easy to read, diff, and version control.

## Quick Example

Here's a typical workflow for adding a new feature:

```bash
# 1. Add tasks to your goal's plan
teamwerx plan add --goal 001-auth "Implement login endpoint"
teamwerx plan add --goal 001-auth "Add password hashing"
teamwerx plan add --goal 001-auth "Write authentication tests"

# 2. See what's on your plate
teamwerx plan list --goal 001-auth
# Output:
# - T01 [pending] Implement login endpoint
# - T02 [pending] Add password hashing
# - T03 [pending] Write authentication tests

# 3. Capture a design decision
teamwerx discuss add --goal 001-auth "Using bcrypt for password hashing"

# 4. Mark tasks complete as you finish them
teamwerx plan complete --goal 001-auth --task T01

# 5. Review your discussion log
teamwerx discuss list --goal 001-auth
```

Everything you create is stored in `.teamwerx/goals/001-auth/`:
- `plan.json` — Your task list with completion status
- `discuss.md` — Your decision log and notes
- `research.md` — Background research (you create manually)
- `implementation/` — Implementation notes (optional)

## Installation

### Download pre-built binary (recommended)

1. Go to [Releases](https://github.com/hollomancer/teamwerx/releases)
2. Download the archive for your OS (macOS, Linux, Windows)
3. Extract and place `teamwerx` binary on your PATH

### Install with Go

If you have Go 1.18+ installed:

```bash
go install github.com/teamwerx/teamwerx/cmd/teamwerx@latest
```

The binary will be installed to `$GOPATH/bin` (usually `~/go/bin`).

### Build from source

```bash
git clone https://github.com/hollomancer/teamwerx.git
cd teamwerx
make build
# Binary is created as ./teamwerx
```

## Getting Started

### 1. Initialize your project charter

The charter is your project's steering document - it defines purpose, tech stack, and conventions for AI agents and team members:

```bash
teamwerx charter init
```

This creates `.teamwerx/charter.md` with a template you can customize. Edit it to include:
- Project purpose and vision
- Technology stack
- Coding conventions and standards
- AI agent instructions specific to your project

View your charter anytime:

```bash
teamwerx charter show
```

### 2. Set up your first goal workspace

Create a directory for your goal:

```bash
mkdir -p .teamwerx/goals/001-my-feature
```

### 3. Start planning

Add tasks to your plan:

```bash
teamwerx plan add --goal 001-my-feature "Research existing solutions"
teamwerx plan add --goal 001-my-feature "Design the API"
teamwerx plan add --goal 001-my-feature "Implement core logic"
```

View your plan:

```bash
teamwerx plan show --goal 001-my-feature
```

### 4. Capture decisions as you work

```bash
teamwerx discuss add --goal 001-my-feature "Decided to use REST instead of GraphQL for simplicity"
```

### 5. Track progress

Complete tasks as you finish them:

```bash
teamwerx plan complete --goal 001-my-feature --task T01
```

Check what's done:

```bash
teamwerx plan list --goal 001-my-feature
```

## Common Workflows

### Planning a new feature

```bash
# Create workspace directory
mkdir -p .teamwerx/goals/002-user-profiles

# Add implementation tasks
teamwerx plan add --goal 002-user-profiles "Create user profile model"
teamwerx plan add --goal 002-user-profiles "Add profile endpoints"
teamwerx plan add --goal 002-user-profiles "Build profile UI"

# Document your approach
teamwerx discuss add --goal 002-user-profiles "Profiles will use separate table for extensibility"
```

### Working on multiple goals

You can work on several goals concurrently. Each has its own workspace:

```bash
# Check progress on feature A
teamwerx plan show --goal 001-auth

# Add task to feature B
teamwerx plan add --goal 002-profiles "Add avatar upload"

# Switch context by changing goal ID in commands
teamwerx discuss list --goal 001-auth
teamwerx discuss list --goal 002-profiles
```

### Reviewing what's been done

```bash
# See all tasks and their status
teamwerx plan show --goal 001-auth

# Review decision log
teamwerx discuss list --goal 001-auth

# Check discussion details
cat .teamwerx/goals/001-auth/discuss.md
```

### Managing specifications

teamWERX can track project specifications as Markdown files:

```bash
# List all specs
teamwerx spec list

# View a specific spec's requirements
teamwerx spec show authentication

# Specs are stored at .teamwerx/specs/<domain>/spec.md
# You edit them manually or via change proposals (see Advanced Usage)
```

### Using with AI assistants

teamWERX is designed to work seamlessly with AI coding assistants. The `AGENTS.md` file in your project root tells AI agents how to use teamWERX commands.

When working with an AI:

1. **Give context**: "Check the plan for goal 001-auth"
2. **Ask for updates**: "Add a task to implement rate limiting"  
3. **Capture decisions**: "Log our discussion about using JWT tokens"

The AI can run teamWERX commands to update plans and discussions as you work together.

## Command Reference

### Charter

Create and view your project's steering document.

```bash
# Initialize charter (first time only)
teamwerx charter init

# Display charter
teamwerx charter show
```

The charter lives at `.teamwerx/charter.md` and contains:
- **Purpose** — Project vision and goals
- **Tech Stack** — Languages, frameworks, databases
- **Conventions** — Commit formats, branch naming, code standards
- **Governance** — Decision-making processes
- **AI Instructions** — Specific guidance for AI coding assistants

This is the first thing you should create when starting a project with teamWERX.

### Plans

Manage task lists for your goals.

```bash
# Add a task
teamwerx plan add --goal <goal-id> "Task description"

# List all tasks
teamwerx plan list --goal <goal-id>

# Mark task complete
teamwerx plan complete --goal <goal-id> --task T01

# Show plan summary
teamwerx plan show --goal <goal-id>
```

### Discussions

Capture decisions, notes, and context.

```bash
# Add discussion entry
teamwerx discuss add --goal <goal-id> "Your note or decision"

# List all entries
teamwerx discuss list --goal <goal-id>
```

Discussion entries are stored as YAML blocks in `discuss.md` with timestamps and sequential IDs (D01, D02, etc.).

### Specs

Work with project specifications.

```bash
# List all spec domains
teamwerx spec list

# Show requirements for a domain
teamwerx spec show <domain-name>
```

Specs are Markdown files at `.teamwerx/specs/<domain>/spec.md` that you can edit directly.

### Changes (Advanced)

Manage spec change proposals with conflict detection.

```bash
# List pending changes
teamwerx change list

# Apply a change (merges into spec)
teamwerx change apply --id <change-id>

# Resolve conflicts interactively
teamwerx change resolve --id <change-id>

# Archive applied change
teamwerx change archive --id <change-id>
```

Changes are JSON files at `.teamwerx/changes/<id>/change.json` that describe additions, modifications, or removals to spec requirements.

### Utilities

```bash
# Generate shell completions
teamwerx completion bash
teamwerx completion zsh
teamwerx completion fish
teamwerx completion powershell
```

## Workspace Structure

Your `.teamwerx/` directory contains all project artifacts:

```
.teamwerx/
├── charter.md                  # Project steering document
├── goals/
│   └── 001-my-feature/
│       ├── plan.json           # Task list
│       ├── discuss.md          # Decision log
│       ├── research.md         # Research notes (manual)
│       └── implementation/     # Implementation notes (optional)
├── specs/
│   └── authentication/
│       └── spec.md            # Specification
└── changes/
    ├── CH-001/
    │   └── change.json        # Change proposal
    └── .archive/              # Archived changes
```

### Files you create manually

- **charter.md** — Project steering document (created with `teamwerx charter init`, then edited)
- **research.md** — Background research and context for the goal
- **summary.md** — Knowledge summary (what worked, gotchas, patterns)
- **implementation/** — Any implementation notes or artifacts you want to track

### Files teamWERX manages

- **plan.json** — Task list with IDs and completion status
- **discuss.md** — Discussion log with numbered entries

## Configuration

Basic configuration is in `AGENTS.md` at your project root:

```yaml
---
teamwerx:
  version: "1.0.0"
  initialized: "2025-01-15"
---
```

This minimal frontmatter tracks the teamWERX version. The rest of `AGENTS.md` contains instructions for AI agents.

## Advanced Features

### Non-interactive mode

Set `TEAMWERX_CI=1` to disable prompts (useful for scripts or CI):

```bash
TEAMWERX_CI=1 teamwerx plan add --goal 001-demo "Automated task"
```

### Custom workspace directories

Override default paths with flags:

```bash
teamwerx plan list \
  --goals-dir /path/to/goals \
  --goal 001-demo
```

### Change proposals

Changes let you propose modifications to specs with conflict detection:

1. Create a change JSON with spec deltas (additions/modifications/removals)
2. Apply it: `teamwerx change apply --id CH-001`
3. If conflicts occur, resolve interactively: `teamwerx change resolve --id CH-001`
4. Archive when done: `teamwerx change archive --id CH-001`

See [docs/spec-merging.md](docs/spec-merging.md) for details on conflict resolution.

### Working with multiple agents

Different AI agents can work on different goals in parallel:

```bash
# Agent A working on authentication
teamwerx plan add --goal 001-auth "Add OAuth support"
teamwerx discuss add --goal 001-auth "Using Auth0 for social login"

# Agent B working on profiles  
teamwerx plan add --goal 002-profiles "Add bio field"
teamwerx discuss add --goal 002-profiles "Bio limited to 500 chars"
```

Each goal workspace is isolated, so agents don't interfere with each other.

## Best Practices

### Start with the charter

Always run `teamwerx charter init` when starting a new project and customize it before creating goals. The charter:
- Guides AI agents on how to work with your codebase
- Documents decisions that apply across all goals
- Establishes conventions for the entire team

### Goal naming

Use numbered prefixes for consistent ordering:
- `001-authentication`
- `002-user-profiles`
- `003-payment-integration`

### Task granularity

Keep tasks small and actionable:
- ✅ "Implement login endpoint"
- ✅ "Add password validation"
- ❌ "Build entire auth system"

### Discussion entries

Capture the "why" behind decisions:
- Design choices and trade-offs
- Important constraints or requirements
- Problems encountered and solutions

### Git workflow

Commit your `.teamwerx/` directory alongside code changes:

```bash
git add .teamwerx/goals/001-auth/
git commit -m "[teamWERX] Complete login endpoint implementation (T01)"
```

This creates a complete audit trail of both code and planning decisions.

### Research and summaries

Create `research.md` at the start to capture:
- Technology options considered
- Existing solutions reviewed
- Key constraints identified

Create `summary.md` at the end to capture:
- What worked well
- What didn't work
- Reusable patterns
- Gotchas for next time

## File Formats

### plan.json

```json
{
  "goal_id": "001-demo",
  "tasks": [
    {
      "id": "T01",
      "title": "Set up CI",
      "status": "completed"
    },
    {
      "id": "T02", 
      "title": "Add tests",
      "status": "pending"
    }
  ],
  "updated_at": "2025-01-15T10:30:00Z"
}
```

Task statuses: `pending`, `in-progress`, `completed`

### discuss.md

```markdown
---
id: D01
type: discussion
timestamp: 2025-01-15T10:00:00Z
content: Decided to use PostgreSQL for better JSON support
---

---
id: D02
type: discussion
timestamp: 2025-01-15T11:30:00Z
content: Added index on user_id for query performance
---
```

Each entry is a YAML block with sequential ID (D01, D02, etc.)

## Troubleshooting

### "No plan found for goal"

You need to add at least one task first:

```bash
teamwerx plan add --goal 001-demo "First task"
```

This creates the `plan.json` file.

### "Change not found"

Make sure the change ID matches the directory name:

```bash
# Directory: .teamwerx/changes/CH-001/
teamwerx change apply --id CH-001
```

### Validation errors

Check the files directly to see what's wrong:

```bash
# Verify plan.json exists and is valid JSON
cat .teamwerx/goals/001-demo/plan.json | jq .

# Check discussion format
cat .teamwerx/goals/001-demo/discuss.md
```

## Requirements

- Go 1.18+ (if building from source)
- Git (for version control)

## Development

See [CONTRIBUTING-GO.md](CONTRIBUTING-GO.md) for:
- Building and testing
- Code organization
- Adding new commands
- Release process

## License

MIT

## Links

- **Documentation**: [docs/](docs/)
- **Issue Tracker**: [GitHub Issues](https://github.com/hollomancer/teamwerx/issues)
- **Contributing**: [CONTRIBUTING-GO.md](CONTRIBUTING-GO.md)
- **Migration Guide**: [MIGRATION.md](MIGRATION.md)