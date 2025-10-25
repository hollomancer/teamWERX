# teamWERX Specification

## Introduction

teamWERX is a development framework for individual developers working with multiple AI agents. It provides a structured workflow to bring clarity, predictability, and efficiency to the software development lifecycle by coordinating the developer and their AI assistants around shared goals and plans.

## Core Philosophy

*   **Goal-Oriented:** Development starts with a clear definition of high-level goals and desired outcomes.
*   **Specification-Driven:** Goals are translated into concrete specifications through a process of research and discussion with AI agents.
*   **Multi-Agent Coordination:** The framework orchestrates multiple AI agents working on different aspects of a project, all guided by a single developer.
*   **Traceability:** All decisions, discussions, and plans are documented and version-controlled, providing a clear audit trail.
*   **Token-Efficient:** Agent instructions are designed to minimize token usage while providing complete context.

## Technical Architecture

teamWERX will be built as a command-line interface (CLI) tool using Node.js. It will be distributed via npm, allowing for easy installation and integration into existing projects. The CLI will provide a set of slash commands for interacting with the framework.

## Workflow

The teamWERX workflow is divided into four main phases. Multiple goals can progress through these phases concurrently, with different AI agents potentially working on different goals under the developer's direction.

1.  **Goal Setting:** The developer defines the high-level goals for the project or feature.
2.  **Research and Discussion:** The developer and AI agents research the existing codebase, discuss potential implementation strategies, and refine the requirements.
3.  **Planning:** Based on the research and discussion, a detailed implementation plan is created.
4.  **Execution:** The plan is executed by AI agents under the developer's guidance.
5.  **Change Management:** Changes to goals and plans can be proposed and tracked throughout the development process.

**Note:** These phases are per-goal, meaning different goals can be in different phases simultaneously, with different AI agents working on different goals.

### 1. Goal Setting

This phase is focused on defining the "why" and "what" of the project.

**Commands:**
*   `/teamwerx.goal`

### 2. Research and Discussion

This phase is focused on exploring the "how" of the project.

**Commands:**
*   `/teamwerx.research`
*   `/teamwerx.discuss`

### 3. Planning

This phase is focused on creating a detailed implementation plan.

**Commands:**
*   `/teamwerx.plan`

### 4. Execution

This phase is focused on implementing the plan.

**Commands:**
*   `/teamwerx.execute`

### 5. Change Management

This phase is focused on managing changes to goals and plans.

**Commands:**
*   `/teamwerx.propose`
*   `/teamwerx.delta`
*   `/teamwerx.approve`
*   `/teamwerx.reject`

## Commands

### Initialization

*   `/teamwerx.init`: Initializes teamWERX in the current project. This command:
    *   Verifies that the current directory is a git repository (fails if not)
    *   Creates the `.teamwerx` directory structure
    *   Creates template directories for goals, research, plans, proposals, and deltas
    *   Creates or updates `AGENTS.md` with teamWERX configuration in YAML frontmatter
    *   Outputs a success message with next steps

**Prerequisites:**
*   The project must be initialized as a git repository (`git init` must have been run)
*   The command must be run from the project root directory

**Error Handling:**
*   If git is not initialized, the command will display: "Error: teamWERX requires a git repository. Please run 'git init' first."
*   If `.teamwerx` already exists, the command will ask: "teamWERX is already initialized. Do you want to reinitialize? (y/n)"
*   If `AGENTS.md` already exists, the command will preserve existing content and add/update only the frontmatter configuration

### Goal Setting

*   `/teamwerx.goal [goal description]`: Creates a new goal and prompts for success criteria. The description is a string that describes the goal.

### Goal Management

*   `/teamwerx.list [--status=<status>]`: Lists all goals in the project with optional filtering by status.
*   `/teamwerx.status [goal-name]`: Shows detailed status of a specific goal, or all goals if no name is provided.
*   `/teamwerx.use [goal-name]`: Sets the current working goal context for subsequent commands.

### Research and Discussion

*   `/teamwerx.research`: Analyzes the codebase and generates a research report, identifying relevant files, functions, and classes.
*   `/teamwerx.discuss [your message]`: Facilitates a structured discussion. The message is a string that contains your message.
*   `/teamwerx.dry-run`: Simulates the implementation plan to identify potential issues before execution.

