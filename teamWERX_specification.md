# teamWERX Specification

## Introduction

teamWERX is a development framework that aligns software development teams and their AI coding assistants. It provides a structured workflow to bring clarity, predictability, and efficiency to the software development lifecycle.

## Core Philosophy

*   **Goal-Oriented:** Development starts with a clear definition of high-level goals and desired outcomes.
*   **Specification-Driven:** Goals are translated into concrete specifications through a process of research and discussion.
*   **AI-Assisted:** The framework is designed to be used with AI coding assistants, providing a structured interface for collaboration.
*   **Traceability:** All decisions, discussions, and plans are documented and version-controlled, providing a clear audit trail.

## Technical Architecture

teamWERX will be built as a command-line interface (CLI) tool using Node.js. It will be distributed via npm, allowing for easy installation and integration into existing projects. The CLI will provide a set of slash commands for interacting with the framework.

## Workflow

The teamWERX workflow is divided into four main phases:

1.  **Goal Setting:** The team defines the high-level goals for the project or feature.
2.  **Research and Discussion:** The team and their AI assistants research the existing codebase, discuss potential implementation strategies, and refine the requirements.
3.  **Planning:** Based on the research and discussion, a detailed implementation plan is created.
4.  **Execution:** The plan is executed by the development team and their AI assistants.
5.  **Change Management:** The team can propose and track changes to goals and plans throughout the development process.

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

### Goal Setting

*   `/teamwerx.goal [goal description]`: Creates a new goal and prompts for success criteria. The description is a string that describes the goal.

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

teamWERX will create a `.teamwerx` directory in the root of the project to store its artifacts. The directory structure will be as follows:

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
└── plans/
    ├── goal-1.md
    └── goal-2.md
├── proposals/
│   ├── goal-1/
│   │   ├── proposal-1.md
│   │   └── proposal-2.md
│   └── goal-2/
│       └── proposal-1.md
└── deltas/
    ├── goal-1/
    │   ├── delta-1.md
    │   └── delta-2.md
    └── goal-2/
        └── delta-1.md
```
*   `goals/`: Contains the markdown files for each goal.
*   `research/`: Contains the research reports and discussion transcripts for each goal.
*   `plans/`: Contains the implementation plans for each goal.

## Goals vs. Plans

A **goal** is a high-level, aspirational statement of what the project is trying to achieve. It's the "what" and the "why". It should be concise and easy to understand. A goal also has success criteria, which are used to determine whether the goal has been achieved.

A **plan** is a detailed, step-by-step description of how to achieve a goal. It's the "how". It should be a series of actionable tasks. A plan is generated from a goal through a process of research and discussion.

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

teamWERX will integrate with AI coding assistants through a system of prompts and responses. The CLI will send prompts to the AI assistant based on the command being executed, and the AI assistant will respond with text, code, or other data.

For example, when the `/teamwerx.research` command is executed, the CLI will send a prompt to the AI assistant asking it to analyze the codebase and generate a research report. The AI assistant will then respond with a markdown-formatted report, which the CLI will save to the `.teamwerx/research` directory.

## Agent Instructions

AI agents should be instructed to use the `teamWERX` tool to guide the development process. The `AGENTS.md` file provides detailed instructions for AI agents on how to use each command. The following is a high-level overview of how an AI agent should interact with the `teamWERX` tool:

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
owner: conradhollomon
success_criteria:
  - The user can log in with their email and password.
  - The user is redirected to the dashboard after a successful login.
---

# Goal: Implement a new login page

...
```

### Plan Schema

```yaml
---
title: Plan for implementing a new login page
goal: implement-a-new-login-page
status: in-progress
tasks:
  - id: 1
    description: Create the login form component.
    status: to-do
    assignee: conradhollomon
  - id: 2
    description: Implement the authentication logic.
    status: to-do
    assignee: conradhollomon
---

# Plan: Implement a new login page

...
```

## Extensibility

teamWERX will be designed to be extensible. Users will be able to add new commands and new types of artifacts to the framework. New commands can be added by creating a new javascript file in the `commands` directory. New artifact types can be added by creating a new directory in the `.teamwerx` directory.
