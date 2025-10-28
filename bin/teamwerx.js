#!/usr/bin/env node

/**
 * teamWERX CLI Entry Point
 *
 * A development framework for individual developers working with multiple AI agents.
 */

const { program } = require("commander");
const chalk = require("chalk");
const packageJson = require("../package.json");

// When running tests or CI set TEAMWERX_CI=1 to make CLI prompts non-interactive.
// Install the prompts shim early so any subsequent prompts will be auto-answered.
try {
  // Require the prompts wrapper and install the CI shim if available.
  // The wrapper is conservative and is a no-op when TEAMWERX_CI is not set.
  // Use a try/catch to avoid blowing up if the module isn't present.
  // eslint-disable-next-line global-require
  const prompts = require("../lib/utils/prompts");
  if (prompts && typeof prompts.install === "function") {
    prompts.install();
  }
} catch (err) {
  // Silently ignore failures; production CLI should remain interactive.
  // eslint-disable-next-line no-console
  console.debug(
    "Prompt shim installation failed:",
    err && err.message ? err.message : err
  );
}

const collectValues = (value, previous) => {
  if (Array.isArray(previous)) {
    return previous.concat([value]);
  }
  return [value];
};

// Import commands (only those we use)
const initCommand = require("../lib/commands/init");
const goalCommand = require("../lib/commands/goal");
const statusCommand = require("../lib/commands/status");
const useCommand = require("../lib/commands/use");
const researchCommand = require("../lib/commands/research");
const discussCommand = require("../lib/commands/discuss");
const planCommand = require("../lib/commands/plan");
const executeCommand = require("../lib/commands/execute");
const completeCommand = require("../lib/commands/complete");
const archiveCommand = require("../lib/commands/archive");
const charterCommand = require("../lib/commands/charter");
const reflectCommand = require("../lib/commands/reflect");
const summarizeCommand = require("../lib/commands/summarize");

// Changes (proposals) command module (full-featured apply/archive workflow)
const changesCommand = require("../lib/commands/changes");

// Specs command module
const specsCommand = require("../lib/commands/specs");

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
  .command("use [goal-name]")
  .description(
    "Set the current working goal context (show current when omitted)"
  )
  .action(async (goalName) => {
    if (!goalName) {
      // Show current goal
      try {
        const { getCurrentGoal } = require("../lib/utils/file");
        const current = await getCurrentGoal();
        if (current) {
          console.log(chalk.green(`Current goal: ${current}`));
        } else {
          console.log(
            chalk.yellow(
              "No current goal set. Use: " +
                chalk.cyan("teamwerx use <goal-name>")
            )
          );
        }
      } catch (err) {
        console.error(chalk.red("Error reading current goal:"), err.message);
        process.exit(1);
      }
    } else {
      await useCommand(goalName);
    }
  });

// Convenience alias: `teamwerx list` -> `teamwerx status --list`
program
  .command("list")
  .description("List all goals (alias for status --list)")
  .option("--status <status>", "Filter by status (e.g., open, in-progress)")
  .action(async (options = {}) => {
    await statusCommand(null, { list: true, status: options.status });
  });

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
  .option("--dry-run", "Preview planned changes without applying them")
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

// Reflect: delegate to reflectCommand (keeps semantic reflection entries)
program
  .command("reflect [notes]")
  .description("Add reflection entry to capture learning and adaptations")
  .option("--goal <goal>", "Specify the goal slug")
  .option("--inspire", "Auto-generate suggestions based on plan state")
  .option("--dry-run", "Record a dry-run simulation assessment")
  .action(async (notes, options = {}) => {
    // reflectCommand supports being called with a string or an options object
    try {
      if (
        notes &&
        typeof notes === "string" &&
        Object.keys(options).length === 0
      ) {
        await reflectCommand(notes);
      } else {
        // merge notes into options if provided
        const opts = Object.assign({}, options);
        if (notes && typeof notes === "string") opts.notes = notes;
        await reflectCommand(opts);
      }
    } catch (err) {
      console.error(chalk.red("Error adding reflection:"), err.message);
      process.exit(1);
    }
  });

program
  .command("summarize")
  .description("Generate or update knowledge summary for the goal")
  .option("--goal <goal>", "Specify the goal slug")
  .action(summarizeCommand);

