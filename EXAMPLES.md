# teamWERX Examples

This document provides practical examples of using teamWERX in real development workflows.

## Example 1: Simple Feature Development

### Scenario: Adding a contact form to a website

```bash
# Initialize teamWERX in your project
cd my-website-project
git init
teamwerx init

# Create a goal for the contact form
teamwerx goal "Add contact form to website"
# Enter success criteria:
# - Users can submit their name, email, and message
# - Form validates input before submission
# - Confirmation message appears after successful submission
# (Press Enter on empty line to finish)

# Set as current goal
teamwerx use add-contact-form-to-website

# View the goal status
teamwerx status add-contact-form-to-website

# AI agent researches the codebase
teamwerx research

# AI agent creates a plan
teamwerx plan

# AI agent executes the plan
teamwerx execute

# Commit the changes
git add .teamwerx
git commit -m "[teamWERX] Add contact form goal and plan"

# After implementation, update goal status manually
# Edit .teamwerx/goals/add-contact-form-to-website.md
# Change status from 'draft' to 'completed'
git add .teamwerx/goals/add-contact-form-to-website.md
git commit -m "[teamWERX] Complete contact form goal"
```

## Example 2: Managing Multiple Features

### Scenario: Working on authentication and payment integration simultaneously

```bash
# Create first goal: authentication
teamwerx goal "Implement user authentication"
# Success criteria:
# - Users can register with email/password
# - Users can log in
# - Users can log out
# - Password reset functionality

# Create second goal: payment integration
teamwerx goal "Add Stripe payment integration"
# Success criteria:
# - Users can enter payment information
# - Integration with Stripe API works
# - Payment confirmation displayed
# - Handle payment errors gracefully

# List all goals
teamwerx list

# Output:
# ┌─────────────────────────────┬──────────┬────────────┐
# │ Title                       │ Status   │ Created    │
# ├─────────────────────────────┼──────────┼────────────┤
# │ Add Stripe payment...       │ draft    │ 2025-10-25 │
# │ Implement user auth...      │ draft    │ 2025-10-25 │
# └─────────────────────────────┴──────────┴────────────┘

# Work on authentication first
teamwerx use implement-user-authentication
teamwerx research
teamwerx plan

# Switch to payment integration
teamwerx use add-stripe-payment-integration
teamwerx research
teamwerx plan

# Check overall status
teamwerx status

# Filter by status
teamwerx list --status=draft
```

## Example 3: Tracking Progress Through States

### Scenario: Moving a goal through different states

```bash
# Create goal
teamwerx goal "Refactor database layer"

teamwerx use refactor-database-layer

# Manually update status in .teamwerx/goals/refactor-database-layer.md
# Change: status: draft → status: open
git add .teamwerx
git commit -m "[teamWERX] Move refactor-database-layer to open"

# Start working on it
# Change: status: open → status: in-progress
git add .teamwerx
git commit -m "[teamWERX] Start work on refactor-database-layer"

# Hit a blocker
# Change: status: in-progress → status: blocked
# Add blocker note in the goal file
git add .teamwerx
git commit -m "[teamWERX] Block refactor-database-layer - waiting for DBA input"

# Blocker resolved
# Change: status: blocked → status: in-progress
git add .teamwerx
git commit -m "[teamWERX] Unblock refactor-database-layer - DBA approved approach"

# Complete the work
# Change: status: in-progress → status: completed
git add .teamwerx
git commit -m "[teamWERX] Complete refactor-database-layer"
```

## Example 4: Using Version Tracking

### Scenario: Reviewing changes to a goal over time

```bash
# View current goal
cat .teamwerx/goals/implement-user-authentication.md

# View git history of the goal
git log -- .teamwerx/goals/implement-user-authentication.md

# View differences between versions
teamwerx delta .teamwerx/goals/implement-user-authentication.md HEAD~2 HEAD

# View specific version
git show HEAD~1:.teamwerx/goals/implement-user-authentication.md

# Compare plan versions
teamwerx delta .teamwerx/plans/implement-user-authentication.md v1.0 v2.0
```

## Example 5: Proposing Changes

### Scenario: AI agent suggests a change to the plan

