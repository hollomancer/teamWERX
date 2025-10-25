# teamWERX

A development framework for individual developers working with multiple AI agents.

## Overview

teamWERX is a command-line interface (CLI) tool that provides a structured workflow to bring clarity, predictability, and efficiency to the software development lifecycle by coordinating the developer and their AI assistants around shared goals and plans.

## Features

- **Goal-Oriented Development**: Start with clear, measurable goals
- **AI Agent Coordination**: Work with multiple AI agents on different aspects of your project
- **Git-Based Versioning**: All artifacts tracked in git for complete traceability
- **Structured Workflow**: Research → Discussion → Planning → Execution
- **Multi-Goal Support**: Work on multiple goals concurrently

## Installation

```bash
npm install -g teamwerx
```

Or use locally in your project:

```bash
npm install --save-dev teamwerx
```

## Quick Start

1. **Initialize teamWERX in your project:**
   ```bash
   teamwerx init
   ```

2. **Create your first goal:**
   ```bash
   teamwerx goal "Implement user authentication"
   ```

3. **Set it as your current goal:**
   ```bash
   teamwerx use implement-user-authentication
   ```

4. **List all goals:**
   ```bash
   teamwerx list
   ```

## Commands

### Initialization

- `teamwerx init` - Initialize teamWERX in your project (requires git)

### Goal Management

- `teamwerx goal [description]` - Create a new goal
- `teamwerx list [--status=<status>]` - List all goals
- `teamwerx status [goal-name]` - Show detailed status of a goal
- `teamwerx use <goal-name>` - Set the current working goal

### Workflow Commands

These commands are designed to be used with AI agents:

- `teamwerx research [goal-name]` - Analyze codebase and generate research report
- `teamwerx discuss <message>` - Continue structured discussion
- `teamwerx dry-run` - Simulate plan execution
- `teamwerx plan [goal-name]` - Generate implementation plan
- `teamwerx execute [goal-name]` - Execute the plan

### Change Management

- `teamwerx propose <description>` - Propose a change
- `teamwerx delta <path> <v1> <v2>` - View version differences

## Project Structure

After initialization, teamWERX creates the following structure:

```
project-root/
├── AGENTS.md              # Configuration + AI agent instructions
└── .teamwerx/
    ├── goals/             # Goal definitions
    ├── research/          # Research reports and discussions
    ├── plans/             # Implementation plans
    ├── proposals/         # Change proposals
    ├── deltas/            # Version comparisons
    └── .current-goal      # Current working goal
```

## Working with AI Agents

teamWERX is designed to work seamlessly with AI coding assistants. The `AGENTS.md` file provides instructions that AI agents can read and follow.

When you run commands like `teamwerx research` or `teamwerx plan`, the AI agent should:
1. Read the relevant sections of `AGENTS.md`
2. Perform the requested analysis or action
3. Save the results to the appropriate location

## Goal States

Goals progress through the following states:

- `draft` - Initial state, under refinement
- `open` - Ready for work
- `in-progress` - Active work being done
- `blocked` - Temporarily halted
- `completed` - Success criteria met
- `cancelled` - Abandoned

## Best Practices

1. **Commit frequently**: Use `[teamWERX]` prefix for commits
   ```bash
   git commit -m "[teamWERX] Add authentication goal"
   ```

2. **One goal at a time**: While you can have many goals, focus on a few in-progress

3. **Clear success criteria**: Define measurable outcomes for each goal

4. **Regular status reviews**: Use `teamwerx status` to review progress

## Configuration

Configuration is stored in `AGENTS.md` frontmatter:

```yaml
---
teamwerx:
  version: "1.0.0"
  initialized: "2025-10-25"
---
```

## Examples

### Creating and Working on a Goal

```bash
# Create a goal
teamwerx goal "Add payment integration"

# Set as current goal
teamwerx use add-payment-integration

# AI agent analyzes codebase
teamwerx research

# AI agent generates plan
teamwerx plan

# AI agent executes plan
teamwerx execute
```

### Managing Multiple Goals

```bash
# List all goals
teamwerx list

# Filter by status
teamwerx list --status=in-progress

# Check status of specific goal
teamwerx status add-payment-integration

# Switch between goals
teamwerx use authentication-feature
```

### Version Tracking

```bash
# View changes to a goal
teamwerx delta .teamwerx/goals/my-goal.md HEAD~1 HEAD

# View git history of a goal
git log -- .teamwerx/goals/my-goal.md
```

## Requirements

- Node.js >= 14.0.0
- Git (must be initialized in your project)

## License

MIT

## Contributing

Contributions welcome! Please read the specification in `teamWERX_specification.md` for detailed information about the architecture and design.

## Support

For issues and questions, please file an issue on GitHub.
