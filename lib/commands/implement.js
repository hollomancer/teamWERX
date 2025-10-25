const chalk = require('chalk');
const { getCurrentGoal } = require('../utils/file');
const { GoalWorkspaceManager } = require('../core/goal-workspace-manager');
const { PlanManager } = require('../core/plan-manager');
const { ImplementationManager } = require('../core/implementation-manager');

async function implement(options = {}) {
  const goal = options.goal || await getCurrentGoal();

  if (!goal) {
    console.error(chalk.red('\n✗ Error: No goal specified and no current goal set.'));
    console.log(chalk.gray('Set a current goal with: ') + chalk.cyan('teamwerx use <goal-name>\n'));
    process.exit(1);
  }

  const workspace = await GoalWorkspaceManager.getWorkspaceForGoal(goal);
  const plan = new PlanManager(workspace);
  await plan.load();
  const impl = new ImplementationManager(workspace);

  const pendingTasks = plan.getPendingTasks(5);
  if (!pendingTasks.length) {
    console.log(chalk.yellow('\n⚠ No pending tasks to implement.\n'));
    return;
  }

  const note = options.notes || 'Automatically marked as completed via teamwerx implement.';

  for (const task of pendingTasks) {
    plan.completeTask(task.id, note, 'implement');
    await impl.createRecord(task.id, {
      title: task.title,
      summary: note,
      details: `Task ${task.id} marked as completed automatically on ${new Date().toLocaleString()}. Please verify the code changes align with this record.`,
      sources: ['implement'],
    });
  }

  await plan.save();
  console.log(
    chalk.green(`\n✓ Implemented ${pendingTasks.length} task(s) for ${workspace.number}-${workspace.slug}.\n`)
  );
}

module.exports = implement;
