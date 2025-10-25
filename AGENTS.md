---
teamwerx:
  version: "1.0.0"
  projectName: "teamWERX"
  initialized: "2025-10-25T12:00:00Z"
  defaultGoalStatus: "draft"
  git:
    enabled: true
    autoCommit: false
    commitPrefix: "[teamWERX]"
---

# AGENTS.md

This file provides instructions for AI agents on how to use the `teamWERX` tool and contains the teamWERX configuration in the YAML frontmatter above.

## Overview

The `teamWERX` tool is a command-line interface (CLI) that helps development teams align on goals, research and discuss the implementation, and then execute the plan. As an AI agent, you should use this tool to guide the user through the development process.

## Commands

### `/teamwerx.goal [goal description]`

This command is used to create a new goal. When the user executes this command, you should prompt them to provide a clear and concise description of the goal, as well as the success criteria. You should then save the goal to a new markdown file in the `.teamwerx/goals` directory.

**Example:**

```
user: /teamwerx.goal Implement a new login page

ai: Great! What are the success criteria for this goal?

user: The user should be able to log in with their email and password.

ai: Got it. I have created a new goal in `.teamwerx/goals/implement-a-new-login-page.md`.
```

### `/teamwerx.research`

This command is used to analyze the existing codebase and generate a research report. When the user executes this command, you should analyze the codebase and generate a markdown-formatted report that identifies relevant files, functions, and classes, and provides a summary of the existing implementation. You should then save the report to a new markdown file in the `.teamwerx/research` directory.

### `/teamwerx.discuss [your message]`

This command is used to facilitate a structured discussion about the implementation strategy. When the user executes this command, you should respond to their message and continue the discussion. You should also save the discussion to the `discussion.md` file in the corresponding research directory.

### `/teamwerx.dry-run`

This command is used to simulate the implementation plan to identify potential issues before execution. When the user executes this command, you should analyze the plan and provide feedback on any potential issues.

### `/teamwerx.propose [description]`

This command is used to propose a change to a goal or plan. When the user executes this command, you should prompt them to provide a description of the proposed change. You should then save the proposal to a new markdown file in the `.teamwerx/proposals` directory.

### `/teamwerx.delta [goal/plan] [version]`

This command is used to view the changes between different versions of a goal or plan. When the user executes this command, you should generate a diff between the two versions and display it to the user.

### `/teamwerx.plan`

This command is used to generate a task list based on the research and discussion. When the user executes this command, you should generate a markdown-formatted task list and save it to a new markdown file in the `.teamwerx/plans` directory.

### `/teamwerx.execute`

This command is used to execute the tasks in the plan. When the user executes this command, you should guide them through the implementation process, providing context and code suggestions.
