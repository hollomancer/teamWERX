const chalk = require('chalk');
const inquirer = require('inquirer');
const { getCurrentGoal } = require('../utils/file');
const { GoalWorkspaceManager } = require('../core/goal-workspace-manager');
const { PlanManager } = require('../core/plan-manager');
const { DiscussionManager } = require('../core/discussion-manager');
const { ImplementationManager } = require('../core/implementation-manager');

async function correct(issueDescription, options = {}) {
  if (!issueDescription || !issueDescription.trim()) {
    console.error(chalk.red('\n✗ Issue description is required.\n'));
    process.exit(1);
  }

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
  const impl = new ImplementationManager(workspace);

  const { resolution } = await inquirer.prompt([
    {
      type: 'input',
      name: 'resolution',
      message: 'Describe the fix applied:',
    },
  ]);

  discussion.addEntry({
    type: 'issue-correction',
    content: `Issue: ${issueDescription}\nResolution: ${resolution || 'Not provided.'}`,
  });
  await discussion.save();

  const task = plan.addTask({
    title: `Fix: ${issueDescription}`,
    status: 'completed',
    notes: resolution,
    source: 'correct',
  });
  await plan.save();

  await impl.createRecord(task.id, {
    title: `Fix - ${issueDescription}`,
    summary: resolution || 'Issue addressed via teamwerx correct.',
    details: `Issue Description:\n${issueDescription}\n\nResolution:\n${resolution || 'Not specified.'}`,
    sources: ['correct'],
  });

  console.log(
    chalk.green(`\n✓ Issue recorded. Discussion, plan, and implementation logs updated (task ${task.id}).\n`)
  );
}

module.exports = correct;
