const chalk = require('chalk');
const { getCurrentGoal } = require('../../utils/file');
const { GoalWorkspaceManager } = require('../../core/goal-workspace-manager');
const { PlanManager } = require('../../core/plan-manager');
const { DiscussionManager } = require('../../core/discussion-manager');
const { ImplementationManager } = require('../../core/implementation-manager');

async function resolveGoalSlug(goalOption) {
  if (goalOption) {
    return goalOption;
  }
  const goal = await getCurrentGoal();
  if (!goal) {
    console.error(
      chalk.red('\n✗ Error: No goal specified and no current goal set.')
    );
    console.log(
      chalk.gray('Set a current goal with: ') + chalk.cyan('teamwerx use <goal>')
    );
    process.exit(1);
  }
  return goal;
}

async function getGoalWorkspace(goalOption) {
  const slug = await resolveGoalSlug(goalOption);
  const workspace = await GoalWorkspaceManager.getWorkspaceForGoal(slug);
  return workspace;
}

async function getPlan(workspace) {
  const manager = new PlanManager(workspace);
  await manager.load();
  return manager;
}

async function getDiscussion(workspace) {
  const manager = new DiscussionManager(workspace);
  await manager.load();
  return manager;
}

function getImplementation(workspace) {
  return new ImplementationManager(workspace);
}

module.exports = {
  resolveGoalSlug,
  getGoalWorkspace,
  getPlan,
  getDiscussion,
  getImplementation,
};