### Change Management

*   `/teamwerx.propose [description]`: Propose a change to a goal or plan. The description is a string that describes the proposed change.
*   `/teamwerx.delta [goal/plan] [version]`: View the changes between different versions of a goal or plan. The goal/plan is the name of the goal or plan, and the version is the version number.
*   `/teamwerx.approve [proposal]`: Approve a proposal. The proposal is the name of the proposal.
*   `/teamwerx.reject [proposal]`: Reject a proposal. The proposal is the name of the proposal.

*   `/teamwerx.plan`: Generates a task list based on the research and discussion.
*   `/teamwerx.execute`: Executes the tasks in the plan, with guidance from the AI assistant.

## Project Structure

teamWERX uses two main locations for its files:

1. **Project Root**: Contains `AGENTS.md` (configuration and agent instructions)
2. **`.teamwerx` Directory**: Contains all artifacts (goals, plans, research, etc.)

### Root Level
```
project-root/
├── AGENTS.md          # Configuration + AI agent instructions
└── .teamwerx/         # teamWERX artifacts directory
```

### `.teamwerx` Directory Structure

The `.teamwerx` directory is created in the root of the project to store all teamWERX artifacts:

```
.teamwerx/
├── goals/
│   ├── goal-1.md
│   └── goal-2.md
├── research/
│   ├── goal-1/
│   │   ├── report.md
│   │   └── discussion.md
│   └── goal-2/
│       ├── report.md
│       └── discussion.md
├── plans/
│   ├── goal-1.md
│   └── goal-2.md
├── proposals/
│   ├── goal-1/
│   │   ├── proposal-1.md
│   │   └── proposal-2.md
│   └── goal-2/
│       └── proposal-1.md
├── deltas/
│   ├── goal-1/
│   │   ├── delta-1.md
│   │   └── delta-2.md
│   └── goal-2/
│       └── delta-1.md
└── .current-goal
```
*   `goals/`: Contains the markdown files for each goal.
*   `research/`: Contains the research reports and discussion transcripts for each goal.
*   `plans/`: Contains the implementation plans for each goal.
*   `proposals/`: Contains change proposals for goals and plans.
*   `deltas/`: Contains version comparison reports.
*   `.current-goal`: Tracks the currently active goal (simple text file).

### Configuration

teamWERX configuration is stored in the `AGENTS.md` file at the project root. This file serves both as documentation for AI agents and as the configuration source for teamWERX behavior. By consolidating configuration into a human-readable markdown file, it ensures that the developer and all AI agents have a single source of truth.

**Location**: `AGENTS.md` (project root)

The configuration is defined using minimal YAML frontmatter at the top of the AGENTS.md file:

```yaml
---
teamwerx:
  version: "1.0.0"
  initialized: "2025-10-25"
---
```

**Configuration Fields:**
*   `version`: teamWERX specification version
*   `initialized`: ISO 8601 date when teamWERX was initialized

**Note on Token Efficiency:** The configuration is intentionally minimal because AGENTS.md is read by AI agents with every command execution. Additional settings are defined as conventions in the specification rather than configuration (e.g., default goal status is always "draft", git is always enabled, commits are always manual, commit prefix is always "[teamWERX]").

## Goals vs. Plans

A **goal** is a high-level, aspirational statement of what the project is trying to achieve. It's the "what" and the "why". It should be concise and easy to understand. A goal also has success criteria, which are used to determine whether the goal has been achieved.

A **plan** is a detailed, step-by-step description of how to achieve a goal. It's the "how". It should be a series of actionable tasks. A plan is generated from a goal through a process of research and discussion.

## Versioning Strategy

teamWERX uses git as its versioning system for all artifacts. This provides a robust, industry-standard approach to tracking changes and enables powerful version comparison capabilities.

### Version Tracking

*   **All artifacts are tracked in git**: Goals, plans, research reports, and proposals are stored in the `.teamwerx` directory and should be committed to git.
*   **Manual commits**: Users are responsible for committing changes to the `.teamwerx` directory. teamWERX does not auto-commit changes.
*   **Commit message convention**: It is recommended to prefix teamWERX-related commits with `[teamWERX]` for easy identification (e.g., `[teamWERX] Add new authentication goal`).

