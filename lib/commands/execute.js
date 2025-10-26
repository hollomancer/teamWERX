/**
 * Execute the next pending task in the plan
 *
 * Displays the next task that needs work and marks it as in-progress.
 * Designed to be run by AI agents or developers to coordinate work.
 */

const chalk = require("chalk");
const { getCurrentGoal } = require("../utils/file");
const { GoalWorkspaceManager } = require("../core/goal-workspace-manager");
const { PlanManager } = require("../core/plan-manager");

async function execute(goalName) {
  const goal = goalName || (await getCurrentGoal());

  if (!goal) {
    console.error(
      chalk.red("\n✗ Error: No goal specified and no current goal set.")
    );
    console.log(
      chalk.gray("Set a current goal with: ") +
        chalk.cyan("teamwerx use <goal-name>\n")
    );
    process.exit(1);
  }

  const workspace = await GoalWorkspaceManager.getWorkspaceForGoal(goal);
  const plan = new PlanManager(workspace);
  await plan.load();

  // Find next pending task
  const pendingTasks = plan.getPendingTasks();

  if (pendingTasks.length === 0) {
    console.log(chalk.green("\n✓ All tasks completed!\n"));
    console.log(
      chalk.gray("Consider archiving this goal: ") +
        chalk.cyan(`teamwerx archive ${goal}\n`)
    );
    return;
  }

  const nextTask = pendingTasks[0];

  // Mark as in-progress
  const taskIndex = plan.tasks.findIndex((t) => t.id === nextTask.id);
  if (taskIndex >= 0) {
    plan.tasks[taskIndex].status = "in-progress";
    plan.tasks[taskIndex].updated = new Date().toISOString();
    await plan.save();
  }

  console.log(chalk.blue.bold("\n⚡ Next Task\n"));
  console.log(chalk.white("Goal: ") + chalk.cyan(workspace.title));
  console.log(
    chalk.white("Task: ") + chalk.cyan(`${nextTask.id} - ${nextTask.title}`)
  );

  if (nextTask.notes) {
    console.log(chalk.white("\nNotes: ") + chalk.gray(nextTask.notes));
  }

  console.log(chalk.white("\nStatus: ") + chalk.yellow("in-progress"));
  console.log(
    chalk.white("Remaining: ") +
      chalk.gray(`${pendingTasks.length - 1} pending tasks\n`)
  );

  console.log(
    chalk.gray("When complete, run: ") +
      chalk.cyan("teamwerx complete --source batch\n")
  );
}

module.exports = execute;
