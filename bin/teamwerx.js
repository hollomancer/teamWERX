#!/usr/bin/env node

/**
 * teamWERX CLI Entry Point
 *
 * A development framework for individual developers working with multiple AI agents.
 */

const { program } = require("commander");
const chalk = require("chalk");
const packageJson = require("../package.json");

const collectValues = (value, previous) => {
  if (Array.isArray(previous)) {
    return previous.concat([value]);
  }
  return [value];
};

// Import commands
const initCommand = require("../lib/commands/init");
const goalCommand = require("../lib/commands/goal");
const statusCommand = require("../lib/commands/status");
const useCommand = require("../lib/commands/use");
const researchCommand = require("../lib/commands/research");
const discussCommand = require("../lib/commands/discuss");
const planCommand = require("../lib/commands/plan");
const executeCommand = require("../lib/commands/execute");
const archiveCommand = require("../lib/commands/archive");
const charterCommand = require("../lib/commands/charter");
const reflectCommand = require("../lib/commands/reflect");
const summarizeCommand = require("../lib/commands/summarize");
const completeCommand = require("../lib/commands/complete");

// Configure CLI
program
  .name("teamwerx")
  .description(packageJson.description)
  .version(packageJson.version);

// Register commands
program
  .command("init")
  .description("Initialize teamWERX in the current project")
  .action(initCommand);

program
  .command("goal [description]")
  .description("Create a new goal")
  .action(goalCommand);

program
  .command("status [goal-name]")
  .description("Show detailed status of a specific goal or all goals")
  .option("--list", "Show table view of all goals")
  .option("--status <status>", "Filter by status (use with --list)")
  .option("--context", "Show project context with tech stack and directories")
  .option("--summary", "Show summary with discussion/implementation records")
  .option("--json", "Output in JSON format")
  .action(statusCommand);

program
  .command("use <goal-name>")
  .description("Set the current working goal context")
  .action(useCommand);

program
  .command("research [goal-name]")
  .description("Analyze the codebase and generate a research report")
  .option("--goal <goal>", "Specify the goal slug")
  .action(researchCommand);

program
  .command("discuss <message>")
  .description("Continue structured discussion about implementation strategy")
  .option("--goal <goal>", "Specify the goal slug")
  .option("--proposal", "Mark this as a proposal for changes")
  .action(discussCommand);

program
  .command("plan [considerations]")
  .description("Generate or update a task plan for a goal")
  .option("--goal <goal>", "Specify the goal slug")
  .option("--task <task>", "Add a task (repeatable)", collectValues, [])
  .option("--interactive", "Interactively add tasks via prompts")
  .action((considerations, cmdOptions) =>
    planCommand(considerations, cmdOptions)
  );

program
  .command("execute [goal-name]")
  .description("Execute the tasks in the plan")
  .action(executeCommand);

program
  .command("complete [issue-or-title]")
  .description("Complete tasks and record implementations")
  .option("--goal <goal>", "Specify the goal slug")
  .option(
    "--source <source>",
    "Source: fix|manual|batch (default: batch)",
    "batch"
  )
  .option("--notes <text>", "Notes for batch completion")
  .option("--limit <number>", "Number of tasks to complete (batch mode)", 5)
  .action(completeCommand);

program
  .command("archive [goal-name]")
  .description(
    "Archive a completed goal and move its artifacts into .teamwerx/archive/"
  )
  .option("--yes", "Skip confirmation prompts")
  .action(archiveCommand);

program
  .command("charter")
  .description("Generate or update the project charter")
  .action(charterCommand);

program
  .command("reflect")
  .description("Add reflection entry to capture learning and adaptations")
  .option("--goal <goal>", "Specify the goal slug")
  .option("--notes <text>", "Reflection notes")
  .option("--inspire", "Auto-generate suggestions based on plan state")
  .option("--dry-run", "Record a dry-run simulation assessment")
  .action(reflectCommand);

program
  .command("summarize")
  .description("Generate or update knowledge summary for the goal")
  .option("--goal <goal>", "Specify the goal slug")
  .action(summarizeCommand);

// Error handling
program.exitOverride();

try {
  program.parse(process.argv);

  // Show help if no command provided
  if (!process.argv.slice(2).length) {
    program.outputHelp();
  }
} catch (err) {
  if (err.code === "commander.help") {
    // Help was requested, exit cleanly
    process.exit(0);
  } else if (err.code === "commander.version") {
    // Version was requested, exit cleanly
    process.exit(0);
  } else {
    console.error(chalk.red("Error:"), err.message);
    process.exit(1);
  }
}
