#!/usr/bin/env node

/**
 * teamWERX CLI Entry Point
 * 
 * A development framework for individual developers working with multiple AI agents.
 */

const { program } = require('commander');
const chalk = require('chalk');
const packageJson = require('../package.json');

// Import commands
const initCommand = require('../lib/commands/init');
const goalCommand = require('../lib/commands/goal');
const listCommand = require('../lib/commands/list');
const statusCommand = require('../lib/commands/status');
const useCommand = require('../lib/commands/use');
const researchCommand = require('../lib/commands/research');
const discussCommand = require('../lib/commands/discuss');
const dryRunCommand = require('../lib/commands/dry-run');
const planCommand = require('../lib/commands/plan');
const executeCommand = require('../lib/commands/execute');
const proposeCommand = require('../lib/commands/propose');

// Configure CLI
program
  .name('teamwerx')
  .description(packageJson.description)
  .version(packageJson.version);

// Register commands
program
  .command('init')
  .description('Initialize teamWERX in the current project')
  .action(initCommand);

program
  .command('goal [description]')
  .description('Create a new goal')
  .action(goalCommand);

program
  .command('list')
  .description('List all goals in the project')
  .option('--status <status>', 'Filter by status')
  .action(listCommand);

program
  .command('status [goal-name]')
  .description('Show detailed status of a specific goal or all goals')
  .action(statusCommand);

program
  .command('use <goal-name>')
  .description('Set the current working goal context')
  .action(useCommand);

program
  .command('research [goal-name]')
  .description('Analyze the codebase and generate a research report')
  .action(researchCommand);

program
  .command('discuss <message>')
  .description('Continue structured discussion about implementation strategy')
  .action(discussCommand);

program
  .command('dry-run')
  .description('Simulate the implementation plan to identify potential issues')
  .action(dryRunCommand);

program
  .command('plan [goal-name]')
  .description('Generate a task list based on research and discussion')
  .action(planCommand);

program
  .command('execute [goal-name]')
  .description('Execute the tasks in the plan')
  .action(executeCommand);

program
  .command('propose <description>')
  .description('Propose a change to a goal or plan')
  .action(proposeCommand);

// Error handling
program.exitOverride();

try {
  program.parse(process.argv);
  
  // Show help if no command provided
  if (!process.argv.slice(2).length) {
    program.outputHelp();
  }
} catch (err) {
  if (err.code === 'commander.help') {
    // Help was requested, exit cleanly
    process.exit(0);
  } else if (err.code === 'commander.version') {
    // Version was requested, exit cleanly
    process.exit(0);
  } else {
    console.error(chalk.red('Error:'), err.message);
    process.exit(1);
  }
}
