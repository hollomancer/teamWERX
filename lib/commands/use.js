/**
 * Set the current working goal context
 */

const path = require('path');
const chalk = require('chalk');
const { getTeamwerxDir, fileExists, setCurrentGoal } = require('../utils/file');

async function use(goalName) {
  try {
    // Check if goal exists
    const goalPath = path.join(getTeamwerxDir(), 'goals', `${goalName}.md`);
    
    if (!(await fileExists(goalPath))) {
      console.error(chalk.red(`\n✗ Error: Goal "${goalName}" not found.\n`));
      console.log(chalk.gray('List available goals with: ') + chalk.cyan('teamwerx list\n'));
      process.exit(1);
    }
    
    // Set current goal
    await setCurrentGoal(goalName);
    
    console.log(chalk.green(`\n✓ Current goal set to: ${chalk.cyan(goalName)}\n`));
  } catch (err) {
    console.error(chalk.red(`\n✗ Error setting current goal: ${err.message}\n`));
    process.exit(1);
  }
}

module.exports = use;
