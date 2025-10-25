/**
 * Propose a change to a goal or plan
 * 
 * This command is designed to be executed by an AI agent.
 */

const chalk = require('chalk');
const { getCurrentGoal } = require('../utils/file');

async function propose(description) {
  const goal = await getCurrentGoal();
  
  if (!goal) {
    console.error(chalk.red('\n✗ Error: No current goal set.'));
    console.log(chalk.gray('Set a current goal with: ') + chalk.cyan('teamwerx use <goal-name>\n'));
    process.exit(1);
  }
  
  console.log(chalk.blue.bold('\n💡 Proposal Mode\n'));
  console.log(chalk.white('Goal: ') + chalk.cyan(goal));
  console.log(chalk.white('Description: ') + chalk.gray(description));
  console.log(chalk.yellow('\nThis command should be executed by an AI agent.'));
  console.log(chalk.gray('The AI agent should:'));
  console.log(chalk.gray('  1. Generate a unique proposal ID'));
  console.log(chalk.gray('  2. Create a proposal document'));
  console.log(chalk.gray('  3. Save to: ') + chalk.cyan(`.teamwerx/proposals/${goal}/[proposal-id].md`));
  console.log(chalk.gray('\nSee AGENTS.md for detailed instructions.\n'));
}

module.exports = propose;
