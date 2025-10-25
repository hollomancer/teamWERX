const chalk = require('chalk');
const { getCurrentGoal } = require('../utils/file');
const { GoalWorkspaceManager } = require('../core/goal-workspace-manager');
const { PlanManager } = require('../core/plan-manager');
const { DiscussionManager } = require('../core/discussion-manager');

async function inspire(options = {}) {
  const goal = options.goal || await getCurrentGoal();

  if (!goal) {
    console.error(chalk.red('\n✗ Error: No goal specified and no current goal set.'));
    console.log(chalk.gray('Set a current goal with: ') + chalk.cyan('teamwerx use <goal-name>\n'));
    process.exit(1);
  }

  const workspace = await GoalWorkspaceManager.getWorkspaceForGoal(goal);
  const plan = new PlanManager(workspace);
  await plan.load();
  const discussion = new DiscussionManager(workspace);
  await discussion.load();

  const pending = plan.getPendingTasks(10);
  const suggestions = [];

  if (pending.length) {
    suggestions.push(
      `Pending tasks (${pending.map((t) => t.id).join(', ')}) may require prioritization or dependency checks.`
    );
  }

  if (!pending.length) {
    suggestions.push('All tasks are completed. Consider archiving this goal or defining follow-up work.');
  }

  if (!discussion.entries.length) {
    suggestions.push('No discussions recorded yet—capture architectural considerations before proceeding.');
  } else {
    const lastEntry = discussion.entries[discussion.entries.length - 1];
    suggestions.push(
      `Last discussion (${lastEntry.id}) occurred on ${new Date(lastEntry.timestamp).toLocaleDateString()}; consider adding updates if the plan changed.`
    );
  }

  const entry = discussion.addEntry({
    type: 'inspiration',
    content: suggestions.map((line) => `- ${line}`).join('\n'),
  });
  await discussion.save();

  console.log(chalk.green(`\n✓ Inspiration entry ${entry.id} added to discussion log.\n`));
}

module.exports = inspire;
