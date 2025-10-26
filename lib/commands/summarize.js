/**
 * Generate or update knowledge summary for a goal
 *
 * This command is designed to be executed by an AI agent.
 * Distills key decisions, reusable patterns, and gotchas from discussions
 * and implementations into summary.md.
 */

const chalk = require('chalk');
const path = require('path');
const {
  getCurrentGoal,
  fileExists,
  writeFileWithFrontmatter,
} = require('../utils/file');
const { GoalWorkspaceManager } = require('../core/goal-workspace-manager');

async function summarize(options = {}) {
  const goal = options.goal || (await getCurrentGoal());

  if (!goal) {
    console.error(
      chalk.red('\n✗ Error: No goal specified and no current goal set.')
    );
    console.log(
      chalk.gray('Set a current goal with: ') +
        chalk.cyan('teamwerx use <goal-name>\n')
    );
    process.exit(1);
  }

  const workspace = await GoalWorkspaceManager.getWorkspaceForGoal(goal);
  const summaryPath = path.join(workspace.rootDir, 'summary.md');

  // Check if summary already exists
  const exists = await fileExists(summaryPath);

  if (exists) {
    console.log(
      chalk.yellow(`\n⚠ Summary already exists for ${workspace.title}.`)
    );
    console.log(
      chalk.gray('Update the existing summary at: ') + chalk.cyan(summaryPath)
    );
    console.log(
      chalk.gray(
        '\nTo create a fresh summary, delete the existing file first.\n'
      )
    );
    return;
  }

  // Create summary template
  const frontmatter = {
    goal: workspace.slug,
    goal_number: workspace.number,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  };

  const content = `# Knowledge Summary - ${workspace.title}

## Overview
<!-- Brief summary of what was accomplished and key outcomes -->

## Key Decisions
<!-- Important decisions made during discussions (reference D## entries) -->
<!-- Example: [D05] Use JWT instead of sessions for authentication -->

## Reusable Patterns
<!-- Code patterns, solutions, or approaches that can be reused (reference T## entries) -->
<!-- Example: [T03] Database migration script template -->

## Technical Insights
<!-- Technical learnings, gotchas, performance considerations -->

## Gotchas & Solutions
<!-- Problems encountered and how they were solved (reference T## and R## entries) -->
<!-- Example:
- **Problem**: Race conditions in async validation
- **Solution**: Use mutex locks (see T15.md)
-->

## Dependencies & Integration Points
<!-- Key external dependencies and how they integrate -->

## Testing & Validation Approaches
<!-- Testing strategies that worked well -->

## Recommendations for Future Work
<!-- Suggestions for future goals building on this work -->
`;

  await writeFileWithFrontmatter(summaryPath, frontmatter, content);

  console.log(
    chalk.green(`\n✓ Created knowledge summary for ${workspace.title}.`)
  );
  console.log(chalk.gray('\nSummary file: ') + chalk.cyan(summaryPath));
  console.log(
    chalk.gray(
      'Review discussions, research, and implementations to complete the summary.\n'
    )
  );
}

module.exports = summarize;
