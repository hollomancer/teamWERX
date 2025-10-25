/**
 * Execute the tasks in the plan
 * 
 * This command is designed to be executed by an AI agent.
 */

const chalk = require('chalk');
const { getCurrentGoal } = require('../utils/file');

async function execute(goalName) {
  const goal = goalName || await getCurrentGoal();
  
  if (!goal) {
    console.error(chalk.red('\n✗ Error: No goal specified and no current goal set.'));
    console.log(chalk.gray('Set a current goal with: ') + chalk.cyan('teamwerx use <goal-name>\n'));
    process.exit(1);
  }
  
  console.log(chalk.blue.bold('\n⚡ Execution Mode\n'));
  console.log(chalk.white('Goal: ') + chalk.cyan(goal));
  console.log(chalk.yellow('\nThis command should be executed by an AI agent.'));
  console.log(chalk.gray('The AI agent should:'));
  console.log(chalk.gray('  1. Read the plan: ') + chalk.cyan(`.teamwerx/plans/${goal}.md`));
  console.log(chalk.gray('  2. Execute each task in sequence'));
  console.log(chalk.gray('  3. Update task statuses as they are completed'));
  console.log(chalk.gray('  4. Provide code suggestions and guidance'));
  console.log(chalk.gray('\nSee AGENTS.md for detailed instructions.\n'));
}

module.exports = execute;
