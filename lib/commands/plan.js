/**
 * Generate a task list based on research and discussion
 * 
 * This command is designed to be executed by an AI agent.
 */

const chalk = require('chalk');
const { getCurrentGoal } = require('../utils/file');

async function plan(goalName) {
  const goal = goalName || await getCurrentGoal();
  
  if (!goal) {
    console.error(chalk.red('\n✗ Error: No goal specified and no current goal set.'));
    console.log(chalk.gray('Set a current goal with: ') + chalk.cyan('teamwerx use <goal-name>\n'));
    process.exit(1);
  }
  
  console.log(chalk.blue.bold('\n📝 Planning Mode\n'));
  console.log(chalk.white('Goal: ') + chalk.cyan(goal));
  console.log(chalk.yellow('\nThis command should be executed by an AI agent.'));
  console.log(chalk.gray('The AI agent should:'));
  console.log(chalk.gray('  1. Read the goal: ') + chalk.cyan(`.teamwerx/goals/${goal}.md`));
  console.log(chalk.gray('  2. Read the research: ') + chalk.cyan(`.teamwerx/research/${goal}/report.md`));
  console.log(chalk.gray('  3. Read the discussion: ') + chalk.cyan(`.teamwerx/research/${goal}/discussion.md`));
  console.log(chalk.gray('  4. Generate a detailed task list'));
  console.log(chalk.gray('  5. Save the plan to: ') + chalk.cyan(`.teamwerx/plans/${goal}.md`));
  console.log(chalk.gray('\nSee AGENTS.md for detailed instructions.\n'));
}

module.exports = plan;
