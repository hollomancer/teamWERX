#!/usr/bin/env node

/**
 * teamWERX CLI Entry Point
 * 
 * A development framework for individual developers working with multiple AI agents.
 */

const { program } = require('commander');
const chalk = require('chalk');
const packageJson = require('../package.json');

const collectValues = (value, previous) => {
  if (Array.isArray(previous)) {
    return previous.concat([value]);
  }
  return [value];
};

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
const archiveCommand = require('../lib/commands/archive');
const collectCommand = require('../lib/commands/collect');
const charterCommand = require('../lib/commands/charter');
const correctCommand = require('../lib/commands/correct');
const implementCommand = require('../lib/commands/implement');
const inspireCommand = require('../lib/commands/inspire');

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
  .option('--context', 'Show project context with tech stack and directories')
  .option('--summary', 'Show summary with discussion/implementation records')
  .action(statusCommand);

program
  .command('use <goal-name>')
  .description('Set the current working goal context')
  .action(useCommand);

program
  .command('research [goal-name]')
  .description('Analyze the codebase and generate a research report')
  .option('--goal <goal>', 'Specify the goal slug')
  .action(researchCommand);

program
  .command('discuss <message>')
  .description('Continue structured discussion about implementation strategy')
  .option('--goal <goal>', 'Specify the goal slug')
  .action(discussCommand);

program
  .command('dry-run')
  .description('Simulate the implementation plan to identify potential issues')
  .option('--goal <goal>', 'Specify the goal slug')
  .option('--notes <text>', 'Dry-run notes')
  .action(dryRunCommand);

program
  .command('plan [considerations]')
  .description('Generate or update a task plan for a goal')
  .option('--goal <goal>', 'Specify the goal slug')
  .option('--task <task>', 'Add a task (repeatable)', collectValues, [])
  .option('--interactive', 'Interactively add tasks via prompts')
  .action((considerations, cmdOptions) => planCommand(considerations, cmdOptions));

program
  .command('execute [goal-name]')
  .description('Execute the tasks in the plan')
  .action(executeCommand);

program
  .command('propose <description>')
  .description('Propose a change to a goal or plan')
  .action(proposeCommand);

program
  .command('archive [goal-name]')
  .description('Archive a completed goal and move its artifacts into .teamwerx/archive/')
  .option('--yes', 'Skip confirmation prompts')
  .action(archiveCommand);

program
  .command('collect')
  .description('Collect staged manual changes into plan and implementation logs')
  .option('--goal <goal>', 'Specify the goal slug')
  .option('--title <title>', 'Override the generated task title')
  .action(collectCommand);

program
  .command('charter')
  .description('Generate or update the project charter')
  .action(charterCommand);

program
  .command('correct <issue>')
  .description('Record an issue correction (discussion + plan + implementation)')
  .option('--goal <goal>', 'Specify the goal slug')
  .action(correctCommand);

program
  .command('implement')
  .description('Complete up to five pending tasks and create implementation logs')
  .option('--goal <goal>', 'Specify the goal slug')
  .option('--notes <text>', 'Notes to include on each completed task')
  .action(implementCommand);

program
  .command('inspire')
  .description('Add inspiration / contention points to the discussion log')
  .option('--goal <goal>', 'Specify the goal slug')
  .action(inspireCommand);

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