### Version References

*   **Git commit SHAs**: Versions are referenced using git commit SHAs (e.g., `a1b2c3d`).
*   **Git tags**: For major milestones, git tags can be used (e.g., `v1.0.0`, `goal-auth-complete`).
*   **Branch-based workflows**: Teams can use git branches for experimental goals or proposals.

### Delta Computation

The `/teamwerx.delta` command uses git to compute differences between versions:

*   **Command syntax**: `/teamwerx.delta <artifact-path> <version1> <version2>`
*   **Implementation**: Uses `git diff <version1> <version2> -- <artifact-path>` internally
*   **Output**: Displays a unified diff showing additions, deletions, and modifications
*   **Version formats supported**:
    *   Commit SHAs: `a1b2c3d` or full SHA
    *   Relative references: `HEAD`, `HEAD~1`, `HEAD~2`
    *   Tags: `v1.0.0`, `milestone-1`
    *   Branches: `main`, `feature/new-auth`

### Version History

Users can view the history of any artifact using standard git commands:

```bash
# View commit history for a specific goal
git log -- .teamwerx/goals/implement-login.md

# View changes in a specific commit
git show a1b2c3d:.teamwerx/goals/implement-login.md

# View diff between two commits
git diff HEAD~2 HEAD -- .teamwerx/goals/implement-login.md
```

### Best Practices

*   **Commit after each major change**: After creating or updating a goal, plan, or proposal, commit the changes.
*   **Use descriptive commit messages**: Clearly describe what changed and why.
*   **Tag important milestones**: Use git tags to mark significant points in the project lifecycle.
*   **Create branches for experiments**: Use git branches to explore alternative approaches without affecting the main workflow.

## Goal State Management

Goals in teamWERX progress through a defined set of states during their lifecycle. Understanding these states and their transitions helps teams track progress and manage their workflow effectively.

### Goal States

*   **draft**: Initial state when a goal is created but not yet ready for work. The goal may still be under discussion or refinement.
*   **open**: The goal is defined and ready to be worked on, but work has not yet started.
*   **in-progress**: Active work is being done on the goal.
*   **blocked**: Work on the goal is temporarily halted due to dependencies, issues, or other impediments.
*   **completed**: The goal has been achieved and all success criteria have been met.
*   **cancelled**: The goal has been abandoned and will not be completed.

### State Transitions

The following diagram shows the valid state transitions:

```
   draft ──────> open ──────> in-progress ──────> completed
     │            │               │
     │            │               │
     │            │               ▼
     │            │            blocked
     │            │               │
     │            │               │
     └────────────┴───────────────┴──────────> cancelled
```

**Valid Transitions:**

*   `draft` → `open`: Goal is finalized and ready for work
*   `draft` → `cancelled`: Goal is discarded during planning
*   `open` → `in-progress`: Work begins on the goal
*   `open` → `cancelled`: Goal is deprioritized before work starts
*   `in-progress` → `blocked`: Work is halted due to impediments
*   `in-progress` → `completed`: Goal's success criteria are met
*   `in-progress` → `cancelled`: Goal is abandoned during implementation
*   `blocked` → `in-progress`: Impediments are resolved and work resumes
*   `blocked` → `cancelled`: Goal cannot be unblocked and is abandoned

### Triggering State Changes

State changes can be triggered through:

1. **Manual updates**: Users can edit the goal's frontmatter to change the `status` field
2. **Command-based transitions**: Future commands like `/teamwerx.start`, `/teamwerx.block`, `/teamwerx.complete`, `/teamwerx.cancel`
3. **Automated transitions**: When certain actions occur (e.g., executing a plan might change state to `in-progress`)

### State Change Tracking

Since all artifacts are tracked in git:

*   Each state change should be committed with a descriptive message
*   State history can be viewed using `git log` on the goal file
*   State changes can be audited and potentially reverted if needed

**Example commit messages:**
```
[teamWERX] Move 'implement-auth' goal to in-progress
[teamWERX] Block 'add-payment' goal - waiting for API credentials
[teamWERX] Complete 'setup-database' goal - all criteria met
```

## Managing Concurrent Goals