// Convenience: show the current goal without changing it
program
  .command("current")
  .description("Show the current goal (reads .teamwerx/.current-goal)")
  .action(async () => {
    try {
      const { getCurrentGoal } = require("../lib/utils/file");
      const current = await getCurrentGoal();
      if (current) {
        console.log(chalk.green(`Current goal: ${current}`));
      } else {
        console.log(
          chalk.yellow(
            "No current goal set. Use: " +
              chalk.cyan("teamwerx use <goal-name>")
          )
        );
      }
    } catch (err) {
      console.error(chalk.red("Error reading current goal:"), err.message);
      process.exit(1);
    }
  });

// Changes / proposals CLI (full-featured)
// Propose: scaffold a change under .teamwerx/changes/
// Changes (proposals) command module (full-featured apply/archive workflow)
// Keep the top-level convenience `propose` (backwards compatible with existing tests/scripts)
program
  .command("propose <title>")
  .description("Create a change proposal scaffold")
  .option("--goal <goal>", "Specify the goal slug")
  .option("--author <author>", "Author name/email")
  .option("--specs <domains>", "Comma-separated list of spec domains to track")
  .action((title, opts) => changesCommand.propose(title, opts));

// Register 'changes' as a command group so subcommands parse their own options correctly
const changesGroup = program
  .command("changes")
  .description(
    "Change management commands (list, show, validate, apply, archive, sync)"
  );

changesGroup
  .command("list")
  .description("List change proposals")
  .action((opts) => changesCommand.list(null, opts));

changesGroup
  .command("show <change-id>")
  .description("Show change details")
  .action((id, opts) => changesCommand.show(id, opts));

changesGroup
  .command("validate <change-id>")
  .description("Validate change structure and spec deltas")
  .action((id, opts) => changesCommand.validate(id, opts));

changesGroup
  .command("apply <change-id>")
  .description("Apply a change (import tasks into plan)")
  .option("--goal <goal>", "Target goal slug")
  .option("--dry-run", "Preview tasks without applying")
  .option("--yes", "Skip confirmation prompts")
  .action((id, opts) => changesCommand.apply(id, opts));

changesGroup
  .command("archive <change-id>")
  .description("Archive change into .teamwerx/archive/changes/")
  .option("--goal <goal>", "Goal to notify (optional)")
  .option("--notify", "Notify the goal discussion log")
  .option("--merge-specs", "Merge spec deltas into project specs")
  .option("--force", "Force merge even if specs have diverged")
  .option("--dry-run", "Preview merge without applying")
  .option("--yes", "Skip confirmation prompts")
  .action((id, opts) => changesCommand.archive(id, opts));

changesGroup
  .command("sync <change-id>")
  .description("Check spec fingerprints for divergence")
  .option("--update", "Update fingerprints to current values")
  .action((id, opts) => changesCommand.sync(id, opts));

changesGroup
  .command("resolve <change-id>")
  .description("Resolve conflicts in a spec delta")
  .action((id, opts) => changesCommand.resolve(id, opts));

// Register 'specs' as a command group for specification management
const specsGroup = program
  .command("specs")
  .description("Specification management commands (init, create, list, show)");

specsGroup
  .command("init")
  .description("Initialize .teamwerx/specs directory")
  .action(() => specsCommand.initSpecs());

specsGroup
  .command("create <domain>")
  .description("Create a new spec domain")
  .option("--title <title>", "Custom title for the spec")
  .action((domain, opts) => specsCommand.createSpec(domain, opts));

specsGroup
  .command("list")
  .description("List all spec domains")
  .option("--verbose", "Show detailed information")
  .action((opts) => specsCommand.listSpecs(opts));

specsGroup
  .command("show <domain>")
  .description("Show details of a specific spec")
  .action((domain) => specsCommand.showSpec(domain));

// Error handling
program.exitOverride();

try {
  program.parse(process.argv);
} catch (err) {
  if (err.code === "commander.help") {
    // Help was requested, write to stdout and exit cleanly
    process.stdout.write(program.helpInformation());
    process.exit(0);
  } else if (err.code === "commander.version") {
    // Version was requested, exit cleanly
    process.exit(0);
  } else {
    // Write errors to stderr as before
    console.error(chalk.red("Error:"), err.message);
    process.exit(1);
  }
}
