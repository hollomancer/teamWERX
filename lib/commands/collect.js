const { promisify } = require('util');
const { exec } = require('child_process');
const path = require('path');
const chalk = require('chalk');
const { getCurrentGoal } = require('../utils/file');
const { GoalWorkspaceManager } = require('../core/goal-workspace-manager');
const { PlanManager } = require('../core/plan-manager');
const { ImplementationManager } = require('../core/implementation-manager');

const execAsync = promisify(exec);

async function getGitOutput(command) {
  try {
    const { stdout } = await execAsync(command);
    return stdout.trim();
  } catch (err) {
    throw new Error(`Git command failed: ${command}\n${err.message}`);
  }
}

async function collect(options = {}) {
  const goal = options.goal || await getCurrentGoal();

  if (!goal) {
    console.error(chalk.red('\n✗ Error: No goal specified and no current goal set.'));
    console.log(chalk.gray('Set a current goal with: ') + chalk.cyan('teamwerx use <goal-name>\n'));
    process.exit(1);
  }

  const workspace = await GoalWorkspaceManager.getWorkspaceForGoal(goal);

  const changedFiles = await getGitOutput('git diff --cached --name-only');
  if (!changedFiles) {
    console.error(
      chalk.red('\n✗ No staged changes found. Stage files before running collect.\n')
    );
    process.exit(1);
  }

  const diffStat = await getGitOutput('git diff --cached --stat');
  const diffFull = await getGitOutput('git diff --cached');

  const plan = new PlanManager(workspace);
  await plan.load();
  const title = options.title || `Collected manual changes (${new Date().toLocaleDateString()})`;
  const task = plan.addTask({
    title,
    status: 'completed',
    notes: 'Collected via teamwerx collect',
    source: 'collect',
  });
  await plan.save();

  const impl = new ImplementationManager(workspace);
  await impl.createRecord(task.id, {
    title,
    summary: diffStat || changedFiles,
    details: diffFull,
    sources: ['git diff --cached'],
  });

  console.log(chalk.green('\n✓ Manual changes recorded in plan and implementation log.\n'));
  console.log(
    chalk.gray('  • Task added: ') +
      chalk.cyan(
        `${task.id} (${path.relative(process.cwd(), workspace.planPath)})`
      )
  );
  console.log(
    chalk.gray('  • Implementation record: ') +
      chalk.cyan(
        path.relative(
          process.cwd(),
          path.join(workspace.implementationDir, `${task.id}.md`)
        )
      )
  );
}

module.exports = collect;