teamWERX is designed to support multiple goals being worked on simultaneously. This enables a single developer to coordinate multiple AI agents working on different aspects of a project in parallel.

### Multiple Goals Support

*   **Unlimited concurrent goals**: There is no limit to the number of goals that can exist in a project
*   **Independent workflows**: Each goal has its own research, discussion, plans, and proposals
*   **Parallel agent coordination**: Different AI agents can work on different goals simultaneously under the developer's direction
*   **Unified visibility**: All goals and their progress are visible in one place

### Goal Identification

Goals are identified by their filename in the `.teamwerx/goals/` directory:

*   **File naming**: Goal files use kebab-case naming derived from the title (e.g., `implement-new-login-page.md`)
*   **Unique identifiers**: Each goal file must have a unique filename
*   **Referencing goals**: Goals are referenced by their filename without the `.md` extension

### Listing and Filtering Goals

To help manage multiple goals, teamWERX provides commands to list and filter goals:

*   `/teamwerx.list [--status=<status>]`: Lists all goals in the project
    *   Displays: title, status, created date
    *   Sortable by: status, created date
    *   Filterable by: status

*   `/teamwerx.status [goal-name]`: Shows detailed status of a specific goal or all goals if no name is provided
    *   Displays: full goal details, current plan status, recent activity
    *   Shows: state, progress, blockers, next steps

**Example output:**
```
Active Goals:
┌─────────────────────────────┬──────────────┬────────────┐
│ Title                       │ Status       │ Created    │
├─────────────────────────────┼──────────────┼────────────┤
│ Implement new login page    │ in-progress  │ 2025-10-15 │
│ Add payment integration     │ blocked      │ 2025-10-18 │
│ Refactor database layer     │ open         │ 2025-10-20 │
│ Update user documentation   │ draft        │ 2025-10-22 │
└─────────────────────────────┴──────────────┴────────────┘
```

### Working Context

When working with multiple goals, teamWERX uses the following context resolution:

1. **Explicit goal reference**: Commands can explicitly reference a goal using its identifier
   *   Example: `/teamwerx.research implement-login`

2. **Current working goal**: If no goal is specified, commands operate on the "current" goal
   *   Set with: `/teamwerx.use [goal-name]`
   *   Shown in: Status display and command prompts
   *   Persisted in: `.teamwerx/.current-goal`

3. **Automatic context**: Some commands can infer the goal from context
   *   Example: When executing a plan, the goal is derived from the plan file

### Multi-Goal Workflows

**Scenario 1: Developer coordinating multiple AI agents on parallel features**
```bash
# Developer sets up authentication goal for Agent A
/teamwerx.use implement-auth
/teamwerx.research
/teamwerx.plan

# Developer switches context to set up payments for Agent B
/teamwerx.use add-payment-integration
/teamwerx.research
/teamwerx.plan

# Agents work in parallel on their respective goals
```

**Scenario 2: Dependent goals**
```yaml
# In goal: add-payment-integration
---
title: Add payment integration
status: blocked
dependencies:
  - implement-auth  # Must complete first
---
```

**Scenario 3: Status review**
```bash
# View all goals at once
/teamwerx.list

# Filter to see only blocked items
/teamwerx.list --status=blocked
```

### Best Practices for Multiple Goals

*   **Use clear, distinctive names**: Avoid similar goal names that could cause confusion between agents
*   **Track dependencies**: Document when goals depend on each other
*   **Regular status reviews**: Periodically review all goals using `/teamwerx.list`
*   **Archive completed goals**: Move completed goals to a `.teamwerx/archive/` directory
*   **Limit active work**: While you can have many goals, limit how many are `in-progress` to maintain focus

## Proposal Workflow

A **proposal** is a suggested change to a goal or a plan. It is a structured way to propose changes and track the decision-making process. Proposals are stored in the `.teamwerx/proposals` directory.

The following is a recommended workflow for managing proposals:

1.  A user creates a proposal using the `/teamwerx.propose` command.
2.  The proposal is saved as a markdown file in the `.teamwerx/proposals` directory with a status of "pending".
3.  Other users can then review the proposal and provide feedback in the discussion thread.
4.  Once the discussion is complete, a user with the appropriate permissions can approve or reject the proposal using the `/teamwerx.approve` or `/teamwerx.reject` commands.
5.  If the proposal is approved, the changes are automatically merged into the corresponding goal or plan.
6.  If the proposal is rejected, the proposal is archived for future reference.

