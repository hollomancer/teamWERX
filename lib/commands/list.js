/**
 * List all goals in the project
 */

const chalk = require('chalk');
const Table = require('cli-table3');
const { listGoals } = require('../utils/file');
const { deriveGoalStatus, getStatusColor } = require('../utils/goal-status');

async function list(options) {
  try {
    const goals = await listGoals();
    
    if (goals.length === 0) {
      console.log(chalk.yellow('\nNo goals found.'));
      console.log(chalk.gray('Create your first goal with: ') + chalk.cyan('teamwerx goal "Your goal"\n'));
      return;
    }
    
    // Derive status for each goal
    const goalsWithStatus = await Promise.all(
      goals.map(async (goal) => ({
        ...goal,
        status: await deriveGoalStatus(goal.filename)
      }))
    );
    
    // Filter by status if provided
    let filteredGoals = goalsWithStatus;
    if (options.status) {
      filteredGoals = goalsWithStatus.filter(g => g.status === options.status);
      
      if (filteredGoals.length === 0) {
        console.log(chalk.yellow(`\nNo goals found with status: ${options.status}\n`));
        return;
      }
    }
    
    // Sort by created date (newest first)
    filteredGoals.sort((a, b) => new Date(b.created) - new Date(a.created));
    
    // Create table
    const table = new Table({
      head: [
        chalk.white.bold('Title'),
        chalk.white.bold('Status'),
        chalk.white.bold('Created')
      ],
      colWidths: [40, 15, 15]
    });
    
    // Add rows
    for (const goal of filteredGoals) {
      const statusColor = getStatusColor(goal.status);
      table.push([
        goal.title,
        chalk[statusColor](goal.status),
        goal.created
      ]);
    }
    
    console.log('\n' + table.toString() + '\n');
    console.log(chalk.gray(`Total: ${filteredGoals.length} goal(s)\n`));
  } catch (err) {
    console.error(chalk.red(`\n✗ Error listing goals: ${err.message}\n`));
    process.exit(1);
  }
}


module.exports = list;
