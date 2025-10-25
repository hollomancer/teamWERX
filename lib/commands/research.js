/**
 * Analyze the codebase and generate a research report
 * 
 * This command is designed to be executed by an AI agent.
 * The AI agent should analyze the codebase and generate a research report.
 */

const chalk = require('chalk');
const { getCurrentGoal } = require('../utils/file');

async function research(goalName) {
  const goal = goalName || await getCurrentGoal();
  
  if (!goal) {
    console.error(chalk.red('\n✗ Error: No goal specified and no current goal set.'));
    console.log(chalk.gray('Set a current goal with: ') + chalk.cyan('teamwerx use <goal-name>\n'));
    process.exit(1);
  }
  
  console.log(chalk.blue.bold('\n🔍 Research Mode\n'));
  console.log(chalk.white('Goal: ') + chalk.cyan(goal));
  console.log(chalk.yellow('\nThis command should be executed by an AI agent.'));
  console.log(chalk.gray('The AI agent should:'));
  console.log(chalk.gray('  1. Read the goal file: ') + chalk.cyan(`.teamwerx/goals/${goal}.md`));
  console.log(chalk.gray('  2. Analyze the codebase to understand relevant files and functions'));
  console.log(chalk.gray('  3. Generate a research report'));
  console.log(chalk.gray('  4. Save the report to: ') + chalk.cyan(`.teamwerx/research/${goal}/report.md`));
  console.log(chalk.gray('\nSee AGENTS.md for detailed instructions.\n'));
}

module.exports = research;