```bash
# Current goal is set
teamwerx use implement-user-authentication

# AI agent proposes a change
teamwerx propose "Add OAuth integration to the authentication plan"

# AI agent should create:
# .teamwerx/proposals/implement-user-authentication/001-add-oauth.md

# Review the proposal
cat .teamwerx/proposals/implement-user-authentication/001-add-oauth.md

# Developer decides to accept and manually merge changes
# Update the plan file
# Commit changes
git add .teamwerx
git commit -m "[teamWERX] Accept proposal: Add OAuth integration"
```

## Example 6: Research and Discussion

### Scenario: AI agent analyzes codebase and discusses approach

```bash
# Set current goal
teamwerx use add-api-rate-limiting

# AI generates research report
teamwerx research
# AI creates: .teamwerx/research/add-api-rate-limiting/report.md

# Review research
cat .teamwerx/research/add-api-rate-limiting/report.md

# Start discussion
teamwerx discuss "Should we use Redis or in-memory rate limiting?"
# AI appends to: .teamwerx/research/add-api-rate-limiting/discussion.md

teamwerx discuss "In-memory won't work for multiple instances. Let's use Redis."
# AI continues discussion in the same file

# Review full discussion
cat .teamwerx/research/add-api-rate-limiting/discussion.md

# Generate plan based on research and discussion
teamwerx plan
```

## Example 7: Complex Workflow with Dependencies

### Scenario: Multiple related goals with dependencies

```bash
# Create goals
teamwerx goal "Set up database schema"
teamwerx goal "Create API endpoints"
teamwerx goal "Build frontend UI"

# Manually add dependencies to goal files
# In .teamwerx/goals/create-api-endpoints.md:
# ---
# dependencies:
#   - set-up-database-schema
# ---

# In .teamwerx/goals/build-frontend-ui.md:
# ---
# dependencies:
#   - create-api-endpoints
# ---

# Work on goals in order
teamwerx use set-up-database-schema
# ... complete work ...

teamwerx use create-api-endpoints
# ... complete work ...

teamwerx use build-frontend-ui
# ... complete work ...

# Check overall status
teamwerx status
```

## Example 8: Dry Run Before Execution

### Scenario: Validating a plan before execution

```bash
# Create and plan a goal
teamwerx goal "Migrate to TypeScript"
teamwerx use migrate-to-typescript
teamwerx research
teamwerx plan

# Simulate the plan to identify issues
teamwerx dry-run
# AI agent should analyze the plan and provide feedback:
# - Potential breaking changes
# - Missing dependencies
# - Risk assessment
# - Recommended order of execution

# Review feedback and adjust plan if needed
# Then execute
teamwerx execute
```

## Best Practices from Examples

1. **Commit Frequently**: Commit .teamwerx changes after each significant update
2. **Use Descriptive Goals**: Make goal titles clear and actionable
3. **Define Measurable Success Criteria**: Be specific about what "done" means
4. **Review AI Output**: Always review research reports and plans before execution
5. **Track State Changes**: Update goal status as work progresses
6. **Use Discussions**: Engage with AI agents to refine implementation approach
7. **Leverage Version Control**: Use git to track all changes and review history
8. **Manage Dependencies**: Document when goals depend on each other
9. **One Focus at a Time**: Use `teamwerx use` to maintain clear context
10. **Status Reviews**: Regularly run `teamwerx status` to see the big picture

## Tips

- Use `teamwerx list --status=in-progress` to see active work
- Keep success criteria specific and testable
- Document blockers in goal files when status is 'blocked'
- Use proposals for major plan changes
- Archive completed goals to keep workspace clean
- Use branches for experimental goals
- Tag milestones in git for important releases

## Common Workflows

### Quick Feature Addition
```bash
teamwerx goal → use → research → plan → execute → commit
```

### Complex Feature with Discussion
```bash
teamwerx goal → use → research → discuss → discuss → plan → dry-run → execute → commit
```

### Revisiting a Goal
```bash
teamwerx use <goal> → status → delta → discuss → propose → execute
```

### Status Check
```bash
teamwerx list → status → list --status=blocked
```
