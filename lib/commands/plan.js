/**
 * Generate or update a task plan for a goal
 *
 * This command supports two modes:
 * - Interactive mode (--task flags or prompts): Manually add tasks
 * - AI-driven mode (no flags): AI agent generates plan from research/discussion
 *
 * Uses PlanManager for structured task management with auto-incrementing IDs.
 */

const chalk = require('chalk');
const inquirer = require('inquirer');
const { getCurrentGoal } = require('../utils/file');
const { GoalWorkspaceManager } = require('../core/goal-workspace-manager');
const { PlanManager } = require('../core/plan-manager');
const { handleValidationError } = require('../utils/errors');

/**
 * Prompt user to input tasks interactively
 * @returns {Promise<string[]>} Array of task descriptions
 */
async function promptForTasks() {
  const tasks = [];
  let index = 1;
  while (true) {
    const answer = await inquirer.prompt([
      {
        type: 'input',
        name: 'task',
        message: `Task ${index} description (leave blank to finish):`,
      },
    ]);
    if (!answer.task || !answer.task.trim()) {
      break;
    }
    tasks.push(answer.task.trim());
    index += 1;
  }
  return tasks;
}

/**
 * Generate or update a task plan for a goal
 * @param {string} considerations - Additional considerations for task planning
 * @param {Object} options - Command options
 * @param {string} options.goal - Specific goal name (uses current goal if not provided)
 * @param {string|string[]} options.task - Task description(s) to add manually
 * @param {boolean} options.interactive - Enable interactive task input mode
 * @returns {Promise<void>}
 */
async function plan(considerations, options = {}) {
  const goal = options.goal || (await getCurrentGoal());

  if (!goal) {
    handleValidationError(
      'No goal specified and no current goal set.',
      'Set a current goal with: teamwerx use <goal-name>'
    );
  }

  const workspace = await GoalWorkspaceManager.getWorkspaceForGoal(goal);
  const planManager = new PlanManager(workspace);
  await planManager.load();

  // Interactive mode: if --task flags are provided or user wants to add tasks interactively
  let tasks = [];
  if (options.task) {
    tasks = Array.isArray(options.task) ? options.task : [options.task];
  } else if (options.interactive) {
    tasks = await promptForTasks();
  }

  if (tasks.length > 0) {
    // Interactive mode: add tasks manually
    tasks.forEach((taskDesc) => {
      const notes = considerations
        ? `Considerations: ${considerations}`
        : undefined;
      planManager.addTask({ title: taskDesc, notes });
    });
    await planManager.save();

    console.log(
      chalk.green(
        `\n✓ Added ${tasks.length} task(s) to ${workspace.number}-${workspace.slug} plan.\n`
      )
    );
  } else {
    // AI-driven mode: show guidance for AI agent
    console.log(chalk.blue.bold('\n📝 Planning Mode (AI-Driven)\n'));
    console.log(chalk.white('Goal: ') + chalk.cyan(goal));
    console.log(
      chalk.white('Workspace: ') +
        chalk.cyan(`${workspace.number}-${workspace.slug}`)
    );
    console.log(
      chalk.yellow('\nThis command should be executed by an AI agent.')
    );
    console.log(chalk.gray('The AI agent should:'));
    console.log(
      chalk.gray('  1. Read the goal: ') +
        chalk.cyan(`.teamwerx/goals/${goal}.md`)
    );
    console.log(
      chalk.gray('  2. Review research: ') + chalk.cyan(workspace.researchPath)
    );
    console.log(
      chalk.gray('  3. Read discussion log: ') +
        chalk.cyan(workspace.discussPath)
    );
    console.log(
      chalk.gray(
        '  4. Generate tasks using PlanManager.addTask() with structured IDs (T01, T02, etc.)'
      )
    );
    console.log(
      chalk.gray('  5. Save the plan to: ') + chalk.cyan(workspace.planPath)
    );
    console.log(
      chalk.gray(
        '\nUse --task "<description>" or --interactive to add tasks manually.\n'
      )
    );
  }
}

module.exports = plan;
