/**
 * Continue structured discussion about implementation strategy
 *
 * This command is designed to be executed by an AI agent.
 * Uses DiscussionManager for structured, numbered discussion entries.
 */

const chalk = require('chalk');
const { getCurrentGoal } = require('../utils/file');
const { GoalWorkspaceManager } = require('../core/goal-workspace-manager');
const { DiscussionManager } = require('../core/discussion-manager');

async function discuss(message, options = {}) {
  if (!message || !message.trim()) {
    console.error(chalk.red('\n✗ Discussion content is required.\n'));
    process.exit(1);
  }

  const goal = options.goal || (await getCurrentGoal());

  if (!goal) {
    console.error(
      chalk.red('\n✗ Error: No goal specified and no current goal set.'),
    );
    console.log(
      chalk.gray('Set a current goal with: ') +
        chalk.cyan('teamwerx use <goal-name>\n'),
    );
    process.exit(1);
  }

  const workspace = await GoalWorkspaceManager.getWorkspaceForGoal(goal);
  const discussion = new DiscussionManager(workspace);
  await discussion.load();

  const entryType = options.proposal ? 'proposal' : 'discussion';
  const entry = discussion.addEntry({
    type: entryType,
    content: message.trim(),
  });

  await discussion.save();

  const entryLabel = options.proposal ? 'proposal' : 'discussion entry';
  console.log(
    chalk.green(
      `\n✓ Added ${entryLabel} ${entry.id} for ${workspace.title}.\n`,
    ),
  );
}

module.exports = discuss;