## AI Integration

teamWERX integrates with AI coding assistants through the `AGENTS.md` file, which serves dual purposes:

1. **Configuration Source**: Contains teamWERX settings in YAML frontmatter
2. **Agent Instructions**: Provides detailed instructions for AI agents on how to use teamWERX commands

This approach ensures that AI agents have immediate access to both the configuration and the operational instructions in a single, human-readable file.

### How It Works

*   **AI-Agnostic Design**: teamWERX does not directly call AI APIs. Instead, it relies on the AI coding assistant to read `AGENTS.md` and understand how to interact with teamWERX commands.
*   **Context Provision**: When a teamWERX command is executed, the AI agent reads the relevant section of `AGENTS.md` to understand what actions to take.
*   **Prompt-Based Interaction**: The CLI outputs prompts and information that the AI agent can process and respond to appropriately.

For example, when the `/teamwerx.research` command is executed, the AI agent:
1. Reads the `/teamwerx.research` section in `AGENTS.md`
2. Analyzes the codebase as instructed
3. Generates a markdown-formatted research report
4. Saves the report to the `.teamwerx/research` directory

## Agent Instructions

The `AGENTS.md` file at the project root provides detailed instructions for AI agents on how to use the `teamWERX` tool. This file is the single source of truth for both configuration and operational guidance. The following is a high-level overview of how an AI agent should interact with the `teamWERX` tool:

*   **Goal Setting:** The AI agent should assist the user in creating a clear and concise goal with measurable success criteria.
*   **Research and Discussion:** The AI agent should use the `/teamwerx.research` command to analyze the codebase and provide a summary of the existing implementation. The AI agent should also participate in the discussion by proposing different approaches and providing feedback on the user's suggestions.
*   **Planning:** The AI agent should use the `/teamwerx.plan` command to generate a detailed implementation plan based on the research and discussion.
*   **Execution:** The AI agent should use the `/teamwerx.execute` command to guide the user through the implementation process, providing context and code suggestions.
*   **Change Management:** The AI agent should assist the user in creating and tracking change proposals.

## Glossary

*   **Goal:** A high-level, aspirational statement of what the project is trying to achieve.
*   **Plan:** A detailed, step-by-step description of how to achieve a goal.
*   **Proposal:** A suggested change to a goal or a plan.
*   **Delta:** The differences between two versions of a goal or plan.
*   **AI Agent:** An artificial intelligence that can assist with software development tasks.

## Artifact Schemas

To make the artifacts more machine-readable and to ensure consistency, the markdown files will use YAML frontmatter to define a schema for each artifact type.

### Goal Schema

```yaml
---
title: Implement a new login page
status: open
created: 2025-10-25
success_criteria:
  - User can log in with email and password
  - User redirected to dashboard after successful login
---

# Goal: Implement a new login page

...
```

**Field Descriptions:**
*   `title`: Brief, descriptive name for the goal
*   `status`: Current state (draft | open | in-progress | blocked | completed | cancelled)
*   `created`: ISO 8601 date when the goal was created
*   `success_criteria`: List of measurable outcomes that define success

**Note:** Owner and updated fields are omitted since this is a single-developer tool. Git commit history provides the audit trail.

### Plan Schema

```yaml
---
goal: implement-a-new-login-page
status: in-progress
tasks:
  - id: 1
    description: Create the login form component
    status: pending
  - id: 2
    description: Implement the authentication logic
    status: pending
---

# Plan: Implement a new login page

...
```

**Field Descriptions:**
*   `goal`: Reference to the goal file (without .md extension)
*   `status`: Current plan status (pending | in-progress | completed)
*   `tasks`: List of tasks with id, description, and status (pending | in-progress | completed)

**Note:** Title and assignee fields are omitted. The plan title is derived from the goal. All tasks are for the single developer, potentially executed by different AI agents.

## Extensibility

teamWERX will be designed to be extensible. Users will be able to add new commands and new types of artifacts to the framework. New commands can be added by creating a new javascript file in the `commands` directory. New artifact types can be added by creating a new directory in the `.teamwerx` directory.
